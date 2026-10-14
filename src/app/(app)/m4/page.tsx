"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export default function Module4DiscoveryPage() {
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    async function loadStreak() {
      try {
        const res = await fetch("/api/m4/sprint");
        const json = await res.json();
        if (json.ok && json.data) {
          setStreakDays(json.data.currentStreak || 0);
        }
      } catch (err) {
        console.warn("Failed to load streak:", err);
      }
    }
    loadStreak();
  }, []);

  const categories = [
    {
      title: "Logical Reasoning",
      desc: "Interactive deduction grids and constraint verification with deterministic solvers.",
      time: "60s per item",
      badge: "Constraint Solver",
      href: "/m4/logic-grid",
      cta: "Solve Logic Grids →",
    },
    {
      title: "Patterns & Sequences",
      desc: "Mathematical recurrence relations, geometric series, and alternating progressions.",
      time: "45s per item",
      badge: "Pattern Blitz",
      href: "/m4/sprint",
      cta: "Practice in Mind Sprint →",
    },
    {
      title: "Memory Challenges",
      desc: "Show → Hide → Recall with mental arithmetic distractor tasks testing phonological buffers.",
      time: "45s per item",
      badge: "Working Memory",
      href: "/m4/sprint",
      cta: "Practice in Mind Sprint →",
    },
    {
      title: "Numerical & Analytical",
      desc: "Fermi order-of-magnitude estimations on logarithmic continuous sliders.",
      time: "60s per item",
      badge: "Fermi Sliders",
      href: "/m4/sprint",
      cta: "Practice in Mind Sprint →",
    },
    {
      title: "Lateral Thinking",
      desc: "Counter-intuitive dilemmas, timing paradoxes, and concurrency anomalies.",
      time: "90s per item",
      badge: "Trap Detection",
      href: "/m4/sprint",
      cta: "Practice in Mind Sprint →",
    },
    {
      title: "Attention to Detail",
      desc: "Rapid spotting of subtle discrepancies, boundary off-by-one errors, and syntax quirks.",
      time: "45s per item",
      badge: "Error Spotting",
      href: "/m4/sprint",
      cta: "Practice in Mind Sprint →",
    },
  ];

  return (
    <div className="py-2 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Chip k="MODULE" v="IV" tone="done" />
            <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
              Cognitive &amp; Logic Gym
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
            Logic &amp; Cognitive Practice
          </h1>
          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
            Train reasoning, working memory, and metacognitive calibration under real-time constraints.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          href="/progress"
          className="self-start sm:self-auto shrink-0"
        >
          View Streaks &rarr;
        </Button>
      </div>

      {/* Hero Mind Sprint Card */}
      <GlassCard
        tone="default"
        padding="lg"
        className="space-y-6 rim shadow-[0_0_28px_-8px_rgba(94,78,240,0.4)] border-[var(--accent)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-bright)] font-semibold">
                Daily Cognitive Workout
              </span>
              <span className="text-xs text-[var(--text-3)]">•</span>
              <span className="text-xs text-[var(--text-3)] font-mono">5 Minutes Total</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)]">
              Daily Mind Sprint
            </h2>
            <p className="font-ui text-sm text-[var(--text-2)] max-w-xl leading-relaxed">
              5 distinct challenges: Pattern (45s) → Logical Deduction (60s) → Memory (45s) → Fermi Numerical (60s) → Tricky Dilemma (90s). Complete daily to build your streak.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Chip k="STREAK" v={`${streakDays} Days 🔥`} tone="good" className="text-sm px-3.5 py-1.5 font-bold" />
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-3)]">
            <span className="w-2 h-2 rounded-full bg-[var(--state-done)] shadow-[0_0_6px_var(--state-done)]" />
            <span>Offline-Tolerant • Autosyncs when reconnected</span>
          </div>

          <Button
            variant="primary"
            size="md"
            href="/m4/sprint"
            className="w-full sm:w-auto"
          >
            Launch Today&apos;s Mind Sprint &rarr;
          </Button>
        </div>
      </GlassCard>

      {/* Six Cognitive Categories Grid */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[var(--text)]">
            Cognitive Training Faculties
          </h3>
          <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
            Exercises targeted at technical interview cognitive demands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <GlassCard
              key={cat.title}
              tone="default"
              padding="md"
              className="space-y-3 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Chip v={cat.badge} tone="accent" className="text-[10px]" />
                  <span className="text-[11px] font-mono text-[var(--text-3)]">
                    {cat.time}
                  </span>
                </div>
                <h4 className="font-display text-base font-bold text-[var(--text)]">
                  {cat.title}
                </h4>
                <p className="font-ui text-xs text-[var(--text-2)] leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <Link
                href={cat.href}
                className="text-xs font-mono font-bold text-[var(--accent-bright)] hover:underline pt-2 block"
              >
                {cat.cta}
              </Link>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Metacognition Banner */}
      <GlassCard tone="subtle" padding="md" className="space-y-3 border-l-[3px] border-l-[var(--state-done)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--state-done)] font-semibold">
              Metacognitive Calibration
            </span>
            <h4 className="font-display text-base font-bold text-[var(--text)] mt-0.5">
              Know What You Know
            </h4>
          </div>
          <Button
            variant="secondary"
            size="sm"
            href="/m4/insights"
            className="self-start sm:self-auto"
          >
            Open Insights Dashboard &rarr;
          </Button>
        </div>
        <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
          Before revealing each sprint answer, you designate whether you are <em>Guessing</em>, <em>Unsure</em>, or <em>100% Certain</em>. Over 10+ samples, BaseBuildStack computes your calibration curve to surface high-risk overconfidence patterns.
        </p>
      </GlassCard>
    </div>
  );
}
