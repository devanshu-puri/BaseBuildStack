import { describe, it, expect } from "vitest";
import {
  validateSocraticHint,
  generateFallbackSocraticHint,
  getSocraticHint,
} from "@/lib/m4/socratic-hints";
import {
  computeMetacognitionReport,
  resolveCategoryFromItemId,
  MIN_SAMPLES_THRESHOLD,
} from "@/lib/m4/metacognition";
import { LogicGridPuzzle } from "@/content/m4/logic-grid-schema";

const SAMPLE_PUZZLE: LogicGridPuzzle = {
  id: "test_puzzle",
  title: "Cloud Infrastructure Allocation",
  description: "Test logic grid puzzle",
  difficulty: "medium",
  xpAward: 50,
  dimensions: [
    { id: "engineer", name: "Engineer", items: ["Alice", "Bob", "Charlie"] },
    { id: "cloud", name: "Cloud Provider", items: ["AWS", "GCP", "Azure"] },
    { id: "tool", name: "DevOps Tool", items: ["Docker", "Kubernetes", "Terraform"] },
  ],
  clues: [
    {
      id: "c1",
      text: "The engineer deploying to AWS does not use Docker.",
      type: "isNot",
      itemA: "AWS",
      itemB: "Docker",
    },
    {
      id: "c2",
      text: "Alice uses Terraform or Kubernetes.",
      type: "eitherOr",
      itemA: "Alice",
      itemB: "Docker",
    },
    {
      id: "c3",
      text: "Bob deploys to GCP.",
      type: "is",
      itemA: "Bob",
      itemB: "GCP",
    },
  ],
  solution: [
    { engineer: "Alice", cloud: "Azure", tool: "Kubernetes" },
    { engineer: "Bob", cloud: "GCP", tool: "Terraform" },
    { engineer: "Charlie", cloud: "AWS", tool: "Docker" },
  ],
};

describe("Socratic Hint Leak Prevention & Verification", () => {
  it("rejects hints that are not questions", () => {
    const hint = "You should check out Clue 2 because Alice does not use Docker.";
    const check = validateSocraticHint(hint, SAMPLE_PUZZLE, []);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("must pose a question");
  });

  it("rejects hints with explicit giveaway phrases", () => {
    const giveaways = [
      "The answer is Azure for Alice?",
      "The correct answer is obvious if you look at Bob?",
      "You should pair Alice with Azure to proceed?",
      "Assign Bob to GCP right now?",
    ];
    for (const g of giveaways) {
      const check = validateSocraticHint(g, SAMPLE_PUZZLE, []);
      expect(check.valid).toBe(false);
      expect(check.reason).toContain("direct answer giveaway");
    }
  });

  it("detects and blocks secret solution pair leaks", () => {
    // Secret solution: Alice <-> Azure (user has not confirmed this)
    const leakingHint = "Have you noticed that Alice works at Azure?";
    const check = validateSocraticHint(leakingHint, SAMPLE_PUZZLE, []);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("leaks unconfirmed solution pairing");
    expect(check.leakedItems).toEqual(["Alice", "Azure"]);
  });

  it("detects secret solution leaks in reverse order", () => {
    // Secret solution: Charlie <-> Docker
    const directLeak = "Could it be that Charlie uses Docker?";
    const check = validateSocraticHint(directLeak, SAMPLE_PUZZLE, []);
    expect(check.valid).toBe(false);
    expect(check.leakedItems).toEqual(["Charlie", "Docker"]);
  });

  it("accepts valid, non-leaking Socratic guiding questions", () => {
    const validHint =
      "Have you considered Clue #1 regarding AWS? Which tool options remain open?";
    const check = validateSocraticHint(validHint, SAMPLE_PUZZLE, []);
    expect(check.valid).toBe(true);
  });

  it("allows mentioning pairs that the candidate has already deduced and confirmed", () => {
    // Candidate already confirmed Bob <-> GCP
    const userAssignments = [{ engineer: "Bob", cloud: "GCP" }];
    const hint = "Since Bob has GCP, what does that mean for the other two cloud providers?";
    const check = validateSocraticHint(hint, SAMPLE_PUZZLE, userAssignments);
    expect(check.valid).toBe(true);
  });

  it("generates 100% safe fallback Socratic hints for all clue types", () => {
    const fallback = generateFallbackSocraticHint(SAMPLE_PUZZLE, [], []);
    expect(fallback.hint).toContain("?");
    const check = validateSocraticHint(fallback.hint, SAMPLE_PUZZLE, []);
    expect(check.valid).toBe(true);
  });

  it("getSocraticHint returns deterministic safe hint when LLM is disabled", async () => {
    const prev = process.env.LLM_ENABLED;
    process.env.LLM_ENABLED = "false";
    try {
      const res = await getSocraticHint({ puzzle: SAMPLE_PUZZLE });
      expect(res.source).toBe("deterministic");
      expect(res.hint).toContain("?");
      const check = validateSocraticHint(res.hint, SAMPLE_PUZZLE, []);
      expect(check.valid).toBe(true);
    } finally {
      process.env.LLM_ENABLED = prev;
    }
  });
});

