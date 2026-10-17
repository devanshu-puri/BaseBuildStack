import { M2Question } from "../question-schema";

export const LANGUAGE_QUESTIONS: M2Question[] = [
  // --- JAVASCRIPT ---
  {
    id: "m2-js-001",
    skillId: "javascript",
    topic: "event-loop",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "When both a resolved `Promise.then` callback (microtask) and a `setTimeout(fn, 0)` callback (macrotask/task) are queued in the Node.js or browser runtime, what is the exact execution order?",
    options: [
      {
        id: "A",
        text: "The microtask executes immediately after the current synchronous script finishes, before the macrotask.",
      },
      {
        id: "B",
        text: "The macrotask executes first because timers have priority in the event loop phases.",
      },
      {
        id: "C",
        text: "They are interleaved in FIFO order based on the exact timestamp they were queued.",
      },
      {
        id: "D",
        text: "Microtasks are only evaluated when the macrotask queue is completely empty.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "The JavaScript event loop drains the entire microtask queue (Promises, queueMicrotask) immediately at the end of the current execution frame and after every individual macrotask, before picking the next task.",
      whyWrong: {
        B: "Timers run in the timers phase of the event loop, but microtasks drain immediately before transitioning to or finishing tasks.",
        C: "Microtasks and macrotasks belong to distinct priority queues; they are never interleaved purely by chronological arrival.",
        D: "Microtasks execute after each macrotask completes, not only when the entire macrotask queue is drained.",
      },
      interviewTakeaway:
        "State clearly: 'Microtasks (Promises) preempt macrotasks (setTimeout/setInterval). The runtime empties the microtask queue between every task.'",
      followUp:
        "How does process.nextTick in Node.js compare to Promise microtasks?",
    },
    tags: ["event-loop", "microtasks", "concurrency"],
    sourceRefs: ["https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-js-002",
    skillId: "javascript",
    topic: "closures",
    mode: ["skill_drill"],
    difficulty: "basic",
    type: "output",
    interviewFrequency: 4,
    prompt: "What will be printed to the console when this script executes?",
    code: {
      language: "javascript",
      source: `const arr = [];
for (var i = 0; i < 3; i++) {
  arr.push(() => i);
}
console.log(arr.map(fn => fn()).join(","));`,
    },
    options: [
      { id: "A", text: "3,3,3" },
      { id: "B", text: "0,1,2" },
      { id: "C", text: "undefined,undefined,undefined" },
      { id: "D", text: "2,2,2" },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: true,
    expectedOutput: "3,3,3",
    explanation: {
      whyCorrect:
        "Because `var` is function-scoped (or globally scoped here), all 3 closures capture a reference to the exact same variable `i`. When the loop finishes, `i === 3`. Invoking them afterwards returns 3 for each element.",
      whyWrong: {
        B: "This would only occur if `let i = 0` were used, which creates a separate block-scoped binding for each iteration.",
        C: "Variable `i` was hoisted and assigned numbers up to 3; it is never undefined.",
        D: "The loop terminates when `i < 3` fails, which means `i` has incremented to 3, not 2.",
      },
      interviewTakeaway:
        "Contrast `var` hoisting and function scoping with `let` block scoping in loop iterations.",
      followUp:
        "What are two distinct ways to preserve the iteration value without changing `var` to `let`? (IIFE closure or passing `i` as argument)",
    },
    tags: ["closures", "scoping", "var-let"],
    sourceRefs: ["ECMAScript Specification: Lexical Environments"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-js-003",
    skillId: "javascript",
    topic: "prototypes",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "What is the key functional difference between `Object.create(proto)` and `new ConstructorFunc()` in JavaScript?",
    options: [
      {
        id: "A",
        text: "`Object.create(proto)` directly creates a new object with the specified prototype without executing a constructor function.",
      },
      {
        id: "B",
        text: "`Object.create` copies properties by value, whereas `new` establishes prototype delegation.",
      },
      {
        id: "C",
        text: "`Object.create` creates an immutable prototype chain that cannot be inspected via Object.getPrototypeOf.",
      },
      {
        id: "D",
        text: "`new` executes in strict mode automatically, whereas `Object.create` executes in sloppy mode.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`Object.create(proto)` sets the internal `[[Prototype]]` link directly to `proto` without invoking any constructor logic or side-effects, unlike `new Constructor()` which runs the constructor body with `this` bound to the new instance.",
      whyWrong: {
        B: "`Object.create` does not copy properties; it sets up runtime prototype delegation.",
        C: "Prototypes created via `Object.create` are standard dynamic objects and can be inspected via `Object.getPrototypeOf()`.",
        D: "Strict mode is governed by script/module directives, not the instantiation syntax.",
      },
      interviewTakeaway:
        "Explain prototype delegation: `Object.create(null)` is also the idiomatic way to create pure dictionary objects with no prototype overhead.",
    },
    tags: ["prototype", "inheritance", "object-model"],
    sourceRefs: ["MDN Object.create"],
    version: 1,
    status: "published",
  },

  // --- TYPESCRIPT ---
  {
    id: "m2-ts-001",
    skillId: "typescript",
    topic: "type-narrowing",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "Which TypeScript construct is used to define a custom type guard function that narrows a generic `unknown` input to a specific type at runtime?",
    options: [
      { id: "A", text: "A return type predicate in the form `arg is TargetType`" },
      { id: "B", text: "The `as TargetType` type assertion syntax" },
      { id: "C", text: "The `satisfies TargetType` operator" },
      { id: "D", text: "Declaring the function with `asserts val === TargetType`" },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "A user-defined type guard function returns a boolean and specifies a type predicate `paramName is Type` as its return type. When it returns `true`, TypeScript narrows the variable within the conditional block.",
      whyWrong: {
        B: "`as TargetType` is a compiler type cast; it does not perform runtime checking or branch narrowing.",
        C: "`satisfies` checks that an expression matches a type without widening its inferred type; it is not a narrowing predicate.",
        D: "Assertion functions use `asserts val is TargetType`, but type guard predicates return a boolean.",
      },
      interviewTakeaway:
        "Show fluency in discrimination: explain how `is` predicates bridge runtime boolean validation with compile-time type narrowing.",
    },
    tags: ["type-guards", "narrowing", "type-predicates"],
    sourceRefs: ["TypeScript Handbook: Narrowing"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-ts-002",
    skillId: "typescript",
    topic: "generics-conditional",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "What is the inferred type of `Result` in the following TypeScript snippet?\n\n```typescript\ntype Diff<T, U> = T extends U ? never : T;\ntype Result = Diff<'a' | 'b' | 'c', 'a' | 'd'>;\n```",
    options: [
      { id: "A", text: "'b' | 'c'" },
      { id: "B", text: "'a'" },
      { id: "C", text: "never" },
      { id: "D", text: "'b' | 'c' | 'd'" },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Conditional types are distributive over naked type parameters in unions. TypeScript evaluates each union member separately: `Diff<'a', 'a'|'d'>` -> `never`, `Diff<'b', 'a'|'d'>` -> `'b'`, `Diff<'c', 'a'|'d'>` -> `'c'`. The resulting union `'b' | 'c' | never` simplifies to `'b' | 'c'`.",
      whyWrong: {
        B: "'a' extends 'a' | 'd', so it evaluates to `never`.",
        C: "Only 'a' evaluates to `never`; 'b' and 'c' do not extend 'a' | 'd'.",
        D: "'d' is in U but not in T, so it is never produced as a resulting branch.",
      },
      interviewTakeaway:
        "Understand distributive conditional types: this is the exact implementation behind TypeScript's built-in `Exclude<T, U>` utility type.",
    },
    tags: ["conditional-types", "distributive", "generics"],
    sourceRefs: ["TypeScript Handbook: Conditional Types"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-ts-003",
    skillId: "typescript",
    topic: "utility-types",
    mode: ["skill_drill"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 4,
    prompt:
      "You need to type a database repository method that accepts an entity update payload where `id` is required, but every other property from `User` is optional. What is the cleanest idiomatic TypeScript combination?",
    options: [
      {
        id: "A",
        text: "`Pick<User, 'id'> & Partial<Omit<User, 'id'>>`",
      },
      {
        id: "B",
        text: "`Partial<User> | Pick<User, 'id'>`",
      },
      {
        id: "C",
        text: "`Record<keyof User, unknown> & { id: string }`",
      },
      {
        id: "D",
        text: "`Required<User> & Partial<User>`",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`Pick<User, 'id'>` guarantees `id` is present and required. Intersecting with `Partial<Omit<User, 'id'>>` takes all remaining fields of `User` and marks them optional while preserving their original value types.",
      whyWrong: {
        B: "Union `|` means the object could satisfy `Partial<User>` alone without providing an `id`.",
        C: "This destroys the specific property type definitions by casting them to `unknown`.",
        D: "Intersection of `Required<User>` and `Partial<User>` results in `Required<User>` because required constraints override partial ones.",
      },
      interviewTakeaway:
        "Combining `Pick`, `Omit`, and `Partial` via intersections is a hallmark pattern in API contracts and database repository typing.",
    },
    tags: ["utility-types", "type-composition", "api-design"],
    sourceRefs: ["TypeScript Handbook: Utility Types"],
    version: 1,
    status: "published",
  },

  // --- PYTHON ---
  {
    id: "m2-py-001",
    skillId: "python",
    topic: "mutable-defaults",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "What is the danger of using a mutable object (like a list or dict) as a default argument in a Python function definition?",
    options: [
      {
        id: "A",
        text: "The default value is evaluated once at function definition time, so mutations persist across all future invocations.",
      },
      {
        id: "B",
        text: "Python raises a TypeError at import time if a mutable object is passed as a default parameter.",
      },
      {
        id: "C",
        text: "The function becomes non-reentrant because Python locks the GIL whenever default arguments are evaluated.",
      },
      {
        id: "D",
        text: "Mutable defaults are copied by value on each call, leading to unexpected memory overhead.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "In Python, default arguments are evaluated once when the `def` statement is executed, not on each function call. If the function mutates the default argument (e.g. `items.append(x)`), that mutation affects all subsequent calls that omit the argument.",
      whyWrong: {
        B: "Python allows mutable defaults syntactically; no error is raised at definition time.",
        C: "Default arguments do not cause GIL deadlocks or threading locks.",
        D: "Python binds defaults by reference, not by value; it does not clone them on each call.",
      },
      interviewTakeaway:
        "Always use `def fn(items=None): if items is None: items = []` as the idiomatic, safe alternative.",
    },
    tags: ["mutable-defaults", "python-gotchas", "functions"],
    sourceRefs: ["Python Anti-Patterns: Mutable Default Arguments"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-py-002",
    skillId: "python",
    topic: "gil-concurrency",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "You have a CPU-intensive data crunching workload in CPython (e.g., matrix calculations without NumPy/C extensions). Why does using Python's standard `threading.Thread` fail to provide a multi-core speedup?",
    options: [
      {
        id: "A",
        text: "The Global Interpreter Lock (GIL) ensures that only one native thread executes Python bytecode at any single moment.",
      },
      {
        id: "B",
        text: "Python threads are green threads that cannot be scheduled onto physical OS cores.",
      },
      {
        id: "C",
        text: "CPU operations disable OS context switches until explicit `time.sleep()` yields occur.",
      },
      {
        id: "D",
        text: "CPython allocates thread memory from a single-threaded heap that segfaults on parallel writes.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "The GIL is a mutex that prevents multiple physical threads from executing CPython bytecode simultaneously. For CPU-bound tasks, Python threads contend for the GIL and execute serially (often running slower due to lock contention overhead). For multi-core CPU scaling, `multiprocessing` or C extensions releasing the GIL are required.",
      whyWrong: {
        B: "Python threads are real OS threads (pthread / Windows threads), but their bytecode execution is serialized by the GIL.",
        C: "CPython uses preemptive time-slice switching for threads, not purely cooperative yields.",
        D: "Thread safety in Python is managed via reference counting and the GIL, not a segregated crash-prone heap.",
      },
      interviewTakeaway:
        "Categorize concurrency: IO-bound = `asyncio` or `threading`; CPU-bound = `multiprocessing`, Ray, or native C/Rust extensions releasing the GIL.",
    },
    tags: ["gil", "concurrency", "multiprocessing"],
    sourceRefs: ["CPython Internals: Global Interpreter Lock"],
    version: 1,
    status: "published",
  },

  // --- GO ---
  {
    id: "m2-go-001",
    skillId: "go",
    topic: "goroutines-channels",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "What happens when a goroutine sends a value to an unbuffered Go channel (`ch := make(chan int)`) with no receiver currently ready?",
    options: [
      {
        id: "A",
        text: "The sending goroutine blocks until another goroutine executes a receive operation on the channel.",
      },
      {
        id: "B",
        text: "The send operation panics immediately with `channel overflow`.",
      },
      {
        id: "C",
        text: "The value is dropped silently and execution proceeds.",
      },
      {
        id: "D",
        text: "The runtime spawns an ephemeral worker goroutine to hold the payload.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Unbuffered channels provide synchronous handoff semantics. A send blocks until a receiver is ready to read, and a receive blocks until a sender is ready to write.",
      whyWrong: {
        B: "Sending to an unbuffered channel blocks, it does not panic. Panic only occurs when sending to a closed channel.",
        C: "Go channels guarantee delivery; values are never dropped silently.",
        D: "The Go runtime scheduler suspends the current goroutine without spawning background holding workers.",
      },
      interviewTakeaway:
        "Differentiate unbuffered channels (synchronization and rendezvous) from buffered channels (decoupling producer and consumer rates up to buffer size).",
    },
    tags: ["channels", "concurrency", "synchronization"],
    sourceRefs: ["Effective Go: Channels"],
    version: 1,
    status: "published",
  },

  // --- JAVA ---
  {
    id: "m2-java-001",
    skillId: "java",
    topic: "memory-model",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "In Java concurrency, what does marking a field as `volatile` guarantee according to the Java Memory Model (JMM)?",
    options: [
      {
        id: "A",
        text: "Visibility of writes across threads and prevention of instruction reordering around reads/writes (happens-before relation).",
      },
      {
        id: "B",
        text: "Mutual exclusion and atomic composite operations like `count++`.",
      },
      {
        id: "C",
        text: "Automatic pinning of the object in JVM Eden space to prevent garbage collection.",
      },
      {
        id: "D",
        text: "Deep immutability for all fields reachable through the reference.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`volatile` ensures that any thread reading the field immediately sees the most recently written value (memory visibility via CPU cache invalidation/memory barriers) and prevents instruction reordering. It does NOT guarantee compound atomicity like `count++` (which requires `AtomicInteger` or `synchronized`).",
      whyWrong: {
        B: "Volatile does NOT make compound operations atomic. `i++` is a read-modify-write operation requiring synchronization.",
        C: "GC memory management is completely orthogonal to thread visibility qualifiers.",
        D: "`volatile` only applies to the reference itself, not the internal state of the referenced object.",
      },
      interviewTakeaway:
        "Be crystal clear: volatile = visibility + ordering; synchronized/locks = visibility + ordering + atomicity.",
    },
    tags: ["jmm", "concurrency", "volatile"],
    sourceRefs: ["Java Language Specification: Chapter 17 Threads and Locks"],
    version: 1,
    status: "published",
  },

  // --- C++ ---
  {
    id: "m2-cpp-001",
    skillId: "cpp",
    topic: "smart-pointers",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "When using `std::shared_ptr` in modern C++, what problem does `std::weak_ptr` specifically resolve?",
    options: [
      {
        id: "A",
        text: "Breaking cyclic reference dependencies that prevent reference counts from ever reaching zero, leading to memory leaks.",
      },
      {
        id: "B",
        text: "Allowing raw pointer arithmetic on managed memory blocks.",
      },
      {
        id: "C",
        text: "Converting unmanaged heap allocations into compile-time stack variables.",
      },
      {
        id: "D",
        text: "Speeding up pointer dereferences by bypassing CPU L1 cache validation.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "If two objects hold `std::shared_ptr` references to each other, their reference count never drops to zero, leaking the memory. `std::weak_ptr` holds a non-owning observer reference without incrementing the strong reference count, breaking the cycle.",
      whyWrong: {
        B: "`std::weak_ptr` does not support raw pointer arithmetic; it must be converted to `std::shared_ptr` via `.lock()` to be accessed.",
        C: "Weak pointers manage heap objects, not stack conversions.",
        D: "Weak pointer dereferences require calling `.lock()` and checking validity, incurring small overhead, not hardware cache bypass.",
      },
      interviewTakeaway:
        "Highlight RAII: use `unique_ptr` by default (zero overhead); use `shared_ptr` for shared ownership; use `weak_ptr` for caches and cyclic parent-child links.",
    },
    tags: ["smart-pointers", "raii", "memory-management"],
    sourceRefs: ["CppReference: std::weak_ptr"],
    version: 1,
    status: "published",
  },

  // --- C# ---
  {
    id: "m2-csharp-001",
    skillId: "csharp",
    topic: "async-await",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 4,
    prompt:
      "In .NET / C#, what is the primary purpose of calling `ConfigureAwait(false)` on an awaited Task in a non-UI library?",
    options: [
      {
        id: "A",
        text: "To avoid capturing the current SynchronizationContext, preventing potential deadlocks and reducing thread context switching overhead.",
      },
      {
        id: "B",
        text: "To instruct the runtime to run the task synchronously on the calling thread.",
      },
      {
        id: "C",
        text: "To cancel the task automatically if it takes longer than the default timeout.",
      },
      {
        id: "D",
        text: "To enable garbage collection of the Task object before completion.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "By default, `await` captures the ambient `SynchronizationContext` (such as in ASP.NET classic or WPF/WinForms) and marshals continuation back to that context. In library code, `ConfigureAwait(false)` avoids this overhead and eliminates synchronization context deadlocks when callers block on `.Result` or `.Wait()`.",
      whyWrong: {
        B: "It does not make execution synchronous; continuation simply resumes on any available thread pool worker.",
        C: "Timeouts are handled via `CancellationTokenSource`, not `ConfigureAwait`.",
        D: "Tasks cannot be collected while awaiting completion.",
      },
      interviewTakeaway:
        "Rule of thumb: use `ConfigureAwait(false)` in general class libraries; omit in application/UI code when needing UI thread access.",
    },
    tags: ["async-await", "tasks", "synchronization-context"],
    sourceRefs: ["Microsoft Learn: ConfigureAwait FAQ"],
    version: 1,
    status: "published",
  },
];
