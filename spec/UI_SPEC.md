# UI_SPEC.md — Responsive UI Specification (v2 · Aurora Glass)

> Visual source of truth: `DESIGN.md` (tokens, components, effects) + `AURORA_EFFECTS.md` (CSS recipes).
> This file owns **layout, behaviour, states, accessibility**. User flow and screen positioning from v1 are **unchanged**.
> Scope: one responsive web app (mobile · tablet · desktop). Mobile-first.
> Read after: MODULES.md · Read before: RULES.md

---

## 1. Principles

1. **Mobile-first, desktop-enhanced.** Design for 360px, then add space and panes.
2. **One action colour (indigo).** Aurora hues are atmosphere only; they never carry meaning or text.
3. **Glass on aurora, content on calm.** Atmosphere behind, legible glass cards in front. Focus modes (quiz, visualizer, code) dim the atmosphere.
4. **Bento composition.** Mixed-size tiles, visual on top, title + one line below.
5. **Monospace for metadata.** `[KEY] value` chips for time/space/difficulty/limits.
6. **Luminous state.** Selected / correct / unlocked / active = rim light + glow. Not decoration.
7. **Same structure everywhere.** Stepper, chips, feedback card are identical across modules.
8. **No ads. Ever.**

## 2. Design tokens

All tokens are defined in `DESIGN.md` §3–§6 and implemented in `AURORA_EFFECTS.md` §1.
**Never hard-code colours, radii or fonts in components** — only CSS variables / Tailwind theme mapped to them.
Themes: `dark` (default) and `light` (“Pearl”) ship together; switch via `data-theme` on `<html>`, persisted, defaulting to `prefers-color-scheme`. Both must pass the checklist in §13.

## 3. Typography & spacing

| Role | Mobile | Desktop (≥1024) | Weight | Family |
|---|---|---|---|---|
| Numeral XL (stat hero) | 56px | 96–112px | 800 | Display |
| Display / Hero | 30px | 44–48px | 700 | Display |
| Section title | 20px | 24–26px | 600 | Display |
| Card title | 16px | 17–18px | 600 | UI |
| Body | 14px | 15px | 400 | UI |
| Caption / meta | 12px | 13px | 500 | UI |
| Mono (chips, code, eyebrows) | 11–12px | 12–13px | 400/500 | Mono |

- Fonts: **Bricolage Grotesque** (display) · **Geist** (UI) · **Geist Mono** (mono) via `next/font/google`; CSS vars `--font-display/ui/mono`; Inter is the UI fallback.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Radii: pill 9999 · bezel 28 · card 24 · inner 16 · chip 10 · small 6.
- **Gradient keyword motif:** exactly one keyword per hero headline uses `.gradient-keyword` (replaces the old lime highlighter pill).

## 4. Responsive system

### 4.1 Breakpoints
| Name | Width | Layout |
|---|---|---|
| `base` | 0–639 | Phone: single column, **floating glass dock**, CTA above dock |
| `sm` | 640–1023 | Tablet: single column (max 720), **glass icon rail** left (72px) |
| `lg` | 1024–1279 | Desktop: **glass sidebar** (248px) + content (max 1040) |
| `xl` | ≥1280 | Sidebar + content (max 1040) + **context panel** (320px) |

### 4.2 App shell
```
base: [TopBar] [Content ........] [FloatingDock: Home · Progress · Bookmarks]
sm:   [Rail] [TopBar + Content (max 720)]
lg:   [Sidebar 248] [TopBar + Content (max 1040)]
xl:   [Sidebar 248] [Content (max 1040)] [ContextPanel 320]
```
- `AuroraBackground` is mounted **once** in the root layout behind everything. Intensity: `app` default, `hero` on Landing, `focus` on quiz / blitz / bug audit / visualizer / lesson player.
- **Sidebar (lg+):** glass panel. Logo, nav (Home, Progress, Bookmarks), module links (I–IV with mono progress counts), Settings, user menu, Free-plan card (mini aurora-cta with PRO chip + Upgrade).
- **Context panel (xl):** streak, today's Mind Sprint, “Next up”, due reviews, each a glass card. Below xl these become cards at the top of Home.
- **TopBar:** transparent → glass on scroll. Title + back; right: search (lg+), theme toggle, avatar (aurora ring).
- Content is centred with `max-width`; aurora always fills the viewport.

