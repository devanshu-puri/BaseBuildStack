import {
  ALL_BLITZ_PROBLEMS,
  getBlitzProblemById,
  BlitzProblem,
} from "@/content/m1/problems";
import {
  getSrsRepository,
  getAttemptRepository,
  getMistakeRepository,
  getXpRepository,
  getStreakRepository,
  getProgressRepository,
} from "@/lib/db/repositories";
import { checkEntitlements } from "@/lib/payments/entitlements";
import { computeSpeedBonus, computeCalibration } from "@/lib/engine/scoring";
import { calculateSm2, mapOutcomeToQuality } from "@/lib/engine/sm2";
import { ConfidenceRating } from "@/lib/engine/types";

export interface BlitzSessionCard {
  problem: BlitzProblem;
  isRevision: boolean;
  patternOptions: string[]; // 4 randomized options
}

export interface BlitzSubmissionParams {
  userId: string;
  problemId: string;
  selectedPattern: string;
  selectedInvariantIndex: number;
  ms: number;
  confidence?: ConfidenceRating;
}

export interface BlitzVerdict {
  isCorrect: boolean;
  patternCorrect: boolean;
  invariantCorrect: boolean;
  speedBonus: number;
  xpAwarded: number;
  totalXp: number;
  nextDue: Date;
  explanation: BlitzProblem["explanation"];
  pseudocode: string;
  timeComplexity: string;
  spaceComplexity: string;
  calibration: string;
}

export type BlitzDifficulty = "easy" | "medium" | "hard";

export interface BlitzDeckResult {
  cards: BlitzSessionCard[];
  dailyQuotaReached: boolean;
  clearedBank: boolean;
}

/**
 * Creates a deterministic 32-bit PRNG (Mulberry32) or uses Math.random
 */
function createPrng(seed?: number): () => number {
  if (seed === undefined) {
    return () => Math.random();
  }
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Randomize array elements with Fisher-Yates shuffle (optionally seeded)
 */
export function shuffleArray<T>(arr: T[], seed?: number): T[] {
  const result = [...arr];
  const rand = createPrng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Interleave problems across distinct patterns/categories to prevent clustering
 */
function interleaveByPattern(problems: BlitzProblem[], rand: () => number): BlitzProblem[] {
  if (problems.length <= 1) return problems;

  const groups = new Map<string, BlitzProblem[]>();
  for (const prob of problems) {
    const key = prob.category || prob.pattern;
    const list = groups.get(key) || [];
    list.push(prob);
    groups.set(key, list);
  }

  // Shuffle the category order so different patterns lead
  const categoryKeys = Array.from(groups.keys());
  for (let i = categoryKeys.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [categoryKeys[i], categoryKeys[j]] = [categoryKeys[j], categoryKeys[i]];
  }

  const interleaved: BlitzProblem[] = [];
  let remainingCount = problems.length;

  while (remainingCount > 0) {
    let addedInPass = 0;
    for (const key of categoryKeys) {
      const bucket = groups.get(key);
      if (bucket && bucket.length > 0) {
        interleaved.push(bucket.shift()!);
        remainingCount--;
        addedInPass++;
      }
    }
    if (addedInPass === 0) break;
  }

  return interleaved;
}

/**
 * Loads a Pattern Blitz deck for user, prioritizing SRS due cards,
 * excluding already-solved problems, interleaving patterns, and falling
 * back to oldest-correct problems when the bank is cleared.
 */
export async function getBlitzDeck(
  userId: string,
  deckSize = 10,
  difficulty?: BlitzDifficulty,
  seed?: number
): Promise<BlitzDeckResult> {
  const rand = createPrng(seed);

  // Check daily limit for free tier
  const entitlements = await checkEntitlements(userId);
  if (!entitlements.isPro) {
    const todayStr = new Date().toISOString().split("T")[0];
    const attemptRepo = getAttemptRepository(userId);
    const recent = await attemptRepo.getModuleAttempts("m1", 20);
    const todayAttempts = recent.filter(
      (a) => new Date(a.ts).toISOString().split("T")[0] === todayStr
    );

    if (todayAttempts.length >= entitlements.features.maxBlitzPerDay) {
      return { cards: [], dailyQuotaReached: true, clearedBank: false };
    }
  }

  // 1. Fetch due revision cards
  const srsRepo = getSrsRepository(userId);
  const dueCards = await srsRepo.getDueCards(new Date());

  const selectedProblems: { problem: BlitzProblem; isRevision: boolean }[] = [];
  const selectedIds = new Set<string>();

  for (const srs of dueCards) {
    const prob = getBlitzProblemById(srs.itemId);
    if (prob && !selectedIds.has(prob.id)) {
      if (difficulty && prob.difficulty !== difficulty) {
        continue;
      }
      selectedProblems.push({ problem: prob, isRevision: true });
      selectedIds.add(prob.id);
      if (selectedProblems.length >= deckSize) break;
    }
  }

  // 2. Fetch solved/completed problems to exclude from candidate pool
  const progressRepo = getProgressRepository(userId);
  const m1Progress = await progressRepo.getModuleProgress("m1");
  const completedProgress = m1Progress.filter((p) => p.status === "completed");
  const solvedProblemIds = new Set(completedProgress.map((p) => p.itemId));

  // 3. Filter unseen candidate pool
  const unsolvedPool = ALL_BLITZ_PROBLEMS.filter(
    (p) =>
      !selectedIds.has(p.id) &&
      !solvedProblemIds.has(p.id) &&
      (!difficulty || p.difficulty === difficulty)
  );

  let clearedBank = false;

  // 4. Fill remaining cards from unsolved pool
  if (selectedProblems.length < deckSize) {
    if (unsolvedPool.length > 0) {
      const shuffled = shuffleArray(unsolvedPool, seed);
      const interleaved = interleaveByPattern(shuffled, rand);

      for (const prob of interleaved) {
        selectedProblems.push({ problem: prob, isRevision: false });
        selectedIds.add(prob.id);
        if (selectedProblems.length >= deckSize) break;
      }

      // Check if fresh bank for this difficulty has now been exhausted
      const remainingUnsolved = ALL_BLITZ_PROBLEMS.some(
        (p) =>
          !selectedIds.has(p.id) &&
          !solvedProblemIds.has(p.id) &&
          (!difficulty || p.difficulty === difficulty)
      );
      clearedBank = !remainingUnsolved;
    }

    // 5. Fallback to oldest-correct problems for revision if pool is empty or exhausted
    if (selectedProblems.length < deckSize) {
      clearedBank = true;

      const oldestFirst = [...completedProgress].sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeA - timeB;
      });

      for (const prog of oldestFirst) {
        const prob = getBlitzProblemById(prog.itemId);
        if (prob && !selectedIds.has(prob.id)) {
          if (difficulty && prob.difficulty !== difficulty) {
            continue;
          }
          selectedProblems.push({ problem: prob, isRevision: true });
          selectedIds.add(prob.id);
          if (selectedProblems.length >= deckSize) break;
        }
      }
    }
  } else {
    const remainingUnsolved = ALL_BLITZ_PROBLEMS.some(
      (p) => !solvedProblemIds.has(p.id) && (!difficulty || p.difficulty === difficulty)
    );
    clearedBank = !remainingUnsolved;
  }

  // 6. Prepare display deck with randomized pattern options
  const cards: BlitzSessionCard[] = selectedProblems.map(({ problem, isRevision }, idx) => {
    const patternOptions = shuffleArray(
      [problem.pattern, ...problem.patternDistractors],
      seed !== undefined ? seed + idx + 100 : undefined
    );
    return {
      problem,
      isRevision,
      patternOptions,
    };
  });

  return { cards, dailyQuotaReached: false, clearedBank };
}

