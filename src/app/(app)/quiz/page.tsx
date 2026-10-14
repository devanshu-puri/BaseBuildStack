"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip, ChipTone } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

interface UserSkill {
  name: string;
  level: string;
  confirmed: boolean;
}

const QUIZ_MODES = [
  {
    id: "quick",
    title: "Quick Drill",
    badge: "5 mins",
    badgeTone: "accent" as ChipTone,
    description: "5 rapid-fire questions across your active skills. Ideal for a quick daily streak session.",
    questionsCount: "5 questions",
    types: ["MCQ", "Output", "Debug"],
    recommendedFor: "Daily warm-up & speed calibration",
  },
  {
    id: "fundamentals",
    title: "Core Fundamentals",
    badge: "7 mins",
    badgeTone: "default" as ChipTone,
    description: "Deep dive into language mechanics, concurrency rules, memory, and runtime internals.",
    questionsCount: "10 questions",
    types: ["MCQ", "Approach"],
    recommendedFor: "Interview conceptual rounds",
  },
  {
    id: "practical",
    title: "Practical & Debugging",
    badge: "10 mins",
    badgeTone: "accent" as ChipTone,
    description: "Code output prediction, spot-the-bug challenges, and system trade-off scenarios.",
    questionsCount: "10 questions",
    types: ["Output", "Debug", "Approach"],
    recommendedFor: "Technical machine coding rounds",
  },
  {
    id: "weak_area",
    title: "Weak-Area Adaptive",
    badge: "Adaptive",
    badgeTone: "bad" as ChipTone,
    description: "Pulls from your mistake logs and lowest accuracy skills to close knowledge gaps.",
    questionsCount: "5–10 questions",
    types: ["Targeted", "Mistake Queue"],
    recommendedFor: "Eliminating blind spots before interviews",
  },
];

export default function QuizPickerPage() {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/quiz/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.confirmedSkills && data.confirmedSkills.length > 0) {
            setSkills(data.confirmedSkills);
          }
        }
      } catch (err) {
        console.warn("Failed to load skills for picker:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="py-2 max-w-5xl mx-auto space-y-8">
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
            Select Quiz Mode
          </h1>
          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
            Deterministic interview drills tailored to your verified stack with 5-part feedback.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          href="/quiz/onboarding"
          icon={<span>⚙</span>}
          className="self-start sm:self-auto"
        >
          Customize Stack
        </Button>
      </div>

      {/* Active Stack Section */}
      <GlassCard tone="subtle" padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
            Active Verified Skills ({skills.length > 0 ? skills.length : "Default Stack"})
          </span>
          <Link
            href="/quiz/onboarding"
            className="text-[12px] font-mono text-[var(--accent-bright)] hover:underline font-semibold"
          >
            Edit Skills &rarr;
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {loading ? (
            <span className="text-xs text-[var(--text-3)] animate-pulse font-mono">
              Loading verified skills...
            </span>
          ) : skills.length > 0 ? (
            skills.map((s) => (
              <Chip
                key={s.name}
                k={s.level}
                v={s.name}
                tone="accent"
              />
            ))
          ) : (
            ["React", "TypeScript", "Node.js", "PostgreSQL", "System Design", "Redis", "Docker"].map(
              (name) => (
                <Chip
                  key={name}
                  v={name}
                  tone="default"
                />
              )
            )
          )}
        </div>
      </GlassCard>

      {/* Mode Grid */}
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
              <span className="text-xs text-[var(--text-3)] font-ui">
                {mode.recommendedFor}
              </span>
              <Button
                variant="primary"
                size="sm"
                href={`/quiz/${mode.id}`}
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
