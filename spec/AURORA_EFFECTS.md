# AURORA_EFFECTS.md — Implementation recipes

> Companion to `DESIGN.md`. Copy these into `app/globals.css` (or a `styles/tokens.css` + `styles/effects.css`).
> Framework-agnostic CSS. If Tailwind is used, map tokens in `tailwind.config` to these CSS variables — do NOT hard-code hex values in components.

## 1. Tokens (`tokens.css`)

```css
:root {
  /* fonts (set by next/font) */
  --font-display: var(--font-bricolage), ui-sans-serif, system-ui, sans-serif;
  --font-ui:      var(--font-geist), Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono:    var(--font-geist-mono), "JetBrains Mono", ui-monospace, monospace;

  /* aurora hues */
  --aurora-violet: #6C4DFF;
  --aurora-azure:  #2BB7FF;
  --aurora-mint:   #2EE6C5;
  --aurora-rose:   #FF5FA2;

  /* accent */
  --accent:        #5E4EF0;
  --accent-hover:  #7061FF;
  --accent-bright: #9C8FFF;
  --on-accent:     #FFFFFF;
  --accent-grad:   linear-gradient(135deg, #5E4EF0 0%, #3D5AF1 100%);
  --aurora-text-grad: linear-gradient(90deg, var(--aurora-violet), var(--aurora-azure), var(--aurora-mint));
  --progress-grad: linear-gradient(90deg, var(--accent), var(--aurora-azure), var(--aurora-mint));

  /* semantic */
  --state-running:#FFB547; --state-waiting:#5B8CFF; --state-done:#34D399; --state-repeat:#A78BFA;

  /* radii / spacing */
  --r-xs:6px; --r-sm:10px; --r-md:16px; --r-lg:24px; --r-bezel:28px; --r-pill:9999px;
  --ease: cubic-bezier(.2,.8,.2,1);
}

/* ---------- DARK (default) ---------- */
:root, :root[data-theme="dark"] {
  color-scheme: dark;
  --bg-base:#07080F; --bg-raised:#0D0F1A; --surface-solid:#12141F;
  --glass:rgba(255,255,255,.05); --glass-strong:rgba(255,255,255,.08); --glass-subtle:rgba(255,255,255,.03);
  --border:rgba(255,255,255,.09); --border-strong:rgba(255,255,255,.18);
  --rim:rgba(255,255,255,.14);
  --text:#F4F5FB; --text-2:#B4B8CC; --text-3:#8A90AA;
  --good-bg:rgba(52,211,153,.14); --good-fg:#6EE7B7;
  --bad-bg:rgba(255,107,107,.14); --bad-fg:#FF8A8A;
  --aurora-opacity: .22;           /* app pages */
  --aurora-blend: screen;
  --blob-1: var(--aurora-violet); --blob-2: var(--aurora-azure); --blob-3: var(--aurora-mint);
  --code-bg:#0B0D17;
  --glow-accent: 0 12px 40px -12px rgba(94,78,240,.7);
}

/* ---------- LIGHT "Pearl" ---------- */
:root[data-theme="light"] {
  color-scheme: light;
  --bg-base:#F4F3FA; --bg-raised:#FFFFFF; --surface-solid:#FFFFFF;
  --glass:rgba(255,255,255,.68); --glass-strong:rgba(255,255,255,.85); --glass-subtle:rgba(255,255,255,.45);
  --border:rgba(20,21,42,.08); --border-strong:rgba(20,21,42,.16);
  --rim:rgba(255,255,255,.9);
  --text:#14152A; --text-2:#4A4E69; --text-3:#666B86;
  --accent-bright:#5E4EF0;         /* on light, accent text = accent */
  --good-bg:#DDF5EA; --good-fg:#0F7A52;
  --bad-bg:#FDE4E4;  --bad-fg:#B3382A;
  --aurora-opacity:.38;
  --aurora-blend: multiply;
  --code-bg:#0B0D17;               /* code stays dark */
  --glow-accent: 0 12px 32px -14px rgba(94,78,240,.45);
}
```

## 2. Aurora background (`<AuroraBackground intensity="app|hero|focus" />`)

