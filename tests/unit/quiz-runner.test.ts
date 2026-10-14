import { describe, it, expect, vi } from "vitest";
import { QuizQuestionSchema } from "@/content/m2/quiz-schema";
import {
  getAllQuizQuestions,
  getQuizQuestionById,
  selectQuestionsForDeck,
  sanitizeQuestionForClient,
  validateQuestionIntegrity,
} from "@/content/m2/quiz-questions";
import { createQuizSession, submitQuizAnswer } from "@/lib/m2/quiz-session";

// Mock repositories to test session engine deterministically without MongoDB
vi.mock("@/lib/db/repositories/profile-repo", () => ({
  getProfileRepository: vi.fn(() => ({
    getProfile: vi.fn().mockResolvedValue({
      skills: [
        { name: "React", level: "intermediate", confirmed: true },
        { name: "TypeScript", level: "advanced", confirmed: true },
      ],
    }),
  })),
}));

vi.mock("@/lib/db/repositories/attempt-repo", () => ({
  getAttemptRepository: vi.fn(() => ({
    recordAttempt: vi.fn().mockResolvedValue({ id: "att-1" }),
    getModuleAttempts: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("@/lib/db/repositories/mistake-repo", () => ({
  getMistakeRepository: vi.fn(() => ({
    recordMistake: vi.fn().mockResolvedValue({ id: "mistake-1" }),
    getActiveMistakes: vi.fn().mockResolvedValue([
      { itemId: "react-debug-useeffect-race", reason: "Race condition" },
    ]),
  })),
}));

vi.mock("@/lib/db/repositories/xp-repo", () => ({
  getXpRepository: vi.fn(() => ({
    awardXp: vi.fn().mockResolvedValue({ added: true, event: { amount: 25 }, totalXp: 150 }),
  })),
}));

vi.mock("@/lib/db/repositories/srs-repo", () => ({
  getSrsRepository: vi.fn(() => ({
    getCard: vi.fn().mockResolvedValue(null),
    upsertCard: vi.fn().mockResolvedValue({ id: "card-1" }),
  })),
}));

describe("Module II — Quiz Questions & Schema Integrity", () => {
  const allQuestions = getAllQuizQuestions();

  it("should have curated questions in the bank", () => {
    expect(allQuestions.length).toBeGreaterThanOrEqual(10);
  });

  it("should validate all questions against QuizQuestionSchema with zero errors", () => {
    for (const q of allQuestions) {
      const parseResult = QuizQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(true);
      const integrity = validateQuestionIntegrity(q);
      expect(integrity.valid).toBe(true);
      expect(integrity.errors).toEqual([]);
    }
  });

  it("should contain all 4 required question types (mcq, output, debug, approach)", () => {
    const types = new Set(allQuestions.map((q) => q.type));
    expect(types.has("mcq")).toBe(true);
    expect(types.has("output")).toBe(true);
    expect(types.has("debug")).toBe(true);
    expect(types.has("approach")).toBe(true);
  });

  it("should verify that every question has a valid correct option and 5-part explanation", () => {
    for (const q of allQuestions) {
      const correctOption = q.options.find((opt) => opt.id === q.correctId);
      expect(correctOption).toBeDefined();
      expect(q.explanation.why.length).toBeGreaterThan(10);
      expect(q.explanation.takeaway.length).toBeGreaterThan(5);

      // Verify distractors exist for non-correct options
      const nonCorrectOptionIds = q.options
        .filter((o) => o.id !== q.correctId)
        .map((o) => o.id);
      for (const optId of nonCorrectOptionIds) {
        expect(q.explanation.distractors[optId]).toBeDefined();
      }
    }
  });

  it("should sanitize question payload for client, stripping correctId and explanation", () => {
    const q = allQuestions[0];
    const clientQ = sanitizeQuestionForClient(q);

    expect(clientQ.id).toBe(q.id);
    expect(clientQ.stem).toBe(q.stem);
    expect(clientQ.options).toEqual(q.options);
    expect((clientQ as Record<string, unknown>).correctId).toBeUndefined();
    expect((clientQ as Record<string, unknown>).explanation).toBeUndefined();
  });
});

describe("Module II — Quiz Deck Selection", () => {
  it("should select 5 questions for quick mode", () => {
    const deck = selectQuestionsForDeck({
      skills: ["React", "TypeScript", "Node.js"],
      mode: "quick",
    });
    expect(deck.length).toBeLessThanOrEqual(5);
    expect(deck.length).toBeGreaterThan(0);
  });

  it("should prioritize mcq and lower difficulty for fundamentals mode", () => {
    const deck = selectQuestionsForDeck({
      skills: ["React", "TypeScript", "PostgreSQL"],
      mode: "fundamentals",
    });
    expect(deck.length).toBeGreaterThan(0);
    // First questions should be mcq if available
    expect(deck[0].type).toBe("mcq");
  });

  it("should prioritize output, debug, and approach for practical mode", () => {
    const deck = selectQuestionsForDeck({
      skills: ["React", "TypeScript", "Node.js"],
      mode: "practical",
    });
    expect(deck.length).toBeGreaterThan(0);
    expect(["output", "debug", "approach"]).toContain(deck[0].type);
  });

  it("should prioritize weak skills in weak_area mode", () => {
    const deck = selectQuestionsForDeck({
      skills: ["React", "TypeScript", "Node.js"],
      mode: "weak_area",
      weakSkills: ["React"],
    });
    expect(deck.length).toBeGreaterThan(0);
    expect(deck[0].skill).toBe("React");
  });
});

describe("Module II — Deterministic Quiz Session Engine", () => {
  it("should create a session with sanitized questions", async () => {
    const session = await createQuizSession({
      userId: "test-user-123",
      mode: "quick",
    });

    expect(session.mode).toBe("quick");
    expect(session.questions.length).toBeGreaterThan(0);
    expect(session.totalQuestions).toBe(session.questions.length);

    // Verify sanitized: no correctId leaked
    for (const q of session.questions) {
      expect((q as Record<string, unknown>).correctId).toBeUndefined();
      expect((q as Record<string, unknown>).explanation).toBeUndefined();
    }
  });

  it("should evaluate a correct submission deterministically and award XP", async () => {
    const question = getQuizQuestionById("react-mcq-stale-closure");
    expect(question).toBeDefined();
    if (!question) return;

    const result = await submitQuizAnswer({
      userId: "test-user-123",
      payload: {
        questionId: question.id,
        selectedOptionId: question.correctId,
        ms: 12000,
        answerChanges: 0,
        confidence: "certain",
      },
    });

    expect(result.correct).toBe(true);
    expect(result.correctId).toBe(question.correctId);
    expect(result.selectedOptionId).toBe(question.correctId);
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.calibration).toBe("calibrated");
    expect(result.explanation.why).toBe(question.explanation.why);
    expect(result.explanation.takeaway).toBe(question.explanation.takeaway);
  });

  it("should evaluate an incorrect submission, provide specific distractor takedown and detect overconfidence", async () => {
    const question = getQuizQuestionById("react-mcq-stale-closure");
    expect(question).toBeDefined();
    if (!question) return;

    const incorrectOption = question.options.find((o) => o.id !== question.correctId);
    expect(incorrectOption).toBeDefined();
    if (!incorrectOption) return;

    const result = await submitQuizAnswer({
      userId: "test-user-123",
      payload: {
        questionId: question.id,
        selectedOptionId: incorrectOption.id,
        ms: 15000,
        answerChanges: 1,
        confidence: "certain",
      },
    });

    expect(result.correct).toBe(false);
    expect(result.correctId).toBe(question.correctId);
    expect(result.selectedOptionId).toBe(incorrectOption.id);
    expect(result.xpEarned).toBe(0);
    expect(result.calibration).toBe("overconfident"); // certain but wrong!
    expect(result.explanation.distractorTakedown).toBe(
      question.explanation.distractors[incorrectOption.id]
    );
  });

  it("should throw an error for non-existent question ID", async () => {
    await expect(
      submitQuizAnswer({
        userId: "test-user-123",
        payload: {
          questionId: "non-existent-question-id",
          selectedOptionId: "opt-a",
          ms: 5000,
          answerChanges: 0,
          confidence: "unsure",
        },
      })
    ).rejects.toThrow(/Quiz question not found/);
  });
});
