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
import { getProfileRepository } from "@/lib/db/repositories/profile-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getSrsRepository } from "@/lib/db/repositories/srs-repo";
import { computeSpeedBonus, computeCalibration, calculateSm2 } from "@/lib/engine";

export interface CreateQuizSessionParams {
  userId: string;
  mode: QuizMode;
  limit?: number;
}

export interface QuizSessionResponse {
  mode: QuizMode;
  questions: ClientQuizQuestion[];
  totalQuestions: number;
}

/**
 * Creates an active quiz session with personalized questions based on user's confirmed skills.
 */
export async function createQuizSession(
  params: CreateQuizSessionParams
): Promise<QuizSessionResponse> {
  const { userId, mode, limit } = params;

  // 1. Fetch user's confirmed skills
  let userSkills: string[] = [];
  try {
    const profileRepo = getProfileRepository(userId);
    const profile = await profileRepo.getProfile();
    if (profile?.skills && profile.skills.length > 0) {
      userSkills = profile.skills
        .filter((s) => s.confirmed)
        .map((s) => s.name);
    }
  } catch (err) {
    console.warn("Failed to retrieve profile for quiz personalization:", err);
  }

  // Fallback defaults if no confirmed skills yet
  if (userSkills.length === 0) {
    userSkills = ["React", "TypeScript", "Node.js", "PostgreSQL", "System Design", "Redis", "Docker"];
  }

  // 2. If weak_area mode, inspect past mistakes to identify weak skills
  const weakSkills: string[] = [];
  if (mode === "weak_area") {
    try {
      const mistakeRepo = getMistakeRepository(userId);
      const mistakes = await mistakeRepo.getMistakes("m2");
      for (const m of mistakes) {
        const q = getQuizQuestionById(m.itemId);
        if (q && !weakSkills.includes(q.skill)) {
          weakSkills.push(q.skill);
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve mistakes for weak_area mode:", err);
    }
  }

  // 3. Select questions for the chosen mode
  const deck = selectQuestionsForDeck({
    skills: userSkills,
    mode,
    limit,
    weakSkills,
  });

  const sanitized = deck.map(sanitizeQuestionForClient);

  return {
    mode,
    questions: sanitized,
    totalQuestions: sanitized.length,
  };
}

/**
 * Evaluates a user submission deterministically, updates XP ledger, SRS, attempts, and mistakes.
 */
export async function submitQuizAnswer(params: {
  userId: string;
  payload: QuizSubmissionPayload;
}): Promise<QuizEvaluationResult> {
  const { userId, payload } = params;
  const { questionId, selectedOptionId, ms, answerChanges, confidence } = payload;

  const question = getQuizQuestionById(questionId);
  if (!question) {
    throw new Error(`Quiz question not found: ${questionId}`);
  }

  // 1. Deterministic evaluation: exact option ID match
  const isCorrect = selectedOptionId.trim() === question.correctId.trim();
  const speedBonus = isCorrect ? computeSpeedBonus(ms, 45_000, 5) : 0;
  const calibration = computeCalibration(confidence ?? undefined, isCorrect);

  // Quality score for SM-2
  const quality = isCorrect ? (speedBonus > 0 ? 5 : 4) : 1;

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
        question.explanation.distractors[selectedOptionId] ??
        `Selected incorrect option '${selectedOptionId}'`;
      await mistakeRepo.recordMistake(
        "m2",
        questionId,
        `[${question.skill} - ${question.type}] ${distractorReason}`
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
  const distractorTakedown = question.explanation.distractors[selectedOptionId];

  return {
    questionId,
    correct: isCorrect,
    correctId: question.correctId,
    selectedOptionId,
    xpEarned,
    speedBonus,
    calibration,
    explanation: {
      why: question.explanation.why,
      distractorTakedown,
      allDistractors: question.explanation.distractors,
      takeaway: question.explanation.takeaway,
      repoEvidence: question.explanation.repoEvidence,
    },
  };
}
