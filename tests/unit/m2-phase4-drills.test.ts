import { describe, it, expect, beforeEach } from "vitest";
import {
  buildDrillDeck,
  createMulberry32,
  seededShuffle,
  interleaveSkills,
  prepareQuestionOptions,
  getUnseenCountPerSkill,
} from "@/lib/m2/drill-engine";
import { getQuestionHistoryRepository } from "@/lib/db/repositories/question-history-repo";
import { M2Question } from "@/content/m2/question-schema";

describe("Module II — Phase 4: Skill Drills & Core Fundamentals Engine", () => {
  const testUserId = "user_drill_test_" + Date.now();

  beforeEach(async () => {
    // Clear question history for this test user
    const historyRepo = getQuestionHistoryRepository(testUserId);
    const seen = await historyRepo.getSeenQuestionIds();
    await historyRepo.resetHistoryForSkills(seen);
  });

  describe("Mulberry32 PRNG & Seeded Shuffling", () => {
    it("generates deterministic random sequences with the same seed", () => {
      const prng1 = createMulberry32(12345);
      const prng2 = createMulberry32(12345);

      const seq1 = [prng1(), prng1(), prng1()];
      const seq2 = [prng2(), prng2(), prng2()];

      expect(seq1).toEqual(seq2);
    });

    it("generates different sequences with different seeds", () => {
      const prng1 = createMulberry32(111);
      const prng2 = createMulberry32(222);

      expect(prng1()).not.toEqual(prng2());
    });

    it("shuffles arrays deterministically given the same seed", () => {
      const items = ["A", "B", "C", "D", "E", "F"];
      const prng1 = createMulberry32(42);
      const prng2 = createMulberry32(42);

      const shuffled1 = seededShuffle(items, prng1);
      const shuffled2 = seededShuffle(items, prng2);

      expect(shuffled1).toEqual(shuffled2);
      expect(shuffled1.sort()).toEqual(items.sort());
    });
  });

  describe("Option Shuffling & lockOptionOrder", () => {
    const dummyQuestion: M2Question = {
      id: "dummy-1",
      skillId: "react",
      topic: "hooks",
      mode: ["skill_drill"],
      difficulty: "medium",
      type: "mcq",
      interviewFrequency: 5,
      prompt: "Sample prompt",
      options: [
        { id: "A", text: "Alpha" },
        { id: "B", text: "Beta" },
        { id: "C", text: "Gamma" },
        { id: "D", text: "All of the above" },
      ],
      correctOptionIds: ["A"],
      lockOptionOrder: false,
      explanation: {
        whyCorrect: "Correct reason",
        whyWrong: { B: "B wrong", C: "C wrong", D: "D wrong" },
        interviewTakeaway: "Takeaway",
      },
      tags: [],
      sourceRefs: [],
      version: 1,
      status: "published",
    };

    it("shuffles options while preserving option IDs when lockOptionOrder is false", () => {
      const prng = createMulberry32(999);
      const prepared = prepareQuestionOptions(dummyQuestion, prng);

      expect(prepared).toHaveLength(4);
      expect(prepared.map((o) => o.id).sort()).toEqual(["A", "B", "C", "D"]);
    });

    it("never shuffles options when lockOptionOrder is true", () => {
      const lockedQuestion: M2Question = {
        ...dummyQuestion,
        lockOptionOrder: true,
      };

      const prng = createMulberry32(12345);
      const prepared = prepareQuestionOptions(lockedQuestion, prng);

      expect(prepared).toEqual(lockedQuestion.options);
    });
  });

  describe("Skill Interleaving", () => {
    it("prevents 3 or more consecutive questions from having the same skill", () => {
      const createDummyQ = (id: string, skillId: string): M2Question => ({
        id,
        skillId,
        topic: "topic",
        mode: ["skill_drill"],
        difficulty: "medium",
        type: "mcq",
        interviewFrequency: 5,
        prompt: `Question ${id}`,
        options: [
          { id: "A", text: "Opt 1" },
          { id: "B", text: "Opt 2" },
        ],
        correctOptionIds: ["A"],
        lockOptionOrder: false,
        explanation: {
          whyCorrect: "Why",
          whyWrong: { B: "Reason B" },
          interviewTakeaway: "Takeaway",
        },
        tags: [],
        sourceRefs: [],
        version: 1,
        status: "published",
      });

      // Array with 4 React in a row followed by TypeScript and Node
      const clustered: M2Question[] = [
        createDummyQ("1", "react"),
        createDummyQ("2", "react"),
        createDummyQ("3", "react"),
        createDummyQ("4", "react"),
        createDummyQ("5", "typescript"),
        createDummyQ("6", "nodejs"),
      ];

      const interleaved = interleaveSkills(clustered);

      // Verify no 3 in a row
      for (let i = 2; i < interleaved.length; i++) {
        const threeInRow =
          interleaved[i].skillId === interleaved[i - 1].skillId &&
          interleaved[i - 1].skillId === interleaved[i - 2].skillId;
        expect(threeInRow).toBe(false);
      }
    });
  });

  describe("Drill Deck Generation & Selection Algorithm", () => {
    it("builds a drill deck matching requested skills and count", async () => {
      const result = await buildDrillDeck({
        userId: testUserId,
        skillIds: ["react", "typescript", "javascript"],
        count: 5,
      });

      expect(result.questions).toHaveLength(5);
      expect(result.totalQuestions).toBe(5);
      expect(
        result.questions.every((q) =>
          ["react", "typescript", "javascript"].includes(q.skillId.toLowerCase())
        )
      ).toBe(true);
    });

    it("filters questions by requested difficulty", async () => {
      const result = await buildDrillDeck({
        userId: testUserId,
        difficulty: "basic",
        count: 5,
      });

      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.difficulty).toBe("basic");
    });

    it("prioritizes unseen questions over previously answered questions", async () => {
      const historyRepo = getQuestionHistoryRepository(testUserId);

      // First run: get 3 questions
      const run1 = await buildDrillDeck({
        userId: testUserId,
        skillIds: ["react", "typescript"],
        count: 2,
        seed: 101,
      });

      expect(run1.questions).toHaveLength(2);

      // Record result for the first question
      const answeredQId = run1.questions[0].id;
      await historyRepo.recordQuestionResult(answeredQId, true);

      // Second run: build deck
      const run2 = await buildDrillDeck({
        userId: testUserId,
        skillIds: ["react", "typescript"],
        count: 2,
        seed: 102,
      });

      // The unseen questions should be chosen first
      const run2Ids = run2.questions.map((q) => q.id);
      expect(run2Ids).not.toContain(answeredQId);
    });

    it("handles cycle exhaustion gracefully when unseen questions are depleted", async () => {
      const historyRepo = getQuestionHistoryRepository(testUserId);

      // Build a deck for python
      const result = await buildDrillDeck({
        userId: testUserId,
        skillIds: ["python"],
        count: 2,
      });

      // Mark all questions in history as wrong
      for (const q of result.questions) {
        await historyRepo.recordQuestionResult(q.id, false);
      }

      // Next run for python: unseen pool is now empty
      const cycleRun = await buildDrillDeck({
        userId: testUserId,
        skillIds: ["python"],
        count: 2,
      });

      expect(cycleRun.cycleExhausted).toBe(true);
      expect(cycleRun.cycleNotice).toBeDefined();
      expect(cycleRun.questions.length).toBeGreaterThan(0);
    });

    it("returns unseen question counts per skill", async () => {
      const counts = await getUnseenCountPerSkill(testUserId);

      expect(counts["react"]).toBeDefined();
      expect(counts["react"].total).toBeGreaterThanOrEqual(2);
      expect(counts["react"].unseen).toBeGreaterThanOrEqual(2);
    });
  });
});
