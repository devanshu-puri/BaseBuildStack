# ANTIGRAVITY_PROMPT.md — Paste this into Antigravity

## Setup (do once)
Place these files in your `/spec` folder (replace the existing `UI_SPEC.md`):
`DESIGN.md` · `UI_SPEC.md` · `AURORA_EFFECTS.md` · `ANTIGRAVITY_PROMPT.md`

---

## MASTER PROMPT

You are redesigning the **visual layer only** of BaseBuildStack, an existing Next.js app (dev interview-prep: DSA rounds, quizzes, tech bites, mind sprints).

### Read first, in this order
1. `spec/DESIGN.md` — design language, tokens, components (source of truth for look & feel)
2. `spec/AURORA_EFFECTS.md` — exact CSS recipes (tokens, aurora background, glass, buttons, dock, rim, heatmap)
3. `spec/UI_SPEC.md` — layout, responsive behaviour, states, accessibility
4. `spec/MODULES.md`, `spec/PRD.md`, `spec/architecture.md` — to understand what must NOT change

### Goal
Replace the current flat beige/lime dot-grid UI with an **aurora / blurred-fluid-gradient + frosted glass** interface: indigo accent, violet/azure/mint aurora atmosphere, bento grids, rim-lit state, oversized numerals, floating glass dock. It must stop looking like a generic template and feel premium, calm, and luminous — in both **dark (default)** and **light (Pearl)** themes.

### Hard constraints (do not break)
- **Do NOT change** routes, data fetching, state logic, API calls, auth, payments, SRS/algorithm code, copy meaning, or screen order/positioning. User flow and information architecture stay identical.
- No new colours outside `DESIGN.md`. No hard-coded hex/px in components — only CSS variables / Tailwind theme mapped to them.
- Do not copy colours, logos, or content from the reference images; only the structural patterns documented in `DESIGN.md` §2.
- One action colour (indigo). Aurora is atmosphere only. No ads, no leaderboards, no confetti.
- Accessibility and performance rules in `UI_SPEC.md` §10–§11 are requirements, not suggestions.

### Execute in phases. After each phase: run the app, typecheck, lint, and verify at 360 / 768 / 1024 / 1440 widths in both themes. Fix issues before moving on. Summarise what changed in 5 lines max.

**Phase 0 — Audit.** List every component/page that renders UI and map each to a component in `UI_SPEC.md` §5. Report any component that does not map. Do not change code yet.

**Phase 1 — Foundation.**
- Add `styles/tokens.css` + `styles/effects.css` from `AURORA_EFFECTS.md` (or merge into `globals.css`); wire into root layout.
- Load fonts with `next/font/google`: Bricolage Grotesque (`--font-bricolage`), Geist (`--font-geist`, fallback Inter), Geist Mono (`--font-geist-mono`).
- Map tokens in Tailwind config (if used) to CSS variables.
- Implement `ThemeProvider` (`data-theme` on `<html>`, persisted, defaults to system) and `ThemeToggle`.
- Build `AuroraBackground` (mounted once in root layout; `intensity` driven by route: `focus` for quiz/blitz/bug-audit/visualizer/lesson, `hero` for landing, else `app`). Honour reduced-motion, hidden-tab pause, mobile blob limits.

**Phase 2 — Primitives.** Build/restyle in a shared `components/ui`: `GlassCard`, `BentoTile` (bezel), `Button` (primary/secondary/ghost/icon-glass, loading), `Chip`, `StatBlock`, `ProgressBar`, `ProgressRing`, `SegmentedTabs` (animated glass pill), `DifficultyMeter`, `Avatar` (aurora ring), `Sheet/Dialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`. Add a hidden `/dev/ui` route (dev only) showing every primitive in all states, both themes.

**Phase 3 — Shell.** `AppShell`, glass `SidebarNav` (lg+), icon `Rail` (sm), `FloatingDock` (base), `TopBar`, `ContextPanel` (xl) with the same items and order as today. Free-plan card becomes a mini aurora CTA.

**Phase 4 — Screens (keep layout order; apply bento + glass):** Home → Module landing → Category stepper → Detail → Progress/Milestones (GlowTile, Heatmap) → Bookmarks → Settings → Paywall → Landing/Auth.

**Phase 5 — Focus modes.** Quiz / Pattern Blitz / Bug Audit / Mind Sprint / Lesson player / Visualizer: `focus` aurora (static, dim), `OptionButton`, `FeedbackCard` with rim glow, always-dark `CodeBlock` with syntax palette from `DESIGN.md`, `TimerRing`, `PlayerControls`, `Scrubber`, `DiagramNode` glow states (colour + shape + label).

**Phase 6 — Polish & QA.**
- Contrast audit over the brightest aurora region behind text; fix with scrims/glass.
- Keyboard focus ring on every interactive; shortcuts unchanged.
- `prefers-reduced-motion` and `prefers-reduced-transparency` fallbacks.
- Count `backdrop-filter` elements on mobile (≤ ~12/viewport); swap to `glass--solid` in long lists.
- Lighthouse mobile: LCP < 2.5s, no layout shift from fonts/aurora.
- Remove dead CSS from the old lime/beige theme.

### Definition of done
- Every checkbox in `UI_SPEC.md` §13 is satisfied for every screen.
- Dark and light themes are both complete; no screen looks broken in either.
- No component contains raw colour values.
- `git diff` shows no changes to business logic, routes, or data code.
- Final report: files created/changed, any spec ambiguities you resolved (and how), and anything you intentionally skipped.

If something in the spec is ambiguous, choose the option that is calmer, more legible, and cheaper to render, and note it in the final report. Do not ask questions mid-way unless a hard constraint would be violated.

---

## OPTIONAL SHORT PROMPTS (for iterating)

**Tune aurora:** “Adjust `AuroraBackground` so app pages feel [calmer / more vivid]. Only change opacity/blur values in tokens; keep focus screens static.”

**Add a new screen later:** “Build `<screen>` using only components from `UI_SPEC.md` §5 and patterns in `DESIGN.md`. Follow §13 checklist. Do not introduce new colours.”

**Light-theme pass:** “Audit every screen in `data-theme=light`. Fix contrast, glass legibility and aurora intensity per `DESIGN.md` §6 light notes.”