/**
 * Submits an answer to a Blitz problem, updating SM-2 SRS, XP ledger, and attempts.
 */
export async function submitBlitzAnswer(
  params: BlitzSubmissionParams
): Promise<BlitzVerdict> {
  const { userId, problemId, selectedPattern, selectedInvariantIndex, ms, confidence } =
    params;

  const problem = getBlitzProblemById(problemId);
  if (!problem) {
    throw new Error(`Problem not found: ${problemId}`);
  }

  // 1. Deterministic evaluation
  const patternCorrect =
    selectedPattern.trim().toLowerCase() === problem.pattern.trim().toLowerCase();
  const invariantCorrect = selectedInvariantIndex === problem.correctInvariantIndex;
  const isCorrect = patternCorrect && invariantCorrect;

  const speedBonus = isCorrect ? computeSpeedBonus(ms, 30_000, 5) : 0;
  const calibration = computeCalibration(confidence, isCorrect);
  const quality = mapOutcomeToQuality(isCorrect, ms, confidence);

  // 2. SM-2 Spaced Repetition calculation
  const srsRepo = getSrsRepository(userId);
  const existingCard = await srsRepo.getCard(problemId);

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
    itemId: problemId,
    ease: sm2Result.ease,
    interval: sm2Result.interval,
    due: sm2Result.due,
    repetitions: sm2Result.repetitions,
  });

  // 3. Record attempt
  const attemptRepo = getAttemptRepository(userId);
  await attemptRepo.recordAttempt({
    module: "m1",
    itemId: problemId,
    answer: { selectedPattern, selectedInvariantIndex },
    correct: isCorrect,
    ms,
    confidence,
  });

  // 4. Update mistake if incorrect
  if (!isCorrect) {
    const mistakeRepo = getMistakeRepository(userId);
    const reason = !patternCorrect
      ? `Misidentified pattern: picked '${selectedPattern}', correct was '${problem.pattern}'`
      : `Incorrect invariant selection for ${problem.pattern}`;
    await mistakeRepo.recordMistake("m1", problemId, reason);
  }

  // 5. Award XP (idempotently per problem)
  let xpAwarded = 0;
  let totalXp = 0;
  const xpRepo = getXpRepository(userId);

  if (isCorrect) {
    const amount = 10 + speedBonus;
    const refId = `blitz_${problemId}`;
    const xpRes = await xpRepo.awardXp("blitz_solve", amount, refId);
    xpAwarded = xpRes.added ? amount : 0;
    totalXp = xpRes.totalXp;
  } else {
    totalXp = await xpRepo.getTotalXp();
  }

  // 6. Update Streak & Progress
  const streakRepo = getStreakRepository(userId);
  await streakRepo.recordActivity();

  const progressRepo = getProgressRepository(userId);
  await progressRepo.setProgress(
    "m1",
    problemId,
    isCorrect ? "completed" : "in_progress",
    isCorrect ? 2 : 1
  );

  return {
    isCorrect,
    patternCorrect,
    invariantCorrect,
    speedBonus,
    xpAwarded,
    totalXp,
    nextDue: sm2Result.due,
    explanation: problem.explanation,
    pseudocode: problem.pseudocode,
    timeComplexity: problem.timeComplexity,
    spaceComplexity: problem.spaceComplexity,
    calibration,
  };
}
