import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDailySprint } from "@/content/m4/sprint-generator";
import {
  scoreFermiEstimate,
  evaluateDailySprint,
} from "@/lib/m4/sprint-session";
import {
  queueOfflineSprint,
  getQueuedOfflineSprints,
  removeQueuedOfflineSprint,
} from "@/lib/m4/offline-sync";
import { SprintSubmissionPayload } from "@/content/m4/sprint-schema";

const mockAwardXp = vi.fn().mockResolvedValue({
  added: true,
  event: { amount: 50 },
  totalXp: 350,
});

const mockRecordActivity = vi.fn().mockResolvedValue({
  current: 5,
  longest: 7,
  lastDay: "2026-10-14",
});

const mockGetStreak = vi.fn().mockResolvedValue({
  current: 4,
  longest: 7,
  lastDay: "2026-10-13",
});

const mockRecordAttempt = vi.fn().mockResolvedValue({ id: "att-1" });
const mockRecordMistake = vi.fn().mockResolvedValue({ id: "mst-1" });

vi.mock("@/lib/db/repositories/xp-repo", () => ({
  getXpRepository: vi.fn(() => ({
    awardXp: mockAwardXp,
  })),
}));

vi.mock("@/lib/db/repositories/streak-repo", () => ({
  getStreakRepository: vi.fn(() => ({
    recordActivity: mockRecordActivity,
    getStreak: mockGetStreak,
  })),
}));

vi.mock("@/lib/db/repositories/attempt-repo", () => ({
  getAttemptRepository: vi.fn(() => ({
    recordAttempt: mockRecordAttempt,
  })),
}));

vi.mock("@/lib/db/repositories/mistake-repo", () => ({
  getMistakeRepository: vi.fn(() => ({
    recordMistake: mockRecordMistake,
  })),
}));

describe("Module IV — Mind Sprint Generator & Spec Conformity", () => {
  it("should generate a 5-item sprint matching exact time limits and categories", () => {
    const sprint = getDailySprint("2026-10-14");

    expect(sprint.items).toHaveLength(5);
    expect(sprint.totalTimeSec).toBe(300); // 5 minutes

    // 1. Pattern (45s)
    expect(sprint.items[0].category).toBe("pattern");
    expect(sprint.items[0].timeLimitSec).toBe(45);

    // 2. Deduction (60s)
    expect(sprint.items[1].category).toBe("deduction");
    expect(sprint.items[1].timeLimitSec).toBe(60);

    // 3. Memory (45s)
    expect(sprint.items[2].category).toBe("memory");
    expect(sprint.items[2].timeLimitSec).toBe(45);
    expect(sprint.items[2].memoryChallenge).toBeDefined();
    expect(sprint.items[2].memoryChallenge?.flashItems.length).toBeGreaterThanOrEqual(3);

    // 4. Numerical (60s)
    expect(sprint.items[3].category).toBe("numerical");
    expect(sprint.items[3].timeLimitSec).toBe(60);
    expect(sprint.items[3].fermiChallenge).toBeDefined();

    // 5. Tricky (90s)
    expect(sprint.items[4].category).toBe("tricky");
    expect(sprint.items[4].timeLimitSec).toBe(90);
  });

  it("should be deterministic for the same date seed", () => {
    const sprint1 = getDailySprint("2026-10-14");
    const sprint2 = getDailySprint("2026-10-14");
    expect(sprint1.seed).toBe(sprint2.seed);
    expect(sprint1.items[0].prompt).toBe(sprint2.items[0].prompt);
  });
});

describe("Module IV — Fermi Logarithmic Estimation", () => {
  it("should give 100% score for exact target or within half tolerance", () => {
    // Target: 8.5 billion (10^9.93)
    const target = 8500000000;
    const guess = 8500000000;
    const res = scoreFermiEstimate(guess, target, 0.5);

    expect(res.correct).toBe(true);
    expect(res.scorePercent).toBe(100);
    expect(res.dexError).toBe(0);
  });

  it("should give 80% score within 0.5 dex tolerance", () => {
    // Target: 1,000,000 (10^6). Guess: 2,500,000 (10^6.4). Error = 0.4 dex <= 0.5
    const res = scoreFermiEstimate(2500000, 1000000, 0.5);
    expect(res.correct).toBe(true);
    expect(res.scorePercent).toBe(80);
    expect(res.dexError).toBeLessThanOrEqual(0.5);
  });

  it("should mark incorrect for large order-of-magnitude misses", () => {
    // Target: 1,000,000. Guess: 100,000,000 (Error = 2 dex)
    const res = scoreFermiEstimate(100000000, 1000000, 0.5);
    expect(res.correct).toBe(false);
    expect(res.scorePercent).toBe(0);
  });
});

