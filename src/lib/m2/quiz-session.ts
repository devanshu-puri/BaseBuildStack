import {
  QuizMode,
  ClientQuizQuestion,
  QuizEvaluationResult,
  QuizSubmissionPayload,
} from "@/content/m2/quiz-schema";
import {
  getQuizQuestionById,
  selectQuestionsForDeck,
  sanitizeQuestionForClient,
} from "@/content/m2/quiz-questions";
import { getM2QuestionById } from "@/content/m2/question-bank";
import { buildDrillDeck, DrillDifficultyFilter } from "./drill-engine";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getSrsRepository } from "@/lib/db/repositories/srs-repo";
import { getQuestionHistoryRepository } from "@/lib/db/repositories/question-history-repo";
import { computeSpeedBonus, computeCalibration, calculateSm2 } from "@/lib/engine";

export interface CreateQuizSessionParams {
  userId: string;
  mode: QuizMode | "drills";
  limit?: number;
  skills?: string[];
  difficulty?: DrillDifficultyFilter;
  count?: number;
  focusWeak?: boolean;
  seed?: number;
}

export interface QuizSessionResponse {
  mode: string;
  sessionId?: string;
  questions: ClientQuizQuestion[];
  totalQuestions: number;
  seed?: number;
  cycleExhausted?: boolean;
  cycleNotice?: string;
  difficulty?: string;
  skills?: string[];
}

/**
 * Creates an active quiz session with personalized questions based on user's confirmed skills
 * and no-repeat question history tracking.
 */
export async function createQuizSession(
  params: CreateQuizSessionParams
): Promise<QuizSessionResponse> {
  const {
    userId,
    mode,
    limit,
    skills,
    difficulty = "mixed",
    count = limit || 10,
    focusWeak = false,
    seed,
  } = params;

  // Use the new Drill Engine for drills, quick, and fundamentals modes
  if (mode === "drills" || mode === "quick" || mode === "fundamentals") {
    const drillResult = await buildDrillDeck({
      userId,
      mode: mode === "fundamentals" ? "fundamentals" : "drills",
      skillIds: skills,
      difficulty,
      count,
      focusWeak,
      seed,
    });

    return {
      sessionId: drillResult.sessionId,
      mode: params.mode,
      questions: drillResult.questions as unknown as ClientQuizQuestion[],
      totalQuestions: drillResult.totalQuestions,
      seed: drillResult.seed,
      cycleExhausted: drillResult.cycleExhausted,
      cycleNotice: drillResult.cycleNotice,
      difficulty: drillResult.difficulty,
      skills: drillResult.skills,
    };
  }

  // Fallback to legacy question deck selector for weak_area / practical
  const legacyDeck = selectQuestionsForDeck({
    skills: skills || [],
    mode: mode as QuizMode,
    limit: count,
  });

  const sanitized = legacyDeck.map(sanitizeQuestionForClient);

  return {
    mode,
    questions: sanitized,
    totalQuestions: sanitized.length,
  };
}

/**
 * Evaluates a user submission deterministically, updates XP ledger, SRS, attempts, mistakes,
 * and user_question_history for no-repeat tracking.
 */
