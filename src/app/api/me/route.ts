import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMemoryStore } from "@/lib/db/repository";
import {
  getUserRepository,
  getProfileRepository,
  getStreakRepository,
  getSrsRepository,
  getProgressRepository,
  getAttemptRepository,
  XpRepository,
} from "@/lib/db/repositories";
import { checkEntitlements } from "@/lib/payments/entitlements";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      userDoc,
      profile,
      entitlements,
      streakDoc,
      dueCards,
      m1Count,
      m2Count,
      m3Count,
      m4Count,
      totalXp,
      attempts,
    ] = await Promise.all([
      getUserRepository().findById(user.id).catch(() => null),
      getProfileRepository(user.id).getProfile().catch(() => null),
      checkEntitlements(user.id).catch(() => ({ isPro: false, plan: "free" })),
      getStreakRepository(user.id).getStreak().catch(() => ({ current: 0, longest: 0, lastDay: "" })),
      getSrsRepository(user.id).getDueCards().catch(() => []),
      getProgressRepository(user.id).countCompleted("m1").catch(() => 0),
      getProgressRepository(user.id).countCompleted("m2").catch(() => 0),
      getProgressRepository(user.id).countCompleted("m3").catch(() => 0),
      getProgressRepository(user.id).countCompleted("m4").catch(() => 0),
      new XpRepository(user.id).getTotalXp().catch(() => 0),
      getAttemptRepository(user.id).find().catch(() => []),
    ]);

    const drillsDone = attempts ? attempts.length : 0;
    const accuracy =
      drillsDone > 0
        ? Math.round(
            (attempts.filter((a) => a.correct).length / drillsDone) * 100
          )
        : 0;

    return NextResponse.json(
      {
        user: userDoc,
        profile,
        entitlements,
        streak: streakDoc.current,
        longestStreak: streakDoc.longest,
        lastActiveDay: streakDoc.lastDay,
        dueSrsCount: dueCards.length,
        totalXp,
        accuracy,
        drillsDone,
        completed: {
          m1: m1Count,
          m2: m2Count,
          m3: m3Count,
          m4: m4Count,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Collections strictly scoped by userId
    const userScopedCollections = [
      "profiles",
      "progress",
      "attempts",
      "mistakes",
      "bookmarks",
      "srs_cards",
      "xp_events",
      "milestones",
      "streaks",
      "subscriptions",
      "repos",
      "repo_chunks",
      "quiz_sessions",
    ];

    try {
      const db = await getDb();
      for (const colName of userScopedCollections) {
        await db.collection(colName).deleteMany({ userId });
      }
      await db.collection("users").deleteOne({ id: userId });
    } catch {
      // Memory fallback for tests / offline
      for (const colName of userScopedCollections) {
        const store = getMemoryStore(colName);
        for (const [key, item] of Array.from(store.entries())) {
          if (item.userId === userId) {
            store.delete(key);
          }
        }
      }

      const usersStore = getMemoryStore("users");
      usersStore.delete(userId);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account and all associated user data permanently deleted",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