```html
<div class="aurora" data-intensity="app" aria-hidden="true">
  <i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i>
  <i class="blob b4"></i> <!-- landing/hero only -->
</div>
```
```css
.aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:var(--bg-base)}
.aurora .blob{position:absolute;border-radius:50%;filter:blur(110px);opacity:var(--aurora-opacity);
  mix-blend-mode:var(--aurora-blend);will-change:transform;}
.aurora .b1{width:58vmax;height:58vmax;left:-12vmax;top:-18vmax;background:radial-gradient(circle at 40% 40%,var(--blob-1),transparent 65%);animation:drift1 60s var(--ease) infinite alternate}
.aurora .b2{width:48vmax;height:48vmax;right:-14vmax;top:-10vmax;background:radial-gradient(circle,var(--blob-2),transparent 65%);animation:drift2 52s var(--ease) infinite alternate}
.aurora .b3{width:50vmax;height:50vmax;left:18vw;bottom:-26vmax;background:radial-gradient(circle,var(--blob-3),transparent 68%);opacity:calc(var(--aurora-opacity)*.8);animation:drift3 70s var(--ease) infinite alternate}
.aurora .b4{display:none;width:30vmax;height:30vmax;right:8vw;bottom:6vh;background:radial-gradient(circle,var(--aurora-rose),transparent 70%);opacity:calc(var(--aurora-opacity)*.45)}
.aurora[data-intensity="hero"]{--aurora-opacity:.6}
.aurora[data-intensity="hero"] .b4{display:block}
.aurora[data-intensity="focus"]{--aurora-opacity:.12}
.aurora[data-intensity="focus"] .blob{animation:none}
/* grain + masked grid (keeps the old dot-grid DNA, faint) */
.aurora::after{content:"";position:absolute;inset:0;opacity:.035;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
.aurora::before{content:"";position:absolute;inset:0;
  background-image:radial-gradient(var(--border) 1px,transparent 1px);background-size:22px 22px;
  -webkit-mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 70%);mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 70%);opacity:.7}
@keyframes drift1{to{transform:translate3d(8vmax,6vmax,0) scale(1.08)}}
@keyframes drift2{to{transform:translate3d(-7vmax,8vmax,0) scale(1.12)}}
@keyframes drift3{to{transform:translate3d(6vmax,-6vmax,0) scale(1.06)}}
@media (prefers-reduced-motion:reduce){.aurora .blob{animation:none}}
@media (max-width:639px){.aurora .blob{filter:blur(80px)}.aurora .b3{display:none}} /* perf on phones */
```
Rule: only `transform` is animated. Never animate `filter`/`blur`.

## 3. Glass surfaces

```css
.glass{
  background:var(--glass);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  box-shadow:inset 0 1px 0 var(--rim);
  -webkit-backdrop-filter:blur(16px) saturate(140%);
  backdrop-filter:blur(16px) saturate(140%);
}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .glass{background:var(--surface-solid)}
}
.glass--strong{background:var(--glass-strong);border-color:var(--border-strong);-webkit-backdrop-filter:blur(24px) saturate(150%);backdrop-filter:blur(24px) saturate(150%)}
.glass--subtle{background:var(--glass-subtle)}
.glass--solid{background:var(--surface-solid);-webkit-backdrop-filter:none;backdrop-filter:none} /* long lists, code */
@media (hover:hover){
  .glass--interactive{transition:transform .2s var(--ease),border-color .2s,box-shadow .2s}
  .glass--interactive:hover{transform:translateY(-2px);border-color:var(--border-strong);
    box-shadow:inset 0 1px 0 var(--rim),0 24px 60px -24px rgba(94,78,240,.4)}
}
```

## 4. Bento tile with bezel

```css
.bento{display:grid;gap:12px;grid-template-columns:repeat(1,1fr)}
@media (min-width:1024px){.bento{gap:16px;grid-template-columns:repeat(12,1fr)}}
.bezel{padding:6px;border-radius:var(--r-bezel);background:var(--glass-subtle);border:1px solid var(--border)}
.bezel>.glass{border-radius:calc(var(--r-bezel) - 6px)}
@media (max-width:639px){.bezel{padding:0;border:0;background:none}}
.tile__visual{min-height:120px;border-radius:var(--r-md);position:relative;overflow:hidden}
.tile__title{font:600 17px/1.3 var(--font-ui);color:var(--text)}
.tile__desc{font:400 13px/1.5 var(--font-ui);color:var(--text-2)}
```

## 5. Aurora hero card & CTA card

```css
.aurora-card{position:relative;overflow:hidden;border-radius:var(--r-lg);isolation:isolate;
  background:
    radial-gradient(60% 80% at 15% 10%,rgba(108,77,255,.85),transparent 60%),
    radial-gradient(55% 70% at 90% 20%,rgba(43,183,255,.7),transparent 62%),
    radial-gradient(60% 70% at 55% 110%,rgba(46,230,197,.6),transparent 60%),
    radial-gradient(30% 40% at 80% 90%,rgba(255,95,162,.35),transparent 65%),
    #0D0F1A;
  border:1px solid var(--border-strong);box-shadow:inset 0 1px 0 var(--rim),0 30px 80px -30px rgba(94,78,240,.55)}
.aurora-card::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(7,8,15,.0),rgba(7,8,15,.55))} /* text scrim */
.aurora-card::after{content:"";position:absolute;inset:0;z-index:-1;opacity:.05;mix-blend-mode:overlay;/* grain */
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
/* on light theme the card stays dark-aurora: it is the "hero moment" */
.arrow-btn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#fff;
  background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
```

## 6. Buttons

