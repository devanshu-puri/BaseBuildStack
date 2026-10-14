# MODULES.md — Module Specifications

> Read after: architecture.md · Read before: UI_SPEC.md
> Legend: **[D]** deterministic code · **[AI]** LLM-assisted · **[P1/P2/P3]** phase

---

## 0. Shared platform (Foundation)

**Purpose:** everything modules rely on.
**Includes:** auth, user-scoped data layer, LLM gateway, deterministic engine (scoring/XP/SRS/mastery), payments + entitlements, design system, responsive app shell, Sentry.
**Home screen:** greeting + Continue card (hero) + module category list with `done/total` counts + streak + today's Mind Sprint.
**Definition of done:** sign up/in, Free→Pro (test mode) with webhook, data isolation test passes, responsive shell works at 360 / 768 / 1280 px, Lighthouse targets met.

---

## Module I — DSA & Modern Technical Rounds

**Purpose:** train pattern recall, code reading, and engineering judgement.

### Screens
| Screen | Mobile | Desktop |
|---|---|---|
| M1 Home | Category list + progress | Same list left, "Due today" + stats in right panel |
| Pattern Blitz card | Full-screen card, options, bottom CTA | Centered card (max 640px), keyboard `1–4` selects, `Enter` continues |
| Bug Audit | Code stacked above options | **Split view:** code left (line-select), Stage A/B panel right |
| Open-Ended Drill | Phase stepper top, content below | Phase stepper left rail, scenario center, evidence/notes right |
| Visualizer player (algorithms) | Canvas, tabs Explain/Code/Predict, scrubber, controls | Canvas left 60%, tabs panel right 40%, controls under canvas, keyboard shortcuts |

### Modes
**A. Pattern Blitz (30–45s/card)** [D]
1. Prompt + constraints → tap pattern (MCQ)
2. Missing invariant line → choose option
3. Reveal 6-line pseudocode + TIME/SPACE chips
- SRS: SM-2-style scheduler [D]; missed cards return sooner.

**B. Bug Audit (60–90s)** [D, AI in P2]
1. Stage A: tap the buggy line
2. Stage B: pick the input that breaks it
3. 5-part feedback
- Bugs from curated canonical solutions × ~50 templates. **Both versions executed in sandbox before serving.** AI-injected bugs = P2.

**C. Open-Ended Drill (2–3 min)** [D tree + AI grading]
1. Scenario → constraint estimates
2. Map components to primitives
3. Interviewer pushback → MCQ defence or free-text (AI grade)

### Data schemas (summary)
```ts
Problem  { id, title, constraints, pattern, invariant, distractors[], pseudocode[], complexity{time,space}, edgeCases[], difficulty }
BugItem  { id, baseSolutionId, language, code, buggyLine, bugType, breakingInputs[{input,isCorrect}], tests[] }
Scenario { id, prompt, phases[{id, kind, options[{id,text,correct,why}], next}], rubric }
```

### Routes
`/m1` · `/m1/blitz` · `/m1/audit` · `/m1/audit/[id]` · `/m1/open` · `/m1/open/[id]` · `/m1/[category]/[slug]`

### AI vs deterministic
- AI: free-text defence grading `{score, feedback}`; Phase 2 bug variants.
- Deterministic: everything else.

### Dependencies
Foundation. Links to M3 (lesson on pattern) and M2 (shared mistakes).

### Phases
- **P1:** Blitz + Bug Audit with seeded content (60 problems, ~50 bug templates), SRS, milestones.
- **P2:** Open-Ended with LLM grading; AI bug variants.
- **P3:** Multi-file code comprehension (small repos, trace execution).

### Definition of done
Each mode fully playable **with the LLM disabled**; progress, mistakes, bookmarks persist; keyboard-operable on desktop; 360px layout has no horizontal scroll.

---

## Module II — Personalised Interview Quizzes

**Purpose:** questions tailored to the individual's stack, resume, and projects.

