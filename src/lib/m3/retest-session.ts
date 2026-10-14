import {
  RetestSubmissionPayload,
  RetestSubmissionPayloadSchema,
  RetestSubmissionResult,
  InteractiveExercise,
} from "@/content/m3/lesson-schema";
import { getLessonById, getLessonRetestChallenge } from "@/content/m3/lessons";
import { getSrsRepository } from "@/lib/db/repositories/srs-repo";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getProgressRepository } from "@/lib/db/repositories/progress-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";

export interface RetestCardItem {
  lessonId: string;
  title: string;
  outcome: string;
  paths: string[];
  stage: "day3" | "day10" | "mastered";
  due: string;
  isDue: boolean;
  daysUntilDue: number;
  interval: number;
  repetitions: number;
  ease: number;
  challenge: InteractiveExercise;
}

export interface RetestDeckResult {
  dueCards: RetestCardItem[];
  upcomingCards: RetestCardItem[];
  masteredCards: RetestCardItem[];
  stats: {
    dueCount: number;
    upcomingCount: number;
    masteredCount: number;
  };
}

/**
 * Loads the user's scheduled spaced repetition mastery deck for Module III.
 */
export async function getLessonRetestDeck(
  userId: string,
  targetDate: Date = new Date()
): Promise<RetestDeckResult> {
  const srsRepo = getSrsRepository(userId);
  const cards = await srsRepo.find();

  const lessonCards = cards.filter((c) => c.itemId.startsWith("m3_"));

  const dueCards: RetestCardItem[] = [];
  const upcomingCards: RetestCardItem[] = [];
  const masteredCards: RetestCardItem[] = [];

  for (const card of lessonCards) {
    const lessonId = card.itemId.replace(/^m3_/, "");
    const lesson = getLessonById(lessonId);
    if (!lesson) continue;

    // Determine current stage from repetitions & interval
    let stage: "day3" | "day10" | "mastered" = "day3";
    if (card.repetitions >= 3 && card.interval >= 14) {
      stage = "mastered";
    } else if (card.repetitions >= 2 || card.interval >= 7) {
      stage = "day10";
    } else {
      stage = "day3";
    }

    const dueDate = new Date(card.due);
    const isDue = targetDate.getTime() >= dueDate.getTime();
    const diffMs = dueDate.getTime() - targetDate.getTime();
    const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const challenge = getLessonRetestChallenge(
      lesson,
      stage === "mastered" ? "day10" : stage
    );

    const item: RetestCardItem = {
      lessonId,
      title: lesson.title,
      outcome: lesson.outcome,
      paths: lesson.paths,
      stage,
      due: dueDate.toISOString(),
      isDue,
      daysUntilDue,
      interval: card.interval,
      repetitions: card.repetitions,
      ease: card.ease,
      challenge,
    };

    if (stage === "mastered") {
      masteredCards.push(item);
    } else if (isDue) {
      dueCards.push(item);
    } else {
      upcomingCards.push(item);
    }
  }

  // Sort due cards by most overdue first
  dueCards.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
  // Sort upcoming cards by closest due date first
  upcomingCards.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  return {
    dueCards,
    upcomingCards,
    masteredCards,
    stats: {
      dueCount: dueCards.length,
      upcomingCount: upcomingCards.length,
      masteredCount: masteredCards.length,
    },
  };
}

/**
 * Evaluates a mastery re-test submission deterministically.
 */
