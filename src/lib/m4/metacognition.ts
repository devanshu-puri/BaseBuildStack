import { AttemptDocument } from "@/lib/db/schemas";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";

export const MIN_SAMPLES_THRESHOLD = 10;

export type MetacognitiveCategory =
  | "pattern"
  | "deduction"
  | "memory"
  | "numerical"
  | "tricky"
  | "general";

export interface CalibrationQuadrant {
  count: number;
  percent: number;
  label: string;
  description: string;
}

export interface MetacognitiveMatrix {
  calibratedHigh: CalibrationQuadrant; // Certain + Correct
  overconfident: CalibrationQuadrant;  // Certain + Incorrect (Blind spot / Overconfidence)
  underconfident: CalibrationQuadrant; // Guessing/Unsure + Correct (Imposter syndrome)
  calibratedLow: CalibrationQuadrant;  // Guessing/Unsure + Incorrect (Aware uncertainty)
}

export interface CategoryMetacognition {
  category: MetacognitiveCategory;
  displayName: string;
  sampleCount: number;
  hasSufficientData: boolean;
  samplesRemaining: number;
  accuracy: number;
  matrix: MetacognitiveMatrix;
  calibrationScore: number | null;
  overconfidenceRate: number | null;
  underconfidenceRate: number | null;
  conclusion: string | null;
}

export interface MetacognitionReport {
  totalSamples: number;
  hasSufficientData: boolean;
  samplesRemaining: number;
  matrix: MetacognitiveMatrix;
  calibrationScore: number | null;
  overconfidenceRate: number | null;
  underconfidenceRate: number | null;
  certaintyAccuracy: number | null;
  plainLanguageInsight: string;
  categories: CategoryMetacognition[];
}

const CATEGORY_DISPLAY_NAMES: Record<MetacognitiveCategory, string> = {
  pattern: "Pattern Recognition",
  deduction: "Logical Deduction",
  memory: "Working Memory",
  numerical: "Fermi Estimation",
  tricky: "Lateral Thinking",
  general: "General Reasoning",
};

/**
 * Maps an attempt itemId to an M4 category.
 */
export function resolveCategoryFromItemId(itemId: string): MetacognitiveCategory {
  if (itemId.includes("-p1") || itemId.includes("pattern")) return "pattern";
  if (
    itemId.includes("-d2") ||
    itemId.includes("deduction") ||
    itemId.includes("puzzle_") ||
    itemId.includes("grid_")
  ) {
    return "deduction";
  }
  if (itemId.includes("-m3") || itemId.includes("memory")) return "memory";
  if (itemId.includes("-n4") || itemId.includes("numerical") || itemId.includes("fermi")) {
    return "numerical";
  }
  if (itemId.includes("-t5") || itemId.includes("tricky")) return "tricky";
  return "general";
}

/**
 * Pure evaluation function computing metacognition calibration metrics.
 */
