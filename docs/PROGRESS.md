# PROGRESS.md — BaseBuildStack Tracking

> Living checklist of tasks and phases. Mark `[x]` as each item is completed and verified.

---

## 1. Foundation

### Setup
- [x] Initialize Next.js 14+ App Router project with TypeScript strict mode using npm
- [x] Configure ESLint, Prettier, and TypeScript strict configuration
- [x] Configure Vitest and Playwright test harness
- [x] Create `.env.example` mirroring all required environment variables per `START_HERE.md` §5
- [x] Scaffold folder structure matching `architecture.md` §3 (`src/app`, `src/components`, `src/lib`, `src/content`, `src/styles`, `src/types`, `scripts`, `tests`)

### Design System & Shell
- [x] Implement Tailwind + `styles/tokens.css` + `next/font` (Inter + JetBrains Mono) with `/dev/tokens` preview
- [x] Build AppShell (BottomNav, Rail, Sidebar, ContextPanel) with responsive switching and `(app)` route tree
- [x] Build core UI primitives (`Card`, `Chip`, `SegmentedTabs`, `StepperTimeline`, `BottomCTA`, `CodeBlock`, etc.)

### Auth & Security
- [x] Auth.js setup (email magic link, Google, GitHub OAuth) with httpOnly session cookies
- [x] Security headers (CSP, HSTS, frame-ancestors none) & MongoDB rate limiting middleware
- [x] User-scoped Mongo repositories with automatic `userId` injection

### Engine & Gateway
- [x] Deterministic engine: scoring, XP ledger (idempotent), streaks, SM-2 SRS, mastery
- [x] LLM gateway interface (`generate`, `generateJSON`, `embed`) with Gemma / Ollama / Google AI, repair retry, Sentry spans, and fallback
- [x] Node worker thread sandbox with timeout and no network for bug validation

### Payments & Observability
- [x] Razorpay order creation and webhook handling with signature verification & idempotency
- [x] Sentry integration (client + server error tracking & LLM spans)
- [x] Health check route (`/api/health`), data export (`/api/me/export`), and account deletion (`/api/me`)

---

## 2. Module I — DSA & Modern Technical Rounds
- [x] Pattern Blitz card runner with 60 seeded problems and SM-2 scheduler
- [x] Bug Audit mode with sandbox execution validation
- [x] Open-Ended drill decision tree with deterministic MCQ path & rubric grading

---

## 3. Module II — Personalized Interview Quizzes (Rebuild)
- [x] Phase 1: Foundation & Fixes (Canonical 50-skill taxonomy, role mappings, UserProjects & QuestionHistory repos, 4-card IA, dock spacing, confidence gate)
- [x] Phase 2: Resume Pipeline (Structured skills + projects extraction with evidence lines, confirmation wizard, re-upload diffing)
- [x] Phase 3: Question Bank Engine (Section 6.2 schema, validators, code sandbox verification, top 25 skills seed)
- [x] Phase 4: Skill Drills & Core Fundamentals (Basic/Medium/Hard difficulty controls, no-repeat history shuffle, 5-part feedback)
- [x] Phase 5: Practical & Debugging (Click-the-buggy-line UI, verified code diffs, distractor explanations, 2 attempts)
- [x] Phase 6: Project Interview Panel (Read-and-learn Q&A grounded in candidate resume projects, STAR format, Got it tracking)
- [ ] Phase 7: Scoring & Insights (Stack Knowledge, Interview Readiness, Project Understanding 3-score dashboard)
- [ ] Phase 8: Hardening, Accessibility & Full Test Suite

---

## 4. Module III — Tech Bites (Learn in 15 Minutes)
- [x] 5-stage JSON-driven lesson player (Why → Mental model → See it → Try it → Recall)
- [x] First 8 lessons (including 5-stage clickable RAG diagram)
- [x] Spaced repetition mastery re-tests at +3 and +10 days

---

## 5. Module IV — Logic & Cognitive Practice
- [x] 5-minute daily Mind Sprint runner with countdown timers and offline tolerance
- [x] Deterministic constraint solver for logic grids (guaranteeing exactly 1 solution)
- [x] Metacognition calibration & Socratic hint leak-prevention
