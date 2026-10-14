"use client";

import React from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

interface DsaMode {
  id: string;
  tabLabel: string;
  heroWord: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  chips: string[];
  footer: string;
  accentHex: string;
  gradientClass: string;
  glowColor: string;
  imageSrc: string;
  badge: string;
  quote: string;
}

const MODES: DsaMode[] = [
  {
    id: "blitz",
    tabLabel: "— Speed Runner®",
    heroWord: "45s Blitz.",
    title: "Pattern Blitz",
    desc: "Rapid-fire pattern recognition and invariant recall across Sliding Window, Two Pointers, Monotonic Stack, and DP.",
    href: "/dsa/blitz",
    cta: "Launch Blitz",
    chips: ["45S CARDS", "61 CANONICAL", "SM-2 ACTIVE"],
    footer: "SRS ACTIVE · 5 DUE TODAY",
    accentHex: "#2BB7FF",
    gradientClass: "from-[#2BB7FF] to-[#8B7CFF]",
    glowColor: "rgba(43, 183, 255, 0.35)",
    imageSrc: "/images/dsa-blitz.jpg",
    badge: "⚡ 45s Timed Blitz",
    quote: "Master the invariants. Recognize the pattern in 45s.",
  },
  {
    id: "bug-audit",
    tabLabel: "— Sandbox Execution®",
    heroWord: "0 Bugs.",
    title: "Bug Audit Mode",
    desc: "Audit real 12–20 line snippets. Tap the exact buggy line, choose the breaking input test case, and verify in isolated worker sandbox.",
    href: "/dsa/bug-audit",
    cta: "Launch Audit",
    chips: ["CODE AUDIT", "LINE SPOTTING", "NODE SANDBOX"],
    footer: "ISOLATED SANDBOX WATCHDOG",
    accentHex: "#FF7647",
    gradientClass: "from-[#FF7647] to-[#FFB547]",
    glowColor: "rgba(255, 118, 71, 0.35)",
    imageSrc: "/images/dsa-audit.jpg",
    badge: "🔍 Precision Code Audit",
    quote: "Zero flaws. Spot the breaking line in worker sandbox.",
  },
  {
    id: "open-ended",
    tabLabel: "— Decision Tree®",
    heroWord: "Scale 10x.",
    title: "Open-Ended Drills",
    desc: "Realistic system design interviews: Estimate scale constraints, map primitives, and defend against dynamic pushback.",
    href: "/dsa/open-ended",
    cta: "Start Drill",
    chips: ["SYSTEM DESIGN", "3-PHASE TREE", "RUBRIC ENGINE"],
    footer: "RUBRIC GRADING ENGINE",
    accentHex: "#A855F7",
    gradientClass: "from-[#A855F7] to-[#EC4899]",
    glowColor: "rgba(168, 85, 247, 0.35)",
    imageSrc: "/images/dsa-arch.jpg",
    badge: "🏗️ System Architecture",
    quote: "Architect distributed scale. Defend every trade-off.",
  },
];

