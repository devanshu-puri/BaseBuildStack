import React from "react";

export type ChipTone =
  | "default"
  | "accent"
  | "muted"
  | "good"
  | "bad"
  | "running"
  | "waiting"
  | "done"
  | "repeat"
  | "pro"
  // Legacy category tint mappings
  | "tint1"
  | "tint2"
  | "tint3"
  | "tint4";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  k?: string;
  v?: React.ReactNode;
  tone?: ChipTone;
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<ChipTone, string> = {
  default: "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text)]",
  accent: "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[var(--accent-bright)]",
  muted: "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)]",
  good: "bg-[var(--good-bg)] border-[color-mix(in_srgb,var(--state-done)_30%,transparent)] text-[var(--good-fg)]",
  bad: "bg-[var(--bad-bg)] border-[color-mix(in_srgb,#FF6B6B_30%,transparent)] text-[var(--bad-fg)]",
  running: "bg-[color-mix(in_srgb,var(--state-running)_16%,transparent)] border-[color-mix(in_srgb,var(--state-running)_35%,transparent)] text-[var(--state-running)]",
  waiting: "bg-[color-mix(in_srgb,var(--state-waiting)_16%,transparent)] border-[color-mix(in_srgb,var(--state-waiting)_35%,transparent)] text-[var(--state-waiting)]",
  done: "bg-[color-mix(in_srgb,var(--state-done)_16%,transparent)] border-[color-mix(in_srgb,var(--state-done)_35%,transparent)] text-[var(--state-done)]",
  repeat: "bg-[color-mix(in_srgb,var(--state-repeat)_16%,transparent)] border-[color-mix(in_srgb,var(--state-repeat)_35%,transparent)] text-[var(--state-repeat)]",
  pro: "bg-[var(--glass)] border-[color-mix(in_srgb,var(--aurora-azure)_50%,var(--aurora-violet))] text-[var(--accent-bright)] shadow-[0_0_12px_rgba(43,183,255,0.25)]",
  // Legacy tint compatibility mapped to aurora category tints
  tint1: "bg-[color-mix(in_srgb,var(--aurora-violet)_16%,transparent)] border-[color-mix(in_srgb,var(--aurora-violet)_35%,transparent)] text-[var(--aurora-violet)]",
  tint2: "bg-[color-mix(in_srgb,var(--state-running)_16%,transparent)] border-[color-mix(in_srgb,var(--state-running)_35%,transparent)] text-[var(--state-running)]",
  tint3: "bg-[color-mix(in_srgb,var(--aurora-azure)_16%,transparent)] border-[color-mix(in_srgb,var(--aurora-azure)_35%,transparent)] text-[var(--aurora-azure)]",
  tint4: "bg-[color-mix(in_srgb,var(--aurora-mint)_16%,transparent)] border-[color-mix(in_srgb,var(--aurora-mint)_35%,transparent)] text-[var(--aurora-mint)]",
};

export function Chip({
  k,
  v,
  tone = "default",
  className = "",
  children,
  ...props
}: ChipProps) {
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.default;

  return (
    <span
      className={`chip ${toneClass} ${className}`}
      {...props}
    >
      {k && <span className="k text-[var(--text-3)] font-mono">{k}</span>}
      {v !== undefined && <span className="font-mono text-[var(--text)]">{v}</span>}
      {children}
    </span>
  );
}
