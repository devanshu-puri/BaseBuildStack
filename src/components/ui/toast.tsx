"use client";

import React from "react";
import { GlassCard } from "./glass-card";

export type ToastTone = "info" | "good" | "bad";

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

const TONE_BORDER: Record<ToastTone, string> = {
  info: "border-l-4 border-l-[var(--accent)]",
  good: "border-l-4 border-l-[var(--state-done)]",
  bad: "border-l-4 border-l-[var(--bad-fg)]",
};

export function Toast({
  message,
  tone = "info",
  action,
  onDismiss,
  className = "",
}: ToastProps) {
  return (
    <GlassCard
      tone="strong"
      padding="sm"
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm flex items-center justify-between gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] ${TONE_BORDER[tone]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="font-ui text-[13px] sm:text-[14px] text-[var(--text)] font-medium">
        {message}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-[12px] font-mono uppercase font-bold text-[var(--accent-bright)] hover:underline"
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss toast"
            className="w-6 h-6 rounded-full hover:bg-[var(--glass)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </GlassCard>
  );
}
