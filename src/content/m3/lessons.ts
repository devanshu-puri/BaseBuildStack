import { Lesson, LessonSchema, LessonPath } from "./lesson-schema";
import { CURATED_LESSONS } from "./lessons-data";

/**
 * Returns all curated Tech Bites lessons.
 */
export function getAllLessons(): Lesson[] {
  return CURATED_LESSONS;
}

/**
 * Finds a lesson by unique ID.
 */
export function getLessonById(id: string): Lesson | undefined {
  return CURATED_LESSONS.find((l) => l.id === id);
}

/**
 * Filters lessons by career learning path.
 */
export function getLessonsByPath(path: LessonPath): Lesson[] {
  return CURATED_LESSONS.filter((l) => l.paths.includes(path));
}

/**
 * Validates lesson data integrity:
 * - Passes LessonSchema
 * - Exactly 5 stages in order (stage 1 through 5)
 * - Recall stage has valid interactiveExercise
 */
export function validateLessonIntegrity(lesson: Lesson): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const parseResult = LessonSchema.safeParse(lesson);
  if (!parseResult.success) {
    errors.push(
      ...parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }

  // Check stage ordering
  if (lesson.steps.length === 5) {
    const expectedStages = ["why", "mental_model", "see_it", "try_it", "recall"];
    lesson.steps.forEach((step, idx) => {
      if (step.stage !== expectedStages[idx]) {
        errors.push(
          `Step ${idx + 1} has stage '${step.stage}', expected '${expectedStages[idx]}'`
        );
      }
      if (step.stageNumber !== idx + 1) {
        errors.push(
          `Step ${idx + 1} has stageNumber '${step.stageNumber}', expected ${idx + 1}`
        );
      }
    });
  }

  // Check recall stage has correct interactive exercise
  const recallStep = lesson.steps[4];
  if (recallStep && (!recallStep.interactiveExercise || !recallStep.interactiveExercise.correctOptionId)) {
    errors.push("Recall stage must have a valid interactive exercise with correctOptionId");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Retrieves the specific re-test challenge for a lesson based on stage ('day3' or 'day10').
 * Falls back to the lesson's stage 5 recall exercise if specific retest challenge is not defined.
 */
export function getLessonRetestChallenge(
  lesson: Lesson,
  stage: "day3" | "day10"
) {
  if (lesson.retestChallenges && lesson.retestChallenges[stage]) {
    return lesson.retestChallenges[stage];
  }
  const recallExercise = lesson.steps[4]?.interactiveExercise;
  if (!recallExercise) {
    throw new Error(`Lesson ${lesson.id} has no recall or retest exercise`);
  }
  return recallExercise;
}

