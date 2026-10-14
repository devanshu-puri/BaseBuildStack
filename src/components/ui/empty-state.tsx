import React from "react";
import { GlassCard } from "./glass-card";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <GlassCard
      tone="default"
      padding="lg"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-4 max-w-md mx-auto ${className}`}
    >
      {/* Glow icon tile */}
      <div
        className="w-14 h-14 rounded-[18px] bg-[var(--surface-solid)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent-bright)]"
        style={{
          boxShadow: "0 0 24px -4px rgba(94, 78, 240, 0.4)",
        }}
      >
        {icon || (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-[var(--text)]">
          {title}
        </h3>
        <p className="font-ui text-[13px] sm:text-[14px] text-[var(--text-2)] max-w-xs">
          {description}
        </p>
      </div>

      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          href={action.href}
        >
          {action.label}
        </Button>
      )}
    </GlassCard>
  );
}
