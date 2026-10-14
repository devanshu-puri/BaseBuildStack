"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { OptionButton } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { Lesson, RetestStage, RetestSubmissionResult } from "@/content/m3/lesson-schema";
import { getLessonRetestChallenge } from "@/content/m3/lessons";

interface RetestRunnerProps {
  lesson: Lesson;
  initialStage?: RetestStage;
}

export function RetestRunner({
  lesson,
  initialStage = "day3",
}: RetestRunnerProps) {
  const router = useRouter();
  const [stage, setStage] = useState<RetestStage>(initialStage);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RetestSubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const challenge = getLessonRetestChallenge(lesson, stage);

  const handleSubmit = async () => {
    if (!selectedOptionId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const durationMs = Math.max(0, Date.now() - (startTimeRef.current || Date.now()));

    try {
      const res = await fetch("/api/lessons/retest/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          stage,
          selectedOptionId,
          durationMs,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to submit assessment");
      }

      setResult(json.data);
    } catch (err: unknown) {
      console.error("Retest submission error:", err);
      const msg = err instanceof Error ? err.message : "Error submitting retest";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/m3/retest"
          className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 font-mono"
        >
          ← Retest Queue
        </Link>

        <div className="flex items-center gap-2">
          {stage === "day3" ? (
            <Chip k="CHECKPOINT" v="+3 Days" tone="accent" />
          ) : (
            <Chip k="MASTERY FINAL" v="+10 Days" tone="good" />
          )}
        </div>
      </div>

      {/* Header Card */}
      <GlassCard tone="default" bezel className="p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            Spaced Active Recall
          </span>
          <span className="text-xs text-[var(--muted)]">•</span>
          <span className="text-xs text-[var(--muted)] capitalize">
            {stage === "day3" ? "3-Day Retention Check" : "10-Day Full Mastery Check"}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)]">
          {lesson.outcome}
        </p>

        {/* Stage Toggle if reviewing */}
        {!result && (
          <div className="pt-2 flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--muted)] font-semibold">TARGET:</span>
            <button
              type="button"
              onClick={() => {
                setStage("day3");
                setSelectedOptionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stage === "day3"
                  ? "bg-[var(--accent)] text-[var(--accent-fg,#ffffff)] shadow-[0_0_12px_rgba(94,78,240,0.35)]"
                  : "bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              Day 3 Checkpoint
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("day10");
                setSelectedOptionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stage === "day10"
                  ? "bg-[var(--state-good-fg)] text-[var(--bg)] shadow-[0_0_12px_rgba(110,231,183,0.35)]"
                  : "bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              Day 10 Mastery Final
            </button>
          </div>
        )}
      </GlassCard>

      {/* Exercise Card */}
      <GlassCard tone="default" bezel className="p-6 space-y-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
            Retrieval Challenge
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[var(--fg)] mt-1">
            {challenge.prompt}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {challenge.options.map((option, idx) => {
            const prefix = String.fromCharCode(65 + idx);
            let state: "idle" | "selected" | "correct" | "incorrect" = "idle";

            if (result) {
              if (option.id === challenge.correctOptionId) {
                state = "correct";
              } else if (option.id === selectedOptionId) {
                state = "incorrect";
              }
            } else if (selectedOptionId === option.id) {
              state = "selected";
            }

            return (
              <OptionButton
                key={option.id}
                prefix={prefix}
                label={option.text}
                state={state}
                disabled={Boolean(result) || isSubmitting}
                onClick={() => setSelectedOptionId(option.id)}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[var(--state-bad-bg)] border border-[var(--state-bad-fg)] text-xs text-[var(--state-bad-fg)] font-medium">
            {errorMsg}
          </div>
        )}

        {/* Submit Action (before submission) */}
        {!result && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[12px] text-[var(--muted)]">
              {stage === "day3"
                ? "Passing schedules the final +10 day mastery check (+25 XP)."
                : "Passing marks this topic permanently Mastered (+50 XP)."}
            </span>

            <Button
              variant="primary"
              size="md"
              disabled={!selectedOptionId || isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Verifying Answer..." : "Submit Assessment →"}
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Post-submission Result & Feedback */}
      {result && (
        <div className="space-y-6">
          {/* Mastered Celebration Banner */}
          {result.mastered && (
            <GlassCard
              tone="aurora"
              bezel
              className="p-6 space-y-2 text-center sm:text-left border-2 border-[var(--state-good-fg)]"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xl">🏆</span>
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--state-good-fg)] font-bold">
                      Topic Mastered!
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[var(--fg)]">
                    You have achieved Full Mastery in {lesson.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    By passing both 3-day and 10-day spaced retrieval tests, your mental model is now certified resilient.
                  </p>
                </div>
                <Chip k="XP" v={`+${result.xpAwarded}`} tone="good" className="text-sm px-3 py-1 font-bold shrink-0" />
              </div>
            </GlassCard>
          )}

          {/* 5-Part FeedbackCard */}
          <FeedbackCard
            verdict={result.passed ? "correct" : "incorrect"}
            why={result.feedback}
            distractors={
              result.passed
                ? []
                : ["Your selected choice overlooked the boundary conditions of this distributed pattern."]
            }
            takeaway={result.explanation}
          />

          {/* Next Steps CTA Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href={`/m3/lesson/${lesson.id}`}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              Review Original 5 Stages →
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/m3/retest")}
                className="w-full sm:w-auto"
              >
                Return to Retest Queue →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