export function computeMetacognitionReport(
  attempts: Array<Pick<AttemptDocument, "itemId" | "correct" | "confidence">>
): MetacognitionReport {
  // Only include attempts where confidence was explicitly chosen
  const validAttempts = attempts.filter(
    (a) => a.confidence === "certain" || a.confidence === "unsure" || a.confidence === "guessing"
  );

  const totalSamples = validAttempts.length;
  const hasSufficientData = totalSamples >= MIN_SAMPLES_THRESHOLD;
  const samplesRemaining = Math.max(0, MIN_SAMPLES_THRESHOLD - totalSamples);

  // Group by category
  const categoryMap: Record<
    MetacognitiveCategory,
    Array<Pick<AttemptDocument, "itemId" | "correct" | "confidence">>
  > = {
    pattern: [],
    deduction: [],
    memory: [],
    numerical: [],
    tricky: [],
    general: [],
  };

  validAttempts.forEach((a) => {
    const cat = resolveCategoryFromItemId(a.itemId);
    categoryMap[cat].push(a);
  });

  const overallMatrix = buildMatrix(validAttempts);

  let calibrationScore: number | null = null;
  let overconfidenceRate: number | null = null;
  let underconfidenceRate: number | null = null;
  let certaintyAccuracy: number | null = null;
  let plainLanguageInsight = "";

  if (!hasSufficientData) {
    plainLanguageInsight = `Complete at least ${MIN_SAMPLES_THRESHOLD} challenges with confidence ratings to unlock your personalized metacognitive diagnosis. (${totalSamples}/${MIN_SAMPLES_THRESHOLD} completed)`;
  } else {
    const totalCertain =
      overallMatrix.calibratedHigh.count + overallMatrix.overconfident.count;
    const totalUnsure =
      overallMatrix.underconfident.count + overallMatrix.calibratedLow.count;

    overconfidenceRate =
      totalCertain > 0 ? overallMatrix.overconfident.count / totalCertain : 0;
    underconfidenceRate =
      totalUnsure > 0 ? overallMatrix.underconfident.count / totalUnsure : 0;
    certaintyAccuracy =
      totalCertain > 0 ? overallMatrix.calibratedHigh.count / totalCertain : 0;
    calibrationScore = Math.round(
      ((overallMatrix.calibratedHigh.count + overallMatrix.calibratedLow.count) /
        totalSamples) *
        100
    );

    // Synthesize exactly one plain-language insight
    plainLanguageInsight = synthesizePlainLanguageInsight({
      totalSamples,
      calibrationScore,
      overconfidenceRate,
      underconfidenceRate,
      certaintyAccuracy,
      categoryMap,
    });
  }

  // Build per-category breakdowns
  const categories: CategoryMetacognition[] = (
    Object.keys(categoryMap) as MetacognitiveCategory[]
  ).map((cat) => {
    const catAttempts = categoryMap[cat];
    const catTotal = catAttempts.length;
    const catSufficient = catTotal >= MIN_SAMPLES_THRESHOLD;
    const catRemaining = Math.max(0, MIN_SAMPLES_THRESHOLD - catTotal);
    const catCorrect = catAttempts.filter((a) => a.correct).length;
    const accuracy = catTotal > 0 ? Math.round((catCorrect / catTotal) * 100) : 0;
    const catMatrix = buildMatrix(catAttempts);

    let catCalibScore: number | null = null;
    let catOverRate: number | null = null;
    let catUnderRate: number | null = null;
    let catConclusion: string | null = null;

    if (catSufficient) {
      const catCertain = catMatrix.calibratedHigh.count + catMatrix.overconfident.count;
      const catUnsure = catMatrix.underconfident.count + catMatrix.calibratedLow.count;
      catOverRate = catCertain > 0 ? catMatrix.overconfident.count / catCertain : 0;
      catUnderRate = catUnsure > 0 ? catMatrix.underconfident.count / catUnsure : 0;
      catCalibScore = Math.round(
        ((catMatrix.calibratedHigh.count + catMatrix.calibratedLow.count) / catTotal) *
          100
      );

      if (catOverRate >= 0.25) {
        catConclusion = `High overconfidence detected: ${Math.round(
          catOverRate * 100
        )}% of certain answers were incorrect.`;
      } else if (catUnderRate >= 0.4) {
        catConclusion = `Imposter effect detected: ${Math.round(
          catUnderRate * 100
        )}% of unsure answers were actually correct.`;
      } else {
        catConclusion = `Well-calibrated: ${catCalibScore}% metacognitive accuracy.`;
      }
    }

    return {
      category: cat,
      displayName: CATEGORY_DISPLAY_NAMES[cat],
      sampleCount: catTotal,
      hasSufficientData: catSufficient,
      samplesRemaining: catRemaining,
      accuracy,
      matrix: catMatrix,
      calibrationScore: catCalibScore,
      overconfidenceRate: catOverRate,
      underconfidenceRate: catUnderRate,
      conclusion: catConclusion,
    };
  });

  return {
    totalSamples,
    hasSufficientData,
    samplesRemaining,
    matrix: overallMatrix,
    calibrationScore,
    overconfidenceRate,
    underconfidenceRate,
    certaintyAccuracy,
    plainLanguageInsight,
    categories,
  };
}

