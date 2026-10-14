import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export function ContextPanel() {
  return (
    <aside
      aria-label="Daily context and review panel"
      className="hidden xl:flex w-[320px] shrink-0 flex-col gap-4 p-5 border-l border-[var(--border)] bg-[var(--bg-base)]/50 backdrop-blur-xl"
    >
      <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold px-1">
        Daily Focus
      </div>

      {/* 1. Streak Card */}
      <GlassCard tone="default" padding="sm" className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--text)] font-ui">Current Streak</span>
          <Chip k="DAYS" v="4" tone="accent" />
        </div>
        <p className="text-[12px] text-[var(--text-2)] leading-snug">
          Complete today&apos;s Mind Sprint to extend your streak to 5 days.
        </p>
      </GlassCard>

      {/* 2. Today's Mind Sprint Card (Accent Rim) */}
      <GlassCard
        tone="default"
        padding="md"
        className="space-y-3.5 rim shadow-[0_0_24px_-8px_rgba(94,78,240,0.4)] border-[var(--accent)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-[var(--accent-bright)] font-semibold">
            Daily Drill
          </span>
          <Chip v="5 MIN" tone="done" />
        </div>
        <div>
          <h4 className="font-display text-[16px] font-bold text-[var(--text)]">Today&apos;s Mind Sprint</h4>
          <p className="text-[12px] text-[var(--text-2)] mt-1 leading-snug">
            5 quick items: pattern, logic deduction, memory recall, numerical, tricky.
          </p>
        </div>
        <Button variant="primary" size="sm" href="/m4/sprint" className="w-full text-center">
          Start Mind Sprint
        </Button>
      </GlassCard>

      {/* 3. Next Up Recommendation */}
      <GlassCard tone="default" padding="sm" className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[var(--text)] font-ui">Recommended Bite</span>
          <Chip v="M3" tone="tint3" />
        </div>
        <div>
          <h5 className="text-[13px] font-medium text-[var(--text)] font-ui leading-snug">
            RAG (Retrieval-Augmented Gen)
          </h5>
          <p className="text-[11px] text-[var(--text-3)] mt-0.5 leading-snug">
            15-minute interactive 5-stage lesson with clickable architecture diagram.
          </p>
        </div>
        <Link
          href="/m3/lesson/rag-pipeline"
          className="text-[12px] font-semibold text-[var(--accent-bright)] hover:underline inline-flex items-center gap-1 cursor-pointer pt-0.5"
        >
          <span>Continue Lesson</span>
          <span>&rarr;</span>
        </Link>
      </GlassCard>

      {/* 4. Due Reviews Card */}
      <GlassCard tone="subtle" padding="sm" className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[var(--text)] font-ui">Due for Recall</span>
          <Chip v="3 CARDS" tone="bad" />
        </div>
        <p className="text-[11px] text-[var(--text-3)] leading-snug">
          SM-2 algorithm scheduled 3 Pattern Blitz cards for review today.
        </p>
        <Link
          href="/dsa/blitz"
          className="text-[11px] font-semibold text-[var(--accent-bright)] hover:underline inline-block pt-1 cursor-pointer"
        >
          Review Cards Now &rarr;
        </Link>
      </GlassCard>
    </aside>
  );
}
