import React from "react";
import { GlassCard } from "./glass-card";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  eventId?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this view.",
  eventId,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <GlassCard
      tone="default"
      padding="lg"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-4 max-w-md mx-auto border-[var(--border-strong)] ${className}`}
    >
      {/* Bad state rim icon tile */}
      <div
        className="w-14 h-14 rounded-[18px] bg-[var(--surface-solid)] border border-[color-mix(in_srgb,#FF6B6B_40%,transparent)] flex items-center justify-center text-[var(--bad-fg)]"
        style={{
          boxShadow: "0 0 24px -4px rgba(255, 107, 107, 0.35)",
        }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-[var(--text)]">
          {title}
        </h3>
        <p className="font-ui text-[13px] sm:text-[14px] text-[var(--text-2)] max-w-xs">
          {message}
        </p>
        {eventId && (
          <p className="font-mono text-[11px] text-[var(--text-3)] pt-1">
            Event ID: {eventId}
          </p>
        )}
      </div>

      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </GlassCard>
  );
}