function buildMatrix(
  attempts: Array<Pick<AttemptDocument, "correct" | "confidence">>
): MetacognitiveMatrix {
  const total = attempts.length || 1;
  let calibratedHigh = 0;
  let overconfident = 0;
  let underconfident = 0;
  let calibratedLow = 0;

  for (const a of attempts) {
    if (a.confidence === "certain") {
      if (a.correct) {
        calibratedHigh++;
      } else {
        overconfident++;
      }
    } else if (a.confidence === "unsure" || a.confidence === "guessing") {
      if (a.correct) {
        underconfident++;
      } else {
        calibratedLow++;
      }
    }
  }

  return {
    calibratedHigh: {
      count: calibratedHigh,
      percent: Math.round((calibratedHigh / total) * 100),
      label: "High Calibration",
      description: "Certain & Correct (accurate confidence)",
    },
    overconfident: {
      count: overconfident,
      percent: Math.round((overconfident / total) * 100),
      label: "Danger Zone",
      description: "Certain & Incorrect (cognitive blind spot)",
    },
    underconfident: {
      count: underconfident,
      percent: Math.round((underconfident / total) * 100),
      label: "Hidden Competence",
      description: "Unsure/Guessing & Correct (imposter syndrome)",
    },
    calibratedLow: {
      count: calibratedLow,
      percent: Math.round((calibratedLow / total) * 100),
      label: "Aware Uncertainty",
      description: "Unsure/Guessing & Incorrect (self-aware doubt)",
    },
  };
}

function synthesizePlainLanguageInsight(params: {
  totalSamples: number;
  calibrationScore: number;
  overconfidenceRate: number;
  underconfidenceRate: number;
  certaintyAccuracy: number;
  categoryMap: Record<MetacognitiveCategory, Array<Pick<AttemptDocument, "correct" | "confidence">>>;
}): string {
  const {
    calibrationScore,
    overconfidenceRate,
    underconfidenceRate,
    certaintyAccuracy,
  } = params;

  // 1. Critical Overconfidence Warning (priority 1: prevents disastrous interview mistakes)
  if (overconfidenceRate >= 0.25) {
    const pct = Math.round(overconfidenceRate * 100);
    return `Overconfidence Alert: When declaring 100% certainty, you are incorrect ${pct}% of the time. Dedicate a mandatory 15-second verification pass to verify boundary conditions before locking in answers.`;
  }

  // 2. Underconfidence / Imposter Syndrome Alert (priority 2: boosts interview confidence)
  if (underconfidenceRate >= 0.45) {
    const pct = Math.round(underconfidenceRate * 100);
    return `Hidden Competence: You were correct ${pct}% of the time even when feeling unsure or guessing. Trust your preliminary deductions more—your subconscious pattern recognition is stronger than you realize.`;
  }

  // 3. High Metacognitive Precision
  if (certaintyAccuracy >= 0.85 && calibrationScore >= 75) {
    const pct = Math.round(certaintyAccuracy * 100);
    return `Exceptional Metacognitive Precision: Your self-assessment is highly reliable. When you feel 100% certain, you achieve ${pct}% accuracy with sharp awareness of your blind spots.`;
  }

  // 4. Default balanced summary
  return `Balanced Calibration: Your metacognitive awareness is developing steadily with an overall calibration index of ${calibrationScore}%. Keep training across diverse problem types.`;
}

/**
 * Repository-connected fetcher for the user's M4 metacognition profile.
 */
export async function getUserMetacognitionReport(userId: string): Promise<MetacognitionReport> {
  try {
    const attemptRepo = getAttemptRepository(userId);
    const attempts = await attemptRepo.getModuleAttempts("m4", 200);
    return computeMetacognitionReport(attempts);
  } catch (err) {
    console.warn("Failed to fetch user attempts for metacognition:", err);
    return computeMetacognitionReport([]);
  }
}
