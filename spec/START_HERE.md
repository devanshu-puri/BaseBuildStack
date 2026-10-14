# START_HERE.md — BaseBuildStack

> Read this first. Reading order: **START_HERE → PRD → BLUEPRINT → architecture → MODULES → UI_SPEC → RULES**.
> Living docs: **MEMORY.md** (decisions) and **PROGRESS.md** (status). Check both at the start of every session.

---

## 1. What we are building

A **responsive web app (mobile + desktop, installable PWA)** that diagnoses what a candidate knows, teaches gaps in 15-minute lessons, drills modern interview formats, and trains reasoning, in one loop.

**Core idea:** deterministic code decides what is *true* (scoring, XP, puzzle validity, bug validity). Open-weight AI only personalises, grades free text, and asks follow-ups. Every module must work with the LLM switched off.

## 2. Document map

| File | Purpose |
|---|---|
| `PRD.md` | Problem, users, stories, free vs Pro, metrics, MVP cut line |
| `BLUEPRINT.md` | Vision, pillars, user journey, demo script |
| `architecture.md` | Stack, collections, routes, LLM gateway, security, deploy |
| `MODULES.md` | Module I–IV specs, schemas, phases, definitions of done |
| `UI_SPEC.md` | Tokens, responsive system, components, screens |
| `RULES.md` | Non-negotiable engineering and product rules |
| `MEMORY.md` | Decisions made, open questions, gotchas (append-only log) |
| `PROGRESS.md` | Checklist and status per phase |

## 3. Tech stack (summary)

Next.js App Router + TypeScript strict · Tailwind + CSS variable tokens · MongoDB Atlas (+ Vector Search) · Zod · Auth.js · Razorpay · Mastra · Gemma via LLM gateway (Ollama / Google AI / OpenAI-compatible) · Sentry · Render.

## 4. Prerequisites

- Node.js 20 LTS or newer, npm (or pnpm, pick one and record in MEMORY.md)
- Git
- MongoDB Atlas account (M0 free cluster)
- Razorpay account (test mode keys)
- Sentry project
- Google and GitHub OAuth apps (for Auth.js)
- One LLM route: Ollama locally (e.g. `ollama pull gemma`) **or** a hosted free API key
- Render account (for deploy)

## 5. Environment variables

Create `.env.local` (never commit). Mirror names in Render dashboard.

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
MONGODB_URI=
MONGODB_DB=basebuildstack

# Auth (Auth.js)
AUTH_SECRET=                 # openssl rand -base64 32
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
EMAIL_SERVER=                # SMTP URL for magic links
EMAIL_FROM=

# LLM gateway
LLM_PROVIDER=ollama          # ollama | google-ai | openai-compatible
LLM_MODEL=gemma
LLM_BASE_URL=http://localhost:11434
LLM_API_KEY=
GOOGLE_AI_API_KEY=
LLM_TIMEOUT_MS=8000

# Payments (Razorpay, test mode first)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID= # public key id only

# Observability
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=           # source map upload (CI only)

# Security
ENCRYPTION_KEY=              # 32-byte base64, app-level encryption for resume/repo text
CRON_SECRET=                 # shared secret for /api/cron/*

# Optional
SERPAPI_KEY=                 # What's New (P2); fallback is curated RSS
```

Rules: only the three `NEXT_PUBLIC_` vars above may reach the client. Review any new one.

## 6. First-run commands

```bash
npm install
cp .env.example .env.local        # fill values
npm run dev                       # http://localhost:3000
npm run seed                      # load JSON content (problems, bugs, lessons, puzzles)
npm run verify:bugs               # sandbox-run every bug item
npm run verify:puzzles            # solver confirms exactly 1 solution
npm run test                      # unit + integration
npm run build && npm run start    # production check
```

Expected scripts live in `/scripts` (`seed`, `verify-bugs`, `verify-puzzles`).

## 7. Build order

1. **Foundation:** repo, tokens, AppShell (bottom nav / rail / sidebar), Auth.js, Mongo repositories with `userId` injection, Zod, Sentry, health route.
2. **Deterministic engine:** scoring, XP ledger (idempotent), streaks, SM-2, mastery. Unit-test first.
3. **LLM gateway** with providers, repair retry, timeouts, circuit breaker, fallbacks.
4. **Payments:** create-order, signed webhook, idempotency, server-side entitlement checks.
5. **M3 player + 8 lessons** (JSON only), then **M2 Phase 1**, **M1 Blitz + Bug Audit**, **M4 Mind Sprint**.
6. Cross-module links, Progress, Bookmarks, Mistakes.
7. Landing, polish, Lighthouse, demo rehearsal (see BLUEPRINT §7).
8. Stretch items only after the MVP definition of done passes.

## 8. Definition of "MVP done"

- Sign up on phone, continue on laptop, same progress.
- Resume → confirmed skills → 10-question quiz → heatmap → recommended lesson works end to end.
- RAG lesson playable in under 15 minutes on both form factors.
- Blitz, Bug Audit and Mind Sprint playable with the LLM disabled.
- Razorpay test payment unlocks Pro only after verified webhook.
- Data isolation test, export and delete work.
- Verified at 360, 768, 1024, 1440 px with no horizontal scroll.

## 9. Working with an AI coding assistant

- Point it at this file, then the doc relevant to the task.
- One module or screen per session; finish with a PROGRESS.md update.
- Always ask it to restate RULES.md constraints it will respect before large changes.
- Log any decision you make in MEMORY.md immediately.
