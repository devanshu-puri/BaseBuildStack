"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { OptionButton, OptionState } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ClientQuizQuestion, QuizEvaluationResult } from "@/content/m2/quiz-schema";

type ConfidenceLevel = "guessing" | "unsure" | "certain";

interface RoundSummaryItem {
  questionId: string;
  skill: string;
  type: string;
  correct: boolean;
  xpEarned: number;
}

export interface QuizRunnerClientProps {
  initialMode: string;
}

export function QuizRunnerClient({ initialMode }: QuizRunnerClientProps) {
  const router = useRouter();
  const mode = initialMode || "quick";

  const [questions, setQuestions] = useState<ClientQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Answering state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerChanges, setAnswerChanges] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceLevel>("certain");
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<QuizEvaluationResult | null>(null);

  // Round summary state
  const [isCompleted, setIsCompleted] = useState(false);
  const [summaryResults, setSummaryResults] = useState<RoundSummaryItem[]>([]);

  // Timing tracking
  const questionStartTimeRef = useRef<number>(0);

  // Load questions for the chosen mode
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quiz/session?mode=${mode}`);
        if (!res.ok) {
          throw new Error("Failed to load quiz session");
        }
        const data = await res.json();
        if (!data.questions || data.questions.length === 0) {
          throw new Error("No questions available for this mode");
        }
        setQuestions(data.questions);
        questionStartTimeRef.current = Date.now();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading quiz");
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [mode]);

  // Handle option selection
  const handleSelectOption = (optionId: string) => {
    if (evaluation) return; // Answer already submitted

    if (selectedOptionId !== null && selectedOptionId !== optionId) {
      setAnswerChanges((prev) => prev + 1);
    }
    setSelectedOptionId(optionId);
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!selectedOptionId || submitting || evaluation) return;

    setSubmitting(true);
    const now = Date.now();
    const elapsedMs = Math.max(1000, now - questionStartTimeRef.current);
    const currentQ = questions[currentIndex];

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedOptionId,
          ms: elapsedMs,
          answerChanges,
          confidence,
        }),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      const result: QuizEvaluationResult = await res.json();
      setEvaluation(result);

      // Record in round summary
      setSummaryResults((prev) => [
        ...prev,
        {
          questionId: currentQ.id,
          skill: currentQ.skill,
          type: currentQ.type,
          correct: result.correct,
          xpEarned: result.xpEarned,
        },
      ]);
    } catch (err) {
      console.error("Quiz submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Next question or finish round
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setAnswerChanges(0);
      setConfidence("certain");
      setEvaluation(null);
      questionStartTimeRef.current = Date.now();
    } else {
      setIsCompleted(true);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[var(--muted)]">
            Preparing your personalized {mode} drill...
          </p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || questions.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <GlassCard tone="strong" bezel className="max-w-md w-full text-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-full bg-[var(--state-bad-bg)] text-[var(--state-bad-fg)] font-bold text-xl flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-lg font-bold text-[var(--fg)]">Quiz Session Unavailable</h2>
          <p className="text-sm text-[var(--muted)]">
            {error || "Could not retrieve questions for this mode."}
          </p>
          <div className="pt-2">
            <Button href="/quiz" variant="primary" size="md">
              ← Back to Quiz Modes
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 3. Completed Round Summary View
  if (isCompleted) {
    const totalCorrect = summaryResults.filter((r) => r.correct).length;
    const totalXP = summaryResults.reduce((sum, r) => sum + r.xpEarned, 0);
    const accuracyPct = Math.round((totalCorrect / summaryResults.length) * 100);

    // Group accuracy by skill
    const skillStats: Record<string, { total: number; correct: number }> = {};
    for (const r of summaryResults) {
      if (!skillStats[r.skill]) skillStats[r.skill] = { total: 0, correct: 0 };
      skillStats[r.skill].total++;
      if (r.correct) skillStats[r.skill].correct++;
    }

    return (
      <div className="py-8 px-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            Session Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] tracking-tight">
            Round Summary
          </h1>
        </div>

        <GlassCard tone="strong" bezel className="text-center space-y-6 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center pt-2">
            <ProgressRing
              value={accuracyPct}
              size={120}
              strokeWidth={10}
              label={`${accuracyPct}%`}
            />
            <div className="mt-4 text-xl font-bold text-[var(--fg)]">
              {totalCorrect} of {summaryResults.length} Correct
            </div>
            <div className="text-sm text-[var(--muted)]">
              Earned <span className="font-bold text-[var(--accent)]">+{totalXP} XP</span>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="pt-4 border-t border-[var(--border)] space-y-3 text-left">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Accuracy by Verified Skill
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(skillStats).map(([skill, stats]) => (
                <GlassCard
                  key={skill}
                  tone="subtle"
                  className="flex items-center justify-between p-3 text-xs"
                >
                  <span className="font-semibold text-[var(--fg)]">{skill}</span>
                  <span
                    className={`font-mono font-bold ${
                      stats.correct === stats.total
                        ? "text-[var(--state-good-fg)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {stats.correct}/{stats.total} (
                    {Math.round((stats.correct / stats.total) * 100)}%)
                  </span>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Action Navigation */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/quiz")}
            >
              Choose Another Mode
            </Button>
            <Button
              href="/progress"
              variant="primary"
              size="md"
            >
              View Skill Heatmap →
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 4. Active Question View
  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  // Question Type Chips Config
  const typeLabels = {
    mcq: { text: "Conceptual MCQ", tone: "accent" as const },
    output: { text: "Code Output Prediction", tone: "default" as const },
    debug: { text: "Spot the Bug", tone: "bad" as const },
    approach: { text: "Architecture Strategy", tone: "accent" as const },
  }[currentQ.type];

  const difficultyStars = "★".repeat(currentQ.difficulty) + "☆".repeat(3 - currentQ.difficulty);

  // Option states resolver
  const getOptionState = (optId: string): OptionState => {
    if (!evaluation) {
      return selectedOptionId === optId ? "selected" : "idle";
    }

    if (optId === evaluation.correctId) {
      return "correct";
    }
    if (selectedOptionId === optId && !evaluation.correct) {
      return "incorrect";
    }
    return "disabled";
  };

  const hasCode = Boolean(currentQ.code && currentQ.code.trim().length > 0);

  return (
    <div className="pb-24 sm:pb-12 pt-2 px-2 sm:px-4 max-w-6xl mx-auto space-y-6">
      {/* Top Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
          <Link
            href="/quiz"
            className="hover:text-[var(--fg)] transition-colors flex items-center gap-1 font-semibold"
          >
            ← Exit {mode}
          </Link>
          <div className="flex items-center gap-2">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[var(--accent)] font-semibold">({progressPct}%)</span>
          </div>
        </div>

        {/* Aurora Progress Bar */}
        <ProgressBar value={progressPct} />
      </div>

      {/* Question Metadata Bar */}
      <GlassCard tone="subtle" bezel className="p-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Chip k="SKILL" v={currentQ.skill} tone="accent" />
          <Chip k="TYPE" v={typeLabels.text} tone={typeLabels.tone} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
          <span>Difficulty:</span>
          <span className="text-[var(--accent)] tracking-widest">{difficultyStars}</span>
        </div>
      </GlassCard>

      {/* Main Content: Split layout on desktop when code exists, stacked otherwise */}
      <div className={`grid gap-6 ${hasCode ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-3xl mx-auto"}`}>
        {/* Left Column: Stem & Code (lg:col-span-6 or full) */}
        <div className={`space-y-4 ${hasCode ? "lg:col-span-6" : ""}`}>
          <GlassCard tone="default" bezel className="p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[var(--fg)] leading-relaxed">
              {currentQ.stem}
            </h2>
          </GlassCard>

          {hasCode && currentQ.code && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] px-1 font-semibold">
                Snippet ({currentQ.codeLanguage})
              </div>
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                <CodeBlock
                  code={currentQ.code}
                  lang={currentQ.codeLanguage}
                  className="max-h-[380px] sm:max-h-[460px] overflow-y-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Options, Confidence & 5-Part Feedback (lg:col-span-6 or full) */}
        <div className={`space-y-5 ${hasCode ? "lg:col-span-6" : ""}`}>
          {/* Options List */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] px-1 flex items-center justify-between font-semibold">
              <span>Options</span>
              {answerChanges > 0 && !evaluation && (
                <span className="text-[var(--muted)] text-[10px]">
                  Changed {answerChanges} {answerChanges === 1 ? "time" : "times"}
                </span>
              )}
            </div>

            {currentQ.options.map((opt, idx) => {
              const prefix = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
              return (
                <OptionButton
                  key={opt.id}
                  prefix={prefix}
                  label={opt.text}
                  state={getOptionState(opt.id)}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={Boolean(evaluation) || submitting}
                />
              );
            })}
          </div>

          {/* Confidence Selector (shown before submitting) */}
          {!evaluation && (
            <GlassCard tone="subtle" className="p-3.5 space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold block">
                Confidence Level
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "guessing", label: "🤔 Guessing" },
                    { id: "unsure", label: "⚡ Unsure" },
                    { id: "certain", label: "🎯 Certain" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConfidence(c.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      confidence === c.id
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--fg)] shadow-[0_0_12px_rgba(94,78,240,0.25)]"
                        : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* 5-Part Feedback Card (Revealed upon submission) */}
          {evaluation && (
            <FeedbackCard
              verdict={evaluation.correct ? "correct" : "incorrect"}
              why={evaluation.explanation.why}
              distractors={
                evaluation.explanation.distractorTakedown
                  ? [evaluation.explanation.distractorTakedown]
                  : Object.values(evaluation.explanation.allDistractors).slice(0, 2)
              }
              takeaway={evaluation.explanation.takeaway}
              evidence={evaluation.explanation.repoEvidence}
            />
          )}

          {/* Action CTAs Desktop */}
          <div className="hidden sm:block pt-2">
            {!evaluation ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={!selectedOptionId || submitting}
              >
                {submitting ? "Evaluating Answer..." : "Submit Answer"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleNext}
              >
                {currentIndex + 1 < questions.length ? "Next Question →" : "Finish Round →"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="sm:hidden">
        {!evaluation ? (
          <BottomCTA
            label={submitting ? "Evaluating..." : "Submit Answer"}
            disabled={!selectedOptionId || submitting}
            loading={submitting}
            onClick={handleSubmit}
          />
        ) : (
          <BottomCTA
            label={currentIndex + 1 < questions.length ? "Next Question →" : "Finish Round →"}
            onClick={handleNext}
          />
        )}
      </div>
    </div>
  );
}
