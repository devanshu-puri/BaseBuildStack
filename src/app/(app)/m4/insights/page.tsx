"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatBlock } from "@/components/ui/stat-block";
import type { MetacognitionReport } from "@/lib/m4/metacognition";

const MIN_SAMPLES_THRESHOLD = 10;

export default function MetacognitionInsightsPage() {
  const [report, setReport] = useState<MetacognitionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch("/api/m4/insights");
        const json = await res.json();
        if (res.ok && json.ok) {
          setReport(json.data);
        } else {
          setError(json.error || "Failed to load metacognitive report.");
        }
      } catch {
        setError("Network error while loading insights.");
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/m4"
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 font-mono"
          >
            ← Module IV: Logic &amp; Cognitive Gym
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] mt-1 tracking-tight">
            Metacognitive Calibration &amp; Self-Awareness
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Calibrating subjective confidence against objective correctness to eliminate dangerous blind spots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip k="MIN THRESHOLD" v={`${MIN_SAMPLES_THRESHOLD} Samples`} tone="accent" className="text-[11px]" />
          <Chip
            k="STATUS"
            v={report?.hasSufficientData ? "Calibrated" : "Collecting Samples"}
            tone={report?.hasSufficientData ? "good" : "default"}
            className="text-[11px]"
          />
        </div>
      </div>

      {loading && (
        <GlassCard tone="default" bezel className="text-center py-12 space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-xs font-mono text-[var(--muted)]">
            Aggregating confidence vectors &amp; cognitive sample matrix...
          </p>
        </GlassCard>
      )}

      {error && (
        <GlassCard tone="subtle" className="p-4 border-[var(--state-bad-fg)]">
          <p className="text-xs font-mono text-[var(--state-bad-fg)]">{error}</p>
        </GlassCard>
      )}

      {report && !loading && (
        <>
          {/* Hero Diagnostic Insight Card */}
          <GlassCard
            tone={report.hasSufficientData ? "aurora" : "default"}
            bezel
            className="p-6 sm:p-8 space-y-5 shadow-sm relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-bold flex items-center gap-1.5">
                <span>🧠</span> Plain-Language Metacognitive Insight
              </span>
              <span className="text-xs font-mono text-[var(--muted)]">
                Sample Count: <strong className="text-[var(--fg)]">{report.totalSamples}</strong> / {MIN_SAMPLES_THRESHOLD} minimum
              </span>
            </div>

            {report.hasSufficientData ? (
              <div className="space-y-4">
                <blockquote className="text-base sm:text-lg font-medium text-[var(--fg)] leading-relaxed italic border-l-4 border-[var(--accent)] pl-4 py-1">
                  &ldquo;{report.plainLanguageInsight}&rdquo;
                </blockquote>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <GlassCard tone="subtle" className="p-4">
                    <StatBlock
                      value={`${report.calibrationScore}%`}
                      caption="CALIBRATION SCORE"
                      size="sm"
                      aurora
                    />
                  </GlassCard>
                  <GlassCard tone="subtle" className="p-4">
                    <StatBlock
                      value={report.certaintyAccuracy !== null ? `${Math.round(report.certaintyAccuracy * 100)}%` : "N/A"}
                      caption="ACCURACY WHEN CERTAIN"
                      size="sm"
                    />
                  </GlassCard>
                  <GlassCard tone="subtle" className="p-4">
                    <StatBlock
                      value={report.overconfidenceRate !== null ? `${Math.round(report.overconfidenceRate * 100)}%` : "0%"}
                      caption="OVERCONFIDENCE RATE"
                      size="sm"
                    />
                  </GlassCard>
                  <GlassCard tone="subtle" className="p-4">
                    <StatBlock
                      value={report.underconfidenceRate !== null ? `${Math.round(report.underconfidenceRate * 100)}%` : "0%"}
                      caption="UNDERCONFIDENCE RATE"
                      size="sm"
                    />
                  </GlassCard>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {report.plainLanguageInsight}
                </p>

                {/* Progress bar toward minimum 10 samples */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
                    <span>Progress to diagnostic unlock:</span>
                    <span className="text-[var(--accent)] font-semibold">{report.totalSamples} of {MIN_SAMPLES_THRESHOLD} samples ({report.samplesRemaining} remaining)</span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, Math.round((report.totalSamples / MIN_SAMPLES_THRESHOLD) * 100))}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button href="/m4/sprint" variant="primary" size="sm">
                    Start 5-Min Mind Sprint →
                  </Button>
                  <Button href="/m4/logic-grid" variant="secondary" size="sm">
                    Solve Logic Grid →
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* 4-Quadrant Metacognitive Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--fg)]">
                Metacognitive Calibration Matrix
              </h2>
              <span className="text-xs font-mono text-[var(--muted)]">
                4-Quadrant Subjective vs Objective Distribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Q1: High Calibration (Certain + Correct) */}
              <GlassCard
                tone="default"
                bezel
                className="border-l-4 border-l-[var(--state-good-fg)] p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--state-good-fg)] flex items-center gap-1.5">
                    <span>🎯</span> {report.matrix.calibratedHigh.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--fg)]">
                    {report.matrix.calibratedHigh.count} ({report.matrix.calibratedHigh.percent}%)
                  </span>
                </div>
                <p className="text-xs text-[var(--fg)] font-semibold">
                  {report.matrix.calibratedHigh.description}
                </p>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Optimal performance zone: You correctly recognized that your deduction was sound.
                </p>
              </GlassCard>

              {/* Q2: Danger Zone / Overconfident (Certain + Incorrect) */}
              <GlassCard
                tone="default"
                bezel
                className="border-l-4 border-l-[var(--state-bad-fg)] p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--state-bad-fg)] flex items-center gap-1.5">
                    <span>⚠️</span> {report.matrix.overconfident.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--fg)]">
                    {report.matrix.overconfident.count} ({report.matrix.overconfident.percent}%)
                  </span>
                </div>
                <p className="text-xs text-[var(--fg)] font-semibold">
                  {report.matrix.overconfident.description}
                </p>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  High-risk interview trap: Believing an answer is right when a hidden constraint failed.
                </p>
              </GlassCard>

              {/* Q3: Hidden Competence / Underconfident (Unsure + Correct) */}
              <GlassCard
                tone="default"
                bezel
                className="border-l-4 border-l-[var(--category-tint-2)] p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <span>💡</span> {report.matrix.underconfident.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--fg)]">
                    {report.matrix.underconfident.count} ({report.matrix.underconfident.percent}%)
                  </span>
                </div>
                <p className="text-xs text-[var(--fg)] font-semibold">
                  {report.matrix.underconfident.description}
                </p>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Imposter syndrome indicator: You had the right intuition but lacked confidence.
                </p>
              </GlassCard>

              {/* Q4: Aware Uncertainty (Unsure + Incorrect) */}
              <GlassCard
                tone="default"
                bezel
                className="border-l-4 border-l-[var(--border)] p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <span>⚖️</span> {report.matrix.calibratedLow.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--fg)]">
                    {report.matrix.calibratedLow.count} ({report.matrix.calibratedLow.percent}%)
                  </span>
                </div>
                <p className="text-xs text-[var(--fg)] font-semibold">
                  {report.matrix.calibratedLow.description}
                </p>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Healthy skepticism: You accurately identified when you were guessing or missing details.
                </p>
              </GlassCard>
            </div>
          </div>

          {/* Category-by-Category Calibration Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--fg)]">
                Category Heatmap &amp; Calibration Breakdown
              </h2>
              <span className="text-xs font-mono text-[var(--muted)]">
                Requires {MIN_SAMPLES_THRESHOLD} samples per category for diagnostic conclusions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.categories.map((cat) => (
                <GlassCard
                  key={cat.category}
                  tone="subtle"
                  bezel
                  className="p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--fg)]">
                      {cat.displayName}
                    </h3>
                    <Chip
                      k="SAMPLES"
                      v={`${cat.sampleCount}`}
                      tone={cat.hasSufficientData ? "good" : "default"}
                      className="text-[10px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <GlassCard tone="subtle" className="p-2.5">
                      <span className="text-[10px] text-[var(--muted)] block">Accuracy</span>
                      <span className="font-bold text-[var(--fg)]">{cat.accuracy}%</span>
                    </GlassCard>
                    <GlassCard tone="subtle" className="p-2.5">
                      <span className="text-[10px] text-[var(--muted)] block">Calibration</span>
                      <span className="font-bold text-[var(--accent)]">
                        {cat.calibrationScore !== null ? `${cat.calibrationScore}%` : "—"}
                      </span>
                    </GlassCard>
                  </div>

                  {cat.hasSufficientData ? (
                    <p className="text-xs text-[var(--muted)] italic border-t border-[var(--border)] pt-2 leading-relaxed">
                      &ldquo;{cat.conclusion}&rdquo;
                    </p>
                  ) : (
                    <div className="border-t border-[var(--border)] pt-2 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                        <span>Calibration lock</span>
                        <span>{cat.samplesRemaining} more needed</span>
                      </div>
                      <ProgressBar
                        value={Math.min(100, (cat.sampleCount / MIN_SAMPLES_THRESHOLD) * 100)}
                      />
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[var(--border)]">
        <Link
          href="/m4"
          className="text-xs font-semibold text-[var(--accent)] hover:underline font-mono"
        >
          ← Return to Module IV Hub
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/progress"
            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
          >
            Overall Learning Progress →
          </Link>
        </div>
      </div>
    </div>
  );
}
