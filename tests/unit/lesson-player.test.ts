import { describe, it, expect, vi } from "vitest";
import { LessonSchema } from "@/content/m3/lesson-schema";
import {
  getAllLessons,
  getLessonById,
  getLessonsByPath,
  validateLessonIntegrity,
} from "@/content/m3/lessons";
import { completeLessonSession } from "@/lib/m3/lesson-session";

// Mock repositories
vi.mock("@/lib/db/repositories/xp-repo", () => ({
  getXpRepository: vi.fn(() => ({
    awardXp: vi.fn().mockResolvedValue({
      added: true,
      event: { amount: 50 },
      totalXp: 200,
    }),
  })),
}));

vi.mock("@/lib/db/repositories/progress-repo", () => ({
  getProgressRepository: vi.fn(() => ({
    setProgress: vi.fn().mockResolvedValue({ id: "prog-1" }),
    getProgress: vi.fn().mockResolvedValue(null),
  })),
}));

vi.mock("@/lib/db/repositories/srs-repo", () => ({
  getSrsRepository: vi.fn(() => ({
    upsertCard: vi.fn().mockResolvedValue({ id: "card-1" }),
  })),
}));

vi.mock("@/lib/db/repositories/bookmark-repo", () => ({
  getBookmarkRepository: vi.fn(() => ({
    toggleBookmark: vi.fn().mockResolvedValue({ bookmarked: true }),
  })),
}));

describe("Module III — Lesson Schema & Data Integrity", () => {
  const allLessons = getAllLessons();

  it("should have all 8 canonical lessons in the library", () => {
    expect(allLessons.length).toBe(8);
    const expectedIds = [
      "caching-fundamentals",
      "rag-pipeline",
      "llm-basics",
      "tokens-context",
      "embeddings-similarity",
      "http-rest",
      "docker-containers",
      "cicd-pipelines",
    ];
    for (const expectedId of expectedIds) {
      const found = allLessons.find((l) => l.id === expectedId);
      expect(found).toBeDefined();
    }
  });

  it("should validate all 8 lessons against LessonSchema with zero errors", () => {
    for (const lesson of allLessons) {
      const parsed = LessonSchema.safeParse(lesson);
      expect(parsed.success).toBe(true);

      const integrity = validateLessonIntegrity(lesson);
      expect(integrity.valid).toBe(true);
      expect(integrity.errors).toEqual([]);
    }
  });

  it("should enforce exactly 5 stages in order: Why -> Mental Model -> See It -> Try It -> Recall", () => {
    const expectedStages = [
      "why",
      "mental_model",
      "see_it",
      "try_it",
      "recall",
    ];

    for (const lesson of allLessons) {
      expect(lesson.steps.length).toBe(5);
      lesson.steps.forEach((step, idx) => {
        expect(step.stage).toBe(expectedStages[idx]);
        expect(step.stageNumber).toBe(idx + 1);
        expect(step.durationMinutes).toBeGreaterThan(0);
      });
    }
  });

  it("should enforce complete reference metadata (whereUsed, commonlyConfusedWith, remember)", () => {
    for (const lesson of allLessons) {
      expect(lesson.reference.whereUsed.length).toBeGreaterThan(0);
      expect(lesson.reference.commonlyConfusedWith.length).toBeGreaterThan(0);
      expect(lesson.reference.remember.length).toBeGreaterThan(0);
    }
  });

  it("should filter lessons by career learning path", () => {
    const backendLessons = getLessonsByPath("backend");
    expect(backendLessons.length).toBeGreaterThan(0);
    expect(backendLessons.some((l) => l.id === "caching-fundamentals")).toBe(true);

    const aiLessons = getLessonsByPath("ai");
    expect(aiLessons.length).toBeGreaterThan(0);
    expect(aiLessons.some((l) => l.id === "rag-pipeline")).toBe(true);
  });
});

describe("Module III — Deterministic Lesson Session & Recall Engine", () => {
  it("should award XP and complete lesson when recall assessment passes", async () => {
    const lesson = getLessonById("caching-fundamentals");
    expect(lesson).toBeDefined();
    if (!lesson) return;

    const recallStep = lesson.steps[4];
    const correctOptionId = recallStep.interactiveExercise!.correctOptionId;

    const result = await completeLessonSession({
      userId: "user-123",
      payload: {
        lessonId: lesson.id,
        recallAnswerId: correctOptionId,
        durationMs: 850_000,
        bookmarked: true,
      },
    });

    expect(result.lessonId).toBe(lesson.id);
    expect(result.recallPassed).toBe(true);
    expect(result.xpAwarded).toBe(50);
    expect(result.totalXp).toBe(200);
    expect(result.bookmarked).toBe(true);
    expect(result.feedback).toContain("Great job");
  });

  it("should NOT award XP when recall assessment fails, and return explanation", async () => {
    const lesson = getLessonById("caching-fundamentals");
    expect(lesson).toBeDefined();
    if (!lesson) return;

    const incorrectOptionId = "opt-1"; // Wrong option

    const result = await completeLessonSession({
      userId: "user-123",
      payload: {
        lessonId: lesson.id,
        recallAnswerId: incorrectOptionId,
        durationMs: 900_000,
        bookmarked: false,
      },
    });

    expect(result.lessonId).toBe(lesson.id);
    expect(result.recallPassed).toBe(false);
    expect(result.xpAwarded).toBe(0);
    expect(result.feedback).toBe(
      lesson.steps[4].interactiveExercise!.explanation
    );
  });

  it("should throw an error for non-existent lesson ID", async () => {
    await expect(
      completeLessonSession({
        userId: "user-123",
        payload: {
          lessonId: "non-existent-lesson",
          recallAnswerId: "opt-1",
          durationMs: 10_000,
          bookmarked: false,
        },
      })
    ).rejects.toThrow(/Lesson not found/);
  });
});
