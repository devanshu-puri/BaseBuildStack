# UI_SPEC.md — Responsive UI Specification

> Source of truth: `Design.md` (reference-image design system) + reference screenshots.
> Scope: **one responsive web app** (mobile · tablet · desktop). Mobile-first.
> Read after: MODULES.md · Read before: RULES.md

---

## 1. Principles

1. **Mobile-first, desktop-enhanced.** Design for 360px, then add space and panes. Never shrink a desktop layout.
2. **One accent.** Lime is for primary actions, progress, active states only.
3. **Cards on a dot-grid canvas.** 1px hairline borders, no heavy shadows.
4. **Monospace for metadata.** `[KEY] value` chips for time/space/difficulty/limits.
5. **Same structure everywhere.** Stepper, chips, feedback card look identical across modules.
6. **No ads. Ever.**

## 2. Design tokens (filled from reference screenshots)

Values are sampled from the reference UI; fine-tune visually if needed.

```css
:root {
  /* Canvas & surfaces */
  --surface-canvas:      #F2F2EE;
  --surface-card:        #FBFBF9;
  --surface-card-subtle: #E9EAE3;
  --canvas-dot-color:    rgba(20, 20, 15, 0.10);

  /* Borders */
  --border-subtle: rgba(20, 20, 15, 0.08);
  --border-focus:  #1A1A17;

  /* Text */
  --text-primary:   #1A1A17;
  --text-secondary: #4B4F4A;
  --text-muted:     #7C807A;
  --text-on-accent: #1A1A17;

  /* Accent (single vivid colour) */
  --brand-accent:        #C6F25A;
  --brand-accent-hover:  #B7E441;
  --brand-accent-subtle: rgba(198, 242, 90, 0.22);

  /* Category tints (icon badges only) */
  --category-tint-1: #E8E4F6; /* Programming concepts – violet */
  --category-tint-2: #EFE6DE; /* Data structures – brown */
  --category-tint-3: #F8E1E5; /* Sorting – pink */
  --category-tint-4: #F8E6D2; /* Searching – orange */

  /* Semantic (visualizer + feedback only) */
  --state-running: #F2A93B;
  --state-waiting: #3B5BDB;
  --state-done:    #2F9E6B;
  --state-repeat:  #8E6FD8;
  --state-good-bg: #DDEBD3;  --state-good-fg: #2D5A1B;
  --state-bad-bg:  #F6DDD8;  --state-bad-fg:  #B3382A;
}
:root[data-theme="dark"] {
  --surface-canvas: #121410; --surface-card: #1A1C17; --surface-card-subtle: #23261F;
  --canvas-dot-color: rgba(255,255,255,0.08); --border-subtle: rgba(255,255,255,0.08);
  --text-primary: #F3F4EE; --text-secondary: #B9BDB3; --text-muted: #8A8F84;
}
```
Dark theme is **optional/Phase 2**; tokens exist so it is a pure token swap.

## 3. Typography & spacing

| Role | Mobile | Desktop (≥1024) | Weight |
|---|---|---|---|
| Display / Hero | 28px | 34px | 700 |
| Section title | 18px | 22px | 600 |
| Card header | 15px | 17px | 600 |
| Body | 14px | 15px | 400 |
| Caption/meta | 12px | 13px | 500 |
| Mono (chips, code) | 11–12px | 12–13px | 400/500 |

- Fonts: a clean grotesk for UI (e.g. Inter / Geist) + a mono (e.g. JetBrains Mono / Geist Mono). Load with `next/font`; define fallback stacks.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48. Radii: pill 9999, large 20–24, medium 12–16, small 6–8.
- **Highlighter motif:** one keyword per hero headline gets `--brand-accent-subtle` pill background.

## 4. Responsive system

### 4.1 Breakpoints
| Name | Width | Layout |
|---|---|---|
| `base` | 0–639 | Phone: single column, **bottom nav**, fixed bottom CTA |
| `sm` | 640–1023 | Tablet/large phone: single column (max 720), **icon rail** left (72px) |
| `lg` | 1024–1279 | Desktop: **sidebar** (248px) + content (max 1040) |
| `xl` | ≥1280 | Desktop wide: sidebar + content (max 1040) + **context panel** (320px) |

### 4.2 App shell
```
base:     [TopBar] [Content ........] [BottomNav: Home · Progress · Bookmarks]
sm:       [Rail] [TopBar + Content (max 720)]
lg:       [Sidebar 248] [TopBar + Content (max 1040)]
xl:       [Sidebar 248] [Content (max 1040)] [ContextPanel 320]
```
- **Sidebar (lg+):** logo, nav (Home, Progress, Bookmarks), module links (I–IV with progress counts), Settings, user menu, Pro badge/upgrade.
- **Context panel (xl):** streak, today's Mind Sprint, "Next up", due reviews. On smaller screens these become cards at the top of Home.
- **TopBar:** page title + back; right: search (lg+), theme/settings, avatar.
- Content is centred with `max-width`; the dot-grid canvas always fills the viewport.

