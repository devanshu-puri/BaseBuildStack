import { UserProjectDocument, ProjectQuestionDocument } from "@/lib/db/schemas";

export interface GeneratedProjectQuestion {
  id: string;
  projectId: string;
  question: string;
  modelAnswer: string;
  keyPoints: string[];
  commonMistakes: string[];
  followUps: string[];
  category: string;
  difficulty: "basic" | "medium" | "hard";
  status: "unreviewed" | "got_it" | "need_review";
  relatedSkills: string[];
}

export const CANONICAL_SAMPLE_PROJECT: UserProjectDocument = {
  id: "sample_microservices_platform",
  userId: "canonical_sample",
  name: "High-Throughput E-Commerce Microservices",
  role: "Backend & Systems Engineer",
  summary:
    "Engineered distributed checkout and order orchestration microservices handling peak flash sales, with idempotency guarantees, cache-aside layer, and asynchronous inventory reservation.",
  responsibilities: [
    "Architected payment webhook ingestion pipeline using idempotency keys and transactional outbox pattern.",
    "Integrated Redis cluster caching layer for catalog lookup, reducing PostgreSQL query load by 78%.",
    "Implemented BullMQ/Kafka worker consumers for asynchronous order fulfillment and email dispatch.",
  ],
  techStack: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Kafka", "Docker", "Kubernetes"],
  metrics: ["15,000 req/sec peak throughput", "99.98% availability", "45ms p95 latency"],
  links: ["https://github.com/example/checkout-microservice"],
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Deterministically synthesizes 10 rigorous senior interview panel questions
 * tailored specifically to a candidate's project, role, tech stack, and metrics.
 * Operates 100% offline with LLM disabled.
 */
export function generateQuestionsForProject(
  project: UserProjectDocument
): Array<Omit<ProjectQuestionDocument, "userId" | "createdAt" | "updatedAt">> {
  const pName = project.name.trim();
  const stack = project.techStack && project.techStack.length > 0
    ? project.techStack
    : ["Node.js", "PostgreSQL", "Redis"];
  const primaryDb = stack.find((t) => /postgres|mongo|sql|dynamo|mysql/i.test(t)) || "the primary database";
  const cacheOrBroker = stack.find((t) => /redis|kafka|rabbit|sqs|memcache/i.test(t)) || "Redis/Kafka";
  const primaryLang = stack.find((t) => /typescript|javascript|python|go|java|c\+\+/i.test(t)) || "TypeScript";
  const keyMetric = project.metrics && project.metrics.length > 0 ? project.metrics[0] : "high throughput and low latency";
  const secondMetric = project.metrics && project.metrics.length > 1 ? project.metrics[1] : "99.9% uptime SLA";

  const categories = [
    {
      category: "Architecture & System Design",
      difficulty: "medium" as const,
      question: `Walk me through the high-level architecture of ${pName}. How do client requests flow from the edge through your services down to ${primaryDb}?`,
      modelAnswer: `**Situation:** In ${pName}, we needed to support ${keyMetric} while keeping services decoupled and resilient to downstream service latency spikes.
**Task:** As ${project.role || "engineer"}, my responsibility was to design the end-to-end request lifecycle and establish clean service boundaries.
**Action:** I set up an API Gateway handling TLS termination, JWT authentication, and rate limiting. Requests were routed to statutory REST/gRPC microservices implemented in ${primaryLang}. For read-heavy operations, we implemented a cache-aside layer using ${cacheOrBroker} with TTLs and stale-while-revalidate semantics. Write mutations executed transactions against ${primaryDb} before publishing state change events onto the message bus for asynchronous fanout.
**Result:** This decoupled read/write pathways, maintained p95 latency under strict bounds, and allowed individual services to scale horizontally without overwhelming the database cluster.`,
      keyPoints: [
        "Explain request flow clearly: Edge / Gateway → Auth / Rate Limiting → Application Service → Cache / DB.",
        "Articulate the read vs. write separation and why synchronous blocking was avoided for side-effects.",
        "Name specific protocols and serialization formats used (e.g., REST/JSON, gRPC/Protobuf).",
      ],
      commonMistakes: [
        "Jumping straight into database tables without detailing the API gateway, ingress, or load balancer.",
        "Describing a monolithic single-node flow while claiming it was a distributed microservices platform.",
      ],
      followUps: [
        "How did you prevent cascading failures if a downstream dependency experienced elevated latencies?",
        "What serialization format did internal services use for RPC communication, and why?",
      ],
    },
    {
      category: "Scale & Performance",
      difficulty: "hard" as const,
      question: `Your project highlights achieving "${keyMetric}". What was the biggest scalability bottleneck you encountered while pushing throughput, and how did you resolve it?`,
      modelAnswer: `**Situation:** During load testing simulating peak traffic, service response times spiked drastically as we approached our target of ${keyMetric}.
**Task:** Identify the root cause profiling CPU, memory, and database connection pool saturation under simulated traffic.
**Action:** Profiling with APM tracing showed two primary bottlenecks: connection pool exhaustion on ${primaryDb} due to N+1 queries during bulk lookups, and unindexed filter scans. I refactored the data layer to use batch lookups via SQL JOINs/IN clauses, added a compound B-tree index, and introduced connection pooling with PgBouncer. Furthermore, hot read queries were offloaded to ${cacheOrBroker} with a 60-second sliding expiration.
**Result:** Database CPU utilization dropped from 89% to 22%, query throughput scaled seamlessly to ${keyMetric}, and p99 latency stabilized under peak load.`,
      keyPoints: [
        "Specify profiling and monitoring tools used (e.g., Datadog, Grafana, flamegraphs, EXPLAIN ANALYZE).",
        "Explain the exact bottleneck (connection pooling, serialization overhead, lock contention, or slow queries).",
        "Quantify the improvement before vs. after your intervention.",
      ],
      commonMistakes: [
        "Claiming 'we just added more Kubernetes pods' (horizontal autoscaling cannot fix saturated database locks or unindexed queries).",
        "Vague hand-waving without mentioning profiling metrics or concrete numbers.",
      ],
      followUps: [
        "How did you perform load generation to reproduce the bottleneck reliably?",
        "How did you prevent cold-start cache stampedes when the cache expired under full load?",
      ],
    },
    {
      category: "Concurrency & Data Consistency",
      difficulty: "hard" as const,
      question: `How did ${pName} handle concurrent mutations, double-spending, or race conditions when multiple clients attempted identical updates simultaneously?`,
      modelAnswer: `**Situation:** In high-concurrency environments, duplicate client requests, network retries, or simultaneous user actions could trigger duplicate processing or negative inventory.
**Task:** Guarantee strict idempotency and consistency across concurrent write operations.
**Action:** We implemented a two-fold concurrency control strategy. First, at the API boundary, we enforced client-supplied \`Idempotency-Key\` headers stored in ${cacheOrBroker} using atomic SETNX with a 24-hour expiration. Second, at the database level in ${primaryDb}, we utilized pessimistic row locking (\`SELECT FOR UPDATE\`) for sensitive balance deductions, alongside optimistic concurrency control with a \`version\` column for general record mutations.
**Result:** Zero duplicate orders or negative balance states were recorded across millions of simulated concurrent executions, with less than 0.1% transaction rollback overhead under contention.`,
      keyPoints: [
        "Contrast optimistic locking (version column) vs. pessimistic locking (SELECT FOR UPDATE) and state when each was chosen.",
        "Explain idempotency key lifecycle: check-lock-execute-store pattern.",
        "Address how distributed deadlocks were prevented through strict lock ordering.",
      ],
      commonMistakes: [
        "Confusing application-level JavaScript/Python variables with atomic database locks.",
        "Assuming that running inside a single Node.js event loop prevents concurrent database updates from external worker replicas.",
      ],
      followUps: [
        "What happens if a client crashes halfway through an idempotent transaction?",
        "Why did you choose pessimistic locking over a distributed Redis lock (Redlock) for financial invariants?",
      ],
    },
    {
      category: "Failure Modes & Fault Tolerance",
      difficulty: "medium" as const,
      question: `What happened in ${pName} if ${cacheOrBroker} or ${primaryDb} suffered an unexpected outage or network partition? Did the entire system halt?`,
      modelAnswer: `**Situation:** Distributed systems inevitably face partial infrastructure degradation. We needed ${pName} to degrade gracefully rather than collapsing entirely.
**Task:** Design resilient fallbacks, circuit breakers, and retry strategies for dependency outages.
**Action:** For ${cacheOrBroker}, we implemented graceful fallback: if the cache connection timed out or threw an error, our data access layer caught the exception, logged a warning, and fell back directly to ${primaryDb} with strict rate limits to prevent DB swamping. For critical write dependencies, we deployed the Circuit Breaker pattern (using 50% error rate over a 10s rolling window to open the circuit) with exponential backoff and jitter on retries. Failed asynchronous events were dispatched to a Dead-Letter Queue (DLQ) for alerting and replay.
**Result:** When a redis failover occurred in staging, user requests experienced a modest 30ms latency increase but zero 500 errors were served, fulfilling our ${secondMetric} target.`,
      keyPoints: [
        "Explain Circuit Breaker states: Closed, Open, Half-Open.",
        "Detail Dead-Letter Queues (DLQ) and idempotent replay mechanisms.",
        "Discuss exponential backoff with jitter to avoid Thundering Herd problems.",
      ],
      commonMistakes: [
        "Saying 'our cloud provider has 99.99% uptime so it never goes down'.",
        "Retrying failed requests infinitely in a tight loop without timeouts or backoff.",
      ],
      followUps: [
        "How did you reconcile data discrepancies once the failed service recovered?",
        "What was your alerting strategy when the circuit breaker tripped open?",
      ],
    },
    {
      category: "Data Modeling & Storage Decisions",
      difficulty: "medium" as const,
      question: `Why did you select ${primaryDb} for ${pName} instead of an alternative database paradigm? What access patterns dictated your schema design?`,
      modelAnswer: `**Situation:** We evaluated storage engines based on our dominant access patterns: relational integrity across entities, strict ACID requirements for state updates, and complex multi-filter querying.
**Task:** Choose and model the primary persistence layer to support both operational throughput and transactional correctness.
**Action:** We chose ${primaryDb}. We normalized core transactional entities to 3NF to eliminate duplicate writes and update anomalies, while creating targeted composite indexes aligned with our primary query filters (\`status\`, \`created_at\`, \`tenant_id\`). For high-throughput analytics and audit logs that did not require transactional foreign keys, we partitioned tables by month and offloaded archival storage.
**Result:** Enabled strict data integrity guarantees while keeping average index-seek query latency below 8ms across tables with millions of rows.`,
      keyPoints: [
        "Compare SQL vs. NoSQL trade-offs (ACID guarantees, schema rigidity, horizontal scaling vs. query flexibility).",
        "Highlight indexing strategy: composite indexes matching query WHERE and ORDER BY clauses.",
        "Mention normalization vs. deliberate denormalization trade-offs.",
      ],
      commonMistakes: [
        "Saying 'I picked it because it is what I know best' without articulating trade-offs.",
        "Failing to explain how indexes impact write latency.",
      ],
      followUps: [
        "How did you manage schema migrations with zero downtime in production?",
        "At what scale would your relational model need to shard or adopt CQRS?",
      ],
    },
    {
      category: "Security, Auth & Boundary Isolation",
      difficulty: "medium" as const,
      question: `How did you handle authentication, authorization, and tenant isolation in ${pName}? How did you prevent Insecure Direct Object References (IDOR)?`,
      modelAnswer: `**Situation:** ${pName} processed sensitive user and transaction records, requiring airtight authentication, fine-grained Role-Based Access Control (RBAC), and multitenant isolation.
**Task:** Enforce authentication and resource authorization across all public and internal API endpoints.
**Action:** Authentication was handled via short-lived JWTs (15-min expiry) paired with httpOnly, Secure, SameSite refresh tokens stored in database sessions. To eliminate IDOR vulnerabilities, every database query and mutation strictly enforced tenant/user scoping at the repository layer—injecting \`WHERE tenant_id = session.tenantId AND id = requestedId\` rather than trusting client-provided IDs. All inputs passed through strict Zod/Joi schema validation at API boundaries.
**Result:** Automated penetration testing revealed zero unauthorized cross-tenant data access or parameter tampering vulnerabilities.`,
      keyPoints: [
        "Explain JWT verification vs. session revocation strategies.",
        "Address IDOR prevention: never trust client input for entity ownership, always bind to authenticated session context.",
        "Mention input validation, SQL injection prevention via parameterized queries, and CORS/CSP headers.",
      ],
      commonMistakes: [
        "Storing sensitive JWT tokens in localStorage where they are vulnerable to XSS.",
        "Checking if a user is logged in, but not verifying if the user has permission to view that specific record ID.",
      ],
      followUps: [
        "How did you immediately revoke compromised user sessions if tokens are stateless?",
        "How did you handle rate-limiting per API key or IP address?",
      ],
    },
    {
      category: "Observability, Metrics & Alerting",
      difficulty: "medium" as const,
      question: `How did you monitor ${pName} in production? If an API endpoint began throwing 500 errors or elevated latency, how did your team detect and triage it?`,
      modelAnswer: `**Situation:** Maintaining our reliability SLA required real-time visibility into application health, error rates, and system resources.
**Task:** Establish an observability pipeline encompassing the Three Pillars: Metrics, Distributed Tracing, and Structured Logging.
**Action:** We instrumented our ${primaryLang} services using OpenTelemetry and Prometheus exporters, tracking the Four Golden Signals: Latency, Traffic, Errors, and Saturation. We injected correlation IDs (\`X-Request-Id\`) at the API Gateway and propagated them through HTTP headers and message queues to correlate logs in our centralized logging system. We configured PagerDuty alerts triggered when the 5-minute rolling error rate exceeded 1% or p95 latency exceeded 200ms.
**Result:** Reduced Mean Time to Detection (MTTD) from 25 minutes to under 90 seconds, and Mean Time to Resolution (MTTR) by 60%.`,
      keyPoints: [
        "Mention the 4 Golden Signals: Latency, Traffic, Errors, Saturation.",
        "Explain distributed tracing and correlation IDs across service boundaries.",
        "Discuss actionable alerting: alerting on user-facing symptoms (error rate, SLA breach) rather than noisy server CPU spikes.",
      ],
      commonMistakes: [
        "Saying 'we checked console.log when someone complained in Slack'.",
        "Not knowing the difference between metrics (aggregates) and logs (event streams).",
      ],
      followUps: [
        "How did you prevent high-cardinality metrics from exploding your monitoring costs?",
        "What health checks (liveness vs. readiness probes) did your container orchestrator rely on?",
      ],
    },
    {
      category: "Technical Trade-offs & Regrets",
      difficulty: "hard" as const,
      question: `Reflecting on ${pName}, what is one architectural or technical decision you made that you would implement differently today? What was the trade-off?`,
      modelAnswer: `**Situation:** Early in ${pName}'s development, we prioritized development velocity to ship the initial MVP quickly.
**Task:** Evaluate the long-term maintainability impact of early architectural shortcuts.
**Action:** We chose an asynchronous event-driven architecture with ${cacheOrBroker} very early, before service boundaries were completely stable. While this provided decoupling, it introduced distributed transaction complexity, eventual consistency lag in UI updates, and non-trivial debugging overhead across asynchronous boundaries. If rebuilding today, I would start with a well-structured modular monolith with clear domain boundaries, and extract asynchronous distributed services only after domain boundaries stabilized.
**Result:** Recognizing this trade-off allowed our team to invest in strong contract testing and comprehensive tracing, saving significant operational toil in subsequent feature releases.`,
      keyPoints: [
        "Demonstrate self-awareness and senior engineering maturity.",
        "Frame the decision around the context at the time: why it made sense then vs. what was learned as the system scaled.",
        "Show you understand the operational cost of distributed systems and premature microservices.",
      ],
      commonMistakes: [
        "Saying 'everything was perfect, I wouldn't change anything'.",
        "Blaming teammates or third-party libraries rather than analyzing architectural trade-offs.",
      ],
      followUps: [
        "How did you address the eventual consistency challenges for frontend user experience?",
        "What heuristics do you use now to decide when to break a monolith into microservices?",
      ],
    },
    {
      category: "Testing Strategy & CI/CD",
      difficulty: "basic" as const,
      question: `How did you test ${pName} before deploying to production? What was your testing pyramid and deployment pipeline?`,
      modelAnswer: `**Situation:** To ship features confidently without breaking critical customer workflows, we needed a robust automated CI/CD pipeline and test suite.
**Task:** Implement multi-tiered testing and an automated deployment pipeline with zero-downtime guarantees.
**Action:** We structured our testing pyramid with ~70% unit tests (fast, isolated domain logic), ~25% integration tests using Dockerized testcontainers for ${primaryDb} and ${cacheOrBroker}, and ~5% end-to-end smoke tests for critical user journeys. In GitHub Actions/GitLab CI, every pull request ran linter, type checks, unit tests, and integration tests before merging. On merge to main, the pipeline built immutable Docker images, ran migrations, and deployed via rolling updates with automated health check verification.
**Result:** Maintained a 98% test coverage on core financial/checkout services, and reduced deployment-induced regressions to near zero.`,
      keyPoints: [
        "Break down the testing pyramid: Unit (mocked), Integration (real dependencies via containers), E2E.",
        "Explain CI pipeline stages: Lint → Type Check → Test → Build Image → Migration → Deploy.",
        "Mention zero-downtime deployment strategies (Rolling update, Blue-Green, or Canary).",
      ],
      commonMistakes: [
        "Having only unit tests with 100% mocked databases (leaves integration and query bugs undetected).",
        "Deploying database schema migrations manually via psql in production instead of versioned migration tools.",
      ],
      followUps: [
        "How did you handle non-backward-compatible database schema changes during a rolling deployment?",
        "How did you ensure test suite execution remained fast in CI as the codebase grew?",
      ],
    },
    {
      category: "Production Incident & Debugging",
      difficulty: "hard" as const,
      question: `Tell me about the most challenging production incident or bug you diagnosed in ${pName}. How did you isolate it and prevent it from recurring?`,
      modelAnswer: `**Situation:** During a high-traffic promotion, our services suddenly began throwing 504 Gateway Timeouts, and latency spiked across all endpoints simultaneously.
**Task:** Triage the ongoing incident, mitigate customer impact immediately, and identify the root cause.
**Action:** First, I checked APM dashboards and noticed connection pool exhaustion in ${primaryDb}. We immediately scaled up pool sizes and throttled non-critical batch jobs to restore service availability within 8 minutes. During post-mortem analysis, we analyzed slow query logs and discovered an unindexed query triggered by an edge-case search filter introduced in the latest release, causing sequential scans on a 15-million-row table. I deployed an emergency index migration, added an index validation check to our CI migration suite, and set a 3-second query timeout on the connection pool.
**Result:** MTTR was 8 minutes; query timeouts prevented a single slow query from exhausting all pooled connections in the future, and zero data loss occurred.`,
      keyPoints: [
        "Follow clear incident response protocol: Detect → Mitigate First (stop the bleeding) → Diagnose Root Cause → Long-term Prevention.",
        "Detail the post-mortem and blameless culture: what monitors, circuit breakers, or CI checks were added.",
        "Quantify the recovery time (MTTR) and customer impact.",
      ],
      commonMistakes: [
        "Spending hours debugging root cause in production before trying to mitigate customer impact (e.g., rollback or throttle).",
        "Not mentioning post-mortem or preventative mechanisms added afterward.",
      ],
      followUps: [
        "What was your communication protocol with stakeholders and customers during the incident?",
        "How did you test your backup and disaster recovery procedures?",
      ],
    },
  ];

  return categories.map((c, idx) => ({
    id: `pq_${project.id}_${idx + 1}`,
    projectId: project.id,
    question: c.question,
    modelAnswer: c.modelAnswer,
    keyPoints: c.keyPoints,
    commonMistakes: c.commonMistakes,
    followUps: c.followUps,
    category: c.category,
    difficulty: c.difficulty,
    status: "unreviewed" as const,
    relatedSkills: project.techStack || [],
  }));
}
