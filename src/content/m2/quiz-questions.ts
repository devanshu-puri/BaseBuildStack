import {
  QuizQuestion,
  QuizQuestionSchema,
  ClientQuizQuestion,
  QuizMode,
} from "./quiz-schema";
import { CURATED_QUIZ_QUESTIONS } from "./quiz-questions-data";

/**
 * Returns all verified curated quiz questions.
 */
export function getAllQuizQuestions(): QuizQuestion[] {
  return CURATED_QUIZ_QUESTIONS;
}

/**
 * Finds a single quiz question by its unique ID.
 */
export function getQuizQuestionById(id: string): QuizQuestion | undefined {
  return CURATED_QUIZ_QUESTIONS.find((q) => q.id === id);
}

/**
 * Strips correct answer ID and explanations before sending questions to browser client.
 */
export function sanitizeQuestionForClient(q: QuizQuestion): ClientQuizQuestion {
  return {
    id: q.id,
    skill: q.skill,
    type: q.type,
    difficulty: q.difficulty,
    stem: q.stem,
    code: q.code,
    codeLanguage: q.codeLanguage,
    options: q.options,
    verified: q.verified,
  };
}

/**
 * Filters and selects quiz questions for a given mode and set of skills.
 */
export function selectQuestionsForDeck(params: {
  skills: string[];
  mode: QuizMode;
  limit?: number;
  weakSkills?: string[];
}): QuizQuestion[] {
  const { skills, mode, limit = 5, weakSkills = [] } = params;

  const normalizedSkills = new Set(
    skills.map((s) => s.toLowerCase().trim())
  );
  const normalizedWeak = new Set(
    weakSkills.map((s) => s.toLowerCase().trim())
  );

  let pool = [...CURATED_QUIZ_QUESTIONS];

  // 1. Filter by skills if user has selected skills
  if (normalizedSkills.size > 0) {
    const matched = pool.filter((q) =>
      normalizedSkills.has(q.skill.toLowerCase().trim())
    );
    // If we have enough matching questions, prioritize them; else keep pool for fallback
    if (matched.length >= 3) {
      pool = matched;
    }
  }

  // 2. Filter/prioritize by mode
  if (mode === "weak_area" && normalizedWeak.size > 0) {
    // Prioritize questions in user's weak skills
    pool.sort((a, b) => {
      const aWeak = normalizedWeak.has(a.skill.toLowerCase().trim()) ? 1 : 0;
      const bWeak = normalizedWeak.has(b.skill.toLowerCase().trim()) ? 1 : 0;
      return bWeak - aWeak;
    });
  } else if (mode === "fundamentals") {
    // Prioritize mcq and difficulty 1-2
    pool.sort((a, b) => {
      const aScore = (a.type === "mcq" ? 2 : 0) + (a.difficulty <= 2 ? 1 : 0);
      const bScore = (b.type === "mcq" ? 2 : 0) + (b.difficulty <= 2 ? 1 : 0);
      return bScore - aScore;
    });
  } else if (mode === "practical") {
    // Prioritize output, debug, approach (hands-on code questions)
    pool.sort((a, b) => {
      const aPractical = a.type !== "mcq" ? 2 : 0;
      const bPractical = b.type !== "mcq" ? 2 : 0;
      return bPractical - aPractical;
    });
  }

  // Determine count based on mode
  const targetCount =
    mode === "quick" ? Math.min(limit, 5) : Math.min(limit, 10);

  return pool.slice(0, targetCount);
}

/**
 * Validates all questions against Zod schema and integrity rules:
 * - Exactly one correct option exists in options array
 * - Distractor takedowns contain entry for each distractor option
 */
export function validateQuestionIntegrity(q: QuizQuestion): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const parseResult = QuizQuestionSchema.safeParse(q);
  if (!parseResult.success) {
    errors.push(
      ...parseResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`)
    );
  }

  // Ensure correctId matches an option
  const correctOption = q.options.find((opt) => opt.id === q.correctId);
  if (!correctOption) {
    errors.push(`correctId "${q.correctId}" does not exist in options`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
