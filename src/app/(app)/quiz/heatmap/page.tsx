"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/ui/stat-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Heatmap, HeatmapCell } from "@/components/ui/heatmap";
import { SkillHeatmapResponse, SkillHeatmapItem } from "@/lib/m2/skill-heatmap";

export default function SkillHeatmapPage() {
  const [data, setData] = useState<SkillHeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHeatmap() {
      try {
        setLoading(true);
        const res = await fetch("/api/quiz/heatmap");
        if (!res.ok) {
          throw new Error("Failed to load skill heatmap");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading heatmap");
      } finally {
        setLoading(false);
      }
    }
    loadHeatmap();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[var(--muted)]">
            Analyzing your skill performance &amp; calibration...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <GlassCard tone="strong" bezel className="max-w-md w-full text-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-full bg-[var(--state-bad-bg)] text-[var(--state-bad-fg)] font-bold text-xl flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-lg font-bold text-[var(--fg)]">Heatmap Unavailable</h2>
          <p className="text-sm text-[var(--muted)]">
            {error || "Could not retrieve your skill analytics."}
          </p>
          <div className="pt-2">
            <Button href="/quiz" variant="primary" size="md">
              ← Back to Quizzes
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { skills, quadrants, summary } = data;

  // Tone resolver for mastery tiers
  const getMasteryTone = (tier: string) => {
    switch (tier) {
      case "mastered":
        return "good" as const;
      case "proficient":
        return "accent" as const;
      case "learning":
        return "tint2" as const;
      default:
        return "default" as const;
    }
  };

  // Convert skills into heatmap visual cells
  const heatmapCells: HeatmapCell[] = skills.map((s) => {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (s.totalAttempts === 0) level = 0;
    else if (s.accuracy < 40) level = 1;
    else if (s.accuracy < 70) level = 2;
    else if (s.accuracy < 90) level = 3;
    else level = 4;

    return {
      id: s.skill,
      label: s.skill,
      level,
      tooltip: `${s.skill}: ${s.totalAttempts > 0 ? `${s.accuracy}% accuracy (${s.masteryTier})` : "No attempts"}`,
    };
  });

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
              Module II • Skill Diagnostics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] tracking-tight">
            Skill Heatmap &amp; Calibration
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] mt-1">
            Deterministic mastery matrix and confidence-vs-accuracy analysis across your verified stack.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button href="/quiz/onboarding" variant="secondary" size="sm">
            ⚙ Edit Skills
          </Button>
          <Button href="/quiz" variant="primary" size="sm">
            Start Quiz →
          </Button>
        </div>
      </div>

      {/* Hero Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard tone="default" bezel className="p-5 space-y-1">
          <StatBlock
            value={summary.totalAttempts}
            caption="TOTAL ATTEMPTS"
            size="md"
          />
          <span className="text-[11px] text-[var(--muted)] block">
            Across {skills.length} verified topics
          </span>
        </GlassCard>

        <GlassCard tone="default" bezel className="p-5 space-y-1">
          <StatBlock
            value={`${summary.overallAccuracy}%`}
            caption="OVERALL ACCURACY"
            size="md"
            aurora
          />
          <span className="text-[11px] text-[var(--muted)] block">
            {summary.totalCorrect} correct answers
          </span>
        </GlassCard>

        <GlassCard tone="default" bezel className="p-5 space-y-1">
          <StatBlock
            value={`${summary.calibrationScore}%`}
            caption="CALIBRATION SCORE"
            size="md"
          />
          <span className="text-[11px] text-[var(--muted)] block">
            Decisions matching reality
          </span>
        </GlassCard>

        <GlassCard tone="default" bezel className="p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
            Priority Action
          </span>
          <div className="text-base font-bold text-[var(--fg)] truncate">
            {summary.weakSkills.length > 0
              ? `Review ${summary.weakSkills[0]}`
              : "Keep practicing"}
          </div>
          <Link
            href="/quiz/weak_area"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline block font-mono"
          >
            Adaptive drill →
          </Link>
        </GlassCard>
      </div>

      {/* Heatmap Visual Matrix Card */}
      <GlassCard tone="strong" bezel className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--fg)]">
              Mastery Heat Density Grid
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Visual overview of topics from introductory (glass) to full fluency (aurora glow).
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--muted)]">
            {skills.length} Topics
          </span>
        </div>

        <Heatmap cells={heatmapCells} columns={8} showLegend />
      </GlassCard>

      {/* Metacognitive 2x2 Confidence-vs-Accuracy Quadrant */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)]">
              Confidence-vs-Accuracy Quadrants
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Metacognitive calibration: detects dangerous overconfidence and imposter syndrome.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--muted)]">
            {quadrants.totalRated} rated submissions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top-Right: Calibrated High (Mastery) */}
          <GlassCard
            tone="default"
            bezel
            className="border-l-4 border-l-[var(--state-good-fg)] p-6 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--state-good-fg)] font-bold">
                🎯 Calibrated Mastery
              </span>
              <Chip
                k="RATIO"
                v={`${quadrants.calibratedHigh.count} (${quadrants.calibratedHigh.percentage}%)`}
                tone="good"
              />
            </div>
            <div className="text-sm font-bold text-[var(--fg)]">
              High Confidence • Correct
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              True domain fluency. You knew the concept and answered with certainty.
            </p>
          </GlassCard>

          {/* Top-Left: Underconfident */}
          <GlassCard
            tone="default"
            bezel
            className="border-l-4 border-l-[var(--category-tint-2)] p-6 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                🤔 Underconfident / Lucky
              </span>
              <Chip
                k="RATIO"
                v={`${quadrants.underconfident.count} (${quadrants.underconfident.percentage}%)`}
                tone="tint2"
              />
            </div>
            <div className="text-sm font-bold text-[var(--fg)]">
              Low Confidence • Correct
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Intuitive or lucky answer. You doubted yourself despite picking the right solution.
            </p>
          </GlassCard>

          {/* Bottom-Left: Calibrated Low (Recognized Gap) */}
          <GlassCard
            tone="default"
            bezel
            className="border-l-4 border-l-[var(--border)] p-6 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                ⚡ Recognized Knowledge Gap
              </span>
              <Chip
                k="RATIO"
                v={`${quadrants.calibratedLow.count} (${quadrants.calibratedLow.percentage}%)`}
                tone="default"
              />
            </div>
            <div className="text-sm font-bold text-[var(--fg)]">
              Low Confidence • Incorrect
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Calibrated humility. You were aware of your gap and guessed accordingly.
            </p>
          </GlassCard>

          {/* Bottom-Right: Overconfident (Danger Zone!) */}
          <GlassCard
            tone="default"
            bezel
            className="border-l-4 border-l-[var(--state-bad-fg)] p-6 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--state-bad-fg)] font-bold">
                ⚠️ Dangerous Misconception
              </span>
              <Chip
                k="RATIO"
                v={`${quadrants.overconfident.count} (${quadrants.overconfident.percentage}%)`}
                tone="bad"
              />
            </div>
            <div className="text-sm font-bold text-[var(--fg)]">
              High Confidence • Incorrect
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Critical interview hazard. You were certain of your answer, but held a misconception.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Skill Heatmap Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)]">
              Verified Skill Matrix
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Deterministic progress per skill based on real drill accuracy and response latencies.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((item: SkillHeatmapItem) => {
            const hasAttempts = item.totalAttempts > 0;
            return (
              <GlassCard
                key={item.skill}
                tone="subtle"
                bezel
                className="flex flex-col justify-between space-y-4 p-5 hover:border-[var(--accent)] transition-all"
              >
                <div className="space-y-3">
                  {/* Skill header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[var(--fg)]">
                        {item.skill}
                      </h3>
                      <span className="text-[11px] font-mono text-[var(--muted)] capitalize">
                        {item.level} tier
                      </span>
                    </div>
                    <Chip
                      k="TIER"
                      v={item.masteryTier.toUpperCase()}
                      tone={getMasteryTone(item.masteryTier)}
                    />
                  </div>

                  {/* Accuracy progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted)]">Accuracy</span>
                      <span className="font-mono font-bold text-[var(--fg)]">
                        {hasAttempts ? `${item.accuracy}%` : "No attempts"}
                      </span>
                    </div>
                    <ProgressBar value={hasAttempts ? item.accuracy : 0} />
                  </div>

                  {/* Detailed stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--border)]">
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] font-mono">
                        ATTEMPTS
                      </span>
                      <span className="font-semibold text-[var(--fg)]">
                        {item.correctAttempts} / {item.totalAttempts}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] font-mono">
                        AVG LATENCY
                      </span>
                      <span className="font-semibold text-[var(--fg)]">
                        {hasAttempts ? `${(item.averageMs / 1000).toFixed(1)}s` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Warning if overconfident misses exist */}
                  {item.overconfidentCount > 0 && (
                    <div className="p-2 rounded-xl bg-[var(--state-bad-bg)] text-[var(--state-bad-fg)] text-[11px] font-medium flex items-center gap-1.5">
                      <span>⚠️ {item.overconfidentCount} overconfident mistake(s)</span>
                    </div>
                  )}
                </div>

                {/* Card CTA */}
                <div className="pt-2">
                  <Button
                    href="/quiz/practical"
                    variant="secondary"
                    size="sm"
                    className="w-full text-center"
                  >
                    Drill {item.skill} →
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Bottom Recommendation CTA */}
      <GlassCard tone="aurora" bezel className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
            Ready to improve your calibration?
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            {summary.weakSkills.length > 0
              ? `Target your lowest accuracy skills: ${summary.weakSkills.join(", ")}.`
              : "Maintain your sharp intuition with a daily 5-minute drill."}
          </p>
        </div>
        <Button
          href="/quiz/weak_area"
          variant="primary"
          size="md"
          className="shrink-0"
        >
          Launch Adaptive Drill →
        </Button>
      </GlassCard>
    </div>
  );
}
