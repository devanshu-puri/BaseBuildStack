"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { OptionButton } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { CodeBlock } from "@/components/ui/code-block";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { ProgressRing } from "@/components/ui/progress-ring";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { BlitzSessionCard, BlitzVerdict } from "@/lib/m1/blitz-session";
import { usePricingModal } from "@/components/payments/pricing-context";

export default function PatternBlitzPage() {
  const { openPricingModal } = usePricingModal();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<BlitzSessionCard[]>([]);
  const [dailyQuotaReached, setDailyQuotaReached] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Card interaction state
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedInvariant, setSelectedInvariant] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = pattern, 2 = invariant, 3 = verdict
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<BlitzVerdict | null>(null);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Performance & XP state
  const [roundStats, setRoundStats] = useState({
    correct: 0,
    totalXpEarned: 0,
    totalCards: 0,
  });

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadDeck() {
      try {
        const res = await fetch("/api/dsa/blitz");
        if (res.ok) {
          const data = await res.json();
          if (data.dailyQuotaReached) {
            setDailyQuotaReached(true);
          } else {
            setCards(data.cards || []);
            setSecondsRemaining(30);
          }
        }
      } catch (err) {
        console.error("Failed to load Blitz deck:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDeck();
  }, []);

  // Timer management per card
  useEffect(() => {
    if (loading || roundCompleted || step === 3 || cards.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, step, loading, roundCompleted, cards.length]);

  const currentCard = cards[currentIndex];

  const handleSelectPattern = (pattern: string) => {
    if (step !== 1) return;
    setSelectedPattern(pattern);
    setStep(2); // advance to invariant step
  };

  const handleSelectInvariant = async (invariantIdx: number) => {
    if (step !== 2 || submitting || !currentCard || !selectedPattern) return;
    setSelectedInvariant(invariantIdx);
    setSubmitting(true);

    const timeSpentMs = Math.max(1000, (30 - secondsRemaining) * 1000);

    try {
      const res = await fetch("/api/dsa/blitz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: currentCard.problem.id,
          selectedPattern,
          selectedInvariantIndex: invariantIdx,
          ms: timeSpentMs,
          confidence: secondsRemaining > 15 ? "certain" : "unsure",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerdict(data.verdict);
        setStep(3);

        setRoundStats((prev) => ({
          correct: prev.correct + (data.verdict.isCorrect ? 1 : 0),
          totalXpEarned: prev.totalXpEarned + data.verdict.xpAwarded,
          totalCards: prev.totalCards + 1,
        }));
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedPattern(null);
      setSelectedInvariant(null);
      setVerdict(null);
      setStep(1);
      setSecondsRemaining(30);
      setBookmarked(false);
    } else {
      setRoundCompleted(true);
    }
  };

  const toggleBookmark = async () => {
    if (!currentCard) return;
    try {
      setBookmarked(!bookmarked);
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm font-mono text-[var(--text-3)]">Loading Pattern Blitz...</p>
      </div>
    );
  }

  if (dailyQuotaReached) {
    return (
      <GlassCard tone="default" padding="lg" className="max-w-md mx-auto py-12 px-6 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-[20px] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent-bright)] flex items-center justify-center text-3xl font-bold shadow-[0_0_24px_rgba(94,78,240,0.35)]">
          ⚡
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-[var(--text)] tracking-tight">Daily Free Quota Reached</h1>
          <p className="font-ui text-sm text-[var(--text-2)] leading-relaxed">
            You have completed your 5 daily Pattern Blitz problems. Upgrade to BaseBuildStack Pro for unlimited daily training rounds.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <Button variant="primary" size="md" onClick={() => openPricingModal()}>
            Upgrade to Pro
          </Button>
          <Button variant="secondary" size="md" href="/home">
            Back to Home
          </Button>
        </div>
      </GlassCard>
    );
  }

  if (roundCompleted) {
    const accuracy = Math.round((roundStats.correct / Math.max(1, roundStats.totalCards)) * 100);

    return (
      <GlassCard tone="default" padding="lg" className="max-w-md mx-auto py-12 px-6 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-[20px] bg-[var(--good-bg)] text-[var(--good-fg)] flex items-center justify-center text-3xl font-bold shadow-[0_0_24px_rgba(52,211,153,0.35)]">
          🏆
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-[var(--text)] tracking-tight">Round Completed!</h1>
          <p className="font-ui text-sm text-[var(--text-2)]">
            Excellent recall training. Missed cards will return soon on your SM-2 schedule.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)] text-center">
          <div>
            <div className="text-xl font-mono font-bold text-[var(--text)]">{roundStats.correct}/{roundStats.totalCards}</div>
            <div className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wider">Solved</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-[var(--accent-bright)]">+{roundStats.totalXpEarned}</div>
            <div className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wider">XP Earned</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-[var(--text)]">{accuracy}%</div>
            <div className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wider">Accuracy</div>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button variant="primary" size="md" href="/home">
            Continue to Modules
          </Button>
          <Button variant="secondary" size="md" onClick={() => window.location.reload()}>
            Start Another Blitz
          </Button>
        </div>
      </GlassCard>
    );
  }

  if (!currentCard) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-[var(--text-2)]">No cards available in this deck.</p>
        <Link href="/home" className="text-sm text-[var(--accent-bright)] underline">Return to Home</Link>
      </div>
    );
  }

  const { problem, isRevision, patternOptions } = currentCard;
  const isTimeUrgent = secondsRemaining <= 10;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      {/* Header bar: Progress, Timer Ring, Bookmark */}
      <GlassCard tone="default" padding="sm" className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[var(--accent-bright)] tracking-wider">
            BLITZ {currentIndex + 1}/{cards.length}
          </span>
          {isRevision && (
            <Chip v="Revision" tone="accent" />
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ProgressRing
              value={(secondsRemaining / 30) * 100}
              size={36}
              strokeWidth={3}
              showText={false}
            />
            <span
              className={`font-mono text-xs font-bold w-6 text-right tabular-nums ${
                isTimeUrgent ? "text-[#FF6B6B] animate-pulse" : "text-[var(--text)]"
              }`}
            >
              {secondsRemaining}s
            </span>
          </div>

          <button
            onClick={toggleBookmark}
            aria-label="Bookmark problem"
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              bookmarked
                ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border-[var(--accent)] text-[var(--accent-bright)] shadow-[0_0_10px_rgba(94,78,240,0.5)]"
                : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] bg-[var(--glass)]"
            }`}
          >
            ★
          </button>
        </div>
      </GlassCard>

      {/* Problem Card */}
      <GlassCard tone="default" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-[var(--text)]">
            {problem.title}
          </h1>
          <div className="flex items-center gap-2">
            <Chip v={problem.category} tone="default" />
            <Chip
              v={problem.difficulty}
              tone={
                problem.difficulty === "easy"
                  ? "good"
                  : problem.difficulty === "medium"
                  ? "accent"
                  : "bad"
              }
            />
          </div>
        </div>

        <p className="font-ui text-sm text-[var(--text-2)] leading-relaxed">
          {problem.prompt}
        </p>

        {problem.constraints && problem.constraints.length > 0 && (
          <div className="p-3.5 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)] space-y-1">
            <div className="text-[11px] font-mono text-[var(--text-3)] uppercase font-semibold">
              Constraints
            </div>
            <ul className="text-xs font-mono text-[var(--text-2)] space-y-0.5 list-disc list-inside">
              {problem.constraints.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {/* STEP 1: Select Governing Pattern */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider font-mono">
            Step 1: Governing Pattern
          </h2>
          {step > 1 && (
            <span className="text-xs text-[var(--state-done)] font-mono font-semibold">
              ✓ Pattern selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {patternOptions.map((opt: string) => {
            const isSelected = selectedPattern === opt;
            const isCorrectPattern =
              verdict && opt.toLowerCase() === problem.pattern.toLowerCase();
            const isWrongSelected =
              verdict && isSelected && !verdict.patternCorrect;

            let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
            if (verdict) {
              if (isCorrectPattern) state = "correct";
              else if (isWrongSelected) state = "incorrect";
            } else if (isSelected) {
              state = "selected";
            }

            return (
              <OptionButton
                key={opt}
                label={opt}
                state={state}
                onClick={() => handleSelectPattern(opt)}
                disabled={step !== 1}
              />
            );
          })}
        </div>
      </div>

      {/* STEP 2: Missing Invariant Selection */}
      {step >= 2 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider font-mono">
              Step 2: Missing Invariant
            </h2>
            {step === 3 && (
              <span className="text-xs text-[var(--state-done)] font-mono font-semibold">
                ✓ Invariant checked
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--text-2)] font-mono">
            {problem.invariantPrompt}
          </p>

          <div className="space-y-2">
            {problem.invariantOptions.map((invOpt: string, idx: number) => {
              const isSelected = selectedInvariant === idx;
              const isCorrectInvariant =
                verdict && idx === problem.correctInvariantIndex;
              const isWrongSelected =
                verdict && isSelected && !verdict.invariantCorrect;

              let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
              if (verdict) {
                if (isCorrectInvariant) state = "correct";
                else if (isWrongSelected) state = "incorrect";
              } else if (isSelected) {
                state = "selected";
              }

              return (
                <OptionButton
                  key={idx}
                  label={invOpt}
                  prefix={String.fromCharCode(65 + idx)}
                  state={state}
                  onClick={() => handleSelectInvariant(idx)}
                  disabled={step !== 2 || submitting}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: Verdict, 5-part Feedback, Pseudocode & Complexity */}
      {step === 3 && verdict && (
        <div className="space-y-6 pt-4">
          <FeedbackCard
            verdict={verdict.isCorrect ? "correct" : "incorrect"}
            why={verdict.explanation.whyPattern}
            distractors={[verdict.explanation.distractorTakedown]}
            takeaway={verdict.explanation.takeaway}
          />

          {/* 6-line Pseudocode & Complexities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--text)] uppercase">
                Canonical Pseudocode
              </span>
              <div className="flex items-center gap-2">
                <Chip k="Time" v={verdict.timeComplexity} tone="default" />
                <Chip k="Space" v={verdict.spaceComplexity} tone="default" />
              </div>
            </div>

            <CodeBlock
              code={verdict.pseudocode}
              lang="python"
            />
          </div>

          {/* XP & Next review timing */}
          <GlassCard tone="default" padding="md" className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-2)]">
              Next SRS review: {new Date(verdict.nextDue).toLocaleDateString()}
            </span>
            {verdict.xpAwarded > 0 && (
              <span className="text-[var(--state-done)] font-bold">
                +{verdict.xpAwarded} XP (+{verdict.speedBonus} speed bonus)
              </span>
            )}
          </GlassCard>
        </div>
      )}

      {/* Bottom Action Button */}
      {step === 3 && (
        <BottomCTA
          label={currentIndex + 1 < cards.length ? "Next Problem →" : "Finish Blitz"}
          onClick={handleNextCard}
          floatingAboveDock={false}
        />
      )}
    </div>
  );
}