describe("Metacognition Calibration Engine", () => {
  it("maps item IDs to appropriate categories", () => {
    expect(resolveCategoryFromItemId("2026-10-14-p1")).toBe("pattern");
    expect(resolveCategoryFromItemId("2026-10-14-d2")).toBe("deduction");
    expect(resolveCategoryFromItemId("puzzle_1")).toBe("deduction");
    expect(resolveCategoryFromItemId("2026-10-14-m3")).toBe("memory");
    expect(resolveCategoryFromItemId("2026-10-14-n4")).toBe("numerical");
    expect(resolveCategoryFromItemId("2026-10-14-t5")).toBe("tricky");
  });

  it("strictly enforces MIN_SAMPLES_THRESHOLD (10 samples) before revealing conclusions", () => {
    // Only 6 samples
    const attempts = [
      { itemId: "2026-10-14-p1", correct: true, confidence: "certain" as const },
      { itemId: "2026-10-14-d2", correct: true, confidence: "certain" as const },
      { itemId: "2026-10-14-m3", correct: false, confidence: "certain" as const },
      { itemId: "2026-10-14-n4", correct: true, confidence: "unsure" as const },
      { itemId: "2026-10-14-t5", correct: false, confidence: "guessing" as const },
      { itemId: "2026-10-15-p1", correct: true, confidence: "certain" as const },
    ];

    const report = computeMetacognitionReport(attempts);
    expect(report.totalSamples).toBe(6);
    expect(report.hasSufficientData).toBe(false);
    expect(report.samplesRemaining).toBe(4);
    expect(report.calibrationScore).toBeNull();
    expect(report.overconfidenceRate).toBeNull();
    expect(report.plainLanguageInsight).toContain(`at least ${MIN_SAMPLES_THRESHOLD} challenges`);
    expect(report.categories.every((c) => !c.hasSufficientData)).toBe(true);
  });

  it("unlocks calibration metrics and identifies overconfidence when >= 10 samples exist", () => {
    // 12 samples with high overconfidence (certain but incorrect)
    const attempts = [
      { itemId: "item-p1-1", correct: true, confidence: "certain" as const },
      { itemId: "item-p1-2", correct: false, confidence: "certain" as const }, // Overconfident
      { itemId: "item-p1-3", correct: false, confidence: "certain" as const }, // Overconfident
      { itemId: "item-p1-4", correct: false, confidence: "certain" as const }, // Overconfident
      { itemId: "item-d2-1", correct: true, confidence: "certain" as const },
      { itemId: "item-d2-2", correct: false, confidence: "certain" as const }, // Overconfident
      { itemId: "item-m3-1", correct: true, confidence: "unsure" as const },
      { itemId: "item-n4-1", correct: false, confidence: "guessing" as const },
      { itemId: "item-t5-1", correct: true, confidence: "certain" as const },
      { itemId: "item-t5-2", correct: false, confidence: "certain" as const }, // Overconfident
      { itemId: "item-p1-5", correct: true, confidence: "certain" as const },
      { itemId: "item-d2-3", correct: true, confidence: "certain" as const },
    ];

    const report = computeMetacognitionReport(attempts);
    expect(report.totalSamples).toBe(12);
    expect(report.hasSufficientData).toBe(true);
    expect(report.samplesRemaining).toBe(0);
    expect(report.calibrationScore).toBeGreaterThan(0);
    expect(report.overconfidenceRate).toBeGreaterThan(0.25);
    expect(report.plainLanguageInsight).toContain("Overconfidence Alert");
  });

  it("identifies underconfidence (imposter syndrome) when unsure answers are consistently correct", () => {
    // 10 samples: candidate answers correctly while declaring unsure/guessing
    const attempts = Array.from({ length: 10 }).map((_, i) => ({
      itemId: `item-n4-${i}`,
      correct: true,
      confidence: (i % 2 === 0 ? "unsure" : "guessing") as "unsure" | "guessing",
    }));

    const report = computeMetacognitionReport(attempts);
    expect(report.hasSufficientData).toBe(true);
    expect(report.matrix.underconfident.count).toBe(10);
    expect(report.underconfidenceRate).toBe(1);
    expect(report.plainLanguageInsight).toContain("Hidden Competence");
  });

  it("identifies high metacognitive precision when confidence reliably predicts correctness", () => {
    // 10 samples: 9 certain & correct, 1 unsure & incorrect
    const attempts = [
      ...Array.from({ length: 9 }).map((_, i) => ({
        itemId: `item-d2-${i}`,
        correct: true,
        confidence: "certain" as const,
      })),
      {
        itemId: "item-d2-9",
        correct: false,
        confidence: "unsure" as const,
      },
    ];

    const report = computeMetacognitionReport(attempts);
    expect(report.hasSufficientData).toBe(true);
    expect(report.certaintyAccuracy).toBe(1);
    expect(report.calibrationScore).toBe(100);
    expect(report.plainLanguageInsight).toContain("Exceptional Metacognitive Precision");
  });
});
