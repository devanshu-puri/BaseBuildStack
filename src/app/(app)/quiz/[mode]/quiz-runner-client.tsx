"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
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
type DrillDifficulty = "basic" | "medium" | "hard" | "mixed";

interface RoundSummaryItem {
  questionId: string;
  skill: string;
  type: string;
  correct: boolean;
  xpEarned: number;
  confidence: ConfidenceLevel | null;
  timeSpentMs: number;
  prompt: string;
}

export interface QuizRunnerClientProps {
  initialMode: string;
}

export function QuizRunnerClient({ initialMode }: QuizRunnerClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const mode = initialMode || "drills";

  const MODE_TITLES: Record<string, string> = {
    quick: "Skill Drills",
    drills: "Skill Drills",
    fundamentals: "Core Fundamentals",
    practical: "Practical & Debugging",
    weak_area: "Adaptive Drills",
    projects: "Project Panel",
  };
  const modeDisplayTitle = MODE_TITLES[mode] || mode;

  // Setup state (for drills mode customization)
  const [showSetup, setShowSetup] = useState(mode === "drills");
  const [availableSkills, setAvailableSkills] = useState<{ name: string; level: string }[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [drillDifficulty, setDrillDifficulty] = useState<DrillDifficulty>("mixed");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [focusWeak, setFocusWeak] = useState<boolean>(false);
  const [unseenCounts, setUnseenCounts] = useState<Record<string, { total: number; unseen: number }>>({});

  // Active quiz state
  const [questions, setQuestions] = useState<ClientQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycleNotice, setCycleNotice] = useState<string | null>(null);

  // Answering state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerChanges, setAnswerChanges] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<QuizEvaluationResult | null>(null);

  // Soft Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Bookmark & Report state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>("ambiguous");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Round summary state
  const [isCompleted, setIsCompleted] = useState(false);
  const [summaryResults, setSummaryResults] = useState<RoundSummaryItem[]>([]);
  const [totalSessionTimeMs, setTotalSessionTimeMs] = useState(0);

  // Load available skills & unseen stats for setup
  useEffect(() => {
    async function loadSetupData() {
      try {
        const [onboardingRes, statsRes] = await Promise.all([
          fetch("/api/quiz/onboarding"),
          fetch(`/api/quiz/session?stats=true&difficulty=${drillDifficulty}`),
        ]);

        if (onboardingRes.ok) {
          const obData = await onboardingRes.json();
          if (obData.confirmedSkills && obData.confirmedSkills.length > 0) {
            setAvailableSkills(obData.confirmedSkills);
            setSelectedSkills(obData.confirmedSkills.map((s: { name: string }) => s.name));
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.counts) {
            setUnseenCounts(statsData.counts);
          }
        }
      } catch (err) {
        console.warn("Could not load setup metadata:", err);
      }
    }

    if (mode === "drills") {
      loadSetupData();
    }
  }, [mode, drillDifficulty]);

  // Load questions session
  const startSession = async (customParams?: {
    skills?: string[];
    difficulty?: DrillDifficulty;
    count?: number;
    focusWeak?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    setShowSetup(false);

    try {
      const skillsToUse = customParams?.skills || selectedSkills;
      const diffToUse = customParams?.difficulty || drillDifficulty;
      const countToUse = customParams?.count || questionCount;
      const weakToUse = customParams?.focusWeak !== undefined ? customParams.focusWeak : focusWeak;

      const res = await fetch("/api/quiz/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode === "drills" ? "drills" : mode,
          skills: skillsToUse.length > 0 ? skillsToUse : undefined,
          difficulty: diffToUse,
          count: countToUse,
          focusWeak: weakToUse,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to load quiz session");
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions available for this selection.");
      }

      setQuestions(data.questions);
      setCycleNotice(data.cycleNotice || null);
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setConfidence(null);
      setEvaluation(null);
      setSummaryResults([]);
      questionStartTimeRef.current = Date.now();
      setElapsedSeconds(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading quiz");
    } finally {
      setLoading(false);
    }
  };

  // Auto-start for non-drills modes (fundamentals, quick, etc.)
  useEffect(() => {
    if (mode === "drills") return;
    let isCancelled = false;

    async function loadNonDrillSession() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/quiz/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        if (!res.ok) throw new Error("Failed to load quiz session");
        const data = await res.json();
        if (!isCancelled) {
          if (!data.questions || data.questions.length === 0) {
            throw new Error("No questions available for this selection.");
          }
          setQuestions(data.questions);
          setCycleNotice(data.cycleNotice || null);
          questionStartTimeRef.current = Date.now();
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Error loading quiz");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadNonDrillSession();
    return () => {
      isCancelled = true;
    };
  }, [mode]);

  // Soft Timer interval
  useEffect(() => {
    if (loading || isCompleted || showSetup || evaluation) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading, isCompleted, showSetup, evaluation]);

  // Check bookmark status on question change
  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    async function checkBookmark() {
      try {
        const res = await fetch(`/api/quiz/bookmark?questionId=${currentQ.id}`);
        if (res.ok) {
          const data = await res.json();
          setIsBookmarked(Boolean(data.bookmarked));
        }
      } catch {
        setIsBookmarked(false);
      }
    }
    checkBookmark();
  }, [questions, currentIndex]);

  // Handle option selection
  const handleSelectOption = (optionId: string) => {
    if (evaluation) return;
    if (selectedOptionId !== null && selectedOptionId !== optionId) {
      setAnswerChanges((prev) => prev + 1);
    }
    setSelectedOptionId(optionId);
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ || bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/quiz/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          title: currentQ.stem?.slice(0, 80) || currentQ.skill,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(Boolean(data.bookmarked));
      }
    } catch (err) {
      console.warn("Failed to toggle bookmark:", err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Submit Answer
  const handleSubmit = async () => {
    if (!selectedOptionId || !confidence || submitting || evaluation) return;

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
      setTotalSessionTimeMs((prev) => prev + elapsedMs);

      // Record in round summary
      setSummaryResults((prev) => [
        ...prev,
        {
          questionId: currentQ.id,
          skill: currentQ.skill,
          type: currentQ.type,
          correct: result.correct,
          xpEarned: result.xpEarned,
          confidence,
          timeSpentMs: elapsedMs,
          prompt: currentQ.stem,
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
      setConfidence(null);
      setEvaluation(null);
      setElapsedSeconds(0);
      questionStartTimeRef.current = Date.now();
    } else {
      setIsCompleted(true);
    }
  };

  // Keyboard navigation: 1-4 / A-D, Enter, B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const currentQ = questions[currentIndex];
      if (!currentQ || showSetup) return;

      if (!evaluation) {
        if (e.key === "1" || e.key.toLowerCase() === "a") {
          if (currentQ.options[0]) handleSelectOption(currentQ.options[0].id);
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          if (currentQ.options[1]) handleSelectOption(currentQ.options[1].id);
        } else if (e.key === "3" || e.key.toLowerCase() === "c") {
          if (currentQ.options[2]) handleSelectOption(currentQ.options[2].id);
        } else if (e.key === "4" || e.key.toLowerCase() === "d") {
          if (currentQ.options[3]) handleSelectOption(currentQ.options[3].id);
        } else if (e.key === "Enter" && selectedOptionId && confidence && !submitting) {
          handleSubmit();
        }
      } else {
        if (e.key === "Enter") {
          handleNext();
        }
      }

      // 'B' key toggles bookmark
      if (e.key.toLowerCase() === "b" && !e.ctrlKey && !e.metaKey) {
        handleToggleBookmark();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentIndex, evaluation, selectedOptionId, confidence, submitting, showSetup]);

  // Submit Report
  const handleSendReport = () => {
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
    }, 1500);
  };

  // 1. Setup Screen (Section 5.1)
  if (showSetup) {
    return (
      <div className="py-6 px-4 max-w-2xl mx-auto space-y-6 pb-36">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Chip k="SETUP" v="DRILLS" tone="accent" />
              <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
                Personalized Quiz
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight font-display">
              Configure Skill Drill
            </h1>
          </div>
          <Button href="/quiz" variant="secondary" size="sm">
            ← Back
          </Button>
        </div>

        <GlassCard tone="default" padding="lg" className="space-y-6">
          {/* 1. Skill Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                Target Skills ({selectedSkills.length} selected)
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedSkills(
                    selectedSkills.length === availableSkills.length
                      ? []
                      : availableSkills.map((s) => s.name)
                  )
                }
                className="text-xs font-mono text-[var(--accent-bright)] hover:underline cursor-pointer"
              >
                {selectedSkills.length === availableSkills.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {availableSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((s) => {
                  const isSelected = selectedSkills.includes(s.name);
                  const norm = s.name.toLowerCase().trim();
                  const unseen = unseenCounts[norm]?.unseen;

                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() =>
                        setSelectedSkills((prev) =>
                          isSelected ? prev.filter((name) => name !== s.name) : [...prev, s.name]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[rgba(139,124,255,0.18)] border-[var(--accent)] text-[var(--text)] shadow-[0_0_12px_rgba(139,124,255,0.2)]"
                          : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span>{s.name}</span>
                      {unseen !== undefined && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--surface-overlay)] text-[var(--text-3)]">
                          {unseen} new
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-3)] text-center">
                No custom skills configured. Default core stack will be used.
              </div>
            )}
          </div>

          {/* 2. Difficulty Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: "mixed", label: "Mixed ✦", desc: "Adaptive" },
                  { id: "basic", label: "Basic ★", desc: "45s target" },
                  { id: "medium", label: "Medium ★★", desc: "60s target" },
                  { id: "hard", label: "Hard ★★★", desc: "90s target" },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDrillDifficulty(d.id)}
                  className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                    drillDifficulty === d.id
                      ? "bg-[rgba(139,124,255,0.16)] border-[var(--accent)] text-[var(--text)] shadow-[0_0_12px_rgba(139,124,255,0.2)]"
                      : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                >
                  <div className="text-xs font-bold font-ui">{d.label}</div>
                  <div className="text-[10px] text-[var(--text-3)] font-mono">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Question Count */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    questionCount === num
                      ? "bg-[rgba(139,124,255,0.16)] border-[var(--accent)] text-[var(--text)] shadow-[0_0_12px_rgba(139,124,255,0.2)]"
                      : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                >
                  {num} Questions
                </button>
              ))}
            </div>
          </div>

          {/* 4. Focus on Weak Skills Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)]">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[var(--text)] font-ui">
                Focus on Weak Skills
              </div>
              <div className="text-[11px] text-[var(--text-3)]">
                Prioritizes topics where you previously made mistakes.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFocusWeak(!focusWeak)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                focusWeak ? "bg-[var(--accent)]" : "bg-[var(--surface-overlay)] border border-[var(--border)]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  focusWeak ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Start CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => startSession()}
          >
            Start Drill ({questionCount} Questions) →
          </Button>
        </GlassCard>
      </div>
    );
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[var(--text-2)] font-ui">
            Preparing your personalized {modeDisplayTitle}...
          </p>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error || questions.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <GlassCard tone="default" padding="lg" className="max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(255,107,107,0.15)] text-[#FF6B6B] font-bold text-xl flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-lg font-bold text-[var(--text)]">Quiz Session Unavailable</h2>
          <p className="text-sm text-[var(--text-3)] font-ui">
            {error || "Could not retrieve questions for this selection."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            {mode === "drills" && (
              <Button onClick={() => setShowSetup(true)} variant="secondary" size="md">
                Adjust Drill Settings
              </Button>
            )}
            <Button href="/quiz" variant="primary" size="md">
              ← Back to Quiz Modes
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 4. Completed Round Summary View
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

    // Confidence calibration breakdown
    const certainAttempts = summaryResults.filter((r) => r.confidence === "certain");
    const certainCorrect = certainAttempts.filter((r) => r.correct).length;
    const certainWrong = certainAttempts.length - certainCorrect;

    return (
      <div className="py-8 px-4 max-w-2xl mx-auto space-y-6 pb-36">
        <div className="text-center space-y-2">
          <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--accent-bright)] font-semibold">
            Session Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Round Summary
          </h1>
        </div>

        <GlassCard tone="default" padding="lg" className="space-y-6">
          <div className="flex flex-col items-center justify-center pt-2">
            <ProgressRing
              value={accuracyPct}
              size={120}
              strokeWidth={10}
              label={`${accuracyPct}%`}
            />
            <div className="mt-4 text-xl font-bold text-[var(--text)] font-ui">
              {totalCorrect} of {summaryResults.length} Correct
            </div>
            <div className="text-sm text-[var(--text-3)] font-mono mt-1">
              Earned <span className="font-bold text-[var(--accent-bright)]">+{totalXP} XP</span> • Total Time:{" "}
              {Math.round(totalSessionTimeMs / 1000)}s
            </div>
          </div>

          {/* Confidence Calibration Summary */}
          {certainAttempts.length > 0 && (
            <div className="p-4 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] space-y-1.5 text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                Confidence Calibration
              </div>
              <p className="text-xs text-[var(--text-2)] font-ui leading-relaxed">
                You marked <span className="font-bold text-[var(--text)]">Certain</span> on {certainAttempts.length}{" "}
                question(s) and{" "}
                {certainWrong === 0 ? (
                  <span className="text-[var(--state-done)] font-bold">all {certainCorrect} were correct! 🎯</span>
                ) : (
                  <span className="text-[#FF6B6B] font-bold">
                    {certainWrong} were incorrect ({certainCorrect} correct). Review these mistakes below.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Skill Breakdown */}
          <div className="pt-2 border-t border-[var(--border)] space-y-3 text-left">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Accuracy by Verified Skill
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(skillStats).map(([skill, stats]) => (
                <div
                  key={skill}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] text-xs"
                >
                  <span className="font-semibold text-[var(--text)] capitalize">{skill}</span>
                  <span
                    className={`font-mono font-bold ${
                      stats.correct === stats.total ? "text-[var(--state-done)]" : "text-[var(--text-3)]"
                    }`}
                  >
                    {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Navigation */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row gap-3 justify-center">
            {mode === "drills" && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsCompleted(false);
                  setShowSetup(true);
                }}
              >
                Configure Another Drill
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                startTransition(() => {
                  router.push("/quiz");
                });
              }}
            >
              Back to Quiz Modes
            </Button>
            <Button href="/progress" variant="primary" size="md">
              View Skill Heatmap →
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 5. Active Question View
  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  // Soft Timer target
  const numDiff =
    typeof currentQ.difficulty === "number"
      ? currentQ.difficulty
      : currentQ.difficulty === "basic"
      ? 1
      : currentQ.difficulty === "medium"
      ? 2
      : 3;
  const targetSeconds = numDiff === 1 ? 45 : numDiff === 2 ? 60 : 90;
  const isOverTime = elapsedSeconds > targetSeconds;

  // Question Type Chips Config
  const typeLabels: Record<string, { text: string; tone: "accent" | "default" | "bad" | "good" }> = {
    mcq: { text: "Conceptual MCQ", tone: "accent" },
    output: { text: "Output Prediction", tone: "default" },
    debug: { text: "Spot the Bug", tone: "bad" },
    approach: { text: "Architecture Strategy", tone: "good" },
    multi_select: { text: "Multi-Select MCQ", tone: "accent" },
    concept_scenario: { text: "Scenario MCQ", tone: "good" },
  };
  const activeTypeLabel = typeLabels[currentQ.type] || {
    text: String(currentQ.type).toUpperCase(),
    tone: "accent",
  };

  const difficultyStars = "★".repeat(numDiff) + "☆".repeat(3 - numDiff);

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

  // Safe extraction of code string and language regardless of whether code is string or { language, source } object
  const codeString =
    typeof currentQ.code === "string"
      ? currentQ.code
      : typeof currentQ.code === "object" && currentQ.code !== null && "source" in currentQ.code
      ? (currentQ.code as { source: string }).source
      : "";
  const codeLang =
    currentQ.codeLanguage ||
    (typeof currentQ.code === "object" && currentQ.code !== null && "language" in currentQ.code
      ? (currentQ.code as { language: string }).language
      : "typescript") ||
    "typescript";
  const hasCode = Boolean(codeString && codeString.trim().length > 0);

  return (
    <div className="pb-36 pt-2 px-2 sm:px-4 max-w-6xl mx-auto space-y-6">
      {/* Top Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-3)]">
          <Link
            href="/quiz"
            className="hover:text-[var(--text)] transition-colors flex items-center gap-1 font-semibold"
          >
            ← Exit {modeDisplayTitle}
          </Link>

          <div className="flex items-center gap-3">
            {/* Soft Timer Badge */}
            <span
              className={`px-2 py-0.5 rounded-full border text-[11px] font-mono transition-colors ${
                isOverTime
                  ? "bg-[rgba(255,170,128,0.12)] border-[rgba(255,170,128,0.3)] text-[#ffaa80]"
                  : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)]"
              }`}
            >
              ⏱️ {elapsedSeconds}s / {targetSeconds}s
            </span>

            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[var(--accent-bright)] font-semibold">({progressPct}%)</span>
          </div>
        </div>

        <ProgressBar value={progressPct} />
      </div>

      {/* Cycle Exhaustion Notice */}
      {cycleNotice && (
        <div className="p-3.5 rounded-xl bg-[rgba(255,170,128,0.08)] border border-[rgba(255,170,128,0.25)] text-xs text-[#ffaa80] flex items-center gap-2 font-ui">
          <span>🔄</span>
          <span>{cycleNotice}</span>
        </div>
      )}

      {/* Question Metadata Bar */}
      <GlassCard tone="subtle" padding="sm" className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Chip k="SKILL" v={currentQ.skill} tone="accent" />
          <Chip k="TYPE" v={activeTypeLabel.text} tone={activeTypeLabel.tone} />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-3)]">
          <div className="flex items-center gap-1.5">
            <span>Tier:</span>
            <span className="text-[var(--accent-bright)] tracking-widest">{difficultyStars}</span>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all cursor-pointer ${
              isBookmarked
                ? "bg-[rgba(139,124,255,0.2)] border-[var(--accent)] text-[var(--text)] shadow-[0_0_8px_rgba(139,124,255,0.3)]"
                : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]"
            }`}
          >
            <span>{isBookmarked ? "★" : "☆"}</span>
            <span>{isBookmarked ? "Bookmarked" : "Bookmark (B)"}</span>
          </button>

          {/* Report Button */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="text-[11px] text-[var(--text-3)] hover:text-[var(--text)] underline cursor-pointer"
          >
            Report
          </button>
        </div>
      </GlassCard>

      {/* Main Content Layout */}
      <div className={`grid gap-6 ${hasCode ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-3xl mx-auto"}`}>
        {/* Left Column: Stem & Code */}
        <div className={`space-y-4 ${hasCode ? "lg:col-span-6" : ""}`}>
          <GlassCard tone="default" padding="lg" className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] leading-relaxed font-ui">
              {currentQ.stem}
            </h2>
          </GlassCard>

          {hasCode && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] px-1 font-semibold">
                Code Snippet ({codeLang.toUpperCase()})
              </div>
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                <CodeBlock
                  code={codeString}
                  lang={codeLang}
                  className="max-h-[380px] sm:max-h-[460px] overflow-y-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Options, Confidence & 5-Part Feedback */}
        <div className={`space-y-5 ${hasCode ? "lg:col-span-6" : ""}`}>
          {/* Options List */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] px-1 flex items-center justify-between font-semibold">
              <span>Options (Keyboard: 1-4 / A-D)</span>
              {answerChanges > 0 && !evaluation && (
                <span className="text-[var(--text-3)] text-[10px]">
                  Changed {answerChanges} {answerChanges === 1 ? "time" : "times"}
                </span>
              )}
            </div>

            {currentQ.options.map((opt, idx) => {
              const prefix = String.fromCharCode(65 + idx);
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

          {/* Confidence Selector */}
          {!evaluation && (
            <GlassCard tone="subtle" padding="sm" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold block">
                  Confidence Rating
                </span>
                {!confidence && selectedOptionId && (
                  <span className="text-[10px] font-mono text-[var(--accent-bright)] font-semibold">
                    Select confidence to submit
                  </span>
                )}
              </div>
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
                        ? "bg-[rgba(139,124,255,0.18)] border-[var(--accent)] text-[var(--text)] shadow-[0_0_12px_rgba(139,124,255,0.25)]"
                        : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* 5-Part Feedback Card */}
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
              followUp={evaluation.explanation.followUp}
              evidence={evaluation.explanation.repoEvidence}
            />
          )}

          {/* Desktop Submit Button */}
          <div className="hidden sm:block pt-2">
            {!evaluation ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={!selectedOptionId || !confidence || submitting}
              >
                {submitting
                  ? "Evaluating Answer..."
                  : !selectedOptionId
                  ? "Select an Option"
                  : !confidence
                  ? "Select Confidence Level"
                  : "Submit Answer (Enter)"}
              </Button>
            ) : (
              <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
                {currentIndex + 1 < questions.length ? "Next Question (Enter) →" : "Finish Round →"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="sm:hidden">
        {!evaluation ? (
          <BottomCTA
            label={
              submitting
                ? "Evaluating..."
                : !selectedOptionId
                ? "Select an Option"
                : !confidence
                ? "Select Confidence"
                : "Submit Answer"
            }
            disabled={!selectedOptionId || !confidence || submitting}
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

      {/* Report Question Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard tone="default" padding="lg" className="max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text)] font-ui">Report Question Issue</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-xs font-mono text-[var(--text-3)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <span className="text-2xl">✓</span>
                <p className="text-sm font-bold text-[var(--state-done)]">
                  Thank you! Reported for review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)]">
                    What is the issue?
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-overlay)] border border-[var(--border)] text-xs text-[var(--text)]"
                  >
                    <option value="incorrect">Incorrect Answer or Explanation</option>
                    <option value="ambiguous">Ambiguous or Confusing Question</option>
                    <option value="typo">Typo or Formatting Glitch</option>
                    <option value="outdated">Outdated Technology Version</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSendReport}>
                    Submit Report
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
