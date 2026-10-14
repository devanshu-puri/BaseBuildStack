import React, { Suspense } from "react";
import { connection } from "next/server";
import { getDailySprint } from "@/content/m4/sprint-generator";
import { getCurrentUser } from "@/lib/auth/session";
import { getStreakRepository } from "@/lib/db/repositories/streak-repo";
import { SprintRunner } from "@/components/m4/sprint-runner";

async function SprintDataLoader() {
  await connection();

  const todayStr = new Date().toISOString().split("T")[0];
  const sprint = getDailySprint(todayStr);

  let initialStreak = 0;
  try {
    const user = await getCurrentUser();
    if (user?.id) {
      const streakRepo = getStreakRepository(user.id);
      const streakDoc = await streakRepo.getStreak();
      initialStreak = streakDoc?.current ?? 0;
    }
  } catch (err) {
    console.warn("Failed to fetch streak:", err);
  }

  return <SprintRunner sprint={sprint} initialStreak={initialStreak} />;
}

export default function DailyMindSprintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading 5-Minute Daily Mind Sprint...
        </div>
      }
    >
      <SprintDataLoader />
    </Suspense>
  );
}