export async function submitLessonRetest(
  userId: string,
  rawPayload: RetestSubmissionPayload
): Promise<RetestSubmissionResult> {
  const payload = RetestSubmissionPayloadSchema.parse(rawPayload);
  const { lessonId, stage, selectedOptionId, durationMs } = payload;

  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  const challenge = getLessonRetestChallenge(lesson, stage);
  const passed = selectedOptionId.trim() === challenge.correctOptionId.trim();

  const srsRepo = getSrsRepository(userId);
  const existingCard = await srsRepo.getCard(`m3_${lessonId}`);

  const now = new Date();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  let newInterval = existingCard?.interval ?? (stage === "day3" ? 3 : 7);
  let newRepetitions = existingCard?.repetitions ?? (stage === "day3" ? 1 : 2);
  let newEase = existingCard?.ease ?? 2.5;
  let nextDueDate = new Date();
  let xpAwarded = 0;
  let totalXp = 0;
  let mastered = false;
  let feedback = "";

  if (passed) {
    if (stage === "day3") {
      // Day 3 passed -> advance to Day 10 (interval +7 days)
      newInterval = 7;
      newRepetitions = 2;
      nextDueDate = new Date(now.getTime() + 7 * ONE_DAY_MS);
      feedback =
        "Day 3 Checkpoint Cleared! Spaced retrieval solidifies memory retention. Your +10 Day Final Mastery check is scheduled.";

      // Award +25 XP
      try {
        const xpRepo = getXpRepository(userId);
        const res = await xpRepo.awardXp(
          "retest_day3",
          25,
          `m3_retest_day3_${lessonId}`
        );
        xpAwarded = res.added ? 25 : 0;
        totalXp = res.totalXp;
      } catch (err) {
        console.warn("Failed to award day3 retest XP:", err);
      }

      // Update progress stage to 6
      try {
        const progressRepo = getProgressRepository(userId);
        await progressRepo.setProgress("m3", lessonId, "completed", 6);
      } catch (err) {
        console.warn("Failed to update progress:", err);
      }
    } else {
      // Day 10 passed -> Full topic mastery achieved!
      newInterval = 21; // Next review in 3 weeks
      newRepetitions = 3;
      nextDueDate = new Date(now.getTime() + 21 * ONE_DAY_MS);
      mastered = true;
      feedback =
        "🏆 Lesson Mastered! You have proven long-term retention across 10 days of spaced repetition.";

      // Award +50 XP for full mastery
      try {
        const xpRepo = getXpRepository(userId);
        const res = await xpRepo.awardXp(
          "retest_mastery",
          50,
          `m3_retest_mastery_${lessonId}`
        );
        xpAwarded = res.added ? 50 : 0;
        totalXp = res.totalXp;
      } catch (err) {
        console.warn("Failed to award mastery retest XP:", err);
      }

      // Mark stage 7 (Full Mastery)
      try {
        const progressRepo = getProgressRepository(userId);
        await progressRepo.setProgress("m3", lessonId, "completed", 7);
      } catch (err) {
        console.warn("Failed to mark lesson mastery:", err);
      }
    }

    // Save updated SRS card
    try {
      await srsRepo.upsertCard({
        itemId: `m3_${lessonId}`,
        due: nextDueDate,
        interval: newInterval,
        ease: newEase,
        repetitions: newRepetitions,
      });
    } catch (err) {
      console.warn("Failed to update SRS card on pass:", err);
    }
  } else {
    // Retest failed: penalize SM-2 interval and ease
    newInterval = 1; // Retry tomorrow
    newRepetitions = 1;
    newEase = Math.max(1.3, Number((newEase - 0.2).toFixed(2)));
    nextDueDate = new Date(now.getTime() + 1 * ONE_DAY_MS);
    feedback = challenge.explanation;

    try {
      await srsRepo.upsertCard({
        itemId: `m3_${lessonId}`,
        due: nextDueDate,
        interval: newInterval,
        ease: newEase,
        repetitions: newRepetitions,
      });
    } catch (err) {
      console.warn("Failed to update SRS card on fail:", err);
    }

    // Record mistake
    try {
      const mistakeRepo = getMistakeRepository(userId);
      await mistakeRepo.recordMistake(
        "m3",
        lessonId,
        `Retest ${stage} failed: ${challenge.explanation}`
      );
    } catch (err) {
      console.warn("Failed to record retest mistake:", err);
    }
  }

  // Record attempt
  try {
    const attemptRepo = getAttemptRepository(userId);
    await attemptRepo.recordAttempt({
      module: "m3",
      itemId: `${lessonId}_${stage}`,
      answer: selectedOptionId,
      correct: passed,
      ms: durationMs,
      changes: 0,
    });
  } catch (err) {
    console.warn("Failed to record attempt:", err);
  }

  return {
    lessonId,
    stage,
    passed,
    xpAwarded,
    totalXp,
    mastered,
    newInterval,
    nextDueDate: nextDueDate.toISOString(),
    feedback,
    explanation: challenge.explanation,
  };
}
