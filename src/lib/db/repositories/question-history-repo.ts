import { UserScopedRepository } from "../repository";
import { UserQuestionHistorySchema, UserQuestionHistoryDocument } from "../schemas";

export class QuestionHistoryRepository extends UserScopedRepository<UserQuestionHistoryDocument> {
  constructor(userId: string) {
    super("user_question_history", userId, UserQuestionHistorySchema);
  }

  async getSeenQuestionIds(): Promise<string[]> {
    const records = await this.find({});
    return records.map((r) => r.questionId);
  }

  async getHistoryForQuestions(
    questionIds: string[]
  ): Promise<Map<string, UserQuestionHistoryDocument>> {
    if (questionIds.length === 0) return new Map();
    const records = await this.find({ questionId: { $in: questionIds } });
    const map = new Map<string, UserQuestionHistoryDocument>();
    for (const r of records) {
      map.set(r.questionId, r);
    }
    return map;
  }

  async recordQuestionResult(
    questionId: string,
    isCorrect: boolean
  ): Promise<UserQuestionHistoryDocument> {
    const existing = await this.findOne({ questionId });
    const now = new Date();

    if (existing) {
      const correctCount = existing.correctCount + (isCorrect ? 1 : 0);
      const wrongCount = existing.wrongCount + (isCorrect ? 0 : 1);
      const timesSeen = existing.timesSeen + 1;

      return this.upsert(
        { questionId },
        {
          lastSeenAt: now,
          timesSeen,
          lastResult: isCorrect ? "correct" : "incorrect",
          correctCount,
          wrongCount,
        }
      );
    }

    return this.create({
      userId: this.userId,
      questionId,
      firstSeenAt: now,
      lastSeenAt: now,
      timesSeen: 1,
      lastResult: isCorrect ? "correct" : "incorrect",
      correctCount: isCorrect ? 1 : 0,
      wrongCount: isCorrect ? 0 : 1,
    });
  }

  async resetHistoryForSkills(questionIds: string[]): Promise<number> {
    if (questionIds.length === 0) return 0;
    return this.deleteMany({ questionId: { $in: questionIds } });
  }
}

export function getQuestionHistoryRepository(userId: string): QuestionHistoryRepository {
  return new QuestionHistoryRepository(userId);
}