### 4.3 Adaptive component behaviours
| Component | Mobile | Desktop |
|---|---|---|
| Fixed Bottom CTA | Floats **above the dock** (bottom 88px + safe-area) or in the dock slot on focus screens; full width minus 16px gutters; scrim fade | Sticky footer in content column, pill max 420px, never overlaps sidebar |
| Bento grid | 1 col stacked | 12-col grid (see §6.1) with bezel frames |
| Category list | Single glass card, divided rows | Same, or 2-col at `xl` |
| Stepper timeline | Vertical, full-width cards; connecting line = 2px gradient (accent→azure) with glowing node on active | Vertical rail, wider cards, sticky summary left |
| Detail tabs | Glass pill segmented control (active = accent gradient pill), scrolls horizontally | Same + 2-col content (text left / complexity table right) |
| Visualizer | Stacked: canvas → Explain/Code/Predict → scrubber → controls | **Split** canvas 60 / panel 40, sticky; controls under canvas |
| Code block | Dark, horizontal scroll | Wider, line highlight, A−/A+/Copy |
| Milestone grid | 2 col `GlowTile`s | 3 col (`lg`), 4 col (`xl`) |
| Heatmap | Scrollable grid | Full grid + legend |
| Modals / sheets | **Bottom sheet** (glass-strong, radius 28 top) | **Centred dialog** max 560 |
| Hover | None | Lift + glow, tooltips on chips |

### 4.4 Input modes
- **Touch:** tap targets ≥ 44×44px; no swipe-only actions.
- **Keyboard (desktop):** everything focusable, visible 2px `accent-bright` ring offset 2px (works on glass). Shortcuts disabled while typing:
  - Visualizer: `Space` play/pause, `←/→` step, `R` reset, `B` bookmark
  - Quiz/Blitz: `1–4` choose option, `Enter` continue/check
  - Global: `/` search, `?` help, `g h` home, `g p` progress
- **Pointer:** hover only enhances.

## 5. Component inventory

(Visual spec for each is in `DESIGN.md` §7; CSS in `AURORA_EFFECTS.md`.)

| Component | Props (key) | States |
|---|---|---|
| `AuroraBackground` | `intensity: app/hero/focus` | animated, static (reduced-motion), paused (hidden tab) |
| `GlassCard` | `tone: default/subtle/strong/solid/aurora`, `tint?`, `interactive?`, `as` | default, hover (lg), selected |
| `BentoTile` | `span`, `visual`, `title`, `desc`, `bezel?` | default, hover |
| `Chip` (KEY value) | `k`, `v`, `tone` | default |
| `DifficultyMeter` | `level 1–3` (3 glowing pips) | – |
| `SegmentedTabs` | `items[]`, `value`, `onChange` | active (animated pill), disabled |
| `StepperTimeline` | `items[]`, `current`, `onSelect` | todo, active (glow), done (mint check) |
| `CategoryRow` | `icon`, `tint`, `title`, `subtitle`, `done`, `total`, `href` | default, pressed |
| `MilestoneCard` / `GlowTile` | `icon`, `title`, `condition`, `progress`, `unlocked` | locked (40%), in-progress, **unlocked (rim glow + ✓ pill)** |
| `StatBlock` | `label`, `value`, `delta?`, `gradient?` | – |
| `ProgressRing` / `ProgressBar` | `value`, `size` | – |
| `Button` | `variant: primary/secondary/ghost/icon-glass`, `size`, `loading` | default, hover, active, loading, disabled, focus |
| `BottomCTA` | `label`, `icon`, `onClick`, `disabled`, `loading` | default, loading, disabled |
| `HeroCard` | `kicker`, `title (with gradient keyword)`, `visual`, `onAction` | default |
| `CodeBlock` | `code`, `lang`, `highlight[]`, `selectableLines?` | default, line-selected, correct/incorrect |
| `PlayerControls` | `playing`, `step`, `total` | playing, paused, end |
| `Scrubber` | `value`, `max` | dragging |
| `OptionButton` | `label`, `state` | idle, hover, selected, correct, incorrect, disabled |
| `FeedbackCard` | `verdict`, `why`, `distractors[]`, `takeaway`, `evidence?` | correct, incorrect |
| `ConfidencePicker` | `value` (Guessing/Unsure/100%) | – |
| `TimerRing` | `seconds`, `onElapsed` | running, warning (≤10s), done |
| `DiagramNode` (SVG) | `id`, `label`, `state` | idle, hover, active (glow), visited |
| `LogicGrid` | `rows`, `cols`, `cells`, `onToggle` | empty, yes, no |
| `Heatmap` | `cells[]`, `levels` | – |
| `Avatar` | `src`, `size` | aurora ring |
| `Sheet/Dialog` | `open`, `onClose` | responsive switch |
| `Skeleton`, `EmptyState`, `ErrorState`, `Toast` | – | – |
| `AppShell`, `SidebarNav`, `FloatingDock`, `ContextPanel`, `ThemeToggle` | – | responsive |

