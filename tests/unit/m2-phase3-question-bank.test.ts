import { describe, it, expect } from "vitest";
import {
  M2Question,
  sanitizeM2QuestionForClient,
} from "@/content/m2/question-schema";
import {
  validateM2QuestionSchema,
  validateM2QuestionIntegrity,
  validateM2QuestionOutputSandbox,
  validateM2QuestionBank,
  normalizeOutput,
} from "@/lib/m2/question-validator";
import {
  ALL_M2_QUESTIONS,
  getAllM2Questions,
  getM2QuestionById,
  getQuestionsForSkill,
  getQuestionsForSkills,
} from "@/content/m2/question-bank";

describe("Module II — Phase 3: Question Bank Engine & Seeding", () => {
  const sampleValidQuestion: M2Question = {
    id: "test-q1",
    skillId: "react",
    topic: "hooks",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 5,
    prompt: "Why should you avoid updating state directly in React?",
    options: [
      { id: "A", text: "Direct mutations bypass React's reconciliation engine." },
      { id: "B", text: "React throws a syntax error on direct assignment." },
      { id: "C", text: "Direct mutations cause memory leaks in V8." },
      { id: "D", text: "State variables are read-only constants in JS." },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect: "React depends on state changes to schedule re-renders via Object.is equality.",
      whyWrong: {
        B: "JavaScript objects allow direct mutations without throwing syntax errors.",
        C: "V8 memory management is unaffected; the problem is UI state desynchronization.",
        D: "State objects are standard JS references, not immutable language constants.",
      },
      interviewTakeaway: "Always treat React state as immutable.",
      followUp: "How does Immer handle immutability?",
    },
    tags: ["react", "state"],
    sourceRefs: ["https://react.dev"],
    version: 1,
    status: "published",
  };

  describe("Question Schema Validation", () => {
    it("accepts a fully compliant question", () => {
      const res = validateM2QuestionSchema(sampleValidQuestion);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("rejects questions missing required fields", () => {
      const invalid = { ...sampleValidQuestion, options: [] };
      const res = validateM2QuestionSchema(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("options"))).toBe(true);
    });

    it("rejects questions with out-of-range interview frequency", () => {
      const invalid = { ...sampleValidQuestion, interviewFrequency: 6 };
      const res = validateM2QuestionSchema(invalid);
      expect(res.valid).toBe(false);
    });
  });

  describe("Question Integrity Validation", () => {
    it("passes integrity check on valid question", () => {
      const res = validateM2QuestionIntegrity(sampleValidQuestion);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("catches non-existent correctOptionIds", () => {
      const flawed: M2Question = {
        ...sampleValidQuestion,
        correctOptionIds: ["Z"],
      };
      const res = validateM2QuestionIntegrity(flawed);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain("correctOptionId \"Z\" is not present");
    });

    it("catches missing distractor explanation in whyWrong", () => {
      const flawed: M2Question = {
        ...sampleValidQuestion,
        explanation: {
          ...sampleValidQuestion.explanation,
          whyWrong: {
            B: "Explanation B",
            // C and D missing
          },
        },
      };
      const res = validateM2QuestionIntegrity(flawed);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Distractor option \"C\""))).toBe(true);
    });

    it("catches duplicate option texts", () => {
      const flawed: M2Question = {
        ...sampleValidQuestion,
        options: [
          { id: "A", text: "Same option text" },
          { id: "B", text: "Same option text" },
        ],
        correctOptionIds: ["A"],
        explanation: {
          ...sampleValidQuestion.explanation,
          whyWrong: { B: "Reason B" },
        },
      };
      const res = validateM2QuestionIntegrity(flawed);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Duplicate option text"))).toBe(true);
    });
  });

  describe("Sandbox Output Verification", () => {
    it("successfully validates JS output question in worker sandbox", async () => {
      const outputQ: M2Question = {
        ...sampleValidQuestion,
        id: "test-output-1",
        type: "output",
        code: {
          language: "javascript",
          source: "const x = [1, 2, 3]; console.log(x.length);",
        },
        options: [
          { id: "A", text: "3" },
          { id: "B", text: "undefined" },
          { id: "C", text: "0" },
          { id: "D", text: "4" },
        ],
        correctOptionIds: ["A"],
        expectedOutput: "3",
        explanation: {
          whyCorrect: "Array length is 3.",
          whyWrong: {
            B: "Length property exists on arrays.",
            C: "Array has elements.",
            D: "No 4th element was pushed.",
          },
          interviewTakeaway: "Know array properties.",
        },
      };

      const res = await validateM2QuestionOutputSandbox(outputQ);
      expect(res.passed).toBe(true);
      expect(res.actualOutput).toBe("3");
    });

    it("detects and fails if sandbox output does not match expected output", async () => {
      const flawedOutputQ: M2Question = {
        ...sampleValidQuestion,
        id: "test-output-flawed",
        type: "output",
        code: {
          language: "javascript",
          source: "console.log(2 + 2);",
        },
        options: [
          { id: "A", text: "5" }, // Intentionally wrong answer
          { id: "B", text: "4" },
          { id: "C", text: "3" },
          { id: "D", text: "undefined" },
        ],
        correctOptionIds: ["A"],
        expectedOutput: "5",
        explanation: {
          whyCorrect: "Math works.",
          whyWrong: {
            B: "Incorrect.",
            C: "Incorrect.",
            D: "Incorrect.",
          },
          interviewTakeaway: "Basic arithmetic.",
        },
      };

      const res = await validateM2QuestionOutputSandbox(flawedOutputQ);
      expect(res.passed).toBe(false);
      expect(res.error).toContain("Output mismatch: Sandbox produced \"4\", but expected \"5\"");
    });

    it("normalizes trailing quotes and carriage returns correctly", () => {
      expect(normalizeOutput("'hello'\r\n")).toBe("hello");
      expect(normalizeOutput('"world"\n')).toBe("world");
      expect(normalizeOutput("  42  ")).toBe("42");
    });
  });

  describe("Entire Seeded Question Bank Validation", () => {
    it("validates that all seeded questions in ALL_M2_QUESTIONS pass full bank validation", async () => {
      const res = await validateM2QuestionBank(ALL_M2_QUESTIONS);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.duplicates).toHaveLength(0);
      expect(res.total).toBeGreaterThanOrEqual(15);
      expect(res.verifiedOutputs).toBeGreaterThanOrEqual(1);
    });

    it("ensures all published questions can be retrieved and queried", () => {
      const published = getAllM2Questions();
      expect(published.length).toBe(ALL_M2_QUESTIONS.length);

      const reactQuestions = getQuestionsForSkill("react");
      expect(reactQuestions.length).toBeGreaterThanOrEqual(2);
      expect(reactQuestions.every((q) => q.skillId === "react")).toBe(true);

      const combined = getQuestionsForSkills(["react", "typescript"]);
      expect(combined.length).toBeGreaterThanOrEqual(4);

      const byId = getM2QuestionById(published[0].id);
      expect(byId).toBeDefined();
      expect(byId?.id).toBe(published[0].id);
    });

    it("properly sanitizes questions for client to prevent answer leaking", () => {
      const sample = ALL_M2_QUESTIONS[0];
      const sanitized = sanitizeM2QuestionForClient(sample);

      expect("correctOptionIds" in sanitized).toBe(false);
      expect("explanation" in sanitized).toBe(false);
      expect("expectedOutput" in sanitized).toBe(false);
      expect(sanitized.id).toBe(sample.id);
      expect(sanitized.options).toEqual(sample.options);
      expect(sanitized.prompt).toBe(sample.prompt);
    });
  });
});