```css
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 22px;
  border-radius:var(--r-pill);font:600 14px/1 var(--font-ui);cursor:pointer;border:1px solid transparent;
  transition:transform .15s var(--ease),box-shadow .2s,background .2s,filter .2s}
.btn:active{transform:scale(.98)}
.btn:focus-visible{outline:2px solid var(--accent-bright);outline-offset:3px}
.btn--primary{color:var(--on-accent);background:var(--accent-grad);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent)}
.btn--primary:hover{filter:brightness(1.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 14px 44px -10px rgba(94,78,240,.85)}
.btn--secondary{color:var(--text);background:var(--glass);border-color:var(--border-strong)}
.btn--ghost{color:var(--text-2);background:transparent}
.btn--ghost:hover{background:var(--glass)}
.btn--cta{min-height:52px;padding:0 28px;font-size:15px}
.btn[disabled]{opacity:.45;pointer-events:none}
```

## 7. Glow rim (state), GlowTile, chips

```css
.rim{--tint:var(--accent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tint) 35%,transparent),
  inset 0 -1px 0 var(--tint),0 8px 32px -10px color-mix(in srgb,var(--tint) 45%,transparent)}
.rim--good{--tint:var(--state-done)} .rim--bad{--tint:#FF6B6B}
.glow-tile{display:grid;place-items:center;aspect-ratio:1;border-radius:var(--r-bezel);background:var(--surface-solid);
  font:800 clamp(40px,6vw,64px)/1 var(--font-display);color:var(--text);position:relative}
.glow-tile[data-locked="true"]{opacity:.4;box-shadow:none}
.chip{display:inline-flex;gap:6px;align-items:center;height:26px;padding:0 10px;border-radius:var(--r-sm);
  background:var(--glass-subtle);border:1px solid var(--border);font:500 11px/1 var(--font-mono);letter-spacing:.04em;text-transform:uppercase;color:var(--text)}
.chip .k{color:var(--text-3)}
.gradient-keyword{background:var(--aurora-text-grad);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 22px rgba(43,183,255,.3))}
.numeral{font:800 var(--n,56px)/.95 var(--font-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.numeral--aurora{background:var(--aurora-text-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
```

## 8. Progress, ring, heat

```css
.bar{height:8px;border-radius:99px;background:var(--glass);overflow:hidden;border:1px solid var(--border)}
.bar>i{display:block;height:100%;border-radius:inherit;background:var(--progress-grad);box-shadow:0 0 16px rgba(43,183,255,.5);transition:width .5s var(--ease)}
.heat{display:grid;gap:6px}
.heat .c{aspect-ratio:1;border-radius:10px;background:var(--glass);border:1px solid var(--border)}
.heat .c[data-l="1"]{background:rgba(108,77,255,.25)} .heat .c[data-l="2"]{background:rgba(108,77,255,.5)}
.heat .c[data-l="3"]{background:var(--accent)}
.heat .c[data-l="4"]{background:var(--accent);box-shadow:0 0 18px rgba(94,78,240,.8),inset 0 0 0 1px var(--aurora-mint)}
```
SVG ring: `<linearGradient>` stroke (violet→azure→mint), `stroke-linecap:round`, `filter: drop-shadow(0 0 8px rgba(43,183,255,.5))`.

## 9. Floating dock (mobile) & sidebar active

```css
.dock{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom));
  width:min(92vw,420px);height:64px;padding:8px;display:flex;justify-content:space-around;align-items:center;
  border-radius:var(--r-pill);z-index:50}  /* + .glass.glass--strong */
.dock a{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;color:var(--text-2)}
.dock a[aria-current="page"]{background:var(--accent-grad);color:#fff;box-shadow:var(--glow-accent)}
.nav-item[aria-current="page"]{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent-bright);
  border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:var(--r-pill);position:relative}
.nav-item[aria-current="page"]::before{content:"";position:absolute;left:-1px;top:20%;bottom:20%;width:3px;border-radius:3px;background:var(--accent-bright);box-shadow:0 0 12px var(--accent)}
```
Content bottom padding on mobile: `calc(96px + env(safe-area-inset-bottom))` so the dock never covers content. The sticky "BottomCTA" sits **above** the dock (bottom: 88px) on screens that have both; on focus screens (quiz, visualizer) the dock is hidden and the CTA takes the bottom slot.

## 10. Performance & fallback rules
1. Max ~12 `backdrop-filter` elements in the viewport on mobile; lists > 20 rows use `.glass--solid`.
2. Aurora uses ≤ 3 blobs on mobile, blur ≤ 80px, transform-only animation, `will-change: transform` only on blobs.
3. Pause aurora when tab hidden (`document.visibilitychange` → add `data-paused` → `animation-play-state: paused`).
4. `prefers-reduced-motion`, `prefers-reduced-transparency`, `Save-Data` → static aurora and `.glass` falls back to `surface-solid`.
5. Aurora lives once in the root layout, never per page.
6. Grain SVG is inline data-URI (no network).
