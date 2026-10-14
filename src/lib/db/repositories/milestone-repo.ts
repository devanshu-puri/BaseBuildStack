import { UserScopedRepository } from "../repository";
import { MilestoneSchema, MilestoneDocument } from "../schemas";

export class MilestoneRepository extends UserScopedRepository<MilestoneDocument> {
  constructor(userId: string) {
    super("milestones", userId, MilestoneSchema);
  }

  async getMilestones(): Promise<MilestoneDocument[]> {
    return this.find();
  }

  async getMilestone(key: string): Promise<MilestoneDocument | null> {
    return this.findOne({ key });
  }

  async updateMilestone(
    key: string,
    progress: number,
    total: number
  ): Promise<MilestoneDocument> {
    const existing = await this.findOne({ key });
    const clampedProgress = Math.min(progress, total);
    const isNowUnlocked = clampedProgress >= total;
    const unlockedAt = isNowUnlocked
      ? existing?.unlockedAt ?? new Date()
      : null;

    return this.upsert(
      { key },
      {
        key,
        progress: clampedProgress,
        total,
        unlockedAt,
      }
    );
  }
}

export function getMilestoneRepository(userId: string): MilestoneRepository {
  return new MilestoneRepository(userId);
}
