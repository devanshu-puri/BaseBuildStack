"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getAllLessons } from "@/content/m3/lessons";
import { RetestDeckResult } from "@/lib/m3/retest-session";

export default function RetestQueuePage() {
  const [deck, setDeck] = useState<RetestDeckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const allLessons = getAllLessons();

  useEffect(() => {
    async function loadDeck() {
      try {
        const res = await fetch("/api/lessons/retest");
        const json = await res.json();
        if (json.ok && json.data) {
          setDeck(json.data);
        }
      } catch (err) {
        console.warn("Could not load retest deck from API, showing default curriculum:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDeck();
  }, []);

  const dueCount = deck?.stats.dueCount ?? 0;
  const upcomingCount = deck?.stats.upcomingCount ?? 0;
  const masteredCount = deck?.stats.masteredCount ?? 0;

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] py-6 sm:py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--brand-accent)] font-semibold">
              Module III • Spaced Repetition Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Mastery Retests &amp; Revision Queue
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Combat the forgetting curve. Concepts are re-tested at <strong>+3 days</strong> and <strong>+10 days</strong>. Passing both milestones certifies full mental model mastery.
          </p>
        </div>

        <Link
          href="/m3"
          className="px-3.5 py-2 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-accent)] transition-colors self-start sm:self-auto shrink-0"
        >
          ← Return to Tech Bites
        </Link>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card tone="default" padding="md" className="space-y-1 border-l-4 border-l-[var(--brand-accent)]">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Due for Retest
          </span>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {isLoading ? "..." : dueCount}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Ready for active recall assessment</p>
        </Card>

        <Card tone="default" padding="md" className="space-y-1 border-l-4 border-l-[var(--border-subtle)]">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Upcoming Checkpoints
          </span>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {isLoading ? "..." : upcomingCount}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Scheduled for later retrieval</p>
        </Card>

        <Card tone="default" padding="md" className="space-y-1 border-l-4 border-l-[var(--state-good-fg)]">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Mastered Topics
          </span>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            {isLoading ? "..." : masteredCount}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">+10 day milestone completed</p>
        </Card>
      </div>

      {/* Due for Retest Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Due Now for Assessment
            </h2>
            {dueCount > 0 && <Chip v={`${dueCount} Due`} tone="accent" />}
          </div>
        </div>

        {dueCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deck?.dueCards.map((card) => (
              <Card
                key={card.lessonId}
                tone="default"
                padding="lg"
                className="space-y-3 flex flex-col justify-between border-l-4 border-l-[var(--brand-accent)]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Chip
                      v={card.stage === "day3" ? "Day 3 Checkpoint (+3d)" : "Day 10 Mastery Final (+10d)"}
                      tone={card.stage === "day3" ? "accent" : "good"}
                      className="text-[11px]"
                    />
                    <span className="text-[11px] font-mono text-[var(--state-bad-fg)] font-semibold">
                      Due today
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {card.outcome}
                  </p>
                </div>

                <Link
                  href={`/m3/retest/${card.lessonId}`}
                  className="w-full py-2.5 rounded-[12px] bg-[var(--brand-accent)] text-[var(--text-on-accent)] font-bold text-xs text-center hover:opacity-90 transition-opacity block mt-2"
                >
                  Start Assessment →
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card tone="default" padding="lg" className="text-center py-8 space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-card-subtle)] flex items-center justify-center mx-auto text-base">
              ✓
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No Re-tests Due Today
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              You are completely caught up! Finish new Tech Bites lessons to schedule +3 day checkpoints, or launch a practice re-test below.
            </p>
          </Card>
        )}
      </section>

      {/* Upcoming Checkpoints */}
      {upcomingCount > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Upcoming Checkpoints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deck?.upcomingCards.map((card) => (
              <Card
                key={card.lessonId}
                tone="default"
                padding="md"
                className="space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {card.stage === "day3" ? "Checkpoint 1" : "Final Checkpoint"}
                    </span>
                    <Chip
                      v={`In ${Math.max(1, card.daysUntilDue)}d`}
                      tone="tint1"
                      className="text-[10px]"
                    />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {card.title}
                  </h4>
                </div>

                <Link
                  href={`/m3/retest/${card.lessonId}`}
                  className="text-xs font-semibold text-[var(--brand-accent)] hover:underline pt-1 block"
                >
                  Practice Early →
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Practice All Curated Curriculum Retests */}
      <section className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Self-Paced Practice Checkpoints
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            You can take or practice any lesson&apos;s spaced active-recall test at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allLessons.map((l) => (
            <Card
              key={l.id}
              tone="default"
              padding="md"
              className="space-y-2 flex flex-col justify-between hover:border-[var(--brand-accent)] transition-all"
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-accent)] font-semibold">
                  {l.paths[0]}
                </span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                  {l.title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                  {l.outcome}
                </p>
              </div>

              <Link
                href={`/m3/retest/${l.id}`}
                className="text-xs font-bold text-[var(--brand-accent)] hover:underline pt-2 block"
              >
                Take Re-test →
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
