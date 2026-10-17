import { M2Question } from "../question-schema";

export const DATABASE_QUESTIONS: M2Question[] = [
  // --- SQL ---
  {
    id: "m2-sql-001",
    skillId: "sql",
    topic: "isolation-levels",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "Under the SQL standard `READ COMMITTED` transaction isolation level, which concurrency anomaly can still occur?",
    options: [
      {
        id: "A",
        text: "Non-repeatable read (reading the same row twice within a transaction yields different values because another transaction committed an update in between).",
      },
      {
        id: "B",
        text: "Dirty read (reading uncommitted data written by a concurrent in-flight transaction).",
      },
      {
        id: "C",
        text: "Write skew under serializable snapshot isolation.",
      },
      {
        id: "D",
        text: "Automatic transaction abortion due to deadlock detection.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`READ COMMITTED` prevents dirty reads (you only see committed changes). However, if Transaction A reads row X, then Transaction B updates row X and commits, and Transaction A reads row X again, Transaction A will see the updated value — this is a non-repeatable (fuzzy) read. Preventing non-repeatable reads requires `REPEATABLE READ`.",
      whyWrong: {
        B: "Dirty reads are explicitly prevented by `READ COMMITTED`.",
        C: "Write skew is an anomaly specific to Snapshot Isolation when trying to emulate Serializable.",
        D: "Deadlocks are runtime locking collisions, not an ACID isolation phenomenon.",
      },
      interviewTakeaway:
        "Memorize the matrix: Read Uncommitted (dirty reads allowed), Read Committed (no dirty reads), Repeatable Read (no non-repeatable reads), Serializable (no phantom reads).",
    },
    tags: ["sql", "acid", "isolation-levels", "transactions"],
    sourceRefs: ["ANSI SQL Isolation Levels", "PostgreSQL Documentation: Transaction Isolation"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-sql-002",
    skillId: "sql",
    topic: "indexing-b-tree",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "A table has a composite B-Tree index on `(status, created_at, user_id)`. Which of the following queries CANNOT use this index effectively for index-range filtering?",
    options: [
      {
        id: "A",
        text: "`SELECT * FROM orders WHERE created_at > '2026-01-01' AND user_id = 42;`",
      },
      {
        id: "B",
        text: "`SELECT * FROM orders WHERE status = 'pending' AND created_at > '2026-01-01';`",
      },
      {
        id: "C",
        text: "`SELECT * FROM orders WHERE status = 'pending' AND created_at = '2026-01-01' AND user_id = 42;`",
      },
      {
        id: "D",
        text: "`SELECT * FROM orders WHERE status = 'completed';`",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Composite B-tree indexes obey the 'Leftmost Prefix' rule. Because the index is sorted primarily by `status`, any query that omits `status` cannot perform an efficient binary search on the index tree and will fall back to a full table scan or full index scan.",
      whyWrong: {
        B: "Uses the first two columns (`status`, `created_at`) from left to right, which fully leverages the index prefix.",
        C: "Uses all 3 columns with exact equality matches, allowing an O(log N) point lookup.",
        D: "Uses the leading leftmost column `status`, which can seek directly into the matching index range.",
      },
      interviewTakeaway:
        "Emphasize the Leftmost Prefix rule in system design and SQL interviews: composite index `(A, B, C)` helps queries filtering on `A`, `A,B`, and `A,B,C`, but is useless for queries filtering on `B` or `C` alone.",
    },
    tags: ["sql", "indexes", "b-tree", "query-optimization"],
    sourceRefs: ["Use The Index, Luke: Composite Indexes"],
    version: 1,
    status: "published",
  },

  // --- POSTGRESQL ---
  {
    id: "m2-postgres-001",
    skillId: "postgresql",
    topic: "mvcc-vacuum",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "In PostgreSQL's Multi-Version Concurrency Control (MVCC) architecture, what actually occurs when an `UPDATE` statement is executed on a row?",
    options: [
      {
        id: "A",
        text: "The existing row version (tuple) is marked as dead by setting its `xmax`, and a completely new tuple is inserted with a new `xmin`.",
      },
      {
        id: "B",
        text: "The existing disk block is modified in-place, and an undo log entry is appended to rollback segments.",
      },
      {
        id: "C",
        text: "Postgres acquires an exclusive table lock until all concurrent read transactions finish.",
      },
      {
        id: "D",
        text: "The row is moved into an in-memory WAL buffer and only written to disk upon server restart.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Postgres MVCC does not overwrite rows in-place or use rollback segments (unlike MySQL/InnoDB or Oracle). It writes a brand new row tuple and marks the old tuple with `xmax = current_tx_id`. Over time, dead tuples accumulate as table bloat, which `VACUUM` (or `autovacuum`) cleans up to reclaim disk space.",
      whyWrong: {
        B: "In-place modification with undo logs is how MySQL/InnoDB operates, not Postgres MVCC.",
        C: "Postgres uses row-level locking for updates; it does not take exclusive table locks.",
        D: "WAL buffers persist to disk on commit via fsync, not only on server restart.",
      },
      interviewTakeaway:
        "Understanding `xmin`/`xmax` and autovacuum tuning is critical for scaling PostgreSQL write-heavy workloads.",
    },
    tags: ["postgresql", "mvcc", "vacuum", "internals"],
    sourceRefs: ["PostgreSQL Internals: MVCC and Tuple Headers"],
    version: 1,
    status: "published",
  },

  // --- MONGODB ---
  {
    id: "m2-mongo-001",
    skillId: "mongodb",
    topic: "write-concern-atomicity",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 4,
    prompt:
      "In a MongoDB replica set with 3 data-bearing nodes, what does specifying `writeConcern: { w: 'majority', j: true }` guarantee?",
    options: [
      {
        id: "A",
        text: "The write has been committed to the in-memory engine and persisted to the on-disk journal on at least 2 nodes before returning success.",
      },
      {
        id: "B",
        text: "The write is replicated to all 3 nodes asynchronously without waiting for journal acknowledgment.",
      },
      {
        id: "C",
        text: "The write is executed inside a multi-document distributed two-phase commit transaction.",
      },
      {
        id: "D",
        text: "The primary node refuses future read operations until all secondary nodes confirm replication.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`w: 'majority'` ensures that more than half of the replica set members (in a 3-node cluster, at least 2 nodes: primary + 1 secondary) have acknowledged the write. `j: true` ensures that the write has been written to the on-disk journal on those nodes, preventing data loss if the primary crashes immediately after.",
      whyWrong: {
        B: "`w: 'majority'` explicitly waits for quorum acknowledgment; it is not fire-and-forget asynchronous replication.",
        C: "Write concern governs durability acknowledgment, not multi-document transaction semantics.",
        D: "Read availability is governed by `readPreference` and is never blocked by write concerns.",
      },
      interviewTakeaway:
        "In production distributed systems, pair `{ w: 'majority' }` with `readConcern: 'majority'` to guarantee linearizability and prevent dirty reads during primary failovers.",
    },
    tags: ["mongodb", "replica-sets", "write-concern", "durability"],
    sourceRefs: ["MongoDB Documentation: Write Concern"],
    version: 1,
    status: "published",
  },

  // --- REDIS ---
  {
    id: "m2-redis-001",
    skillId: "redis",
    topic: "eviction-data-structures",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "When using Redis as an LRU application cache with a fixed memory limit (`maxmemory`), what happens if memory reaches 100% under the `allkeys-lru` eviction policy?",
    options: [
      {
        id: "A",
        text: "Redis evicts the least recently used keys across the entire dataset to make room for new writes.",
      },
      {
        id: "B",
        text: "Redis returns an Out-Of-Memory error (`OOM command not allowed`) for all write commands.",
      },
      {
        id: "C",
        text: "Redis only evicts keys that have an explicit TTL (expiration) set.",
      },
      {
        id: "D",
        text: "Redis flushes the entire database to disk and resets RAM usage to zero.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Under `allkeys-lru`, Redis samples a subset of all keys and evicts the least recently accessed keys to maintain memory within `maxmemory`. In contrast, `volatile-lru` only evicts among keys with an expiration, and `noeviction` returns OOM errors on writes.",
      whyWrong: {
        B: "Returning OOM errors on writes is the behavior of the default `noeviction` policy, not `allkeys-lru`.",
        C: "Evicting only keys with explicit TTLs is the behavior of `volatile-lru`.",
        D: "Redis never wipes out the entire dataset automatically upon reaching maxmemory.",
      },
      interviewTakeaway:
        "For pure caching layers: choose `allkeys-lru` (or `allkeys-lfu`). For hybrid cache + persistent data: choose `volatile-lru` with TTLs on cache entries.",
    },
    tags: ["redis", "caching", "eviction-policies", "lru"],
    sourceRefs: ["Redis Documentation: Key eviction"],
    version: 1,
    status: "published",
  },
];
