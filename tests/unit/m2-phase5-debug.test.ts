import { describe, it, expect, beforeEach } from "vitest";
import {
  DEBUG_CHALLENGES,
  sanitizeDebugChallenge,
} from "@/content/m2/debug-data";
import { DebugChallengeSchema } from "@/lib/db/schemas";
import {
  getDebugDeck,
  getDebugHint,
  evaluateDebugLineClick,
} from "@/lib/m2/debug-session";
import { getQuestionHistoryRepository } from "@/lib/db/repositories/question-history-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";

describe("Module II — Phase 5: Practical & Debugging", () => {
  const TEST_USER = "test-debug-user-456";

  beforeEach(async () => {
    // Reset test user stores
    const histRepo = getQuestionHistoryRepository(TEST_USER);
    await histRepo.deleteMany({});
  });

  describe("Challenge Bank Data Integrity", () => {
    it("has at least 10 high-quality debugging challenges", () => {
      expect(DEBUG_CHALLENGES.length).toBeGreaterThanOrEqual(10);
    });

    it("validates every challenge against DebugChallengeSchema", () => {
      for (const challenge of DEBUG_CHALLENGES) {
        const parsed = DebugChallengeSchema.safeParse(challenge);
        expect(parsed.success, `Failed on challenge ${challenge.id}`).toBe(true);
      }
    });

    it("ensures all buggy lines are within valid code line ranges", () => {
      for (const challenge of DEBUG_CHALLENGES) {
        const lineCount = challenge.code.trim().split("\n").length;
        expect(challenge.buggyLines.length).toBeGreaterThanOrEqual(1);

        for (const bug of challenge.buggyLines) {
          expect(bug.line).toBeGreaterThanOrEqual(1);
          expect(bug.line).toBeLessThanOrEqual(lineCount);
          expect(bug.fix.trim().length).toBeGreaterThan(0);
          expect(bug.explanation.trim().length).toBeGreaterThan(15);
        }
      }
    });

    it("ensures distractor notes reference valid line numbers and contain real explanations", () => {
      for (const challenge of DEBUG_CHALLENGES) {
        const lineCount = challenge.code.trim().split("\n").length;
        const keys = Object.keys(challenge.distractorNotes);
        expect(keys.length).toBeGreaterThan(0);

        for (const lineKey of keys) {
          const num = parseInt(lineKey, 10);
          expect(isNaN(num)).toBe(false);
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(lineCount);
          expect(challenge.distractorNotes[lineKey].trim().length).toBeGreaterThan(10);
        }
      }
    });

    it("includes practical interview takeaways for all challenges", () => {
      for (const challenge of DEBUG_CHALLENGES) {
        expect(challenge.interviewTakeaway).toBeDefined();
        expect(challenge.interviewTakeaway!.trim().length).toBeGreaterThan(20);
      }
    });
  });

  describe("Client Sanitization", () => {
    it("strips confidential bug lines, fixes, and distractor notes before client delivery", () => {
      const challenge = DEBUG_CHALLENGES[0];
      const sanitized = sanitizeDebugChallenge(challenge);

      expect(sanitized.id).toBe(challenge.id);
      expect(sanitized.scenario).toBe(challenge.scenario);
      expect(sanitized.code).toBe(challenge.code);
      expect(sanitized.totalLines).toBe(challenge.code.trim().split("\n").length);
      expect(sanitized.buggyLineCount).toBe(challenge.buggyLines.length);

      // Verify no confidential answers are leaked
      const record = sanitized as unknown as Record<string, unknown>;
      expect(record.buggyLines).toBeUndefined();
      expect(record.distractorNotes).toBeUndefined();
      expect(record.interviewTakeaway).toBeUndefined();
    });
  });

  describe("Deck Generation & Filtering", () => {
    it("generates a deck honoring count and sanitizing all items", async () => {
      const { deck, totalAvailable } = await getDebugDeck(TEST_USER, { count: 3 });
      expect(deck.length).toBe(3);
      expect(totalAvailable).toBe(DEBUG_CHALLENGES.length);

      for (const item of deck) {
        const itemRecord = item as unknown as Record<string, unknown>;
        expect(itemRecord.buggyLines).toBeUndefined();
        expect(item.totalLines).toBeGreaterThan(5);
      }
    });

    it("filters deck by difficulty when requested", async () => {
      const { deck } = await getDebugDeck(TEST_USER, { difficulty: "basic", count: 10 });
      expect(deck.length).toBeGreaterThanOrEqual(2);
      for (const item of deck) {
        expect(item.difficulty).toBe("basic");
      }
    });

    it("filters deck by skill when requested", async () => {
      const { deck } = await getDebugDeck(TEST_USER, { skillId: "react", count: 5 });
      expect(deck.length).toBeGreaterThanOrEqual(1);
      expect(deck[0].skillId).toBe("react");
    });
  });

  describe("Hint Engine", () => {
    it("provides broad line range containing the bug without single-line pinpointing", () => {
      const challenge = DEBUG_CHALLENGES[0];
      const hint = getDebugHint(challenge.id);

      expect(hint.challengeId).toBe(challenge.id);
      expect(hint.startLine).toBeLessThanOrEqual(challenge.buggyLines[0].line);
      expect(hint.endLine).toBeGreaterThanOrEqual(challenge.buggyLines[0].line);
      expect(hint.endLine - hint.startLine).toBeGreaterThanOrEqual(2);
      expect(hint.message).toContain("between lines");
    });

    it("throws for non-existent challenge ID", () => {
      expect(() => getDebugHint("non-existent-id")).toThrow();
    });
  });

  describe("Deterministic Line Evaluation", () => {
    it("evaluates correct bug click on attempt 1 awarding 25 XP", async () => {
      const challenge = DEBUG_CHALLENGES[0];
      const bugLine = challenge.buggyLines[0].line;

      const result = await evaluateDebugLineClick(TEST_USER, {
        challengeId: challenge.id,
        clickedLine: bugLine,
        attemptNumber: 1,
      });

      expect(result.success).toBe(true);
      expect(result.isBuggy).toBe(true);
      expect(result.resolved).toBe(true);
      expect(result.xpAwarded).toBe(25);
      expect(result.diff).toBeDefined();
      expect(result.diff?.line).toBe(bugLine);
      expect(result.explanation).toContain("saveCount");

      // Check DB records
      const histRepo = getQuestionHistoryRepository(TEST_USER);
      const history = await histRepo.findOne({ questionId: challenge.id });
      expect(history?.lastResult).toBe("correct");
      expect(history?.correctCount).toBe(1);
    });

    it("handles miss on attempt 1 with distractor note and allows retry", async () => {
      const challenge = DEBUG_CHALLENGES[0];
      // Pick innocent line 4
      const result = await evaluateDebugLineClick(TEST_USER, {
        challengeId: challenge.id,
        clickedLine: 4,
        attemptNumber: 1,
      });

      expect(result.success).toBe(true);
      expect(result.isBuggy).toBe(false);
      expect(result.resolved).toBe(false);
      expect(result.attemptsRemaining).toBe(1);
      expect(result.distractorNote).toContain("props are destructured");
    });

    it("awards 15 XP when solved on attempt 2", async () => {
      const challenge = DEBUG_CHALLENGES[1];
      const bugLine = challenge.buggyLines[0].line;

      const result = await evaluateDebugLineClick(TEST_USER, {
        challengeId: challenge.id,
        clickedLine: bugLine,
        attemptNumber: 2,
      });

      expect(result.isBuggy).toBe(true);
      expect(result.resolved).toBe(true);
      expect(result.xpAwarded).toBe(15);
    });

    it("deducts 5 XP if hint was used", async () => {
      const challenge = DEBUG_CHALLENGES[2];
      const bugLine = challenge.buggyLines[0].line;

      const result = await evaluateDebugLineClick(TEST_USER, {
        challengeId: challenge.id,
        clickedLine: bugLine,
        attemptNumber: 1,
        usedHint: true,
      });

      expect(result.isBuggy).toBe(true);
      expect(result.xpAwarded).toBe(20); // 25 - 5 = 20
    });

    it("resolves and reveals answer after 2 failed attempts, logging mistake", async () => {
      const challenge = DEBUG_CHALLENGES[3];

      const result = await evaluateDebugLineClick(TEST_USER, {
        challengeId: challenge.id,
        clickedLine: 7, // innocent line
        attemptNumber: 2,
      });

      expect(result.isBuggy).toBe(false);
      expect(result.resolved).toBe(true);
      expect(result.attemptsRemaining).toBe(0);
      expect(result.xpAwarded).toBe(0);
      expect(result.correctLine).toBe(challenge.buggyLines[0].line);
      expect(result.diff).toBeDefined();

      // Check history and mistake records
      const histRepo = getQuestionHistoryRepository(TEST_USER);
      const history = await histRepo.findOne({ questionId: challenge.id });
      expect(history?.lastResult).toBe("incorrect");

      const mistakeRepo = getMistakeRepository(TEST_USER);
      const mistakes = await mistakeRepo.getMistakes("m2");
      expect(mistakes.some((m) => m.itemId === challenge.id)).toBe(true);
    });
  });
});
