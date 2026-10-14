import { ConfidenceRating, Sm2Input, Sm2Output } from "./types";

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

/**
 * Maps answer correctness, speed, and confidence into a SuperMemo quality grade (0 - 5).
 */
export function mapOutcomeToQuality(
  correct: boolean,
  ms?: number,
  confidence?: ConfidenceRating
): number {
  if (correct) {
    if (confidence === "certain" && (!ms || ms <= 15_000)) {
      return 5; // Perfect recall, fast
    }
    if (confidence !== "guessing") {
      return 4; // Correct with reasonable confidence
    }
    return 3; // Correct with difficulty / guessing
  }

  // Incorrect
  if (confidence === "unsure") {
    return 2; // Incorrect, but remembered some context
  }
  if (confidence === "guessing") {
    return 1; // Incorrect, completely guessed
  }
  return 0; // Total miss
}

/**
 * SuperMemo SM-2 spaced repetition algorithm.
 * Deterministic scheduling for revision cards.
 */
export function calculateSm2(
  current: Sm2Input = {},
  quality: number,
  now: Date = new Date()
): Sm2Output {
  const currentEase = current.ease ?? DEFAULT_EASE;
  const currentInterval = current.interval ?? 1;
  const currentReps = current.repetitions ?? 0;

  // Clamp quality between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let nextInterval: number;
  let nextReps: number;

  if (q < 3) {
    // Incorrect: reset repetitions and repeat in 1 day
    nextReps = 0;
    nextInterval = 1;
  } else {
    // Correct: advance repetitions and scale interval
    if (currentReps === 0) {
      nextInterval = 1;
    } else if (currentReps === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * currentEase);
    }
    nextReps = currentReps + 1;
  }

  // SM-2 Ease Factor calculation
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const nextEase = Math.max(MIN_EASE, Number((currentEase + delta).toFixed(2)));

  // Compute exact due timestamp
  const due = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    ease: nextEase,
    interval: nextInterval,
    repetitions: nextReps,
    due,
  };
}
