---
version: 2.0
name: BaseBuildStack-aurora-glass
description: >
  The visual language of BaseBuildStack. Atmospheric aurora / blurred-fluid gradient backgrounds,
  frosted-glass surfaces with luminous rim light, bento-grid composition, oversized numerals,
  floating glass navigation and glowing data. Derived from a pattern study of the reference
  images, re-coloured to an original palette (indigo-violet + azure + mint aurora on deep ink).
  This file is the SINGLE SOURCE OF TRUTH for look & feel. UI_SPEC.md owns layout and behaviour.

colors:
  # ---------- DARK (default) ----------
  bg-base: "#07080F"
  bg-raised: "#0D0F1A"
  surface-solid: "#12141F"
  surface-glass: "rgba(255,255,255,0.05)"
  surface-glass-strong: "rgba(255,255,255,0.08)"
  border-hairline: "rgba(255,255,255,0.09)"
  border-strong: "rgba(255,255,255,0.18)"
  rim-highlight: "rgba(255,255,255,0.14)"
  text-primary: "#F4F5FB"
  text-secondary: "#B4B8CC"
  text-muted: "#8A90AA"
  # ---------- ACCENT (actions / active / progress ONLY) ----------
  accent: "#5E4EF0"
  accent-hover: "#7061FF"
  accent-bright: "#9C8FFF"      # accent used as TEXT/icon on dark
  on-accent: "#FFFFFF"
  # ---------- AURORA (atmosphere ONLY: backgrounds, glows, gradient text) ----------
  aurora-violet: "#6C4DFF"
  aurora-azure: "#2BB7FF"
  aurora-mint: "#2EE6C5"
  aurora-rose: "#FF5FA2"        # sparing, <=15% of any aurora field
  # ---------- SEMANTIC (visualizer + feedback only) ----------
  state-running: "#FFB547"
  state-waiting: "#5B8CFF"
  state-done: "#34D399"
  state-repeat: "#A78BFA"
  good-bg: "rgba(52,211,153,0.14)"
  good-fg: "#6EE7B7"
  bad-bg: "rgba(255,107,107,0.14)"
  bad-fg: "#FF8A8A"
  # ---------- LIGHT ("Pearl") ----------
  light-bg-base: "#F4F3FA"
  light-bg-raised: "#FFFFFF"
  light-surface-glass: "rgba(255,255,255,0.68)"
  light-border-hairline: "rgba(20,21,42,0.08)"
  light-text-primary: "#14152A"
  light-text-secondary: "#4A4E69"
  light-text-muted: "#666B86"

typography:
  display:  { fontFamily: "Bricolage Grotesque", fallback: "ui-sans-serif, system-ui", weights: [600, 700, 800], use: "Hero, section titles, big numerals" }
  ui:       { fontFamily: "Geist", fallback: "Inter, ui-sans-serif, system-ui", weights: [400, 500, 600], use: "Body, labels, buttons" }
  mono:     { fontFamily: "Geist Mono", fallback: "JetBrains Mono, ui-monospace", weights: [400, 500], use: "[KEY] value chips, code, metadata, numerals in tables" }
  scale:
    numeral-xl: "clamp(56px, 9vw, 112px) / 0.95 / 800 / -0.03em  (display)"
    display-hero: "clamp(30px, 4.2vw, 48px) / 1.05 / 700 / -0.025em (display)"
    section-title: "clamp(20px, 2.2vw, 26px) / 1.2 / 600 / -0.015em (display)"
    card-title: "16-18px / 1.3 / 600 (ui)"
    body: "14-15px / 1.55 / 400 (ui)"
    caption: "12-13px / 1.4 / 500 (ui)"
    mono-meta: "11-12px / 1.4 / 500 / 0.04em uppercase (mono)"

rounded: { xs: 6, sm: 10, md: 16, lg: 24, bezel: 28, pill: 9999 }
spacing: [4, 8, 12, 16, 24, 32, 48, 64]
---

# 1. Design intent

BaseBuildStack must feel like **a premium, calm, focused study instrument**, not a generic
"lime-on-beige" dashboard. The new identity is **atmospheric and luminous**: light seems to come
*from inside* the interface (aurora fields, rim-lit glass, glowing data), while content stays
razor-sharp and highly legible. Learning content (code, quizzes, visualizer) always sits on
**calm, high-contrast surfaces**; atmosphere lives behind and around it, never behind body text.

Three words: **Luminous. Calm. Precise.**

---

# 2. Pattern analysis of the reference images

