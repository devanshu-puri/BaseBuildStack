import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { StatBlock } from "@/components/ui/stat-block";
import { ProgressRing } from "@/components/ui/progress-ring";
import { GlowTile } from "@/components/ui/milestone-card";
import { Button } from "@/components/ui/button";

export default function ProgressPage() {
  const milestones = [
    { numeral: "01", title: "First Steps", desc: "Complete your first drill session", unlocked: true, xp: "+50 XP" },
    { numeral: "02", title: "Pattern Spotter", desc: "Correctly identify 10 Blitz patterns", unlocked: true, xp: "+100 XP" },
    { numeral: "03", title: "Bug Hunter", desc: "Spot the buggy line in 5 snippets", unlocked: false, xp: "+150 XP" },
    { numeral: "04", title: "Streak Master", desc: "Maintain a 7-day practice streak", unlocked: false, xp: "+200 XP" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Metric Hero Card with StatBlock XP, Streak, and Completion Ring */}
      <GlassCard tone="default" padding="lg" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold block">
              Overall Performance
            </span>
            <h2 className="font-display text-[26px] sm:text-[32px] font-extrabold text-[var(--text)] tracking-tight">
              Candidate Progress &amp; Mastery
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing value={76} size={68} strokeWidth={6} label="OVERALL" />
          </div>
        </div>

        {/* Large XP Metric */}
        <div className="pt-2">
          <StatBlock
            label="ACCUMULATED KNOWLEDGE XP"
            value="1,850"
            delta="+150 today"
            gradient
            size="xl"
          />
        </div>

        {/* Sub-stats separated by hairlines */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[var(--border)]">
          <div className="p-3.5 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--text-3)] font-semibold block">
              CURRENT STREAK
            </span>
            <div className="font-display text-[22px] font-bold text-[var(--text)] mt-1">
              4 Days 🔥
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--text-3)] font-semibold block">
              ACCURACY
            </span>
            <div className="font-display text-[22px] font-bold text-[var(--text)] mt-1">
              86%
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--text-3)] font-semibold block">
              DRILLS DONE
            </span>
            <div className="font-display text-[22px] font-bold text-[var(--text)] mt-1">
              14
            </div>
          </div>

          <Link
            href="/m3/retest"
            className="p-3.5 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)] hover:border-[var(--accent-bright)] transition-all block group"
          >
            <span className="text-[11px] font-mono text-[var(--accent-bright)] font-semibold flex items-center justify-between">
              <span>DUE SM-2</span>
              <span>&rarr;</span>
            </span>
            <div className="font-display text-[22px] font-bold text-[var(--text)] mt-1 group-hover:text-[var(--accent-bright)] transition-colors">
              3 Cards
            </div>
          </Link>
        </div>
      </GlassCard>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module II Diagnostic Banner */}
        <GlassCard tone="default" padding="lg" className="space-y-4 rim shadow-[0_0_24px_-8px_rgba(94,78,240,0.35)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-bright)] font-semibold">
                Module II Diagnostics
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--text)]">
              Skill Heatmap &amp; Calibration
            </h3>
            <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
              View your accuracy matrix across verified skills, spot misconceptions, and track confidence calibration.
            </p>
          </div>
          <Button variant="secondary" size="sm" href="/quiz/heatmap" className="w-full">
            View Heatmap Matrix &rarr;
          </Button>
        </GlassCard>

        {/* Module IV Metacognitive Banner */}
        <GlassCard tone="default" padding="lg" className="space-y-4 border-l-[3px] border-l-[var(--state-done)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--state-done)] font-semibold">
                Module IV Diagnostics
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--text)]">
              Metacognitive Self-Awareness
            </h3>
            <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
              Analyze your 4-quadrant cognitive confidence matrix, detect overconfidence blind spots, and review insights.
            </p>
          </div>
          <Button variant="secondary" size="sm" href="/m4/insights" className="w-full">
            View Metacognition &rarr;
          </Button>
        </GlassCard>
      </div>

      {/* Milestones Grid of GlowTiles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-[var(--text)]">
            Milestones &amp; Badges
          </h3>
          <span className="font-mono text-xs text-[var(--text-3)]">
            2 / 4 UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {milestones.map((m) => (
            <GlowTile
              key={m.title}
              numeral={m.numeral}
              label={m.title}
              unlocked={m.unlocked}
              tint="good"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
