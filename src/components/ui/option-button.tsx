"use client";

import React from "react";

export type OptionState = "idle" | "selected" | "correct" | "incorrect" | "disabled";

export interface OptionButtonProps {
  label: string;
  prefix?: string;
  state?: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function OptionButton({
  label,
  prefix,
  state = "idle",
  onClick,
  disabled = false,
  className = "",
}: OptionButtonProps) {
  const stateStyles = {
    idle: "bg-[var(--glass)] border-[var(--border)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--glass-strong)]",
    selected:
      "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border-[var(--accent)] text-[var(--text)] font-semibold shadow-[0_0_20px_-4px_rgba(94,78,240,0.5)] inset-shadow-sm",
    correct:
      "bg-[var(--good-bg)] border-[var(--aurora-mint)] text-[var(--good-fg)] font-semibold shadow-[0_0_22px_-4px_rgba(46,230,197,0.5)]",
    incorrect:
      "bg-[var(--bad-bg)] border-[#FF6B6B] text-[var(--bad-fg)] font-semibold shadow-[0_0_22px_-4px_rgba(255,107,107,0.45)]",
    disabled:
      "bg-[var(--glass-subtle)] border-transparent text-[var(--text-3)] cursor-not-allowed opacity-50",
  }[state];

  const prefixStyles = {
    idle: "bg-[var(--glass-subtle)] text-[var(--text-2)] border border-[var(--border)]",
    selected: "bg-[var(--accent)] text-white font-bold shadow-[0_0_10px_rgba(94,78,240,0.6)]",
    correct: "bg-[var(--aurora-mint)] text-[#07080F] font-bold shadow-[0_0_10px_rgba(46,230,197,0.6)]",
    incorrect: "bg-[#FF6B6B] text-white font-bold shadow-[0_0_10px_rgba(255,107,107,0.6)]",
    disabled: "bg-[var(--glass-subtle)] text-[var(--text-3)]",
  }[state];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "disabled"}
      className={`w-full min-h-[50px] p-3.5 rounded-[16px] border text-left flex items-center gap-3.5 transition-all duration-200 cursor-pointer backdrop-blur-md focus-visible:outline-2 focus-visible:outline-[var(--accent-bright)] ${stateStyles} ${className}`}
    >
      {prefix && (
        <span
          className={`w-7 h-7 rounded-[8px] flex items-center justify-center font-mono text-[12px] font-bold shrink-0 transition-colors ${prefixStyles}`}
        >
          {prefix}
        </span>
      )}
      <span className="text-[13px] sm:text-[14px] flex-1 leading-snug">{label}</span>
      {state === "correct" && (
        <span className="w-5 h-5 rounded-full bg-[var(--aurora-mint)] text-[#07080F] font-bold text-[12px] flex items-center justify-center shrink-0" aria-label="Correct">
          ✓
        </span>
      )}
      {state === "incorrect" && (
        <span className="w-5 h-5 rounded-full bg-[#FF6B6B] text-white font-bold text-[12px] flex items-center justify-center shrink-0" aria-label="Incorrect">
          ✗
        </span>
      )}
    </button>
  );
}
