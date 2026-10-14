import { z } from "zod";

export const LessonPathSchema = z.enum([
  "ai",
  "backend",
  "frontend",
  "devops",
  "foundations",
]);
export type LessonPath = z.infer<typeof LessonPathSchema>;

export const LessonStageTypeSchema = z.enum([
  "why",
  "mental_model",
  "see_it",
  "try_it",
  "recall",
]);
export type LessonStageType = z.infer<typeof LessonStageTypeSchema>;

export const LessonStepContentTypeSchema = z.enum([
  "text",
  "stepDiagram",
  "animatedFlow",
  "comparison",
  "simulation",
  "codeWalkthrough",
  "predict",
  "arrangeSteps",
  "quiz",
]);
export type LessonStepContentType = z.infer<typeof LessonStepContentTypeSchema>;

export const DiagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  subtext: z.string().optional(),
});
export type DiagramNode = z.infer<typeof DiagramNodeSchema>;

export const InteractiveExerciseOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type InteractiveExerciseOption = z.infer<
  typeof InteractiveExerciseOptionSchema
>;

export const InteractiveExerciseSchema = z.object({
  prompt: z.string(),
  options: z.array(InteractiveExerciseOptionSchema).min(2),
  correctOptionId: z.string(),
  explanation: z.string(),
});
export type InteractiveExercise = z.infer<typeof InteractiveExerciseSchema>;

export const LessonStepSchema = z.object({
  stage: LessonStageTypeSchema,
  stageNumber: z.number().int().min(1).max(5),
  title: z.string(),
  durationMinutes: z.number().int().min(1).max(5),
  type: LessonStepContentTypeSchema,
  content: z.string(), // Primary instructional text / markdown
  codeSnippet: z.string().optional(),
  codeLanguage: z.string().default("typescript").optional(),
  diagramNodes: z.array(DiagramNodeSchema).optional(),
  interactiveExercise: InteractiveExerciseSchema.optional(),
  keyTakeaway: z.string().optional(),
});
export type LessonStep = z.infer<typeof LessonStepSchema>;

export const LessonReferenceSchema = z.object({
  whereUsed: z.array(z.string()),
  commonlyConfusedWith: z.array(z.string()),
  remember: z.array(z.string()),
});
export type LessonReference = z.infer<typeof LessonReferenceSchema>;

export const LessonRetestSchema = z.object({
  day3: InteractiveExerciseSchema,
  day10: InteractiveExerciseSchema,
});
export type LessonRetest = z.infer<typeof LessonRetestSchema>;

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  outcome: z.string(), // one clear outcome sentence
  paths: z.array(LessonPathSchema).min(1),
  prerequisites: z.array(z.string()).default([]),
  steps: z.array(LessonStepSchema).length(5), // exactly 5 stages
  reference: LessonReferenceSchema,
  retestChallenges: LessonRetestSchema.optional(),
  xpAward: z.number().int().default(50),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const LessonCompletionPayloadSchema = z.object({
  lessonId: z.string(),
  recallAnswerId: z.string(),
  tryItAnswerId: z.string().optional(),
  durationMs: z.number().nonnegative(),
  bookmarked: z.boolean().default(false),
});
export type LessonCompletionPayload = z.infer<
  typeof LessonCompletionPayloadSchema
>;

export const LessonCompletionResultSchema = z.object({
  lessonId: z.string(),
  recallPassed: z.boolean(),
  xpAwarded: z.number(),
  totalXp: z.number(),
  completedAt: z.string(),
  bookmarked: z.boolean(),
  feedback: z.string(),
});
export type LessonCompletionResult = z.infer<
  typeof LessonCompletionResultSchema
>;

export const RetestStageSchema = z.enum(["day3", "day10"]);
export type RetestStage = z.infer<typeof RetestStageSchema>;

export const RetestSubmissionPayloadSchema = z.object({
  lessonId: z.string(),
  stage: RetestStageSchema,
  selectedOptionId: z.string(),
  durationMs: z.number().nonnegative().default(0),
});
export type RetestSubmissionPayload = z.infer<
  typeof RetestSubmissionPayloadSchema
>;

export const RetestSubmissionResultSchema = z.object({
  lessonId: z.string(),
  stage: RetestStageSchema,
  passed: z.boolean(),
  xpAwarded: z.number(),
  totalXp: z.number(),
  mastered: z.boolean(),
  newInterval: z.number(),
  nextDueDate: z.string(),
  feedback: z.string(),
  explanation: z.string(),
});
export type RetestSubmissionResult = z.infer<
  typeof RetestSubmissionResultSchema
>;

