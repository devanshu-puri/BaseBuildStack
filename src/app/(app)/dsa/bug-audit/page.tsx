"use client";

import React, { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CodeBlock } from "@/components/ui/code-block";
import { OptionButton } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { StatBlock } from "@/components/ui/stat-block";
import { BugAuditSessionCard, BugAuditVerdict } from "@/lib/m1/bug-audit-session";
import { usePricingModal } from "@/components/payments/pricing-context";

export default function BugAuditPage() {
  const { openPricingModal } = usePricingModal();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<BugAuditSessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailyQuotaReached, setDailyQuotaReached] = useState(false);

  // 1: Pick buggy line, 2: Pick breaking input, 3: Verdict revealed
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selections
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedInputIdx, setSelectedInputIdx] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<BugAuditVerdict | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Round summary
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundStats, setRoundStats] = useState({
    correct: 0,
    totalXpEarned: 0,
    totalCards: 0,
  });

  // 60-second timer per problem
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadDeck() {
      try {
        const res = await fetch("/api/dsa/bug-audit");
        if (res.ok) {
          const data = await res.json();
          if (data.dailyQuotaReached) {
            setDailyQuotaReached(true);
          } else {
            setCards(data.cards || []);
            setSecondsRemaining(60);
          }
        }
      } catch (err) {
        console.error("Failed to load Bug Audit deck:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDeck();
  }, []);

  // Timer countdown management
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

  const handleSelectLine = (lineNum: number) => {
    if (step !== 1) return;
    setSelectedLine(lineNum);
  };

  const handleConfirmLine = () => {
    if (step === 1 && selectedLine !== null) {
      setStep(2);
    }
  };

  const handleSelectBreakingInput = async (inputIdx: number) => {
    if (step !== 2 || submitting || !currentCard || selectedLine === null) return;
    setSelectedInputIdx(inputIdx);
    setSubmitting(true);

    const timeSpentMs = Math.max(1000, (60 - secondsRemaining) * 1000);

    try {
      const res = await fetch("/api/dsa/bug-audit/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: currentCard.problem.id,
          selectedLineNumber: selectedLine,
          selectedBreakingInputIndex: inputIdx,
          ms: timeSpentMs,
          confidence: secondsRemaining > 30 ? "certain" : "unsure",
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
      setSelectedLine(null);
      setSelectedInputIdx(null);
      setVerdict(null);
      setStep(1);
      setSecondsRemaining(60);
      setBookmarked(false);
    } else {
      setRoundCompleted(true);
    }
  };

  const toggleBookmark = async () => {
    if (!currentCard) return;
    setBookmarked(!bookmarked);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm font-mono text-[var(--muted)]">Loading Bug Audit...</p>
      </div>
    );
  }

  if (dailyQuotaReached) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <GlassCard tone="strong" bezel className="p-8 space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(94,78,240,0.35)]">
            🐛
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Daily Free Quota Reached</h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              You have completed your daily free DSA drills. Upgrade to BaseBuildStack Pro for unlimited Bug Audits and instant sandbox test runs.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Button onClick={() => openPricingModal()} variant="primary" size="lg" className="w-full">
              Upgrade to Pro (₹9/mo)
            </Button>
            <Button href="/home" variant="secondary" size="md" className="w-full">
              Back to Home
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (roundCompleted) {
    const accuracy = Math.round((roundStats.correct / Math.max(1, roundStats.totalCards)) * 100);

    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <GlassCard tone="strong" bezel className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(94,78,240,0.35)]">
            🎯
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Bug Audit Complete!</h1>
            <p className="text-sm text-[var(--muted)]">
              You audited {roundStats.totalCards} code snippets across real interview defect templates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--glass-subtle)] border border-[var(--border)]">
            <StatBlock
              value={`${accuracy}%`}
              caption="ACCURACY"
              size="md"
            />
            <StatBlock
              value={`+${roundStats.totalXpEarned}`}
              caption="XP EARNED"
              size="md"
              aurora
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setRoundCompleted(false);
                setCurrentIndex(0);
                setStep(1);
                setSelectedLine(null);
                setSelectedInputIdx(null);
                setVerdict(null);
                setSecondsRemaining(60);
                setRoundStats({ correct: 0, totalXpEarned: 0, totalCards: 0 });
              }}
            >
              Play Another Round
            </Button>
            <Button href="/home" variant="secondary" size="md" className="w-full">
              Back to Home
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="text-center py-12 text-[var(--muted)]">
        No Bug Audit problems available.
      </div>
    );
  }

  const { problem, isRevision } = currentCard;

  // Determine line highlights for CodeBlock
  const highlightLines: number[] = [];
  if (step === 3 && verdict) {
    highlightLines.push(verdict.correctLineNumber);
    if (selectedLine !== null && selectedLine !== verdict.correctLineNumber) {
      highlightLines.push(selectedLine);
    }
  } else if (selectedLine !== null) {
    highlightLines.push(selectedLine);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28">
      {/* Header bar: Progress, Timer Ring, Bookmark */}
      <GlassCard tone="subtle" bezel className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wider">
            BUG AUDIT {currentIndex + 1}/{cards.length}
          </span>
          {isRevision && (
            <Chip k="TYPE" v="Revision" tone="accent" />
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ProgressRing
              value={(secondsRemaining / 60) * 100}
              size={36}
              strokeWidth={3}
            />
            <span className="font-mono text-xs font-semibold text-[var(--fg)] w-6">
              {secondsRemaining}s
            </span>
          </div>

          <button
            onClick={toggleBookmark}
            aria-label="Bookmark problem"
            className={`p-2 rounded-lg border transition-colors ${
              bookmarked
                ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            ★
          </button>
        </div>
      </GlassCard>

      {/* Problem Title & Category Header */}
      <GlassCard tone="default" bezel className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--fg)]">
            {problem.title}
          </h1>
          <div className="flex items-center gap-2">
            <Chip k="CATEGORY" v={problem.category} tone="default" />
            <Chip
              k="DIFFICULTY"
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

        <div className="text-xs font-mono text-[var(--muted)] flex items-center gap-2">
          <span className="text-[var(--accent)]">●</span>
          {step === 1 && "Stage A: Tap the line containing the defect"}
          {step === 2 && "Stage B: Pick the breaking input that exposes this bug"}
          {step === 3 && "Stage C: Audit verdict & canonical resolution"}
        </div>
      </GlassCard>

      {/* STAGE A: CodeBlock with Line Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
            {step === 1 ? "1. Select Buggy Line" : "Inspected Snippet"}
          </h2>
          {selectedLine !== null && step === 1 && (
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">
              Selected: Line {selectedLine}
            </span>
          )}
          {step > 1 && (
            <span className="text-xs font-mono text-[var(--state-good-fg)] font-semibold">
              ✓ Line {selectedLine} picked
            </span>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
          <CodeBlock
            code={problem.code}
            lang={problem.language}
            selectableLines={step === 1}
            selectedLine={selectedLine ?? undefined}
            highlightLines={highlightLines}
            onSelectLine={handleSelectLine}
          />
        </div>

        {step === 1 && (
          <div className="flex justify-end pt-1">
            <Button
              variant="primary"
              size="sm"
              disabled={selectedLine === null}
              onClick={handleConfirmLine}
            >
              Confirm Line {selectedLine ?? ""} → Next Stage
            </Button>
          </div>
        )}
      </div>

      {/* STAGE B: Breaking Input Selection */}
      {step >= 2 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
              2. Breaking Test Input
            </h2>
            {step === 3 && (
              <span className="text-xs text-[var(--state-good-fg)] font-mono font-semibold">
                ✓ Test evaluated
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--muted)] font-mono">
            {problem.breakingInputPrompt}
          </p>

          <div className="space-y-2">
            {problem.breakingInputOptions.map((opt: string, idx: number) => {
              const isSelected = selectedInputIdx === idx;
              const isCorrectInput =
                verdict && idx === problem.correctBreakingInputIndex;
              const isWrongSelected =
                verdict && isSelected && !verdict.inputCorrect;

              let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
              if (verdict) {
                if (isCorrectInput) state = "correct";
                else if (isWrongSelected) state = "incorrect";
              } else if (isSelected) {
                state = "selected";
              }

              return (
                <OptionButton
                  key={idx}
                  label={opt}
                  prefix={String.fromCharCode(65 + idx)}
                  state={state}
                  onClick={() => handleSelectBreakingInput(idx)}
                  disabled={step !== 2 || submitting}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE C: Verdict & Canonical Fix */}
      {step === 3 && verdict && (
        <div className="space-y-6 pt-4">
          <FeedbackCard
            verdict={verdict.isCorrect ? "correct" : "incorrect"}
            why={verdict.explanation.why}
            distractors={[verdict.explanation.distractorTakedown]}
            takeaway={verdict.explanation.takeaway}
          />

          {/* Line & Input Accuracy Pill Breakdown */}
          <GlassCard tone="subtle" bezel className="p-4 grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Line Detection:</span>
              <span className={`font-bold ${verdict.lineCorrect ? "text-[var(--state-good-fg)]" : "text-[var(--state-bad-fg)]"}`}>
                {verdict.lineCorrect ? `✓ Line ${verdict.correctLineNumber}` : `✗ Line ${selectedLine} (was ${verdict.correctLineNumber})`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Breaking Input:</span>
              <span className={`font-bold ${verdict.inputCorrect ? "text-[var(--state-good-fg)]" : "text-[var(--state-bad-fg)]"}`}>
                {verdict.inputCorrect ? "✓ Correct" : "✗ Incorrect"}
              </span>
            </div>
          </GlassCard>

          {/* Canonical Fix View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--fg)] uppercase tracking-wider">
                Canonical Fix
              </span>
              <Chip k="DEFECT" v={problem.bugType} tone="accent" />
            </div>

            <GlassCard tone="subtle" className="p-3.5 font-mono text-xs text-[var(--accent)] border border-[var(--border)]">
              {verdict.canonicalFix}
            </GlassCard>

            <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
              <CodeBlock
                code={verdict.canonicalCode}
                lang={problem.language}
              />
            </div>
          </div>

          {/* XP & Next Review Timing */}
          <GlassCard tone="subtle" className="flex items-center justify-between p-4 text-xs font-mono">
            <span className="text-[var(--muted)]">
              Next SRS review: {new Date(verdict.nextDue).toLocaleDateString()}
            </span>
            {verdict.xpAwarded > 0 && (
              <span className="text-[var(--accent)] font-bold">
                +{verdict.xpAwarded} XP (+{verdict.speedBonus} speed bonus)
              </span>
            )}
          </GlassCard>
        </div>
      )}

      {/* Sticky Bottom Action */}
      {step === 3 && (
        <BottomCTA
          label={currentIndex + 1 < cards.length ? "Next Problem →" : "Finish Round →"}
          onClick={handleNextCard}
        />
      )}
    </div>
  );
}
