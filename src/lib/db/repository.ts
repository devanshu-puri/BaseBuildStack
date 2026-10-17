import { Collection, Filter, Document, FindOptions } from "mongodb";
import { getDb } from "./client";
import { ZodType } from "zod";

// Shared in-memory fallback stores for offline/test environments
const memoryStores = new Map<string, Map<string, Record<string, unknown>>>();

export function getMemoryStore(collectionName: string): Map<string, Record<string, unknown>> {
  if (!memoryStores.has(collectionName)) {
    memoryStores.set(collectionName, new Map<string, Record<string, unknown>>());
  }
  return memoryStores.get(collectionName)!;
}

export function clearMemoryStoresForTest(): void {
  memoryStores.clear();
}

export class UserScopedRepository<T extends { userId: string }> {
  readonly collectionName: string;
  readonly userId: string;
  readonly schema: ZodType<T>;

  constructor(collectionName: string, userId: string, schema: ZodType<T>) {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new Error(`UserScopedRepository[${collectionName}] requires a valid non-empty userId`);
    }
    this.collectionName = collectionName;
    this.userId = userId;
    this.schema = schema;
  }

  protected async getCollection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection(this.collectionName);
  }

  /**
   * Find documents strictly scoped to this instance's userId.
   */
  async find(filter: Filter<Document> = {}, options?: FindOptions): Promise<T[]> {
    const scopedFilter = { ...filter, userId: this.userId };

    try {
      const col = await this.getCollection();
      const docs = await col.find(scopedFilter, options).toArray();
      return docs.map((d) => this.schema.parse(d));
    } catch {
      // Memory fallback for tests / offline
      const store = getMemoryStore(this.collectionName);
      let results: Record<string, unknown>[] = [];
      for (const item of store.values()) {
        if (item.userId === this.userId) {
          let match = true;
          for (const [k, v] of Object.entries(scopedFilter)) {
            if (item[k] !== v) match = false;
          }
          if (match) results.push({ ...item });
        }
      }

      // Handle simple sorting in-memory
      if (options?.sort && typeof options.sort === "object") {
        const sortEntries = Object.entries(options.sort);
        results.sort((a, b) => {
          for (const [key, dir] of sortEntries) {
            const va = a[key];
            const vb = b[key];
            if (va !== vb) {
              const order = Number(dir) >= 0 ? 1 : -1;
              return (va as number | string) > (vb as number | string) ? order : -order;
            }
          }
          return 0;
        });
      }

      if (options?.skip) {
        results = results.slice(options.skip);
      }
      if (typeof options?.limit === "number") {
        results = results.slice(0, options.limit);
      }

      return results.map((d) => this.schema.parse(d));
    }
  }

  /**
   * Find single document strictly scoped to this instance's userId.
   */
  async findOne(filter: Filter<Document> = {}): Promise<T | null> {
    const scopedFilter = { ...filter, userId: this.userId };

    try {
      const col = await this.getCollection();
      const doc = await col.findOne(scopedFilter);
      return doc ? this.schema.parse(doc) : null;
    } catch {
      const store = getMemoryStore(this.collectionName);
      for (const item of store.values()) {
        if (item.userId === this.userId) {
          let match = true;
          for (const [k, v] of Object.entries(scopedFilter)) {
            if (item[k] !== v) match = false;
          }
          if (match) return this.schema.parse(item);
        }
      }
      return null;
    }
  }

  /**
   * Create new document strictly injecting this instance's userId.
   */
  async create(data: Omit<T, "userId"> | T): Promise<T> {
    const docToInsert = {
      ...data,
      userId: this.userId,
    } as unknown as T;

    // Strict boundary validation
    const validated = this.schema.parse(docToInsert);

    try {
      const col = await this.getCollection();
      await col.insertOne(validated as unknown as Document);
      return validated;
    } catch {
      const store = getMemoryStore(this.collectionName);
      const key = `${this.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      store.set(key, validated as unknown as Record<string, unknown>);
      return validated;
    }
  }

  /**
   * Upsert document scoped to this instance's userId.
   */
  async upsert(filter: Filter<Document>, update: Partial<T>): Promise<T> {
    const scopedFilter = { ...filter, userId: this.userId };
    const docToUpdate = { ...update, userId: this.userId };

    try {
      const col = await this.getCollection();
      const result = await col.findOneAndUpdate(
        scopedFilter,
        { $set: docToUpdate },
        { upsert: true, returnDocument: "after" }
      );
      return this.schema.parse(result);
    } catch {
      const store = getMemoryStore(this.collectionName);
      let foundKey: string | null = null;
      let existing: Record<string, unknown> | null = null;

      for (const [k, item] of store.entries()) {
        if (item.userId === this.userId) {
          let match = true;
          for (const [fKey, fVal] of Object.entries(scopedFilter)) {
            if (item[fKey] !== fVal) match = false;
          }
          if (match) {
            foundKey = k;
            existing = item;
            break;
          }
        }
      }

      const base = existing || { ...filter, userId: this.userId };
      const merged = this.schema.parse({ ...base, ...docToUpdate });
      const storeKey = foundKey || `${this.userId}_${JSON.stringify(filter)}`;
      store.set(storeKey, merged as unknown as Record<string, unknown>);
      return merged;
    }
  }

  /**
   * Delete document scoped strictly to this instance's userId.
   */
  async deleteOne(filter: Filter<Document>): Promise<boolean> {
    const scopedFilter = { ...filter, userId: this.userId };

    try {
      const col = await this.getCollection();
      const result = await col.deleteOne(scopedFilter);
      return result.deletedCount > 0;
    } catch {
      const store = getMemoryStore(this.collectionName);
      for (const [k, item] of store.entries()) {
        if (item.userId === this.userId) {
          let match = true;
          for (const [key, val] of Object.entries(scopedFilter)) {
            if (item[key] !== val) match = false;
          }
          if (match) {
            store.delete(k);
            return true;
          }
        }
      }
      return false;
    }
  }

  /**
   * Delete multiple documents scoped strictly to this instance's userId.
   */
  async deleteMany(filter: Filter<Document> = {}): Promise<number> {
    const scopedFilter = { ...filter, userId: this.userId };

    try {
      const col = await this.getCollection();
      const result = await col.deleteMany(scopedFilter);
      return result.deletedCount;
    } catch {
      const store = getMemoryStore(this.collectionName);
      let count = 0;
      for (const [k, item] of Array.from(store.entries())) {
        if (item.userId === this.userId) {
          let match = true;
          for (const [key, val] of Object.entries(scopedFilter)) {
            if (item[key] !== val) match = false;
          }
          if (match) {
            store.delete(k);
            count++;
          }
        }
      }
      return count;
    }
  }

  /**
   * Count documents scoped strictly to this instance's userId.
   */
  async count(filter: Filter<Document> = {}): Promise<number> {
    const scopedFilter = { ...filter, userId: this.userId };

    try {
      const col = await this.getCollection();
      return await col.countDocuments(scopedFilter);
    } catch {
      const docs = await this.find(filter);
      return docs.length;
    }
  }
}
