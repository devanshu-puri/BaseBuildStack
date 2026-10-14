import { getDb } from "@/lib/db/client";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp in ms
}

// In-memory fallback cache for development/tests/offline DB
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and increment rate limit for a given key.
 * Primary store: MongoDB `rate_limits` collection.
 * Fallback store: in-memory Map if DB is unreachable.
 */
export async function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    const db = await getDb();
    const collection = db.collection("rate_limits");

    // Atomic upsert & increment in MongoDB
    const doc = await collection.findOneAndUpdate(
      { key, resetAt: { $gt: new Date(now) } },
      {
        $inc: { count: 1 },
        $setOnInsert: { key, resetAt },
      },
      { upsert: true, returnDocument: "after" }
    );

    const count = doc?.count ?? 1;
    const remaining = Math.max(0, limit - count);
    const resetTime = doc?.resetAt ? new Date(doc.resetAt).getTime() : now + windowMs;

    return {
      success: count <= limit,
      limit,
      remaining,
      reset: resetTime,
    };
  } catch {
    // Graceful fallback to memoryStore if MongoDB is offline or in fast tests
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + windowMs,
      };
    }

    existing.count += 1;
    const remaining = Math.max(0, limit - existing.count);

    return {
      success: existing.count <= limit,
      limit,
      remaining,
      reset: existing.resetAt,
    };
  }
}

/**
 * Derives a reliable client key (IP or user ID) from request headers.
 */
export function getClientIdentifier(req: Request | Headers): string {
  const headers = req instanceof Request ? req.headers : req;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "127.0.0.1";
}