### 4.3 Adaptive component behaviours
| Component | Mobile | Desktop |
|---|---|---|
| Fixed Bottom CTA | Fixed, full width minus 16px gutters, safe-area aware, blur scrim | **Sticky footer inside content column**, pill `max-width: 420px`, right-aligned or centred; never spans the sidebar |
| Category list | Single card with divided rows | Same card; or 2-column grid of cards at `xl` |
| Stepper timeline | Vertical, cards full width | Vertical rail with wider cards; optional two-column detail |
| Detail tabs (Overview/Pseudocode/Visualize/Analysis) | Pill tabs, horizontal scroll if needed | Pill tabs + content in 2 columns (text left, complexity table right) |
| Visualizer | Stacked: canvas → Explain/Code/Predict → scrubber → controls | **Split:** canvas 60% / panel 40%; controls under canvas; sticky |
| Code block | Horizontal scroll inside block | Wider, line highlight, font A-/A+, Copy |
| Milestone grid | 2 columns | 3 columns (`lg`), 4 (`xl`) |
| Heatmap | Scrollable grid | Full grid + legend |
| Modals/sheets | **Bottom sheet** | **Centered dialog** (max 560) |
| Hover | None (touch) | Hover states, tooltips on chips |

### 4.4 Input modes
- **Touch:** tap targets ≥ 44×44px; swipe not required for any action.
- **Keyboard (desktop):** all interactive elements focusable with visible `--border-focus` ring. Shortcuts (disabled while typing):
  - Visualizer: `Space` play/pause, `←/→` step, `R` reset, `B` bookmark
  - Quiz/Blitz: `1–4` choose option, `Enter` continue/check
  - Global: `/` search, `?` shortcut help, `g h` home, `g p` progress
- **Pointer:** hover affordances only enhance; nothing is hover-only.

## 5. Component inventory

| Component | Props (key) | States |
|---|---|---|
| `Card` | `tone: default/subtle/accent`, `padding`, `as` | default, hover (lg), selected |
| `Chip` (KEY value) | `k`, `v`, `tone` | default |
| `DifficultyMeter` | `level 1–3` | – |
| `SegmentedTabs` | `items[]`, `value`, `onChange` | active slides (animated), disabled |
| `StepperTimeline` | `items[]`, `current`, `onSelect` | todo, active, done |
| `CategoryRow` | `icon`, `tint`, `title`, `subtitle`, `done`, `total`, `href` | default, pressed |
| `MilestoneCard` | `icon`, `title`, `condition`, `progress`, `unlocked` | locked, in-progress, **unlocked (accent tint + ✓ pill)** |
| `ProgressRing` / `ProgressBar` | `value`, `size` | – |
| `BottomCTA` | `label`, `icon`, `onClick`, `disabled`, `loading` | default, loading, disabled |
| `HeroCard` | `kicker`, `title`, `visual`, `onAction` | default |
| `CodeBlock` | `code`, `lang`, `highlight[]`, `selectableLines?` | default, line-selected, correct/incorrect |
| `PlayerControls` | `playing`, `step`, `total` | playing, paused, end |
| `Scrubber` | `value`, `max` | dragging |
| `OptionButton` | `label`, `state` | idle, selected, correct, incorrect, disabled |
| `FeedbackCard` | `verdict`, `why`, `distractors[]`, `takeaway`, `evidence?` | correct, incorrect |
| `ConfidencePicker` | `value` (Guessing/Unsure/100%) | – |
| `TimerRing` | `seconds`, `onElapsed` | running, warning (≤10s), done |
| `DiagramNode` (SVG) | `id`, `label`, `state` | idle, hover, active, visited |
| `LogicGrid` | `rows`, `cols`, `cells`, `onToggle` | empty, yes, no |
| `Sheet/Dialog` | `open`, `onClose` | responsive switch |
| `Skeleton`, `EmptyState`, `ErrorState`, `Toast` | – | – |
| `AppShell`, `SidebarNav`, `BottomNav`, `ContextPanel` | – | responsive |

## 6. Screen layouts

### 6.1 Home
- **Mobile:** TopBar → Continue **HeroCard** → Today's Mind Sprint card → "Foundations" category list (4 rows + counts) → BottomNav.
- **Desktop:** Greeting + Hero (wide) → two-column below: category list (left) / modules I–IV overview cards (right). `xl`: context panel shows streak and due reviews.

### 6.2 Category stepper
Title, icon tile, `0/5 completed` + progress bar → vertical stepper; each node has a card: title, bookmark, description, TIME/SPACE chips, difficulty meter. Desktop: sticky left summary, stepper right.

### 6.3 Detail (Overview · Pseudocode · Visualize · Analysis)
Header (title, chips, difficulty) → SegmentedTabs → content (description, Complexity table, "Where it shows up" chips, Strengths/trade-offs with +/− icons) → BottomCTA "Start visualization".

