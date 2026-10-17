# Module II: Interview Quizzes & Personalized Drills — Developer & Authoring Guide

Module II provides candidate-grounded technical interview preparation across four distinct modes:
1. **Skill Drills** (`/quiz/drills`): Interactive, targeted MCQs with soft-timer pacing, bookmarks, and comprehensive 5-part feedback.
2. **Core Fundamentals** (`/quiz/fundamentals`): High-frequency interview concept and mechanism questions.
3. **Practical & Debugging** (`/quiz/practical`): Click-the-buggy-line production incident triage with sandbox-verified diff fixes and distractor explanations.
4. **Project Interview Panel** (`/quiz/projects`): STAR-method architecture, trade-offs, and failure-mode questions grounded in the candidate's real resume projects.

---

## 1. Question Bank Authoring

Question bank files are stored under `src/content/m2/data/`. Every question must strictly conform to `M2QuestionSchema` defined in `src/content/m2/question-schema.ts`.

### Canonical Question Structure

```typescript
import { M2Question } from "../question-schema";

export const sampleQuestion: M2Question = {
  id: "m2_react_sample_01",
  skillId: "react",
  subtopic: "React 19 Hooks",
  difficulty: "medium", // "basic" | "medium" | "hard"
  format: "mcq",        // "mcq" | "output_prediction" | "bug_hunt" | "fill_code"
  prompt: "What is the primary architectural purpose of `useActionState` in React 19?",
  codeSnippet: {
    language: "typescript",
    code: "const [state, formAction, isPending] = useActionState(updateName, null);",
  },
  options: [
    {
      id: "opt_a",
      text: "It manages optimistic UI updates before network responses return.",
      whyWrong: "`useOptimistic` manages optimistic UI updates, not `useActionState`.",
    },
    {
      id: "opt_b",
      text: "It wraps async form actions, providing current state and an `isPending` transition flag automatically.",
    },
  ],
  correctOptionId: "opt_b",
  explanation: {
    coreConcept: "`useActionState` is React 19's native primitive for managing async action state in forms without manual pending flags.",
    whyRight: "It binds to an async action and exposes `isPending`, the current state, and the dispatcher.",
    distractorAnalysis: "Distractors represent common hook confusions such as `useOptimistic` and `useTransition`.",
    interviewTakeaway: "In React technical rounds, highlight how `useActionState` eliminates boilerplate `try/catch` and `setIsLoading(true)` state synchronizations.",
  },
  commonTraps: [
    "Confusing `useActionState` with `useOptimistic`.",
  ],
  interviewFollowUps: [
    "How does `useActionState` cooperate with progressive enhancement in Server Components?",
  ],
  status: "published",
  version: 1,
};
```

---

## 2. Automated Verification & CLI Validation

BaseBuildStack includes an automated question validation pipeline featuring Zod boundary validation, option integrity checks, and Node worker thread sandboxed code execution.

Run the validator via npm:
```bash
npm run verify:m2-questions
```

### What the validator checks:
1. **Schema Compliance**: Matches `M2QuestionSchema` with valid skill IDs from `SKILL_TAXONOMY`.
2. **Option Integrity**:
   - `correctOptionId` must exist in `options`.
   - Every wrong option (distractor) **MUST** provide a non-empty `whyWrong` explanation.
   - Option texts and IDs must be strictly unique within the question.
3. **Sandbox Execution**:
   - For `output_prediction` questions with JavaScript/TypeScript snippets, the snippet is executed inside an isolated Node worker thread sandbox (`src/lib/m2/question-validator.ts`) to ensure the declared output strictly matches real runtime behavior.

---

## 3. Practical & Debugging Challenges

Debugging challenges live in `src/content/m2/debug-data.ts`. They represent real production incidents across modern stacks (e.g., stale closures, Express 4.x async unhandled rejections, N+1 query loops, Redis race conditions).

### Challenge Structure
- `id`: Unique identifier (e.g., `debug-react-stale-closure-01`).
- `skillId`: Canonical skill taxonomy ID.
- `difficulty`: `basic` | `medium` | `hard`.
- `scenario`: 1–2 sentence production bug report.
- `code`: 15–40 lines of realistic code.
- `buggyLines`: Array of `{ line: number, fix: string, explanation: string }` (1-indexed).
- `distractorNotes`: Record of line numbers with explanations of why that line is innocent.
- `interviewTakeaway`: Senior engineering architectural lesson.

---

## 4. The 3-Score Readiness Model

Diagnostic scores are deterministically computed in `src/lib/m2/readiness-calculator.ts`:

1. **Stack Knowledge Score (0–100%)**:
   - Evaluates accuracy across canonical skills in the candidate's verified stack.
   - Weighted by difficulty: basic (1.0x), medium (1.5x), hard (2.0x).
   - Multiplied by stack coverage factor (encourages breadth across verified skills).
2. **Interview Readiness Score (0–100%)**:
   - 40% Core fundamentals accuracy.
   - 35% Practical debugging incident pass rate (scaled against 5 incident targets).
   - 25% Metacognitive calibration rating (penalizes overconfident mistakes where candidate selected "100% Certain" but was incorrect).
3. **Project Defense Score (0–100%)**:
   - Evaluates the proportion of senior architecture questions marked "Got It" across the candidate's resume projects.

### Readiness Bands
- **Not Started**: No questions answered or projects reviewed.
- **Needs Practice**: Composite < 45%.
- **Developing**: Composite 45–69%.
- **Interview Ready**: Composite 70–84%.
- **Staff Calibrated**: Composite ≥ 85% AND at least 3 practical debugging challenges solved.
