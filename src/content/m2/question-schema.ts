import { z } from "zod";

export const M2QuestionDifficultySchema = z.enum(["basic", "medium", "hard"]);
export type M2QuestionDifficulty = z.infer<typeof M2QuestionDifficultySchema>;

export const M2QuestionTypeSchema = z.enum([
  "mcq",
  "multi_select",
  "output",
  "concept_scenario",
]);
export type M2QuestionType = z.infer<typeof M2QuestionTypeSchema>;

export const M2QuestionModeSchema = z.enum([
  "skill_drill",
  "core_fundamentals",
]);
export type M2QuestionMode = z.infer<typeof M2QuestionModeSchema>;

export const M2OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export type M2Option = z.infer<typeof M2OptionSchema>;

export const M2ExplanationSchema = z.object({
  whyCorrect: z.string().min(5),
  whyWrong: z.record(z.string(), z.string()),
  interviewTakeaway: z.string().min(5),
  followUp: z.string().optional(),
});
export type M2Explanation = z.infer<typeof M2ExplanationSchema>;

export const M2QuestionCodeSchema = z.object({
  language: z.string().min(1),
  source: z.string().min(1),
});
export type M2QuestionCode = z.infer<typeof M2QuestionCodeSchema>;

export const M2QuestionStatusSchema = z.enum([
  "draft",
  "reviewed",
  "published",
  "retired",
]);
export type M2QuestionStatus = z.infer<typeof M2QuestionStatusSchema>;

export const M2QuestionSchema = z.object({
  id: z.string().min(1),
  skillId: z.string().min(1),
  topic: z.string().min(1),
  mode: z.array(M2QuestionModeSchema).min(1),
  difficulty: M2QuestionDifficultySchema,
  type: M2QuestionTypeSchema,
  interviewFrequency: z.number().int().min(1).max(5),
  prompt: z.string().min(5),
  code: M2QuestionCodeSchema.optional(),
  options: z.array(M2OptionSchema).min(2),
  correctOptionIds: z.array(z.string().min(1)).min(1),
  lockOptionOrder: z.boolean().default(false),
  explanation: M2ExplanationSchema,
  tags: z.array(z.string()).default([]),
  sourceRefs: z.array(z.string()).default([]),
  version: z.number().int().default(1),
  status: M2QuestionStatusSchema.default("published"),
  createdAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  expectedOutput: z.string().optional(),
});
export type M2Question = z.infer<typeof M2QuestionSchema>;

/**
 * Stripped question structure sent to the browser before answering.
 * Prevents answer leaking in client network tab inspection.
 */
export const ClientM2QuestionSchema = M2QuestionSchema.omit({
  correctOptionIds: true,
  explanation: true,
  expectedOutput: true,
});
export type ClientM2Question = z.infer<typeof ClientM2QuestionSchema>;

export function sanitizeM2QuestionForClient(q: M2Question): ClientM2Question {
  return {
    id: q.id,
    skillId: q.skillId,
    topic: q.topic,
    mode: q.mode,
    difficulty: q.difficulty,
    type: q.type,
    interviewFrequency: q.interviewFrequency,
    prompt: q.prompt,
    code: q.code,
    options: q.options,
    lockOptionOrder: q.lockOptionOrder,
    tags: q.tags,
    sourceRefs: q.sourceRefs,
    version: q.version,
    status: q.status,
    createdAt: q.createdAt,
    reviewedBy: q.reviewedBy,
  };
}
