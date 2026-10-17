import { z } from "zod";
import type { DebugChallengeDocument } from "@/lib/db/schemas";

export const ClientDebugChallengeSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  difficulty: z.enum(["basic", "medium", "hard"]),
  scenario: z.string(),
  language: z.string(),
  code: z.string(),
  totalLines: z.number(),
  buggyLineCount: z.number(),
});

export type ClientDebugChallenge = z.infer<typeof ClientDebugChallengeSchema>;

export const DEBUG_CHALLENGES: DebugChallengeDocument[] = [
  // 1. React — Stale closure in useEffect interval
  {
    id: "debug-react-stale-closure-01",
    skillId: "react",
    difficulty: "basic",
    scenario: "Users report the auto-save counter resets to 1 after rapid consecutive saves instead of incrementing.",
    language: "typescript",
    code: `import React, { useState, useEffect } from "react";

export function AutoSaveMonitor({ isSaving }: { isSaving: boolean }) {
  const [saveCount, setSaveCount] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  useEffect(() => {
    if (!isSaving) return;

    const timer = setInterval(() => {
      // Periodic save increment
      setSaveCount(saveCount + 1);
      setLastSaved(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isSaving]);

  return (
    <div className="status-badge">
      <span>Saved: {saveCount} times</span>
      <small>Last: {lastSaved.toLocaleTimeString()}</small>
    </div>
  );
}`,
    buggyLines: [
      {
        line: 12,
        fix: "      setSaveCount((prev) => prev + 1);",
        explanation:
          "The effect closes over `saveCount` at the time the effect ran. Because `saveCount` is omitted from the dependency array, `saveCount` inside the setInterval callback remains frozen at its initial value (0), constantly setting state to 0 + 1 = 1.",
      },
    ],
    distractorNotes: {
      "4": "Component props are destructured properly with clean typing.",
      "5": "useState hooks are initialized with standard type parameters.",
      "8": "Early return guard when not saving is standard practice to avoid starting idle intervals.",
      "10": "setInterval is invoked with 1000ms duration, standard for periodic polling.",
      "16": "The cleanup function properly clears the interval on unmount or when `isSaving` changes.",
      "17": "Dependency array includes `isSaving`; omitting it would prevent cleanup on prop change.",
    },
    interviewTakeaway:
      "When using state inside long-lived callbacks (like timers or event listeners) without re-triggering the effect on every state change, always use the functional state updater form: `setCount(prev => prev + 1)` to avoid stale closure traps.",
    verified: true,
  },

  // 2. Node.js / Express — Uncaught Promise Rejection Crashing Process
  {
    id: "debug-express-async-01",
    skillId: "nodejs",
    difficulty: "medium",
    scenario: "The Node.js container process crashes completely whenever the database rejects a user lookup in this Express handler.",
    language: "typescript",
    code: `import express, { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";

const router = express.Router();

router.get("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  // Fetch user profile from database
  const user = await db.users.findUniqueOrThrow({ where: { id: userId } });
  
  if (!user.isActive) {
    return res.status(403).json({ error: "Account inactive" });
  }

  return res.json({ profile: user });
});

export default router;`,
    buggyLines: [
      {
        line: 6,
        fix: "router.get(\"/users/:id\", async (req: Request, res: Response, next: NextFunction) => {\n  try {",
        explanation:
          "In Express 4.x, route handlers that return a rejected Promise do NOT pass the error to `next(err)` automatically. An uncaught rejection triggers an unhandledRejection event and terminates the Node.js process unless wrapped in a try/catch or async handler wrapper.",
      },
    ],
    distractorNotes: {
      "7": "Accessing req.params.id is standard Express parameter extraction.",
      "8": "Validation guard returns 400 early, which safely handles missing parameters.",
      "12": "Calling findUniqueOrThrow throws an exception when the record is missing; throwing is intended DB behavior, but the route lacks error handling.",
      "14": "Checking boolean property isActive is idiomatic business logic.",
      "18": "res.json sends 200 status with JSON payload correctly.",
    },
    interviewTakeaway:
      "In Express 4.x, async handlers must explicitly catch errors and forward them via `next(err)`. Unhandled promise rejections crash production Node servers. (Express 5.x natively catches async errors, but legacy wrapper patterns remain standard in production codebases).",
    verified: true,
  },

  // 3. PostgreSQL — N+1 query loop causing massive latency spike
  {
    id: "debug-sql-nplus1-01",
    skillId: "postgresql",
    difficulty: "medium",
    scenario: "Endpoint response times degraded from 35ms to 3.2 seconds under 100 concurrent requests due to database connection pool starvation.",
    language: "typescript",
    code: `import { pool } from "./database";

export async function getTeamSummaries(organizationId: string) {
  // Step 1: Fetch all teams for the organization
  const teamsResult = await pool.query(
    "SELECT id, name, created_at FROM teams WHERE organization_id = $1",
    [organizationId]
  );
  const teams = teamsResult.rows;

  const summaries = [];
  for (const team of teams) {
    // Step 2: Fetch member count for each team
    const countRes = await pool.query(
      "SELECT COUNT(*) AS total FROM team_members WHERE team_id = $1",
      [team.id]
    );
    summaries.push({
      id: team.id,
      name: team.name,
      memberCount: parseInt(countRes.rows[0].total, 10),
    });
  }

  return summaries;
}`,
    buggyLines: [
      {
        line: 14,
        fix: "    // Avoid query inside loop: use JOIN or GROUP BY in single query",
        explanation:
          "Executing an individual `SELECT COUNT(*)` query inside a `for` loop produces the classic N+1 query problem. For 100 teams, this fires 101 separate round-trip queries over the network, exhausting the DB connection pool.",
      },
    ],
    distractorNotes: {
      "3": "Exporting an async function with string parameter is standard TypeScript.",
      "5": "Parameterized query with `$1` properly prevents SQL injection.",
      "9": "Extracting rows array from Postgres pg result is correct.",
      "11": "Creating an array accumulator for result mapping is normal syntax.",
      "21": "parseInt with radix 10 safely handles the string returned by Postgres COUNT(*).",
    },
    interviewTakeaway:
      "Avoid issuing queries inside loops. Replace N+1 queries with a single query using `LEFT JOIN` and `GROUP BY`, or batch-fetch with `WHERE team_id IN (...)` and map in memory.",
    verified: true,
  },

  // 4. Redis — Non-atomic check-then-set race condition
  {
    id: "debug-redis-race-01",
    skillId: "redis",
    difficulty: "hard",
    scenario: "Flash sale inventory goes negative under concurrent user checkout traffic despite the inventory check passing.",
    language: "typescript",
    code: `import { redis } from "../lib/redis";

export async function reserveInventory(itemId: string, requestedQty: number): Promise<boolean> {
  const stockKey = \`inventory:\${itemId}:stock\`;

  // Step 1: Read current remaining stock
  const currentStockStr = await redis.get(stockKey);
  const currentStock = currentStockStr ? parseInt(currentStockStr, 10) : 0;

  // Step 2: Check if sufficient stock remains
  if (currentStock >= requestedQty) {
    const updatedStock = currentStock - requestedQty;
    // Step 3: Write new stock back to cache
    await redis.set(stockKey, updatedStock.toString());
    return true;
  }

  return false;
}`,
    buggyLines: [
      {
        line: 14,
        fix: "    // Use Redis DECRBY or Lua script: const newStock = await redis.decrby(stockKey, requestedQty);",
        explanation:
          "This is a Time-of-Check to Time-of-Use (TOCTOU) race condition. Multiple concurrent requests read the same `currentStock` simultaneously, both pass the `if` check, and both set the decremented value, overselling the inventory into negative numbers.",
      },
    ],
    distractorNotes: {
      "3": "Async function returning a Promise<boolean> is standard.",
      "4": "Namespaced key string template is standard Redis key hygiene.",
      "7": "redis.get returns a string or null from Redis.",
      "8": "Ternary parser with fallback to 0 handles missing keys safely.",
      "11": "Guard checking if requested quantity is <= current stock is logically sound for single-threaded code.",
      "18": "Returns false when stock is insufficient.",
    },
    interviewTakeaway:
      "Redis commands are single-threaded and atomic individually, but multiple separate GET and SET commands are NOT atomic together. Use atomic operations like `DECRBY` or run a Lua script via `EVAL` so the check and decrement execute atomically.",
    verified: true,
  },

  // 5. Docker — Bad layer caching ordering
  {
    id: "debug-docker-layer-01",
    skillId: "docker",
    difficulty: "basic",
    scenario: "CI Docker image build takes 8 minutes on every single commit even when only a markdown or CSS file changed.",
    language: "dockerfile",
    code: `FROM node:20-alpine AS builder
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy application source
COPY . .

# Install dependencies and build
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]`,
    buggyLines: [
      {
        line: 8,
        fix: "COPY package*.json ./\nRUN npm ci\nCOPY . .",
        explanation:
          "Placing `COPY . .` before `RUN npm ci` invalidates Docker's build layer cache whenever any source file changes. This forces `npm ci` to download all node_modules from scratch on every build.",
      },
    ],
    distractorNotes: {
      "1": "Using specific alpine base image with multi-stage build is recommended practice.",
      "2": "Setting WORKDIR to /app creates an isolated workspace directory.",
      "5": "Installing libc6-compat is standard for Node alpine builds running native bindings.",
      "11": "Running `npm ci` ensures clean, reproducible dependency installation from lockfile.",
      "14": "Multi-stage runner image minimizes final container size.",
      "22": "CMD initiates the standalone server binary in non-daemon mode.",
    },
    interviewTakeaway:
      "Docker builds execute layers in order and invalidate cache at the first modified layer. Always copy package manifests (`package.json`, `package-lock.json`) and run dependency installs BEFORE copying the rest of the application source code.",
    verified: true,
  },

  // 6. Python — Using Threading for CPU-Bound Task (GIL Bottleneck)
  {
    id: "debug-python-gil-01",
    skillId: "python",
    difficulty: "medium",
    scenario: "Worker throughput drops and CPU execution time doubles when scaling from 1 thread to 8 threads on a high-core compute node.",
    language: "python",
    code: `import hashlib
from concurrent.futures import ThreadPoolExecutor
from typing import List

def compute_heavy_hash(data_chunk: bytes) -> str:
    # CPU intensive cryptographic iteration
    result = data_chunk
    for _ in range(500_000):
        result = hashlib.sha256(result).digest()
    return result.hex()

def process_batch(chunks: List[bytes]) -> List[str]:
    # Parallel processing of batch chunks
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(compute_heavy_hash, chunks))
    return results`,
    buggyLines: [
      {
        line: 14,
        fix: "    with ProcessPoolExecutor(max_workers=8) as executor:",
        explanation:
          "In CPython, the Global Interpreter Lock (GIL) prevents multiple threads from executing Python bytecode in parallel. For CPU-bound tasks, `ThreadPoolExecutor` causes intense GIL contention and thread context-switching overhead, running slower than a single thread. CPU-bound work requires `ProcessPoolExecutor`.",
      },
    ],
    distractorNotes: {
      "1": "hashlib provides efficient native implementations of hashing algorithms.",
      "5": "compute_heavy_hash has clean type annotations and deterministic output.",
      "8": "Range loop simulates required cryptographic proof-of-work rounds.",
      "10": "digest().hex() formats binary hash bytes into standard hexadecimal representation.",
      "12": "Type hints List[bytes] -> List[str] are idiomatic Python 3.",
    },
    interviewTakeaway:
      "Python's GIL restricts Python bytecode execution to a single thread at a time. Use threads for I/O-bound operations (network, disk) where threads release the GIL while waiting. Use multiprocessing (`ProcessPoolExecutor`) for CPU-bound computations.",
    verified: true,
  },

  // 7. TypeScript — Null typeof Check Bug
  {
    id: "debug-ts-narrowing-01",
    skillId: "typescript",
    difficulty: "basic",
    scenario: "API webhook parser throws unhandled TypeError: Cannot read properties of null (reading 'id') when receiving empty payloads.",
    language: "typescript",
    code: `interface WebhookPayload {
  id: string;
  event: string;
  data: Record<string, unknown>;
}

export function parseIncomingWebhook(rawPayload: unknown): WebhookPayload {
  // Guard check: ensure payload is an object
  if (typeof rawPayload !== "object") {
    throw new Error("Invalid payload: must be an object");
  }

  // Extract ID from verified object
  const payloadId = (rawPayload as any).id;
  if (!payloadId || typeof payloadId !== "string") {
    throw new Error("Missing or invalid payload ID");
  }

  return rawPayload as WebhookPayload;
}`,
    buggyLines: [
      {
        line: 9,
        fix: "  if (typeof rawPayload !== \"object\" || rawPayload === null) {",
        explanation:
          "In JavaScript and TypeScript, `typeof null === 'object'`. Checking only `typeof rawPayload !== 'object'` allows `null` to pass through into the code below, where accessing `rawPayload.id` throws a runtime TypeError.",
      },
    ],
    distractorNotes: {
      "1": "Interface definition with typed properties is correct.",
      "7": "unknown type input is the safest parameter type for unverified input.",
      "14": "Accessing property on casted object is common in boundary parser functions.",
      "15": "Checking for missing or non-string payloadId prevents malformed events.",
      "19": "Returning parsed object satisfies return signature.",
    },
    interviewTakeaway:
      "One of JavaScript's oldest historical quirks is that `typeof null === 'object'`. When narrowing object types at runtime, always check `val !== null && typeof val === 'object'` or use a schema validator like Zod.",
    verified: true,
  },

  // 8. Node.js — Buffer Allocation Memory Leak (Streams vs Buffers)
  {
    id: "debug-node-stream-leak-01",
    skillId: "nodejs",
    difficulty: "hard",
    scenario: "Export microservice crashes with 'JavaScript heap out of memory' when three concurrent users download their 1.8GB archive.",
    language: "typescript",
    code: `import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const app = express();

app.get("/export/:archiveId", (req: Request, res: Response) => {
  const archivePath = path.join("/var/data/exports", \`\${req.params.archiveId}.tar.gz\`);

  if (!fs.existsSync(archivePath)) {
    return res.status(404).send("Archive not found");
  }

  // Read archive file and send to client
  const fileBuffer = fs.readFileSync(archivePath);

  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", \`attachment; filename=\${req.params.archiveId}.tar.gz\`);
  return res.send(fileBuffer);
});`,
    buggyLines: [
      {
        line: 15,
        fix: "  const readStream = fs.createReadStream(archivePath);\n  return readStream.pipe(res);",
        explanation:
          "`fs.readFileSync` loads the entire 1.8GB file into Node's V8 memory heap at once. Multiple simultaneous downloads exceed the default V8 heap limit (~2GB-4GB), causing the process to crash with Out-Of-Memory (OOM). Streams pipe chunks without holding the full file in RAM.",
      },
    ],
    distractorNotes: {
      "7": "Express route parameter definition is standard.",
      "8": "path.join constructs clean paths across OS environments.",
      "10": "existsSync checks whether the target file is present on the filesystem.",
      "17": "Setting Content-Type application/gzip informs the browser of the binary archive MIME type.",
      "18": "Content-Disposition attachment header triggers native browser file download dialogue.",
    },
    interviewTakeaway:
      "Never buffer large or unbounded files into memory with `fs.readFile`. Always use streams (`fs.createReadStream().pipe(res)`) to process data chunk-by-chunk with constant O(1) memory footprint and backpressure management.",
    verified: true,
  },

  // 9. Next.js — Server Action Insecure Direct Object Reference (IDOR)
  {
    id: "debug-nextjs-server-action-01",
    skillId: "nextjs",
    difficulty: "medium",
    scenario: "Security pentest discovered any authenticated user can alter another user's email address by tampering with the payload.",
    language: "typescript",
    code: `"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateUserEmail(formData: { userId: string; newEmail: string }) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Update target user's email address in database
  await db.user.update({
    where: { id: formData.userId },
    data: { email: formData.newEmail },
  });

  revalidatePath("/settings/account");
  return { success: true };
}`,
    buggyLines: [
      {
        line: 15,
        fix: "    where: { id: session.user.id }, // Must use authenticated session ID, NOT client formData",
        explanation:
          "The Server Action authenticates that *a* user is logged in, but uses `formData.userId` from client input to find the record to update. An attacker can send another user's ID and overwrite their email, causing an Insecure Direct Object Reference (IDOR) vulnerability.",
      },
    ],
    distractorNotes: {
      "1": "\"use server\" directive marks functions in the file as Server Actions.",
      "7": "Typed parameter interface formData is cleanly typed.",
      "8": "Calling auth() retrieves verified server-side session token.",
      "9": "Authentication check correctly denies unauthenticated guests.",
      "19": "revalidatePath clears the Next.js router cache for the updated page.",
    },
    interviewTakeaway:
      "Authentication is not authorization. In Server Actions and API routes, never trust client-provided user IDs. Always bind mutations to the authenticated user ID extracted directly from the verified session: `where: { id: session.user.id }`.",
    verified: true,
  },

  // 10. MongoDB — Missing Index on Sort Field Causing Memory Limit Crash
  {
    id: "debug-mongodb-unindexed-sort-01",
    skillId: "mongodb",
    difficulty: "medium",
    scenario: "Customer dashboard crashes in production with: 'Executor error during query: Sort exceeded memory limit of 33554432 bytes'.",
    language: "typescript",
    code: `import { MongoClient } from "mongodb";

export async function getTenantAuditLogs(
  client: MongoClient,
  tenantId: string,
  limit: number = 50
) {
  const db = client.db("platform");
  const collection = db.collection("audit_logs");

  // Query: filter by tenant and sort chronologically
  // Note: Only index on collection is: { tenantId: 1 }
  const cursor = collection
    .find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(limit);

  const logs = await cursor.toArray();
  return logs;
}`,
    buggyLines: [
      {
        line: 14,
        fix: "    // Create compound index: db.collection(\"audit_logs\").createIndex({ tenantId: 1, createdAt: -1 })",
        explanation:
          "MongoDB has an existing index on `{ tenantId: 1 }`, but no index covering `{ createdAt: -1 }`. When filtering by tenantId, MongoDB must load all matched documents into memory and sort them in RAM. When tenant records exceed 32MB, MongoDB aborts with a memory limit failure. A compound index `{ tenantId: 1, createdAt: -1 }` is required.",
      },
    ],
    distractorNotes: {
      "1": "Importing MongoClient is standard for native MongoDB driver.",
      "7": "Default limit parameter guards against unbound queries.",
      "8": "client.db() accesses the database handle efficiently.",
      "13": "Filtering by tenantId ensures multitenant data isolation.",
      "15": "Applying limit after sort is standard cursor chaining in Mongo.",
      "17": "toArray() converts cursor to array for return.",
    },
    interviewTakeaway:
      "MongoDB limits in-memory blocking sorts to 32MB. If you filter by field A and sort by field B, a single-field index on A is not sufficient for large collections. You must create a compound index `{ A: 1, B: -1 }` to allow the query engine to perform an index-supported sort.",
    verified: true,
  },
];

/**
 * Strips confidential solution details from a challenge before sending to client.
 */
export function sanitizeDebugChallenge(challenge: DebugChallengeDocument): ClientDebugChallenge {
  const lines = challenge.code.trim().split("\n");
  return {
    id: challenge.id,
    skillId: challenge.skillId,
    difficulty: challenge.difficulty,
    scenario: challenge.scenario,
    language: challenge.language,
    code: challenge.code,
    totalLines: lines.length,
    buggyLineCount: challenge.buggyLines.length,
  };
}
