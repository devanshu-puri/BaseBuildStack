"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { UserProjectDocument, ProjectQuestionDocument } from "@/lib/db/schemas";

interface PanelData {
  projects: UserProjectDocument[];
  activeProject: UserProjectDocument;
  isSample: boolean;
  questions: ProjectQuestionDocument[];
  stats: {
    total: number;
    gotIt: number;
    needReview: number;
    unreviewed: number;
  };
}

export function ProjectPanelClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PanelData | null>(null);
  const [mode, setMode] = useState<"study" | "mock">("study");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "got_it" | "need_review" | "unreviewed">("all");

  // Expanded question card IDs in study mode
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Mock panel simulation state
  const [mockIndex, setMockIndex] = useState(0);
  const [mockRevealed, setMockRevealed] = useState(false);
  const [mockTimerSeconds, setMockTimerSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  const reloadData = useCallback(async (projectId?: string, refresh?: boolean) => {
    setLoading(true);
    try {
      const url = new URL("/api/quiz/projects", window.location.origin);
      if (projectId) url.searchParams.set("projectId", projectId);
      if (refresh) url.searchParams.set("refresh", "true");

      const res = await fetch(url.toString());
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
        setSelectedProjectId(resData.activeProject?.id || null);
      }
    } catch (err) {
      console.error("Failed to load project panel data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const url = new URL("/api/quiz/projects", window.location.origin);
        if (selectedProjectId) url.searchParams.set("projectId", selectedProjectId);

        const res = await fetch(url.toString());
        const resData = await res.json();
        if (!ignore && resData.success) {
          setData(resData);
          setSelectedProjectId(resData.activeProject?.id || null);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load project panel data:", err);
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, [selectedProjectId]);

  // Mock timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && mockTimerSeconds > 0) {
      interval = setInterval(() => {
        setMockTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, mockTimerSeconds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateStatus = async (
    questionId: string,
    newStatus: "got_it" | "need_review" | "unreviewed"
  ) => {
    if (!data) return;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updatedQuestions = prev.questions.map((q) =>
        q.id === questionId ? { ...q, status: newStatus } : q
      );
      const gotIt = updatedQuestions.filter((q) => q.status === "got_it").length;
      const needReview = updatedQuestions.filter((q) => q.status === "need_review").length;
      const unreviewed = updatedQuestions.filter((q) => q.status === "unreviewed").length;

      return {
        ...prev,
        questions: updatedQuestions,
        stats: { total: updatedQuestions.length, gotIt, needReview, unreviewed },
      };
    });

    try {
      await fetch("/api/quiz/projects/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Synthesizing senior project interview panel...
          </p>
        </div>
      </div>
    );
  }

  const { activeProject, questions, stats, isSample, projects } = data;
  const masteryPercentage = Math.round((stats.gotIt / Math.max(1, stats.total)) * 100);

  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === "all") return true;
    return q.status === activeFilter;
  });

  const mockQuestion = questions[mockIndex];

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-6 pb-36">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/quiz"
            className="text-xs font-mono text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Exit to Quizzes</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>Project Interview Panel</span>
            <Chip k="TIER" v="SENIOR" tone="accent" className="text-[10px] font-mono" />
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => reloadData(activeProject.id, true)}
            className="text-xs font-mono"
          >
            ↻ Regenerate Panel
          </Button>

          {/* Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/5 text-xs font-mono">
            <button
              onClick={() => setMode("study")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "study"
                  ? "bg-[var(--brand-accent)] text-white font-semibold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              📖 Study
            </button>
            <button
              onClick={() => {
                setMode("mock");
                setMockIndex(0);
                setMockRevealed(false);
                setMockTimerSeconds(120);
                setTimerRunning(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "mock"
                  ? "bg-[var(--brand-accent)] text-white font-semibold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              🎙️ Mock Panel
            </button>
          </div>
        </div>
      </div>

      {/* Sample Banner if candidate has no personal resume projects */}
      {isSample && (
        <div className="p-3.5 rounded-xl bg-[rgba(139,124,255,0.08)] border border-[var(--brand-accent)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#D8D2FF]">
            <span className="text-base">💡</span>
            <span>
              Practicing with <strong>Canonical Architecture Project</strong>. Upload your resume or add custom projects in Onboarding to practice with your own portfolio!
            </span>
          </div>
          <Link href="/quiz/onboarding" className="shrink-0">
            <button className="px-3 py-1 rounded-lg bg-[var(--brand-accent)] hover:opacity-90 text-white font-mono font-medium transition-all">
              Go to Onboarding →
            </button>
          </Link>
        </div>
      )}

      {/* Project Selector Tabs if user has multiple projects */}
      {projects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-[var(--text-tertiary)] uppercase shrink-0">
            Active Project:
          </span>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                activeProject.id === p.id
                  ? "bg-white/10 text-white border border-white/20 font-semibold"
                  : "bg-white/[0.02] text-[var(--text-secondary)] border border-transparent hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Project Overview Card with Readiness Score Bar */}
      <GlassCard className="p-5 sm:p-6 space-y-4 border border-white/10 bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--brand-accent)] uppercase font-semibold">
                {activeProject.role || "Lead Software Engineer"}
              </span>
              <span className="text-white/20">•</span>
              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                Portfolio Grounding
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {activeProject.name}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {activeProject.summary}
            </p>
          </div>

          {/* Readiness Gauge */}
          <div className="shrink-0 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center min-w-[150px]">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
              Project Readiness
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {masteryPercentage}%
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              {stats.gotIt} of {stats.total} Mastered
            </span>
          </div>
        </div>

        {/* Metrics & Tech Stack Chips */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          {activeProject.metrics &&
            activeProject.metrics.map((m, idx) => (
              <Chip
                key={`metric-${idx}`}
                k="METRIC"
                v={m}
                tone="good"
                className="font-mono text-[11px]"
              />
            ))}
          {activeProject.techStack &&
            activeProject.techStack.map((tech, idx) => (
              <Chip
                key={`tech-${idx}`}
                k="STACK"
                v={tech}
                tone="default"
                className="font-mono text-[11px]"
              />
            ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 1. STUDY / READ-AND-LEARN MODE                                            */}
      {/* ========================================================================= */}
      {mode === "study" && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setActiveFilter("got_it")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "got_it"
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                    : "text-emerald-400/70 hover:text-emerald-300"
                }`}
              >
                Got It ({stats.gotIt})
              </button>
              <button
                onClick={() => setActiveFilter("need_review")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "need_review"
                    ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                    : "text-amber-400/70 hover:text-amber-300"
                }`}
              >
                Need Review ({stats.needReview})
              </button>
              <button
                onClick={() => setActiveFilter("unreviewed")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "unreviewed"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                Unreviewed ({stats.unreviewed})
              </button>
            </div>

            <span className="text-[11px] font-mono text-[var(--text-tertiary)] hidden sm:inline">
              Click any question to expand STAR response & checklist
            </span>
          </div>

          {/* Question Cards List */}
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const isExpanded = Boolean(expandedIds[q.id]);

              return (
                <GlassCard
                  key={q.id}
                  className={`border transition-all ${
                    q.status === "got_it"
                      ? "border-emerald-500/30 bg-emerald-950/[0.04]"
                      : q.status === "need_review"
                      ? "border-amber-500/30 bg-amber-950/[0.04]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {/* Card Header Accordion Trigger */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--brand-accent)]">
                          #{idx + 1}
                        </span>
                        <Chip
                          k="CATEGORY"
                          v={q.category}
                          tone="accent"
                          className="font-mono text-[10px]"
                        />
                        <Chip
                          k="DIFFICULTY"
                          v={q.difficulty.toUpperCase()}
                          tone={
                            q.difficulty === "hard"
                              ? "bad"
                              : q.difficulty === "medium"
                              ? "running"
                              : "good"
                          }
                          className="font-mono text-[10px]"
                        />
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(
                              q.id,
                              q.status === "got_it" ? "unreviewed" : "got_it"
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            q.status === "got_it"
                              ? "bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span>✓</span>
                          <span>Got It</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(
                              q.id,
                              q.status === "need_review" ? "unreviewed" : "need_review"
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            q.status === "need_review"
                              ? "bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <span>↺</span>
                          <span>Need Review</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleExpand(q.id)}
                          className="p-1 rounded text-white/50 hover:text-white ml-1 cursor-pointer transition-colors"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div
                      onClick={() => toggleExpand(q.id)}
                      className="cursor-pointer group"
                    >
                      <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-[var(--brand-accent)] transition-colors leading-relaxed">
                        {q.question}
                      </h3>
                    </div>
                  </div>

                  {/* Expanded Accordion Body */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 space-y-5 border-t border-white/5 pt-4 animate-in fade-in duration-200">
                      {/* 1. STAR Model Answer */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--brand-accent)]" />
                          <span className="text-xs font-mono uppercase tracking-wider text-[var(--brand-accent)] font-bold">
                            Model Answer (STAR Structure)
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-[#F4F5FB] leading-relaxed space-y-3 font-sans">
                          {q.modelAnswer.split("\n").map((line, lIdx) => {
                            if (line.startsWith("**Situation:**")) {
                              return (
                                <p key={lIdx}>
                                  <strong className="text-blue-400 font-mono">
                                    [SITUATION]
                                  </strong>{" "}
                                  {line.replace("**Situation:**", "").trim()}
                                </p>
                              );
                            }
                            if (line.startsWith("**Task:**")) {
                              return (
                                <p key={lIdx}>
                                  <strong className="text-purple-400 font-mono">
                                    [TASK]
                                  </strong>{" "}
                                  {line.replace("**Task:**", "").trim()}
                                </p>
                              );
                            }
                            if (line.startsWith("**Action:**")) {
                              return (
                                <p key={lIdx}>
                                  <strong className="text-amber-400 font-mono">
                                    [ACTION]
                                  </strong>{" "}
                                  {line.replace("**Action:**", "").trim()}
                                </p>
                              );
                            }
                            if (line.startsWith("**Result:**")) {
                              return (
                                <p key={lIdx}>
                                  <strong className="text-emerald-400 font-mono">
                                    [RESULT]
                                  </strong>{" "}
                                  {line.replace("**Result:**", "").trim()}
                                </p>
                              );
                            }
                            return <p key={lIdx}>{line}</p>;
                          })}
                        </div>
                      </div>

                      {/* 2. Key Points Checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                            Key Points Checklist (What You Must Mention)
                          </span>
                        </div>
                        <ul className="space-y-1.5 pl-1">
                          {q.keyPoints.map((kp, kpIdx) => (
                            <li
                              key={kpIdx}
                              className="text-xs sm:text-sm text-white/90 flex items-start gap-2"
                            >
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Red Flags / Common Traps */}
                      <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                          <span>⚠️ Common Traps & Red Flags to Avoid:</span>
                        </div>
                        <ul className="space-y-1 pl-1">
                          {q.commonMistakes.map((cm, cmIdx) => (
                            <li
                              key={cmIdx}
                              className="text-xs text-rose-200/80 flex items-start gap-2"
                            >
                              <span className="text-rose-400 mt-0.5">✕</span>
                              <span>{cm}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Follow-up Questions */}
                      {q.followUps && q.followUps.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[rgba(139,124,255,0.06)] border border-[var(--brand-accent)]/20 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--brand-accent)]">
                            <span>💬 Anticipated Interviewer Follow-ups:</span>
                          </div>
                          <ul className="space-y-1 pl-1">
                            {q.followUps.map((fu, fuIdx) => (
                              <li
                                key={fuIdx}
                                className="text-xs text-[#D8D2FF] flex items-start gap-2"
                              >
                                <span className="text-[var(--brand-accent)] mt-0.5">→</span>
                                <span>{fu}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOCK PANEL SIMULATION MODE                                             */}
      {/* ========================================================================= */}
      {mode === "mock" && mockQuestion && (
        <div className="space-y-6">
          {/* Mock Navigation Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              Question {mockIndex + 1} of {questions.length}
            </span>

            {/* Speaking Timer */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                Speaking Timer:
              </span>
              <div
                className={`font-mono text-base font-bold px-3 py-1 rounded-lg border ${
                  mockTimerSeconds <= 15
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                    : "bg-white/5 border-white/10 text-white"
                }`}
              >
                {Math.floor(mockTimerSeconds / 60)}:
                {String(mockTimerSeconds % 60).padStart(2, "0")}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setTimerRunning((prev) => !prev)}
                className="text-xs font-mono px-2.5"
              >
                {timerRunning ? "Pause" : "Start"}
              </Button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setMockTimerSeconds(120);
                }}
                className="text-xs text-white/40 hover:text-white font-mono cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interviewer Dialog Bubble */}
          <GlassCard className="p-6 sm:p-8 space-y-4 border-l-4 border-l-[var(--brand-accent)] bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(139,124,255,0.2)] border border-[var(--brand-accent)] flex items-center justify-center text-lg">
                🎙️
              </div>
              <div>
                <span className="text-xs font-mono uppercase font-bold text-[var(--brand-accent)] block">
                  Senior Staff Interviewer
                </span>
                <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                  Category: {mockQuestion.category}
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg font-medium text-white leading-relaxed pt-2">
              &ldquo;{mockQuestion.question}&rdquo;
            </p>

            <div className="pt-2">
              <span className="text-xs text-[var(--text-secondary)] italic">
                Tip: Structure your spoken answer using STAR (Situation, Task, Action, Result). State concrete technical trade-offs.
              </span>
            </div>
          </GlassCard>

          {/* Reveal & Self-Evaluation Panel */}
          {!mockRevealed ? (
            <div className="text-center pt-4">
              <Button
                onClick={() => {
                  setTimerRunning(false);
                  setMockRevealed(true);
                }}
                variant="primary"
                className="px-8 py-3.5 text-sm font-semibold shadow-lg"
              >
                I&apos;ve Finished Answering — Reveal Model Breakdown →
              </Button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-300">
              <GlassCard className="p-5 sm:p-6 space-y-4 border border-white/10 bg-black/40">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Self-Evaluation & STAR Benchmark
                  </span>

                  {/* Rating Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(mockQuestion.id, "got_it")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer font-bold ${
                        mockQuestion.status === "got_it"
                          ? "bg-emerald-500 text-black shadow-lg"
                          : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}
                    >
                      ✓ I Nailed It (Got It)
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(mockQuestion.id, "need_review")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer font-bold ${
                        mockQuestion.status === "need_review"
                          ? "bg-amber-500 text-black shadow-lg"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      ↺ Need Review
                    </button>
                  </div>
                </div>

                {/* STAR Response Benchmark */}
                <div className="space-y-2 text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                  <h4 className="text-xs font-mono font-bold text-[var(--brand-accent)] uppercase">
                    Model Response:
                  </h4>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    {mockQuestion.modelAnswer.split("\n").map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Did you mention these key points?
                  </h4>
                  <ul className="space-y-1 text-xs text-white/80">
                    {mockQuestion.keyPoints.map((kp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>

              {/* Next Question Control */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={mockIndex === 0}
                  onClick={() => {
                    setMockIndex((prev) => prev - 1);
                    setMockRevealed(false);
                    setMockTimerSeconds(120);
                  }}
                >
                  ← Previous
                </Button>

                {mockIndex + 1 < questions.length ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setMockIndex((prev) => prev + 1);
                      setMockRevealed(false);
                      setMockTimerSeconds(120);
                    }}
                  >
                    Next Mock Question →
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setMode("study")}>
                    Finish Mock & Return to Study Mode ✓
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating BottomCTA for mobile */}
      <BottomCTA
        label={mode === "study" ? "Switch to Mock Panel Mode 🎙️" : "Switch to Study Mode 📖"}
        onClick={() => setMode(mode === "study" ? "mock" : "study")}
        floatingAboveDock
      />
    </div>
  );
}
