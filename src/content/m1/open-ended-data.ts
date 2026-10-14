import { OpenEndedDrill } from "./open-ended-schema";

export const OPEN_ENDED_DRILLS: OpenEndedDrill[] = [
  // 1. Distributed Rate Limiter
  {
    id: "drill_rate_limiter_1",
    title: "Distributed API Rate Limiter at Scale",
    category: "System Design",
    difficulty: "medium",
    vagueScenario:
      "Design a rate limiter for a public developer platform serving 10,000 requests per second. Each client API key is allowed at most 100 requests per minute with low latency (<5ms) overhead.",
    phase1Constraints: {
      prompt: "Estimate the primary storage and network throughput requirements for 10,000 QPS with 100,000 active API keys.",
      mcqOptions: [
        "Memory footprint: ~5-10 MB; Read/Write throughput: ~10,000 QPS with atomic increments",
        "Storage footprint: ~50 GB in relational tables; ~100 QPS read throughput",
        "Memory footprint: ~2 TB in disk-backed cache; write-heavy batching every 10 seconds",
        "Storage footprint: ~500 MB in cold blob storage; synchronous disk flushes",
      ],
      correctIndex: 0,
      explanation:
        "100,000 keys with a 64-byte token state (timestamp + token count) requires under 10 MB of memory. The bottleneck is the high rate of atomic counter updates (10k QPS) needing sub-millisecond in-memory access.",
    },
    phase2Primitives: {
      prompt: "Which data architecture and primitive best handles 10,000 atomic counter operations per second across multiple regional proxy gateways?",
      mcqOptions: [
        "Centralized Redis Cluster running a Lua script for atomic Token Bucket checks",
        "Relational MySQL table with 'SELECT ... FOR UPDATE' row-level locking",
        "In-memory Node.js process state replicated via weekly database dump",
        "Kafka topic partitioning with consumers updating a write-ahead log",
      ],
      correctIndex: 0,
      explanation:
        "Redis provides single-threaded atomic execution of Lua scripts (Token Bucket / Sliding Window Log) with sub-millisecond latencies, perfectly matching 10,000 QPS requirements without database lock contention.",
    },
    phase3Branches: [
      {
        phase2ChoiceIndex: 0,
        interviewerChallenge:
          "Interviewer Pushback: 'If your centralized Redis cluster experiences network latency or a temporary partition from the API gateway, every single API request will either time out or get blocked. How do you defend against this single point of failure without blowing up memory?'",
        mcqOptions: [
          "Deploy local in-process token buckets (token rationing) with fallback fail-open policies during Redis unavailability",
          "Route all failed requests to a relational database cluster with synchronous ACID transactions",
          "Reject all incoming user requests with HTTP 500 until Redis recovers completely",
          "Spin up a duplicate Redis cluster and run 2-phase commit on every single HTTP request",
        ],
        correctIndex: 0,
        explanation:
          "Token rationing allows each gateway instance to handle a local slice of tokens in-memory. If Redis is unreachable, failing open or relying on local memory keeps client traffic flowing while avoiding cascading failures.",
      },
      {
        phase2ChoiceIndex: 1,
        interviewerChallenge:
          "Interviewer Pushback: 'At 10,000 QPS, row-level locks in a relational database will cause severe thread exhaustion, deadlocks, and connection pooling collapse. How would you resolve this bottleneck?'",
        mcqOptions: [
          "Replace DB row locks with an in-memory cache layer (like Redis) and atomic Lua scripts",
          "Increase MySQL connection limit to 50,000 connections",
          "Disable all database indexes to speed up write throughput",
          "Retry failed transactions in an unbounded while loop",
        ],
        correctIndex: 0,
        explanation:
          "Row-level locking is fundamentally unsuited for 10k QPS atomic rate limiting. Migrating to an in-memory cache with atomic operations eliminates lock contention.",
      },
      {
        phase2ChoiceIndex: 2,
        interviewerChallenge:
          "Interviewer Pushback: 'With multiple stateless API gateway pods, in-memory Node.js state is not shared. A client can make 100 requests to Pod A and 100 requests to Pod B, bypassing the rate limit completely. How do you fix this?'",
        mcqOptions: [
          "Introduce a shared in-memory state layer (Redis cluster) or sticky IP hashing across gateways",
          "Run only a single monolithic gateway instance without load balancing",
          "Allow clients to exceed their quotas whenever multiple pods exist",
          "Use a browser cookie to store the client's remaining token count",
        ],
        correctIndex: 0,
        explanation:
          "Stateless gateways require either a shared backing datastore or coordinated token synchronization across pods.",
      },
      {
        phase2ChoiceIndex: 3,
        interviewerChallenge:
          "Interviewer Pushback: 'Kafka is an asynchronous event stream. Rate limiting requires an immediate synchronous YES/NO verdict in under 5ms before serving the API response. How do you address this fundamental latency mismatch?'",
        mcqOptions: [
          "Use synchronous in-memory caching (Redis) for real-time decisions, and stream rate-limit audit logs to Kafka asynchronously",
          "Force HTTP clients to wait 5 seconds for Kafka consumer group poll cycles",
          "Execute Kafka consumer commits synchronously on every incoming TCP packet",
          "Replace HTTP REST with physical mail deliveries",
        ],
        correctIndex: 0,
        explanation:
          "Rate limit decisions require immediate synchronous response; Kafka is ideal for asynchronous analytics/auditing, not sub-5ms request gating.",
      },
    ],
    rubric: [
      {
        name: "Scale & Latency Awareness",
        weight: 0.35,
        description: "Recognizes sub-5ms latency requirements and the need for in-memory atomic operations over disk-bound databases.",
        keywords: ["latency", "in-memory", "atomic", "redis", "sub-millisecond", "memory"],
      },
      {
        name: "Resilience & Fallback Strategy",
        weight: 0.35,
        description: "Articulates failure modes (fail-open vs fail-closed, token rationing, circuit breaker) when the central store is degraded.",
        keywords: ["fail-open", "fallback", "rationing", "circuit breaker", "partition", "local"],
      },
      {
        name: "Algorithm Selection & Invariants",
        weight: 0.30,
        description: "Understands sliding window log vs token bucket trade-offs regarding memory overhead and burst smoothing.",
        keywords: ["token bucket", "sliding window", "burst", "lua", "counter"],
      },
    ],
    canonicalTakeaway:
      "For distributed rate limiting at 10k+ QPS, use Redis with atomic Lua scripts as the primary engine, paired with local in-process token rationing and fail-open circuit breakers to prevent a centralized cache outage from bringing down the entire platform.",
  },

  // 2. High-Throughput URL Shortener
  {
    id: "drill_url_shortener_1",
    title: "High-Throughput URL Shortener (100:1 Read/Write)",
    category: "System Design",
    difficulty: "medium",
    vagueScenario:
      "Design a URL shortener service handling 100 million new URLs created per month, with a 100:1 read-to-write ratio (10 billion redirects/month). Redirection latency must be under 20ms globally.",
    phase1Constraints: {
      prompt: "Calculate the write QPS, read QPS, and 5-year storage capacity required for 100M new URLs/month with a 100:1 read ratio.",
      mcqOptions: [
        "Write QPS: ~40 writes/sec; Read QPS: ~4,000 reads/sec; 5-year storage: ~3 TB",
        "Write QPS: ~10,000 writes/sec; Read QPS: ~100 reads/sec; 5-year storage: ~500 TB",
        "Write QPS: ~500,000 writes/sec; Read QPS: ~500,000 reads/sec; 5-year storage: ~10 GB",
        "Write QPS: ~1 write/sec; Read QPS: ~10 reads/sec; 5-year storage: ~50 MB",
      ],
      correctIndex: 0,
      explanation:
        "100M writes/month ≈ 100M / (30 * 86,400) ≈ 38.6 writes/sec. With a 100:1 ratio, Read QPS ≈ 3,860 reads/sec. 100M URLs * 12 months * 5 years * 500 bytes ≈ 3 TB total data.",
    },
    phase2Primitives: {
      prompt: "Which database and caching architecture is best aligned with a 100:1 read-heavy workload and 7-character base62 unique keys?",
      mcqOptions: [
        "NoSQL Key-Value store (e.g. DynamoDB/Cassandra) with a Redis/Memcached read cache and Base62 token generator",
        "Single MySQL server with table lock on every redirect increment",
        "Hadoop MapReduce batch cluster running nightly redirect table scans",
        "Append-only flat file on NFS shared across all web instances",
      ],
      correctIndex: 0,
      explanation:
        "Key-value lookups (`shortKey -> originalUrl`) are O(1) reads. A distributed NoSQL key-value store provides predictable horizontal scaling, while in-memory caching caches the top 20% hot URLs (Pareto 80/20 rule) to absorb 80%+ of read traffic.",
    },
    phase3Branches: [
      {
        phase2ChoiceIndex: 0,
        interviewerChallenge:
          "Interviewer Pushback: 'How do you guarantee unique 7-character short codes across multiple concurrent write servers without race conditions or expensive distributed locking?'",
        mcqOptions: [
          "Pre-allocate distinct numeric ID ranges from a distributed coordination service (e.g., ZooKeeper or ticket server) and convert to Base62",
          "Compute SHA-256 of the URL and take the first 7 chars, retrying on collision with a distributed table lock",
          "Let every web server generate random 7-character strings and catch database duplicate key exceptions",
          "Serialize all URL creations through a single master thread in memory",
        ],
        correctIndex: 0,
        explanation:
          "Pre-allocating ranges of 64-bit counter values (e.g. Server 1 gets 1-1,000,000; Server 2 gets 1,000,001-2,000,000) guarantees zero collisions, zero coordination per request, and deterministic Base62 encoding.",
      },
      {
        phase2ChoiceIndex: 1,
        interviewerChallenge:
          "Interviewer Pushback: 'Table locks on a single relational DB will stall 4,000 concurrent read redirects whenever a write arrives. How do you redesign this?'",
        mcqOptions: [
          "Adopt read replicas with Redis caching and eliminate table locks in favor of row-level or key-value lookups",
          "Instruct clients to retry redirects after 10 seconds",
          "Store all URLs in application source code as static constants",
          "Remove database indexes to minimize locking time",
        ],
        correctIndex: 0,
        explanation:
          "Read-heavy systems need read scaling via distributed caches and read replicas, avoiding table-level write locks.",
      },
      {
        phase2ChoiceIndex: 2,
        interviewerChallenge:
          "Interviewer Pushback: 'Nightly batch processing means users cannot access newly shortened links for up to 24 hours. How do you achieve real-time redirects?'",
        mcqOptions: [
          "Use an online key-value datastore with immediate write consistency",
          "Run MapReduce every 500 milliseconds continuously",
          "Tell users URLs are pending verification for 1 business day",
          "Keep all pending URLs in browser localStorage",
        ],
        correctIndex: 0,
        explanation:
          "URL shortening requires immediate online read-after-write consistency, requiring transactional key-value storage over batch pipelines.",
      },
      {
        phase2ChoiceIndex: 3,
        interviewerChallenge:
          "Interviewer Pushback: 'NFS file locks and network latency will bottleneck concurrent reads across web servers. How do you replace NFS?'",
        mcqOptions: [
          "Replace shared NFS with a distributed key-value datastore (DynamoDB or Redis)",
          "Increase NFS buffer cache to 1 terabyte",
          "Disable file locking and risk concurrent write corruption",
          "Run on a single machine with a local NVMe drive",
        ],
        correctIndex: 0,
        explanation:
          "NFS is not a distributed database; horizontal web scaling requires an actual distributed key-value storage engine.",
      },
    ],
    rubric: [
      {
        name: "Capacity & Traffic Estimation",
        weight: 0.30,
        description: "Accurately derives QPS (~40 write, ~4k read) and multi-year storage scale (~3TB).",
        keywords: ["qps", "read-heavy", "3 tb", "4000", "pareto", "storage"],
      },
      {
        name: "Key Generation Architecture",
        weight: 0.40,
        description: "Explains collision-free ID generation (Base62, ZooKeeper ticket ranges, Snowflake IDs) without distributed locks.",
        keywords: ["base62", "ticket", "range", "collision", "unique", "zookeeper", "snowflake"],
      },
      {
        name: "Caching & Global Latency Strategy",
        weight: 0.30,
        description: "Applies CDN/Redis caching for the 80/20 hot URL distribution to meet <20ms global redirect SLA.",
        keywords: ["cache", "cdn", "redis", "80/20", "latency", "redirect"],
      },
    ],
    canonicalTakeaway:
      "A high-throughput URL shortener leverages distributed counter ranges (ZooKeeper ticket blocks) encoded via Base62 to guarantee collision-free short codes without locks, backed by a NoSQL KV store and edge Redis/CDN caches for sub-20ms reads.",
  },

  // 3. Live Gaming Global Leaderboard
  {
    id: "drill_leaderboard_1",
    title: "Real-Time Global Gaming Leaderboard",
    category: "System Design",
    difficulty: "hard",
    vagueScenario:
      "Design a real-time global leaderboard for a mobile multiplayer game with 50 million monthly active users and 100,000 peak concurrent score submissions/sec. Players must see their exact global rank and the top 100 players in <50ms.",
    phase1Constraints: {
      prompt: "Identify the critical performance and data model challenges for 100k peak score updates/sec with real-time rank queries.",
      mcqOptions: [
        "High write concurrency with rank recalculation: O(N) sort operations on relational tables will collapse under 100k updates/sec",
        "Storage size: 50 million users requires petabytes of raw relational storage",
        "Network latency: Leaderboard data packets exceed the 1500 byte MTU limit",
        "CPU limits: Generating random scores consumes 90% of GPU compute",
      ],
      correctIndex: 0,
      explanation:
        "Sorting 50M records with SQL `ORDER BY score DESC` on every update is computationally intractable at 100k writes/sec. Real-time rank retrieval requires an O(log N) data structure (Skip List / Red-Black Tree).",
    },
    phase2Primitives: {
      prompt: "Which data structure and system primitive can maintain real-time sorted rank retrieval in O(log N) time under 100k updates/sec?",
      mcqOptions: [
        "Redis Sorted Sets (ZSET) partitioned by score range or player shards",
        "PostgreSQL table with a B-Tree index on score updated synchronously",
        "MongoDB collection sorted via aggregation pipeline on every user read",
        "Elasticsearch index refreshed every 10 minutes",
      ],
      correctIndex: 0,
      explanation:
        "Redis Sorted Sets use a Skip List + Hash Table, providing O(log N) insertions and O(log N + M) range queries (`ZREVRANGE` and `ZREVRANK`), handling millions of score adjustments in sub-millisecond time.",
    },
    phase3Branches: [
      {
        phase2ChoiceIndex: 0,
        interviewerChallenge:
          "Interviewer Pushback: 'A single Redis ZSET cannot hold 50 million players without memory bottlenecks, and a single Redis instance caps out at ~60,000-100,000 commands/sec on a single core. How do you scale past 100k updates/sec across 50M players?'",
        mcqOptions: [
          "Shard users across multiple ZSETs by score tiers (e.g. Tier 0-1000, 1001-2000) or partition by user ID hash with a write batching buffer",
          "Buy a 512-core server and configure Redis to run 500 background threads on the same ZSET key",
          "Force players to wait until midnight for batch leaderboard calculations",
          "Truncate the leaderboard to only store the top 10 players globally and delete the rest",
        ],
        correctIndex: 0,
        explanation:
          "Score-based sharding or hash partitioning with an in-memory batching buffer aggregates rapid score increments before pushing to Redis, easily scaling past 100k QPS while preserving exact tier ranking.",
      },
      {
        phase2ChoiceIndex: 1,
        interviewerChallenge:
          "Interviewer Pushback: 'PostgreSQL row locks and WAL serialization cannot sustain 100,000 concurrent score updates per second. How do you resolve database thrashing?'",
        mcqOptions: [
          "Offload real-time ranking to an in-memory Skip List datastore (Redis ZSET) and persist to Postgres asynchronously",
          "Turn off PostgreSQL transaction logging completely",
          "Run VACUUM FULL every 10 seconds during peak gameplay",
          "Convert all numeric scores to strings to reduce index size",
        ],
        correctIndex: 0,
        explanation:
          "Databases are not built for 100k sorting updates per second; in-memory data structures like Redis ZSET decouple real-time rank computation from durable database persistence.",
      },
      {
        phase2ChoiceIndex: 2,
        interviewerChallenge:
          "Interviewer Pushback: 'MongoDB aggregation pipelines scanning millions of documents on every read will exceed the 50ms latency SLA by orders of magnitude. How do you achieve sub-50ms rank lookups?'",
        mcqOptions: [
          "Use an indexed in-memory skip list (Redis ZSET) with O(log N) rank lookups",
          "Add more replica secondaries to handle full table scans",
          "Restrict players to checking their rank once per week",
          "Cache the entire MongoDB collection in client cookies",
        ],
        correctIndex: 0,
        explanation:
          "Skip lists deliver O(log N) rank resolution natively, avoiding full document collection aggregation scans.",
      },
      {
        phase2ChoiceIndex: 3,
        interviewerChallenge:
          "Interviewer Pushback: 'A 10-minute refresh latency directly violates the real-time gameplay requirement where players expect instant rank feedback upon match victory. How do you provide real-time updates?'",
        mcqOptions: [
          "Transition from periodic Elasticsearch batching to real-time Redis Sorted Sets with pub/sub notifications",
          "Lower Elasticsearch refresh interval to 1 millisecond and crash the cluster",
          "Fake the rank on the client device without server verification",
          "Notify players of their match rank via email 10 minutes later",
        ],
        correctIndex: 0,
        explanation:
          "Real-time game mechanics demand instantaneous in-memory data structure rank calculation, not near-real-time search indexing.",
      },
    ],
    rubric: [
      {
        name: "Data Structure Complexity",
        weight: 0.40,
        description: "Understands Skip List / ZSET O(log N) advantages over O(N) database sorting under 100k updates/sec.",
        keywords: ["skip list", "zset", "log n", "redis", "sorted set", "o(log n)"],
      },
      {
        name: "Sharding & Partitioning Strategy",
        weight: 0.35,
        description: "Proposes score-tier sharding or write buffering to scale past single-core Redis throughput limits.",
        keywords: ["shard", "partition", "score tier", "batch", "buffer", "scale"],
      },
      {
        name: "Asynchronous Persistence & Edge Caching",
        weight: 0.25,
        description: "Decouples instant in-memory rank lookups from durable database cold storage.",
        keywords: ["asynchronous", "persistence", "durable", "eventual", "top 100"],
      },
    ],
    canonicalTakeaway:
      "Real-time leaderboards at 100k QPS require in-memory Skip Lists (Redis ZSET) for O(log N) rank lookups, scaled horizontally via score-tier sharding and write-batching buffers, while asynchronously persisting snapshots to cold relational storage.",
  },
];