### 6.4 Visualizer player
Header: back, title, shuffle, **Mark done**. Chips row. Canvas card with legend (Running, Waiting, Returned, Repeated). Tabs: **Explain / Code / Predict**. Stat chips (Calls, Max depth). `Step n / N` + description, scrubber, controls (reset, prev, **play (accent)**, next, settings). Desktop: split pane with keyboard shortcuts.

### 6.5 Progress / Milestones
Metric hero (XP, streak, completion ring, 3 sub-stats separated by hairlines) → Milestones grid (unlocked = accent tint + "Unlocked" pill).

### 6.6 Bookmarks
Filter by module (SegmentedTabs) → list of cards → empty state with CTA.

### 6.7 Quiz / Blitz / Bug Audit / Mind Sprint
- Top: progress + timer. Middle: question. Bottom: CTA.
- Desktop Bug Audit/Quiz with code: **two columns** (code | options & feedback).
- Feedback: FeedbackCard slides in below (mobile) or in right column (desktop).

### 6.8 Lesson player (M3)
5-segment progress bar. Mobile: stage content + BottomCTA. Desktop: left stage list, centre content, right reference cards (`xl`).

### 6.9 Paywall
Free vs Pro comparison in two cards (stacked on mobile, side-by-side on desktop) → "Upgrade" CTA → Razorpay Checkout → success state that waits for entitlement refetch.

### 6.10 Settings
Profile, target role/stack, resume (replace/delete), theme, data export, delete account, subscription management.

### 6.11 Auth & Landing
Landing (marketing): hero with highlighter keyword, 4 module cards, pricing, CTA. Auth: centred card, social buttons, email.

## 7. Navigation rules

- Primary nav: **Home · Progress · Bookmarks** (bottom nav on mobile, sidebar on desktop). Modules are reachable from Home and from the sidebar module list.
- Back arrow always visible on detail screens; browser back works; deep links work for every screen.
- Active nav item uses accent pill (as in reference).
- Never hide the primary action behind a menu.
- Resume: Continue card always points to the last incomplete item across modules.

## 8. States

| State | Pattern |
|---|---|
| Loading | Skeleton cards matching final layout; no spinners over full pages |
| Empty | Icon tile + one sentence + one CTA |
| Error | Plain-language message + Retry; Sentry event id in small mono text |
| Offline | Banner; Mind Sprint and already-opened lessons keep working |
| AI unavailable | Silent fallback to cached/deterministic content; small "AI features paused" chip if relevant |
| Locked (Pro) | Card with lock icon + "Pro" chip + upgrade sheet; never dead-end |
| Cold start (Render) | Static app shell + skeletons so wake-up isn't a blank page |

## 9. Motion

- Durations 150–250ms; ease-out. Tab pill slides; cards fade/slide 8px.
- Visualizer animations must **teach**; if removing one loses nothing, remove it.
- Respect `prefers-reduced-motion`: replace slides with fades, stop autoplay, show static final step with manual stepping.

## 10. Accessibility

- Text contrast ≥ 4.5:1 (check accent: **dark text on lime**, never white on lime).
- Don't rely on colour alone: visualizer states also use shape/label; correct/incorrect use +/− icons and text.
- Tap targets ≥ 44px; focus ring on all interactives; logical tab order; skip-to-content link.
- Semantic landmarks (`nav`, `main`, `aside`); `aria-live` for feedback and timers (polite).
- Diagrams have text equivalents; SVG nodes are buttons with labels.
- Timers: allow disabling or extending time in Settings (accessibility mode).
- Zoom to 200% without loss; no horizontal page scroll at 360px.

## 11. Performance budget

- Mobile LCP < 2.5s on mid-range Android over 4G; JS per route < 170KB gz where feasible.
- Dynamic-import heavy visualisers; code-split by module.
- Images: `next/image`, SVG for illustrations. No video.

## 12. Anti-patterns (do NOT)

- ❌ Ads, ad placeholders, promo banners (the reference app has ads, we do not).
- ❌ A second accent colour. Category tints are for icon tiles only.
- ❌ Heavy drop shadows or gradients on cards.
- ❌ Hover-only interactions or desktop-only features without a touch equivalent.
- ❌ Full-width stretched content on large screens (always cap width).
- ❌ Separate mobile and desktop codebases or duplicated screens.
- ❌ Leaderboards, confetti spam, XP for time-on-page.
- ❌ Decorative animation that doesn't teach.
- ❌ Fixed bottom CTA overlapping the desktop sidebar.

## 13. Implementation checklist (per screen)

- [ ] Dot-grid canvas visible; cards 16–24px radius
- [ ] Verified at 360, 768, 1024, 1440 widths
- [ ] Bottom nav (base) / rail (sm) / sidebar (lg+) correct
- [ ] CTA behaves per §4.3
- [ ] Keyboard-operable with visible focus
- [ ] Loading, empty, error states
- [ ] Accent used only for primary/active/progress
- [ ] Reduced-motion tested
