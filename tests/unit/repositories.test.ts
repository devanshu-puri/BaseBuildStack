import { describe, it, expect, beforeEach } from "vitest";
import {
  clearMemoryStoresForTest,
  UserScopedRepository,
} from "@/lib/db/repository";
import {
  getProgressRepository,
  getAttemptRepository,
  getBookmarkRepository,
  getXpRepository,
  getStreakRepository,
  getMilestoneRepository,
  getSubscriptionRepository,
} from "@/lib/db/repositories";
import { BookmarkSchema } from "@/lib/db/schemas";

import { getDb } from "@/lib/db/client";

describe("User-scoped Repositories & Data Isolation", () => {
  beforeEach(async () => {
    clearMemoryStoresForTest();
    try {
      const db = await getDb();
      await db.collection("bookmarks").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("xp_events").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("streaks").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("progress").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("milestones").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("subscriptions").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("attempts").deleteMany({ userId: { $regex: /^user_/ } });
      await db.collection("mistakes").deleteMany({ userId: { $regex: /^user_/ } });
    } catch {
      // offline fallback
    }
  });

  it("throws error if constructed without a valid userId", () => {
    expect(() => new UserScopedRepository("test", "", BookmarkSchema)).toThrow(
      "requires a valid non-empty userId"
    );
    expect(() => new UserScopedRepository("test", "   ", BookmarkSchema)).toThrow(
      "requires a valid non-empty userId"
    );
  });

  it("strictly isolates data between User A and User B", async () => {
    const userABookmarks = getBookmarkRepository("user_a");
    const userBBookmarks = getBookmarkRepository("user_b");

    // User A adds a bookmark
    await userABookmarks.toggleBookmark("m1", "blitz_1", "Two Sum Blitz");

    // User A can see it
    expect(await userABookmarks.isBookmarked("m1", "blitz_1")).toBe(true);
    const aList = await userABookmarks.getBookmarks();
    expect(aList).toHaveLength(1);
    expect(aList[0].itemId).toBe("blitz_1");

    // User B CANNOT see it
    expect(await userBBookmarks.isBookmarked("m1", "blitz_1")).toBe(false);
    const bList = await userBBookmarks.getBookmarks();
    expect(bList).toHaveLength(0);

    // User B adds their own bookmark
    await userBBookmarks.toggleBookmark("m2", "quiz_react", "React Hooks Quiz");
    expect(await userBBookmarks.isBookmarked("m2", "quiz_react")).toBe(true);
    expect(await userABookmarks.isBookmarked("m2", "quiz_react")).toBe(false);
  });

  it("forces userId injection on creation even if spoofed in payload", async () => {
    const userARepo = getBookmarkRepository("user_a");

    // Attempt to spoof userId as user_b in creation
    const created = await userARepo.create({
      userId: "user_b", // Malicious attempt to insert as another user
      module: "m3",
      itemId: "rag_lesson",
      ts: new Date(),
    });

    // Repository must force user_a
    expect(created.userId).toBe("user_a");

    // User B repo should see nothing
    const userBRepo = getBookmarkRepository("user_b");
    const bFound = await userBRepo.findOne({ itemId: "rag_lesson" });
    expect(bFound).toBeNull();

    // User A repo sees it
    const aFound = await userARepo.findOne({ itemId: "rag_lesson" });
    expect(aFound).not.toBeNull();
    expect(aFound?.userId).toBe("user_a");
  });

  it("overrides spoofed userId in query filters", async () => {
    const userARepo = getBookmarkRepository("user_a");
    await userARepo.toggleBookmark("m1", "blitz_2", "Graph BFS");

    // Query with filter trying to spoof userId
    const found = await userARepo.findOne({ userId: "user_b", itemId: "blitz_2" });
    // Scoped filter enforces userId: "user_a", so it finds User A's record
    expect(found).not.toBeNull();
    expect(found?.userId).toBe("user_a");
  });

  it("guarantees idempotent XP ledger (no double XP for same refId)", async () => {
    const xpRepo = getXpRepository("user_xp_test");

    // 1st award
    const res1 = await xpRepo.awardXp("lesson_complete", 50, "lesson_rag_1");
    expect(res1.added).toBe(true);
    expect(res1.totalXp).toBe(50);

    // 2nd award with SAME type and refId (e.g. user replays or refreshes)
    const res2 = await xpRepo.awardXp("lesson_complete", 50, "lesson_rag_1");
    expect(res2.added).toBe(false);
    expect(res2.totalXp).toBe(50); // Total remains 50!

    // Different refId awards successfully
    const res3 = await xpRepo.awardXp("lesson_complete", 75, "lesson_rag_2");
    expect(res3.added).toBe(true);
    expect(res3.totalXp).toBe(125);
  });

  it("calculates deterministic daily streaks", async () => {
    const streakRepo = getStreakRepository("user_streak_test");

    const day1 = new Date("2026-10-10T10:00:00Z");
    const s1 = await streakRepo.recordActivity(day1);
    expect(s1.current).toBe(1);
    expect(s1.longest).toBe(1);

    // Same day activity: streak does not increment
    const day1Later = new Date("2026-10-10T18:00:00Z");
    const s1b = await streakRepo.recordActivity(day1Later);
    expect(s1b.current).toBe(1);

    // Consecutive next day: streak increments to 2
    const day2 = new Date("2026-10-11T12:00:00Z");
    const s2 = await streakRepo.recordActivity(day2);
    expect(s2.current).toBe(2);
    expect(s2.longest).toBe(2);

    // Missed day (jumped to 2026-10-14): streak resets to 1, longest preserved
    const day4 = new Date("2026-10-14T09:00:00Z");
    const s4 = await streakRepo.recordActivity(day4);
    expect(s4.current).toBe(1);
    expect(s4.longest).toBe(2);
  });

  it("tracks progress states and counts completed items", async () => {
    const progressRepo = getProgressRepository("user_progress_test");

    await progressRepo.setProgress("m1", "prob_1", "in_progress", 1);
    const p1 = await progressRepo.getProgress("m1", "prob_1");
    expect(p1?.status).toBe("in_progress");

    await progressRepo.setProgress("m1", "prob_1", "completed", 2);
    const p1Done = await progressRepo.getProgress("m1", "prob_1");
    expect(p1Done?.status).toBe("completed");
    expect(p1Done?.stage).toBe(2);

    await progressRepo.setProgress("m1", "prob_2", "completed", 1);
    await progressRepo.setProgress("m2", "quiz_1", "completed", 1);

    expect(await progressRepo.countCompleted("m1")).toBe(2);
    expect(await progressRepo.countCompleted("m2")).toBe(1);
    expect(await progressRepo.countCompleted()).toBe(3);
  });

  it("unlocks milestones when progress meets or exceeds total", async () => {
    const milestoneRepo = getMilestoneRepository("user_milestone_test");

    const mPart = await milestoneRepo.updateMilestone("first_10_solved", 4, 10);
    expect(mPart.unlockedAt).toBeNull();
    expect(mPart.progress).toBe(4);

    const mFull = await milestoneRepo.updateMilestone("first_10_solved", 10, 10);
    expect(mFull.unlockedAt).not.toBeNull();
    expect(mFull.progress).toBe(10);
  });

  it("verifies Pro subscription status and period end", async () => {
    const subRepo = getSubscriptionRepository("user_sub_test");
    expect(await subRepo.isPro()).toBe(false);

    // Active subscription in the future
    await subRepo.updateSubscription({
      provider: "razorpay",
      planId: "pro_monthly",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 86_400_000 * 30),
      providerRef: "sub_123456",
    });
    expect(await subRepo.isPro()).toBe(true);

    // Expired subscription
    await subRepo.updateSubscription({
      provider: "razorpay",
      planId: "pro_monthly",
      status: "active",
      currentPeriodEnd: new Date(Date.now() - 10_000), // In the past
      providerRef: "sub_123456",
    });
    expect(await subRepo.isPro()).toBe(false);
  });

  it("records attempts with response times and confidence ratings", async () => {
    const attemptRepo = getAttemptRepository("user_attempt_test");

    const att = await attemptRepo.recordAttempt({
      module: "m1",
      itemId: "two_sum",
      answer: { lines: [2, 4] },
      correct: true,
      ms: 4500,
      confidence: "certain",
    });

    expect(att.userId).toBe("user_attempt_test");
    expect(att.correct).toBe(true);
    expect(att.ms).toBe(4500);

    const history = await attemptRepo.getItemAttempts("two_sum");
    expect(history).toHaveLength(1);
    expect(history[0].confidence).toBe("certain");
  });
});
