import { M2Question } from "../question-schema";

export const FRONTEND_QUESTIONS: M2Question[] = [
  // --- REACT ---
  {
    id: "m2-react-001",
    skillId: "react",
    topic: "useEffect-stale-closures",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "A developer writes a timer inside a React component:\n\n```tsx\nconst [count, setCount] = useState(0);\nuseEffect(() => {\n  const id = setInterval(() => {\n    setCount(count + 1);\n  }, 1000);\n  return () => clearInterval(id);\n}, []);\n```\n\nWhy does the counter stop incrementing after reaching `1`?",
    options: [
      {
        id: "A",
        text: "The effect closure captures the initial value of `count` (0). On every tick, it continuously computes `0 + 1 = 1`.",
      },
      {
        id: "B",
        text: "React batches intervals and garbage collects timers that lack dependency arrays.",
      },
      {
        id: "C",
        text: "The cleanup function is called after the first tick, clearing the timer immediately.",
      },
      {
        id: "D",
        text: "`setInterval` is not permitted inside `useEffect` without a custom hook wrapper.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Because the dependency array is `[]`, the effect callback is created once on mount and closes over the initial render's scope where `count === 0`. Every second, `setCount(0 + 1)` runs, setting state to 1 repeatedly. The fix is either using the updater function `setCount(prev => prev + 1)` or using a mutable ref.",
      whyWrong: {
        B: "React does not cancel or batch standard JS interval timers based on dependency arrays.",
        C: "Cleanup functions only run on component unmount or before re-running the effect on dependency change.",
        D: "`setInterval` is standard browser API and completely valid inside `useEffect` when properly cleaned up.",
      },
      interviewTakeaway:
        "Explain the updater function pattern: `setCount(c => c + 1)` completely decouples state transitions from effect closures.",
      followUp:
        "When would you use `useRef` to store the latest callback instead of passing state to dependencies?",
    },
    tags: ["react", "hooks", "stale-closures", "useEffect"],
    sourceRefs: ["React Docs: Synchronizing with Effects"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-react-002",
    skillId: "react",
    topic: "fiber-reconciliation",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "mcq",
    interviewFrequency: 5,
    prompt:
      "What is the main architectural benefit of React's Fiber reconciler compared to the legacy stack reconciler?",
    options: [
      {
        id: "A",
        text: "It splits rendering work into interruptible incremental units with priority scheduling (Concurrent Mode).",
      },
      {
        id: "B",
        text: "It bypasses the Virtual DOM and writes directly to native GPU drawing buffers.",
      },
      {
        id: "C",
        text: "It eliminates JavaScript re-renders by compiling components to WebAssembly.",
      },
      {
        id: "D",
        text: "It forces all state updates to execute synchronously to prevent race conditions.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "The legacy stack reconciler performed recursive rendering that blocked the browser main thread until completion. Fiber represents the tree as a singly linked list of fibers, enabling React to pause, abort, resume, and prioritize work (e.g. user input over offscreen data fetches).",
      whyWrong: {
        B: "Fiber still reconciles Virtual DOM trees; it does not draw directly to GPUs.",
        C: "Fiber is standard JavaScript, not a WebAssembly compiler.",
        D: "Fiber was specifically engineered to support asynchronous, non-blocking concurrent rendering, not forced synchronous execution.",
      },
      interviewTakeaway:
        "Frame Fiber in terms of user experience: time-slicing keeps high-priority interactions (typing, clicking) buttery smooth even during massive tree reconciliation.",
    },
    tags: ["fiber", "reconciliation", "concurrency"],
    sourceRefs: ["React Architecture: A cartoon guide to Fiber"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-react-003",
    skillId: "react",
    topic: "useMemo-useCallback",
    mode: ["skill_drill"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "When is wrapping a callback in `useCallback` genuinely beneficial for performance?",
    options: [
      {
        id: "A",
        text: "When the callback is passed as a prop to a child component memoized with `React.memo` or used in another hook's dependency array.",
      },
      {
        id: "B",
        text: "On every single event handler in the application to prevent JavaScript function allocation overhead.",
      },
      {
        id: "C",
        text: "Only when the function performs asynchronous HTTP network requests.",
      },
      {
        id: "D",
        text: "When you want React to execute the function on a web worker thread.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`useCallback` preserves referential equality of a function between renders. It only prevents re-renders if downstream consumers actually check referential equality (e.g. `React.memo(Child)` or a `useEffect` dependency). Otherwise, the overhead of creating the array and memo checking exceeds inline allocation.",
      whyWrong: {
        B: "Wrapping every handler creates net performance degradation due to closure allocation and dependency comparison overhead.",
        C: "Asynchronous network requests do not require `useCallback` unless their identity is tracked in dependency lists.",
        D: "`useCallback` does not touch web workers; it runs entirely on the main JavaScript thread.",
      },
      interviewTakeaway:
        "Premature memoization has a cost. Mention that function allocation in V8 is extraordinarily cheap; identity stability only matters when downstream components optimize based on referential checks.",
    },
    tags: ["react", "useCallback", "useMemo", "performance"],
    sourceRefs: ["React Docs: useCallback"],
    version: 1,
    status: "published",
  },

  // --- NEXT.JS ---
  {
    id: "m2-nextjs-001",
    skillId: "nextjs",
    topic: "server-components",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "In Next.js App Router, how does a Server Component differ from a Client Component (`'use client'`)?",
    options: [
      {
        id: "A",
        text: "Server Components execute exclusively on the server, send zero JavaScript to the client bundle, and can directly access databases and secrets.",
      },
      {
        id: "B",
        text: "Server Components run on the server during build only, and cannot fetch dynamic data per request.",
      },
      {
        id: "C",
        text: "Client Components only execute in the browser and never run on the server during initial page SSR.",
      },
      {
        id: "D",
        text: "Server Components can use React hooks like `useState` and `useEffect` as long as they are rendered inside `Suspense`.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Server Components (RSC) run only on the server environment. Their dependencies and code are never included in the browser JavaScript bundle; instead, they stream an RSC payload (virtual DOM instructions) that React merges on the client. They cannot use stateful hooks or event handlers.",
      whyWrong: {
        B: "Server Components support dynamic data fetching per request (headers, cookies, `fetch` with `cache: 'no-store'`).",
        C: "Client Components are still pre-rendered on the server into HTML for initial page load (SSR) unless dynamically imported with `ssr: false`.",
        D: "Server Components cannot use interactive hooks (`useState`, `useEffect`, `useReducer`); interactivity requires `'use client'` boundary.",
      },
      interviewTakeaway:
        "Emphasize: 'Use client' marks a module boundary between server-only and client bundle code, not a switch that disables SSR.",
    },
    tags: ["nextjs", "app-router", "server-components", "rsc"],
    sourceRefs: ["Next.js Documentation: Server Components"],
    version: 1,
    status: "published",
  },
  {
    id: "m2-nextjs-002",
    skillId: "nextjs",
    topic: "caching-revalidation",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "hard",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "When using Next.js Incremental Static Regeneration (ISR) with tag-based revalidation, how does `revalidateTag('products')` behave?",
    options: [
      {
        id: "A",
        text: "It purges the tagged cache entries on-demand; subsequent requests fetch fresh data without requiring a full site redeploy.",
      },
      {
        id: "B",
        text: "It synchronously blocks all active client connections while rebuilding all HTML pages in the project.",
      },
      {
        id: "C",
        text: "It sends a WebSocket push to connected browsers forcing an immediate DOM reload.",
      },
      {
        id: "D",
        text: "It only invalidates client-side `localStorage` keys matching the tag name.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "`revalidateTag` allows targeted, event-driven cache invalidation. When data changes (e.g. CMS webhook or order placement), calling `revalidateTag` purges the corresponding cache entries, allowing fresh generation on the next request while serving stale-while-revalidate.",
      whyWrong: {
        B: "Revalidation is granular and asynchronous; it does not rebuild the entire website.",
        C: "ISR operates at the server caching layer; it does not push WebSockets to client browsers.",
        D: "Next.js cache tags apply to the server Data Cache, not client browser storage.",
      },
      interviewTakeaway:
        "Highlight the progression: Static Site Generation (SSG) -> Time-based ISR -> On-demand ISR with `revalidateTag` / `revalidatePath`.",
    },
    tags: ["nextjs", "isr", "caching", "revalidateTag"],
    sourceRefs: ["Next.js Documentation: Caching in Next.js"],
    version: 1,
    status: "published",
  },

  // --- VUE ---
  {
    id: "m2-vue-001",
    skillId: "vue",
    topic: "reactivity-proxies",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "medium",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "How did Vue 3 change its core reactivity mechanism compared to Vue 2's `Object.defineProperty`?",
    options: [
      {
        id: "A",
        text: "Vue 3 uses ES6 `Proxy`, enabling detection of newly added properties, deleted properties, and array index assignments.",
      },
      {
        id: "B",
        text: "Vue 3 replaced runtime reactivity with a compile-time Svelte-like compiler that outputs direct DOM mutations.",
      },
      {
        id: "C",
        text: "Vue 3 uses dirty checking on every animation frame similar to AngularJS.",
      },
      {
        id: "D",
        text: "Vue 3 requires explicit `.set()` calls on all reactive state objects.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Vue 2's `Object.defineProperty` required walking object keys recursively upfront and could not detect dynamic property additions or array mutations by index (requiring `Vue.set`). Vue 3's `Proxy` intercepts operations on the object level lazily, removing all those caveats.",
      whyWrong: {
        B: "Vue 3 retains a Virtual DOM and reactive runtime; it is not a compiler-only framework like Svelte.",
        C: "Vue uses fine-grained dependency tracking (`track` and `trigger`), not brute-force dirty checking.",
        D: "Vue 3 eliminated the need for `Vue.set`; standard JavaScript assignment is natively reactive.",
      },
      interviewTakeaway:
        "Contrast `ref` (wrapping primitives in an object with a `.value` getter/setter) with `reactive` (wrapping collections in an ES6 Proxy).",
    },
    tags: ["vue", "reactivity", "proxy", "composition-api"],
    sourceRefs: ["Vue 3 Documentation: Reactivity in Depth"],
    version: 1,
    status: "published",
  },

  // --- HTML & CSS ---
  {
    id: "m2-html-css-001",
    skillId: "html-css",
    topic: "box-sizing-stacking",
    mode: ["skill_drill", "core_fundamentals"],
    difficulty: "basic",
    type: "concept_scenario",
    interviewFrequency: 5,
    prompt:
      "Why is `box-sizing: border-box;` universally included in modern CSS resets (e.g. `*, *::before, *::after { box-sizing: border-box; }`)?",
    options: [
      {
        id: "A",
        text: "It includes padding and border within the element's specified width and height, preventing layout breakage when styling elements.",
      },
      {
        id: "B",
        text: "It forces elements to render as flex containers by default.",
      },
      {
        id: "C",
        text: "It enables GPU acceleration and subpixel antialiasing for text rendering.",
      },
      {
        id: "D",
        text: "It collapses adjacent vertical margins automatically across all block elements.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Under the default `content-box` model, specifying `width: 100%` and adding `padding: 16px` results in a total element width of `100% + 32px`, breaking layouts with horizontal scroll. With `border-box`, `width` encompasses content + padding + border.",
      whyWrong: {
        B: "Display mode remains block/inline unless explicitly changed via `display: flex`.",
        C: "GPU acceleration is triggered by `transform: translateZ(0)` or `will-change`, not `box-sizing`.",
        D: "Margin collapsing behavior is governed by block formatting contexts, not box sizing.",
      },
      interviewTakeaway:
        "Every frontend engineer should know the CSS box model calculation: `content-box` (width = content only) vs `border-box` (width = content + padding + border).",
    },
    tags: ["css", "box-model", "border-box", "layout"],
    sourceRefs: ["MDN: box-sizing"],
    version: 1,
    status: "published",
  },

  // --- TAILWIND CSS ---
  {
    id: "m2-tailwind-001",
    skillId: "tailwind-css",
    topic: "purging-jit",
    mode: ["skill_drill"],
    difficulty: "basic",
    type: "mcq",
    interviewFrequency: 4,
    prompt:
      "Why does dynamically constructing class names like `class={\`bg-\${color}-500\`}` break in production Tailwind CSS builds?",
    options: [
      {
        id: "A",
        text: "Tailwind's build engine scans source files as raw text using regular expressions; it cannot execute dynamic string interpolation at build time.",
      },
      {
        id: "B",
        text: "Tailwind only permits hex color codes in template literals.",
      },
      {
        id: "C",
        text: "CSS variables must always be imported using the `@import` directive.",
      },
      {
        id: "D",
        text: "The browser's CSS parser rejects hyphens inside template string expressions.",
      },
    ],
    correctOptionIds: ["A"],
    lockOptionOrder: false,
    explanation: {
      whyCorrect:
        "Tailwind's scanner does not run code or evaluate JavaScript templates. It looks for complete, unbroken class name strings (like `bg-red-500` or `bg-blue-500`) in source code. Any class generated by string concatenation is not detected and therefore purged from the generated CSS file.",
      whyWrong: {
        B: "Tailwind supports named color utilities, arbitrary values `bg-[#123456]`, and CSS variables.",
        C: "Tailwind utilities are compiled ahead of time or via PostCSS/LightningCSS, not client `@import`.",
        D: "The browser parser never sees the JS template string; the issue is on the build/compiler side.",
      },
      interviewTakeaway:
        "Always write complete class names (e.g. mapping `const colorClasses = { red: 'bg-red-500', blue: 'bg-blue-500' }`) or use safelist config.",
    },
    tags: ["tailwind", "jit", "purging", "build-pipeline"],
    sourceRefs: ["Tailwind CSS Docs: Dynamic Class Names"],
    version: 1,
    status: "published",
  },
];
