import React from "react";
import { GlassCard } from "./glass-card";
import { Chip } from "./chip";

export interface GlowTileProps {
  numeral: string | number;
  label?: string;
  unlocked?: boolean;
  tint?: "accent" | "good" | "bad" | "m1" | "m2" | "m3" | "m4";
  className?: string;
  onClick?: () => void;
}

export function GlowTile({
  numeral,
  label,
  unlocked = true,
  tint = "good",
  className = "",
  onClick,
}: GlowTileProps) {
  const rimClass = unlocked
    ? tint === "good"
      ? "rim rim--good"
      : "rim"
    : "";

  return (
    <div
      onClick={onClick}
      data-locked={!unlocked}
      className={`glow-tile ${rimClass} cursor-pointer transition-transform hover:scale-[1.02] p-4 flex flex-col items-center justify-between aspect-square ${className}`}
    >
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-[var(--text-3)]">
        {unlocked ? (
          <span className="text-[var(--state-done)] font-bold">✓ UNLOCKED</span>
        ) : (
          <span className="opacity-60">🔒 LOCKED</span>
        )}
      </div>

      <span
        className={`font-display font-extrabold text-[36px] sm:text-[44px] ${
          unlocked ? "text-[var(--text)]" : "text-[var(--text-3)] opacity-40"
        }`}
      >
        {numeral}
      </span>

      {label && (
        <span className="text-[12px] font-ui font-medium text-[var(--text-2)] text-center line-clamp-1">
          {label}
        </span>
      )}
    </div>
  );
}

export interface MilestoneCardProps {
  icon?: React.ReactNode;
  title: string;
  condition: string;
  progress?: string;
  unlocked: boolean;
  xp?: string;
  className?: string;
}

export function MilestoneCard({
  icon,
  title,
  condition,
  progress,
  unlocked,
  xp,
  className = "",
}: MilestoneCardProps) {
  return (
    <GlassCard
      tone="default"
      padding="md"
      className={`space-y-3 flex flex-col justify-between transition-all duration-200 ${
        unlocked
          ? "rim rim--good shadow-[0_0_24px_-8px_rgba(52,211,153,0.35)]"
          : "opacity-60"
      } ${className}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div
            className={`w-9 h-9 rounded-[12px] flex items-center justify-center border transition-all ${
              unlocked
                ? "bg-[var(--good-bg)] text-[var(--good-fg)] border-[var(--state-done)] shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                : "bg-[var(--glass-subtle)] text-[var(--text-3)] border-[var(--border)]"
            }`}
          >
            {icon || (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          {unlocked ? (
            <Chip v="Unlocked ✓" tone="good" className="text-[11px] font-semibold" />
          ) : (
            <Chip v="Locked 🔒" tone="default" className="text-[11px]" />
          )}
        </div>

        <div>
          <h4 className="text-[15px] sm:text-[16px] font-bold text-[var(--text)] font-ui">{title}</h4>
          <p className="text-[12px] sm:text-[13px] text-[var(--text-2)] mt-0.5 leading-snug">{condition}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-3)]">
        <span>{progress || (unlocked ? "Completed" : "Not started")}</span>
        {xp && <span className="font-semibold text-[var(--accent-bright)]">{xp}</span>}
      </div>
    </GlassCard>
  );
}
