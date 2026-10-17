import { getProfileRepository } from "@/lib/db/repositories/profile-repo";
import { getQuestionHistoryRepository } from "@/lib/db/repositories/question-history-repo";
import { getProjectQuestionsRepository } from "@/lib/db/repositories/project-questions-repo";
import { getUserProjectsRepository } from "@/lib/db/repositories/user-projects-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { ALL_M2_QUESTIONS } from "@/content/m2/question-bank";
import { DEBUG_CHALLENGES } from "@/content/m2/debug-data";

export interface DiagnosticScores {
  stackKnowledge: number | null;
  interviewReadiness: number | null;
  projectUnderstanding: number | null;
}

export type ReadinessBand =
  | "Not Started"
  | "Needs Practice"
  | "Developing"
  | "Interview Ready"
  | "Staff Calibrated";

export interface SkillScoreItem {
  skillId: string;
  name: string;
  accuracy: number;
  totalAnswered: number;
  correctAnswered: number;
  coverageRatio: number; // fraction of available questions answered
  tier: "novice" | "learning" | "proficient" | "mastered";
}

export interface DiagnosticInsightsPayload {
  scores: DiagnosticScores;
  readinessBand: ReadinessBand;
  summary: {
    totalQuestionsAnswered: number;
    totalCorrect: number;
    overallAccuracy: number;
    debuggingSolved: number;
    projectsMastered: number;
    projectsTotal: number;
    calibrationRate: number; // percentage of certain answers that were actually correct
  };
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    tone: "accent" | "good" | "bad" | "running";
  }>;
  skills: SkillScoreItem[];
  calibration: {
    certainCorrect: number;
    certainWrong: number;
    unsureCorrect: number;
    unsureWrong: number;
    rating: "calibrated" | "overconfident" | "underconfident" | "insufficient_data";
  };
}

/**
 * Deterministically computes the 3-Score readiness model for Module II:
 * 1. Stack Knowledge Score (0–100%)
 * 2. Interview Readiness Score (0–100%)
 * 3. Project Understanding Score (0–100%)
 */
