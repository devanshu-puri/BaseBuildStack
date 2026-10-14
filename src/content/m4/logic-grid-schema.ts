import { z } from "zod";

export const DimensionSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(z.string()).min(3),
});
export type Dimension = z.infer<typeof DimensionSchema>;

export const ClueTypeSchema = z.enum(["is", "isNot", "eitherOr", "conditional"]);
export type ClueType = z.infer<typeof ClueTypeSchema>;

export const ClueSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: ClueTypeSchema,
  itemA: z.string(),
  itemB: z.string(),
  itemC: z.string().optional(),
  itemD: z.string().optional(),
});
export type Clue = z.infer<typeof ClueSchema>;

export const LogicGridPuzzleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  dimensions: z.array(DimensionSchema).min(2),
  clues: z.array(ClueSchema).min(3),
  solution: z.array(z.record(z.string(), z.string())),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  xpAward: z.number().int().default(50),
});
export type LogicGridPuzzle = z.infer<typeof LogicGridPuzzleSchema>;

export const CellStateSchema = z.enum(["empty", "cross", "check"]);
export type CellState = z.infer<typeof CellStateSchema>;

export const LogicGridSubmissionSchema = z.object({
  puzzleId: z.string(),
  assignments: z.array(z.record(z.string(), z.string())),
  durationMs: z.number().nonnegative().default(0),
  confidence: z.enum(["guessing", "unsure", "certain"]).optional(),
});
export type LogicGridSubmission = z.infer<typeof LogicGridSubmissionSchema>;

export type EntityAssignment = Record<string, string>;

export const LogicGridResultSchema = z.object({
  puzzleId: z.string(),
  correct: z.boolean(),
  xpAwarded: z.number(),
  totalXp: z.number(),
  feedback: z.string(),
  solution: z.array(z.record(z.string(), z.string())),
  mistakes: z.array(z.string()).optional(),
});
export type LogicGridResult = z.infer<typeof LogicGridResultSchema>;