| # | Pattern observed | Where seen | How BaseBuildStack adopts it |
|---|---|---|---|
| P1 | **Aurora / blurred fluid gradient** — large blurred colour blobs melting into each other, one hue family with a warm/cool contrast point | Slide decks (img 2, 3), sunset app (img 4), hero tile (img 1) | `AuroraBackground` behind pages + intense `AuroraCard` for hero & CTAs |
| P2 | **Bento grid** — mixed-size tiles in one tight grid, each tile = illustration/data on top, title + one-line description at bottom | img 1 | Home modules, Progress, Milestones, Landing features |
| P3 | **Bezel / inset frame** — tile sits inside a slightly lighter outer frame with tiny corner screws | img 1 | `BentoTile` double-border (outer frame + inner card); screws are optional decoration on landing only |
| P4 | **Glass surfaces** — translucent cards, blurred backdrop, 1px light border, inner top highlight | img 4, 5 | `GlassCard` (default surface) |
| P5 | **Rim light / glowing edge** — bottom or full-perimeter neon edge on dark tiles | img 2 (numbered tiles) | `GlowTile` for numbered steps, selected options, unlocked milestones |
| P6 | **Oversized numerals with tiny caption** — "72%", "$7.2", "3.048", "6:47" | img 2, 3, 4, 5 | `StatBlock`: XP, streak, completion %, scores |
| P7 | **Floating glass dock navigation** — pill-shaped, detached from the screen edge, active item is a filled glowing circle | img 5 | Mobile bottom nav becomes `FloatingDock` |
| P8 | **Glowing data-viz** — blurred-glow bars, heat cells that light up, dotted-circle grids, gradient progress bars with spectrum fill | img 1, 3, 4, 5 | Heatmap, progress bars, ring, visualizer node glow |
| P9 | **Pill chips + status badges** with soft tinted fill | img 5 | `Chip`, `StatusBadge` |
| P10 | **Gradient pill CTA with soft coloured shadow** | img 1, 5 | `Button` primary |
| P11 | **Dark ↔ light twin themes with identical structure** | img 1 (top/bottom) | Token-swap themes; same components both modes |
| P12 | **Layered depth without hard shadows** — depth = blur + translucency + glow, not black drop shadows | all | Elevation model in §6 |
| P13 | **Thin line illustrations / circuit & contour lines** as faint tile textures | img 1 | `ContourTexture` SVG at 4–6% opacity inside hero tiles |
| P14 | **Gradient-ringed avatars / glowing outlines** | img 1 | Avatar ring uses aurora conic gradient |
| P15 | **Alternating section polarity** (dark band / light band) | img 3 | Landing page only — never inside the app |

**What we deliberately do NOT copy:** the reference colours (orange/green), brand logos, lorem copy,
screw ornaments inside the app, or the warm-brown palette. Only structure, effects and rhythm.

---

# 3. Colour system

## 3.1 Roles
- **Canvas** `bg-base`: deep ink-navy, never pure black (avoids OLED smear, lets aurora read).
- **Surfaces**: glass (translucent white) over canvas; `surface-solid` fallback when blur unsupported.
- **Accent (indigo `#5E4EF0`)**: the ONE action colour — primary buttons, active nav, focus, progress fill, selected state.
- **Aurora (violet/azure/mint/rose)**: *atmosphere only*. Never used for text bodies, never as button fill except the primary gradient (accent→deep blue).
- **Semantic**: running/waiting/done/repeat + good/bad. Used only in visualizer & feedback.

## 3.2 Aurora recipes (all blurred 80–140px, 0.35–0.6 opacity on dark)
| Name | Stops | Used on |
|---|---|---|
| `aurora-page` | violet 40% @ top-left, azure 30% @ top-right, mint 18% @ bottom-centre | App background (very low opacity: 0.22) |
| `aurora-hero` | violet → azure → mint, conic-ish swirl + rose 10% accent blob | Home hero card, landing hero |
| `aurora-cta` | accent `#5E4EF0` → `#3D5AF1` linear 135° + soft white radial highlight top-left | Primary CTA card/buttons |
| `aurora-success` | mint → azure | Unlocked milestone, correct answer rim |
| `aurora-focus` | violet only, tight | Visualizer canvas halo, quiz question halo |

## 3.3 Contrast (verified targets)
- `text-primary` on `bg-base`: ≥ 15:1 · `text-secondary`: ≥ 8:1 · `text-muted`: ≥ 5:1
- White on `accent #5E4EF0`: ≈ 5.5:1 ✅ (so CTA text is white — never on a lighter azure/mint fill)
- `accent-bright` on dark: ≥ 6:1 (use for links/active text on dark)
- Text over aurora **must** sit on a `GlassCard` or a scrim ≥ 55% — never bare on a gradient except display numerals ≥ 56px.

## 3.4 Category tints (icon tiles only, glow versions)
M1 DSA → violet `#8B7CFF` · M2 Quizzes → amber `#FFB547` · M3 Tech Bites → azure `#2BB7FF` · M4 Mind Sprint → mint `#2EE6C5`.
Tile = 40–48px rounded square, tint at 14% fill + 1px tint border at 30% + soft glow `0 0 24px tint@25%`.

