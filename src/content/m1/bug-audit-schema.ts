import { z } from "zod";

export const TestCaseSchema = z.object({
  description: z.string().optional(),
  input: z.array(z.unknown()),
  expected: z.unknown(),
});

export const BugAuditProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.enum(["typescript", "javascript", "python"]).default("javascript"),
  code: z.string(), // 12-20 line snippet
  entryFunctionName: z.string(),
  buggyLineNumber: z.number().int().min(1), // 1-indexed
  bugType: z.string(), // e.g. "Off-by-one", "Inverted comparator", "Pointer cycle"
  breakingInputPrompt: z.string(),
  breakingInputOptions: z.array(z.string()).length(4),
  correctBreakingInputIndex: z.number().int().min(0).max(3),
  canonicalFix: z.string(), // Correct line or replacement code
  canonicalCode: z.string(), // Full verified correct code
  testCases: z.array(TestCaseSchema).min(2),
  explanation: z.object({
    verdict: z.string(),
    why: z.string(),
    distractorTakedown: z.string(),
    takeaway: z.string(),
    fix: z.string(),
  }),
});

export type BugAuditProblem = z.infer<typeof BugAuditProblemSchema>;
