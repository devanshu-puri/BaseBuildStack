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
  size?: "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "sm:max-w-[420px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[760px] md:max-w-[860px]",
  xl: "sm:max-w-[920px] md:max-w-[1040px]",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
  size = "md",
  padding = "lg",
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

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

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

      {/* Surface: Bottom sheet on mobile (radius 28 top), centered responsive dialog on sm+ */}
      <GlassCard
        tone="strong"
        padding={padding}
        className={`relative z-10 w-full max-h-[92vh] sm:max-h-[88vh] overflow-y-auto ${sizeClass} rounded-t-[28px] sm:rounded-[24px] border border-[var(--border-strong)] shadow-[0_24px_64px_rgba(0,0,0,0.7)] ${className}`}
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden flex justify-center pb-2 pt-1" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header / Close button area */}
        {(title || description) ? (
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
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[var(--glass)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-strong)] flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent-bright)] shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div>{children}</div>
      </GlassCard>
    </div>
  );
}

export { Dialog as Sheet };
