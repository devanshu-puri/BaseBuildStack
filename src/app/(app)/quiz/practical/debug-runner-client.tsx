"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { BottomCTA } from "@/components/ui/bottom-cta";
import {
  type ClientDebugChallenge,
} from "@/content/m2/debug-data";
import {
  type DebugLineEvaluationResult,
  type DebugHintResult,
} from "@/lib/m2/debug-session";

export function DebugRunnerClient() {
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<ClientDebugChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-challenge state
  const [attemptNumber, setAttemptNumber] = useState<1 | 2>(1);
  const [lineStatuses, setLineStatuses] = useState<
    Record<number, "correct" | "incorrect" | "revealed" | "hint">
  >({});
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [evaluation, setEvaluation] = useState<DebugLineEvaluationResult | null>(null);

  // Hint state
  const [hint, setHint] = useState<DebugHintResult | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [usedHint, setUsedHint] = useState(false);

  // Round summary
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundStats, setRoundStats] = useState({
    total: 0,
    solved: 0,
    firstTrySolved: 0,
    totalXp: 0,
  });

  // Filter configuration
  const [difficulty, setDifficulty] = useState<"mixed" | "basic" | "medium" | "hard">("mixed");

  const resetChallengeState = React.useCallback(() => {
    setAttemptNumber(1);
    setLineStatuses({});
    setSelectedLine(null);
    setIsResolved(false);
    setEvaluation(null);
    setHint(null);
    setUsedHint(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchDeck() {
      try {
        const res = await fetch(`/api/quiz/practical?difficulty=${difficulty}&count=5`);
        const data = await res.json();
        if (!ignore && data.success && data.deck) {
          setDeck(data.deck);
          setRoundStats({
            total: data.deck.length,
            solved: 0,
            firstTrySolved: 0,
            totalXp: 0,
          });
          setCurrentIndex(0);
          resetChallengeState();
          setRoundCompleted(false);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load debug deck:", err);
          setLoading(false);
        }
      }
    }

    fetchDeck();
    return () => {
      ignore = true;
    };
  }, [difficulty, resetChallengeState]);

  const reloadDeck = async (diff: string) => {
    setLoading(true);
    setRoundCompleted(false);
    setCurrentIndex(0);
    resetChallengeState();

    try {
      const res = await fetch(`/api/quiz/practical?difficulty=${diff}&count=5`);
      const data = await res.json();
      if (data.success && data.deck) {
        setDeck(data.deck);
        setRoundStats({
          total: data.deck.length,
          solved: 0,
          firstTrySolved: 0,
          totalXp: 0,
        });
      }
    } catch (err) {
      console.error("Failed to load debug deck:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentChallenge = deck[currentIndex];

  async function handleLineClick(lineNum: number) {
    if (isResolved || submitting || !currentChallenge) return;

    // Don't re-click already wrong lines
    if (lineStatuses[lineNum] === "incorrect") return;

    setSelectedLine(lineNum);
    setSubmitting(true);

    try {
      const res = await fetch("/api/quiz/practical/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: currentChallenge.id,
          clickedLine: lineNum,
          attemptNumber,
          usedHint,
        }),
      });

      const data: DebugLineEvaluationResult = await res.json();
      setEvaluation(data);

      if (data.isBuggy) {
        // Correct bug line clicked
        setLineStatuses((prev) => ({ ...prev, [lineNum]: "correct" }));
        setIsResolved(true);
        setRoundStats((prev) => ({
          ...prev,
          solved: prev.solved + 1,
          firstTrySolved: attemptNumber === 1 ? prev.firstTrySolved + 1 : prev.firstTrySolved,
          totalXp: prev.totalXp + (data.xpAwarded || 0),
        }));
      } else {
        // Wrong line clicked
        setLineStatuses((prev) => ({ ...prev, [lineNum]: "incorrect" }));

        if (data.resolved) {
          // Both attempts used up without finding the bug
          setIsResolved(true);
          if (data.correctLine) {
            setLineStatuses((prev) => ({ ...prev, [data.correctLine!]: "revealed" }));
          }
        } else {
          // 1 attempt remaining
          setAttemptNumber(2);
        }
      }
    } catch (err) {
      console.error("Failed to submit line selection:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestHint() {
    if (!currentChallenge || hintLoading || hint) return;

    setHintLoading(true);
    try {
      const res = await fetch(
        `/api/quiz/practical/hint?challengeId=${currentChallenge.id}`
      );
      const data: DebugHintResult = await res.json();
      setHint(data);
      setUsedHint(true);

      // Highlight hint range
      setLineStatuses((prev) => {
        const next = { ...prev };
        for (let l = data.startLine; l <= data.endLine; l++) {
          if (!next[l]) {
            next[l] = "hint";
          }
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to get hint:", err);
    } finally {
      setHintLoading(false);
    }
  }

  function handleNext() {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      resetChallengeState();
    } else {
      setRoundCompleted(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Loading debugging challenges...
          </p>
        </div>
      </div>
    );
  }

  if (!currentChallenge && !roundCompleted) {
    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-4">
        <GlassCard className="max-w-md p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-white">No Challenges Found</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            No debugging challenges match the selected filters.
          </p>
          <Button onClick={() => reloadDeck("mixed")} variant="primary" className="w-full">
            Reset Filters
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ROUND SUMMARY
  if (roundCompleted) {
    const accuracy = Math.round((roundStats.solved / Math.max(1, roundStats.total)) * 100);

    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] py-8 px-4 sm:px-6 max-w-2xl mx-auto space-y-6 pb-36">
        <GlassCard className="p-6 sm:p-8 text-center space-y-6 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-[rgba(139,124,255,0.15)] border border-[var(--brand-accent)] flex items-center justify-center mx-auto text-3xl shadow-[0_0_24px_rgba(139,124,255,0.3)]">
            🛠️
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Round Completed!</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Great job working through real-world production incident scenarios.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                Solved
              </span>
              <p className="text-xl font-bold text-white">
                {roundStats.solved} / {roundStats.total}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                Accuracy
              </span>
              <p className="text-xl font-bold text-emerald-400">{accuracy}%</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                XP Earned
              </span>
              <p className="text-xl font-bold text-[var(--brand-accent)]">
                +{roundStats.totalXp} XP
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => reloadDeck(difficulty)}
              variant="primary"
              className="flex-1 py-3"
            >
              Play Another Round
            </Button>
            <Link href="/quiz" className="flex-1">
              <Button variant="secondary" className="w-full py-3">
                Return to Quizzes
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ACTIVE CHALLENGE RUNNER
  const maxPossibleXp = attemptNumber === 1 ? (usedHint ? 20 : 25) : usedHint ? 10 : 15;

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] py-6 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 pb-36">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/quiz"
          className="text-xs font-mono text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Exit to Quizzes</span>
        </Link>

        {/* Difficulty Selector */}
        <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/5 text-[11px] font-mono">
          {(["mixed", "basic", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-2.5 py-0.5 rounded capitalize transition-all cursor-pointer ${
                difficulty === d
                  ? "bg-[var(--brand-accent)] text-white font-semibold shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-2">
          <Chip
            k="CHALLENGE"
            v={`${currentIndex + 1} of ${deck.length}`}
            tone="default"
            className="font-mono text-xs"
          />
          <Chip
            k="DIFFICULTY"
            v={currentChallenge.difficulty.toUpperCase()}
            tone={
              currentChallenge.difficulty === "hard"
                ? "bad"
                : currentChallenge.difficulty === "medium"
                ? "running"
                : "good"
            }
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Scenario Incident GlassCard */}
      <GlassCard className="p-4 sm:p-5 border-l-4 border-l-rose-500 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                Production Incident Report
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                {currentChallenge.skillId}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-medium text-white leading-relaxed">
              {currentChallenge.scenario}
            </h2>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)]">
              <span>Attempts:</span>
              <span className="flex gap-1 ml-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    attemptNumber <= 2 && !isResolved
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-white/20"
                  }`}
                />
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    attemptNumber === 1 && !isResolved
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-white/20"
                  }`}
                />
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-[var(--brand-accent)]">
              +{maxPossibleXp} XP max
            </span>
          </div>
        </div>

        {/* Hint Banner or Hint Button */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs text-[var(--text-secondary)]">
            {!isResolved ? (
              <span className="text-white/80 font-mono">
                👉 Click the exact buggy line of code below to submit your fix.
              </span>
            ) : (
              <span className="text-emerald-400 font-mono">
                Challenge completed. Inspect the breakdown below.
              </span>
            )}
          </div>

          {!isResolved && !hint && (
            <button
              onClick={handleRequestHint}
              disabled={hintLoading}
              className="px-2.5 py-1 rounded-lg bg-[rgba(139,124,255,0.1)] hover:bg-[rgba(139,124,255,0.2)] border border-[var(--brand-accent)]/30 text-[var(--brand-accent)] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>💡</span>
              <span>{hintLoading ? "Finding hint..." : "Hint (-5 XP)"}</span>
            </button>
          )}
        </div>

        {/* Revealed Hint Message */}
        {hint && (
          <div className="mt-3 p-3 rounded-xl bg-[rgba(139,124,255,0.08)] border border-[var(--brand-accent)]/30 text-xs text-[#D8D2FF] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--brand-accent)]">
              <span>💡 Socratic Hint:</span>
            </div>
            <p className="leading-relaxed">{hint.message}</p>
          </div>
        )}
      </GlassCard>

      {/* Code Block with Click-the-Line interaction */}
      <div className="relative">
        <CodeBlock
          code={currentChallenge.code}
          lang={currentChallenge.language}
          selectableLines={!isResolved}
          selectedLine={selectedLine || undefined}
          lineStatuses={lineStatuses}
          onSelectLine={handleLineClick}
          className="border-white/10"
        />

        {submitting && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-[20px] flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B0D17] border border-white/10 text-xs font-mono text-white shadow-xl">
              <div className="w-3.5 h-3.5 border-2 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin" />
              <span>Verifying line selection...</span>
            </div>
          </div>
        )}
      </div>

      {/* Mid-round Feedback / Wrong Attempt Callout */}
      {!isResolved && evaluation && !evaluation.isBuggy && (
        <GlassCard className="p-4 border-l-4 border-l-amber-500 bg-amber-500/[0.04] space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️ Miss</span>
              <span>•</span>
              <span>1 Attempt Remaining</span>
            </span>
            <span className="text-xs font-mono text-white/50">
              Selected line: {evaluation.clickedLine}
            </span>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            {evaluation.distractorNote}
          </p>
        </GlassCard>
      )}

      {/* Resolved Solution Panel (Correct or Missed after 2 attempts) */}
      {isResolved && evaluation && (
        <GlassCard className="p-5 sm:p-6 space-y-5 border border-white/10 bg-white/[0.02] animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {evaluation.isBuggy ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Bug Successfully Identified!</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold flex items-center gap-1.5">
                  <span>✕</span>
                  <span>Attempts Exhausted</span>
                </span>
              )}
            </div>

            {evaluation.xpAwarded !== undefined && evaluation.xpAwarded > 0 && (
              <span className="px-3 py-1 rounded-full bg-[rgba(139,124,255,0.15)] border border-[var(--brand-accent)]/40 text-[var(--brand-accent)] font-mono text-xs font-bold">
                +{evaluation.xpAwarded} XP
              </span>
            )}
          </div>

          {/* Visual Code Diff */}
          {evaluation.diff && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                Corrected Code Diff (Line {evaluation.diff.line})
              </span>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07080F] font-mono text-xs p-3 space-y-1.5">
                <div className="flex items-start gap-2 text-rose-300 bg-rose-950/40 p-2 rounded-lg border-l-2 border-rose-500 overflow-x-auto">
                  <span className="select-none font-bold text-rose-400">-</span>
                  <pre className="whitespace-pre">{evaluation.diff.removed}</pre>
                </div>
                <div className="flex items-start gap-2 text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border-l-2 border-emerald-500 overflow-x-auto">
                  <span className="select-none font-bold text-emerald-400">+</span>
                  <pre className="whitespace-pre">{evaluation.diff.added}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Root Cause Explanation */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              Root Cause & Mechanism
            </span>
            <p className="text-sm text-white/90 leading-relaxed">
              {evaluation.explanation}
            </p>
          </div>

          {/* Interview Takeaway */}
          {evaluation.interviewTakeaway && (
            <div className="p-4 rounded-xl bg-[rgba(139,124,255,0.06)] border border-[var(--brand-accent)]/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--brand-accent)]">
                <span>💬</span>
                <span>How to Articulate in an Interview:</span>
              </div>
              <p className="text-xs sm:text-sm text-[#D8D2FF] leading-relaxed">
                {evaluation.interviewTakeaway}
              </p>
            </div>
          )}

          {/* Next Button */}
          <div className="pt-2">
            <Button onClick={handleNext} variant="primary" className="w-full py-3">
              {currentIndex + 1 < deck.length
                ? "Continue to Next Challenge →"
                : "View Round Summary"}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Bottom CTA for mobile floating above dock */}
      {isResolved && (
        <BottomCTA
          label={
            currentIndex + 1 < deck.length
              ? "Continue to Next Challenge →"
              : "View Round Summary"
          }
          onClick={handleNext}
          floatingAboveDock
        />
      )}
    </div>
  );
}
