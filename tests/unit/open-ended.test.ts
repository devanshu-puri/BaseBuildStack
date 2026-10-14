import { describe, it, expect, beforeEach } from "vitest";
import {
  ALL_OPEN_ENDED_DRILLS,
  getOpenEndedDrillById,
} from "@/content/m1/open-ended-problems";
import { OpenEndedDrillSchema } from "@/content/m1/open-ended-schema";
import {
  getPushbackNode,
  evaluateRubricDeterministically,
  submitOpenEndedDrill,
} from "@/lib/m1/open-ended-session";
import { clearMemoryStoresForTest } from "@/lib/db/repository";
import {
  getAttemptRepository,
  getMistakeRepository,
  getProgressRepository,
} from "@/lib/db/repositories";
import { getDb } from "@/lib/db/client";

describe("Open-Ended Decision Tree Drills & Rubric Evaluation", () => {
  const TEST_USER = "open_ended_test_user_88";

  beforeEach(async () => {
    clearMemoryStoresForTest();
    try {
      const db = await getDb();
      await db.collection("attempts").deleteMany({ userId: { $regex: /^open_ended_/ } });
      await db.collection("mistakes").deleteMany({ userId: { $regex: /^open_ended_/ } });
      await db.collection("xp_events").deleteMany({ userId: { $regex: /^open_ended_/ } });
      await db.collection("streaks").deleteMany({ userId: { $regex: /^open_ended_/ } });
      await db.collection("progress").deleteMany({ userId: { $regex: /^open_ended_/ } });
    } catch {
      // Memory store fallback
    }
  });

  describe("1. Schema & Decision Tree Content Integrity", () => {
    it("validates all seeded drills against OpenEndedDrillSchema", () => {
      expect(ALL_OPEN_ENDED_DRILLS.length).toBeGreaterThanOrEqual(3);

      const uniqueIds = new Set<string>();

      for (const drill of ALL_OPEN_ENDED_DRILLS) {
        const parsed = OpenEndedDrillSchema.safeParse(drill);
        expect(parsed.success).toBe(true);

        // ID uniqueness
        expect(uniqueIds.has(drill.id)).toBe(false);
        uniqueIds.add(drill.id);

        // Phase 1 constraints options
        expect(drill.phase1Constraints.mcqOptions.length).toBe(4);
        expect(drill.phase1Constraints.correctIndex).toBeGreaterThanOrEqual(0);
        expect(drill.phase1Constraints.correctIndex).toBeLessThan(4);

        // Phase 2 primitives options
        expect(drill.phase2Primitives.mcqOptions.length).toBe(4);
        expect(drill.phase2Primitives.correctIndex).toBeGreaterThanOrEqual(0);
        expect(drill.phase2Primitives.correctIndex).toBeLessThan(4);

        // Phase 3 pushback branches
        expect(drill.phase3Branches.length).toBeGreaterThanOrEqual(1);
        for (const branch of drill.phase3Branches) {
          expect(branch.interviewerChallenge).toBeTruthy();
          expect(branch.mcqOptions.length).toBe(4);
          expect(branch.correctIndex).toBeGreaterThanOrEqual(0);
          expect(branch.correctIndex).toBeLessThan(4);
        }

        // Rubric weights sum to approximately 1.0
        const totalWeight = drill.rubric.reduce((sum, r) => sum + r.weight, 0);
        expect(totalWeight).toBeCloseTo(1.0, 1);
        expect(drill.canonicalTakeaway).toBeTruthy();
      }
    });

    it("retrieves drill accurately by ID", () => {
      const sample = ALL_OPEN_ENDED_DRILLS[0];
      const retrieved = getOpenEndedDrillById(sample.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(sample.title);

      const missing = getOpenEndedDrillById("non_existent_drill");
      expect(missing).toBeUndefined();
    });

    it("resolves dynamic pushback branch corresponding to Phase 2 choice", () => {
      const drill = ALL_OPEN_ENDED_DRILLS[0];
      const branch0 = getPushbackNode(drill, 0);
      expect(branch0.phase2ChoiceIndex).toBe(0);

      const branch1 = getPushbackNode(drill, 1);
      expect(branch1.phase2ChoiceIndex).toBe(1);
    });
  });

  describe("2. Deterministic Rubric Evaluator (LLM-Disabled Mode)", () => {
    it("grades comprehensive technical defence with high score deterministically", () => {
      const drill = ALL_OPEN_ENDED_DRILLS[0]; // Rate Limiter
      const strongDefence = `
        To achieve sub-5ms latency under 10k QPS, we use in-memory Redis cluster with atomic Lua scripts.
        To handle network partitions, we implement local in-process token rationing and fail-open circuit breakers.
        Token bucket smoothing ensures bursts are absorbed without exceeding tenant quotas.
      `;

      const result = evaluateRubricDeterministically(strongDefence, drill);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.criteriaBreakdown.length).toBe(drill.rubric.length);
      expect(result.feedback).toContain("Comprehensive defence");
    });

    it("penalizes superficial defence lacking architectural keywords", () => {
      const drill = ALL_OPEN_ENDED_DRILLS[0];
      const weakDefence = "We will just make the server bigger and add more RAM.";

      const result = evaluateRubricDeterministically(weakDefence, drill);
      expect(result.score).toBeLessThan(50);
      expect(result.feedback).toContain("Defence lacks key architectural primitives");
    });
  });

  describe("3. Dual-Path Drill Evaluation & State Updates", () => {
    it("evaluates all correct MCQ phases, awards XP, and completes progress without LLM", async () => {
      const drill = ALL_OPEN_ENDED_DRILLS[0];
      const branch = getPushbackNode(drill, drill.phase2Primitives.correctIndex);

      const verdict = await submitOpenEndedDrill({
        userId: TEST_USER,
        drillId: drill.id,
        phase1Selected: drill.phase1Constraints.correctIndex,
        phase2Selected: drill.phase2Primitives.correctIndex,
        phase3Selected: branch.correctIndex,
        ms: 45_000,
      });

      expect(verdict.isFullyCorrect).toBe(true);
      expect(verdict.phase1Correct).toBe(true);
      expect(verdict.phase2Correct).toBe(true);
      expect(verdict.phase3Correct).toBe(true);
      expect(verdict.mcqScore).toBe(100);
      expect(verdict.xpAwarded).toBe(25);

      // Verify Attempt recorded
      const attemptRepo = getAttemptRepository(TEST_USER);
      const attempts = await attemptRepo.getModuleAttempts("m1");
      expect(attempts.length).toBe(1);
      expect(attempts[0].correct).toBe(true);

      // Verify Progress marked completed
      const progressRepo = getProgressRepository(TEST_USER);
      const prog = await progressRepo.getProgress("m1", drill.id);
      expect(prog?.status).toBe("completed");

      // Verify XP idempotency
      const dupeVerdict = await submitOpenEndedDrill({
        userId: TEST_USER,
        drillId: drill.id,
        phase1Selected: drill.phase1Constraints.correctIndex,
        phase2Selected: drill.phase2Primitives.correctIndex,
        phase3Selected: branch.correctIndex,
        ms: 45_000,
      });
      expect(dupeVerdict.xpAwarded).toBe(0);
    });

    it("evaluates incorrect phase choice, logs mistake with failed phase details", async () => {
      const drill = ALL_OPEN_ENDED_DRILLS[1];
      const wrongPhase1 = (drill.phase1Constraints.correctIndex + 1) % 4;

      const verdict = await submitOpenEndedDrill({
        userId: TEST_USER,
        drillId: drill.id,
        phase1Selected: wrongPhase1,
        phase2Selected: drill.phase2Primitives.correctIndex,
        phase3Selected: drill.phase3Branches[0].correctIndex,
        ms: 60_000,
      });

      expect(verdict.isFullyCorrect).toBe(false);
      expect(verdict.phase1Correct).toBe(false);
      expect(verdict.xpAwarded).toBe(0);

      // Mistake logged
      const mistakeRepo = getMistakeRepository(TEST_USER);
      const mistakes = await mistakeRepo.getMistakes("m1");
      expect(mistakes.length).toBe(1);
      expect(mistakes[0].itemId).toBe(drill.id);
      expect(mistakes[0].reason).toContain("Phase 1 (Constraints)");

      // Progress in_progress
      const progressRepo = getProgressRepository(TEST_USER);
      const prog = await progressRepo.getProgress("m1", drill.id);
      expect(prog?.status).toBe("in_progress");
    });

    it("evaluates free-text defence with rubric breakdown and bonus XP", async () => {
      const drill = ALL_OPEN_ENDED_DRILLS[0];
      const branch = getPushbackNode(drill, drill.phase2Primitives.correctIndex);

      const verdict = await submitOpenEndedDrill({
        userId: TEST_USER,
        drillId: drill.id,
        phase1Selected: drill.phase1Constraints.correctIndex,
        phase2Selected: drill.phase2Primitives.correctIndex,
        phase3Selected: branch.correctIndex,
        freeTextDefence: "We use in-memory Redis with atomic Lua scripts for sub-5ms latency and token rationing with fail-open fallback.",
        ms: 75_000,
      });

      expect(verdict.rubricEvaluation).toBeDefined();
      expect(verdict.rubricEvaluation?.score).toBeGreaterThanOrEqual(60);
      expect(verdict.xpAwarded).toBeGreaterThan(25); // 25 base + rubric bonus
    });

    it("throws error when drill ID is invalid", async () => {
      await expect(
        submitOpenEndedDrill({
          userId: TEST_USER,
          drillId: "unknown-drill-xyz",
          phase1Selected: 0,
          phase2Selected: 0,
          phase3Selected: 0,
          ms: 1000,
        })
      ).rejects.toThrow("Open-ended drill not found");
    });
  });
});
