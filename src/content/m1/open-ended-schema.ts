import { z } from "zod";

export const DrillPhase1Schema = z.object({
  prompt: z.string(),
  mcqOptions: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const DrillPhase2Schema = z.object({
  prompt: z.string(),
  mcqOptions: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const DrillPushbackNodeSchema = z.object({
  phase2ChoiceIndex: z.number().int().min(0).max(3),
  interviewerChallenge: z.string(),
  mcqOptions: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const RubricCriterionSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  description: z.string(),
  keywords: z.array(z.string()).min(1), // for deterministic offline grading
});

export const OpenEndedDrillSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  vagueScenario: z.string(),
  phase1Constraints: DrillPhase1Schema,
  phase2Primitives: DrillPhase2Schema,
  phase3Branches: z.array(DrillPushbackNodeSchema).min(1),
  rubric: z.array(RubricCriterionSchema).min(2),
  canonicalTakeaway: z.string(),
});

export type OpenEndedDrill = z.infer<typeof OpenEndedDrillSchema>;
export type DrillPushbackNode = z.infer<typeof DrillPushbackNodeSchema>;
