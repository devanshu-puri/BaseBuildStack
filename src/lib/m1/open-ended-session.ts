import { z } from "zod";
import {
  getOpenEndedDrillById,
  getPushbackNode,
  OpenEndedDrill,
} from "@/content/m1/open-ended-problems";
export { getPushbackNode };
import {
  getAttemptRepository,
  getMistakeRepository,
  getXpRepository,
  getStreakRepository,
  getProgressRepository,
} from "@/lib/db/repositories";
import { llmGateway } from "@/lib/llm/gateway";

export interface OpenEndedSubmissionParams {
  userId: string;
  drillId: string;
  phase1Selected: number;
  phase2Selected: number;
  phase3Selected: number;
  freeTextDefence?: string;
  ms: number;
}

export const RubricEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  criteriaBreakdown: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      comments: z.string(),
    })
  ),
});

export type RubricEvaluation = z.infer<typeof RubricEvaluationSchema>;

export interface OpenEndedVerdict {
  isFullyCorrect: boolean;
  phase1Correct: boolean;
  phase2Correct: boolean;
  phase3Correct: boolean;
  mcqScore: number; // 0 to 100
  rubricScore?: number; // 0 to 100
  rubricEvaluation?: RubricEvaluation;
  xpAwarded: number;
  totalXp: number;
  canonicalTakeaway: string;
  explanation: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
}

/**
 * Deterministic rubric evaluator used when LLM is disabled or offline.
 * Evaluates free-text response against criterion keywords and weights.
 */
export function evaluateRubricDeterministically(
  text: string,
  drill: OpenEndedDrill
): RubricEvaluation {
  const normalized = text.toLowerCase();
  const criteriaBreakdown = drill.rubric.map((criterion) => {
    const matchedCount = criterion.keywords.filter((kw) =>
      normalized.includes(kw.toLowerCase())
    ).length;
    const matchRatio = matchedCount / Math.max(1, criterion.keywords.length);
    const score = Math.min(100, Math.round(matchRatio * 120)); // slight boost for hitting multiple concepts

    const comments =
      score >= 70
        ? `Strong awareness of ${criterion.name.toLowerCase()} principles.`
        : score >= 40
        ? `Partial coverage of ${criterion.name.toLowerCase()}; consider addressing ${criterion.keywords.slice(0, 2).join(", ")}.`
        : `Lacks explicit discussion of ${criterion.name.toLowerCase()}.`;

    return {
      name: criterion.name,
      score,
      comments,
    };
  });

  const totalWeightedScore = Math.round(
    criteriaBreakdown.reduce((acc, c, idx) => {
      const weight = drill.rubric[idx]?.weight || (1 / drill.rubric.length);
      return acc + c.score * weight;
    }, 0)
  );

  const feedback =
    totalWeightedScore >= 75
      ? "Comprehensive defence covering scale, failure modes, and architectural trade-offs."
      : totalWeightedScore >= 50
      ? "Acceptable technical argument, but could provide deeper trade-off analysis on edge cases."
      : "Defence lacks key architectural primitives and mitigation strategies.";

  return {
    score: totalWeightedScore,
    feedback,
    criteriaBreakdown,
  };
}

/**
 * Submits an Open-Ended drill attempt with deterministic MCQ checks and rubric evaluation.
 */
