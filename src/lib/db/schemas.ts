import { z } from "zod";

// 1. User
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().nullable().optional(),
  role: z.enum(["user", "admin"]).default("user"),
  targetRole: z.string().default("AI Engineer"),
  stack: z.array(z.string()).default([]),
  plan: z.enum(["free", "pro"]).default("free"),
  createdAt: z.date().default(() => new Date()),
});
export type UserDocument = z.infer<typeof UserSchema>;

// 2. Profile
export const ProfileSchema = z.object({
  userId: z.string(),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.enum(["beginner", "intermediate", "advanced"]),
        source: z.enum(["manual", "resume", "repo"]),
        confirmed: z.boolean().default(true),
      })
    )
    .default([]),
  resumeMeta: z
    .object({
      filename: z.string(),
      uploadedAt: z.date(),
      extractedCount: z.number(),
    })
    .optional(),
  keepResume: z.boolean().default(false),
  updatedAt: z.date().default(() => new Date()),
});
export type ProfileDocument = z.infer<typeof ProfileSchema>;

// 3. Progress
export const ProgressSchema = z.object({
  userId: z.string(),
  module: z.enum(["m1", "m2", "m3", "m4"]),
  itemId: z.string(),
  status: z.enum(["todo", "in_progress", "completed"]),
  stage: z.number().default(1),
  updatedAt: z.date().default(() => new Date()),
});
export type ProgressDocument = z.infer<typeof ProgressSchema>;

// 4. Attempts
export const AttemptSchema = z.object({
  userId: z.string(),
  module: z.enum(["m1", "m2", "m3", "m4"]),
  itemId: z.string(),
  answer: z.unknown(),
  correct: z.boolean(),
  ms: z.number().min(0),
  changes: z.number().default(0),
  confidence: z.enum(["guessing", "unsure", "certain"]).nullable().optional(),
  ts: z.date().default(() => new Date()),
});
export type AttemptDocument = z.infer<typeof AttemptSchema>;

// 5. Mistakes
export const MistakeSchema = z.object({
  userId: z.string(),
  source: z.enum(["m1", "m2", "m3", "m4"]),
  itemId: z.string(),
  reason: z.string(),
  retries: z.number().default(0),
  lastSeen: z.date().default(() => new Date()),
});
export type MistakeDocument = z.infer<typeof MistakeSchema>;

// 6. Bookmarks
export const BookmarkSchema = z.object({
  userId: z.string(),
  module: z.enum(["m1", "m2", "m3", "m4"]),
  itemId: z.string(),
  title: z.string().optional(),
  ts: z.date().default(() => new Date()),
});
export type BookmarkDocument = z.infer<typeof BookmarkSchema>;

// 7. SRS Cards (Spaced Repetition SM-2)
export const SrsCardSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
  ease: z.number().default(2.5),
  interval: z.number().default(1),
  due: z.date(),
  repetitions: z.number().default(0),
});
export type SrsCardDocument = z.infer<typeof SrsCardSchema>;

// 8. XP Events (Idempotent Ledger)
export const XpEventSchema = z.object({
  userId: z.string(),
  type: z.string(), // e.g. "lesson_complete", "blitz_solve", "mind_sprint"
  amount: z.number().positive(),
  refId: z.string(), // unique reference id (e.g. lesson id) to prevent double XP
  ts: z.date().default(() => new Date()),
});
export type XpEventDocument = z.infer<typeof XpEventSchema>;

// 9. Milestones
export const MilestoneSchema = z.object({
  userId: z.string(),
  key: z.string(),
  unlockedAt: z.date().nullable(),
  progress: z.number().default(0),
  total: z.number(),
});
export type MilestoneDocument = z.infer<typeof MilestoneSchema>;

// 10. Streaks
export const StreakSchema = z.object({
  userId: z.string(),
  current: z.number().default(0),
  longest: z.number().default(0),
  lastDay: z.string(), // YYYY-MM-DD
});
export type StreakDocument = z.infer<typeof StreakSchema>;

// 11. Subscriptions
export const SubscriptionSchema = z.object({
  userId: z.string(),
  provider: z.enum(["razorpay"]),
  planId: z.string(),
  status: z.enum(["active", "cancelled", "expired"]),
  currentPeriodEnd: z.date(),
  providerRef: z.string(),
  updatedAt: z.date().default(() => new Date()),
});
export type SubscriptionDocument = z.infer<typeof SubscriptionSchema>;

// 12. Quiz Sessions
export const QuizSessionSchema = z.object({
  userId: z.string(),
  mode: z.enum(["standard", "rapid", "weakness"]).default("standard"),
  questionIds: z.array(z.string()).default([]),
  startedAt: z.date().default(() => new Date()),
  finishedAt: z.date().nullable().optional(),
});
export type QuizSessionDocument = z.infer<typeof QuizSessionSchema>;

// 13. Repos
export const RepoSchema = z.object({
  userId: z.string(),
  owner: z.string(),
  name: z.string(),
  claims: z.array(z.string()).default([]),
  indexedAt: z.date().default(() => new Date()),
});
export type RepoDocument = z.infer<typeof RepoSchema>;

// 14. Repo Chunks
export const RepoChunkSchema = z.object({
  userId: z.string(),
  repoId: z.string(),
  path: z.string(),
  lines: z.array(z.number()),
  text: z.string(),
  embedding: z.array(z.number()).optional(),
});
export type RepoChunkDocument = z.infer<typeof RepoChunkSchema>;

// 15. Questions (Global / curated)
export const QuestionSchema = z.object({
  id: z.string(),
  skill: z.string(),
  type: z.enum(["mcq", "multi_choice", "spot_bug", "fill_blank"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  payload: z.record(z.string(), z.unknown()),
  verified: z.boolean().default(true),
  source: z.enum(["curated", "generated", "repo"]).default("curated"),
});
export type QuestionDocument = z.infer<typeof QuestionSchema>;

// 16. Lessons (Global / curated)
export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  outcome: z.string(),
  paths: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  steps: z.array(z.record(z.string(), z.unknown())).default([]),
  reference: z.string().optional(),
});
export type LessonDocument = z.infer<typeof LessonSchema>;

// 17. Puzzles (Global / curated)
export const PuzzleSchema = z.object({
  id: z.string(),
  category: z.string(),
  params: z.record(z.string(), z.unknown()),
  solutionHash: z.string(),
  verified: z.boolean().default(true),
});
export type PuzzleDocument = z.infer<typeof PuzzleSchema>;

// 18. Payment Events (Idempotency)
export const PaymentEventSchema = z.object({
  eventId: z.string(),
  type: z.string(),
  processedAt: z.date().default(() => new Date()),
});
export type PaymentEventDocument = z.infer<typeof PaymentEventSchema>;

// 19. News Items
export const NewsItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  summary: z.string(),
  fetchedAt: z.date().default(() => new Date()),
});
export type NewsItemDocument = z.infer<typeof NewsItemSchema>;
