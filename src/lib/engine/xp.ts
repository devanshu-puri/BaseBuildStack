import { XpActivityType } from "./types";

export const BASE_XP: Record<XpActivityType, number> = {
  blitz_solve: 10,
  quiz_solve: 10,
  quiz_complete: 25,
  lesson_complete: 50,
  mind_sprint_complete: 30,
  bug_audit_solve: 15,
  daily_streak_bonus: 20,
};

/**
 * Returns streak multiplier based on current continuous streak days.
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

/**
 * Deterministic XP calculator.
 */
export function calculateXp(
  activity: XpActivityType,
  options?: {
    speedBonus?: number;
    streakDays?: number;
    perfectBonus?: boolean;
  }
): number {
  const base = BASE_XP[activity] ?? 10;
  const speed = Math.max(0, options?.speedBonus ?? 0);
  const perfect = options?.perfectBonus ? 15 : 0;
  const rawXp = base + speed + perfect;

  const multiplier = getStreakMultiplier(options?.streakDays ?? 0);
  return Math.round(rawXp * multiplier);
}
