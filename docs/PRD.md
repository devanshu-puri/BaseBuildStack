# PRD — BaseBuildStack

> Status: v1.0 · Owner: Product · Last updated: 2026-10-13
> Read after: START_HERE.md · Read before: BLUEPRINT.md

---

## 1. Problem

Interview prep is fragmented. Candidates juggle LeetCode for DSA, random blogs for system design, YouTube for new tech (LLMs, RAG, Docker), and separate apps for aptitude. None of these:

1. **Know the candidate.** Quizzes are generic, not tied to their resume, stack, or projects.
2. **Teach unfamiliar tech fast.** Documentation is long; video courses are slow.
3. **Train how interviews are actually run today.** Reading someone else's code, defending trade-offs, and answering vague scenarios are rarely practised.
4. **Show *why* you fail.** Scores say "72%", not "you are overconfident on async questions".

## 2. Product in one line

**BaseBuildStack is a responsive web platform (mobile + desktop) that diagnoses what a candidate knows, teaches gaps in 15 minutes, drills the interview formats, and trains reasoning, all in one connected loop.**

## 3. Target users

| Persona | Description | Primary need | Main modules |
|---|---|---|---|
| **Asha, final-year student** | Placement season in 6 weeks, knows basics, hears RAG/Docker/CI-CD everywhere | Understand unfamiliar terms fast; revise patterns on the commute (phone) | III, I (Blitz), IV |
| **Rohan, early-career SDE** | 1–3 yrs, targeting a better role, has GitHub projects | Prove project ownership; handle code-comprehension rounds (laptop) | II (Proof of Authorship), I (Bug Audit) |
| **Meera, AI-engineer aspirant** | Switching into LLM roles | Role path: LLM → RAG → agents | III (AI path), II |

Device split assumption: **phone for short drills (Blitz, Mind Sprint, flashcards); laptop for deep work (Bug Audit, Open-Ended, Project Deep Dive, lesson diagrams).** Both must be first-class.

## 4. Goals and non-goals

### Goals
- G1. A new user reaches a *first completed drill* in under 3 minutes from sign-up.
- G2. Every module works end-to-end **without an LLM** (AI adds personalisation and variety, never correctness).
- G3. Real accounts, real data persistence, real payments, with per-user data isolation.
- G4. One consistent UI system across mobile and desktop.
- G5. Cross-module loop: weak area found in M2 → lesson in M3 → retest in M1/M4.

### Non-goals (v1)
- Leaderboards, social feeds, daily competitions, complex badge systems.
- Video content or video generation.
- In-browser full IDE or arbitrary code execution for users.
- Native iOS/Android apps (the responsive web app is installable as a PWA).
- Ads. **No ads anywhere**, including free tier.
- Private GitHub repos (Phase 3 only).

## 5. Modules and user stories

### Module I — DSA & Modern Technical Rounds
| ID | Story | Acceptance criteria |
|---|---|---|
| M1-1 | As a user I tap the governing pattern for a problem, so I train pattern recall | MCQ, instant verdict, card ≤ 45s typical |
| M1-2 | I fill the missing invariant line | Options shown; wrong choice shows the reason |
| M1-3 | I reveal canonical pseudocode and complexity chips | One tap; 6 lines; TIME/SPACE chips |
| M1-4 | I spot the buggy line in a 12–20 line snippet | Line tap targets ≥ 44px on mobile; keyboard-selectable on desktop |
| M1-5 | I choose the input that breaks the code | Bug validated server-side by running both versions before serving |
| M1-6 | I work an open-ended scenario through 3 phases | Decision tree is data-defined; works with no LLM on MCQ path |
| M1-7 | I get an interviewer pushback and defend it | Free-text graded by LLM against rubric → `{score, feedback}`; MCQ fallback |
| M1-8 | Cards I miss return on a schedule | Deterministic SM-2-style scheduler |

### Module II — Personalised Interview Quizzes
| ID | Story | Acceptance criteria |
|---|---|---|
| M2-1 | I pick role + stack | Chips; saved to profile |
| M2-2 | I upload a resume and confirm extracted skills | PDF/DOCX ≤ 5 MB; nothing saved until I confirm; raw file deleted unless I opt to keep |
| M2-3 | I take a 5–10 min quiz | MCQ, code-output, debugging, approach-selection |
| M2-4 | I get 5-part feedback per question | Verdict, Why, Distractor takedown, Takeaway, (Repo evidence in Phase 2) |
| M2-5 | I see a skill heatmap and confidence-vs-accuracy | Deterministic; min sample size before conclusions |
| M2-6 | Wrong answers go to a Mistakes list | Retry mode |
| M2-7 | Weak areas link to Module III lessons | Deep link by lesson id |
| M2-8 *(Phase 2)* | I link a public GitHub repo and get "Proof of Authorship" questions | Evidence panel shows real file path + highlighted lines |