## 6. Screen layouts

### 6.1 Home (bento)
- **Mobile:** TopBar → Continue **HeroCard** (aurora) → Today's Mind Sprint (glass, accent rim) → Streak / Due-for-recall (two small stat tiles side by side) → “Core Modules” 4 tiles stacked → FloatingDock.
- **Desktop lg (12-col bento):**
  - Row 1: HeroCard span 8 (aurora, large title with gradient keyword, ↗ arrow-glass button, primary CTA “Start Lesson”) · Mind Sprint span 4.
  - Row 2: four module tiles, span 6 each (2×2) — each: category glow icon tile, mono `Module I` chip + counts, title, description, footer link. Visual zone shows a small module-specific glow illustration (bars / terminal lines / node graph / grid).
- **xl:** context panel at right shows Streak (StatBlock), Recommended Bite, Due for Recall.
- Greeting line above hero (display, 22px) — optional.

### 6.2 Module landing (e.g. M1 → Pattern Blitz / Bug Audit / Open-Ended)
Mono breadcrumb chip → display title + description → 3 equal bento tiles; each has glow illustration, feature chip row (`45s CARDS`, `61 CANONICAL`), title, 3-line description, mono footer (`SRS ACTIVE`), primary button. Bottom: two ghost links.

### 6.3 Category stepper
Title, icon tile, `0/5 completed` + gradient ProgressBar → vertical stepper; each node card: title, bookmark icon-glass, description, TIME/SPACE chips, difficulty meter. Desktop: sticky left summary, stepper right.

### 6.4 Detail (Overview · Pseudocode · Visualize · Analysis)
Header (title, chips, difficulty) → SegmentedTabs → content (description, complexity table in glass, “Where it shows up” chips, Strengths/trade-offs with +/− icons) → BottomCTA “Start visualization”.

### 6.5 Visualizer player (focus mode)
Header: back, title, shuffle, **Mark done**. Chips row. Canvas card (glass + `aurora-focus` halo) with legend (Running, Waiting, Returned, Repeated — each = colour + shape + label). Tabs Explain / Code / Predict. Stat chips. `Step n / N` + description, scrubber (gradient fill), controls: reset, prev, **play (accent gradient, 56px, glow)**, next, settings. Desktop split pane + shortcuts. Aurora intensity `focus`.

### 6.6 Progress / Milestones
Metric hero: glass card with `StatBlock` XP (numeral XL, gradient), streak, completion ring, 3 sub-stats separated by hairlines. Heatmap card below. Milestones grid of `GlowTile`s (unlocked = rim glow + “Unlocked” pill).

### 6.7 Bookmarks
Filter by module (SegmentedTabs) → list of glass-solid cards → EmptyState with CTA.

### 6.8 Quiz / Blitz / Bug Audit / Mind Sprint (focus mode)
Top: progress bar + TimerRing. Middle: question in glass card (violet focus halo). Options as `OptionButton`s (A–D chips). Bottom: CTA. Desktop with code: **two columns** (code | options & feedback). FeedbackCard slides in below (mobile) or in right column (desktop) with coloured rim glow. “Saved to Mistakes” chip uses bad tone. Canonical pseudocode block below feedback.

### 6.9 Lesson player (M3)
5-segment gradient progress. Mobile: stage content + BottomCTA. Desktop: left stage list, centre content, right reference cards (`xl`). Focus intensity.

### 6.10 Paywall
Two cards: Free (glass) vs Pro (aurora-card, “Most popular” chip). Stacked on mobile, side-by-side on desktop → “Upgrade” primary CTA → Razorpay Checkout → success state that waits for entitlement refetch (skeleton + mint check).

### 6.11 Settings
Profile, target role/stack, resume (replace/delete), theme (Dark / Light / System), data export, delete account, subscription management, accessibility mode (extend timers, reduce motion, reduce transparency).

### 6.12 Landing & Auth (the only place with alternating dark/light bands)
Landing: aurora-`hero` background, display headline with gradient keyword, 4 module bento tiles with bezel + corner screws (decorative), stats strip with numerals XL, pricing, CTA aurora-card. Auth: centred glass-strong card, social buttons, email.

