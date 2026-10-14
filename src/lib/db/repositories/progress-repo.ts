import { UserScopedRepository } from "../repository";
import { ProgressSchema, ProgressDocument } from "../schemas";

export class ProgressRepository extends UserScopedRepository<ProgressDocument> {
  constructor(userId: string) {
    super("progress", userId, ProgressSchema);
  }

  async getProgress(
    module: "m1" | "m2" | "m3" | "m4",
    itemId: string
  ): Promise<ProgressDocument | null> {
    return this.findOne({ module, itemId });
  }

  async setProgress(
    module: "m1" | "m2" | "m3" | "m4",
    itemId: string,
    status: "todo" | "in_progress" | "completed",
    stage = 1
  ): Promise<ProgressDocument> {
    return this.upsert(
      { module, itemId },
      {
        module,
        itemId,
        status,
        stage,
        updatedAt: new Date(),
      }
    );
  }

  async getModuleProgress(module: "m1" | "m2" | "m3" | "m4"): Promise<ProgressDocument[]> {
    return this.find({ module });
  }

  async countCompleted(module?: "m1" | "m2" | "m3" | "m4"): Promise<number> {
    const filter = module ? { module, status: "completed" } : { status: "completed" };
    return this.count(filter);
  }
}

export function getProgressRepository(userId: string): ProgressRepository {
  return new ProgressRepository(userId);
}
