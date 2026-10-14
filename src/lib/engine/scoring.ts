import { createHash } from "crypto";
import {
  ConfidenceRating,
  CalibrationStatus,
  EvaluationResult,
} from "./types";

/**
 * Single-choice MCQ evaluation.
 */
export function evaluateMcq(
  selectedOptionId: string,
  correctOptionId: string
): { correct: boolean; score: number } {
  const isMatch = selectedOptionId.trim() === correctOptionId.trim();
  return {
    correct: isMatch,
    score: isMatch ? 1 : 0,
  };
}

/**
 * Multiple-choice evaluation (select all that apply).
 * Requires exact set equality (no false positives, no omissions).
 */
export function evaluateMultiChoice(
  selectedIds: string[],
  correctIds: string[]
): { correct: boolean; score: number } {
  const selectedSet = new Set(selectedIds.map((s) => s.trim()));
  const correctSet = new Set(correctIds.map((s) => s.trim()));

  if (selectedSet.size !== correctSet.size) {
    return { correct: false, score: 0 };
  }

  for (const id of correctSet) {
    if (!selectedSet.has(id)) {
      return { correct: false, score: 0 };
    }
  }

  return { correct: true, score: 1 };
}

/**
 * Spot-the-bug line selection evaluation.
 * Checks if the user correctly selected the buggy line(s).
 */
export function evaluateSpotBug(
  selectedLines: number[],
  targetBugLines: number[]
): { correct: boolean; score: number } {
  const selectedSet = new Set(selectedLines);
  const targetSet = new Set(targetBugLines);

  if (selectedSet.size !== targetSet.size) {
    return { correct: false, score: 0 };
  }

  for (const line of targetSet) {
    if (!selectedSet.has(line)) {
      return { correct: false, score: 0 };
    }
  }

  return { correct: true, score: 1 };
}

/**
 * Fill-in-the-blank evaluation with normalization.
 */
export function evaluateFillBlank(
  answer: string,
  acceptedTokens: string[],
  caseSensitive = false
): { correct: boolean; score: number } {
  const normalizedUser = caseSensitive
    ? answer.trim().replace(/\s+/g, " ")
    : answer.trim().toLowerCase().replace(/\s+/g, " ");

  const isMatch = acceptedTokens.some((token) => {
    const normalizedTarget = caseSensitive
      ? token.trim().replace(/\s+/g, " ")
      : token.trim().toLowerCase().replace(/\s+/g, " ");
    return normalizedUser === normalizedTarget;
  });

  return {
    correct: isMatch,
    score: isMatch ? 1 : 0,
  };
}

/**
 * Deterministic hash comparison for puzzle solvers.
 */
export function evaluatePuzzleHash(
  solution: string,
  expectedSha256: string
): { correct: boolean; score: number } {
  const normalized = solution.trim();
  const hash = createHash("sha256").update(normalized).digest("hex");
  const isMatch = hash.toLowerCase() === expectedSha256.trim().toLowerCase();

  return {
    correct: isMatch,
    score: isMatch ? 1 : 0,
  };
}

/**
 * Calculates a speed bonus based on completion time in milliseconds.
 * - Under 50% target time: full max bonus
 * - Under 100% target time: scaled bonus
 * - Over target time: 0 bonus
 */
export function computeSpeedBonus(
  ms: number,
  targetMs = 30_000,
  maxBonus = 5
): number {
  if (ms <= 0 || ms > targetMs) return 0;
  if (ms <= targetMs * 0.5) return maxBonus;

  const fractionRemaining = (targetMs - ms) / (targetMs * 0.5);
  return Math.max(1, Math.round(fractionRemaining * maxBonus));
}

/**
 * Computes calibration rating comparing confidence with correctness:
 * - "certain" + correct => "calibrated"
 * - "certain" + incorrect => "overconfident"
 * - "guessing" + correct => "underconfident"
 * - "unsure" / undefined => "calibrated" or "uncalibrated"
 */
export function computeCalibration(
  confidence: ConfidenceRating | undefined,
  correct: boolean
): CalibrationStatus {
  if (!confidence) return "uncalibrated";

  if (confidence === "certain") {
    return correct ? "calibrated" : "overconfident";
  }

  if (confidence === "guessing") {
    return correct ? "underconfident" : "calibrated";
  }

  return "calibrated";
}

/**
 * Comprehensive evaluator for all question types.
 */
export function evaluateSubmission(params: {
  type: "mcq" | "multi_choice" | "spot_bug" | "fill_blank" | "puzzle_hash";
  userAnswer: unknown;
  expected: unknown;
  ms?: number;
  targetMs?: number;
  confidence?: ConfidenceRating;
}): EvaluationResult {
  let correctness = { correct: false, score: 0 };

  switch (params.type) {
    case "mcq":
      correctness = evaluateMcq(
        String(params.userAnswer || ""),
        String(params.expected || "")
      );
      break;
    case "multi_choice":
      correctness = evaluateMultiChoice(
        Array.isArray(params.userAnswer) ? params.userAnswer : [],
        Array.isArray(params.expected) ? params.expected : []
      );
      break;
    case "spot_bug":
      correctness = evaluateSpotBug(
        Array.isArray(params.userAnswer) ? params.userAnswer.map(Number) : [],
        Array.isArray(params.expected) ? params.expected.map(Number) : []
      );
      break;
    case "fill_blank":
      correctness = evaluateFillBlank(
        String(params.userAnswer || ""),
        Array.isArray(params.expected)
          ? params.expected.map(String)
          : [String(params.expected || "")]
      );
      break;
    case "puzzle_hash":
      correctness = evaluatePuzzleHash(
        String(params.userAnswer || ""),
        String(params.expected || "")
      );
      break;
  }

  const speedBonus = correctness.correct
    ? computeSpeedBonus(params.ms || 0, params.targetMs || 30_000)
    : 0;

  const calibration = computeCalibration(params.confidence, correctness.correct);

  return {
    correct: correctness.correct,
    score: correctness.score,
    speedBonus,
    calibration,
  };
}
