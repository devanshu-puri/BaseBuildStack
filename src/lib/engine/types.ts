export type QuestionType = "mcq" | "multi_choice" | "spot_bug" | "fill_blank";

export type ConfidenceRating = "guessing" | "unsure" | "certain";

export type CalibrationStatus =
  | "calibrated"
  | "overconfident"
  | "underconfident"
  | "uncalibrated";

export interface EvaluationResult {
  correct: boolean;
  score: number; // 0 to 1 normalized accuracy score
  speedBonus: number; // XP speed bonus
  calibration: CalibrationStatus;
  details?: Record<string, unknown>;
}

export interface Sm2Input {
  ease?: number; // default 2.5
  interval?: number; // days, default 1
  repetitions?: number; // default 0
}

export interface Sm2Output {
  ease: number;
  interval: number; // in days
  repetitions: number;
  due: Date;
}

export type MasteryTier = "novice" | "learning" | "proficient" | "mastered";

export interface MasteryProgress {
  tier: MasteryTier;
  percent: number; // 0 to 100
  accuracy: number; // 0 to 1
  totalAttempts: number;
}

export interface MasteryRetestSchedule {
  retest1: Date; // +3 days
  retest2: Date; // +10 days
}

export type XpActivityType =
  | "blitz_solve"
  | "quiz_solve"
  | "quiz_complete"
  | "lesson_complete"
  | "mind_sprint_complete"
  | "bug_audit_solve"
  | "daily_streak_bonus";
