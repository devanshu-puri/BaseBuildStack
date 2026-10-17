import { describe, it, expect, beforeEach } from "vitest";
import {
  CANONICAL_SKILLS,
  TARGET_ROLES,
  normalizeSkillAlias,
  getSkillBySlug,
} from "@/lib/m2/skill-taxonomy";
import {
  getUserProjectsRepository,
  getQuestionHistoryRepository,
  getProjectQuestionsRepository,
} from "@/lib/db/repositories";

describe("Module II Phase 1: Canonical Taxonomy & Role Mappings", () => {
  it("enforces canonical skills taxonomy size <= 55 curated skills", () => {
    expect(CANONICAL_SKILLS.length).toBeGreaterThan(40);
    expect(CANONICAL_SKILLS.length).toBeLessThanOrEqual(55);
  });

  it("normalizes common tech aliases to canonical skill instances", () => {
    const react1 = normalizeSkillAlias("ReactJS");
    const react2 = normalizeSkillAlias("react.js");
    const react3 = normalizeSkillAlias("react");
    expect(react1?.name).toBe("React");
    expect(react2?.name).toBe("React");
    expect(react3?.name).toBe("React");

    const k8s = normalizeSkillAlias("k8s");
    expect(k8s?.name).toBe("Kubernetes");

    const node = normalizeSkillAlias("node");
    expect(node?.name).toBe("Node.js");

    const postgres = normalizeSkillAlias("postgres");
    expect(postgres?.name).toBe("PostgreSQL");

    const unknown = normalizeSkillAlias("unknown-non-existent-tech-xyz");
    expect(unknown).toBeNull();
  });

  it("retrieves canonical skills by slug", () => {
    const skill = getSkillBySlug("system-design");
    expect(skill?.name).toBe("System Design");
    expect(skill?.category).toBe("cs_fundamentals");
  });

  it("maps every target engineering role to exactly 10 recommended skills", () => {
    expect(TARGET_ROLES.length).toBe(6);
    for (const role of TARGET_ROLES) {
      expect(role.recommendedSkills.length).toBe(10);
      // Verify every recommended skill exists in canonical taxonomy
      for (const skillName of role.recommendedSkills) {
        const canonical = normalizeSkillAlias(skillName);
        expect(canonical).not.toBeNull();
      }
    }
  });
});

import { getDb } from "@/lib/db/client";

describe("Module II Phase 1: Database Repositories", () => {
  const foundationTestUsers = [
    "user_alpha",
    "user_beta",
    "user_gamma",
    "user_delta",
    "user_hist_1",
    "user_hist_2",
    "user_pqa",
    "user_pqb",
  ];

  beforeEach(async () => {
    try {
      const db = await getDb();
      await db.collection("user_projects").deleteMany({ userId: { $in: foundationTestUsers } });
      await db.collection("user_question_history").deleteMany({ userId: { $in: foundationTestUsers } });
      await db.collection("project_questions").deleteMany({ userId: { $in: foundationTestUsers } });
    } catch {
      // offline fallback
    }
  });

  it("UserProjectsRepository supports saving, updating, and user isolation", async () => {
    const userARepo = getUserProjectsRepository("user_alpha");
    const userBRepo = getUserProjectsRepository("user_beta");

    await userARepo.saveProject({
      id: "proj_1",
      name: "E-Commerce Microservices",
      summary: "Distributed high throughput checkout system",
      role: "Lead Backend Engineer",
      techStack: ["Node.js", "PostgreSQL", "Redis", "Kafka", "Docker"],
      responsibilities: ["Engineered idempotent payments flow", "Optimized DB connection pool"],
      metrics: ["10k RPS", "99.99% uptime"],
      links: ["https://github.com/example/checkout"],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userAProjects = await userARepo.getProjects();
    expect(userAProjects.length).toBe(1);
    expect(userAProjects[0].name).toBe("E-Commerce Microservices");

    // Isolation: user B sees 0 projects
    const userBProjects = await userBRepo.getProjects();
    expect(userBProjects.length).toBe(0);

    // Update project versioning
    await userARepo.saveProject({
      id: "proj_1",
      name: "E-Commerce Microservices v2",
      summary: "Updated summary",
      role: "Principal Engineer",
      techStack: ["Node.js", "PostgreSQL", "Redis"],
      responsibilities: ["Engineered idempotent payments"],
      metrics: ["15k RPS"],
      links: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await userARepo.getProjectById("proj_1");
    expect(updated?.version).toBe(2);
    expect(updated?.name).toBe("E-Commerce Microservices v2");
  });

  it("QuestionHistoryRepository records question results and increments counts", async () => {
    const historyRepo = getQuestionHistoryRepository("user_gamma");

    await historyRepo.recordQuestionResult("q_react_hooks_1", true);
    let historyMap = await historyRepo.getHistoryForQuestions(["q_react_hooks_1"]);
    let rec = historyMap.get("q_react_hooks_1");
    expect(rec?.timesSeen).toBe(1);
    expect(rec?.lastResult).toBe("correct");
    expect(rec?.correctCount).toBe(1);
    expect(rec?.wrongCount).toBe(0);

    // Seen again and answered incorrectly
    await historyRepo.recordQuestionResult("q_react_hooks_1", false);
    historyMap = await historyRepo.getHistoryForQuestions(["q_react_hooks_1"]);
    rec = historyMap.get("q_react_hooks_1");
    expect(rec?.timesSeen).toBe(2);
    expect(rec?.lastResult).toBe("incorrect");
    expect(rec?.correctCount).toBe(1);
    expect(rec?.wrongCount).toBe(1);

    const seenIds = await historyRepo.getSeenQuestionIds();
    expect(seenIds).toContain("q_react_hooks_1");
  });

  it("ProjectQuestionsRepository supports status updates ('got_it' / 'need_review')", async () => {
    const pqRepo = getProjectQuestionsRepository("user_delta");

    await pqRepo.setQuestionsForProject("proj_alpha", [
      {
        id: "pq_1",
        projectId: "proj_alpha",
        question: "Why did you choose Redis over Memcached for caching?",
        modelAnswer: "We chose Redis because we required persistent data structures and atomic operations.",
        keyPoints: ["Data structures", "Persistence", "Replication"],
        commonMistakes: ["Saying Redis is just faster without reasoning"],
        followUps: ["How did you configure eviction policies?"],
        category: "Architecture & Design",
        difficulty: "medium",
        status: "unreviewed",
        relatedSkills: ["Redis"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const questions = await pqRepo.getQuestionsByProject("proj_alpha");
    expect(questions.length).toBe(1);
    expect(questions[0].status).toBe("unreviewed");

    await pqRepo.updateQuestionStatus("pq_1", "got_it");
    const updatedQuestions = await pqRepo.getQuestionsByProject("proj_alpha");
    expect(updatedQuestions[0].status).toBe("got_it");
  });
});
