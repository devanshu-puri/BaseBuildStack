import { describe, it, expect, beforeEach } from "vitest";
import {
  ALL_BUG_AUDIT_PROBLEMS,
  getBugAuditProblemById,
} from "@/content/m1/bug-audit-problems";
import { BugAuditProblemSchema } from "@/content/m1/bug-audit-schema";
import {
  getBugAuditDeck,
  submitBugAuditAnswer,
} from "@/lib/m1/bug-audit-session";
import { validateBugFix } from "@/lib/sandbox/runner";
import { clearMemoryStoresForTest } from "@/lib/db/repository";
import {
  getSrsRepository,
  getAttemptRepository,
  getMistakeRepository,
  getProgressRepository,
} from "@/lib/db/repositories";
import { getDb } from "@/lib/db/client";

describe("Bug Audit Mode & Sandbox Execution Validation", () => {
  const TEST_USER = "bug_audit_test_user_77";

  beforeEach(async () => {
    clearMemoryStoresForTest();
    try {
      const db = await getDb();
      await db.collection("srs_cards").deleteMany({ userId: { $regex: /^bug_audit_/ } });
      await db.collection("attempts").deleteMany({ userId: { $regex: /^bug_audit_/ } });
      await db.collection("mistakes").deleteMany({ userId: { $regex: /^bug_audit_/ } });
      await db.collection("xp_events").deleteMany({ userId: { $regex: /^bug_audit_/ } });
      await db.collection("streaks").deleteMany({ userId: { $regex: /^bug_audit_/ } });
      await db.collection("progress").deleteMany({ userId: { $regex: /^bug_audit_/ } });
      await db.collection("subscriptions").deleteMany({ userId: { $regex: /^bug_audit_/ } });
    } catch {
      // Memory store fallback
    }
  });

  describe("1. Problem Content & Line Number Verification", () => {
    it("validates all seeded problems match BugAuditProblemSchema", () => {
      expect(ALL_BUG_AUDIT_PROBLEMS.length).toBeGreaterThanOrEqual(8);

      const uniqueIds = new Set<string>();

      for (const problem of ALL_BUG_AUDIT_PROBLEMS) {
        const parsed = BugAuditProblemSchema.safeParse(problem);
        expect(parsed.success).toBe(true);

        // ID uniqueness
        expect(uniqueIds.has(problem.id)).toBe(false);
        uniqueIds.add(problem.id);

        // Line bounds
        const lines = problem.code.split("\n");
        expect(problem.buggyLineNumber).toBeGreaterThanOrEqual(1);
        expect(problem.buggyLineNumber).toBeLessThanOrEqual(lines.length);

        // Target line must not be an empty line
        const targetLine = lines[problem.buggyLineNumber - 1];
        expect(targetLine.trim().length).toBeGreaterThan(0);

        // 4 options for breaking inputs
        expect(problem.breakingInputOptions.length).toBe(4);
        expect(problem.correctBreakingInputIndex).toBeGreaterThanOrEqual(0);
        expect(problem.correctBreakingInputIndex).toBeLessThan(4);

        // Explanation completeness
        expect(problem.explanation.verdict).toBeTruthy();
        expect(problem.explanation.why).toBeTruthy();
        expect(problem.explanation.distractorTakedown).toBeTruthy();
        expect(problem.explanation.takeaway).toBeTruthy();
        expect(problem.explanation.fix).toBeTruthy();
      }
    });

    it("retrieves problems accurately by ID", () => {
      const sample = ALL_BUG_AUDIT_PROBLEMS[0];
      const retrieved = getBugAuditProblemById(sample.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(sample.title);

      const missing = getBugAuditProblemById("non-existent-bug-99");
      expect(missing).toBeUndefined();
    });
  });

  describe("2. Deterministic Sandbox Execution Validation", () => {
    it("verifies canonical code passes all test cases in Node sandbox", async () => {
      // Test first 4 problems for quick deterministic verification
      const sampleProblems = ALL_BUG_AUDIT_PROBLEMS.slice(0, 4);

      for (const problem of sampleProblems) {
        const canonicalResult = await validateBugFix(
          problem.canonicalCode,
          problem.entryFunctionName,
          problem.testCases,
          { timeoutMs: 500 }
        );

        expect(canonicalResult.passed).toBe(true);
        expect(canonicalResult.passedTests).toBe(problem.testCases.length);
        expect(canonicalResult.failedTests).toBe(0);
      }
    });

    it("verifies buggy code fails in sandbox on breaking inputs", async () => {
      // Binary search problem with infinite loop
      const binSearch = getBugAuditProblemById("bug_bin_search_1")!;
      const buggyResult = await validateBugFix(
        binSearch.code,
        binSearch.entryFunctionName,
        binSearch.testCases,
        { timeoutMs: 200 } // Short timeout catches infinite loop
      );

      expect(buggyResult.passed).toBe(false);
      expect(buggyResult.failedTests).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Deck Loading (getBugAuditDeck)", () => {
    it("loads requested number of problems with revision prioritization", async () => {
      const srsRepo = getSrsRepository(TEST_USER);
      const targetProblem = ALL_BUG_AUDIT_PROBLEMS[3];

      // Overdue card
      await srsRepo.upsertCard({
        itemId: targetProblem.id,
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        due: new Date(Date.now() - 3600_000),
      });

      const { cards, dailyQuotaReached } = await getBugAuditDeck(TEST_USER, 4);
      expect(dailyQuotaReached).toBe(false);
      expect(cards.length).toBe(4);
      expect(cards[0].problem.id).toBe(targetProblem.id);
      expect(cards[0].isRevision).toBe(true);
    });

    it("enforces free tier daily quota of 5 attempts", async () => {
      const attemptRepo = getAttemptRepository(TEST_USER);

      for (let i = 0; i < 5; i++) {
        await attemptRepo.recordAttempt({
          module: "m1",
          itemId: `dummy_bug_${i}`,
          answer: { line: 10 },
          correct: true,
          ms: 5000,
        });
      }

      const { cards, dailyQuotaReached } = await getBugAuditDeck(TEST_USER, 5);
      expect(dailyQuotaReached).toBe(true);
      expect(cards.length).toBe(0);
    });
  });

  describe("4. Answer Evaluation & State Updates (submitBugAuditAnswer)", () => {
    it("evaluates both correct line and correct input, awards XP, updates SRS & progress", async () => {
      const problem = ALL_BUG_AUDIT_PROBLEMS[0];

      const verdict = await submitBugAuditAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedLineNumber: problem.buggyLineNumber,
        selectedBreakingInputIndex: problem.correctBreakingInputIndex,
        ms: 15_000,
        confidence: "certain",
      });

      expect(verdict.isCorrect).toBe(true);
      expect(verdict.lineCorrect).toBe(true);
      expect(verdict.inputCorrect).toBe(true);
      expect(verdict.speedBonus).toBeGreaterThan(0);
      expect(verdict.xpAwarded).toBe(15 + verdict.speedBonus);
      expect(verdict.correctLineNumber).toBe(problem.buggyLineNumber);
      expect(verdict.calibration).toBe("calibrated");

      // Verify SRS card created
      const srsRepo = getSrsRepository(TEST_USER);
      const card = await srsRepo.getCard(problem.id);
      expect(card).toBeDefined();
      expect(card?.repetitions).toBe(1);

      // Verify progress completed
      const progressRepo = getProgressRepository(TEST_USER);
      const prog = await progressRepo.getProgress("m1", problem.id);
      expect(prog?.status).toBe("completed");

      // Idempotency: duplicate solve should not award XP again
      const dupeVerdict = await submitBugAuditAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedLineNumber: problem.buggyLineNumber,
        selectedBreakingInputIndex: problem.correctBreakingInputIndex,
        ms: 15_000,
      });
      expect(dupeVerdict.xpAwarded).toBe(0);
    });

    it("evaluates wrong line, logs mistake with line context, and sets progress in_progress", async () => {
      const problem = ALL_BUG_AUDIT_PROBLEMS[1];
      const wrongLine = problem.buggyLineNumber === 1 ? 2 : 1;

      const verdict = await submitBugAuditAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedLineNumber: wrongLine,
        selectedBreakingInputIndex: problem.correctBreakingInputIndex,
        ms: 25_000,
        confidence: "certain",
      });

      expect(verdict.isCorrect).toBe(false);
      expect(verdict.lineCorrect).toBe(false);
      expect(verdict.inputCorrect).toBe(true);
      expect(verdict.xpAwarded).toBe(0);
      expect(verdict.calibration).toBe("overconfident");

      // Mistake logged
      const mistakeRepo = getMistakeRepository(TEST_USER);
      const mistakes = await mistakeRepo.getMistakes("m1");
      expect(mistakes.length).toBe(1);
      expect(mistakes[0].itemId).toBe(problem.id);
      expect(mistakes[0].reason).toContain(`Identified Line ${wrongLine}`);

      // Progress in_progress
      const progressRepo = getProgressRepository(TEST_USER);
      const prog = await progressRepo.getProgress("m1", problem.id);
      expect(prog?.status).toBe("in_progress");
    });

    it("evaluates correct line but wrong breaking input", async () => {
      const problem = ALL_BUG_AUDIT_PROBLEMS[2];
      const wrongInputIdx = (problem.correctBreakingInputIndex + 1) % 4;

      const verdict = await submitBugAuditAnswer({
        userId: TEST_USER,
        problemId: problem.id,
        selectedLineNumber: problem.buggyLineNumber,
        selectedBreakingInputIndex: wrongInputIdx,
        ms: 20_000,
      });

      expect(verdict.isCorrect).toBe(false);
      expect(verdict.lineCorrect).toBe(true);
      expect(verdict.inputCorrect).toBe(false);
      expect(verdict.xpAwarded).toBe(0);
    });

    it("throws error for non-existent problem ID", async () => {
      await expect(
        submitBugAuditAnswer({
          userId: TEST_USER,
          problemId: "non_existent_bug_id",
          selectedLineNumber: 1,
          selectedBreakingInputIndex: 0,
          ms: 5000,
        })
      ).rejects.toThrow("Bug audit problem not found");
    });
  });
});
