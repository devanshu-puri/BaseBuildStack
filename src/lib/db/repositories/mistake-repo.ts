import { UserScopedRepository } from "../repository";
import { MistakeSchema, MistakeDocument } from "../schemas";

export class MistakeRepository extends UserScopedRepository<MistakeDocument> {
  constructor(userId: string) {
    super("mistakes", userId, MistakeSchema);
  }

  async recordMistake(
    source: "m1" | "m2" | "m3" | "m4",
    itemId: string,
    reason: string
  ): Promise<MistakeDocument> {
    const existing = await this.findOne({ itemId });
    const retries = existing ? existing.retries + 1 : 0;

    return this.upsert(
      { itemId },
      {
        source,
        itemId,
        reason,
        retries,
        lastSeen: new Date(),
      }
    );
  }

  async getMistakes(source?: "m1" | "m2" | "m3" | "m4"): Promise<MistakeDocument[]> {
    const filter = source ? { source } : {};
    return this.find(filter, { sort: { lastSeen: -1 } });
  }

  async resolveMistake(itemId: string): Promise<boolean> {
    return this.deleteOne({ itemId });
  }
}

export function getMistakeRepository(userId: string): MistakeRepository {
  return new MistakeRepository(userId);
}