export async function submitQuizAnswer(params: {
  userId: string;
  payload: QuizSubmissionPayload;
}): Promise<QuizEvaluationResult> {
  const { userId, payload } = params;
  const { questionId, selectedOptionId, ms, answerChanges, confidence } = payload;

  // Check new canonical question bank first
  const m2Question = getM2QuestionById(questionId);

  if (m2Question) {
    const isCorrect = m2Question.correctOptionIds.includes(selectedOptionId.trim());
    const targetMs =
      m2Question.difficulty === "basic"
        ? 45_000
        : m2Question.difficulty === "medium"
        ? 60_000
        : 90_000;

    const speedBonus = isCorrect ? computeSpeedBonus(ms, targetMs, 5) : 0;
    const calibration = computeCalibration(confidence ?? undefined, isCorrect);
    const quality = isCorrect ? (speedBonus > 0 ? 5 : 4) : 1;

    // 1. Update question history for no-repeat cycle tracking
    try {
      const historyRepo = getQuestionHistoryRepository(userId);
      await historyRepo.recordQuestionResult(questionId, isCorrect);
    } catch (err) {
      console.warn("Failed to record question history result:", err);
    }

    // 2. SM-2 Spaced Repetition calculation
    try {
      const srsRepo = getSrsRepository(userId);
      const existingCard = await srsRepo.getCard(questionId);
      const sm2Result = calculateSm2(
        existingCard
          ? {
              ease: existingCard.ease,
              interval: existingCard.interval,
              repetitions: existingCard.repetitions,
            }
          : {},
        quality
      );

      await srsRepo.upsertCard({
        itemId: questionId,
        ease: sm2Result.ease,
        interval: sm2Result.interval,
        due: sm2Result.due,
        repetitions: sm2Result.repetitions,
      });
    } catch (err) {
      console.warn("Failed to update SRS card:", err);
    }

    // 3. Record attempt
    try {
      const attemptRepo = getAttemptRepository(userId);
      await attemptRepo.recordAttempt({
        module: "m2",
        itemId: questionId,
        answer: { selectedOptionId, answerChanges },
        correct: isCorrect,
        ms,
        changes: answerChanges,
        confidence: confidence ?? null,
      });
    } catch (err) {
      console.warn("Failed to record quiz attempt:", err);
    }

    // 4. Update mistake if incorrect
    if (!isCorrect) {
      try {
        const mistakeRepo = getMistakeRepository(userId);
        const distractorReason =
          m2Question.explanation.whyWrong[selectedOptionId] ??
          `Selected incorrect option '${selectedOptionId}'`;
        await mistakeRepo.recordMistake(
          "m2",
          questionId,
          `[${m2Question.skillId} - ${m2Question.topic}] ${distractorReason}`
        );
      } catch (err) {
        console.warn("Failed to record quiz mistake:", err);
      }
    }

    // 5. Award XP
    let xpEarned = 0;
    if (isCorrect) {
      try {
        const xpRepo = getXpRepository(userId);
        const baseAmount = 20;
        const amount = baseAmount + speedBonus;
        const refId = `m2_quiz_${questionId}_${Date.now()}`;
        const awardRes = await xpRepo.awardXp("quiz", amount, refId);
        xpEarned = awardRes.added ? (awardRes.event?.amount ?? amount) : 0;
      } catch (err) {
        console.warn("Failed to award quiz XP:", err);
        xpEarned = 20 + speedBonus;
      }
    }

    // 6. Build 5-part feedback explanation
    const distractorTakedown = m2Question.explanation.whyWrong[selectedOptionId];

    return {
      questionId,
      correct: isCorrect,
      correctId: m2Question.correctOptionIds[0],
      selectedOptionId,
      xpEarned,
      speedBonus,
      calibration,
      explanation: {
        why: m2Question.explanation.whyCorrect,
        distractorTakedown,
        allDistractors: m2Question.explanation.whyWrong,
        takeaway: m2Question.explanation.interviewTakeaway,
        followUp: m2Question.explanation.followUp,
      },
    };
  }

  // Fallback to legacy question bank
  const legacyQuestion = getQuizQuestionById(questionId);
  if (!legacyQuestion) {
    throw new Error(`Quiz question not found: ${questionId}`);
  }

  const isCorrect = selectedOptionId.trim() === legacyQuestion.correctId.trim();
  const speedBonus = isCorrect ? computeSpeedBonus(ms, 45_000, 5) : 0;
  const calibration = computeCalibration(confidence ?? undefined, isCorrect);
  const quality = isCorrect ? (speedBonus > 0 ? 5 : 4) : 1;

  // Record history
  try {
    const historyRepo = getQuestionHistoryRepository(userId);
    await historyRepo.recordQuestionResult(questionId, isCorrect);
  } catch (err) {
    console.warn("Failed to record question history result:", err);
  }

  // SRS
  try {
    const srsRepo = getSrsRepository(userId);
    const existingCard = await srsRepo.getCard(questionId);
    const sm2Result = calculateSm2(
      existingCard
        ? {
            ease: existingCard.ease,
            interval: existingCard.interval,
            repetitions: existingCard.repetitions,
          }
        : {},
      quality
    );

    await srsRepo.upsertCard({
      itemId: questionId,
      ease: sm2Result.ease,
      interval: sm2Result.interval,
      due: sm2Result.due,
      repetitions: sm2Result.repetitions,
    });
  } catch (err) {
    console.warn("Failed to update SRS card:", err);
  }

  // Attempt
  try {
    const attemptRepo = getAttemptRepository(userId);
    await attemptRepo.recordAttempt({
      module: "m2",
      itemId: questionId,
      answer: { selectedOptionId, answerChanges },
      correct: isCorrect,
      ms,
      changes: answerChanges,
      confidence: confidence ?? null,
    });
  } catch (err) {
    console.warn("Failed to record quiz attempt:", err);
  }

  // Mistake
  if (!isCorrect) {
    try {
      const mistakeRepo = getMistakeRepository(userId);
      const distractorReason =
        legacyQuestion.explanation.distractors[selectedOptionId] ??
        `Selected incorrect option '${selectedOptionId}'`;
      await mistakeRepo.recordMistake(
        "m2",
        questionId,
        `[${legacyQuestion.skill} - ${legacyQuestion.type}] ${distractorReason}`
      );
    } catch (err) {
      console.warn("Failed to record quiz mistake:", err);
    }
  }

  // XP
  let xpEarned = 0;
  if (isCorrect) {
    try {
      const xpRepo = getXpRepository(userId);
      const baseAmount = 20;
      const amount = baseAmount + speedBonus;
      const refId = `m2_quiz_${questionId}_${Date.now()}`;
      const awardRes = await xpRepo.awardXp("quiz", amount, refId);
      xpEarned = awardRes.added ? (awardRes.event?.amount ?? amount) : 0;
    } catch (err) {
      console.warn("Failed to award quiz XP:", err);
      xpEarned = 20 + speedBonus;
    }
  }

  const distractorTakedown = legacyQuestion.explanation.distractors[selectedOptionId];

  return {
    questionId,
    correct: isCorrect,
    correctId: legacyQuestion.correctId,
    selectedOptionId,
    xpEarned,
    speedBonus,
    calibration,
    explanation: {
      why: legacyQuestion.explanation.why,
      distractorTakedown,
      allDistractors: legacyQuestion.explanation.distractors,
      takeaway: legacyQuestion.explanation.takeaway,
      repoEvidence: legacyQuestion.explanation.repoEvidence,
    },
  };
}
