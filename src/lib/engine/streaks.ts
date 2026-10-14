export interface StreakState {
  current: number;
  longest: number;
  lastDay: string; // YYYY-MM-DD
}

export interface StreakEvaluation {
  current: number;
  longest: number;
  lastDay: string;
  status: "started" | "maintained" | "extended" | "reset";
  streakIncreased: boolean;
}

export function formatDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getYesterdayKey(d: Date): string {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  return formatDateKey(prev);
}

/**
 * Pure deterministic streak evaluator.
 */
export function evaluateStreakUpdate(
  currentStreak: StreakState,
  activityDate: Date = new Date()
): StreakEvaluation {
  const today = formatDateKey(activityDate);
  const yesterday = getYesterdayKey(activityDate);

  if (!currentStreak.lastDay) {
    return {
      current: 1,
      longest: Math.max(1, currentStreak.longest),
      lastDay: today,
      status: "started",
      streakIncreased: true,
    };
  }

  if (currentStreak.lastDay === today) {
    return {
      current: currentStreak.current,
      longest: currentStreak.longest,
      lastDay: today,
      status: "maintained",
      streakIncreased: false,
    };
  }

  if (currentStreak.lastDay === yesterday) {
    const nextCurrent = currentStreak.current + 1;
    return {
      current: nextCurrent,
      longest: Math.max(currentStreak.longest, nextCurrent),
      lastDay: today,
      status: "extended",
      streakIncreased: true,
    };
  }

  // Missed one or more days: streak resets to 1, longest preserved
  return {
    current: 1,
    longest: currentStreak.longest,
    lastDay: today,
    status: "reset",
    streakIncreased: false,
  };
}
