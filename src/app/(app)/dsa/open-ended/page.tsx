"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StepperTimeline } from "@/components/ui/stepper-timeline";
import { OptionButton } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { BottomCTA } from "@/components/ui/bottom-cta";
import {
  OpenEndedDrill,
  DrillPushbackNode,
} from "@/content/m1/open-ended-schema";
import { getPushbackNode } from "@/content/m1/open-ended-problems";
import type { OpenEndedVerdict } from "@/lib/m1/open-ended-session";

export default function OpenEndedDrillPage() {
  const [drills, setDrills] = useState<
    Array<{ id: string; title: string; category: string; difficulty: string; vagueScenario: string }>
  >([]);
  const [selectedDrillId, setSelectedDrillId] = useState<string>("");
  const [currentDrill, setCurrentDrill] = useState<OpenEndedDrill | null>(null);
  const [loading, setLoading] = useState(true);

  // Stepper state: 1: Constraints, 2: Primitives, 3: Pushback, 4: Verdict
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);

  // Choices
  const [phase1Choice, setPhase1Choice] = useState<number | null>(null);
  const [phase2Choice, setPhase2Choice] = useState<number | null>(null);
  const [phase3Choice, setPhase3Choice] = useState<number | null>(null);
  const [freeTextDefence, setFreeTextDefence] = useState("");
  const [showFreeTextInput, setShowFreeTextInput] = useState(false);

  // Submission & Verdict
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<OpenEndedVerdict | null>(null);

  // Initial load
  useEffect(() => {
    async function fetchDrills() {
      try {
        const res = await fetch("/api/dsa/open-ended");
        if (res.ok) {
          const data = await res.json();
          setDrills(data.drills || []);
          if (data.drills && data.drills.length > 0) {
            setSelectedDrillId(data.drills[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load drills list:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDrills();
  }, []);

  // Fetch full drill data when selectedDrillId changes
  useEffect(() => {
    if (!selectedDrillId) return;

    async function loadFullDrill() {
      try {
        const res = await fetch(`/api/dsa/open-ended?id=${selectedDrillId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentDrill(data.drill);
          // Reset selections
          setCurrentStage(1);
          setPhase1Choice(null);
          setPhase2Choice(null);
          setPhase3Choice(null);
          setFreeTextDefence("");
          setVerdict(null);
        }
      } catch (err) {
        console.error("Failed to fetch drill details:", err);
      }
    }

    loadFullDrill();
  }, [selectedDrillId]);

  if (loading || !currentDrill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm font-mono text-[var(--muted)]">Loading Open-Ended Drill...</p>
      </div>
    );
  }

  // Active pushback node determined by Phase 2 choice
  const pushbackNode: DrillPushbackNode = getPushbackNode(
    currentDrill,
    phase2Choice ?? 0
  );

  const handleSubmit = async () => {
    if (
      phase1Choice === null ||
      phase2Choice === null ||
      phase3Choice === null ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/dsa/open-ended/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillId: currentDrill.id,
          phase1Selected: phase1Choice,
          phase2Selected: phase2Choice,
          phase3Selected: phase3Choice,
          freeTextDefence: freeTextDefence.trim() || undefined,
          ms: 120_000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerdict(data.verdict);
        setCurrentStage(4);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const timelineSteps = [
    {
      id: "constraints",
      title: "Constraints",
      description: "Scale & traffic estimates",
      status: (currentStage === 1 ? "active" : currentStage > 1 ? "done" : "todo") as "todo" | "active" | "done",
    },
    {
      id: "primitives",
      title: "Primitives",
      description: "Component architecture mapping",
      status: (currentStage === 2 ? "active" : currentStage > 2 ? "done" : "todo") as "todo" | "active" | "done",
    },
    {
      id: "pushback",
      title: "Pushback",
      description: "Interviewer challenge & defence",
      status: (currentStage === 3 ? "active" : currentStage > 3 ? "done" : "todo") as "todo" | "active" | "done",
    },
    {
      id: "verdict",
      title: "Verdict",
      description: "Rubric evaluation & takeaway",
      status: (currentStage === 4 ? "active" : "todo") as "todo" | "active" | "done",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28">
      {/* Header Bar & Scenario Selector */}
      <GlassCard tone="subtle" bezel className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wider">
            MODE C: OPEN-ENDED DRILL
          </span>
          <Chip
            k="DIFFICULTY"
            v={currentDrill.difficulty}
            tone={currentDrill.difficulty === "hard" ? "bad" : "accent"}
          />
        </div>

        {drills.length > 1 && (
          <select
            value={selectedDrillId}
            onChange={(e) => setSelectedDrillId(e.target.value)}
            className="text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          >
            {drills.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        )}
      </GlassCard>

      {/* Stepper Timeline */}
      <GlassCard tone="default" bezel className="p-5">
        <StepperTimeline steps={timelineSteps} />
      </GlassCard>

      {/* Scenario Overview Card */}
      <GlassCard tone="default" bezel className="p-6 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--fg)]">
            {currentDrill.title}
          </h1>
          <Chip k="CATEGORY" v={currentDrill.category} tone="default" />
        </div>

        <p className="text-sm text-[var(--muted)] leading-relaxed bg-[var(--glass-subtle)] p-4 rounded-xl border border-[var(--border)]">
          {currentDrill.vagueScenario}
        </p>
      </GlassCard>

      {/* PHASE 1: Constraints & Scale Estimates */}
      {currentStage === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
              Phase 1: Scale &amp; Constraint Estimates
            </h2>
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">
              Step 1 of 3
            </span>
          </div>

          <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">
            {currentDrill.phase1Constraints.prompt}
          </p>

          <div className="space-y-2.5">
            {currentDrill.phase1Constraints.mcqOptions.map((opt, idx) => (
              <OptionButton
                key={idx}
                label={opt}
                prefix={String.fromCharCode(65 + idx)}
                state={phase1Choice === idx ? "selected" : "idle"}
                onClick={() => setPhase1Choice(idx)}
              />
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              disabled={phase1Choice === null}
              onClick={() => setCurrentStage(2)}
            >
              Confirm Estimates → Next Phase
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 2: Map to Engineering Primitives */}
      {currentStage === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
              Phase 2: Architectural Primitive Mapping
            </h2>
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">
              Step 2 of 3
            </span>
          </div>

          <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">
            {currentDrill.phase2Primitives.prompt}
          </p>

          <div className="space-y-2.5">
            {currentDrill.phase2Primitives.mcqOptions.map((opt, idx) => (
              <OptionButton
                key={idx}
                label={opt}
                prefix={String.fromCharCode(65 + idx)}
                state={phase2Choice === idx ? "selected" : "idle"}
                onClick={() => setPhase2Choice(idx)}
              />
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStage(1)}
            >
              ← Back to Constraints
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={phase2Choice === null}
              onClick={() => setCurrentStage(3)}
            >
              Confirm Architecture → Next Phase
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 3: Interviewer Pushback & Technical Defence */}
      {currentStage === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
              Phase 3: Interviewer Pushback
            </h2>
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">
              Step 3 of 3
            </span>
          </div>

          {/* Interviewer Dialog Bubble */}
          <GlassCard tone="subtle" bezel className="p-4 space-y-2 border-l-4 border-l-[var(--accent)]">
            <div className="flex items-center gap-2">
              <span className="text-base">🧑‍💼</span>
              <span className="text-xs font-mono font-bold text-[var(--accent)]">
                Lead System Architect
              </span>
            </div>
            <p className="text-xs text-[var(--fg)] leading-relaxed italic">
              {pushbackNode.interviewerChallenge}
            </p>
          </GlassCard>

          {/* MCQ Defence Options */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-[var(--muted)] uppercase font-semibold">
              Select Defense Strategy:
            </div>
            {pushbackNode.mcqOptions.map((opt, idx) => (
              <OptionButton
                key={idx}
                label={opt}
                prefix={String.fromCharCode(65 + idx)}
                state={phase3Choice === idx ? "selected" : "idle"}
                onClick={() => setPhase3Choice(idx)}
              />
            ))}
          </div>

          {/* Optional Free-Text Defence for Rubric Grading */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => setShowFreeTextInput(!showFreeTextInput)}
              className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1.5 font-semibold"
            >
              <span>{showFreeTextInput ? "▾" : "▸"}</span>
              <span>{showFreeTextInput ? "Hide Free-Text Argument" : "+ Add Written Technical Defence (Rubric Grading)"}</span>
            </button>

            {showFreeTextInput && (
              <GlassCard tone="subtle" className="space-y-2 p-4">
                <label className="text-[11px] font-mono text-[var(--muted)]">
                  Explain your mitigation strategy, failure modes, and architectural trade-offs:
                </label>
                <textarea
                  value={freeTextDefence}
                  onChange={(e) => setFreeTextDefence(e.target.value)}
                  placeholder="e.g. To handle Redis cluster degradation, we implement local in-process token buckets with fail-open circuit breakers..."
                  rows={4}
                  className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-3 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </GlassCard>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStage(2)}
            >
              ← Back to Primitives
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={phase3Choice === null || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Grading Drill..." : "Submit Defence →"}
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 4: Verdict, Rubric Score Breakdown & Canonical Takeaway */}
      {currentStage === 4 && verdict && (
        <div className="space-y-6 pt-2">
          <FeedbackCard
            verdict={verdict.isFullyCorrect ? "correct" : "incorrect"}
            why={verdict.explanation.phase3}
            distractors={[verdict.explanation.phase2]}
            takeaway={verdict.canonicalTakeaway}
          />

          {/* Phase Accuracy Breakdown */}
          <GlassCard tone="default" bezel className="p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-[var(--fg)] uppercase tracking-wider">
              Phase-by-Phase Review:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--muted)]">Phase 1: Constraints</span>
                <div className={`font-bold ${verdict.phase1Correct ? "text-[var(--state-good-fg)]" : "text-[var(--state-bad-fg)]"}`}>
                  {verdict.phase1Correct ? "✓ Correct" : "✗ Inaccurate"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--muted)]">Phase 2: Primitives</span>
                <div className={`font-bold ${verdict.phase2Correct ? "text-[var(--state-good-fg)]" : "text-[var(--state-bad-fg)]"}`}>
                  {verdict.phase2Correct ? "✓ Correct" : "✗ Inaccurate"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--muted)]">Phase 3: Pushback</span>
                <div className={`font-bold ${verdict.phase3Correct ? "text-[var(--state-good-fg)]" : "text-[var(--state-bad-fg)]"}`}>
                  {verdict.phase3Correct ? "✓ Correct" : "✗ Inaccurate"}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Rubric Evaluation Breakdown if available */}
          {verdict.rubricEvaluation && (
            <GlassCard tone="default" bezel className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-[var(--fg)] uppercase tracking-wider">
                  Technical Defence Rubric Evaluation
                </div>
                <div className="text-lg font-mono font-bold text-[var(--accent)]">
                  {verdict.rubricEvaluation.score} / 100
                </div>
              </div>

              <p className="text-xs font-mono text-[var(--muted)] italic">
                &ldquo;{verdict.rubricEvaluation.feedback}&rdquo;
              </p>

              <div className="space-y-3 pt-2">
                {verdict.rubricEvaluation.criteriaBreakdown.map((crit, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[var(--fg)]">
                      <span>{crit.name}</span>
                      <span className="font-semibold">{crit.score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--glass-subtle)] overflow-hidden border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--accent)] transition-all"
                        style={{ width: `${crit.score}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {crit.comments}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* XP Breakdown Card */}
          <GlassCard tone="subtle" className="flex items-center justify-between p-4 text-xs font-mono">
            <span className="text-[var(--muted)]">
              Decision Tree Drill Completed
            </span>
            {verdict.xpAwarded > 0 && (
              <span className="text-[var(--accent)] font-bold">
                +{verdict.xpAwarded} XP Earned
              </span>
            )}
          </GlassCard>

          {/* Action to replay or go home */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => {
                setCurrentStage(1);
                setPhase1Choice(null);
                setPhase2Choice(null);
                setPhase3Choice(null);
                setFreeTextDefence("");
                setVerdict(null);
              }}
            >
              Replay Scenario
            </Button>
            <Button
              href="/home"
              variant="primary"
              size="md"
              className="flex-1"
            >
              Back to Home →
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Next/Confirm Button */}
      {currentStage < 4 && (
        <BottomCTA
          label={
            currentStage === 1
              ? "Confirm Constraints →"
              : currentStage === 2
              ? "Confirm Architecture →"
              : "Submit Defence →"
          }
          onClick={() => {
            if (currentStage === 1 && phase1Choice !== null) setCurrentStage(2);
            else if (currentStage === 2 && phase2Choice !== null) setCurrentStage(3);
            else if (currentStage === 3 && phase3Choice !== null) handleSubmit();
          }}
          disabled={
            (currentStage === 1 && phase1Choice === null) ||
            (currentStage === 2 && phase2Choice === null) ||
            (currentStage === 3 && (phase3Choice === null || submitting))
          }
        />
      )}
    </div>
  );
}