---

# 4. Typography

**Why this trio:** *Bricolage Grotesque* gives headlines a confident, slightly editorial character
(avoids the "every SaaS uses Inter" look) and holds up at huge numeral sizes. *Geist* is crisp and
neutral for long reading and dense UI. *Geist Mono* makes metadata chips feel technical and matches Geist.

- Load with `next/font/google` (`Bricolage_Grotesque`, `Geist`, `Geist_Mono`), `display: "swap"`, CSS variables `--font-display`, `--font-ui`, `--font-mono`. If `Geist` is unavailable in the installed Next version, fall back to `Inter`.
- Headlines: tight tracking (`-0.02…-0.03em`). Mono meta: uppercase, `+0.04em`.
- **Gradient keyword motif (replaces lime highlighter):** exactly ONE keyword per hero headline uses
  `background: linear-gradient(90deg, var(--aurora-violet), var(--aurora-azure), var(--aurora-mint)); -webkit-background-clip:text; color:transparent;`
  plus a faint same-gradient glow (`text-shadow` via filter drop-shadow 0 0 24px @30%). Not allowed on body or small text.
- Numerals in `StatBlock` use display font, `font-variant-numeric: tabular-nums`.

---

# 5. Shape, spacing, grid

- Radii: bezel/outer tiles 28 · cards 24 · inner blocks/inputs 16 · chips 10 · pills/buttons 9999.
- Spacing scale 4·8·12·16·24·32·48·64. Bento gap 12 (mobile) / 16 (desktop).
- **Bento grid (desktop lg+):** 12-col, rows auto. Typical Home: Hero spans 8 cols × 2 rows; Streak 4×1; Mind Sprint 4×1; four module tiles 3 cols each… (see UI_SPEC §6.1).
- **Bezel (P3):** `BentoTile` = outer 1px hairline frame with 6px padding + inner glass card. On mobile drop the outer frame (keep single border) to save space.

---

# 6. Elevation & depth model (no black drop shadows)

| Level | Treatment |
|---|---|
| L0 Canvas | `bg-base` + aurora-page + grain (3% noise) |
| L1 Glass card | glass fill + 1px hairline + inner top highlight `inset 0 1px 0 rim-highlight` + `backdrop-filter: blur(16px) saturate(140%)` |
| L2 Raised / hover | L1 + border-strong + coloured ambient glow `0 24px 60px -24px accent@40%` + translateY(-2px) |
| L3 Overlay (sheet/dialog/dock) | glass-strong + blur(24px) + 1px border-strong + scrim 50% on canvas |
| Glow rim (P5) | `box-shadow: inset 0 -1px 0 tint, inset 0 0 0 1px tint@35%, 0 8px 32px -8px tint@45%` |

Light theme: same structure, glow shadows become soft tinted shadows at lower opacity; aurora uses pastel
at 0.35 opacity; glass = white 68% + blur; no pure-black shadows anywhere.

---

# 7. Components (visual spec)

**GlassCard** — default surface. Radius 24, padding 16 (mobile) / 20–24 (desktop). Variants: `default`, `subtle` (glass 3%), `solid` (fallback / code), `aurora` (aurora-hero fill with scrim, for hero only), `glow(tint)`.

**BentoTile** — GlassCard + optional bezel + structure: *visual zone (top, ≥ 55%)* → *title (card-title)* → *one-line muted description*. Hover (lg+): L2 + visual zone brightens.

**Button**
- `primary`: gradient `#5E4EF0 → #3D5AF1`, white text, pill, height 44 (48 for CTA), inner top highlight, shadow `0 10px 30px -10px #5E4EF0 @70%`. Hover: brighten + glow grows. Active: scale .98.
- `secondary`: glass fill + border-strong + text-primary.
- `ghost`: transparent, text-secondary, hover glass.
- `icon-glass`: 40–44 circle, glass, used for bookmark/shuffle/settings; arrow-in-circle (↗) on hero cards.
- Focus ring: 2px `accent-bright` + 2px offset in canvas colour (visible on glass).

**Chip `[KEY] value`** — mono 11–12px, glass subtle, radius 10, key in `text-muted`, value in `text-primary`. Tone variants use semantic tint at 14% bg.

**FloatingDock (mobile/base)** — detached pill, 12px from bottom + safe-area, width min(92vw, 420px), height 64, glass-strong blur 24. 3 items (Home · Progress · Bookmarks). Active = 48px filled accent circle with white icon + glow; inactive = icon-only `text-secondary`; label shown only for active (slide in).

