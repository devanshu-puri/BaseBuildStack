import {
  M2Question,
  M2QuestionDifficulty,
  M2QuestionMode,
  ClientM2Question,
  sanitizeM2QuestionForClient,
} from "./question-schema";
import { LANGUAGE_QUESTIONS } from "./data/languages";
import { FRONTEND_QUESTIONS } from "./data/frontend";
import { BACKEND_QUESTIONS } from "./data/backend";
import { DATABASE_QUESTIONS } from "./data/databases";
import { DEVOPS_QUESTIONS } from "./data/devops-infra";
import { FUNDAMENTALS_QUESTIONS } from "./data/fundamentals";

export const ALL_M2_QUESTIONS: M2Question[] = [
  ...LANGUAGE_QUESTIONS,
  ...FRONTEND_QUESTIONS,
  ...BACKEND_QUESTIONS,
  ...DATABASE_QUESTIONS,
  ...DEVOPS_QUESTIONS,
  ...FUNDAMENTALS_QUESTIONS,
];

/**
 * Returns all published questions from the question bank.
 */
export function getAllM2Questions(): M2Question[] {
  return ALL_M2_QUESTIONS.filter((q) => q.status === "published");
}

/**
 * Retrieves a single question by its unique ID.
 */
export function getM2QuestionById(id: string): M2Question | undefined {
  return ALL_M2_QUESTIONS.find((q) => q.id === id);
}

/**
 * Retrieves all published questions matching a specific canonical skillId.
 */
export function getQuestionsForSkill(
  skillId: string,
  filter?: {
    difficulty?: M2QuestionDifficulty;
    mode?: M2QuestionMode;
    minFrequency?: number;
  }
): M2Question[] {
  const normSkill = skillId.toLowerCase().trim();

  return ALL_M2_QUESTIONS.filter((q) => {
    if (q.status !== "published") return false;
    if (q.skillId.toLowerCase().trim() !== normSkill) return false;

    if (filter?.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter?.mode && !q.mode.includes(filter.mode)) return false;
    if (
      filter?.minFrequency !== undefined &&
      q.interviewFrequency < filter.minFrequency
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Retrieves published questions matching an array of skills, useful for user stack drills.
 */
export function getQuestionsForSkills(
  skillIds: string[],
  filter?: {
    difficulty?: M2QuestionDifficulty;
    mode?: M2QuestionMode;
    minFrequency?: number;
    limit?: number;
  }
): M2Question[] {
  const skillSet = new Set(skillIds.map((s) => s.toLowerCase().trim()));

  const matched = ALL_M2_QUESTIONS.filter((q) => {
    if (q.status !== "published") return false;
    if (!skillSet.has(q.skillId.toLowerCase().trim())) return false;

    if (filter?.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter?.mode && !q.mode.includes(filter.mode)) return false;
    if (
      filter?.minFrequency !== undefined &&
      q.interviewFrequency < filter.minFrequency
    ) {
      return false;
    }

    return true;
  });

  if (filter?.limit && filter.limit > 0) {
    return matched.slice(0, filter.limit);
  }

  return matched;
}

/**
 * Strips answers and explanations from an array of questions before transmitting to client.
 */
export function sanitizeQuestionsForClient(
  questions: M2Question[]
): ClientM2Question[] {
  return questions.map(sanitizeM2QuestionForClient);
}