export async function submitOpenEndedDrill(
  params: OpenEndedSubmissionParams
): Promise<OpenEndedVerdict> {
  const {
    userId,
    drillId,
    phase1Selected,
    phase2Selected,
    phase3Selected,
    freeTextDefence,
    ms,
  } = params;

  const drill = getOpenEndedDrillById(drillId);
  if (!drill) {
    throw new Error(`Open-ended drill not found: ${drillId}`);
  }

  // 1. Evaluate deterministic MCQ phases
  const phase1Correct = phase1Selected === drill.phase1Constraints.correctIndex;
  const phase2Correct = phase2Selected === drill.phase2Primitives.correctIndex;

  const pushbackNode = getPushbackNode(drill, phase2Selected);
  const phase3Correct = phase3Selected === pushbackNode.correctIndex;

  const correctPhases =
    (phase1Correct ? 1 : 0) + (phase2Correct ? 1 : 0) + (phase3Correct ? 1 : 0);
  const mcqScore = Math.round((correctPhases / 3) * 100);
  const isFullyCorrect = correctPhases === 3;

  // 2. Rubric Evaluation for Free-Text Defence
  let rubricEvaluation: RubricEvaluation | undefined = undefined;

  if (freeTextDefence && freeTextDefence.trim().length > 0) {
    const deterministicFallback = evaluateRubricDeterministically(freeTextDefence, drill);

    if (llmGateway.isLlmEnabled() && process.env.NODE_ENV !== "test") {
      try {
        const rubricPrompt = `
You are a senior system design interviewer evaluating a candidate's open-ended technical defence.
Scenario: "${drill.vagueScenario}"
Interviewer Pushback: "${pushbackNode.interviewerChallenge}"
Candidate's Defence: "${freeTextDefence}"

Rubric:
${drill.rubric.map((r) => `- ${r.name} (${Math.round(r.weight * 100)}%): ${r.description}`).join("\n")}

Evaluate the candidate's response. Return a JSON object with:
- "score": overall 0-100 score
- "feedback": 2-3 sentence summary critique
- "criteriaBreakdown": array of { "name", "score" (0-100), "comments" }
`;
        rubricEvaluation = await llmGateway.generateJSON(
          rubricPrompt,
          RubricEvaluationSchema,
          { fallback: deterministicFallback }
        );
      } catch {
        rubricEvaluation = deterministicFallback;
      }
    } else {
      // Deterministic offline grading when LLM is disabled or in test suite
      rubricEvaluation = deterministicFallback;
    }
  }

  // 3. Award XP (25 base XP for drill + up to 10 bonus XP for high rubric score)
  let xpAwarded = 0;
  let totalXp = 0;
  const xpRepo = getXpRepository(userId);

  if (isFullyCorrect || (rubricEvaluation && rubricEvaluation.score >= 60)) {
    const rubricBonus = rubricEvaluation ? Math.round(rubricEvaluation.score / 10) : 0;
    const amount = 25 + rubricBonus;
    const refId = `open_ended_${drillId}`;
    const xpRes = await xpRepo.awardXp("drill_complete", amount, refId);
    xpAwarded = xpRes.added ? amount : 0;
    totalXp = xpRes.totalXp;
  } else {
    totalXp = await xpRepo.getTotalXp();
  }

  // 4. Record Attempt
  const attemptRepo = getAttemptRepository(userId);
  await attemptRepo.recordAttempt({
    module: "m1",
    itemId: drillId,
    answer: {
      phase1Selected,
      phase2Selected,
      phase3Selected,
      freeTextDefence,
      mcqScore,
      rubricScore: rubricEvaluation?.score,
    },
    correct: isFullyCorrect,
    ms,
  });

  // 5. Record mistake if not fully correct
  if (!isFullyCorrect) {
    const mistakeRepo = getMistakeRepository(userId);
    const failedPhases = [
      !phase1Correct ? "Phase 1 (Constraints)" : null,
      !phase2Correct ? "Phase 2 (Primitives)" : null,
      !phase3Correct ? "Phase 3 (Pushback Defence)" : null,
    ].filter(Boolean).join(", ");

    await mistakeRepo.recordMistake(
      "m1",
      drillId,
      `Failed open-ended decision tree phases: ${failedPhases}`
    );
  }

  // 6. Update Streak & Progress
  const streakRepo = getStreakRepository(userId);
  await streakRepo.recordActivity();

  const progressRepo = getProgressRepository(userId);
  await progressRepo.setProgress(
    "m1",
    drillId,
    isFullyCorrect ? "completed" : "in_progress",
    isFullyCorrect ? 3 : 2
  );

  return {
    isFullyCorrect,
    phase1Correct,
    phase2Correct,
    phase3Correct,
    mcqScore,
    rubricScore: rubricEvaluation?.score,
    rubricEvaluation,
    xpAwarded,
    totalXp,
    canonicalTakeaway: drill.canonicalTakeaway,
    explanation: {
      phase1: drill.phase1Constraints.explanation,
      phase2: drill.phase2Primitives.explanation,
      phase3: pushbackNode.explanation,
    },
  };
}
