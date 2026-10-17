import {
  M2Question,
  M2QuestionDifficulty,
  ClientM2Question,
  sanitizeM2QuestionForClient,
  M2Option,
} from "@/content/m2/question-schema";
import { ALL_M2_QUESTIONS, getM2QuestionById } from "@/content/m2/question-bank";
import { getProfileRepository } from "@/lib/db/repositories/profile-repo";
import { getQuestionHistoryRepository } from "@/lib/db/repositories/question-history-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";

export type DrillDifficultyFilter = M2QuestionDifficulty | "mixed";

export interface DrillDeckOptions {
  userId: string;
  mode?: "drills" | "fundamentals" | "quick" | "weak_area";
  skillIds?: string[];
  difficulty?: DrillDifficultyFilter;
  count?: number;
  focusWeak?: boolean;
  seed?: number;
}

export interface PreparedDrillQuestion {
  question: ClientQuizQuestion;
  shuffledOptions: M2Option[];
}

// ClientQuizQuestion compatibility type for unified runner
export interface ClientQuizQuestion extends ClientM2Question {
  skill: string;
  stem: string;
}

export interface DrillDeckResult {
  sessionId: string;
  mode: string;
  questions: ClientQuizQuestion[];
  totalQuestions: number;
  seed: number;
  cycleExhausted: boolean;
  cycleNotice?: string;
  difficulty: DrillDifficultyFilter;
  skills: string[];
}

/**
 * Creates a deterministic 32-bit PRNG (Mulberry32)
 */
export function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates array shuffle
 */
export function seededShuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Interleaves questions so that the same skill does not appear 3 or more times consecutively.
 */
export function interleaveSkills(questions: M2Question[]): M2Question[] {
  if (questions.length <= 2) return questions;

  const result = [...questions];
  for (let i = 2; i < result.length; i++) {
    const prevPrevSkill = result[i - 2].skillId.toLowerCase();
    const prevSkill = result[i - 1].skillId.toLowerCase();
    const currentSkill = result[i].skillId.toLowerCase();

    if (prevPrevSkill === prevSkill && prevSkill === currentSkill) {
      // Find the next question with a different skill and swap
      let swapIdx = -1;
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].skillId.toLowerCase() !== currentSkill) {
          swapIdx = j;
          break;
        }
      }
      if (swapIdx !== -1) {
        const temp = result[i];
        result[i] = result[swapIdx];
        result[swapIdx] = temp;
      }
    }
  }

  return result;
}

/**
 * Shuffles options for a question unless lockOptionOrder is true.
 * Preserves original option IDs so grading matches deterministic answers.
 */
export function prepareQuestionOptions(
  q: M2Question,
  prng: () => number
): M2Option[] {
  if (q.lockOptionOrder) {
    return [...q.options];
  }
  return seededShuffle(q.options, prng);
}

/**
 * Counts unseen questions per skill for a given user and optional difficulty.
 */
export async function getUnseenCountPerSkill(
  userId: string,
  difficulty?: DrillDifficultyFilter
): Promise<Record<string, { total: number; unseen: number }>> {
  const historyRepo = getQuestionHistoryRepository(userId);
  const seenIds = new Set(await historyRepo.getSeenQuestionIds());

  const counts: Record<string, { total: number; unseen: number }> = {};

  for (const q of ALL_M2_QUESTIONS) {
    if (q.status !== "published") continue;
    if (difficulty && difficulty !== "mixed" && q.difficulty !== difficulty) {
      continue;
    }

    const s = q.skillId.toLowerCase();
    if (!counts[s]) {
      counts[s] = { total: 0, unseen: 0 };
    }
    counts[s].total++;
    if (!seenIds.has(q.id)) {
      counts[s].unseen++;
    }
  }

  return counts;
}

/**
 * Builds a personalized drill deck with no-repeat history shuffle,
 * option randomization, and cycle exhaustion fallback.
 */
