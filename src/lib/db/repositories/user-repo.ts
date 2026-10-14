import { getDb } from "../client";
import { UserSchema, UserDocument } from "../schemas";
import { getMemoryStore } from "../repository";

export class UserRepository {
  private readonly collectionName = "users";

  private async getCollection() {
    const db = await getDb();
    return db.collection(this.collectionName);
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      const col = await this.getCollection();
      const doc = await col.findOne({ id });
      return doc ? UserSchema.parse(doc) : null;
    } catch {
      const store = getMemoryStore(this.collectionName);
      for (const item of store.values()) {
        if (item.id === id) return UserSchema.parse(item);
      }
      return null;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalized = email.toLowerCase().trim();
    try {
      const col = await this.getCollection();
      const doc = await col.findOne({ email: normalized });
      return doc ? UserSchema.parse(doc) : null;
    } catch {
      const store = getMemoryStore(this.collectionName);
      for (const item of store.values()) {
        if (
          typeof item.email === "string" &&
          item.email.toLowerCase() === normalized
        ) {
          return UserSchema.parse(item);
        }
      }
      return null;
    }
  }

  async create(user: UserDocument): Promise<UserDocument> {
    const validated = UserSchema.parse(user);
    try {
      const col = await this.getCollection();
      await col.insertOne(validated as unknown as Record<string, unknown>);
      return validated;
    } catch {
      const store = getMemoryStore(this.collectionName);
      store.set(validated.id, validated as unknown as Record<string, unknown>);
      return validated;
    }
  }

  async update(id: string, patch: Partial<Omit<UserDocument, "id">>): Promise<UserDocument | null> {
    try {
      const col = await this.getCollection();
      const res = await col.findOneAndUpdate(
        { id },
        { $set: patch },
        { returnDocument: "after" }
      );
      return res ? UserSchema.parse(res) : null;
    } catch {
      const store = getMemoryStore(this.collectionName);
      const existing = await this.findById(id);
      if (!existing) return null;
      const updated = UserSchema.parse({ ...existing, ...patch });
      store.set(id, updated);
      return updated;
    }
  }
}

let userRepoInstance: UserRepository | null = null;
export function getUserRepository(): UserRepository {
  if (!userRepoInstance) {
    userRepoInstance = new UserRepository();
  }
  return userRepoInstance;
}
