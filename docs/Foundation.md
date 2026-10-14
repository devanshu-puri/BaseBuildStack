You are a senior full-stack engineer. Build the foundation of "BaseBuildStack",
an interview-prep platform with 4 modules (DSA drills, personalized quizzes,
15-minute tech lessons, logic practice). Read /docs/*.md first if present.

STACK: Next.js (App Router) + TypeScript strict, Tailwind, MongoDB Atlas
(Mongoose or native driver + Zod validation), Auth.js, Razorpay, Mastra,
Sentry, deployed on Render. Mobile-first PWA (360–430px primary viewport).

BUILD:
1. Design tokens from Design.md: dot-grid canvas, lime single accent, 16–24px
   radii, pill segmented tabs, monospace metadata chips, fixed bottom CTA with
   safe-area. Create reusable components: Card, Chip(KEY value), SegmentedTabs,
   StepperTimeline, MilestoneCard, BottomCTA, ProgressRing, CodeBlock
   (line numbers, A-/A+, copy), BottomNav (Home / Progress / Bookmarks).
2. Auth: email + Google + GitHub OAuth. Sessions httpOnly, secure, SameSite=Lax.
3. Data layer: users, progress, bookmarks, attempts, xp_events, subscriptions.
   Every document carries userId; every query is scoped by the session user.
4. LLM gateway (lib/llm): one interface generate(), generateJSON(schema),
   embed(). Providers: ollama, google-ai (Gemma), openai-compatible.
   Zod-validate all JSON; retry once with repair prompt; log to Sentry.
5. Deterministic engine boundary: scoring, XP, streaks, and mastery are plain
   code, never LLM.
6. Payments: Free vs Pro. Razorpay order + subscription flow, webhook with
   signature verification, entitlements table. Server-side checks only;
   never trust the client. Idempotent webhook handling.
7. Security: rate limiting, CSP headers, input validation on every route,
   secrets in env only, account deletion + data export endpoint.
8. Observability: Sentry on client/server, trace every LLM call (latency,
   tokens, model, success).

ACCEPTANCE: sign up, log in, upgrade to Pro in test mode, entitlement flips
after webhook, data isolated per user, Lighthouse mobile >= 90.
OUT OF SCOPE: any module-specific feature.