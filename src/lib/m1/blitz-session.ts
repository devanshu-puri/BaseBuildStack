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

/**
 * Randomize array elements deterministically or with standard shuffle
 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Loads a Pattern Blitz deck for user, prioritizing SRS due cards.
 */
export async function getBlitzDeck(
  userId: string,
  deckSize = 10
): Promise<{ cards: BlitzSessionCard[]; dailyQuotaReached: boolean }> {
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
      return { cards: [], dailyQuotaReached: true };
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
      selectedProblems.push({ problem: prob, isRevision: true });
      selectedIds.add(prob.id);
      if (selectedProblems.length >= deckSize) break;
    }
  }

  // 2. Fill remaining cards from unseen problems
  if (selectedProblems.length < deckSize) {
    for (const prob of ALL_BLITZ_PROBLEMS) {
      if (!selectedIds.has(prob.id)) {
        selectedProblems.push({ problem: prob, isRevision: false });
        selectedIds.add(prob.id);
        if (selectedProblems.length >= deckSize) break;
      }
    }
  }

  // 3. Prepare display deck with randomized pattern options
  const cards: BlitzSessionCard[] = selectedProblems.map(({ problem, isRevision }) => {
    const patternOptions = shuffleArray([
      problem.pattern,
      ...problem.patternDistractors,
    ]);
    return {
      problem,
      isRevision,
      patternOptions,
    };
  });

  return { cards, dailyQuotaReached: false };
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
