import React from "react";
import { GlassCard } from "./glass-card";
import { Chip } from "./chip";

export interface FeedbackCardProps {
  verdict: "correct" | "incorrect";
  why: string;
  distractors?: string[];
  takeaway: string;
  followUp?: string;
  evidence?: {
    path: string;
    lines: string;
  };
  className?: string;
}

export function FeedbackCard({
  verdict,
  why,
  distractors = [],
  takeaway,
  followUp,
  evidence,
  className = "",
}: FeedbackCardProps) {
  const isCorrect = verdict === "correct";

  return (
    <GlassCard
      tone="default"
      padding="lg"
      className={`space-y-4 border-l-[3px] backdrop-blur-xl ${
        isCorrect
          ? "border-l-[var(--state-done)] shadow-[inset_0_0_24px_rgba(52,211,153,0.06),-8px_0_24px_-8px_rgba(52,211,153,0.4)]"
          : "border-l-[#FF6B6B] shadow-[inset_0_0_24px_rgba(255,107,107,0.06),-8px_0_24px_-8px_rgba(255,107,107,0.35)]"
      } ${className}`}
    >
      {/* 1. Verdict Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[12px] shadow-sm ${
              isCorrect
                ? "bg-[var(--state-done)] text-[#07080F]"
                : "bg-[#FF6B6B] text-white"
            }`}
          >
            {isCorrect ? "✓" : "✗"}
          </span>
          <span className="text-[15px] sm:text-[16px] font-bold text-[var(--text)] font-ui">
            {isCorrect ? "Correct Solution" : "Incorrect Answer"}
          </span>
        </div>
        <Chip
          v={isCorrect ? "+25 XP" : "Saved to Mistakes"}
          tone={isCorrect ? "good" : "bad"}
        />
      </div>

      {/* 2. Why it's correct / incorrect */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
          Why
        </div>
        <p className="text-[13px] sm:text-[14px] text-[var(--text-2)] leading-relaxed font-ui">
          {why}
        </p>
      </div>

      {/* 3. Distractor Takedowns (if provided) */}
      {distractors.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
            Distractor Takedown
          </div>
          <ul className="space-y-1.5 text-[12px] sm:text-[13px] text-[var(--text-2)] list-disc pl-4 font-ui">
            {distractors.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Core Takeaway in subtle inner block */}
      <div className="p-3.5 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)] space-y-1">
        <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[var(--accent-bright)] block">
          Key Takeaway
        </span>
        <p className="text-[13px] text-[var(--text)] font-medium font-ui leading-snug">
          {takeaway}
        </p>
      </div>

      {/* 5. Likely Follow-Up */}
      {followUp && (
        <div className="p-3.5 rounded-[16px] bg-[rgba(139,124,255,0.06)] border border-[rgba(139,124,255,0.2)] space-y-1">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[var(--accent-bright)] block">
            Likely Interview Follow-Up
          </span>
          <p className="text-[13px] text-[var(--text-2)] font-ui leading-snug">
            {followUp}
          </p>
        </div>
      )}

      {/* 5. Evidence (if present) */}
      {evidence && (
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-3)]">
          <span>Evidence: {evidence.path}</span>
          <span>Lines {evidence.lines}</span>
        </div>
      )}
    </GlassCard>
  );
}
