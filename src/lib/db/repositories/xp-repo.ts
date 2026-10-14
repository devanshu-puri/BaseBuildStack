import { UserScopedRepository } from "../repository";
import { XpEventSchema, XpEventDocument } from "../schemas";

export class XpRepository extends UserScopedRepository<XpEventDocument> {
  constructor(userId: string) {
    super("xp_events", userId, XpEventSchema);
  }

  /**
   * Idempotent XP awarding.
   * If an event with the same { userId, type, refId } already exists, no XP is added.
   */
  async awardXp(
    type: string,
    amount: number,
    refId: string
  ): Promise<{ added: boolean; event: XpEventDocument; totalXp: number }> {
    const existing = await this.findOne({ type, refId });
    if (existing) {
      const totalXp = await this.getTotalXp();
      return { added: false, event: existing, totalXp };
    }

    const event = await this.create({
      userId: this.userId,
      type,
      amount,
      refId,
      ts: new Date(),
    });

    const totalXp = await this.getTotalXp();
    return { added: true, event, totalXp };
  }

  async getTotalXp(): Promise<number> {
    const events = await this.find();
    return events.reduce((sum, e) => sum + e.amount, 0);
  }

  async getRecentEvents(limit = 20): Promise<XpEventDocument[]> {
    return this.find({}, { sort: { ts: -1 }, limit });
  }
}

export function getXpRepository(userId: string): XpRepository {
  return new XpRepository(userId);
}
