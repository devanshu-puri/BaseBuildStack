import { describe, it, expect, beforeEach } from "vitest";
import { calculateDiagnosticScores } from "@/lib/m2/readiness-calculator";
import {
  getProfileRepository,
  getQuestionHistoryRepository,
  getProjectQuestionsRepository,
  getUserProjectsRepository,
  getAttemptRepository,
} from "@/lib/db/repositories";
import { ALL_M2_QUESTIONS } from "@/content/m2/question-bank";

describe("Module II — Phase 7: Scoring & Insights Engine", () => {
  const TEST_USER = "test-insights-user-101";

  beforeEach(async () => {
    const profileRepo = getProfileRepository(TEST_USER);
    const historyRepo = getQuestionHistoryRepository(TEST_USER);
    const projectQuestionsRepo = getProjectQuestionsRepository(TEST_USER);
    const userProjectsRepo = getUserProjectsRepository(TEST_USER);
    const attemptRepo = getAttemptRepository(TEST_USER);

    await profileRepo.deleteMany({});
    await historyRepo.deleteMany({});
    await projectQuestionsRepo.deleteMany({});
    await userProjectsRepo.deleteMany({});
    await attemptRepo.deleteMany({});
  });

  describe("Empty State & Initial Baseline", () => {
    it("returns null scores and Not Started band for uncalibrated candidate", async () => {
      const insights = await calculateDiagnosticScores(TEST_USER);

      expect(insights.scores.stackKnowledge).toBeNull();
      expect(insights.scores.interviewReadiness).toBeNull();
      expect(insights.scores.projectUnderstanding).toBeNull();
      expect(insights.readinessBand).toBe("Not Started");
      expect(insights.summary.totalQuestionsAnswered).toBe(0);
      expect(insights.summary.debuggingSolved).toBe(0);
      expect(insights.calibration.rating).toBe("insufficient_data");
    });
  });

  describe("Stack Knowledge Score Calculation", () => {
    it("calibrates stack knowledge score after at least 3 answered questions with difficulty weights", async () => {
      const profileRepo = getProfileRepository(TEST_USER);
      const historyRepo = getQuestionHistoryRepository(TEST_USER);

      await profileRepo.addSkill({ name: "react", level: "advanced", source: "manual" });
      await profileRepo.addSkill({ name: "nodejs", level: "intermediate", source: "manual" });

      // Find react and nodejs questions from bank
      const reactQuestions = ALL_M2_QUESTIONS.filter((q) => q.skillId === "react");
      expect(reactQuestions.length).toBeGreaterThanOrEqual(3);

      // Record 3 perfect answers
      for (const q of reactQuestions.slice(0, 3)) {
        await historyRepo.recordQuestionResult(q.id, true);
      }

      const insights = await calculateDiagnosticScores(TEST_USER);

      expect(insights.summary.totalQuestionsAnswered).toBe(3);
      expect(insights.summary.totalCorrect).toBe(3);
      expect(insights.scores.stackKnowledge).not.toBeNull();
      expect(insights.scores.stackKnowledge).toBeGreaterThanOrEqual(70);
    });
  });

  describe("Interview Readiness Score & Incident Triage", () => {
    it("rewards practical debugging triage solutions in the readiness score", async () => {
      const historyRepo = getQuestionHistoryRepository(TEST_USER);
      const attemptRepo = getAttemptRepository(TEST_USER);

      // Answer 3 fundamentals questions correctly
      const qIds = ["m2_react_001", "m2_react_002", "m2_nodejs_001"];
      for (const id of qIds) {
        await historyRepo.recordQuestionResult(id, true);
      }

      // Record confidence attempts with 100% calibration
      for (const id of qIds) {
        await attemptRepo.recordAttempt({
          module: "m2",
          itemId: id,
          answer: "opt_correct",
          correct: true,
          ms: 15000,
          confidence: "certain",
        });
      }

      // Debugging challenge solved
      await historyRepo.recordQuestionResult("debug-react-stale-closure-01", true);

      const insights = await calculateDiagnosticScores(TEST_USER);

      expect(insights.summary.debuggingSolved).toBe(1);
      expect(insights.scores.interviewReadiness).not.toBeNull();
      expect(insights.calibration.rating).toBe("calibrated");
    });
  });

  describe("Project Understanding & Readiness Bands", () => {
    it("computes project defense score based on got_it statuses", async () => {
      const userProjectsRepo = getUserProjectsRepository(TEST_USER);
      const projectQuestionsRepo = getProjectQuestionsRepository(TEST_USER);

      await userProjectsRepo.setProjects([
        {
          id: "proj_alpha",
          name: "Alpha Microservice",
          role: "Backend Engineer",
          summary: "Event-driven architecture with Kafka",
          responsibilities: ["Built streaming consumers"],
          techStack: ["Go", "Kafka"],
          metrics: ["10k msg/s"],
          links: [],
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Seed 2 project questions: 1 got_it, 1 need_review
      await projectQuestionsRepo.setQuestionsForProject("proj_alpha", [
        {
          id: "pq_1",
          projectId: "proj_alpha",
          category: "Architecture & System Design",
          title: "System Flow",
          question: "Explain data flow",
          rationale: "Rationale",
          modelAnswer: "Situation: Alpha. Task: Stream. Action: Kafka consumers. Result: 10k msg/s.",
          keyPointsToCheck: ["Point 1"],
          commonTraps: ["Trap 1"],
          followUps: ["Follow up"],
          status: "got_it",
        },
        {
          id: "pq_2",
          projectId: "proj_alpha",
          category: "Scale & Performance",
          title: "Throughput Bottlenecks",
          question: "Explain scale limits",
          rationale: "Rationale",
          modelAnswer: "Situation: Alpha scale. Task: Load. Action: Shard. Result: High scale.",
          keyPointsToCheck: ["Point 1"],
          commonTraps: ["Trap 1"],
          followUps: ["Follow up"],
          status: "need_review",
        },
      ]);

      const insights = await calculateDiagnosticScores(TEST_USER);

      expect(insights.scores.projectUnderstanding).toBe(50); // 1 out of 2
      expect(insights.summary.projectsMastered).toBe(1);
      expect(insights.summary.projectsTotal).toBe(2);
    });

    it("evaluates Staff Calibrated band when candidate achieves high marks across all 3 pillars", async () => {
      const historyRepo = getQuestionHistoryRepository(TEST_USER);
      const projectQuestionsRepo = getProjectQuestionsRepository(TEST_USER);
      const userProjectsRepo = getUserProjectsRepository(TEST_USER);

      // Answer 5 hard questions correctly
      const questions = ALL_M2_QUESTIONS.slice(0, 5);
      for (const q of questions) {
        await historyRepo.recordQuestionResult(q.id, true);
      }

      // Solve 3 debug challenges
      await historyRepo.recordQuestionResult("debug-react-stale-closure-01", true);
      await historyRepo.recordQuestionResult("debug-express-async-01", true);
      await historyRepo.recordQuestionResult("debug-sql-nplus1-01", true);

      // Master 1 project with 100% got_it
      await userProjectsRepo.setProjects([
        {
          id: "proj_staff",
          name: "High Scale Engine",
          role: "Principal Engineer",
          summary: "Core engine",
          responsibilities: ["Led architecture"],
          techStack: ["Rust", "Redis"],
          metrics: ["1M RPS"],
          links: [],
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await projectQuestionsRepo.setQuestionsForProject("proj_staff", [
        {
          id: "pq_staff_1",
          projectId: "proj_staff",
          category: "Architecture & System Design",
          title: "Core Architecture",
          question: "Explain architecture",
          rationale: "Rationale",
          modelAnswer: "Situation: High load. Task: Design. Action: Rust actor engine. Result: 1M RPS.",
          keyPointsToCheck: ["Point 1"],
          commonTraps: ["Trap 1"],
          followUps: ["Follow up"],
          status: "got_it",
        },
      ]);

      const insights = await calculateDiagnosticScores(TEST_USER);

      expect(insights.readinessBand).toBe("Staff Calibrated");
    });
  });

  describe("Adaptive Recommendations", () => {
    it("generates targeted recommendations for low debugging count and weak skill accuracy", async () => {
      const profileRepo = getProfileRepository(TEST_USER);
      const historyRepo = getQuestionHistoryRepository(TEST_USER);

      await profileRepo.addSkill({ name: "react", level: "intermediate", source: "manual" });

      // Record 3 misses in react
      const reactQ = ALL_M2_QUESTIONS.find((q) => q.skillId === "react")!;
      await historyRepo.recordQuestionResult(reactQ.id, false);
      await historyRepo.recordQuestionResult(reactQ.id, false);
      await historyRepo.recordQuestionResult(reactQ.id, false);

      const insights = await calculateDiagnosticScores(TEST_USER);

      const recTitles = insights.recommendations.map((r) => r.title);
      expect(recTitles.some((t) => t.includes("Reinforce REACT"))).toBe(true);
      expect(recTitles.some((t) => t.includes("Solve Practical Production Incidents"))).toBe(true);
    });
  });
});