### Module III — Tech Bites (15-minute lessons)
| ID | Story | Acceptance criteria |
|---|---|---|
| M3-1 | I follow a 5-stage lesson | Why → Mental model → See it → Try it → Recall; auto-save per stage |
| M3-2 | I click through an interactive diagram | Reveals one stage at a time |
| M3-3 | I pick a role path | AI Eng, Backend/Full-stack, Frontend, DevOps/Cloud, Foundations; shared lessons not duplicated |
| M3-4 | I earn XP only by completing + passing recall | No time-on-page XP |
| M3-5 | I get a mastery re-test at +3 and +10 days | Scheduler-driven |
| M3-6 | I browse "What's new" separately | Clearly marked non-curriculum |

### Module IV — Logic & Cognitive Practice
| ID | Story | Acceptance criteria |
|---|---|---|
| M4-1 | I do a 5-minute Mind Sprint daily | 5 timed items (45/60/45/60/90s); streak counts one attempt/day |
| M4-2 | I solve logic grids | Every served puzzle has exactly one solution (verified by solver) |
| M4-3 | I ask "I'm stuck" and get a Socratic hint | Hint never reveals the answer (output check) |
| M4-4 | I rate confidence before reveal | Guessing / Unsure / 100% Certain |
| M4-5 | I see overconfidence/underconfidence per category | Shown only after ≥ 10 samples |

### Platform
| ID | Story | Acceptance criteria |
|---|---|---|
| P-1 | I sign up with email/Google/GitHub | Verified session; httpOnly cookies |
| P-2 | I use the same account on phone and laptop | Progress syncs; layout adapts |
| P-3 | I upgrade to Pro with a real payment | Razorpay; entitlement flips only after verified webhook |
| P-4 | I export or delete my data | Self-serve in Settings |

## 6. Free vs Pro

| Capability | Free | Pro |
|---|---|---|
| Module I Blitz / Bug Audit / Open-Ended | Limited daily set | Full bank + AI variants |
| Module II quizzes | Manual stack, 3 AI quizzes/week | Resume upload, unlimited, weak-area adaptive |
| Proof of Authorship (repo) | Locked | Included (Phase 2) |
| Module III lessons | Foundations path + 3 lessons/path | All paths + mastery re-tests |
| Module IV | Mind Sprint daily | All categories + metacognition dashboard |
| Data export / delete | ✔ | ✔ |

*Prices are intentionally not fixed here; set in `MEMORY.md` once decided.*

## 7. Success metrics

| Metric | Target (first 30 days of demo/beta) |
|---|---|
| Sign-up → first drill completed within 3 min | ≥ 60% |
| D7 return rate | ≥ 25% |
| Lesson completion (started → recall passed) | ≥ 55% |
| Mind Sprint streak ≥ 3 days | ≥ 20% of actives |
| Free → Pro conversion | ≥ 3% |
| p95 quiz generation time (cached fallback) | < 10s |
| Lighthouse (mobile / desktop) | ≥ 90 / ≥ 95 |

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| LLM outputs wrong puzzles/answers | Trust loss | Verify in code (solver, sandbox run); never serve unverified |
| Free hosting cannot run a 7B model | "Local inference" claim fails | LLM gateway; hosted free API or Ollama for demos |
| Free tier cold starts (Render sleep) | Poor first impression | Keep-alive ping, static shell, skeleton screens |
| Prompt injection via resume/repo text | Data leak / bad output | Treat as data; strict schemas; no tool access from that prompt |
| Sponsor free tiers change | Blocked integration | Each sponsor behind an interface with a free fallback |
| Scope creep | Missed demo | MVP cut line below |
| Payment/webhook bugs | Revenue/entitlement errors | Signature verification, idempotency, test mode first |

## 9. MVP cut line

**In MVP:** Foundation (auth, DB, payments, design system, responsive shell) · M1 Blitz + Bug Audit (deterministic) · M2 Phase 1 · M3 player + 8 lessons · M4 Mind Sprint + logic grid + patterns.
**Stretch:** M1 Open-Ended LLM grading · M3 What's New · M4 Socratic hints + metacognition dashboard.
**Post-MVP:** M2 Phase 2 (GitHub) and Phase 3 (mock interviewer, voice).
