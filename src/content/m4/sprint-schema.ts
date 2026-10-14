import { z } from "zod";

export const SprintCategorySchema = z.enum([
  "pattern",
  "deduction",
  "memory",
  "numerical",
  "tricky",
]);
export type SprintCategory = z.infer<typeof SprintCategorySchema>;

export const ConfidenceRatingSchema = z.enum([
  "guessing",
  "unsure",
  "certain",
]);
export type ConfidenceRating = z.infer<typeof ConfidenceRatingSchema>;

// Option schema for MCQ-style items
export const SprintOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type SprintOption = z.infer<typeof SprintOptionSchema>;

// Memory item specific payload
export const MemoryChallengeSchema = z.object({
  flashItems: z.array(z.string()).min(3),
  flashDurationSec: z.number().int().default(5),
  distractorTask: z.object({
    prompt: z.string(),
    options: z.array(SprintOptionSchema),
    correctOptionId: z.string(),
    durationSec: z.number().int().default(3),
  }),
  recallPrompt: z.string(),
  options: z.array(SprintOptionSchema),
  correctOptionId: z.string(),
});
export type MemoryChallenge = z.infer<typeof MemoryChallengeSchema>;

// Numerical Fermi slider item
export const FermiChallengeSchema = z.object({
  prompt: z.string(),
  unit: z.string(),
  minExponent: z.number().default(0), // 10^0 = 1
  maxExponent: z.number().default(12), // 10^12 = 1,000,000,000,000
  targetValue: z.number().positive(),
  acceptableDexRange: z.number().default(0.5), // order of magnitude tolerance
  explanation: z.string(),
});
export type FermiChallenge = z.infer<typeof FermiChallengeSchema>;

// Single Sprint Item Schema
export const SprintItemSchema = z.object({
  id: z.string(),
  category: SprintCategorySchema,
  timeLimitSec: z.number().int().positive(), // 45, 60, 45, 60, 90
  title: z.string(),
  prompt: z.string(),
  subtext: z.string().optional(),
  options: z.array(SprintOptionSchema).optional(),
  correctOptionId: z.string().optional(),
  memoryChallenge: MemoryChallengeSchema.optional(),
  fermiChallenge: FermiChallengeSchema.optional(),
  explanation: z.string(),
});
export type SprintItem = z.infer<typeof SprintItemSchema>;

// 5-item Daily Sprint
export const DailySprintSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  seed: z.string(),
  totalTimeSec: z.number().int().default(300), // 5 minutes
  items: z.array(SprintItemSchema).length(5),
});
export type DailySprint = z.infer<typeof DailySprintSchema>;

// Individual Item Submission
export const SprintItemAnswerSchema = z.object({
  itemId: z.string(),
  category: SprintCategorySchema,
  answer: z.union([z.string(), z.number()]),
  skipped: z.boolean().default(false),
  timeSpentSec: z.number().nonnegative(),
  confidence: ConfidenceRatingSchema,
});
export type SprintItemAnswer = z.infer<typeof SprintItemAnswerSchema>;

// Sprint Session Submission
export const SprintSubmissionPayloadSchema = z.object({
  date: z.string(),
  seed: z.string(),
  answers: z.array(SprintItemAnswerSchema).length(5),
  clientTimestamp: z.string(),
  completedOffline: z.boolean().default(false),
});
export type SprintSubmissionPayload = z.infer<
  typeof SprintSubmissionPayloadSchema
>;

// Individual Item Result
export const SprintItemResultSchema = z.object({
  itemId: z.string(),
  category: SprintCategorySchema,
  correct: z.boolean(),
  scorePercent: z.number().min(0).max(100),
  userAnswer: z.union([z.string(), z.number()]),
  correctAnswer: z.union([z.string(), z.number()]),
  confidence: ConfidenceRatingSchema,
  timeSpentSec: z.number(),
  explanation: z.string(),
});
export type SprintItemResult = z.infer<typeof SprintItemResultSchema>;

// Full Sprint Session Result
export const SprintResultSchema = z.object({
  date: z.string(),
  correctCount: z.number().int().min(0).max(5),
  totalItems: z.number().int().default(5),
  totalTimeSec: z.number().nonnegative(),
  overallScorePercent: z.number().min(0).max(100),
  xpAwarded: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
  streakAdvanced: z.boolean(),
  results: z.array(SprintItemResultSchema),
  syncedAt: z.string(),
});
export type SprintResult = z.infer<typeof SprintResultSchema>;