export async function calculateDiagnosticScores(
  userId: string
): Promise<DiagnosticInsightsPayload> {
  const profileRepo = getProfileRepository(userId);
  const historyRepo = getQuestionHistoryRepository(userId);
  const projectQuestionsRepo = getProjectQuestionsRepository(userId);
  const userProjectsRepo = getUserProjectsRepository(userId);
  const attemptRepo = getAttemptRepository(userId);

  const [profile, historyRecords, projectQuestions, projects, attempts] =
    await Promise.all([
      profileRepo.getProfile(),
      historyRepo.find({}),
      projectQuestionsRepo.getAllQuestions(),
      userProjectsRepo.getProjects(),
      attemptRepo.find({}),
    ]);

  const confirmedSkills = profile?.skills || [];
  const userSkillIds = new Set(
    confirmedSkills.map((s) => s.name.toLowerCase().trim())
  );

  // ---------------------------------------------------------------------------
  // 1. STACK KNOWLEDGE SCORE
  // Measures depth & accuracy across canonical skills in candidate's confirmed stack.
  // Weighted by question difficulty: basic (1x), medium (1.5x), hard (2x).
  // Requires at least 3 answered questions across stack to calibrate.
  // ---------------------------------------------------------------------------
  const questionMap = new Map(ALL_M2_QUESTIONS.map((q) => [q.id, q]));
  const debugMap = new Map(DEBUG_CHALLENGES.map((d) => [d.id, d]));

  let weightedPointsEarned = 0;
  let weightedPointsPossible = 0;
  let totalAnswered = 0;
  let totalCorrect = 0;

  const skillAccumulator = new Map<
    string,
    { total: number; correct: number; available: number }
  >();

  // Count available questions per skill
  for (const q of ALL_M2_QUESTIONS) {
    if (q.status !== "published") continue;
    const s = q.skillId.toLowerCase();
    const curr = skillAccumulator.get(s) || { total: 0, correct: 0, available: 0 };
    curr.available++;
    skillAccumulator.set(s, curr);
  }

  for (const h of historyRecords) {
    totalAnswered += h.timesSeen;
    totalCorrect += h.correctCount;

    const m2q = questionMap.get(h.questionId);
    if (m2q) {
      const s = m2q.skillId.toLowerCase();
      const curr = skillAccumulator.get(s) || { total: 0, correct: 0, available: 0 };
      curr.total += h.timesSeen;
      curr.correct += h.correctCount;
      skillAccumulator.set(s, curr);

      const diffWeight =
        m2q.difficulty === "hard" ? 2.0 : m2q.difficulty === "medium" ? 1.5 : 1.0;
      weightedPointsPossible += diffWeight * h.timesSeen;
      weightedPointsEarned += diffWeight * h.correctCount;
    }
  }

  let stackKnowledgeScore: number | null = null;
  if (totalAnswered >= 3 && weightedPointsPossible > 0) {
    const rawAccuracy = (weightedPointsEarned / weightedPointsPossible) * 100;
    // Stack coverage factor: reward answering questions across multiple stack skills
    const coveredUserSkills = Array.from(userSkillIds).filter((s) => {
      const acc = skillAccumulator.get(s);
      return acc && acc.total > 0;
    }).length;
    const coverageMultiplier =
      userSkillIds.size > 0
        ? Math.min(1.0, 0.7 + 0.3 * (coveredUserSkills / userSkillIds.size))
        : 1.0;

    stackKnowledgeScore = Math.min(
      100,
      Math.max(0, Math.round(rawAccuracy * coverageMultiplier))
    );
  }

  // ---------------------------------------------------------------------------
  // 2. INTERVIEW READINESS SCORE
  // Blends:
  // - 40% Core fundamentals accuracy
  // - 35% Practical & Debugging challenges pass rate
  // - 25% Metacognitive calibration rating (penalizing overconfident mistakes)
  // ---------------------------------------------------------------------------
  let debugSolvedCount = 0;
  for (const h of historyRecords) {
    if (debugMap.has(h.questionId) && h.correctCount > 0) {
      debugSolvedCount++;
    }
  }

  // Calibration ratings from attempts
  let certainCorrect = 0;
  let certainWrong = 0;
  let unsureCorrect = 0;
  let unsureWrong = 0;

  for (const att of attempts) {
    const isCertain =
      att.confidence === "certain" ||
      (att as unknown as Record<string, unknown>).confidenceRating === "certain" ||
      (att as unknown as Record<string, unknown>).confidenceRating === "100% Certain";
    const isPass =
      att.correct === true ||
      (att as unknown as Record<string, unknown>).verdict === "pass";

    if (isCertain) {
      if (isPass) certainCorrect++;
      else certainWrong++;
    } else if (att.confidence || (att as unknown as Record<string, unknown>).confidenceRating) {
      if (isPass) unsureCorrect++;
      else unsureWrong++;
    }
  }

  const totalCertain = certainCorrect + certainWrong;
  const calibrationRate =
    totalCertain > 0 ? Math.round((certainCorrect / totalCertain) * 100) : 100;

  let interviewReadinessScore: number | null = null;
  if (totalAnswered >= 3) {
    const fundamentalsPart = (stackKnowledgeScore || 50) * 0.4;
    // Debug part: scaled against 5 debugging targets
    const debugRatio = Math.min(1.0, debugSolvedCount / 5);
    const debugPart = (debugRatio * 100) * 0.35;
    // Calibration part: penalize overconfident mistakes
    const calibrationPart = calibrationRate * 0.25;

    interviewReadinessScore = Math.min(
      100,
      Math.max(0, Math.round(fundamentalsPart + debugPart + calibrationPart))
    );
  }

  // ---------------------------------------------------------------------------
  // 3. PROJECT UNDERSTANDING SCORE
  // Evaluates percentage of project panel questions marked "Got It".
  // If user has no saved projects: null (prompts onboarding).
  // If user has projects but 0 questions reviewed: 0% ("Panel Ready").
  // ---------------------------------------------------------------------------
  let projectUnderstandingScore: number | null = null;
  const totalProjectQuestions = projectQuestions.length;
  const gotItProjectQuestions = projectQuestions.filter(
    (q) => q.status === "got_it"
  ).length;

  if (projects.length > 0 || totalProjectQuestions > 0) {
    if (totalProjectQuestions === 0) {
      projectUnderstandingScore = 0;
    } else {
      projectUnderstandingScore = Math.min(
        100,
        Math.round((gotItProjectQuestions / totalProjectQuestions) * 100)
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 4. READINESS BAND CLASSIFICATION
  // ---------------------------------------------------------------------------
  let readinessBand: ReadinessBand = "Not Started";
  const composite =
    ((stackKnowledgeScore || 0) +
      (interviewReadinessScore || 0) +
      (projectUnderstandingScore || 0)) /
    3;

  if (totalAnswered === 0 && projects.length === 0) {
    readinessBand = "Not Started";
  } else if (composite >= 85 && debugSolvedCount >= 3) {
    readinessBand = "Staff Calibrated";
  } else if (composite >= 70) {
    readinessBand = "Interview Ready";
  } else if (composite >= 45) {
    readinessBand = "Developing";
  } else {
    readinessBand = "Needs Practice";
  }

  // ---------------------------------------------------------------------------
  // 5. PER-SKILL BREAKDOWN
  // ---------------------------------------------------------------------------
  const skillsList: SkillScoreItem[] = [];
  const trackedSkills = userSkillIds.size > 0 ? Array.from(userSkillIds) : ["react", "nodejs", "sql"];

  for (const s of trackedSkills) {
    const acc = skillAccumulator.get(s) || { total: 0, correct: 0, available: 2 };
    const accuracy = acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0;
    const coverage = acc.available > 0 ? Math.min(1.0, acc.total / acc.available) : 0;

    let tier: SkillScoreItem["tier"] = "novice";
    if (acc.total >= 4 && accuracy >= 80) tier = "mastered";
    else if (acc.total >= 3 && accuracy >= 65) tier = "proficient";
    else if (acc.total >= 1) tier = "learning";

    skillsList.push({
      skillId: s,
      name: s.toUpperCase(),
      accuracy,
      totalAnswered: acc.total,
      correctAnswered: acc.correct,
      coverageRatio: coverage,
      tier,
    });
  }

  // ---------------------------------------------------------------------------
  // 6. ADAPTIVE RECOMMENDATIONS
  // ---------------------------------------------------------------------------
  const recommendations: DiagnosticInsightsPayload["recommendations"] = [];

  // Weak skill recommendation
  const weakSkill = skillsList.find((s) => s.totalAnswered > 0 && s.accuracy < 60);
  if (weakSkill) {
    recommendations.push({
      id: "rec_weak_skill",
      title: `Reinforce ${weakSkill.name} Fundamentals`,
      description: `Your accuracy in ${weakSkill.name} is currently ${weakSkill.accuracy}%. Run a targeted 5-question drill focusing on edge cases.`,
      actionLabel: "Start Drill →",
      actionHref: `/quiz/drills?skill=${weakSkill.skillId}`,
      tone: "bad",
    });
  }

  // Practical debugging recommendation
  if (debugSolvedCount < 3) {
    recommendations.push({
      id: "rec_practical_debug",
      title: "Solve Practical Production Incidents",
      description: `You've completed ${debugSolvedCount} of 5 recommended Click-the-Buggy-Line scenarios. Practice real incident triage to raise your readiness.`,
      actionLabel: "Triage Incidents →",
      actionHref: "/quiz/practical",
      tone: "accent",
    });
  }

  // Project panel review recommendation
  if (projectUnderstandingScore === null || projectUnderstandingScore < 60) {
    recommendations.push({
      id: "rec_project_panel",
      title: "Master Your Project Architecture Defense",
      description:
        projects.length === 0
          ? "Add your projects in Onboarding to generate 10 tailored senior panel questions."
          : `Review STAR model responses for ${projects[0].name} and master your architecture decisions.`,
      actionLabel: "Open Project Panel →",
      actionHref: "/quiz/projects",
      tone: "running",
    });
  }

  // Calibration recommendation
  if (certainWrong > 0 && certainWrong >= certainCorrect * 0.3) {
    recommendations.push({
      id: "rec_calibration",
      title: "Watch Out for Overconfident Mistakes",
      description: `You marked '100% Certain' on ${certainWrong} questions that were actually incorrect. Review these in Mistakes to calibrate confidence.`,
      actionLabel: "Review Mistakes →",
      actionHref: "/quiz/heatmap",
      tone: "bad",
    });
  }

  let calibrationRating: DiagnosticInsightsPayload["calibration"]["rating"] =
    "insufficient_data";
  if (totalCertain >= 3) {
    if (certainWrong === 0) calibrationRating = "calibrated";
    else if (certainWrong > certainCorrect * 0.35) calibrationRating = "overconfident";
    else calibrationRating = "calibrated";
  }

  return {
    scores: {
      stackKnowledge: stackKnowledgeScore,
      interviewReadiness: interviewReadinessScore,
      projectUnderstanding: projectUnderstandingScore,
    },
    readinessBand,
    summary: {
      totalQuestionsAnswered: totalAnswered,
      totalCorrect,
      overallAccuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      debuggingSolved: debugSolvedCount,
      projectsMastered: gotItProjectQuestions,
      projectsTotal: totalProjectQuestions,
      calibrationRate,
    },
    recommendations,
    skills: skillsList,
    calibration: {
      certainCorrect,
      certainWrong,
      unsureCorrect,
      unsureWrong,
      rating: calibrationRating,
    },
  };
}