**Sidebar (lg+)** — glass panel, full height, 1px right hairline. Active item: accent-tinted glass pill (accent @16% fill, accent-bright text, 1px accent@35% border, left 3px glow bar). Module rows show mono counts.

**StatBlock** — caption (mono-meta) → numeral (display, `numeral-xl` on hero / 40–56px in cards) → delta chip. Numerals may use aurora gradient fill only when ≥ 56px.

**GlowTile (numbered steps / unlocked milestone)** — dark glass rounded-square (radius 28), big numeral centred, bottom rim light in tint, tiny star/pin at top-centre (optional). Locked: no rim, 40% opacity, lock glyph.

**ProgressBar** — 8px pill track (glass), fill = gradient accent→azure→mint with blurred glow under fill. **ProgressRing** — SVG stroke gradient, round caps, glow filter.

**Heatmap cells** — 28–32px radius 10; levels: off (glass), 1 (violet@25%), 2 (violet@50%), 3 (accent), 4 (accent + glow + mint rim). Legend uses same cells.

**OptionButton** — glass row, letter chip left. States: hover (border-strong), selected (accent rim + accent@10% fill), correct (mint rim glow + good-bg), incorrect (red rim + bad-bg). Icons +/− accompany colour.

**FeedbackCard** — GlassCard with 3px coloured left rim glow (good / bad). Sections: WHY / DISTRACTOR TAKEDOWN / KEY TAKEAWAY (key takeaway in subtle inner block with mono label).

**CodeBlock** — ALWAYS dark (`#0B0D17`) in both themes, hairline border, header bar with lang chip + A−/A+/Copy as icon-glass. Highlighted line = accent@14% bg with left accent bar. Syntax palette: violet keywords, azure functions, mint strings, amber numbers, muted comments (all ≥ 4.5:1 on code bg).

**Visualizer canvas** — GlassCard + `aurora-focus` halo behind; nodes are glass circles with state rim; active node glows; edges are 1.5px lines with animated dash only when it teaches.

**Avatar** — 32–40px, conic aurora ring 2px.

**Pro badge** — mono chip with gradient border (violet→azure) and glass fill; Free-plan card in sidebar is a mini `aurora-cta` card.

**Inputs** — glass fill, hairline border, radius 16, focus = accent border + 4px accent@22% ring.

**Toast / Sheet / Dialog** — L3 glass; sheet radius 28 top corners; dialog max 560.

---

# 8. Aurora background system

Three fixed layers, `position: fixed; inset: 0; z-index: -1; pointer-events: none`:
1. **Base** `bg-base`.
2. **Aurora blobs** — 3 (app) or 5 (landing) absolutely positioned radial-gradient divs, `filter: blur(90–140px)`, `mix-blend-mode: screen` (dark) / `multiply` at lower opacity (light), slow drift animation (transform only, 40–70s, ease-in-out, alternate).
3. **Grain + mask** — SVG fractal noise @3–4% opacity; optional faint dot/line grid masked with radial fade (keeps the original "dot-grid" DNA, but only visible near the centre/top).
Full CSS recipes live in `AURORA_EFFECTS.md`.

**Intensity by context**
| Context | Aurora opacity | Motion |
|---|---|---|
| Landing hero | 0.55–0.7 | drift on |
| Home hero card | 0.5 inside card | drift on (card only) |
| App pages | 0.18–0.25 | drift on, very slow |
| Quiz / Blitz / Bug Audit / Visualizer (focus modes) | 0.10–0.14, static | **off** (no distraction while thinking) |
| `prefers-reduced-motion` or Save-Data | any | **off**, static gradient |

---

# 9. Motion

150–250ms `cubic-bezier(.2,.8,.2,1)` for UI; 500–700ms for entrance of hero. Entrance: fade + translateY 8px, 40ms stagger in bento grids (max 8 items). Hover glow transitions 200ms. Numeral count-up ≤ 600ms (once). No parallax, no confetti. Animations must teach or orient; otherwise delete.

---

# 10. Do / Don't

**Do**
- Keep ONE action colour (indigo). Let aurora be atmosphere only.
- Put every text block on glass or a scrim. Verify contrast over the *brightest* part of the aurora.
- Use oversized numerals + tiny mono captions for stats.
- Keep glass count per viewport ≤ ~12 on mobile; use `surface-solid` for the rest (perf).
- Use rim light for *state* (selected/unlocked/correct) rather than decoration.

**Don't**
- Don't copy the reference colours or logos; don't use orange/lime as brand colour.
- Don't put blur on scrolling lists of 30+ items (use solid fills).
- Don't animate aurora in focus/quiz modes or when reduced-motion is on.
- Don't use pure black shadows, hard gradients on text bodies, or gradient text below 56px (except the single hero keyword).
- Don't rely on colour alone — keep icons/labels for semantic states.
- Don't add ads, leaderboards, or confetti.
