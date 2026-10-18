import { UserScopedRepository } from "../repository";
import { StreakSchema, StreakDocument } from "../schemas";

function formatDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayKey(d: Date): string {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  return formatDateKey(prev);
}

export class StreakRepository extends UserScopedRepository<StreakDocument> {
  constructor(userId: string) {
    super("streaks", userId, StreakSchema);
  }

  async getStreak(now: Date = new Date()): Promise<StreakDocument> {
    const existing = await this.findOne();
    if (!existing || !existing.lastDay) {
      return {
        userId: this.userId,
        current: 0,
        longest: 0,
        lastDay: "",
      };
    }

    const today = formatDateKey(now);
    const yesterday = getYesterdayKey(now);

    // If last active day is neither today nor yesterday, the streak is broken and resets to 0!
    if (existing.lastDay !== today && existing.lastDay !== yesterday) {
      const resetDoc: StreakDocument = { ...existing, current: 0 };
      await this.upsert({}, resetDoc);
      return resetDoc;
    }

    return existing;
  }

  async recordActivity(now: Date = new Date()): Promise<StreakDocument> {
    const today = formatDateKey(now);
    const yesterday = getYesterdayKey(now);
    const existing = await this.findOne();

    if (!existing || !existing.lastDay) {
      const created: StreakDocument = {
        userId: this.userId,
        current: 1,
        longest: 1,
        lastDay: today,
      };
      return this.upsert({}, created);
    }

    if (existing.lastDay === today) {
      // Already recorded today, streak unchanged
      return existing;
    }

    let newCurrent = 1;
    if (existing.lastDay === yesterday) {
      newCurrent = existing.current + 1;
    }

    const newLongest = Math.max(existing.longest, newCurrent);

    return this.upsert(
      {},
      {
        current: newCurrent,
        longest: newLongest,
        lastDay: today,
      }
    );
  }
}

export function getStreakRepository(userId: string): StreakRepository {
  return new StreakRepository(userId);
}
