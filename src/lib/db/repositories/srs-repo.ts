import { UserScopedRepository } from "../repository";
import { SrsCardSchema, SrsCardDocument } from "../schemas";

export class SrsRepository extends UserScopedRepository<SrsCardDocument> {
  constructor(userId: string) {
    super("srs_cards", userId, SrsCardSchema);
  }

  async getCard(itemId: string): Promise<SrsCardDocument | null> {
    return this.findOne({ itemId });
  }

  async getDueCards(referenceDate: Date = new Date()): Promise<SrsCardDocument[]> {
    try {
      const col = await this.getCollection();
      const docs = await col
        .find({ userId: this.userId, due: { $lte: referenceDate } })
        .sort({ due: 1 })
        .toArray();
      return docs.map((d) => this.schema.parse(d));
    } catch {
      // In-memory fallback
      const cards = await this.find();
      return cards
        .filter((c) => new Date(c.due).getTime() <= referenceDate.getTime())
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
    }
  }

  async upsertCard(data: {
    itemId: string;
    ease: number;
    interval: number;
    due: Date;
    repetitions: number;
  }): Promise<SrsCardDocument> {
    return this.upsert(
      { itemId: data.itemId },
      {
        itemId: data.itemId,
        ease: data.ease,
        interval: data.interval,
        due: data.due,
        repetitions: data.repetitions,
      }
    );
  }
}

export function getSrsRepository(userId: string): SrsRepository {
  return new SrsRepository(userId);
}
