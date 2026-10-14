import { z } from "zod";

export const QuizQuestionTypeSchema = z.enum(["mcq", "output", "debug", "approach"]);
export type QuizQuestionType = z.infer<typeof QuizQuestionTypeSchema>;

export const QuizDifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type QuizDifficulty = z.infer<typeof QuizDifficultySchema>;

export const QuizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type QuizOption = z.infer<typeof QuizOptionSchema>;

export const QuizExplanationSchema = z.object({
  why: z.string(),
  distractors: z.record(z.string(), z.string()), // optionId -> reason why it's incorrect
  takeaway: z.string(),
  repoEvidence: z
    .object({
      path: z.string(),
      lines: z.string(),
    })
    .optional(),
});
export type QuizExplanation = z.infer<typeof QuizExplanationSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string(),
  skill: z.string(),
  type: QuizQuestionTypeSchema,
  difficulty: QuizDifficultySchema,
  stem: z.string(),
  code: z.string().optional(),
  codeLanguage: z.string().default("typescript").optional(),
  options: z.array(QuizOptionSchema).min(2),
  correctId: z.string(),
  explanation: QuizExplanationSchema,
  verified: z.boolean().default(true),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/**
 * Stripped question structure sent to the browser before answering.
 * Prevents answer leaking in client network tab inspection.
 */
export const ClientQuizQuestionSchema = QuizQuestionSchema.omit({
  correctId: true,
  explanation: true,
});
export type ClientQuizQuestion = z.infer<typeof ClientQuizQuestionSchema>;

export const QuizModeSchema = z.enum(["quick", "fundamentals", "practical", "weak_area"]);
export type QuizMode = z.infer<typeof QuizModeSchema>;

export const QuizSubmissionPayloadSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
  ms: z.number().nonnegative(),
  answerChanges: z.number().int().nonnegative().default(0),
  confidence: z.enum(["guessing", "unsure", "certain"]).optional().nullable(),
});
export type QuizSubmissionPayload = z.infer<typeof QuizSubmissionPayloadSchema>;

export const QuizEvaluationResultSchema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  correctId: z.string(),
  selectedOptionId: z.string(),
  xpEarned: z.number(),
  speedBonus: z.number(),
  calibration: z.enum(["calibrated", "overconfident", "underconfident", "uncalibrated"]),
  explanation: z.object({
    why: z.string(),
    distractorTakedown: z.string().optional(),
    allDistractors: z.record(z.string(), z.string()),
    takeaway: z.string(),
    repoEvidence: z
      .object({
        path: z.string(),
        lines: z.string(),
      })
      .optional(),
  }),
});
export type QuizEvaluationResult = z.infer<typeof QuizEvaluationResultSchema>;