describe("Module IV — Sprint Session Evaluation & Streaks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly score a completed sprint, advance streak, and award XP", async () => {
    const sprint = getDailySprint("2026-10-14");

    const payload: SprintSubmissionPayload = {
      date: "2026-10-14",
      seed: sprint.seed,
      answers: [
        {
          itemId: sprint.items[0].id,
          category: "pattern",
          answer: sprint.items[0].correctOptionId!,
          skipped: false,
          timeSpentSec: 25,
          confidence: "certain",
        },
        {
          itemId: sprint.items[1].id,
          category: "deduction",
          answer: sprint.items[1].correctOptionId!,
          skipped: false,
          timeSpentSec: 40,
          confidence: "certain",
        },
        {
          itemId: sprint.items[2].id,
          category: "memory",
          answer: sprint.items[2].memoryChallenge!.correctOptionId,
          skipped: false,
          timeSpentSec: 30,
          confidence: "certain",
        },
        {
          itemId: sprint.items[3].id,
          category: "numerical",
          answer: sprint.items[3].fermiChallenge!.targetValue,
          skipped: false,
          timeSpentSec: 35,
          confidence: "unsure",
        },
        {
          itemId: sprint.items[4].id,
          category: "tricky",
          answer: sprint.items[4].correctOptionId!,
          skipped: false,
          timeSpentSec: 50,
          confidence: "certain",
        },
      ],
      clientTimestamp: new Date().toISOString(),
      completedOffline: false,
    };

    const result = await evaluateDailySprint("user-1", payload);

    expect(result.correctCount).toBe(5);
    expect(result.overallScorePercent).toBe(100);
    expect(result.streakDays).toBe(5);
    expect(result.streakAdvanced).toBe(true);

    expect(mockRecordActivity).toHaveBeenCalled();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(5);
    expect(mockAwardXp).toHaveBeenCalledWith(
      "mind_sprint",
      50,
      "m4_sprint_2026-10-14"
    );
  });

  it("should score skipped items as incorrect with 0 score", async () => {
    const sprint = getDailySprint("2026-10-14");

    const payload: SprintSubmissionPayload = {
      date: "2026-10-14",
      seed: sprint.seed,
      answers: [
        {
          itemId: sprint.items[0].id,
          category: "pattern",
          answer: "skipped",
          skipped: true,
          timeSpentSec: 45,
          confidence: "guessing",
        },
        {
          itemId: sprint.items[1].id,
          category: "deduction",
          answer: "skipped",
          skipped: true,
          timeSpentSec: 60,
          confidence: "guessing",
        },
        {
          itemId: sprint.items[2].id,
          category: "memory",
          answer: "skipped",
          skipped: true,
          timeSpentSec: 45,
          confidence: "guessing",
        },
        {
          itemId: sprint.items[3].id,
          category: "numerical",
          answer: "skipped",
          skipped: true,
          timeSpentSec: 60,
          confidence: "guessing",
        },
        {
          itemId: sprint.items[4].id,
          category: "tricky",
          answer: "skipped",
          skipped: true,
          timeSpentSec: 90,
          confidence: "guessing",
        },
      ],
      clientTimestamp: new Date().toISOString(),
      completedOffline: false,
    };

    const result = await evaluateDailySprint("user-1", payload);
    expect(result.correctCount).toBe(0);
    expect(result.overallScorePercent).toBe(0);
    expect(mockRecordMistake).toHaveBeenCalledTimes(5);
  });
});

describe("Module IV — Offline Queueing Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should queue offline sprints and retrieve them from storage", () => {
    const payload: SprintSubmissionPayload = {
      date: "2026-10-14",
      seed: "sprint-test",
      answers: [
        { itemId: "1", category: "pattern", answer: "a", skipped: false, timeSpentSec: 10, confidence: "certain" },
        { itemId: "2", category: "deduction", answer: "b", skipped: false, timeSpentSec: 10, confidence: "certain" },
        { itemId: "3", category: "memory", answer: "c", skipped: false, timeSpentSec: 10, confidence: "certain" },
        { itemId: "4", category: "numerical", answer: 1000, skipped: false, timeSpentSec: 10, confidence: "certain" },
        { itemId: "5", category: "tricky", answer: "e", skipped: false, timeSpentSec: 10, confidence: "certain" },
      ],
      clientTimestamp: new Date().toISOString(),
      completedOffline: true,
    };

    const queued = queueOfflineSprint(payload);
    expect(queued.id).toBeDefined();

    const stored = getQueuedOfflineSprints();
    expect(stored).toHaveLength(1);
    expect(stored[0].payload.date).toBe("2026-10-14");

    removeQueuedOfflineSprint(queued.id);
    expect(getQueuedOfflineSprints()).toHaveLength(0);
  });
});
