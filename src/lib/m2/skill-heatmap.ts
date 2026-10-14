import { AttemptDocument } from "@/lib/db/schemas";
import { getProfileRepository } from "@/lib/db/repositories/profile-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { getQuizQuestionById } from "@/content/m2/quiz-questions";
import { MasteryTier } from "@/lib/engine/types";
import { calculateMasteryTier } from "@/lib/engine/mastery";

export interface SkillHeatmapItem {
  skill: string;
  level: "beginner" | "intermediate" | "advanced";
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0 - 100
  averageMs: number;
  masteryTier: MasteryTier;
  overconfidentCount: number;
}

export interface CalibrationQuadrantStats {
  count: number;
  percentage: number;
}

export interface CalibrationMatrix {
  calibratedHigh: CalibrationQuadrantStats; // Certain + Correct
  underconfident: CalibrationQuadrantStats; // Guessing/Unsure + Correct
  overconfident: CalibrationQuadrantStats; // Certain + Incorrect
  calibratedLow: CalibrationQuadrantStats; // Guessing/Unsure + Incorrect
  totalRated: number;
  calibrationScore: number; // % of rated attempts that were calibrated
}

export interface HeatmapSummary {
  totalAttempts: number;
  totalCorrect: number;
  overallAccuracy: number;
  calibrationScore: number;
  weakSkills: string[];
  strongSkills: string[];
  unattemptedSkills: string[];
}

export interface SkillHeatmapResponse {
  skills: SkillHeatmapItem[];
  quadrants: CalibrationMatrix;
  summary: HeatmapSummary;
}

/**
 * Pure deterministic calculation of skill heatmap stats and confidence-vs-accuracy quadrants.
 */
