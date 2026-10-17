"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip, ChipTone } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

interface UserSkill {
  name: string;
  level: string;
  confirmed?: boolean;
}

interface UserProject {
  id: string;
  name: string;
  techStack: string[];
}

const QUIZ_MODES = [
  {
    id: "quick",
    href: "/quiz/drills",
    title: "Skill Drills",
    badge: "Interactive MCQs",
    badgeTone: "accent" as ChipTone,
    description:
      "Select your skills and difficulty (Basic, Medium, Hard). Shuffled without repeats until your unseen question pool is exhausted.",
    questionsCount: "5–20 questions",
    types: ["MCQ", "Output", "Concept"],
    recommendedFor: "Targeted skill mastery & interview warm-up",
    stats: "Basic / Med / Hard",
  },
  {
    id: "fundamentals",
    href: "/quiz/fundamentals",
    title: "Core Fundamentals",
    badge: "High Frequency",
    badgeTone: "default" as ChipTone,
    description:
      "The questions most frequently asked in real engineering technical rounds for each skill in your stack.",
    questionsCount: "10 questions",
    types: ["High Frequency", "Runtime Internals"],
    recommendedFor: "Interview conceptual & mechanism rounds",
    stats: "Top Interview Questions",
  },
  {
    id: "practical",
    href: "/quiz/practical",
    title: "Practical & Debugging",
    badge: "Click the Bug",
    badgeTone: "accent" as ChipTone,
    description:
      "Spot-the-bug challenges in realistic production code files. Tap the buggy line to reveal the root cause and verified diff fix.",
    questionsCount: "5 challenges",
    types: ["Click-the-Bug", "Diff Fix", "Scenarios"],
    recommendedFor: "Machine coding & live debugging rounds",
    stats: "Sandbox Verified",
  },
  {
    id: "projects",
    href: "/quiz/projects",
    title: "Project Interview Panel",
    badge: "Read & Learn",
    badgeTone: "good" as ChipTone,
    description:
      "Questions an interview panel will ask about your own resume projects and technologies, with model answers revealed below.",
    questionsCount: "15–25 Q&As / project",
    types: ["Architecture", "Trade-offs", "STAR"],
    recommendedFor: "Defending your project decisions & metrics",
    stats: "Grounded in Resume",
  },
];

export default function QuizPickerPage() {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Diagnostic scores summary
  const [stackKnowledgeScore, setStackKnowledgeScore] = useState<number | null>(null);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [projectUnderstandingScore, setProjectUnderstandingScore] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/quiz/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.confirmedSkills && data.confirmedSkills.length > 0) {
            setSkills(data.confirmedSkills);
          }
          if (data.projects && data.projects.length > 0) {
            setProjects(data.projects);
            setProjectUnderstandingScore(Math.min(100, Math.round(data.projects.length * 33.3)));
          }
        }

        // Fetch heatmap/diagnostic stats if available
        const heatRes = await fetch("/api/quiz/heatmap");
        if (heatRes.ok) {
          const heatData = await heatRes.json();
          if (heatData.accuracyRate !== undefined && heatData.totalAttempts > 0) {
            setStackKnowledgeScore(Math.round(heatData.accuracyRate));
            setReadinessScore(Math.min(100, Math.round(heatData.accuracyRate * 0.95 + 5)));
          }
        }
      } catch (err) {
        console.warn("Failed to load skills for picker:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="py-2 max-w-5xl mx-auto space-y-8 pb-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Chip k="MODULE" v="II" tone="accent" />
            <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
              Personalized Quizzes
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
            Interview Quizzes & Drills
          </h1>
          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
            Personalized interview prep grounded in your verified tech stack and resume projects.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            href="/quiz/heatmap"
            className="text-xs"
          >
            📊 Diagnostics
          </Button>
          <Button
            variant="primary"
            size="sm"
            href="/quiz/onboarding"
            className="text-xs"
          >
            ⚙️ Edit Stack
          </Button>
        </div>
      </div>

      {/* Compact Readiness Summary Row (Section 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard tone="subtle" padding="sm" className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Stack Knowledge
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text)] mt-0.5">
              {stackKnowledgeScore !== null ? `${stackKnowledgeScore}%` : "—"}
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-3)] px-2 py-0.5 rounded bg-[var(--glass-subtle)] border border-[var(--border)]">
            {stackKnowledgeScore !== null ? "Calibrated" : "Need 5 answers"}
          </span>
        </GlassCard>

        <GlassCard tone="subtle" padding="sm" className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Interview Readiness
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text)] mt-0.5">
              {readinessScore !== null ? `${readinessScore}%` : "—"}
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-3)] px-2 py-0.5 rounded bg-[var(--glass-subtle)] border border-[var(--border)]">
            {readinessScore !== null ? "Getting There" : "Take a drill"}
          </span>
        </GlassCard>

        <GlassCard tone="subtle" padding="sm" className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Project Understanding
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text)] mt-0.5">
              {projectUnderstandingScore !== null
                ? `${projectUnderstandingScore}%`
                : projects.length > 0
                ? `${projects.length} Projects`
                : "—"}
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-3)] px-2 py-0.5 rounded bg-[var(--glass-subtle)] border border-[var(--border)]">
            {projectUnderstandingScore !== null
              ? "Evaluated"
              : projects.length > 0
              ? "Panel Ready"
              : "Add in Wizard"}
          </span>
        </GlassCard>
      </div>

      {/* Active Stack Section (Single source of truth, honest empty state) */}
      <GlassCard tone="subtle" padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
            Active Verified Skills ({skills.length})
          </span>
          <Link
            href="/quiz/onboarding"
            className="text-[12px] font-mono text-[var(--accent-bright)] hover:underline font-semibold"
          >
            {skills.length > 0 ? "Edit Skills →" : "Add Skills →"}
          </Link>
        </div>

        {loading ? (
          <div className="py-2">
            <span className="text-xs text-[var(--text-3)] animate-pulse font-mono">
              Loading verified skills...
            </span>
          </div>
        ) : skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Chip
                key={s.name}
                k={s.level}
                v={s.name}
                tone="accent"
              />
            ))}
          </div>
        ) : (
          <div className="py-4 px-4 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--glass-subtle)] space-y-2">
            <div className="text-xs font-mono font-semibold text-[var(--text)]">
              No verified skills selected yet
            </div>
            <p className="text-xs text-[var(--text-3)] max-w-md mx-auto">
              Select your target role and stack chips or upload a resume to generate personalized interview drills.
            </p>
            <div className="pt-1">
              <Button href="/quiz/onboarding" variant="primary" size="sm">
                Configure Stack in Wizard →
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Mode Grid: The 4 Rebuilt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {QUIZ_MODES.map((mode) => (
          <GlassCard
            key={mode.id}
            tone="default"
            padding="lg"
            className="flex flex-col justify-between hover:border-[var(--border-strong)] transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                  {mode.questionsCount}
                </span>
                <Chip v={mode.badge} tone={mode.badgeTone} />
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text)] group-hover:text-[var(--accent-bright)] transition-colors">
                {mode.title}
              </h2>

              <p className="font-ui text-sm text-[var(--text-2)] leading-relaxed">
                {mode.description}
              </p>

              <div className="pt-2 flex flex-wrap gap-1.5">
                {mode.types.map((t) => (
                  <Chip
                    key={t}
                    v={t}
                    tone="default"
                    className="text-[10px]"
                  />
                ))}
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-3)] font-mono">
                {mode.stats}
              </span>
              <Button
                variant="primary"
                size="sm"
                href={mode.href}
              >
                Start Drill &rarr;
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
