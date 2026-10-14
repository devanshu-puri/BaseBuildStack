"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { OptionButton, OptionState } from "@/components/ui/option-button";
import { StepperTimeline, StepItem } from "@/components/ui/stepper-timeline";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { Lesson, LessonStep, LessonCompletionResult } from "@/content/m3/lesson-schema";

export interface LessonPlayerProps {
  lesson: Lesson;
}

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  // Current stage index: 0 = Why, 1 = Mental model, 2 = See it, 3 = Try it, 4 = Recall
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [visitedMaxIdx, setVisitedMaxIdx] = useState(0);

  // Try it state
  const [tryItSelectedId, setTryItSelectedId] = useState<string | null>(null);

  // Recall state
  const [recallSelectedId, setRecallSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<LessonCompletionResult | null>(null);

  // Bookmarking
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Timing
  const lessonStartTimeRef = useRef<number>(0);
  useEffect(() => {
    lessonStartTimeRef.current = Date.now();
  }, []);

  const currentStep: LessonStep = lesson.steps[currentStageIdx];
  const isFinalStage = currentStageIdx === 4;

  // Advance to next stage
  const handleContinue = () => {
    if (currentStageIdx < 4) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      if (nextIdx > visitedMaxIdx) {
        setVisitedMaxIdx(nextIdx);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Click on a stage in stepper
  const handleSelectStage = (stepId: string) => {
    const idx = parseInt(stepId.replace("stage-", ""), 10);
    if (!isNaN(idx) && idx <= visitedMaxIdx) {
      setCurrentStageIdx(idx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Submit recall answer and complete lesson
  const handleCompleteLesson = async () => {
    if (!recallSelectedId || submitting || completionResult) return;

    setSubmitting(true);
    const durationMs = Math.max(1000, Date.now() - lessonStartTimeRef.current);

    try {
      const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          recallAnswerId: recallSelectedId,
          tryItAnswerId: tryItSelectedId ?? undefined,
          durationMs,
          bookmarked: isBookmarked,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete lesson");
      }

      const result: LessonCompletionResult = await res.json();
      setCompletionResult(result);
    } catch (err) {
      console.error("Lesson completion error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Build stepper items
  const stepperItems: StepItem[] = lesson.steps.map((step, idx) => ({
    id: `stage-${idx}`,
    title: `${step.stageNumber}. ${step.title}`,
    description: `${step.durationMinutes} min`,
    status:
      idx < currentStageIdx
        ? "done"
        : idx === currentStageIdx
        ? "active"
        : "todo",
  }));

  // Option state resolver for Try-it exercise
  const getTryItOptionState = (optId: string): OptionState => {
    if (!tryItSelectedId) return "idle";
    const correctId = currentStep.interactiveExercise?.correctOptionId;
    if (optId === correctId) return "correct";
    if (optId === tryItSelectedId) return "incorrect";
    return "disabled";
  };

  // Option state resolver for Recall exercise
  const getRecallOptionState = (optId: string): OptionState => {
    if (!completionResult) {
      return recallSelectedId === optId ? "selected" : "idle";
    }
    const correctId = currentStep.interactiveExercise?.correctOptionId;
    if (optId === correctId) return "correct";
    if (optId === recallSelectedId && !completionResult.recallPassed) return "incorrect";
    return "disabled";
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-12">
      {/* Top Header & 5-Segment Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
          <Link
            href="/m3"
            className="hover:text-[var(--fg)] transition-colors flex items-center gap-1 font-semibold"
          >
            ← Back to Lessons
          </Link>
          <div className="flex items-center gap-2">
            <span>
              Stage {currentStageIdx + 1} of 5:{" "}
              <strong className="text-[var(--fg)] capitalize">
                {currentStep.stage.replace("_", " ")}
              </strong>
            </span>
            <span className="text-[var(--accent)] font-semibold">
              (~15 min total)
            </span>
          </div>
        </div>

        {/* 5-Segment Aurora Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 h-2">
          {lesson.steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-full rounded-full transition-all duration-300 ${
                idx < currentStageIdx
                  ? "bg-[var(--state-good-fg)]"
                  : idx === currentStageIdx
                  ? "bg-[var(--accent)] shadow-[0_0_8px_rgba(94,78,240,0.6)]"
                  : "bg-[var(--glass-subtle)] border border-[var(--border)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Desktop lg: 3 cols): Stepper Timeline */}
        <div className="hidden lg:block lg:col-span-3 space-y-4 sticky top-6">
          <GlassCard tone="subtle" bezel className="p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Lesson Stages
            </div>
            <StepperTimeline
              steps={stepperItems}
              onSelect={handleSelectStage}
            />
          </GlassCard>

          {/* Bookmark for Revision */}
          <button
            type="button"
            onClick={() => setIsBookmarked((prev) => !prev)}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isBookmarked
                ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--fg)]"
                : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            <span>{isBookmarked ? "★ Bookmarked for Revision" : "☆ Save for Revision"}</span>
          </button>
        </div>

        {/* Center Column (Desktop lg: 6 cols or 9 cols without xl cards): Stage Content */}
        <div className="lg:col-span-9 xl:col-span-6 space-y-6">
          {/* Stage Header Card */}
          <GlassCard tone="default" bezel className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Chip
                  k="STAGE"
                  v={`0${currentStageIdx + 1}`}
                  tone="accent"
                />
                <Chip
                  k="TIME"
                  v={`${currentStep.durationMinutes} min`}
                  tone="default"
                />
              </div>
              <span className="text-xs font-mono text-[var(--muted)] capitalize font-semibold">
                {currentStep.stage.replace("_", " ")}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
                {currentStep.title}
              </h1>
              <p className="text-xs font-mono text-[var(--muted)] mt-1">
                Outcome: {lesson.outcome}
              </p>
            </div>

            {/* Primary Instructional Text */}
            <div className="text-sm sm:text-base text-[var(--fg)]/90 leading-relaxed whitespace-pre-line pt-3 border-t border-[var(--border)]">
              {currentStep.content}
            </div>
          </GlassCard>

          {/* Interactive Step Diagram (Stage 2: Mental Model) */}
          {currentStep.diagramNodes && currentStep.diagramNodes.length > 0 && (
            <GlassCard tone="subtle" bezel className="p-6 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                Interactive Architecture Diagram
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentStep.diagramNodes.map((node) => (
                  <GlassCard
                    key={node.id}
                    tone="default"
                    className="p-4 space-y-1 hover:border-[var(--accent)] transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--fg)]">
                        {node.label}
                      </span>
                      {node.subtext && (
                        <span className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                          {node.subtext}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-snug">
                      {node.description}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Code Walkthrough (Stage 3: See It) */}
          {currentStep.codeSnippet && (
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] px-1 font-semibold">
                Verified Code Implementation
              </div>
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                <CodeBlock
                  code={currentStep.codeSnippet}
                  lang={currentStep.codeLanguage}
                  className="max-h-[460px] overflow-y-auto"
                />
              </div>
            </div>
          )}

          {/* Interactive Simulation / Try It (Stage 4) */}
          {currentStep.stage === "try_it" && currentStep.interactiveExercise && (
            <GlassCard tone="default" bezel className="p-6 space-y-4 border-l-4 border-l-[var(--accent)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
                  Interactive Challenge
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  Pick an answer to inspect trade-off
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[var(--fg)]">
                {currentStep.interactiveExercise.prompt}
              </h3>

              <div className="space-y-2">
                {currentStep.interactiveExercise.options.map((opt, idx) => (
                  <OptionButton
                    key={opt.id}
                    prefix={String.fromCharCode(65 + idx)}
                    label={opt.text}
                    state={getTryItOptionState(opt.id)}
                    onClick={() => setTryItSelectedId(opt.id)}
                  />
                ))}
              </div>

              {tryItSelectedId && (
                <GlassCard tone="subtle" className="p-4 text-xs text-[var(--fg)]/90 leading-relaxed border border-[var(--border)] mt-2">
                  <span className="font-bold text-[var(--fg)] block mb-1">
                    Explanation:
                  </span>
                  {currentStep.interactiveExercise.explanation}
                </GlassCard>
              )}
            </GlassCard>
          )}

          {/* Active Recall Question (Stage 5) */}
          {currentStep.stage === "recall" && currentStep.interactiveExercise && (
            <GlassCard tone="default" bezel className="p-6 space-y-4 border-l-4 border-l-[var(--accent)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
                  Active Recall Assessment
                </span>
                <Chip k="REWARD" v={`+${lesson.xpAward} XP`} tone="accent" />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[var(--fg)]">
                {currentStep.interactiveExercise.prompt}
              </h3>

              <div className="space-y-2">
                {currentStep.interactiveExercise.options.map((opt, idx) => (
                  <OptionButton
                    key={opt.id}
                    prefix={String.fromCharCode(65 + idx)}
                    label={opt.text}
                    state={getRecallOptionState(opt.id)}
                    onClick={() => setRecallSelectedId(opt.id)}
                    disabled={Boolean(completionResult) || submitting}
                  />
                ))}
              </div>

              {/* Completion Result Card */}
              {completionResult && (
                <div
                  className={`p-4 rounded-2xl border ${
                    completionResult.recallPassed
                      ? "bg-[var(--state-good-bg)] border-[var(--state-good-fg)] text-[var(--state-good-fg)]"
                      : "bg-[var(--state-bad-bg)] border-[var(--state-bad-fg)] text-[var(--state-bad-fg)]"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>
                      {completionResult.recallPassed
                        ? "✓ Recall Passed — Lesson Completed!"
                        : "✗ Recall Missed"}
                    </span>
                    {completionResult.recallPassed && (
                      <Chip k="XP" v={`+${completionResult.xpAwarded}`} tone="good" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--fg)] leading-relaxed">
                    {completionResult.feedback}
                  </p>
                  <div className="pt-2">
                    <Button href="/m3" variant="primary" size="sm">
                      Browse More Lessons →
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Key Takeaway Box */}
          {currentStep.keyTakeaway && (
            <GlassCard tone="subtle" className="p-4 flex items-start gap-3">
              <span className="text-base">💡</span>
              <div className="text-xs text-[var(--muted)] leading-relaxed">
                <span className="font-bold text-[var(--fg)] block mb-0.5">
                  Core Takeaway:
                </span>
                {currentStep.keyTakeaway}
              </div>
            </GlassCard>
          )}

          {/* Desktop Continue / Complete Action Button */}
          <div className="hidden sm:block pt-3">
            {!isFinalStage ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleContinue}
              >
                Continue to Stage 0{currentStageIdx + 2} →
              </Button>
            ) : (
              !completionResult && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCompleteLesson}
                  disabled={!recallSelectedId || submitting}
                >
                  {submitting ? "Checking Recall..." : `Complete Lesson & Claim +${lesson.xpAward} XP`}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Right Column (Desktop xl: 3 cols): Reference Cards (§3 spec: Where used / Confused with / Remember) */}
        <div className="hidden xl:block xl:col-span-3 space-y-4 sticky top-6">
          {/* 1. Where Used */}
          <GlassCard tone="subtle" bezel className="p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
              Where It Is Used
            </span>
            <ul className="text-xs text-[var(--muted)] space-y-1.5 list-disc list-inside">
              {lesson.reference.whereUsed.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* 2. Commonly Confused With */}
          <GlassCard tone="subtle" bezel className="p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--state-bad-fg)] font-bold">
              Confused With
            </span>
            <ul className="text-xs text-[var(--muted)] space-y-1.5 list-disc list-inside">
              {lesson.reference.commonlyConfusedWith.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* 3. Remember */}
          <GlassCard tone="subtle" bezel className="p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--state-good-fg)] font-bold">
              Remember for Interviews
            </span>
            <ul className="text-xs text-[var(--muted)] space-y-1.5 list-disc list-inside">
              {lesson.reference.remember.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="sm:hidden">
        {!isFinalStage ? (
          <BottomCTA
            label={`Continue to Stage 0${currentStageIdx + 2} →`}
            onClick={handleContinue}
          />
        ) : (
          !completionResult && (
            <BottomCTA
              label={submitting ? "Checking..." : `Complete & Claim +${lesson.xpAward} XP`}
              disabled={!recallSelectedId || submitting}
              loading={submitting}
              onClick={handleCompleteLesson}
            />
          )
        )}
      </div>
    </div>
  );
}
