import { describe, it, expect, vi } from "vitest";
import {
  calculateHeatmapStats,
  getSkillHeatmapData,
} from "@/lib/m2/skill-heatmap";
import { AttemptDocument } from "@/lib/db/schemas";

vi.mock("@/lib/db/repositories/profile-repo", () => ({
  getProfileRepository: vi.fn(() => ({
    getProfile: vi.fn().mockResolvedValue({
      skills: [
        { name: "React", level: "intermediate", confirmed: true },
        { name: "TypeScript", level: "advanced", confirmed: true },
        { name: "Node.js", level: "intermediate", confirmed: true },
      ],
    }),
  })),
}));

vi.mock("@/lib/db/repositories/attempt-repo", () => ({
  getAttemptRepository: vi.fn(() => ({
    getModuleAttempts: vi.fn().mockResolvedValue([
      {
        userId: "test-user",
        module: "m2",
        itemId: "react-mcq-stale-closure",
        answer: { selectedOptionId: "opt-b" },
        correct: true,
        ms: 12000,
        changes: 0,
        confidence: "certain",
        ts: new Date(),
      },
      {
        userId: "test-user",
        module: "m2",
        itemId: "react-output-state-batching",
        answer: { selectedOptionId: "opt-a" },
        correct: false,
        ms: 20000,
        changes: 1,
        confidence: "certain",
        ts: new Date(),
      },
    ]),
  })),
}));

describe("Module II — Skill Heatmap & Confidence Calibration", () => {
  const confirmedSkills = [
    { name: "React", level: "intermediate" as const },
    { name: "TypeScript", level: "advanced" as const },
    { name: "PostgreSQL", level: "beginner" as const },
  ];

  it("should handle empty attempt history gracefully without NaN", () => {
    const result = calculateHeatmapStats({
      confirmedSkills,
      attempts: [],
    });

    expect(result.summary.totalAttempts).toBe(0);
    expect(result.summary.overallAccuracy).toBe(0);
    expect(result.summary.calibrationScore).toBe(100);
    expect(result.summary.unattemptedSkills).toEqual([
      "React",
      "TypeScript",
      "PostgreSQL",
    ]);

    for (const skill of result.skills) {
      expect(skill.totalAttempts).toBe(0);
      expect(skill.correctAttempts).toBe(0);
      expect(skill.accuracy).toBe(0);
      expect(skill.averageMs).toBe(0);
      expect(skill.masteryTier).toBe("novice");
    }
  });

  it("should correctly partition attempts into the 4 metacognitive quadrants", () => {
    const sampleAttempts: AttemptDocument[] = [
      // 1. Calibrated High: Certain + Correct
      {
        userId: "u1",
        module: "m2",
        itemId: "react-mcq-stale-closure", // React
        answer: {},
        correct: true,
        ms: 10000,
        changes: 0,
        confidence: "certain",
        ts: new Date(),
      },
      // 2. Underconfident: Guessing + Correct
      {
        userId: "u1",
        module: "m2",
        itemId: "react-output-state-batching", // React
        answer: {},
        correct: true,
        ms: 15000,
        changes: 0,
        confidence: "guessing",
        ts: new Date(),
      },
      // 3. Overconfident (Dangerous): Certain + Incorrect
      {
        userId: "u1",
        module: "m2",
        itemId: "node-output-microtask-order", // Node.js
        answer: {},
        correct: false,
        ms: 25000,
        changes: 2,
        confidence: "certain",
        ts: new Date(),
      },
      // 4. Calibrated Low: Unsure + Incorrect
      {
        userId: "u1",
        module: "m2",
        itemId: "postgres-mcq-isolation-levels", // PostgreSQL
        answer: {},
        correct: false,
        ms: 18000,
        changes: 1,
        confidence: "unsure",
        ts: new Date(),
      },
    ];

    const result = calculateHeatmapStats({
      confirmedSkills,
      attempts: sampleAttempts,
    });

    expect(result.quadrants.totalRated).toBe(4);
    expect(result.quadrants.calibratedHigh.count).toBe(1);
    expect(result.quadrants.calibratedHigh.percentage).toBe(25);

    expect(result.quadrants.underconfident.count).toBe(1);
    expect(result.quadrants.underconfident.percentage).toBe(25);

    expect(result.quadrants.overconfident.count).toBe(1);
    expect(result.quadrants.overconfident.percentage).toBe(25);

    expect(result.quadrants.calibratedLow.count).toBe(1);
    expect(result.quadrants.calibratedLow.percentage).toBe(25);

    // Calibration score: (calibratedHigh + calibratedLow) / 4 = 50%
    expect(result.quadrants.calibrationScore).toBe(50);
  });

  it("should calculate skill accuracy, latencies, and flag overconfident mistakes", () => {
    const sampleAttempts: AttemptDocument[] = [
      {
        userId: "u1",
        module: "m2",
        itemId: "react-mcq-stale-closure",
        answer: {},
        correct: true,
        ms: 10000,
        changes: 0,
        confidence: "certain",
        ts: new Date(),
      },
      {
        userId: "u1",
        module: "m2",
        itemId: "react-output-state-batching",
        answer: {},
        correct: false,
        ms: 20000,
        changes: 1,
        confidence: "certain", // Overconfident miss!
        ts: new Date(),
      },
    ];

    const result = calculateHeatmapStats({
      confirmedSkills,
      attempts: sampleAttempts,
    });

    const reactSkill = result.skills.find((s) => s.skill === "React");
    expect(reactSkill).toBeDefined();
    if (!reactSkill) return;

    expect(reactSkill.totalAttempts).toBe(2);
    expect(reactSkill.correctAttempts).toBe(1);
    expect(reactSkill.accuracy).toBe(50);
    expect(reactSkill.averageMs).toBe(15000);
    expect(reactSkill.overconfidentCount).toBe(1);

    // Weak skills should include React because accuracy is 50% (< 70%) and has overconfident count
    expect(result.summary.weakSkills).toContain("React");
  });

  it("should retrieve skill heatmap data from repositories via getSkillHeatmapData", async () => {
    const data = await getSkillHeatmapData("test-user");

    expect(data.skills.length).toBeGreaterThan(0);
    expect(data.summary.totalAttempts).toBe(2);
    expect(data.summary.totalCorrect).toBe(1);
    expect(data.summary.overallAccuracy).toBe(50);
    expect(data.quadrants.totalRated).toBe(2);
    expect(data.quadrants.calibratedHigh.count).toBe(1);
    expect(data.quadrants.overconfident.count).toBe(1);
  });
});