export function calculateHeatmapStats(params: {
  confirmedSkills: Array<{ name: string; level: "beginner" | "intermediate" | "advanced" }>;
  attempts: AttemptDocument[];
}): SkillHeatmapResponse {
  const { confirmedSkills, attempts } = params;

  // Track stats per skill
  const skillMap = new Map<
    string,
    {
      level: "beginner" | "intermediate" | "advanced";
      total: number;
      correct: number;
      totalMs: number;
      overconfident: number;
    }
  >();

  // Initialize with user's confirmed skills
  for (const s of confirmedSkills) {
    skillMap.set(s.name, {
      level: s.level,
      total: 0,
      correct: 0,
      totalMs: 0,
      overconfident: 0,
    });
  }

  // Quadrant counters
  let quadCalibratedHigh = 0; // Certain + Correct
  let quadUnderconfident = 0; // Guessing/Unsure + Correct
  let quadOverconfident = 0; // Certain + Incorrect
  let quadCalibratedLow = 0; // Guessing/Unsure + Incorrect
  let totalRated = 0;

  // Aggregate over attempts
  for (const att of attempts) {
    const q = getQuizQuestionById(att.itemId);
    const skillName = q ? q.skill : "General";

    // Initialize skill if not present in confirmed skills
    if (!skillMap.has(skillName)) {
      skillMap.set(skillName, {
        level: "intermediate",
        total: 0,
        correct: 0,
        totalMs: 0,
        overconfident: 0,
      });
    }

    const current = skillMap.get(skillName)!;
    current.total++;
    current.totalMs += att.ms || 0;
    if (att.correct) {
      current.correct++;
    }

    // Calibration quadrant tracking
    if (att.confidence) {
      totalRated++;
      if (att.confidence === "certain") {
        if (att.correct) {
          quadCalibratedHigh++;
        } else {
          quadOverconfident++;
          current.overconfident++;
        }
      } else {
        // "guessing" or "unsure"
        if (att.correct) {
          quadUnderconfident++;
        } else {
          quadCalibratedLow++;
        }
      }
    }
  }

  // Build skill items
  const skills: SkillHeatmapItem[] = Array.from(skillMap.entries()).map(
    ([skill, stats]) => {
      const accuracy =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      const averageMs =
        stats.total > 0 ? Math.round(stats.totalMs / stats.total) : 0;

      const masteryTier = calculateMasteryTier({
        repetitions: stats.correct,
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        interval: 1,
      });

      return {
        skill,
        level: stats.level,
        totalAttempts: stats.total,
        correctAttempts: stats.correct,
        accuracy,
        averageMs,
        masteryTier,
        overconfidentCount: stats.overconfident,
      };
    }
  );

  // Quadrants breakdown
  const pct = (val: number) =>
    totalRated > 0 ? Math.round((val / totalRated) * 100) : 0;

  const quadrants: CalibrationMatrix = {
    calibratedHigh: {
      count: quadCalibratedHigh,
      percentage: pct(quadCalibratedHigh),
    },
    underconfident: {
      count: quadUnderconfident,
      percentage: pct(quadUnderconfident),
    },
    overconfident: {
      count: quadOverconfident,
      percentage: pct(quadOverconfident),
    },
    calibratedLow: {
      count: quadCalibratedLow,
      percentage: pct(quadCalibratedLow),
    },
    totalRated,
    calibrationScore:
      totalRated > 0
        ? Math.round(((quadCalibratedHigh + quadCalibratedLow) / totalRated) * 100)
        : 100,
  };

  // Summaries
  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter((a) => a.correct).length;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const attemptedSkills = skills.filter((s) => s.totalAttempts > 0);
  const unattemptedSkills = skills
    .filter((s) => s.totalAttempts === 0)
    .map((s) => s.skill);

  // Weak skills: accuracy < 70% or has overconfident misses
  const weakSkills = attemptedSkills
    .filter((s) => s.accuracy < 70 || s.overconfidentCount > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((s) => s.skill);

  // Strong skills: accuracy >= 80% with at least 2 attempts
  const strongSkills = attemptedSkills
    .filter((s) => s.accuracy >= 80 && s.totalAttempts >= 2)
    .sort((a, b) => b.accuracy - a.accuracy)
    .map((s) => s.skill);

  return {
    skills,
    quadrants,
    summary: {
      totalAttempts,
      totalCorrect,
      overallAccuracy,
      calibrationScore: quadrants.calibrationScore,
      weakSkills,
      strongSkills,
      unattemptedSkills,
    },
  };
}

/**
 * Retrieves skill heatmap and calibration data for a given user from repositories.
 */
export async function getSkillHeatmapData(
  userId: string
): Promise<SkillHeatmapResponse> {
  // 1. Fetch user profile confirmed skills
  let confirmedSkills: Array<{
    name: string;
    level: "beginner" | "intermediate" | "advanced";
  }> = [];

  try {
    const profileRepo = getProfileRepository(userId);
    const profile = await profileRepo.getProfile();
    if (profile?.skills && profile.skills.length > 0) {
      confirmedSkills = profile.skills
        .filter((s) => s.confirmed)
        .map((s) => ({
          name: s.name,
          level: s.level,
        }));
    }
  } catch (err) {
    console.warn("Could not fetch profile skills for heatmap:", err);
  }

  // Fallback skills if user has not completed onboarding
  if (confirmedSkills.length === 0) {
    confirmedSkills = [
      { name: "React", level: "intermediate" },
      { name: "TypeScript", level: "intermediate" },
      { name: "Node.js", level: "intermediate" },
      { name: "PostgreSQL", level: "intermediate" },
      { name: "System Design", level: "beginner" },
      { name: "Redis", level: "beginner" },
      { name: "Docker", level: "beginner" },
    ];
  }

  // 2. Fetch attempts for module "m2"
  let attempts: AttemptDocument[] = [];
  try {
    const attemptRepo = getAttemptRepository(userId);
    attempts = await attemptRepo.getModuleAttempts("m2", 500);
  } catch (err) {
    console.warn("Could not fetch attempts for heatmap:", err);
  }

  return calculateHeatmapStats({
    confirmedSkills,
    attempts,
  });
}