### Screens
| Screen | Notes |
|---|---|
| Onboarding | Role + stack chips; resume upload dropzone (desktop drag-and-drop, mobile file picker) |
| Skill confirmation | Editable chip list; nothing saved until confirmed |
| Quiz picker | Quick (5m) · Fundamentals (5–10m) · Practical (10m) · Weak-Area (adaptive) |
| Question | MCQ / code-output / debugging / approach; desktop shows code beside options |
| Feedback | 5-part card (Verdict, Why, Distractor takedown, Takeaway, Repo evidence P2) |
| Skill heatmap | Grid of skills × score; desktop adds confidence-vs-accuracy chart |
| Mistakes | Retry queue |
| Project Deep Dive (P2) | **Split layout:** question left, Evidence Panel (file path + highlighted lines) right; stacks vertically on mobile |

### Data schemas
```ts
Skill    { name, level: 'beginner'|'intermediate'|'advanced', source: 'manual'|'resume'|'repo', confirmed: boolean }
Question { id, skill, type: 'mcq'|'output'|'debug'|'approach', difficulty: 1|2|3, stem, code?, options[], correctId, explanation{why, distractors[], takeaway}, verified: boolean }
Attempt  { itemId, answerId, correct, ms, answerChanges, confidence?, ts }
```

### Routes
`/m2` · `/m2/onboarding` · `/m2/resume` · `/m2/quiz/[mode]` · `/m2/session/[id]` · `/m2/heatmap` · `/m2/mistakes` · `/m2/project/[repoId]` (P2)

### AI vs deterministic
- AI [AI]: skill extraction (user confirms), question generation (validated), later: repo claims, what-if scenarios, free-text grading.
- Deterministic [D]: scoring, timing, answer-change tracking, heatmap, confidence-vs-accuracy, weak-area selection, lesson recommendations.
- **Validator** [D]: Zod schema, exactly one correct option, code questions actually execute to the stated output.

### Dependencies
M3 (recommendations), Foundation (LLM gateway, Mongo).

### Phases
- **P1 (MVP):** manual stack, resume → confirm skills, 4 question types, feedback, mistakes, heatmap, recommendations. Cached questions for < 10s start.
- **P2:** GitHub public repo → chunks → Atlas Vector Search → Proof of Authorship loop with Evidence Panel; adaptive difficulty.
- **P3:** short-answer evaluation, multi-turn mock interview, voice (ElevenLabs), private repos.

### Definition of done
Resume → confirmed skills → 10-question quiz → heatmap update works end-to-end; generation ≤ 10s using cache fallback; untrusted-content guard tested with an injection sample.

---

## Module III — Tech Bites (Learn in 15 Minutes)

**Purpose:** take a learner from unfamiliar to a basic working mental model.

### Lesson player (one component, JSON-driven)
Stages: **01 Why (1m) → 02 Mental model (3m) → 03 See it (4m) → 04 Try it (4m) → 05 Recall (3m)**.

| Layout | Mobile | Desktop |
|---|---|---|
| Player | One stage at a time, bottom CTA "Continue", 5-segment progress bar top | Left: stage list/stepper (clickable for visited stages). Center: stage content. Right (≥1280): reference cards (Where used / Confused with / Remember) |
| Diagram | Full width, tap nodes, text below | Diagram left, node detail right |

### Schema
```ts
Lesson {
  id, title, outcome,                      // one sentence
  paths: ('ai'|'backend'|'frontend'|'devops'|'foundations')[],
  prerequisites: string[],
  steps: Step[],                           // exactly 5 stages
  reference: { whereUsed: string[], commonlyConfusedWith: string[], remember: string[] }
}
Step types: text | stepDiagram | animatedFlow | comparison | simulation | codeWalkthrough | predict | arrangeSteps | quiz
```

### Discovery home (4 choices only)
Continue learning · Learn for your role · Explore a technology (search) · What's new.

