"use client";

import React from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import ReflectiveCard from "@/components/ui/reflective-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, FingerPrintIcon } from "@hugeicons/core-free-icons";

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
  idLabel: string;
  idValue: string;
  status: string;
  statusColor: string;
  tint: string;
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
    idLabel: "Canonical Deck",
    idValue: "BLTZ-0061-SRS",
    status: "SRS Active",
    statusColor: "#2BB7FF",
    tint: "#7bd4ff",
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
    idLabel: "Runtime sandbox",
    idValue: "VM-ISOLATED-01",
    status: "Watchdog ON",
    statusColor: "#FF7647",
    tint: "#ffaa80",
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
    idLabel: "Evaluation",
    idValue: "RUBRIC-TREE-AI",
    status: "3-Phase Ready",
    statusColor: "#A855F7",
    tint: "#d49aff",
  },
];

export default function DsaHubPage() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto py-2">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar with Prominent Streak Badge                            */}
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
      {/* 2. Three ReflectiveCard Components from React Bits                   */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-2">
        {MODES.map((mode) => (
          <div key={mode.id} className="flex justify-center">
            <ReflectiveCard
              width="100%"
              height={670}
              radius={24}
              tint={mode.tint}
              glowColor={mode.glowColor}
              metalness={0.72}
              roughness={0.34}
              blurStrength={8}
              shine={0.8}
              glare={0.42}
              bevel={3}
              tiltStrength={10}
              theme="dark"
              statusColor={mode.statusColor}
              className="w-full transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full space-y-4">
                {/* Header: Badge & Status */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-white shadow-sm">
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      size={14}
                      strokeWidth={2}
                      style={{ color: mode.accentHex }}
                    />
                    <span>{mode.badge}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-white/70">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: mode.statusColor,
                        boxShadow: `0 0 10px ${mode.statusColor}`,
                      }}
                    />
                    <span>{mode.status}</span>
                  </span>
                </div>

                {/* 3D Glass Artwork Tile with Ambient Gradient & Quote */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border border-white/15 shadow-2xl bg-black/80 group/media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mode.imageSrc}
                    alt={mode.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Vignette / Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                  {/* Mode Label Tag on top right */}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white/80">
                    {mode.tabLabel}
                  </span>

                  {/* Bold Statement Overlay Quote */}
                  <p className="absolute bottom-2.5 left-3 right-3 text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-md">
                    {mode.quote}
                  </p>
                </div>

                {/* Middle Section: Hero Word + Title + Description + Chips */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight"
                      style={{
                        textShadow: `0 0 20px ${mode.glowColor}`,
                      }}
                    >
                      {mode.heroWord}
                    </div>

                    <h3 className="font-display text-lg font-bold text-white mt-0.5 group-hover:text-[var(--accent-bright)] transition-colors">
                      {mode.title}
                    </h3>

                    <p className="font-ui text-xs text-white/70 mt-1 leading-relaxed">
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
                        className="text-[10px] font-mono py-0.5 bg-white/10 border-white/15 text-white/90"
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Actions: Footer State + Fingerprint + Launch CTA */}
                <div className="pt-3 border-t border-white/15 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 font-semibold">
                        {mode.idLabel}
                      </span>
                      <span className="font-mono text-xs font-bold text-white/90 tracking-wide">
                        {mode.idValue}
                      </span>
                    </div>

                    <span className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-b from-white/15 to-white/5 border border-white/20 shadow-md text-white/70">
                      <HugeiconsIcon icon={FingerPrintIcon} size={18} strokeWidth={1.8} />
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    href={mode.href}
                    className="w-full shadow-lg hover:brightness-110 transition-all font-mono font-bold text-xs"
                    style={{
                      boxShadow: `0 0 20px ${mode.glowColor}`,
                    }}
                  >
                    {mode.cta} &rarr;
                  </Button>
                </div>
              </div>
            </ReflectiveCard>
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
