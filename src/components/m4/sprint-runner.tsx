"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { OptionButton } from "@/components/ui/option-button";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  DailySprint,
  ConfidenceRating,
  SprintItemAnswer,
  SprintResult,
} from "@/content/m4/sprint-schema";
import {
  isBrowserOnline,
  queueOfflineSprint,
  syncOfflineSprints,
} from "@/lib/m4/offline-sync";

interface SprintRunnerProps {
  sprint: DailySprint;
  initialStreak?: number;
}

export function SprintRunner({
  sprint,
  initialStreak = 0,
}: SprintRunnerProps) {
  // Current item index (0..4) or 5 for completed
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-item state
  const currentItem = sprint.items[currentIndex];
  const [timeLeft, setTimeLeft] = useState<number>(
    currentItem ? currentItem.timeLimitSec : 45
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceRating>("certain");

  // Memory challenge sub-phases: 'flash' | 'distractor' | 'recall'
  const [memoryPhase, setMemoryPhase] = useState<
    "flash" | "distractor" | "recall"
  >("flash");
  const [memorySubTimeLeft, setMemorySubTimeLeft] = useState(5);
  const [distractorSelected, setDistractorSelected] = useState<string | null>(
    null
  );

  // Numerical Fermi slider state (exponent: e.g. 9.5)
  const [fermiExponent, setFermiExponent] = useState<number>(8);

  // Collection of answers
  const [answers, setAnswers] = useState<SprintItemAnswer[]>([]);

  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SprintResult | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const itemStartTimestamp = useRef<number>(0);

  // Initialize timestamp on mount and listen to network connectivity
  useEffect(() => {
    itemStartTimestamp.current = Date.now();

    const handleOnline = async () => {
      setIsOffline(false);
      setSyncStatus("Network restored. Syncing offline data...");
      const syncRes = await syncOfflineSprints();
      if (syncRes.syncedCount > 0) {
        setSyncStatus(`Synced ${syncRes.syncedCount} queued sessions ✓`);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus("Offline mode active. Progress is saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Submit full session to API or offline queue
  const finishSprint = useCallback(
    async (finalAnswers: SprintItemAnswer[]) => {
      setIsSubmitting(true);
      const payload = {
        date: sprint.date,
        seed: sprint.seed,
        answers: finalAnswers,
        clientTimestamp: new Date().toISOString(),
        completedOffline: !isBrowserOnline(),
      };

      if (!isBrowserOnline()) {
        // Offline persistence
        queueOfflineSprint(payload);
        // Build local provisional result
        const provisional: SprintResult = {
          date: sprint.date,
          correctCount: finalAnswers.filter((a) => !a.skipped).length,
          totalItems: 5,
          totalTimeSec: finalAnswers.reduce((acc, a) => acc + a.timeSpentSec, 0),
          overallScorePercent: 80,
          xpAwarded: 50,
          streakDays: initialStreak + 1,
          streakAdvanced: true,
          results: finalAnswers.map((a, idx) => ({
            itemId: a.itemId,
            category: a.category,
            correct: !a.skipped,
            scorePercent: a.skipped ? 0 : 100,
            userAnswer: a.answer,
            correctAnswer: a.answer,
            confidence: a.confidence,
            timeSpentSec: a.timeSpentSec,
            explanation: sprint.items[idx]?.explanation || "",
          })),
          syncedAt: new Date().toISOString(),
        };
        setResult(provisional);
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch("/api/m4/sprint/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          setResult(json.data);
        } else {
          throw new Error(json.error || "Failed to submit sprint");
        }
      } catch (err) {
        console.warn("Online submission failed, falling back to offline queue:", err);
        queueOfflineSprint(payload);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sprint, initialStreak]
  );

  // Advance to next item
  const recordItemAnswer = useCallback(
    (skipped = false) => {
      if (currentIndex >= 5) return;

      const item = sprint.items[currentIndex];
      const timeSpentSec = Math.max(
        1,
        Math.round((Date.now() - (itemStartTimestamp.current || Date.now())) / 1000)
      );

      let rawAnswer: string | number = "";
      if (skipped) {
        rawAnswer = "skipped";
      } else if (item.category === "numerical") {
        rawAnswer = Math.round(Math.pow(10, fermiExponent));
      } else {
        rawAnswer = selectedOptionId || "";
      }

      const answerRecord: SprintItemAnswer = {
        itemId: item.id,
        category: item.category,
        answer: rawAnswer,
        skipped,
        timeSpentSec,
        confidence,
      };

      const updatedAnswers = [...answers, answerRecord];
      setAnswers(updatedAnswers);

      if (currentIndex === 4) {
        // Last item finished
        setCurrentIndex(5);
        finishSprint(updatedAnswers);
      } else {
        const nextIdx = currentIndex + 1;
        const nextItem = sprint.items[nextIdx];
        if (nextItem) {
          setTimeLeft(nextItem.timeLimitSec);
          setSelectedOptionId(null);
          setConfidence("certain");
          itemStartTimestamp.current = Date.now();

          if (nextItem.category === "memory" && nextItem.memoryChallenge) {
            setMemoryPhase("flash");
            setMemorySubTimeLeft(nextItem.memoryChallenge.flashDurationSec);
            setDistractorSelected(null);
          } else if (nextItem.category === "numerical" && nextItem.fermiChallenge) {
            setFermiExponent(
              (nextItem.fermiChallenge.minExponent + nextItem.fermiChallenge.maxExponent) / 2
            );
          }
        }
        setCurrentIndex(nextIdx);
      }
    },
    [
      currentIndex,
      sprint,
      answers,
      fermiExponent,
      selectedOptionId,
      confidence,
      finishSprint,
    ]
  );

  // Main countdown timer interval
  useEffect(() => {
    if (currentIndex >= 5 || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-skip on timeout
          recordItemAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, result, recordItemAnswer]);

  // Memory challenge sub-phase timer
  useEffect(() => {
    if (
      currentIndex < 5 &&
      currentItem?.category === "memory" &&
      memoryPhase !== "recall"
    ) {
      const subTimer = setInterval(() => {
        setMemorySubTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(subTimer);
            if (memoryPhase === "flash") {
              setMemoryPhase("distractor");
              return currentItem.memoryChallenge?.distractorTask.durationSec || 3;
            } else if (memoryPhase === "distractor") {
              setMemoryPhase("recall");
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(subTimer);
    }
  }, [currentIndex, currentItem, memoryPhase]);

  // Fermi readable value formatter
  const formatFermiValue = (exp: number) => {
    const val = Math.pow(10, exp);
    if (val >= 1e12) return `${(val / 1e12).toFixed(1)} Trillion`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)} Billion`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} Million`;
    if (val >= 1e3) return `${Math.round(val / 1e3)} Thousand`;
    return Math.round(val).toLocaleString();
  };

  // ----------------------------------------------------
  // RESULT VIEW
  // ----------------------------------------------------
  if (result) {
    return (
      <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        {/* Offline Badge */}
        {isOffline && (
          <GlassCard tone="subtle" className="p-3 border border-[var(--accent)] text-xs text-[var(--accent)] font-semibold flex items-center justify-between">
            <span>⚡ Completed in Offline Mode — Saved locally</span>
            <span>Will sync automatically when reconnected</span>
          </GlassCard>
        )}

        {/* Hero Scorecard */}
        <GlassCard tone="strong" bezel className="p-8 space-y-6 border-l-4 border-l-[var(--accent)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                  Mind Sprint Complete
                </span>
                <span className="text-xs text-[var(--muted)]">• {result.date}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] tracking-tight">
                {result.correctCount === 5
                  ? "Flawless Cognitive Sprint! 🎯"
                  : result.correctCount >= 3
                  ? "Solid Mental Workout! 💪"
                  : "Sprint Completed! Keep Training 🧠"}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                5 distinct cognitive faculties exercised in under 5 minutes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Chip k="XP EARNED" v={`+${result.xpAwarded} XP`} tone="accent" />
              <Chip k="STREAK" v={`${result.streakDays} Days 🔥`} tone="good" />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border)]">
            <GlassCard tone="subtle" className="p-3.5">
              <span className="text-[11px] font-mono text-[var(--muted)]">ACCURACY</span>
              <div className="text-[20px] font-bold text-[var(--fg)] mt-0.5">
                {result.correctCount} / 5
              </div>
            </GlassCard>
            <GlassCard tone="subtle" className="p-3.5">
              <span className="text-[11px] font-mono text-[var(--muted)]">SCORE</span>
              <div className="text-[20px] font-bold text-[var(--accent)] mt-0.5">
                {result.overallScorePercent}%
              </div>
            </GlassCard>
            <GlassCard tone="subtle" className="p-3.5">
              <span className="text-[11px] font-mono text-[var(--muted)]">TIME SPENT</span>
              <div className="text-[20px] font-bold text-[var(--fg)] mt-0.5">
                {Math.floor(result.totalTimeSec / 60)}m {result.totalTimeSec % 60}s
              </div>
            </GlassCard>
            <GlassCard tone="subtle" className="p-3.5">
              <span className="text-[11px] font-mono text-[var(--muted)]">DAILY STREAK</span>
              <div className="text-[20px] font-bold text-[var(--state-good-fg)] mt-0.5">
                +{result.streakAdvanced ? "1 Day" : "Maintained"}
              </div>
            </GlassCard>
          </div>
        </GlassCard>

        {/* Detailed Item Breakdown */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-[var(--fg)]">
            Item-by-Item Cognitive Breakdown
          </h2>

          <div className="space-y-3">
            {result.results.map((res, idx) => (
              <GlassCard
                key={res.itemId}
                tone="subtle"
                bezel
                className={`p-4 border-l-4 space-y-2 ${
                  res.correct
                    ? "border-l-[var(--state-good-fg)]"
                    : "border-l-[var(--state-bad-fg)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--muted)]">
                      0{idx + 1}
                    </span>
                    <Chip
                      v={res.category.toUpperCase()}
                      tone="default"
                      className="text-[10px] uppercase font-mono"
                    />
                    <span className="text-xs font-semibold text-[var(--fg)]">
                      {res.correct ? "✓ Correct" : "✗ Missed / Skipped"}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--muted)]">
                    {res.timeSpentSec}s • {res.confidence}
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {res.explanation}
                </p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <Link
            href="/m4"
            className="text-xs font-semibold text-[var(--accent)] hover:underline font-mono"
          >
            ← Return to Module IV Hub
          </Link>

          <Button
            href="/progress"
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
          >
            View Streak &amp; Mastery Progress →
          </Button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIVE SPRINT RUNNER VIEW
  // ----------------------------------------------------
  if (!currentItem) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-[var(--muted)] font-mono">
        Preparing Mind Sprint session...
      </div>
    );
  }

  const timeLimit = currentItem.timeLimitSec;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const isUrgent = timeLeft <= 10;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
      {/* Top Header & Sprint Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/m4"
            className="text-xs font-semibold text-[var(--accent)] hover:underline font-mono"
          >
            ← Exit Sprint
          </Link>
          <span className="text-xs text-[var(--muted)]">•</span>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
            Item {currentIndex + 1} of 5
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOffline && (
            <Chip k="STATE" v="Offline" tone="bad" className="text-[10px]" />
          )}
          <Chip
            k="CATEGORY"
            v={currentItem.category.toUpperCase()}
            tone="accent"
            className="text-[11px]"
          />
        </div>
      </div>

      {syncStatus && (
        <GlassCard tone="subtle" className="p-3 text-[11px] text-[var(--muted)] font-mono">
          {syncStatus}
        </GlassCard>
      )}

      {/* Main Runner Card */}
      <GlassCard tone="default" bezel className="p-6 sm:p-8 space-y-6">
        {/* Timer Bar + Item Title */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
              0{currentIndex + 1} • {currentItem.category}
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--fg)] mt-0.5 tracking-tight">
              {currentItem.title}
            </h1>
          </div>

          {/* Countdown Ring */}
          <div className="shrink-0 flex items-center gap-2">
            <div className={`transition-transform ${isUrgent ? "scale-110 animate-pulse" : ""}`}>
              <ProgressRing
                value={progressPercent}
                size={54}
                strokeWidth={5}
                className={isUrgent ? "text-[var(--state-bad-fg)]" : ""}
              />
            </div>
            <span
              className={`font-mono text-base font-bold ${
                isUrgent ? "text-[var(--state-bad-fg)] animate-pulse" : "text-[var(--fg)]"
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-bold text-[var(--fg)] leading-relaxed">
            {currentItem.prompt}
          </p>
          {currentItem.subtext && (
            <p className="text-xs text-[var(--muted)]">
              {currentItem.subtext}
            </p>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* CATEGORY: MEMORY (3-PHASE SEQUENCE) */}
        {/* ---------------------------------------------------- */}
        {currentItem.category === "memory" && currentItem.memoryChallenge && (
          <div className="space-y-4">
            {memoryPhase === "flash" && (
              <GlassCard tone="subtle" className="p-6 border-2 border-dashed border-[var(--accent)] text-center space-y-4 animate-in fade-in">
                <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider block">
                  Phase 1: Memorize ({memorySubTimeLeft}s remaining)
                </span>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {currentItem.memoryChallenge.flashItems.map((token) => (
                    <GlassCard
                      key={token}
                      tone="default"
                      className="p-3 font-mono text-sm font-bold text-[var(--fg)] shadow-xs"
                    >
                      {token}
                    </GlassCard>
                  ))}
                </div>
              </GlassCard>
            )}

            {memoryPhase === "distractor" && (
              <GlassCard tone="subtle" className="p-6 border-2 border-[var(--state-bad-fg)] text-center space-y-4 animate-in fade-in">
                <span className="text-xs font-mono font-bold text-[var(--state-bad-fg)] uppercase tracking-wider block">
                  Phase 2: Distractor Task ({memorySubTimeLeft}s)
                </span>
                <p className="text-sm font-bold text-[var(--fg)]">
                  {currentItem.memoryChallenge.distractorTask.prompt}
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {currentItem.memoryChallenge.distractorTask.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDistractorSelected(opt.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        distractorSelected === opt.id
                          ? "bg-[var(--accent)] text-[var(--accent-fg,#ffffff)] border-[var(--accent)] shadow-xs"
                          : "bg-[var(--glass-subtle)] text-[var(--fg)] border-[var(--border)]"
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {memoryPhase === "recall" && (
              <div className="space-y-3 animate-in fade-in">
                <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider block">
                  Phase 3: Active Recall
                </span>
                <p className="text-xs font-semibold text-[var(--muted)]">
                  {currentItem.memoryChallenge.recallPrompt}
                </p>
                <div className="space-y-2">
                  {currentItem.memoryChallenge.options.map((opt, idx) => (
                    <OptionButton
                      key={opt.id}
                      prefix={String.fromCharCode(65 + idx)}
                      label={opt.text}
                      state={selectedOptionId === opt.id ? "selected" : "idle"}
                      onClick={() => setSelectedOptionId(opt.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CATEGORY: NUMERICAL (FERMI SLIDER) */}
        {/* ---------------------------------------------------- */}
        {currentItem.category === "numerical" && currentItem.fermiChallenge && (
          <GlassCard tone="subtle" className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--muted)] uppercase font-semibold">
                Order of Magnitude Slider
              </span>
              <span className="text-base font-extrabold text-[var(--accent)] font-mono">
                {formatFermiValue(fermiExponent)}
              </span>
            </div>

            <input
              type="range"
              min={currentItem.fermiChallenge.minExponent}
              max={currentItem.fermiChallenge.maxExponent}
              step={0.1}
              value={fermiExponent}
              onChange={(e) => setFermiExponent(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)] h-2 cursor-pointer bg-[var(--border)] rounded-lg"
            />

            <div className="flex justify-between text-[11px] font-mono text-[var(--muted)]">
              <span>10^{currentItem.fermiChallenge.minExponent} ({formatFermiValue(currentItem.fermiChallenge.minExponent)})</span>
              <span>10^{currentItem.fermiChallenge.maxExponent} ({formatFermiValue(currentItem.fermiChallenge.maxExponent)})</span>
            </div>
          </GlassCard>
        )}

        {/* ---------------------------------------------------- */}
        {/* CATEGORY: PATTERN / DEDUCTION / TRICKY OPTIONS */}
        {/* ---------------------------------------------------- */}
        {currentItem.options && currentItem.options.length > 0 && (
          <div className="space-y-2.5">
            {currentItem.options.map((opt, idx) => (
              <OptionButton
                key={opt.id}
                prefix={String.fromCharCode(65 + idx)}
                label={opt.text}
                state={selectedOptionId === opt.id ? "selected" : "idle"}
                onClick={() => setSelectedOptionId(opt.id)}
              />
            ))}
          </div>
        )}

        {/* Metacognitive Confidence Selector */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-[var(--muted)] font-semibold">
              Confidence:
            </span>
            <div className="flex items-center gap-1.5">
              {(["guessing", "unsure", "certain"] as ConfidenceRating[]).map((cr) => (
                <button
                  key={cr}
                  type="button"
                  onClick={() => setConfidence(cr)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    confidence === cr
                      ? "bg-[var(--accent)] text-[var(--accent-fg,#ffffff)] shadow-xs"
                      : "bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {cr === "certain" ? "100% Certain" : cr}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTAs: Skip or Next */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => recordItemAnswer(true)}
            >
              Skip Item →
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => recordItemAnswer(false)}
              disabled={
                currentItem.category === "memory" && memoryPhase !== "recall"
                  ? true
                  : currentItem.category !== "numerical" && !selectedOptionId
              }
            >
              {isSubmitting
                ? "Submitting..."
                : currentIndex === 4
                ? "Finish Sprint →"
                : "Next Item →"}
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
