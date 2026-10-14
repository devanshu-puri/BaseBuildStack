import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLessonRetestDeck,
  submitLessonRetest,
} from "@/lib/m3/retest-session";
import { getLessonById, getLessonRetestChallenge } from "@/content/m3/lessons";

// In-memory test state
const mockCards: Array<{
  itemId: string;
  due: Date;
  interval: number;
  ease: number;
  repetitions: number;
}> = [];

const mockUpsertCard = vi.fn().mockImplementation(async (data) => {
  const existingIdx = mockCards.findIndex((c) => c.itemId === data.itemId);
  if (existingIdx >= 0) {
    mockCards[existingIdx] = { ...mockCards[existingIdx], ...data };
    return mockCards[existingIdx];
  }
  mockCards.push(data);
  return data;
});

const mockAwardXp = vi.fn().mockResolvedValue({
  added: true,
  event: { amount: 25 },
  totalXp: 250,
});

const mockSetProgress = vi.fn().mockResolvedValue({ id: "prog-1" });
const mockRecordAttempt = vi.fn().mockResolvedValue({ id: "att-1" });
const mockRecordMistake = vi.fn().mockResolvedValue({ id: "mst-1" });

vi.mock("@/lib/db/repositories/srs-repo", () => ({
  getSrsRepository: vi.fn(() => ({
    find: vi.fn().mockImplementation(async () => mockCards),
    getCard: vi.fn().mockImplementation(async (itemId: string) => {
      return mockCards.find((c) => c.itemId === itemId) || null;
    }),
    upsertCard: mockUpsertCard,
  })),
}));

vi.mock("@/lib/db/repositories/xp-repo", () => ({
  getXpRepository: vi.fn(() => ({
    awardXp: mockAwardXp,
  })),
}));

vi.mock("@/lib/db/repositories/progress-repo", () => ({
  getProgressRepository: vi.fn(() => ({
    setProgress: mockSetProgress,
  })),
}));

vi.mock("@/lib/db/repositories/attempt-repo", () => ({
  getAttemptRepository: vi.fn(() => ({
    recordAttempt: mockRecordAttempt,
  })),
}));

vi.mock("@/lib/db/repositories/mistake-repo", () => ({
  getMistakeRepository: vi.fn(() => ({
    recordMistake: mockRecordMistake,
  })),
}));