export async function buildDrillDeck(
  options: DrillDeckOptions
): Promise<DrillDeckResult> {
  const {
    userId,
    mode = "drills",
    difficulty = "mixed",
    count = 10,
    focusWeak = false,
  } = options;

  const sessionSeed = options.seed ?? Math.floor(Math.random() * 1_000_000_000);
  const prng = createMulberry32(sessionSeed);

  // 1. Determine active skills
  let activeSkills = options.skillIds && options.skillIds.length > 0 ? options.skillIds : [];
  if (activeSkills.length === 0) {
    try {
      const profileRepo = getProfileRepository(userId);
      const profile = await profileRepo.getProfile();
      if (profile?.skills && profile.skills.length > 0) {
        activeSkills = profile.skills.filter((s) => s.confirmed).map((s) => s.name);
      }
    } catch (err) {
      console.warn("Failed to retrieve profile skills for drill deck:", err);
    }
  }

  // Fallback defaults if no skills configured
  if (activeSkills.length === 0) {
    activeSkills = [
      "react",
      "typescript",
      "javascript",
      "nodejs",
      "sql",
      "system-design",
      "docker",
    ];
  }

  const normalizedSkills = new Set(
    activeSkills.map((s) => s.toLowerCase().trim())
  );

  // 2. Identify weak skills if focusWeak or weak_area mode
  const weakSkillSet = new Set<string>();
  if (focusWeak || mode === "weak_area") {
    try {
      const mistakeRepo = getMistakeRepository(userId);
      const mistakes = await mistakeRepo.getMistakes("m2");
      for (const m of mistakes) {
        const q = getM2QuestionById(m.itemId);
        if (q) {
          weakSkillSet.add(q.skillId.toLowerCase().trim());
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve mistakes for weak skills filter:", err);
    }
  }

  // 3. Filter published questions matching skills, difficulty, and mode
  let pool = ALL_M2_QUESTIONS.filter((q) => {
    if (q.status !== "published") return false;

    // Skill filter
    if (!normalizedSkills.has(q.skillId.toLowerCase().trim())) {
      return false;
    }

    // Difficulty filter
    if (difficulty !== "mixed" && q.difficulty !== difficulty) {
      return false;
    }

    // Mode filter: Core fundamentals prioritizes high frequency questions
    if (mode === "fundamentals") {
      return q.interviewFrequency >= 4 || q.mode.includes("core_fundamentals");
    }

    return true;
  });

  // If pool has zero matches, broaden as fallback to all published questions of chosen difficulty
  if (pool.length === 0) {
    pool = ALL_M2_QUESTIONS.filter((q) => {
      if (q.status !== "published") return false;
      if (difficulty !== "mixed" && q.difficulty !== difficulty) return false;
      return true;
    });
  }

  // 4. Query question history for no-repeat selection
  const historyRepo = getQuestionHistoryRepository(userId);
  const seenIds = new Set(await historyRepo.getSeenQuestionIds());
  const questionIds = pool.map((q) => q.id);
  const historyMap = await historyRepo.getHistoryForQuestions(questionIds);

  const unseenQuestions: M2Question[] = [];
  const seenQuestions: M2Question[] = [];

  for (const q of pool) {
    if (!seenIds.has(q.id)) {
      unseenQuestions.push(q);
    } else {
      seenQuestions.push(q);
    }
  }

  let selectedQuestions: M2Question[] = [];
  let cycleExhausted = false;
  let cycleNotice: string | undefined = undefined;

  if (unseenQuestions.length >= count) {
    // We have plenty of unseen questions! Prioritize weak skills among unseen if requested
    if (weakSkillSet.size > 0) {
      unseenQuestions.sort((a, b) => {
        const aWeak = weakSkillSet.has(a.skillId.toLowerCase()) ? 1 : 0;
        const bWeak = weakSkillSet.has(b.skillId.toLowerCase()) ? 1 : 0;
        return bWeak - aWeak;
      });
    }
    // Seeded shuffle of candidates
    selectedQuestions = seededShuffle(unseenQuestions, prng).slice(0, count);
  } else {
    // Unseen questions pool is smaller than requested count
    selectedQuestions.push(...unseenQuestions);

    if (unseenQuestions.length === 0) {
      cycleExhausted = true;
      const diffLabel = difficulty === "mixed" ? "" : `${difficulty} `;
      cycleNotice = `You've completed all unseen ${diffLabel}questions for your stack! Now revisiting your previous mistakes first.`;
    }

    // Sort seen questions: previously wrong first (or highest wrongCount), then oldest seen
    seenQuestions.sort((a, b) => {
      const aHist = historyMap.get(a.id);
      const bHist = historyMap.get(b.id);

      const aWrong = aHist ? aHist.wrongCount : 0;
      const bWrong = bHist ? bHist.wrongCount : 0;
      if (bWrong !== aWrong) return bWrong - aWrong;

      const aLastSeen = aHist?.lastSeenAt ? new Date(aHist.lastSeenAt).getTime() : 0;
      const bLastSeen = bHist?.lastSeenAt ? new Date(bHist.lastSeenAt).getTime() : 0;
      return aLastSeen - bLastSeen;
    });

    const needed = count - selectedQuestions.length;
    const additional = seenQuestions.slice(0, needed);
    selectedQuestions.push(...additional);
  }

  // 5. Interleave skills so the same skill does not appear 3+ times in a row
  selectedQuestions = interleaveSkills(selectedQuestions);

  // 6. Option order shuffle (keeping option IDs mapped) + client sanitization
  const clientQuestions: ClientQuizQuestion[] = selectedQuestions.map((q) => {
    const shuffledOptions = prepareQuestionOptions(q, prng);
    const sanitized = sanitizeM2QuestionForClient(q);

    return {
      ...sanitized,
      options: shuffledOptions,
      // Compatibility aliases for the UI runner
      skill: q.skillId,
      stem: q.prompt,
    };
  });

  const sessionId = `m2_drill_${Date.now()}_${sessionSeed}`;

  return {
    sessionId,
    mode,
    questions: clientQuestions,
    totalQuestions: clientQuestions.length,
    seed: sessionSeed,
    cycleExhausted,
    cycleNotice,
    difficulty,
    skills: activeSkills,
  };
}