### First 8 lessons
LLM basics · Tokens & context windows · Embeddings · **RAG (5-stage clickable diagram)** · HTTP/REST · Docker · CI/CD · Caching (hit vs miss simulation).

### Gamification [D]
- XP only on lesson **completed AND recall passed**.
- Mastery re-test at +3 and +10 days.
- Save-for-revision bookmark.
- **No leaderboards.**

### What's New [AI + SerpApi, P2]
Separate feed; scheduled job; LLM-summarised; cached; labelled "Not part of curriculum".

### Routes
`/m3` · `/m3/paths/[path]` · `/m3/lesson/[id]` · `/m3/explore` · `/m3/new`

### Dependencies
Foundation; receives deep links from M2/M1.

### Phases
- **P1:** player + schema + 8 lessons + paths + progress + XP.
- **P2:** mastery re-tests, search, What's New.
- **P3:** more lessons (LangChain, LangGraph, agents, deployment).

### Definition of done
RAG lesson playable in under 15 minutes on phone and desktop; adding a lesson requires **only a JSON file**; every animation passes the "does it teach?" review.

---

## Module IV — Logic & Cognitive Practice

**Purpose:** train reasoning, memory, and calibration.

### Mind Sprint (daily, 5 min)
| # | Item | Time |
|---|---|---|
| 1 | Pattern recognition | 45s |
| 2 | Logical deduction | 60s |
| 3 | Memory challenge | 45s |
| 4 | Numerical reasoning | 60s |
| 5 | Tricky problem | 90s |

Timer ring per item, skip allowed, one streak-counting attempt per day.

### Categories
1. Logical Reasoning (interactive deduction grid)
2. Patterns & Sequences
3. Attention to Detail
4. Memory Challenges (show → hide → recall; distractor variant)
5. Lateral Thinking
6. Numerical & Analytical (Fermi sliders, order-of-magnitude scoring)

### Screens
| Screen | Mobile | Desktop |
|---|---|---|
| Sprint runner | Single item, timer ring, bottom CTA | Centered item card; side panel shows sprint progress + streak |
| Logic grid | Grid scrolls inside its own container; tap cycles cell state | Grid + clue list side-by-side; keyboard arrows move cell focus |
| Memory | Full-screen flash → hide → recall | Same, larger |
| Insights | Cards stacked | Heatmap + calibration chart side by side |

### Generation rules
- Logic grids: **deterministic solver** guarantees exactly 1 solution; AI only writes theme/clue wording. Reject if solutions ≠ 1.
- Sequences/numerical: parameterised generators with computed answers.
- Pre-generate and cache; never serve unverified.

### Socratic hints [AI + D check]
"I'm stuck" sends current grid state → guiding question. Output check rejects text containing the solution (cell values, final assignment).

### Metacognition [D]
Before reveal: Guessing / Unsure / 100% Certain. Overconfidence and underconfidence computed per category; **min 10 samples** before any conclusion; one plain-language insight on dashboard.

### Routes
`/m4` · `/m4/sprint` · `/m4/[category]` · `/m4/play/[id]` · `/m4/insights`

### Dependencies
Foundation; optional links to M3 lessons.

### Phases
- **P1:** Mind Sprint + patterns + numerical + memory + streak (all generator-based, no AI).
- **P2:** logic grid solver + AI theming; attention to detail; lateral thinking bank.
- **P3:** Socratic hints; metacognition dashboard.

### Definition of done
30 consecutive generated logic puzzles verified single-solution; Mind Sprint continues offline and syncs later; calibration shows nothing under 10 samples.

---

## Cross-module dependency map

```
M2 heatmap ──weak skill──▶ M3 lesson ──completed──▶ re-test queue ──▶ M1 / M4 / M2
M1, M2, M4 ──wrong answers──▶ Mistakes (shared)
All modules ──▶ xp_events / milestones / bookmarks (shared ledgers)
```
