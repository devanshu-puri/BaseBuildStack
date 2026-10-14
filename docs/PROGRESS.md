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

## 3. Module II — Personalized Interview Quizzes
- [x] Onboarding (role + stack chips, resume upload and skill extraction confirmation)
- [x] Quiz runner with 4 question types and 5-part feedback card
- [x] Skill heatmap & confidence-vs-accuracy calculation

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
