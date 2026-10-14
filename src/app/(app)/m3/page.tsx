"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { getAllLessons } from "@/content/m3/lessons";
import { LessonPath } from "@/content/m3/lesson-schema";

const PATHS: Array<{ id: LessonPath; label: string }> = [
  { id: "ai", label: "AI & LLM Systems" },
  { id: "backend", label: "Backend & Distributed Systems" },
  { id: "frontend", label: "Frontend Architecture" },
  { id: "devops", label: "DevOps & Cloud" },
  { id: "foundations", label: "Core CS Foundations" },
];

export default function Module3DiscoveryPage() {
  const allLessons = getAllLessons();
  const [selectedPath, setSelectedPath] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLessons = allLessons.filter((l) => {
    const matchesPath =
      selectedPath === "all" ||
      l.paths.includes(selectedPath as LessonPath);
    const matchesSearch =
      searchQuery.trim() === "" ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.outcome.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPath && matchesSearch;
  });

  return (
    <div className="py-2 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Chip k="MODULE" v="III" tone="accent" />
            <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
              15-Minute Tech Bites
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
            Learn Tech in 15 Minutes
          </h1>
          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
            Build solid mental models from unfamiliar to interview-ready through 5 interactive stages.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button variant="primary" size="sm" href="/m3/retest">
            Retest Queue &rarr;
          </Button>
          <Button variant="secondary" size="sm" href="/progress">
            Mastery Progress
          </Button>
        </div>
      </div>

      {/* Spaced Repetition Notification Banner */}
      <GlassCard
        tone="default"
        padding="md"
        className="flex flex-col sm:flex-row items-center justify-between gap-4 rim shadow-[0_0_24px_-8px_rgba(94,78,240,0.35)]"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-bright)] font-semibold">
              SM-2 Spaced Retrieval Engine
            </span>
          </div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text)]">
            Solidify Concepts at +3 and +10 Days
          </h2>
          <p className="font-ui text-xs sm:text-sm text-[var(--text-2)]">
            Complete active recall checkpoints to graduate lessons from Learning to Mastered status.
          </p>
        </div>
        <Button variant="secondary" size="sm" href="/m3/retest" className="shrink-0">
          Open Retest Queue &rarr;
        </Button>
      </GlassCard>

      {/* 4 Choices Discovery Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Choice 1: Continue Learning */}
        <GlassCard
          tone="default"
          padding="md"
          className="space-y-2 border-l-[3px] border-l-[var(--accent)] flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-bright)] font-semibold">
              1. Continue Learning
            </span>
            <h3 className="font-display text-sm font-bold text-[var(--text)] mt-1">
              Resume Active Track
            </h3>
            <p className="font-ui text-xs text-[var(--text-2)] mt-0.5 leading-snug">
              Jump directly into your next uncompleted 15-minute bite.
            </p>
          </div>
          <Link
            href={`/m3/lesson/${allLessons[0]?.id || "caching-fundamentals"}`}
            className="text-xs font-mono font-bold text-[var(--accent-bright)] hover:underline pt-2 block"
          >
            Start {allLessons[0]?.title} &rarr;
          </Link>
        </GlassCard>

        {/* Choice 2: Learn for Your Role */}
        <GlassCard
          tone="default"
          padding="md"
          className="space-y-2 flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              2. For Your Role
            </span>
            <h3 className="font-display text-sm font-bold text-[var(--text)] mt-1">
              Targeted Career Paths
            </h3>
            <p className="font-ui text-xs text-[var(--text-2)] mt-0.5 leading-snug">
              AI engineering, high-throughput backend, or systems.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPath("backend")}
            className="text-xs font-mono font-bold text-[var(--accent-bright)] hover:underline text-left pt-2 block cursor-pointer"
          >
            Filter Backend Path &rarr;
          </button>
        </GlassCard>

        {/* Choice 3: Explore a Technology */}
        <GlassCard
          tone="default"
          padding="md"
          className="space-y-2 flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              3. Explore Tech
            </span>
            <h3 className="font-display text-sm font-bold text-[var(--text)] mt-1">
              Search Concepts
            </h3>
            <p className="font-ui text-xs text-[var(--text-2)] mt-0.5 leading-snug">
              Lookup RAG, Caching, Vectors, or Concurrency models.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-3)] pt-2 block">
            Use search bar below ↓
          </span>
        </GlassCard>

        {/* Choice 4: What's New */}
        <GlassCard
          tone="default"
          padding="md"
          className="space-y-2 flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
              4. What&apos;s New
            </span>
            <h3 className="font-display text-sm font-bold text-[var(--text)] mt-1">
              Curated Lessons
            </h3>
            <p className="font-ui text-xs text-[var(--text-2)] mt-0.5 leading-snug">
              RAG 5-stage interactive pipeline &amp; Cache-aside simulator.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--state-done)] font-bold pt-2 block">
            ✓ Updated for 2026
          </span>
        </GlassCard>
      </div>

      {/* Path Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedPath("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedPath === "all"
                ? "bg-[var(--accent-grad)] text-white font-bold shadow-[0_0_12px_rgba(94,78,240,0.5)]"
                : "bg-[var(--glass)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]"
            }`}
          >
            All Tracks
          </button>
          {PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPath(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedPath === p.id
                  ? "bg-[var(--accent-grad)] text-white font-bold shadow-[0_0_12px_rgba(94,78,240,0.5)]"
                  : "bg-[var(--glass)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search lessons (e.g. RAG, Cache)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--glass)] text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--accent-bright)] min-w-[240px]"
        />
      </div>

      {/* Lessons List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredLessons.map((lesson) => (
          <GlassCard
            key={lesson.id}
            tone="default"
            padding="lg"
            className="flex flex-col justify-between space-y-4 hover:border-[var(--border-strong)] transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {lesson.paths.map((p) => (
                    <Chip key={p} v={p.toUpperCase()} tone="accent" />
                  ))}
                </div>
                <Chip v="15 min" tone="default" />
              </div>

              <h2 className="font-display text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent-bright)] transition-colors">
                {lesson.title}
              </h2>

              <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                {lesson.outcome}
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[var(--text-3)]">
                <span>5 Stages:</span>
                <span className="text-[var(--accent-bright)]">
                  Why → Mental Model → See It → Try It → Recall
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--state-done)] font-semibold">
                +{lesson.xpAward} XP on Recall Pass
              </span>
              <Button
                variant="primary"
                size="sm"
                href={`/m3/lesson/${lesson.id}`}
              >
                Start Lesson &rarr;
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
