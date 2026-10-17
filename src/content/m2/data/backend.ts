import { M2Question } from "../question-schema";

export const BACKEND_QUESTIONS: M2Question[] = [
  // --- NODE.JS ---
  {
    id: "m2-node-001",
    skillId: "nodejs",
    topic: "event-loop-libuv",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "Which operations in Node.js utilize the background `libuv` thread pool (default size 4) rather than non-blocking OS kernel async primitives?",
    options: [
      {
        id: "A",
        text: "File system I/O (`fs`), DNS lookups (`dns.lookup`), and cryptographic functions (`crypto.pbkdf2`, `crypto.randomBytes`).",
      },
      {
        id: "B",
        text: "Inbound TCP and HTTP network socket connections (`net`, `http`).",
      },
      {
        id: "C",
        text: "Timer callbacks (`setTimeout`, `setInterval`).",
      },
      {
        id: "D",
        text: "JSON parsing and regular expression execution.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Network I/O in Node is handled via OS epoll/kqueue without thread pool workers. However, file system calls (blocking in most OS kernels), DNS lookup (`getaddrinfo`), and heavy crypto functions rely on libuv's thread pool (`UV_THREADPOOL_SIZE`).",
      whyWrong: {
        B: "Network sockets use OS non-blocking notifications (epoll on Linux, kqueue on macOS, IOCP on Windows), not thread pool workers.",
        C: "Timers are managed as min-heaps inside the libuv event loop itself.",
        D: "JSON parsing and RegExp run synchronously on the V8 main thread.",
      },
      interviewTakeaway:
        "Show systems depth: know that network I/O scales to tens of thousands of concurrent connections because it doesn't consume thread pool slots, while heavy file or crypto work can saturate `UV_THREADPOOL_SIZE`.",
      followUp:
        "How would you tune Node for a server doing heavy bcrypt hashing? (Raise UV_THREADPOOL_SIZE or offload to worker threads).",
    },
    tags: ["nodejs", "libuv", "thread-pool", "event-loop"],
    sourceRefs: ["Node.js Documentation: Don't Block the Event Loop"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-node-002",
    skillId: "nodejs",
    topic: "streams-backpressure",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 4,
    prompt:
      "In a high-throughput Node.js data pipeline, what occurs when a Readable stream pushes data faster than the Writable stream can consume it, and backpressure is ignored?",
    options: [
      {
        id: "A",
        text: "The data accumulates in the Writable stream's internal memory buffer (`highWaterMark`), causing Node process memory to balloon until an Out-Of-Memory (OOM) crash occurs.",
      },
      {
        id: "B",
        text: "The Writable stream automatically drops incoming chunks without notifying the application.",
      },
      {
        id: "C",
        text: "The operating system forcibly closes the TCP socket with a connection reset.",
      },
      {
        id: "D",
        text: "Node automatically suspends the V8 garbage collector until the buffer drains.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "When `writable.write(chunk)` returns `false`, it signals that the buffer is full (`highWaterMark` exceeded). If the producer ignores this and keeps writing, chunks accumulate indefinitely in V8 heap memory until the process runs out of RAM. Using `stream.pipeline` or listening for `'drain'` handles backpressure properly.",
      whyWrong: {
        B: "Node streams do not drop data by default; they buffer incoming chunks in memory.",
        C: "The OS does not terminate the connection unless the process crashes.",
        D: "GC is not paused; memory pressure intensifies until V8 exits with OOM.",
      },
      interviewTakeaway:
        "Always recommend `pipeline` from `'stream/promises'` rather than manually wiring `.pipe()` or manual event listeners.",
    },
    tags: ["nodejs", "streams", "backpressure", "memory-management"],
    sourceRefs: ["Node.js Documentation: Backpressuring in Streams"],
    version: 1,
    status: "published",
  },

  // --- EXPRESS ---
  {
    id: "m2-express-001",
    skillId: "express",
    topic: "error-handling-middleware",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "How does Express distinguish an error-handling middleware from standard request-handling middleware?",
    options: [
      {
        id: "A",
        text: "By inspecting the function's arity (number of declared arguments): error handlers must declare exactly 4 parameters: `(err, req, res, next)`.",
      },
      {
        id: "B",
        text: "By decorating the middleware with `@ErrorHandler` or passing `{ isError: true }` in `app.use`.",
      },
      {
        id: "C",
        text: "By naming the function `errorHandler` or having it return a rejected Promise.",
      },
      {
        id: "D",
        text: "By registering it before all application route definitions.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Express inspects `fn.length` using JavaScript reflection. When `fn.length === 4`, Express treats it as an error-handling middleware and only invokes it when `next(err)` is called. Omitting any argument (like declaring only `(err, req, res)`) causes Express to treat it as standard middleware.",
      whyWrong: {
        B: "Express does not use decorators or options objects for error middleware registration.",
        C: "Function naming does not impact Express routing dispatch.",
        D: "Error handlers must be registered at the very end of the middleware chain, after all routes.",
      },
      interviewTakeaway:
        "Never delete the unused `next` parameter from `(err, req, res, next)` — doing so drops `fn.length` to 3 and breaks Express error routing.",
    },
    tags: ["express", "middleware", "error-handling"],
    sourceRefs: ["Express.js Documentation: Error Handling"],
    version: 1,
    status: "published",
  },

  // --- FASTAPI ---
  {
    id: "m2-fastapi-001",
    skillId: "fastapi",
    topic: "async-def-vs-def",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 4,
    prompt:
      "In FastAPI, what happens if you define a route handler with `async def` but execute synchronous blocking code inside it (such as `time.sleep(5)` or a non-async database call)?",
    options: [
      {
        id: "A",
        text: "It blocks the main asyncio event loop thread, freezing all concurrent requests across the entire application.",
      },
      {
        id: "B",
        text: "FastAPI automatically detects blocking calls and dispatches them to a background thread pool.",
      },
      {
        id: "C",
        text: "Python raises a `BlockingIOError` runtime exception immediately.",
      },
      {
        id: "D",
        text: "Uvicorn forks a new worker process for that specific request.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "When a route is declared with `async def`, FastAPI executes it directly on the main event loop thread. A blocking call (like `time.sleep` or synchronous requests) halts the event loop, preventing all other coroutines from running. If a function contains blocking code, declaring it with standard `def` (without `async`) instructs FastAPI to offload it to an external thread pool.",
      whyWrong: {
        B: "FastAPI only uses an external thread pool for standard `def` routes, NOT for `async def` routes.",
        C: "Python executes blocking calls synchronously without throwing an error.",
        D: "Worker processes are fixed at startup; Uvicorn does not dynamically fork processes per request.",
      },
      interviewTakeaway:
        "Rule of thumb in FastAPI: use `async def` only with non-blocking `await` calls; if using legacy synchronous libraries, declare plain `def` so FastAPI safely runs them in thread pool.",
    },
    tags: ["fastapi", "asyncio", "concurrency", "python"],
    sourceRefs: ["FastAPI Documentation: Concurrency and async / await"],
    version: 1,
    status: "published",
  },

  // --- SPRING BOOT ---
  {
    id: "m2-spring-001",
    skillId: "spring-boot",
    topic: "transactional-proxies",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "In a Spring Boot `@Service` bean, why does calling a `@Transactional` method from another method inside the same class (self-invocation via `this.methodB()`) fail to start a database transaction?",
    options: [
      {
        id: "A",
        text: "Spring implements `@Transactional` using dynamic proxies (CGLIB/JDK dynamic proxy); self-invocation bypasses the proxy wrapper and calls the target object directly.",
      },
      {
        id: "B",
        text: "Spring requires all transactional methods to be declared `static`.",
      },
      {
        id: "C",
        text: "JDBC connection pools disallow nested method calls within service classes.",
      },
      {
        id: "D",
        text: "Hibernate entity managers disable transactions when the calling thread is not an HTTP request thread.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Spring AOP works through proxy wrappers around the bean. When an external caller invokes a method, the proxy intercepts the call, begins the transaction, invokes the target, and commits/rolls back. However, internal method calls (`this.method()`) bypass the proxy, executing plain un-intercepted Java bytecode.",
      whyWrong: {
        B: "Spring transactional methods cannot be static; they must be instance methods.",
        C: "JDBC connection pooling has no awareness of Java service method hierarchies.",
        D: "Transactions are thread-bound via `TransactionSynchronizationManager`, independent of HTTP.",
      },
      interviewTakeaway:
        "Classic Spring interview question. Resolving self-invocation: extract to a separate bean, inject `ApplicationContext` or self-inject, or use AspectJ compile-time weaving.",
    },
    tags: ["spring-boot", "aop", "proxies", "transactional"],
    sourceRefs: ["Spring Framework Documentation: Transaction Management"],
    version: 1,
    status: "published",
  },

  // --- REST APIS ---
  {
    id: "m2-rest-001",
    skillId: "rest-apis",
    topic: "http-idempotency",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "According to HTTP/1.1 specifications (RFC 7231 / RFC 9110), which of the following HTTP methods is NOT idempotent?",
    options: [
      { id: "A", text: "POST" },
      { id: "B", text: "PUT" },
      { id: "C", text: "DELETE" },
      { id: "D", text: "GET" },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "An idempotent HTTP method is one where multiple identical requests have the exact same intended effect on the server state as a single request. `POST` is designed for subordinate resource creation or processing, where repeating the request creates duplicate resources (not idempotent). `PUT`, `DELETE`, and `GET` are idempotent.",
      whyWrong: {
        B: "`PUT` is idempotent: replacing a resource with state X multiple times leaves the resource in state X.",
        C: "`DELETE` is idempotent: deleting resource #42 multiple times leaves it deleted, regardless of whether subsequent responses return 404.",
        D: "`GET` is both safe and idempotent.",
      },
      interviewTakeaway:
        "Distinguish 'safe' (no state mutation) from 'idempotent' (mutations produce identical server state on N repeated requests).",
      followUp:
        "How do payment APIs make POST idempotent? (Using an `Idempotency-Key` header with deduplication cache).",
    },
    tags: ["rest-apis", "http", "idempotency", "rfc-specs"],
    sourceRefs: ["RFC 9110: HTTP Semantics - Section 9.2.2 Idempotent Methods"],
    version: 1,
    status: "published",
  },

  // --- GRAPHQL ---
  {
    id: "m2-graphql-001",
    skillId: "graphql",
    topic: "n-plus-1-dataloader",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "When resolving a list of 50 `Post` items in GraphQL, each post fetches its `author` in a nested field resolver (`Post.author`), triggering 51 separate SQL queries. How does DataLoader resolve this N+1 problem?",
    options: [
      {
        id: "A",
        text: "By coalescing individual fetch requests across a single tick of the event loop into a single batched SQL query (`WHERE id IN (...)`) with in-memory memoization.",
      },
      {
        id: "B",
        text: "By compiling the GraphQL AST directly into a single SQL JSON view at server startup.",
      },
      {
        id: "C",
        text: "By caching all database rows in Redis permanently.",
      },
      {
        id: "D",
        text: "By rejecting client queries that request relations deeper than 1 level.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "DataLoader schedules batched execution via microtasks (`process.nextTick`). When individual resolvers call `loader.load(authorId)`, DataLoader queues the IDs. Once the current execution frame completes, DataLoader executes a single batch function with all collected IDs (e.g. `SELECT * FROM users WHERE id IN (...)`) and resolves each individual Promise.",
      whyWrong: {
        B: "GraphQL servers resolve fields iteratively at runtime; they do not compile static SQL views.",
        C: "DataLoader provides per-request in-memory deduplication, not global persistent Redis caching.",
        D: "Nested relations are core to GraphQL; DataLoader optimizes them rather than rejecting them.",
      },
      interviewTakeaway:
        "Articulate the 2 core mechanisms of DataLoader: batching (via event loop tick collection) and caching (per-request memoization to prevent duplicate lookups within one query).",
    },
    tags: ["graphql", "dataloader", "n-plus-one", "optimization"],
    sourceRefs: ["DataLoader GitHub Repository & Specification"],
    version: 1,
    status: "published",
  },
];
