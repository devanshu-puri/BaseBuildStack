import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeM2QuestionForClient } from "@/content/m2/question-schema";
import { sanitizeDebugChallenge, DEBUG_CHALLENGES } from "@/content/m2/debug-data";
import { ALL_M2_QUESTIONS } from "@/content/m2/question-bank";
import {
  getUserProjectsRepository,
  getQuestionHistoryRepository,
  getProfileRepository,
} from "@/lib/db/repositories";
import { calculateDiagnosticScores } from "@/lib/m2/readiness-calculator";
import { generateQuestionsForProject } from "@/lib/m2/project-panel-generator";

describe("Module II — Phase 8: Hardening, Security & End-to-End Integrity", () => {
  const USER_ALICE = "user-alice-auditor";
  const USER_BOB = "user-bob-intruder";

  beforeEach(async () => {
    const aliceProjects = getUserProjectsRepository(USER_ALICE);
    const bobProjects = getUserProjectsRepository(USER_BOB);
    const aliceHistory = getQuestionHistoryRepository(USER_ALICE);
    const bobHistory = getQuestionHistoryRepository(USER_BOB);
    const aliceProfile = getProfileRepository(USER_ALICE);
    const bobProfile = getProfileRepository(USER_BOB);

    await aliceProjects.deleteMany({});
    await bobProjects.deleteMany({});
    await aliceHistory.deleteMany({});
    await bobHistory.deleteMany({});
    await aliceProfile.deleteMany({});
    await bobProfile.deleteMany({});
  });

  describe("Security Review: No Answer Leakage to Client", () => {
    it("strictly strips correctOptionId and explanations from client question decks", () => {
      const serverQuestion = ALL_M2_QUESTIONS[0];
      const clientQuestion = sanitizeM2QuestionForClient(serverQuestion);

      expect((clientQuestion as Record<string, unknown>).correctOptionId).toBeUndefined();
      expect((clientQuestion as Record<string, unknown>).explanation).toBeUndefined();
      expect((clientQuestion as Record<string, unknown>).commonTraps).toBeUndefined();
      expect((clientQuestion as Record<string, unknown>).interviewFollowUps).toBeUndefined();

      // Ensure options only contain id and text (no whyWrong notes)
      for (const opt of clientQuestion.options) {
        expect((opt as Record<string, unknown>).whyWrong).toBeUndefined();
        expect(typeof opt.id).toBe("string");
        expect(typeof opt.text).toBe("string");
      }
    });

    it("strictly strips buggyLines and distractorNotes from client practical debugging challenges", () => {
      const serverChallenge = DEBUG_CHALLENGES[0];
      const clientChallenge = sanitizeDebugChallenge(serverChallenge);

      expect((clientChallenge as Record<string, unknown>).buggyLines).toBeUndefined();
      expect((clientChallenge as Record<string, unknown>).distractorNotes).toBeUndefined();
      expect((clientChallenge as Record<string, unknown>).interviewTakeaway).toBeUndefined();

      // Only metadata needed for rendering is present
      expect(clientChallenge.id).toBe(serverChallenge.id);
      expect(clientChallenge.code).toBe(serverChallenge.code);
      expect(clientChallenge.totalLines).toBeGreaterThan(0);
      expect(clientChallenge.buggyLineCount).toBe(serverChallenge.buggyLines.length);
    });
  });

  describe("Tenant Isolation: Strict User Scoping", () => {
    it("guarantees User Alice's data cannot be seen or modified by User Bob", async () => {
      const aliceProjects = getUserProjectsRepository(USER_ALICE);
      const bobProjects = getUserProjectsRepository(USER_BOB);

      // Alice creates a private project
      await aliceProjects.saveProject({
        id: "proj_alice_secret",
        name: "Secret Quantum Algorithm",
        role: "Lead Researcher",
        summary: "Proprietary trading engine",
        responsibilities: ["Core math model"],
        techStack: ["C++", "Python"],
        metrics: ["100ns execution"],
        links: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Bob tries to query projects
      const bobRetrieved = await bobProjects.getProjects();
      expect(bobRetrieved).toHaveLength(0);

      const bobDirectQuery = await bobProjects.getProjectById("proj_alice_secret");
      expect(bobDirectQuery).toBeNull();
    });
  });

  describe("End-to-End User Flow: Onboarding -> Drills -> Debugging -> Panel -> Insights", () => {
    it("completes the entire end-to-end user lifecycle deterministically", async () => {
      const profileRepo = getProfileRepository(USER_ALICE);
      const projectsRepo = getUserProjectsRepository(USER_ALICE);
      const historyRepo = getQuestionHistoryRepository(USER_ALICE);

      // Step 1: Onboard verified skills & candidate project
      await profileRepo.addSkill({ name: "react", level: "advanced", source: "manual" });
      await profileRepo.addSkill({ name: "nodejs", level: "intermediate", source: "resume" });

      await projectsRepo.saveProject({
        id: "proj_alice_store",
        name: "High Scale E-Commerce Checkout",
        role: "Senior Fullstack Engineer",
        summary: "Next.js and Node.js microservice architecture with Redis inventory locking",
        responsibilities: ["Implemented distributed Redis mutexes to prevent overselling"],
        techStack: ["React", "Node.js", "Redis", "PostgreSQL"],
        metrics: ["Processed $10M GMV", "99.99% uptime during Black Friday"],
        links: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Step 2: Answer 3 drill questions
      const reactQ = ALL_M2_QUESTIONS.find((q) => q.skillId === "react")!;
      const nodeQ = ALL_M2_QUESTIONS.find((q) => q.skillId === "nodejs")!;
      await historyRepo.recordQuestionResult(reactQ.id, true);
      await historyRepo.recordQuestionResult(nodeQ.id, true);
      await historyRepo.recordQuestionResult(ALL_M2_QUESTIONS[2].id, true);

      // Step 3: Solve practical debugging scenario
      await historyRepo.recordQuestionResult(DEBUG_CHALLENGES[0].id, true);

      // Step 4: Synthesize project interview panel questions
      const [aliceProject] = await projectsRepo.getProjects();
      const panelQuestions = generateQuestionsForProject(aliceProject);
      expect(panelQuestions).toHaveLength(10);
      expect(panelQuestions[0].modelAnswer).toBeDefined();

      // Step 5: Verify readiness diagnostic calculation
      const insights = await calculateDiagnosticScores(USER_ALICE);

      expect(insights.scores.stackKnowledge).toBeGreaterThanOrEqual(60);
      expect(insights.scores.interviewReadiness).toBeGreaterThanOrEqual(50);
      expect(insights.summary.totalQuestionsAnswered).toBe(4); // 3 drill + 1 debug
      expect(insights.summary.debuggingSolved).toBe(1);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });
  });
});
