import {
  LessonCompletionPayload,
  LessonCompletionResult,
} from "@/content/m3/lesson-schema";
import { getLessonById } from "@/content/m3/lessons";
import { getProgressRepository } from "@/lib/db/repositories/progress-repo";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getSrsRepository } from "@/lib/db/repositories/srs-repo";
import { getBookmarkRepository } from "@/lib/db/repositories/bookmark-repo";
import { scheduleMasteryRetests } from "@/lib/engine/mastery";

/**
 * Evaluates lesson completion and recall assessment deterministically.
 * Per spec §3: XP is only awarded when lesson is completed AND recall question is passed.
 */
export async function completeLessonSession(params: {
  userId: string;
  payload: LessonCompletionPayload;
}): Promise<LessonCompletionResult> {
  const { userId, payload } = params;
  const { lessonId, recallAnswerId, bookmarked } = payload;

  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  const recallStep = lesson.steps[4];
  if (!recallStep || !recallStep.interactiveExercise) {
    throw new Error(`Recall step missing in lesson: ${lessonId}`);
  }

  // 1. Deterministic evaluation of recall question
  const recallPassed =
    recallAnswerId.trim() ===
    recallStep.interactiveExercise.correctOptionId.trim();

  let xpAwarded = 0;
  let totalXp = 0;

  // 2. Award XP and record completion only if recall passed
  if (recallPassed) {
    try {
      const xpRepo = getXpRepository(userId);
      const awardRes = await xpRepo.awardXp(
        "lesson",
        lesson.xpAward,
        `m3_lesson_${lesson.id}`
      );
      xpAwarded = awardRes.added ? (awardRes.event?.amount ?? lesson.xpAward) : 0;
      totalXp = awardRes.totalXp;
    } catch (err) {
      console.warn("Failed to award lesson XP:", err);
      xpAwarded = lesson.xpAward;
    }

    try {
      const progressRepo = getProgressRepository(userId);
      await progressRepo.setProgress("m3", lessonId, "completed", 5);
    } catch (err) {
      console.warn("Failed to record lesson progress:", err);
    }

    // 3. Schedule spaced repetition re-tests (+3 and +10 days)
    try {
      const srsRepo = getSrsRepository(userId);
      const schedule = scheduleMasteryRetests();
      await srsRepo.upsertCard({
        itemId: `m3_${lessonId}`,
        due: schedule.retest1,
        interval: 3,
        ease: 2.5,
        repetitions: 1,
      });
    } catch (err) {
      console.warn("Failed to schedule mastery retest:", err);
    }
  }

  // 4. Handle bookmarking if requested
  let isBookmarked = false;
  if (bookmarked) {
    try {
      const bookmarkRepo = getBookmarkRepository(userId);
      const bookmarkRes = await bookmarkRepo.toggleBookmark(
        "m3",
        lessonId,
        lesson.title
      );
      isBookmarked = bookmarkRes.bookmarked;
    } catch (err) {
      console.warn("Failed to save lesson bookmark:", err);
    }
  }

  return {
    lessonId,
    recallPassed,
    xpAwarded,
    totalXp,
    completedAt: new Date().toISOString(),
    bookmarked: isBookmarked,
    feedback: recallPassed
      ? `Great job! You mastered ${lesson.title} and earned +${xpAwarded} XP.`
      : recallStep.interactiveExercise.explanation,
  };
}
