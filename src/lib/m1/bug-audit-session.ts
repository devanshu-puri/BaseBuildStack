import {
  ALL_BUG_AUDIT_PROBLEMS,
  getBugAuditProblemById,
  BugAuditProblem,
} from "@/content/m1/bug-audit-problems";
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

export interface BugAuditSessionCard {
  problem: BugAuditProblem;
  isRevision: boolean;
}

export interface BugAuditSubmissionParams {
  userId: string;
  problemId: string;
  selectedLineNumber: number; // 1-indexed line tapped
  selectedBreakingInputIndex: number; // 0..3
  ms: number;
  confidence?: ConfidenceRating;
}

export interface BugAuditVerdict {
  isCorrect: boolean;
  lineCorrect: boolean;
  inputCorrect: boolean;
  speedBonus: number;
  xpAwarded: number;
  totalXp: number;
  nextDue: Date;
  explanation: BugAuditProblem["explanation"];
  canonicalFix: string;
  canonicalCode: string;
  correctLineNumber: number;
  calibration: string;
}

/**
 * Loads a Bug Audit deck for user, prioritizing SRS due cards.
 */
export async function getBugAuditDeck(
  userId: string,
  deckSize = 5
): Promise<{ cards: BugAuditSessionCard[]; dailyQuotaReached: boolean }> {
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

  const selectedProblems: BugAuditSessionCard[] = [];
  const selectedIds = new Set<string>();

  for (const srs of dueCards) {
    const prob = getBugAuditProblemById(srs.itemId);
    if (prob && !selectedIds.has(prob.id)) {
      selectedProblems.push({ problem: prob, isRevision: true });
      selectedIds.add(prob.id);
      if (selectedProblems.length >= deckSize) break;
    }
  }

  // 2. Fill remaining cards from unseen problems
  if (selectedProblems.length < deckSize) {
    for (const prob of ALL_BUG_AUDIT_PROBLEMS) {
      if (!selectedIds.has(prob.id)) {
        selectedProblems.push({ problem: prob, isRevision: false });
        selectedIds.add(prob.id);
        if (selectedProblems.length >= deckSize) break;
      }
    }
  }

  return { cards: selectedProblems, dailyQuotaReached: false };
}

/**
 * Evaluates Bug Audit submission: line detection + breaking input selection.
 */
export async function submitBugAuditAnswer(
  params: BugAuditSubmissionParams
): Promise<BugAuditVerdict> {
  const {
    userId,
    problemId,
    selectedLineNumber,
    selectedBreakingInputIndex,
    ms,
    confidence,
  } = params;

  const problem = getBugAuditProblemById(problemId);
  if (!problem) {
    throw new Error(`Bug audit problem not found: ${problemId}`);
  }

  // 1. Deterministic evaluation
  const lineCorrect = selectedLineNumber === problem.buggyLineNumber;
  const inputCorrect =
    selectedBreakingInputIndex === problem.correctBreakingInputIndex;
  const isCorrect = lineCorrect && inputCorrect;

  // 60-second baseline target time for Bug Audit
  const speedBonus = isCorrect ? computeSpeedBonus(ms, 60_000, 5) : 0;
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
    answer: { selectedLineNumber, selectedBreakingInputIndex },
    correct: isCorrect,
    ms,
    confidence,
  });

  // 4. Update mistake if incorrect
  if (!isCorrect) {
    const mistakeRepo = getMistakeRepository(userId);
    const reason = !lineCorrect
      ? `Identified Line ${selectedLineNumber} instead of actual bug on Line ${problem.buggyLineNumber} (${problem.bugType})`
      : `Spotted Line ${problem.buggyLineNumber} correctly, but picked wrong breaking input`;
    await mistakeRepo.recordMistake("m1", problemId, reason);
  }

  // 5. Award XP (idempotently per problem)
  let xpAwarded = 0;
  let totalXp = 0;
  const xpRepo = getXpRepository(userId);

  if (isCorrect) {
    const amount = 15 + speedBonus; // 15 base XP for Bug Audit
    const refId = `bugaudit_${problemId}`;
    const xpRes = await xpRepo.awardXp("bug_audit_solve", amount, refId);
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
    lineCorrect,
    inputCorrect,
    speedBonus,
    xpAwarded,
    totalXp,
    nextDue: sm2Result.due,
    explanation: problem.explanation,
    canonicalFix: problem.canonicalFix,
    canonicalCode: problem.canonicalCode,
    correctLineNumber: problem.buggyLineNumber,
    calibration,
  };
}