## 7. Navigation rules
- Primary nav: **Home · Progress · Bookmarks** (floating dock on mobile, glass sidebar on desktop). Modules reachable from Home and the sidebar list.
- Back arrow always visible on detail screens; browser back and deep links work.
- Active nav item: accent-tinted glass pill (sidebar) / filled glowing circle (dock).
- Never hide the primary action behind a menu.
- Continue card always points to the last incomplete item across modules.
- Dock hides on focus screens (quiz, visualizer, lesson) to give the CTA the bottom slot.

## 8. States
| State | Pattern |
|---|---|
| Loading | Glass skeleton cards matching final layout with soft shimmer; no full-page spinners |
| Empty | Glow icon tile + one sentence + one CTA |
| Error | Plain-language message + Retry; Sentry event id in small mono text |
| Offline | Glass banner; Mind Sprint & opened lessons keep working |
| AI unavailable | Silent fallback; small “AI features paused” chip |
| Locked (Pro) | Card with lock icon + gradient-border “Pro” chip + upgrade sheet; never dead-end |
| Cold start (Render) | Static shell + aurora + skeletons so wake-up is never a blank page |

## 9. Motion
- 150–250ms ease `cubic-bezier(.2,.8,.2,1)`; hero entrance 500–700ms; bento stagger 40ms (max 8).
- Aurora drift: transform-only, 40–70s, **off** in focus screens, reduced-motion, hidden tab.
- Visualizer animations must **teach**.
- `prefers-reduced-motion`: fades only, no drift, no autoplay, no count-up. `prefers-reduced-transparency`: glass → solid surfaces.

## 10. Accessibility
- Text contrast ≥ 4.5:1 **measured over the brightest aurora region behind the element**. White text on accent gradient only (never on azure/mint fills); dark text on any light fill.
- Never colour alone: visualizer states use colour + shape + label; correct/incorrect use +/− icons and text.
- Tap targets ≥ 44px; focus ring visible on every interactive; logical tab order; skip-to-content.
- Landmarks (`nav`, `main`, `aside`); `aria-live=polite` for feedback and timers.
- Diagrams have text equivalents; SVG nodes are buttons with labels.
- Timers: can be disabled/extended (accessibility mode).
- Zoom to 200% without loss; no horizontal page scroll at 360px.
- Decorative aurora/grain/contour layers: `aria-hidden`, `pointer-events:none`.

## 11. Performance budget
- Mobile LCP < 2.5s mid-range Android on 4G; JS per route < 170KB gz.
- Aurora = CSS only (no canvas/WebGL/video/images). ≤ 3 blobs on phones, blur ≤ 80px, transform-only.
- ≤ ~12 `backdrop-filter` elements per mobile viewport; long lists use `glass--solid`.
- Fonts: 3 families, `display: swap`, subset latin, only needed weights.
- Dynamic-import heavy visualisers; code-split by module. SVG illustrations, `next/image` for rasters.

## 12. Anti-patterns (do NOT)
- ❌ Ads, ad placeholders, promo banners.
- ❌ A second action colour; aurora hues used for buttons, text bodies, or meaning.
- ❌ Copying reference-image colours (orange / lime), logos, avatars, or copy.
- ❌ Black drop shadows; hard gradients on cards; gradient text below 56px (except the single hero keyword).
- ❌ Blur on long lists; animated aurora on focus screens.
- ❌ Hover-only interactions; desktop-only features.
- ❌ Full-width stretched content on large screens.
- ❌ Separate mobile/desktop codebases.
- ❌ Leaderboards, confetti, XP for time-on-page, decorative non-teaching animation.
- ❌ Fixed bottom CTA overlapping sidebar or dock.
- ❌ Changing routes, data flow, copy meaning, or screen order — this redesign is **visual only**.

## 13. Implementation checklist (per screen)
- [ ] Uses tokens only (no raw hex / px radius in components)
- [ ] Aurora layer present with correct intensity; text sits on glass/scrim
- [ ] Bento / glass / rim-light patterns applied per DESIGN.md
- [ ] Verified at 360, 768, 1024, 1440 widths, **dark and light**
- [ ] Dock (base) / rail (sm) / sidebar (lg+) correct; CTA per §4.3
- [ ] Keyboard-operable with visible focus
- [ ] Loading, empty, error states styled
- [ ] Accent used only for primary/active/progress/focus
- [ ] Contrast checked over aurora; reduced-motion & reduced-transparency tested
- [ ] Backdrop-filter count and animation cost checked on mobile
