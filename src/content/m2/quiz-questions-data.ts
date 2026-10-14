import { QuizQuestion } from "./quiz-schema";

export const CURATED_QUIZ_QUESTIONS: QuizQuestion[] = [
  // ----------------------------------------------------
  // React Questions (mcq, output, debug, approach)
  // ----------------------------------------------------
  {
    id: "react-mcq-stale-closure",
    skill: "React",
    type: "mcq",
    difficulty: 2,
    stem: "In React functional components, what primary condition causes a 'stale closure' inside a useCallback or useEffect hook?",
    code: `const [count, setCount] = useState(0);

const handleLog = useCallback(() => {
  console.log("Count is:", count);
}, []); // Empty dependency array`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "React re-renders the component asynchronously without updating the DOM tree." },
      { id: "opt-b", text: "The callback captures the lexical environment from the initial render and never updates its reference to count because count is omitted from dependencies." },
      { id: "opt-c", text: "State updates in React are mutated in-place, confusing Javascript's garbage collector." },
      { id: "opt-d", text: "The useCallback hook runs synchronously before useState initialises." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "In JavaScript, closures retain references to variables in their scope at creation time. With an empty dependency array `[]`, useCallback caches the first render's function instance, closing over the initial `count = 0` forever.",
      distractors: {
        "opt-a": "Stale closures are an artifact of JavaScript lexical scoping and hook memoization, not React's asynchronous reconciliation scheduler.",
        "opt-c": "React state is immutable; setters create new state references rather than mutating values in-place.",
        "opt-d": "useState initializes on component mount before any callbacks are executed.",
      },
      takeaway: "Always include referenced reactive values in hook dependency arrays or use state updater functions `(prev => prev + 1)`.",
      repoEvidence: {
        path: "src/components/ui/option-button.tsx",
        lines: "L15-L25",
      },
    },
    verified: true,
  },
  {
    id: "react-output-state-batching",
    skill: "React",
    type: "output",
    difficulty: 1,
    stem: "Given the following React counter handler with functional vs direct updates, what is logged when the button is clicked once?",
    code: `function Counter() {
  const [val, setVal] = useState(1);

  const handleClick = () => {
    setVal(val + 1);
    setVal(val + 1);
    setVal((prev) => prev + 3);
  };
  // Assume val started at 1. What will val become on the next render?
}`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "6 (1 + 1 + 1 + 3)" },
      { id: "opt-b", text: "5 (first update val+1=2 queued, second overrides with val+1=2, functional update adds 3 -> 5)" },
      { id: "opt-c", text: "4" },
      { id: "opt-d", text: "2" },
    ],
    correctId: "opt-b",
    explanation: {
      why: "In React automatic batching, `setVal(val + 1)` uses the current render's closure value `1` (yielding `2`). The second call also passes `2`. Then the functional updater `(prev) => prev + 3` receives the pending value `2` and returns `5`.",
      distractors: {
        "opt-a": "Direct updates `setVal(val + 1)` do not accumulate across successive calls in the same tick; they both evaluate against `val = 1`.",
        "opt-c": "The functional update receives `2` as `prev` (not the initial `1`), resulting in `2 + 3 = 5`, not `4`.",
        "opt-d": "The functional update `prev + 3` executes after the direct assignments in the update queue.",
      },
      takeaway: "Use functional state updates `setX(prev => ...)` whenever new state depends on prior pending updates in the same execution cycle.",
    },
    verified: true,
  },
  {
    id: "react-debug-useeffect-race",
    skill: "React",
    type: "debug",
    difficulty: 2,
    stem: "Spot the concurrency bug in this data-fetching hook when the user switches `userId` rapidly:",
    code: `useEffect(() => {
  fetchUserData(userId).then(data => {
    setUser(data);
  });
}, [userId]);`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "Syntax error: useEffect cannot call asynchronous functions directly." },
      { id: "opt-b", text: "Race condition: A slower request for a previous userId may resolve after a faster request for the new userId, leaving the UI showing stale data." },
      { id: "opt-c", text: "Memory leak: fetchUserData cannot be garbage collected because userId is primitive." },
      { id: "opt-d", text: "Infinite loop: setUser automatically re-triggers the effect on every invocation." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Network requests take variable times. If request A (userId=1) takes 400ms and request B (userId=2) takes 100ms, request A will resolve last and overwrite request B's state with user 1's profile.",
      distractors: {
        "opt-a": "Calling `.then` inside the effect callback is syntactically valid; only making the outer effect function itself `async` is disallowed.",
        "opt-c": "Garbage collection is not prevented by primitive dependencies.",
        "opt-d": "The dependency array only contains `userId`, so updating `user` does not re-trigger this specific effect.",
      },
      takeaway: "Use an `ignore` flag in the cleanup function or AbortController to discard responses from obsolete effect runs.",
    },
    verified: true,
  },
  {
    id: "react-approach-state-management",
    skill: "React",
    type: "approach",
    difficulty: 2,
    stem: "You are designing an enterprise dashboard with frequent server data revalidations, local modal visibility flags, and global theme preferences. What is the recommended state architecture?",
    options: [
      { id: "opt-a", text: "Store everything in a single global Redux or Context store including all server cache payloads and modal states." },
      { id: "opt-b", text: "Separate concerns: use a dedicated server-state tool (TanStack Query / SWR / Server Components) for remote data, React Context for rare ambient values (theme), and local useState/URL params for transient UI state." },
      { id: "opt-c", text: "Persist all UI state in localStorage and read it synchronously in component render functions." },
      { id: "opt-d", text: "Pass all state via top-level props down through the entire tree to avoid external dependencies." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Server state has asynchronous lifecycle requirements (caching, deduplication, background revalidation) fundamentally different from transient client UI state. Coupling them in one client store causes bloat and stale cache bugs.",
      distractors: {
        "opt-a": "Co-locating high-churn server cache with UI flags in a monolithic store creates unnecessary boilerplate and re-render cascades.",
        "opt-c": "Synchronous localStorage access in render causes hydration mismatches and blocks the main thread.",
        "opt-d": "Deep prop-drilling causes tight coupling and fragile maintenance overhead.",
      },
      takeaway: "Treat server cache as borrowed asynchronous state; keep client UI state co-located and minimal.",
    },
    verified: true,
  },

  // ----------------------------------------------------
  // TypeScript Questions (mcq, output, debug, approach)
  // ----------------------------------------------------
  {
    id: "ts-mcq-discriminated-unions",
    skill: "TypeScript",
    type: "mcq",
    difficulty: 2,
    stem: "How does TypeScript achieve exhaustive type narrowing in a switch statement over a discriminated union?",
    code: `type Action = 
  | { type: "LOGIN"; user: string }
  | { type: "LOGOUT" };

function reducer(action: Action) {
  switch (action.type) {
    case "LOGIN": return handleLogin(action.user);
    case "LOGOUT": return handleLogout();
    default:
      const _exhaustive: never = action;
      return _exhaustive;
  }
}`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "By assigning the unhandled case to the 'never' type, causing a compile-time type error if any union member was omitted." },
      { id: "opt-b", text: "By evaluating the runtime typeof of the action in the JavaScript engine." },
      { id: "opt-c", text: "By throwing a standard ReferenceError during browser runtime." },
      { id: "opt-d", text: "By transforming the switch statement into a WebAssembly jump table." },
    ],
    correctId: "opt-a",
    explanation: {
      why: "The `never` type represents values that can never occur. If all variants of `Action` are handled, TypeScript proves that `action` in `default` has type `never`. If a variant is missed, `action` retains that type, causing a compile-time assignability error.",
      distractors: {
        "opt-b": "Discriminated union narrowing occurs strictly during compile-time static analysis, not runtime `typeof`.",
        "opt-c": "The code causes a compile-time TypeScript error, not a runtime ReferenceError.",
        "opt-d": "TypeScript does not emit WebAssembly or alter switch statement execution semantics.",
      },
      takeaway: "Use `const _check: never = value` in default blocks for compile-time exhaustiveness guarantees.",
    },
    verified: true,
  },
  {
    id: "ts-output-array-flat-map",
    skill: "TypeScript",
    type: "output",
    difficulty: 1,
    stem: "What is the evaluated output of the following TypeScript / JavaScript array expression?",
    code: `const items = [1, 2, 3];
const result = items.flatMap(x => (x % 2 === 0 ? [x, x * 10] : []));
console.log(result);`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "[[2, 20]]" },
      { id: "opt-b", text: "[2, 20]" },
      { id: "opt-c", text: "[1, 2, 20, 3]" },
      { id: "opt-d", text: "[]" },
    ],
    correctId: "opt-b",
    explanation: {
      why: "`flatMap` maps each element to an array and flattens the result by 1 level. For `1` it returns `[]`, for `2` it returns `[2, 20]`, for `3` it returns `[]`. Concatenating these results yields `[2, 20]`.",
      distractors: {
        "opt-a": "Standard `map` would produce nested arrays `[[], [2, 20], []]`, but `flatMap` flattens one depth level.",
        "opt-c": "Odd elements `1` and `3` return empty arrays `[]` which vanish during flattening.",
        "opt-d": "Even element `2` evaluates to `[2, 20]`, so the resulting array is not empty.",
      },
      takeaway: "`flatMap` is an idiomatic single-pass way to simultaneously filter and expand array elements.",
    },
    verified: true,
  },
  {
    id: "ts-debug-any-vs-unknown",
    skill: "TypeScript",
    type: "debug",
    difficulty: 2,
    stem: "Identify the safety hazard in the following untrusted API response parser:",
    code: `async function fetchConfig(url: string) {
  const res = await fetch(url);
  const data: any = await res.json();
  return data.settings.timeout.toFixed(2);
}`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "The fetch call is missing a CORS preflight header." },
      { id: "opt-b", text: "Using 'any' turns off type checking, causing a runtime TypeError (Cannot read property of undefined) if 'settings' or 'timeout' is absent in the response." },
      { id: "opt-c", text: "The toFixed method does not exist on number types in JavaScript." },
      { id: "opt-d", text: "Async functions cannot return primitive string values." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "`any` completely disables the TypeScript type checker. If the API payload schema changes or returns `{ error: true }`, accessing nested properties blows up at runtime. Using `unknown` paired with Zod schema parsing enforces safe validation.",
      distractors: {
        "opt-a": "CORS headers are configured on the server, not directly mandated in client fetch syntax.",
        "opt-c": "`toFixed` is a standard JavaScript Number prototype method.",
        "opt-d": "Async functions always return Promises resolving to whatever value is returned.",
      },
      takeaway: "Never cast untrusted network inputs to `any`; parse them with Zod or validate with type guards over `unknown`.",
    },
    verified: true,
  },

  // ----------------------------------------------------
  // Node.js Questions (mcq, output, debug, approach)
  // ----------------------------------------------------
  {
    id: "node-output-microtask-order",
    skill: "Node.js",
    type: "output",
    difficulty: 2,
    stem: "In what exact order will the console log messages appear in Node.js?",
    code: `const log: string[] = [];

setTimeout(() => log.push("timeout"), 0);
Promise.resolve().then(() => log.push("promise"));
process.nextTick(() => log.push("nextTick"));
log.push("sync");

// When synchronous code finishes and microtasks drain:
// What is the order of log entries?`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "['sync', 'timeout', 'promise', 'nextTick']" },
      { id: "opt-b", text: "['sync', 'nextTick', 'promise', 'timeout']" },
      { id: "opt-c", text: "['nextTick', 'promise', 'sync', 'timeout']" },
      { id: "opt-d", text: "['sync', 'promise', 'nextTick', 'timeout']" },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Execution order in Node.js: 1) Synchronous script code executes ('sync'). 2) `process.nextTick` queue runs before other microtasks ('nextTick'). 3) Promise microtask queue executes ('promise'). 4) Event loop moves to timers phase for `setTimeout` ('timeout').",
      distractors: {
        "opt-a": "`setTimeout` is queued in the timers macrotask phase and runs only after all synchronous code and microtasks have completed.",
        "opt-c": "Synchronous code always executes first before any asynchronous queues are polled.",
        "opt-d": "In Node.js, `process.nextTick` has higher priority than standard Promise job microtasks.",
      },
      takeaway: "In Node.js: Synchronous → process.nextTick → Promise microtasks → Event loop macrotasks (Timers/IO/Check).",
    },
    verified: true,
  },
  {
    id: "node-debug-event-emitter-leak",
    skill: "Node.js",
    type: "debug",
    difficulty: 2,
    stem: "Spot the memory leak in this high-throughput HTTP request handler:",
    code: `import { EventEmitter } from "events";
const bus = new EventEmitter();

export function handleRequest(req, res) {
  bus.on("notification", (msg) => {
    if (msg.userId === req.userId) {
      res.write(JSON.stringify(msg));
    }
  });
  // ... rest of handler
}`,
    codeLanguage: "typescript",
    options: [
      { id: "opt-a", text: "res.write is deprecated in Node.js HTTP servers." },
      { id: "opt-b", text: "Each incoming request registers a new listener on 'bus' that is never removed when the request closes, causing unbounded memory growth and MaxListenersExceeded warnings." },
      { id: "opt-c", text: "EventEmitter instances must be scoped to worker threads only." },
      { id: "opt-d", text: "JSON.stringify throws errors on asynchronous messages." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "The `bus` is a long-lived singleton. Every HTTP request appends a new listener retaining references to `req` and `res` in its closure. When requests finish, those closures remain retained in the `bus` listener array forever.",
      distractors: {
        "opt-a": "`res.write` is the standard streaming method for HTTP responses.",
        "opt-c": "EventEmitters are commonly used on the main thread for pub/sub messaging.",
        "opt-d": "`JSON.stringify` works synchronously and correctly on plain JSON serializable objects.",
      },
      takeaway: "Always remove event listeners on `req.on('close', ...)` or use `AbortSignal` with `bus.on('event', fn, { signal })`.",
    },
    verified: true,
  },
  {
    id: "node-approach-cpu-intensive",
    skill: "Node.js",
    type: "approach",
    difficulty: 3,
    stem: "Your Node.js API server needs to generate cryptographic zero-knowledge proofs and PDF exports (taking 2–4 seconds of intensive CPU). How should this be structured to protect API latency?",
    options: [
      { id: "opt-a", text: "Execute the cryptographic work directly in an async function on the main thread with Promise.all." },
      { id: "opt-b", text: "Offload CPU-bound tasks to a Worker Thread pool or separate background queue workers (e.g. BullMQ / Redis), keeping the main event loop non-blocking for I/O." },
      { id: "opt-c", text: "Wrap the synchronous work in process.nextTick to bypass the event loop." },
      { id: "opt-d", text: "Increase the V8 heap limit to 16GB with --max-old-space-size." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Node.js runs application JavaScript on a single thread. CPU-intensive operations block the event loop, freezing all concurrent HTTP requests. Worker threads or background queue worker processes isolate heavy computations on separate threads/cores.",
      distractors: {
        "opt-a": "Promises and `async/await` do not create new threads; CPU computation inside them still blocks the single main thread.",
        "opt-c": "`process.nextTick` starves the event loop even more aggressively, blocking I/O completely.",
        "opt-d": "Heap limits provide memory capacity, not CPU concurrency or thread offloading.",
      },
      takeaway: "Single-threaded event loop for I/O; Worker Threads or message queues for intensive CPU tasks.",
    },
    verified: true,
  },

  // ----------------------------------------------------
  // PostgreSQL Questions (mcq, output, debug, approach)
  // ----------------------------------------------------
  {
    id: "postgres-mcq-isolation-levels",
    skill: "PostgreSQL",
    type: "mcq",
    difficulty: 2,
    stem: "What concurrency anomaly can still occur under PostgreSQL's default 'Read Committed' transaction isolation level?",
    options: [
      { id: "opt-a", text: "Dirty Read (reading uncommitted rows from another in-flight transaction)" },
      { id: "opt-b", text: "Non-repeatable Read (re-reading the same row within a transaction returns different values because another transaction committed an update)" },
      { id: "opt-c", text: "Write Skew across multiple tables" },
      { id: "opt-d", text: "Database file corruption" },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Under Read Committed, PostgreSQL produces a new snapshot for each individual query within the transaction. If another transaction commits an update between query 1 and query 2, query 2 sees the new data, creating a non-repeatable read.",
      distractors: {
        "opt-a": "PostgreSQL MVCC prevents Dirty Reads at all isolation levels, including Read Committed.",
        "opt-c": "Write Skew is an anomaly discussed under Repeatable Read; Read Committed suffers from simpler non-repeatable reads.",
        "opt-d": "ACID transaction isolation has nothing to do with database file corruption.",
      },
      takeaway: "Use 'Repeatable Read' or 'Serializable' isolation when a transaction requires point-in-time consistency across multiple queries.",
    },
    verified: true,
  },
  {
    id: "postgres-output-null-comparisons",
    skill: "PostgreSQL",
    type: "output",
    difficulty: 1,
    stem: "In PostgreSQL SQL, what is the result count returned by the query `SELECT * FROM users WHERE status != 'active'` if the table has 5 rows: 3 'active', 1 'suspended', and 1 with NULL status?",
    code: `-- Table contains:
-- row 1: status = 'active'
-- row 2: status = 'active'
-- row 3: status = 'active'
-- row 4: status = 'suspended'
-- row 5: status = NULL

SELECT count(*) FROM users WHERE status != 'active';`,
    codeLanguage: "sql",
    options: [
      { id: "opt-a", text: "2 (rows 4 and 5)" },
      { id: "opt-b", text: "1 (only row 4, because NULL != 'active' evaluates to NULL/Unknown which evaluates to false in WHERE clauses)" },
      { id: "opt-c", text: "0" },
      { id: "opt-d", text: "5" },
    ],
    correctId: "opt-b",
    explanation: {
      why: "SQL uses three-valued logic (TRUE, FALSE, UNKNOWN/NULL). Any equality or inequality comparison with `NULL` (such as `NULL != 'active'`) produces `UNKNOWN`, which is treated as false by WHERE filters. Only row 4 matches.",
      distractors: {
        "opt-a": "Row 5 has `status = NULL`, which does NOT satisfy `!= 'active'`. To include NULLs, one must write `WHERE status != 'active' OR status IS NULL`.",
        "opt-c": "Row 4 has `'suspended'`, which is definitely not `'active'`, so count is at least 1.",
        "opt-d": "The 3 active rows fail the inequality check.",
      },
      takeaway: "In SQL, NULL comparisons evaluate to UNKNOWN; use `IS DISTINCT FROM` or `OR col IS NULL` when filtering nullable columns.",
    },
    verified: true,
  },
  {
    id: "postgres-approach-optimistic-locking",
    skill: "PostgreSQL",
    type: "approach",
    difficulty: 2,
    stem: "Two concurrent users attempt to edit the same record in a collaborative tool. How should you prevent lost updates with minimal locking overhead?",
    options: [
      { id: "opt-a", text: "Lock the entire table with 'LOCK TABLE users IN ACCESS EXCLUSIVE MODE' before every edit." },
      { id: "opt-b", text: "Use Optimistic Concurrency Control with a version integer or timestamp column: 'UPDATE items SET content = $1, version = version + 1 WHERE id = $2 AND version = $3'. Check that affected rows == 1." },
      { id: "opt-c", text: "Disable transactions in the database configuration." },
      { id: "opt-d", text: "Accept whichever request finishes last and overwrite unconditionally." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Optimistic Concurrency Control (OCC) avoids costly database row locks. By verifying `version = expectedVersion` at update time, the second transaction sees 0 rows affected and can return a graceful conflict error (HTTP 409).",
      distractors: {
        "opt-a": "Table-level exclusive locks kill database concurrency and bottleneck all users.",
        "opt-c": "Disabling transactions destroys ACID guarantees and consistency.",
        "opt-d": "Unconditional overwrites cause the classic 'Lost Update' bug, destroying user edits.",
      },
      takeaway: "Use OCC (`WHERE id = ? AND version = ?`) for low-contention web edits to scale concurrency cleanly.",
    },
    verified: true,
  },

  // ----------------------------------------------------
  // Redis & System Design Questions (mcq, debug, approach)
  // ----------------------------------------------------
  {
    id: "redis-mcq-eviction-policies",
    skill: "Redis",
    type: "mcq",
    difficulty: 2,
    stem: "Which Redis eviction policy should you choose if you use Redis both as an ephemeral cache and for persistent background job queues, and you only want keys with an explicit expiration (TTL) to be evicted when memory is full?",
    options: [
      { id: "opt-a", text: "allkeys-lru" },
      { id: "opt-b", text: "volatile-lru" },
      { id: "opt-c", text: "noeviction" },
      { id: "opt-d", text: "allkeys-random" },
    ],
    correctId: "opt-b",
    explanation: {
      why: "`volatile-lru` evicts the least recently used keys among those that have an expire (TTL) set. Keys without an expiration (such as persistent queue structures) are protected from eviction.",
      distractors: {
        "opt-a": "`allkeys-lru` evicts any key regardless of whether it has a TTL, which could delete queue metadata.",
        "opt-c": "`noeviction` rejects all write commands with an error once memory limits are hit.",
        "opt-d": "`allkeys-random` randomly removes any key without considering TTL or access frequency.",
      },
      takeaway: "Use `volatile-lru` when mixing ephemeral cached data with persistent TTL-less keys in Redis.",
    },
    verified: true,
  },
  {
    id: "sysdesign-approach-rate-limiter",
    skill: "System Design",
    type: "approach",
    difficulty: 3,
    stem: "You are designing a distributed rate limiter for a public API gateway handling 100,000 req/sec. You need to allow burst traffic while strictly enforcing a 100 req/minute limit across distributed gateway nodes. What is the optimal architecture?",
    options: [
      { id: "opt-a", text: "Store request timestamps in a local in-memory array on each individual API server node." },
      { id: "opt-b", text: "Use Redis with a Token Bucket or Sliding Window Counter implemented via an atomic Lua script (or Redis Cell module) with key sharding by client IP / API key." },
      { id: "opt-c", text: "Write an INSERT into a PostgreSQL database table on every HTTP request and run SELECT COUNT(*) over the last 60 seconds." },
      { id: "opt-d", text: "Rely solely on client-side HTTP retry-after headers without server enforcement." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Redis provides sub-millisecond in-memory atomic execution. A Lua script executes atomically on the Redis server without distributed race conditions, while sharding by client key scales horizontal throughput across Redis cluster nodes.",
      distractors: {
        "opt-a": "Local in-memory counters cannot synchronize rate limits across multiple distributed gateway instances.",
        "opt-c": "Inserting 100k rows/sec into a relational database to run aggregate counts will saturate disk I/O and CPU.",
        "opt-d": "Clients can be adversarial; server-side enforcement is required for API security.",
      },
      takeaway: "Atomic Redis Lua scripts or Sliding Window Counters provide distributed, low-latency rate limiting.",
    },
    verified: true,
  },
  {
    id: "docker-debug-cache-invalidation",
    skill: "Docker",
    type: "debug",
    difficulty: 2,
    stem: "Why does this Dockerfile cause painfully slow build times during development whenever any source file is modified?",
    code: `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "server.js"]`,
    codeLanguage: "dockerfile",
    options: [
      { id: "opt-a", text: "Node 20 alpine does not support npm install." },
      { id: "opt-b", text: "COPY . . appears before npm install, which invalidates the Docker build cache for the expensive npm install layer whenever any local file (e.g. README or source) changes." },
      { id: "opt-c", text: "WORKDIR /app requires root privileges." },
      { id: "opt-d", text: "CMD must be specified before RUN." },
    ],
    correctId: "opt-b",
    explanation: {
      why: "Docker caches image layers from top to bottom. If `COPY . .` runs before `RUN npm install`, modifying even a single character in source code changes the layer checksum, busting cache for all subsequent steps and forcing a full `npm install` from scratch.",
      distractors: {
        "opt-a": "The official `node:20-alpine` image includes `npm` out of the box.",
        "opt-c": "Docker defaults to root during image build unless `USER` is specified; `/app` can be created without error.",
        "opt-d": "`CMD` specifies the runtime container entrypoint and is conventionally placed at the end.",
      },
      takeaway: "Copy dependency manifests first (`COPY package*.json ./`), run `npm install`, then copy application source code.",
    },
    verified: true,
  },
];
