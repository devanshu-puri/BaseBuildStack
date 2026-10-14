import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDailySprint } from "@/content/m4/sprint-generator";
import { getStreakRepository } from "@/lib/db/repositories/streak-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const { searchParams } = new URL(req.url);
    const todayStr = new Date().toISOString().split("T")[0];
    const dateStr = searchParams.get("date") || todayStr;

    const sprint = getDailySprint(dateStr);

    let currentStreak = 0;
    try {
      const streakRepo = getStreakRepository(userId);
      const streakDoc = await streakRepo.getStreak();
      currentStreak = streakDoc?.current ?? 0;
    } catch (err) {
      console.warn("Failed to get streak:", err);
    }

    let completedToday = false;
    try {
      const attemptRepo = getAttemptRepository(userId);
      const attempts = await attemptRepo.find({
        module: "m4",
        itemId: `${dateStr}-t5`,
      });
      completedToday = attempts.length > 0;
    } catch (err) {
      console.warn("Failed to check daily attempt:", err);
    }

    return NextResponse.json({
      ok: true,
      data: {
        sprint,
        currentStreak,
        completedToday,
      },
    });
  } catch (error) {
    console.error("Failed to load daily sprint:", error);
    return NextResponse.json(
      { error: "Failed to load daily sprint" },
      { status: 500 }
    );
  }
}
