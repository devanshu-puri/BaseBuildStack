import { describe, it, expect, beforeEach } from "vitest";
import { ALL_BLITZ_PROBLEMS, getBlitzProblemById } from "@/content/m1/problems";
import { BlitzProblemSchema } from "@/content/m1/schema";
import { getBlitzDeck, submitBlitzAnswer } from "@/lib/m1/blitz-session";
import { clearMemoryStoresForTest } from "@/lib/db/repository";
import {
  getSrsRepository,
  getAttemptRepository,
  getMistakeRepository,
  getProgressRepository,
} from "@/lib/db/repositories";
import { getDb } from "@/lib/db/client";

describe("Pattern Blitz - Problem Content & Session Engine", () => {
  const TEST_USER = "blitz_test_user_42";

  beforeEach(async () => {
    clearMemoryStoresForTest();
    try {
      const db = await getDb();
      await db.collection("srs_cards").deleteMany({ userId: { $regex: /^blitz_/ } });
      await db.collection("attempts").deleteMany({ userId: { $regex: /^blitz_/ } });
      await db.collection("mistakes").deleteMany({ userId: { $regex: /^blitz_/ } });
      await db.collection("xp_events").deleteMany({ userId: { $regex: /^blitz_/ } });
      await db.collection("streaks").deleteMany({ userId: { $regex: /^blitz_/ } });
      await db.collection("progress").deleteMany({ userId: { $regex: /^blitz_/ } });
      await db.collection("subscriptions").deleteMany({ userId: { $regex: /^blitz_/ } });
    } catch {
      // Offline fallback uses memory stores
    }
  });

  describe("Seeded Content Integrity", () => {
    it("contains at least 60 validated problems across 8 patterns", () => {
      expect(ALL_BLITZ_PROBLEMS.length).toBeGreaterThanOrEqual(60);

      const uniqueIds = new Set<string>();
      for (const problem of ALL_BLITZ_PROBLEMS) {
        // Schema validation
        const parsed = BlitzProblemSchema.safeParse(problem);
        expect(parsed.success).toBe(true);

        // ID uniqueness
        expect(uniqueIds.has(problem.id)).toBe(false);
        uniqueIds.add(problem.id);

        // Invariant options integrity
        expect(problem.invariantOptions.length).toBe(4);
        expect(problem.correctInvariantIndex).toBeGreaterThanOrEqual(0);
        expect(problem.correctInvariantIndex).toBeLessThan(4);

        // Explanation completeness
        expect(problem.explanation.verdict).toBeTruthy();
        expect(problem.explanation.whyPattern).toBeTruthy();
        expect(problem.explanation.distractorTakedown).toBeTruthy();
        expect(problem.explanation.takeaway).toBeTruthy();

        // Pseudocode integrity
        expect(problem.pseudocode).toBeTruthy();
      }
    });

    it("retrieves problems accurately by ID", () => {
      const sample = ALL_BLITZ_PROBLEMS[0];
      const retrieved = getBlitzProblemById(sample.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(sample.title);

      const nonexistent = getBlitzProblemById("non-existent-id-999");
      expect(nonexistent).toBeUndefined();
    });
  });

  describe("Deck Loading (getBlitzDeck)", () => {
    it("loads requested number of cards with 4 pattern options", async () => {
      const { cards, dailyQuotaReached } = await getBlitzDeck(TEST_USER, 5);
      expect(dailyQuotaReached).toBe(false);
      expect(cards.length).toBe(5);

      for (const card of cards) {
        expect(card.patternOptions.length).toBe(4);
        expect(card.patternOptions).toContain(card.problem.pattern);
        expect(card.isRevision).toBe(false);
      }
    });

    it("prioritizes due SRS revision cards", async () => {
      const srsRepo = getSrsRepository(TEST_USER);
      const targetProblem = ALL_BLITZ_PROBLEMS[10];

      // Insert an overdue SRS card
      await srsRepo.upsertCard({
        itemId: targetProblem.id,
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        due: new Date(Date.now() - 3600_000), // 1 hour ago
      });

      const { cards } = await getBlitzDeck(TEST_USER, 5);
      expect(cards.length).toBe(5);
      expect(cards[0].problem.id).toBe(targetProblem.id);
      expect(cards[0].isRevision).toBe(true);
    });

    it("detects free tier daily quota when 5 attempts already made today", async () => {
      const attemptRepo = getAttemptRepository(TEST_USER);

      for (let i = 0; i < 5; i++) {
        await attemptRepo.recordAttempt({
          module: "m1",
          itemId: `dummy_prob_${i}`,
          answer: { pattern: "Two Pointers" },
          correct: true,
          ms: 4000,
        });
      }

      const { cards, dailyQuotaReached } = await getBlitzDeck(TEST_USER, 5);
      expect(dailyQuotaReached).toBe(true);
      expect(cards.length).toBe(0);
    });
  });

  describe("Answer Evaluation & State Updates (submitBlitzAnswer)", () => {
    it("evaluates correct pattern and invariant, awards XP, updates SRS and progress", async () => {
      const problem = ALL_BLITZ_PROBLEMS[0];
      const verdict = await submitBlitzAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedPattern: problem.pattern,
        selectedInvariantIndex: problem.correctInvariantIndex,
        ms: 5000,
        confidence: "certain",
      });

      expect(verdict.isCorrect).toBe(true);
      expect(verdict.patternCorrect).toBe(true);
      expect(verdict.invariantCorrect).toBe(true);
      expect(verdict.speedBonus).toBeGreaterThan(0);
      expect(verdict.xpAwarded).toBe(10 + verdict.speedBonus);
      expect(verdict.calibration).toBe("calibrated");

      // Check SRS card created with interval >= 1
      const srsRepo = getSrsRepository(TEST_USER);
      const card = await srsRepo.getCard(problem.id);
      expect(card).toBeDefined();
      expect(card?.repetitions).toBe(1);

      // Check Progress marked completed
      const progressRepo = getProgressRepository(TEST_USER);
      const prog = await progressRepo.getProgress("m1", problem.id);
      expect(prog?.status).toBe("completed");

      // Check Attempt recorded
      const attemptRepo = getAttemptRepository(TEST_USER);
      const attempts = await attemptRepo.getModuleAttempts("m1");
      expect(attempts.length).toBe(1);
      expect(attempts[0].correct).toBe(true);

      // Verify XP idempotency on duplicate solve
      const secondVerdict = await submitBlitzAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedPattern: problem.pattern,
        selectedInvariantIndex: problem.correctInvariantIndex,
        ms: 5000,
      });
      expect(secondVerdict.xpAwarded).toBe(0); // Already awarded for blitz_{problemId}
    });

    it("evaluates wrong pattern, logs mistake, resets SRS interval, does not award XP", async () => {
      const problem = ALL_BLITZ_PROBLEMS[1];
      const verdict = await submitBlitzAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedPattern: problem.patternDistractors[0], // Wrong pattern
        selectedInvariantIndex: problem.correctInvariantIndex,
        ms: 12000,
        confidence: "certain",
      });

      expect(verdict.isCorrect).toBe(false);
      expect(verdict.patternCorrect).toBe(false);
      expect(verdict.invariantCorrect).toBe(true);
      expect(verdict.xpAwarded).toBe(0);
      expect(verdict.calibration).toBe("overconfident");

      // Mistake logged
      const mistakeRepo = getMistakeRepository(TEST_USER);
      const mistakes = await mistakeRepo.getMistakes("m1");
      expect(mistakes.length).toBe(1);
      expect(mistakes[0].itemId).toBe(problem.id);
      expect(mistakes[0].reason).toContain("Misidentified pattern");

      // Progress in_progress
      const progressRepo = getProgressRepository(TEST_USER);
      const prog = await progressRepo.getProgress("m1", problem.id);
      expect(prog?.status).toBe("in_progress");
    });

    it("evaluates wrong invariant even if pattern is correct", async () => {
      const problem = ALL_BLITZ_PROBLEMS[2];
      const wrongInvariantIdx = (problem.correctInvariantIndex + 1) % 4;

      const verdict = await submitBlitzAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedPattern: problem.pattern,
        selectedInvariantIndex: wrongInvariantIdx,
        ms: 8000,
      });

      expect(verdict.isCorrect).toBe(false);
      expect(verdict.patternCorrect).toBe(true);
      expect(verdict.invariantCorrect).toBe(false);
      expect(verdict.xpAwarded).toBe(0);
    });

    it("throws when problemId is invalid", async () => {
      await expect(
        submitBlitzAnswer({
          userId: TEST_USER,
          problemId: "unknown-problem-xyz",
          selectedPattern: "Two Pointers",
          selectedInvariantIndex: 0,
          ms: 1000,
        })
      ).rejects.toThrow("Problem not found");
    });
  });
});