export default function DsaHubPage() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto py-2">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar with Prominent Streak Badge (No Congested Sidebar)    */}
      {/* -------------------------------------------------------------------- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-bright)] shadow-[0_0_10px_var(--accent-bright)] animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-[var(--accent-bright)] uppercase font-semibold">
              Module I · Algorithmic &amp; Architectural Rounds
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text)] tracking-tight">
            DSA &amp; Modern Technical Rounds
          </h1>

          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
            Drill the core formats of modern technical interviews: lightning
            pattern identification, precision code debugging, and open-ended
            architecture trade-offs.
          </p>
        </div>

        {/* Current Streak Indicator (Prominent & Clean) */}
        <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md shadow-[0_0_24px_rgba(245,158,11,0.2)] shrink-0 self-start md:self-auto select-none">
          <span className="text-2xl animate-pulse">🔥</span>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Current Streak
            </div>
            <div className="text-sm font-display font-black text-white">
              4 Days Active
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Three Bespoke 3D Glassy Sculpted Cards (Image 3 Reference Design) */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-2">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className="relative flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1.5"
            style={{ minHeight: "560px" }}
          >
            {/* Sculpted Silhouette SVG Background with Asymmetric Tabs */}
            <svg
              viewBox="0 0 360 560"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_20px_48px_rgba(0,0,0,0.7)] transition-all duration-300"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={`border-grad-${mode.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={mode.accentHex} stopOpacity="0.5" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor={mode.accentHex} stopOpacity="0.25" />
                </linearGradient>
              </defs>

              <path
                d="M 0,56 A 28,28 0 0,1 28,28 L 160,28 C 180,28 190,0 210,0 L 332,0 A 28,28 0 0,1 360,28 L 360,504 A 28,28 0 0,1 332,532 L 150,532 C 130,532 120,560 100,560 L 28,560 A 28,28 0 0,1 0,532 Z"
                fill="#0d0f14"
                stroke={`url(#border-grad-${mode.id})`}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                className="group-hover:stroke-white/40 transition-colors duration-300"
              />
            </svg>

            {/* Top-Right Raised Sculpted Tab Label (e.g., "— Speed Runner®") */}
            <div className="absolute top-2 right-6 z-10 font-mono text-[11px] font-bold tracking-wider text-white/70 uppercase select-none">
              {mode.tabLabel}
            </div>

            {/* Bottom-Left Extended Tab Indicator Dots (e.g. ● ○ ○) */}
            <div className="absolute bottom-3 left-6 z-10 flex items-center gap-1.5 select-none">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: mode.accentHex,
                  boxShadow: `0 0 10px ${mode.accentHex}`,
                }}
              />
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
            </div>

            {/* Card Content Container */}
            <div className="relative z-10 flex flex-col justify-between h-full pt-10 pb-12 px-5 sm:px-6 space-y-5">
              {/* Top Media: 3D Glassy Sculptural Artwork Tile */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border border-white/10 shadow-2xl group/media bg-black">
                {/* 3D Glass Artwork Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mode.imageSrc}
                  alt={mode.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Ambient Scrim & Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                {/* Top-Left 3D Glassy Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2 text-xs font-mono font-bold text-white shadow-lg">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      backgroundColor: mode.accentHex,
                      boxShadow: `0 0 8px ${mode.accentHex}`,
                    }}
                  />
                  <span>{mode.badge}</span>
                </div>

                {/* Bold Statement Overlay Quote at Bottom of Media Tile (Matching Image 3) */}
                <p className="absolute bottom-3 left-3.5 right-3.5 text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-md">
                  {mode.quote}
                </p>
              </div>

              {/* Middle Section: Hero Typography + Title & Description */}
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Hero Word in font-display (Matching Image 3: "Let's Talk.", "+190%", "One Call.") */}
                  <div
                    className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight"
                    style={{
                      textShadow: `0 0 24px ${mode.glowColor}`,
                    }}
                  >
                    {mode.heroWord}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-lg font-bold text-white mt-1 group-hover:text-[var(--accent-bright)] transition-colors">
                    {mode.title}
                  </h3>

                  <p className="font-ui text-xs text-[var(--text-2)] mt-1 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                {/* Feature Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  {mode.chips.map((chip) => (
                    <Chip
                      key={chip}
                      v={chip}
                      tone="default"
                      className="text-[10px] font-mono py-0.5"
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Actions: Footer State + Primary CTA Button */}
              <div className="pt-2 space-y-2.5 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-3)] font-semibold tracking-wider">
                  <span>{mode.footer}</span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  href={mode.href}
                  className="w-full shadow-lg hover:brightness-110 transition-all font-mono font-bold text-xs"
                >
                  {mode.cta} &rarr;
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Bottom Ghost Navigation Links                                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--border)] text-xs font-mono text-[var(--text-3)]">
        <Link
          href="/home"
          className="hover:text-[var(--text)] transition-colors flex items-center gap-1"
        >
          <span>&larr;</span>
          <span>Back to Home Dashboard</span>
        </Link>
        <Link
          href="/progress"
          className="hover:text-[var(--accent-bright)] transition-colors flex items-center gap-1"
        >
          <span>View Spaced Repetition Progress</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
