import { describe, it, expect, beforeEach } from "vitest";
import {
  generateQuestionsForProject,
  CANONICAL_SAMPLE_PROJECT,
} from "@/lib/m2/project-panel-generator";
import { UserProjectDocument, ProjectQuestionSchema } from "@/lib/db/schemas";
import {
  getProjectQuestionsRepository,
  getUserProjectsRepository,
  getXpRepository,
} from "@/lib/db/repositories";

describe("Module II — Phase 6: Project Interview Panel", () => {
  const TEST_USER = "test-panel-user-789";

  const sampleUserProject: UserProjectDocument = {
    id: "proj_distributed_rate_limiter",
    userId: TEST_USER,
    name: "Distributed Token Bucket Rate Limiter",
    role: "Senior Infrastructure Engineer",
    summary:
      "Built a high-throughput, fault-tolerant rate limiting service utilizing Redis Cluster and Lua scripts to enforce sliding-window quotas across 40 internal microservices.",
    responsibilities: [
      "Designed atomic sliding-window Lua evaluation reducing race conditions under 50k RPS.",
      "Implemented local in-memory token caching with 500ms sync intervals to absorb read bursts.",
    ],
    techStack: ["Go", "Redis", "Docker", "Prometheus", "Kubernetes"],
    metrics: ["50,000 req/sec sustained throughput", "99.99% availability", "under 2ms p99 latency"],
    links: ["https://github.com/example/rate-limiter"],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const questionsRepo = getProjectQuestionsRepository(TEST_USER);
    const projectsRepo = getUserProjectsRepository(TEST_USER);
    const xpRepo = getXpRepository(TEST_USER);

    await questionsRepo.deleteMany({});
    await projectsRepo.deleteMany({});
    await xpRepo.deleteMany({});
  });

  describe("Deterministic Question Generation", () => {
    it("generates exactly 10 questions covering all 10 core senior categories", () => {
      const questions = generateQuestionsForProject(sampleUserProject);
      expect(questions).toHaveLength(10);

      const expectedCategories = [
        "Architecture & System Design",
        "Scale & Performance",
        "Concurrency & Data Consistency",
        "Failure Modes & Fault Tolerance",
        "Data Modeling & Storage Decisions",
        "Security, Auth & Boundary Isolation",
        "Observability, Metrics & Alerting",
        "Technical Trade-offs & Regrets",
        "Testing Strategy & CI/CD",
        "Production Incident & Debugging",
      ];

      const generatedCategories = questions.map((q) => q.category);
      for (const cat of expectedCategories) {
        expect(generatedCategories).toContain(cat);
      }
    });

    it("grounds questions and answers in user's real project name, tech stack, and metrics", () => {
      const questions = generateQuestionsForProject(sampleUserProject);

      // Verify project name appears in questions
      const mentionsProjectName = questions.some((q) =>
        q.question.includes(sampleUserProject.name)
      );
      expect(mentionsProjectName).toBe(true);

      // Verify metrics appear in questions / answers
      const mentionsMetric = questions.some((q) =>
        q.question.includes(sampleUserProject.metrics[0]) ||
        q.modelAnswer.includes(sampleUserProject.metrics[0])
      );
      expect(mentionsMetric).toBe(true);
    });

    it("structures model answers with full STAR format", () => {
      const questions = generateQuestionsForProject(sampleUserProject);

      for (const q of questions) {
        expect(q.modelAnswer).toContain("**Situation:**");
        expect(q.modelAnswer).toContain("**Task:**");
        expect(q.modelAnswer).toContain("**Action:**");
        expect(q.modelAnswer).toContain("**Result:**");
      }
    });

    it("includes rich key points, common mistakes, and interviewer follow-up questions", () => {
      const questions = generateQuestionsForProject(sampleUserProject);

      for (const q of questions) {
        expect(q.keyPoints.length).toBeGreaterThanOrEqual(2);
        expect(q.commonMistakes.length).toBeGreaterThanOrEqual(2);
        expect(q.followUps.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("validates all generated questions against ProjectQuestionSchema", () => {
      const questions = generateQuestionsForProject(sampleUserProject);

      for (const q of questions) {
        const doc = {
          ...q,
          userId: TEST_USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const parsed = ProjectQuestionSchema.safeParse(doc);
        expect(parsed.success, `Failed on question ${q.id}`).toBe(true);
      }
    });

    it("successfully generates questions for canonical sample architecture project", () => {
      const sampleQuestions = generateQuestionsForProject(CANONICAL_SAMPLE_PROJECT);
      expect(sampleQuestions).toHaveLength(10);
      expect(sampleQuestions[0].question).toContain(CANONICAL_SAMPLE_PROJECT.name);
    });
  });

  describe("Repository Persistence & Status Updates", () => {
    it("persists generated questions for a project and retrieves them", async () => {
      const questionsRepo = getProjectQuestionsRepository(TEST_USER);
      const generated = generateQuestionsForProject(sampleUserProject);

      const saved = await questionsRepo.setQuestionsForProject(sampleUserProject.id, generated);
      expect(saved).toHaveLength(10);

      const retrieved = await questionsRepo.getQuestionsByProject(sampleUserProject.id);
      expect(retrieved).toHaveLength(10);
      expect(retrieved[0].projectId).toBe(sampleUserProject.id);
      expect(retrieved[0].status).toBe("unreviewed");
    });

    it("updates question status from unreviewed to got_it and need_review", async () => {
      const questionsRepo = getProjectQuestionsRepository(TEST_USER);
      const generated = generateQuestionsForProject(sampleUserProject);
      await questionsRepo.setQuestionsForProject(sampleUserProject.id, generated);

      const targetId = generated[0].id;

      // Update to got_it
      await questionsRepo.updateQuestionStatus(targetId, "got_it");
      let updated = await questionsRepo.findOne({ id: targetId });
      expect(updated?.status).toBe("got_it");

      // Update to need_review
      await questionsRepo.updateQuestionStatus(targetId, "need_review");
      updated = await questionsRepo.findOne({ id: targetId });
      expect(updated?.status).toBe("need_review");
    });

    it("awards XP idempotently when user marks a question as got_it", async () => {
      const xpRepo = getXpRepository(TEST_USER);
      const questionId = "pq_test_123";

      // First time got_it -> awards 10 XP
      const res1 = await xpRepo.awardXp("m2_project_mastery", 10, questionId);
      expect(res1.added).toBe(true);
      expect(res1.totalXp).toBe(10);

      // Second time got_it on same question -> idempotent, no double XP
      const res2 = await xpRepo.awardXp("m2_project_mastery", 10, questionId);
      expect(res2.added).toBe(false);
      expect(res2.totalXp).toBe(10);
    });
  });
});
