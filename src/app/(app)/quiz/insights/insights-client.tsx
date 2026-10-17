"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip, ChipTone } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/ui/stat-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  DiagnosticInsightsPayload,
  ReadinessBand,
} from "@/lib/m2/readiness-calculator";

export function InsightsClient() {
  const [data, setData] = useState<DiagnosticInsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await fetch("/api/quiz/insights");
        if (!res.ok) {
          throw new Error("Failed to load interview readiness insights");
        }
        const json = await res.json();
        if (json.insights) {
          setData(json.insights);
        } else {
          throw new Error("Invalid response structure from insights API");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm font-mono text-[var(--text-3)] animate-pulse">
          Computing 3-Score interview readiness model...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <GlassCard tone="subtle" padding="lg" className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--state-bad-bg)] text-[var(--state-bad-fg)] font-bold text-xl flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]">Diagnostics Unavailable</h2>
          <p className="text-sm text-[var(--text-2)]">
            {error || "Could not retrieve your diagnostic scores."}
          </p>
          <div className="pt-2">
            <Button href="/quiz" variant="primary" size="md">
              ← Return to Quiz Hub
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { scores, readinessBand, summary, recommendations, skills, calibration } = data;

  // Composite readiness calculation
  const compositeScore = Math.round(
    ((scores.stackKnowledge || 0) +
      (scores.interviewReadiness || 0) +
      (scores.projectUnderstanding || 0)) /
      3
  );

  const getBandBadgeTone = (band: ReadinessBand): ChipTone => {
    switch (band) {
      case "Staff Calibrated":
      case "Interview Ready":
        return "good";
      case "Developing":
        return "accent";
      case "Needs Practice":
        return "bad";
      default:
        return "default";
    }
  };

  const getSkillTierTone = (tier: string): ChipTone => {
    switch (tier) {
      case "mastered":
        return "good";
      case "proficient":
        return "accent";
      case "learning":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="py-4 max-w-5xl mx-auto space-y-8 pb-36">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Chip k="MODULE" v="II" tone="accent" />
            <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
              Diagnostic Analytics &amp; Calibration
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
            Interview Readiness Score
          </h1>
          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl">
            Deterministic 3-score evaluation measuring depth, live debugging triage, and project defense readiness.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button href="/quiz/onboarding" variant="secondary" size="sm" className="text-xs">
            ⚙️ Edit Stack
          </Button>
          <Button href="/quiz" variant="primary" size="sm" className="text-xs">
            Take a Drill &rarr;
          </Button>
        </div>
      </div>

      {/* Hero Readiness Gauge Banner */}
      <GlassCard tone="subtle" padding="lg" className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                Overall Diagnostic Status
              </span>
              <Chip v={readinessBand.toUpperCase()} tone={getBandBadgeTone(readinessBand)} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
              {readinessBand === "Staff Calibrated" && "Staff-Calibrated Fluency"}
              {readinessBand === "Interview Ready" && "Strong Interview Readiness"}
              {readinessBand === "Developing" && "Developing Competence"}
              {readinessBand === "Needs Practice" && "Active Practice Recommended"}
              {readinessBand === "Not Started" && "Diagnostics Uncalibrated"}
            </h2>
            <p className="text-sm text-[var(--text-2)] leading-relaxed">
              {readinessBand === "Staff Calibrated" &&
                "You demonstrate high precision across core system mechanisms, rapid production incident triage, and thorough architecture defense."}
              {readinessBand === "Interview Ready" &&
                "Your fundamentals and project defense meet hiring bar standards for technical interview rounds. Polish weak spots before your round."}
              {readinessBand === "Developing" &&
                "Solid foundation in key stack technologies. Complete additional Click-the-Buggy-Line scenarios and review project STAR responses."}
              {readinessBand === "Needs Practice" &&
                "Noticeable gaps in either core mechanics or incident debugging. Run targeted skill drills below to raise your scores."}
              {readinessBand === "Not Started" &&
                "Take a 5-question Skill Drill and review at least one project question to establish your baseline readiness profile."}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-[var(--glass-subtle)] border border-[var(--border)] rounded-2xl p-5">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-[var(--text-3)] tracking-wider block">
                Composite Bar
              </span>
              <span className="font-display text-4xl sm:text-5xl font-extrabold text-[var(--accent-bright)] tabular-nums">
                {summary.totalQuestionsAnswered >= 3 ? `${compositeScore}%` : "—"}
              </span>
              <span className="text-[11px] font-mono text-[var(--text-3)] block mt-0.5">
                {summary.totalQuestionsAnswered >= 3 ? "Evaluated" : "Need 3+ answers"}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* The 3 Core Product Pillars */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text)]">
            The Three Evaluation Pillars
          </h2>
          <span className="text-xs font-mono text-[var(--text-3)]">
            Calibrated against candidate stack
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Stack Knowledge */}
          <GlassCard tone="subtle" padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                  Pillar 1
                </span>
                <span className="text-[10px] font-mono text-[var(--accent-bright)] font-bold">
                  WEIGHTED 1x–2x
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text)]">
                Stack Knowledge Score
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Depth &amp; accuracy across canonical skills in your confirmed stack, with hard difficulty multipliers.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text)]">
                  {scores.stackKnowledge !== null ? `${scores.stackKnowledge}%` : "—"}
                </span>
                <span className="text-xs font-mono text-[var(--text-3)]">
                  {summary.totalQuestionsAnswered} answered
                </span>
              </div>
              <ProgressBar value={scores.stackKnowledge || 0} size="sm" />
            </div>
          </GlassCard>

          {/* Pillar 2: Interview Readiness */}
          <GlassCard tone="subtle" padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                  Pillar 2
                </span>
                <span className="text-[10px] font-mono text-[var(--text-3)] font-bold">
                  40% / 35% / 25%
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text)]">
                Interview Readiness
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Triangulates fundamentals accuracy, practical debugging incident triage, and metacognitive calibration.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text)]">
                  {scores.interviewReadiness !== null ? `${scores.interviewReadiness}%` : "—"}
                </span>
                <span className="text-xs font-mono text-[var(--text-3)]">
                  {summary.debuggingSolved}/5 debugged
                </span>
              </div>
              <ProgressBar value={scores.interviewReadiness || 0} size="sm" />
            </div>
          </GlassCard>

          {/* Pillar 3: Project Understanding */}
          <GlassCard tone="subtle" padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                  Pillar 3
                </span>
                <span className="text-[10px] font-mono text-[var(--state-good-fg)] font-bold">
                  RESUME GROUNDED
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text)]">
                Project Defense Score
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Evaluates senior panel defense questions across architecture, trade-offs, and throughput metrics.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text)]">
                  {scores.projectUnderstanding !== null ? `${scores.projectUnderstanding}%` : "—"}
                </span>
                <span className="text-xs font-mono text-[var(--text-3)]">
                  {summary.projectsMastered}/{summary.projectsTotal} mastered
                </span>
              </div>
              <ProgressBar value={scores.projectUnderstanding || 0} size="sm" />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Metacognitive Calibration Analysis */}
      <GlassCard tone="subtle" padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--text)]">
              Metacognitive Calibration Rating
            </h3>
            <p className="text-xs text-[var(--text-2)]">
              Measures how accurately your confidence matches objective correctness before submitting.
            </p>
          </div>

          <Chip
            k="STATUS"
            v={
              calibration.rating === "calibrated"
                ? "Calibrated"
                : calibration.rating === "overconfident"
                ? "Overconfidence Hazard"
                : calibration.rating === "underconfident"
                ? "Underconfident"
                : "Needs More Data"
            }
            tone={
              calibration.rating === "calibrated"
                ? "good"
                : calibration.rating === "overconfident"
                ? "bad"
                : "default"
            }
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)]">
          <div className="p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-3)] block">
              100% Certain &amp; Correct
            </span>
            <span className="text-lg font-bold font-mono text-[var(--state-good-fg)]">
              {calibration.certainCorrect}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-3)] block">
              100% Certain &amp; Wrong ⚠️
            </span>
            <span className="text-lg font-bold font-mono text-[var(--state-bad-fg)]">
              {calibration.certainWrong}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-3)] block">
              Unsure &amp; Correct
            </span>
            <span className="text-lg font-bold font-mono text-[var(--text)]">
              {calibration.unsureCorrect}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-3)] block">
              Calibration Rate
            </span>
            <span className="text-lg font-bold font-mono text-[var(--accent-bright)]">
              {summary.calibrationRate}%
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Adaptive Next Action Recommendations */}
      {recommendations.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text)]">
            Adaptive Action Items
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <GlassCard
                key={rec.id}
                tone="subtle"
                padding="md"
                className="flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Chip v={rec.tone.toUpperCase()} tone={rec.tone as ChipTone} />
                    <h3 className="font-display text-base font-bold text-[var(--text)]">
                      {rec.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                  <Button href={rec.actionHref} variant="primary" size="sm">
                    {rec.actionLabel}
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* Per-Skill Breakdown Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text)]">
              Skill Mastery Breakdown
            </h2>
            <p className="text-xs text-[var(--text-2)]">
              Per-skill accuracy and depth across your active stack.
            </p>
          </div>
          <Link
            href="/quiz/onboarding"
            className="text-xs font-mono text-[var(--accent-bright)] hover:underline"
          >
            Manage Skills →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <GlassCard
              key={skill.skillId}
              tone="subtle"
              padding="sm"
              className="space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text)]">
                    {skill.name}
                  </span>
                  <Chip
                    v={skill.tier.toUpperCase()}
                    tone={getSkillTierTone(skill.tier)}
                    className="text-[10px]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-[var(--text-3)]">
                    <span>Accuracy</span>
                    <span className="text-[var(--text)] font-semibold">
                      {skill.totalAnswered > 0 ? `${skill.accuracy}%` : "No attempts"}
                    </span>
                  </div>
                  <ProgressBar value={skill.accuracy} size="sm" />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[var(--text-3)]">
                  {skill.correctAnswered}/{skill.totalAnswered} correct
                </span>
                <Link
                  href={`/quiz/drills?skill=${skill.skillId}`}
                  className="text-[var(--accent-bright)] hover:underline font-semibold"
                >
                  Drill &rarr;
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