describe("Module III — Spaced Repetition Mastery Retests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCards.length = 0;
  });

  it("should return empty deck when user has no scheduled lesson cards", async () => {
    const deck = await getLessonRetestDeck("user-1");
    expect(deck.dueCards).toHaveLength(0);
    expect(deck.upcomingCards).toHaveLength(0);
    expect(deck.masteredCards).toHaveLength(0);
    expect(deck.stats.dueCount).toBe(0);
  });

  it("should categorize cards due today as dueCards and future cards as upcomingCards", async () => {
    const now = new Date("2026-10-15T12:00:00Z");

    // Due card: +3 days scheduled in past
    mockCards.push({
      itemId: "m3_caching-fundamentals",
      due: new Date("2026-10-14T10:00:00Z"),
      interval: 3,
      ease: 2.5,
      repetitions: 1,
    });

    // Upcoming card: +10 days scheduled in future
    mockCards.push({
      itemId: "m3_rag-pipeline",
      due: new Date("2026-10-22T10:00:00Z"),
      interval: 7,
      ease: 2.5,
      repetitions: 2,
    });

    const deck = await getLessonRetestDeck("user-1", now);

    expect(deck.stats.dueCount).toBe(1);
    expect(deck.dueCards[0].lessonId).toBe("caching-fundamentals");
    expect(deck.dueCards[0].stage).toBe("day3");
    expect(deck.dueCards[0].isDue).toBe(true);

    expect(deck.stats.upcomingCount).toBe(1);
    expect(deck.upcomingCards[0].lessonId).toBe("rag-pipeline");
    expect(deck.upcomingCards[0].stage).toBe("day10");
    expect(deck.upcomingCards[0].isDue).toBe(false);
    expect(deck.upcomingCards[0].daysUntilDue).toBeGreaterThan(0);
  });

  it("should identify mastered topics with 3+ repetitions and 14+ interval", async () => {
    mockCards.push({
      itemId: "m3_docker-containers",
      due: new Date("2026-11-01T10:00:00Z"),
      interval: 21,
      ease: 2.5,
      repetitions: 3,
    });

    const deck = await getLessonRetestDeck("user-1");
    expect(deck.stats.masteredCount).toBe(1);
    expect(deck.masteredCards[0].lessonId).toBe("docker-containers");
    expect(deck.masteredCards[0].stage).toBe("mastered");
  });

  it("should handle Day 3 re-test pass: awards +25 XP, sets interval to +7 days, repetitions to 2", async () => {
    const lesson = getLessonById("caching-fundamentals")!;
    const challenge = getLessonRetestChallenge(lesson, "day3");

    mockCards.push({
      itemId: "m3_caching-fundamentals",
      due: new Date("2026-10-14T10:00:00Z"),
      interval: 3,
      ease: 2.5,
      repetitions: 1,
    });

    const result = await submitLessonRetest("user-1", {
      lessonId: "caching-fundamentals",
      stage: "day3",
      selectedOptionId: challenge.correctOptionId,
      durationMs: 4200,
    });

    expect(result.passed).toBe(true);
    expect(result.stage).toBe("day3");
    expect(result.mastered).toBe(false);
    expect(result.xpAwarded).toBe(25);
    expect(result.newInterval).toBe(7);

    expect(mockUpsertCard).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "m3_caching-fundamentals",
        interval: 7,
        repetitions: 2,
      })
    );

    expect(mockSetProgress).toHaveBeenCalledWith(
      "m3",
      "caching-fundamentals",
      "completed",
      6
    );
  });

  it("should handle Day 10 re-test pass: marks topic Mastered, awards +50 XP, sets interval to 21 days", async () => {
    const lesson = getLessonById("rag-pipeline")!;
    const challenge = getLessonRetestChallenge(lesson, "day10");

    mockCards.push({
      itemId: "m3_rag-pipeline",
      due: new Date("2026-10-14T10:00:00Z"),
      interval: 7,
      ease: 2.5,
      repetitions: 2,
    });

    mockAwardXp.mockResolvedValueOnce({
      added: true,
      event: { amount: 50 },
      totalXp: 300,
    });

    const result = await submitLessonRetest("user-1", {
      lessonId: "rag-pipeline",
      stage: "day10",
      selectedOptionId: challenge.correctOptionId,
      durationMs: 5000,
    });

    expect(result.passed).toBe(true);
    expect(result.stage).toBe("day10");
    expect(result.mastered).toBe(true);
    expect(result.xpAwarded).toBe(50);
    expect(result.newInterval).toBe(21);

    expect(mockSetProgress).toHaveBeenCalledWith(
      "m3",
      "rag-pipeline",
      "completed",
      7
    );

    expect(mockUpsertCard).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "m3_rag-pipeline",
        interval: 21,
        repetitions: 3,
      })
    );
  });

  it("should handle failed re-test: resets interval to 1 day, records mistake, zero XP", async () => {
    mockCards.push({
      itemId: "m3_caching-fundamentals",
      due: new Date("2026-10-14T10:00:00Z"),
      interval: 7,
      ease: 2.5,
      repetitions: 2,
    });

    const result = await submitLessonRetest("user-1", {
      lessonId: "caching-fundamentals",
      stage: "day10",
      selectedOptionId: "wrong-option-id",
      durationMs: 3000,
    });

    expect(result.passed).toBe(false);
    expect(result.mastered).toBe(false);
    expect(result.xpAwarded).toBe(0);
    expect(result.newInterval).toBe(1);

    expect(mockUpsertCard).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "m3_caching-fundamentals",
        interval: 1,
        repetitions: 1,
      })
    );

    expect(mockRecordMistake).toHaveBeenCalledWith(
      "m3",
      "caching-fundamentals",
      expect.stringContaining("Retest day10 failed")
    );
  });
});
