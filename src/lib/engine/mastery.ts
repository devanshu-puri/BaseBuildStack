import {
  MasteryTier,
  MasteryProgress,
  MasteryRetestSchedule,
} from "./types";

/**
 * Calculates mastery tier from repetition count, accuracy, interval, and ease.
 */
export function calculateMasteryTier(stats: {
  repetitions: number;
  accuracy: number;
  interval?: number;
}): MasteryTier {
  const { repetitions, accuracy, interval = 1 } = stats;

  if (repetitions === 0) return "novice";
  if (repetitions <= 2 || accuracy < 0.6) return "learning";
  if (repetitions >= 5 && accuracy >= 0.85 && interval >= 14) return "mastered";
  return "proficient";
}

/**
 * Calculates progress percentage (0 - 100) toward full mastery.
 */
export function calculateMasteryProgress(stats: {
  repetitions: number;
  accuracy: number;
  interval?: number;
  totalAttempts: number;
}): MasteryProgress {
  const tier = calculateMasteryTier(stats);

  let percent = 0;
  if (tier === "novice") {
    percent = Math.min(20, stats.totalAttempts > 0 ? 15 : 0);
  } else if (tier === "learning") {
    percent = 20 + Math.min(30, stats.repetitions * 15);
  } else if (tier === "proficient") {
    percent = 50 + Math.min(35, Math.round(stats.accuracy * 35));
  } else if (tier === "mastered") {
    percent = 100;
  }

  return {
    tier,
    percent: Math.min(100, Math.max(0, percent)),
    accuracy: Number(stats.accuracy.toFixed(2)),
    totalAttempts: stats.totalAttempts,
  };
}

/**
 * Module III: Computes mastery re-test schedule at +3 days and +10 days from completion.
 */
export function scheduleMasteryRetests(
  completedAt: Date = new Date()
): MasteryRetestSchedule {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const retest1 = new Date(completedAt.getTime() + 3 * ONE_DAY_MS);
  const retest2 = new Date(completedAt.getTime() + 10 * ONE_DAY_MS);

  return {
    retest1,
    retest2,
  };
}

/**
 * Check if a scheduled retest is due relative to current date.
 */
export function isRetestDue(targetDate: Date, now: Date = new Date()): boolean {
  return now.getTime() >= targetDate.getTime();
}
