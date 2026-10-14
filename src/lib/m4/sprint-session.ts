import {
  SprintSubmissionPayload,
  SprintSubmissionPayloadSchema,
  SprintResult,
  SprintItemResult,
} from "@/content/m4/sprint-schema";
import { getDailySprint } from "@/content/m4/sprint-generator";
import { getStreakRepository } from "@/lib/db/repositories/streak-repo";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";

/**
 * Calculates order-of-magnitude dex error and percentage score for Fermi estimations.
 * dex error = |log10(guess) - log10(actual)|
 */
export function scoreFermiEstimate(
  userGuess: number,
  targetValue: number,
  acceptableDexRange = 0.5
): {
  correct: boolean;
  scorePercent: number;
  dexError: number;
} {
  if (userGuess <= 0 || targetValue <= 0) {
    return { correct: false, scorePercent: 0, dexError: 99 };
  }
  const logGuess = Math.log10(userGuess);
  const logTarget = Math.log10(targetValue);
  const dexError = Math.abs(logGuess - logTarget);

  if (dexError <= acceptableDexRange / 2) {
    return {
      correct: true,
      scorePercent: 100,
      dexError: Number(dexError.toFixed(2)),
    };
  } else if (dexError <= acceptableDexRange) {
    return {
      correct: true,
      scorePercent: 80,
      dexError: Number(dexError.toFixed(2)),
    };
  } else if (dexError <= acceptableDexRange * 2) {
    return {
      correct: false,
      scorePercent: 40,
      dexError: Number(dexError.toFixed(2)),
    };
  }
  return {
    correct: false,
    scorePercent: 0,
    dexError: Number(dexError.toFixed(2)),
  };
}

/**
 * Evaluates a daily 5-minute Mind Sprint session deterministically.
 */
export async function evaluateDailySprint(
  userId: string,
  rawPayload: SprintSubmissionPayload
): Promise<SprintResult> {
  const payload = SprintSubmissionPayloadSchema.parse(rawPayload);
  const sprint = getDailySprint(payload.date);

  const itemResults: SprintItemResult[] = [];
  let correctCount = 0;
  let totalTimeSec = 0;
  let scoreSum = 0;

  for (let i = 0; i < 5; i++) {
    const item = sprint.items[i];
    const userAns = payload.answers[i];
    totalTimeSec += userAns.timeSpentSec;

    let isCorrect = false;
    let scorePercent = 0;
    let correctAnswer: string | number = "";

    if (userAns.skipped) {
      isCorrect = false;
      scorePercent = 0;
      correctAnswer =
        item.correctOptionId ||
        item.memoryChallenge?.correctOptionId ||
        item.fermiChallenge?.targetValue ||
        "Skipped";
    } else if (item.category === "numerical" && item.fermiChallenge) {
      const fermiResult = scoreFermiEstimate(
        Number(userAns.answer),
        item.fermiChallenge.targetValue,
        item.fermiChallenge.acceptableDexRange
      );
      isCorrect = fermiResult.correct;
      scorePercent = fermiResult.scorePercent;
      correctAnswer = item.fermiChallenge.targetValue;
    } else if (item.category === "memory" && item.memoryChallenge) {
      correctAnswer = item.memoryChallenge.correctOptionId;
      isCorrect =
        String(userAns.answer).trim() ===
        item.memoryChallenge.correctOptionId.trim();
      scorePercent = isCorrect ? 100 : 0;
    } else {
      correctAnswer = item.correctOptionId || "";
      isCorrect =
        String(userAns.answer).trim() === (item.correctOptionId || "").trim();
      scorePercent = isCorrect ? 100 : 0;
    }

    if (isCorrect) correctCount++;
    scoreSum += scorePercent;

    itemResults.push({
      itemId: item.id,
      category: item.category,
      correct: isCorrect,
      scorePercent,
      userAnswer: userAns.answer,
      correctAnswer,
      confidence: userAns.confidence,
      timeSpentSec: userAns.timeSpentSec,
      explanation: item.explanation,
    });

    // Record individual attempt in AttemptRepository
    try {
      const attemptRepo = getAttemptRepository(userId);
      await attemptRepo.recordAttempt({
        module: "m4",
        itemId: item.id,
        answer: userAns.answer,
        correct: isCorrect,
        ms: userAns.timeSpentSec * 1000,
        confidence: userAns.confidence,
        changes: 0,
      });
    } catch (err) {
      console.warn("Failed to record sprint item attempt:", err);
    }

    // Log mistake if incorrect
    if (!isCorrect) {
      try {
        const mistakeRepo = getMistakeRepository(userId);
        await mistakeRepo.recordMistake(
          "m4",
          item.id,
          `Mind Sprint ${item.category}: ${item.explanation}`
        );
      } catch (err) {
        console.warn("Failed to record sprint mistake:", err);
      }
    }
  }

  // Update daily streak
  let streakDays = 1;
  let streakAdvanced = false;
  try {
    const streakRepo = getStreakRepository(userId);
    const prevStreak = await streakRepo.getStreak();
    const prevDays = prevStreak?.current ?? 0;
    const updated = await streakRepo.recordActivity();
    streakDays = updated.current;
    streakAdvanced = updated.current > prevDays;
  } catch (err) {
    console.warn("Failed to record streak activity:", err);
  }

  // Award XP (idempotent ledger for the day)
  let xpAwarded = 0;
  try {
    const xpRepo = getXpRepository(userId);
    // Base 50 XP for daily sprint
    const baseAward = await xpRepo.awardXp(
      "mind_sprint",
      50,
      `m4_sprint_${payload.date}`
    );
    if (baseAward.added) xpAwarded += 50;

    // Bonus XP: +10 per correct item
    if (correctCount > 0) {
      const bonusAward = await xpRepo.awardXp(
        "sprint_bonus",
        correctCount * 10,
        `m4_sprint_bonus_${payload.date}`
      );
      if (bonusAward.added) xpAwarded += correctCount * 10;
    }
  } catch (err) {
    console.warn("Failed to award sprint XP:", err);
    xpAwarded = 50 + correctCount * 10;
  }

  const overallScorePercent = Math.round(scoreSum / 5);

  return {
    date: payload.date,
    correctCount,
    totalItems: 5,
    totalTimeSec: Math.round(totalTimeSec),
    overallScorePercent,
    xpAwarded,
    streakDays,
    streakAdvanced,
    results: itemResults,
    syncedAt: new Date().toISOString(),
  };
}
