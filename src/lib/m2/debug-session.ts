import {
  DEBUG_CHALLENGES,
  sanitizeDebugChallenge,
  type ClientDebugChallenge,
} from "@/content/m2/debug-data";
import { getProfileRepository } from "@/lib/db/repositories/profile-repo";
import { getQuestionHistoryRepository } from "@/lib/db/repositories/question-history-repo";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";

export interface DebugDeckOptions {
  skillId?: string;
  difficulty?: "basic" | "medium" | "hard" | "mixed";
  count?: number;
}

export interface DebugLineEvaluationResult {
  success: boolean;
  isBuggy: boolean;
  resolved: boolean;
  clickedLine: number;
  attemptsRemaining?: number;
  distractorNote?: string;
  correctLine?: number;
  fix?: string;
  explanation?: string;
  interviewTakeaway?: string;
  diff?: {
    line: number;
    removed: string;
    added: string;
  };
  xpAwarded?: number;
  attemptNumber: number;
}

export interface DebugHintResult {
  challengeId: string;
  startLine: number;
  endLine: number;
  message: string;
}

/**
 * Retrieves a curated deck of debugging challenges personalized to user stack and history.
 */
export async function getDebugDeck(
  userId: string,
  options?: DebugDeckOptions
): Promise<{ deck: ClientDebugChallenge[]; totalAvailable: number }> {
  const profileRepo = getProfileRepository(userId);
  const historyRepo = getQuestionHistoryRepository(userId);

  const [profile, historyMap] = await Promise.all([
    profileRepo.getProfile(),
    historyRepo.getHistoryForQuestions(DEBUG_CHALLENGES.map((c) => c.id)),
  ]);

  const userSkillSlugs = new Set(
    (profile?.skills || []).map((s) => s.name.toLowerCase().trim())
  );

  let pool = [...DEBUG_CHALLENGES];

  // Filter by specific skill if requested and not "all"
  if (options?.skillId && options.skillId !== "all") {
    const targetSkill = options.skillId.toLowerCase().trim();
    const skillFiltered = pool.filter((c) => c.skillId.toLowerCase() === targetSkill);
    if (skillFiltered.length > 0) {
      pool = skillFiltered;
    }
  } else if (userSkillSlugs.size > 0) {
    // Soft preference for user stack if available
    const userStackChallenges = pool.filter((c) =>
      userSkillSlugs.has(c.skillId.toLowerCase())
    );
    if (userStackChallenges.length >= 2) {
      // Prioritize user stack challenges first, followed by others
      const otherChallenges = pool.filter(
        (c) => !userSkillSlugs.has(c.skillId.toLowerCase())
      );
      pool = [...userStackChallenges, ...otherChallenges];
    }
  }

  // Filter by difficulty if requested and not "mixed"
  if (options?.difficulty && options.difficulty !== "mixed") {
    const diffFiltered = pool.filter((c) => c.difficulty === options.difficulty);
    if (diffFiltered.length > 0) {
      pool = diffFiltered;
    }
  }

  // Unseen prioritization: unseen first, then mistakes, then correct
  pool.sort((a, b) => {
    const histA = historyMap.get(a.id);
    const histB = historyMap.get(b.id);

    if (!histA && histB) return -1;
    if (histA && !histB) return 1;
    if (histA && histB) {
      // Prioritize previous mistakes over mastered
      if (histA.lastResult === "incorrect" && histB.lastResult === "correct") return -1;
      if (histA.lastResult === "correct" && histB.lastResult === "incorrect") return 1;
      return histA.timesSeen - histB.timesSeen;
    }
    return 0;
  });

  const count = options?.count ?? 5;
  const selected = pool.slice(0, count);

  return {
    deck: selected.map(sanitizeDebugChallenge),
    totalAvailable: pool.length,
  };
}

/**
 * Returns a high-level guiding hint with a broad line range without leaking the exact buggy line.
 */
