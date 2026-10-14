import { z } from "zod";

export const BlitzProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string(),
  constraints: z.array(z.string()),
  prompt: z.string(),
  pattern: z.string(), // governing pattern name
  patternDistractors: z.array(z.string()).length(3), // 3 distractor patterns
  invariantPrompt: z.string(),
  invariantOptions: z.array(z.string()).length(4), // 4 options
  correctInvariantIndex: z.number().int().min(0).max(3),
  pseudocode: z.string(), // 6-line pseudocode
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  edgeCases: z.array(z.string()),
  explanation: z.object({
    verdict: z.string(),
    whyPattern: z.string(),
    distractorTakedown: z.string(),
    takeaway: z.string(),
  }),
});

export type BlitzProblem = z.infer<typeof BlitzProblemSchema>;
