"use client";

import React, { useEffect } from "react";
import { GlassCard } from "./glass-card";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
}: DialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Scrim backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface: Bottom sheet on mobile (radius 28 top), centered max-w-[560px] dialog on sm+ */}
      <GlassCard
        tone="strong"
        padding="lg"
        className={`relative z-10 w-full max-h-[90vh] overflow-y-auto sm:max-w-[560px] rounded-t-[28px] sm:rounded-[24px] border border-[var(--border-strong)] shadow-[0_24px_64px_rgba(0,0,0,0.7)] ${className}`}
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden flex justify-center pb-3" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h2 className="font-display text-[20px] sm:text-[22px] font-bold text-[var(--text)] leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="font-ui text-[13px] sm:text-[14px] text-[var(--text-2)] mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[var(--glass)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-strong)] flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent-bright)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>{children}</div>
      </GlassCard>
    </div>
  );
}

export { Dialog as Sheet };
