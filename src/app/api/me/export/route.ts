import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserRepository,
  getProfileRepository,
  getProgressRepository,
  getAttemptRepository,
  getMistakeRepository,
  getBookmarkRepository,
  getSrsRepository,
  getXpRepository,
  getMilestoneRepository,
  getStreakRepository,
  getSubscriptionRepository,
} from "@/lib/db/repositories";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Collect all user-owned data across all repositories
    const [
      userDoc,
      profile,
      progress,
      attempts,
      mistakes,
      bookmarks,
      srsCards,
      xpEvents,
      milestones,
      streak,
      subscription,
    ] = await Promise.all([
      getUserRepository().findById(userId),
      getProfileRepository(userId).getProfile(),
      getProgressRepository(userId).find(),
      getAttemptRepository(userId).find(),
      getMistakeRepository(userId).getMistakes(),
      getBookmarkRepository(userId).getBookmarks(),
      getSrsRepository(userId).find(),
      getXpRepository(userId).find(),
      getMilestoneRepository(userId).getMilestones(),
      getStreakRepository(userId).getStreak(),
      getSubscriptionRepository(userId).getSubscription(),
    ]);

    const totalXp = xpEvents.reduce((acc, ev) => acc + ev.amount, 0);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      userId,
      account: userDoc,
      profile,
      progress,
      attempts,
      mistakes,
      bookmarks,
      srsCards,
      xp: {
        totalXp,
        events: xpEvents,
      },
      milestones,
      streak,
      subscription,
    };

    const response = NextResponse.json(exportPayload, { status: 200 });
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="basebuildstack-export-${userId}.json"`
    );

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
