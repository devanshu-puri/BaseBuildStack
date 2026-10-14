import { UserScopedRepository } from "../repository";
import { BookmarkSchema, BookmarkDocument } from "../schemas";

export class BookmarkRepository extends UserScopedRepository<BookmarkDocument> {
  constructor(userId: string) {
    super("bookmarks", userId, BookmarkSchema);
  }

  async isBookmarked(module: "m1" | "m2" | "m3" | "m4", itemId: string): Promise<boolean> {
    const found = await this.findOne({ module, itemId });
    return found !== null;
  }

  async toggleBookmark(
    module: "m1" | "m2" | "m3" | "m4",
    itemId: string,
    title?: string
  ): Promise<{ bookmarked: boolean }> {
    const existing = await this.findOne({ module, itemId });
    if (existing) {
      await this.deleteOne({ module, itemId });
      return { bookmarked: false };
    } else {
      await this.create({
        userId: this.userId,
        module,
        itemId,
        title,
        ts: new Date(),
      });
      return { bookmarked: true };
    }
  }

  async getBookmarks(module?: "m1" | "m2" | "m3" | "m4"): Promise<BookmarkDocument[]> {
    const filter = module ? { module } : {};
    return this.find(filter, { sort: { ts: -1 } });
  }

  async removeBookmark(module: "m1" | "m2" | "m3" | "m4", itemId: string): Promise<boolean> {
    return this.deleteOne({ module, itemId });
  }
}

export function getBookmarkRepository(userId: string): BookmarkRepository {
  return new BookmarkRepository(userId);
}
