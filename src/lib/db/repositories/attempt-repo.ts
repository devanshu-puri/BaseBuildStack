import { UserScopedRepository } from "../repository";
import { AttemptSchema, AttemptDocument } from "../schemas";

export class AttemptRepository extends UserScopedRepository<AttemptDocument> {
  constructor(userId: string) {
    super("attempts", userId, AttemptSchema);
  }

  async recordAttempt(data: {
    module: "m1" | "m2" | "m3" | "m4";
    itemId: string;
    answer: unknown;
    correct: boolean;
    ms: number;
    changes?: number;
    confidence?: "guessing" | "unsure" | "certain" | null;
  }): Promise<AttemptDocument> {
    return this.create({
      userId: this.userId,
      module: data.module,
      itemId: data.itemId,
      answer: data.answer,
      correct: data.correct,
      ms: data.ms,
      changes: data.changes ?? 0,
      confidence: data.confidence,
      ts: new Date(),
    });
  }

  async getRecentAttempts(limit = 20): Promise<AttemptDocument[]> {
    return this.find({}, { sort: { ts: -1 }, limit });
  }

  async getItemAttempts(itemId: string): Promise<AttemptDocument[]> {
    return this.find({ itemId }, { sort: { ts: -1 } });
  }

  async getModuleAttempts(module: "m1" | "m2" | "m3" | "m4", limit = 100): Promise<AttemptDocument[]> {
    return this.find({ module }, { sort: { ts: -1 }, limit });
  }
}

export function getAttemptRepository(userId: string): AttemptRepository {
  return new AttemptRepository(userId);
}