export function getDebugHint(challengeId: string): DebugHintResult {
  const challenge = DEBUG_CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) {
    throw new Error(`Challenge with ID "${challengeId}" not found`);
  }

  const primaryBug = challenge.buggyLines[0];
  const totalLines = challenge.code.trim().split("\n").length;

  // Window: 3 lines before, 3 lines after, clamped
  const startLine = Math.max(1, primaryBug.line - 3);
  const endLine = Math.min(totalLines, primaryBug.line + 3);

  const hintsBySkill: Record<string, string> = {
    react: "Look closely at state lifecycle and how variables are captured inside timer closures.",
    nodejs: "Check how asynchronous errors or large stream buffers are handled.",
    postgresql: "Inspect whether queries are executed repeatedly inside loops instead of batch-fetched.",
    redis: "Check whether concurrent check-then-set operations are atomic.",
    docker: "Inspect the order in which layers and dependency files are copied into the image.",
    python: "Consider the impact of the Global Interpreter Lock (GIL) on multithreaded CPU tasks.",
    typescript: "Review runtime typeof behavior and edge cases with object narrowing.",
    nextjs: "Inspect whether mutations trust client-supplied IDs or verified session identities.",
    mongodb: "Check whether the query sort order is supported by a compound index.",
  };

  const guidance =
    hintsBySkill[challenge.skillId.toLowerCase()] ||
    "Carefully inspect the execution flow and boundary conditions.";

  return {
    challengeId,
    startLine,
    endLine,
    message: `The bug is between lines ${startLine} and ${endLine}. ${guidance}`,
  };
}

/**
 * Evaluates a user line click against the challenge.
 * Supports up to 2 attempts.
 */
export async function evaluateDebugLineClick(
  userId: string,
  params: {
    challengeId: string;
    clickedLine: number;
    attemptNumber: number;
    usedHint?: boolean;
  }
): Promise<DebugLineEvaluationResult> {
  const challenge = DEBUG_CHALLENGES.find((c) => c.id === params.challengeId);
  if (!challenge) {
    throw new Error(`Challenge with ID "${params.challengeId}" not found`);
  }

  const codeLines = challenge.code.trim().split("\n");
  const matchedBug = challenge.buggyLines.find((b) => b.line === params.clickedLine);

  if (matchedBug) {
    // CORRECT HIT
    const originalLine = codeLines[matchedBug.line - 1] || "";
    
    // XP Calculation: 25 on 1st attempt, 15 on 2nd attempt. -5 if hint used.
    let xp = params.attemptNumber === 1 ? 25 : 15;
    if (params.usedHint) {
      xp = Math.max(5, xp - 5);
    }

    // Record history & award XP
    const historyRepo = getQuestionHistoryRepository(userId);
    const xpRepo = getXpRepository(userId);

    await Promise.all([
      historyRepo.recordQuestionResult(challenge.id, true),
      xpRepo.awardXp("m2_debug_solve", xp, challenge.id),
    ]);

    return {
      success: true,
      isBuggy: true,
      resolved: true,
      clickedLine: params.clickedLine,
      correctLine: params.clickedLine,
      fix: matchedBug.fix,
      explanation: matchedBug.explanation,
      interviewTakeaway: challenge.interviewTakeaway || "",
      diff: {
        line: params.clickedLine,
        removed: originalLine,
        added: matchedBug.fix,
      },
      xpAwarded: xp,
      attemptNumber: params.attemptNumber,
    };
  }

  // INCORRECT CLICK
  const attemptsRemaining = Math.max(0, 2 - params.attemptNumber);
  const distractorNote =
    challenge.distractorNotes[String(params.clickedLine)] ||
    `Line ${params.clickedLine} is executing standard, valid logic and is not causing the issue.`;

  if (attemptsRemaining <= 0) {
    // Failed after 2 attempts -> reveal answer
    const primaryBug = challenge.buggyLines[0];
    const originalLine = codeLines[primaryBug.line - 1] || "";

    const historyRepo = getQuestionHistoryRepository(userId);
    const mistakeRepo = getMistakeRepository(userId);

    await Promise.all([
      historyRepo.recordQuestionResult(challenge.id, false),
      mistakeRepo.recordMistake("m2", challenge.id, `Missed bug at line ${primaryBug.line}`),
    ]);

    return {
      success: true,
      isBuggy: false,
      resolved: true,
      clickedLine: params.clickedLine,
      distractorNote,
      attemptsRemaining: 0,
      correctLine: primaryBug.line,
      fix: primaryBug.fix,
      explanation: primaryBug.explanation,
      interviewTakeaway: challenge.interviewTakeaway || "",
      diff: {
        line: primaryBug.line,
        removed: originalLine,
        added: primaryBug.fix,
      },
      xpAwarded: 0,
      attemptNumber: params.attemptNumber,
    };
  }

  // Miss on attempt 1 -> allow retry
  return {
    success: true,
    isBuggy: false,
    resolved: false,
    clickedLine: params.clickedLine,
    distractorNote,
    attemptsRemaining,
    attemptNumber: params.attemptNumber,
  };
}
