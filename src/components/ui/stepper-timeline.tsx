"use client";

import React from "react";
import { GlassCard } from "./glass-card";

export interface StepItem {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "active" | "done";
}

export interface StepperTimelineProps {
  steps: StepItem[];
  currentStepId?: string;
  onSelect?: (stepId: string) => void;
  className?: string;
}

export function StepperTimeline({
  steps,
  onSelect,
  className = "",
}: StepperTimelineProps) {
  return (
    <div className={`relative space-y-3 pl-2 ${className}`}>
      {/* Continuous connecting line */}
      <div
        className="absolute left-[23px] top-6 bottom-6 w-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(180deg, var(--accent) 0%, var(--aurora-azure) 50%, var(--border) 100%)",
        }}
        aria-hidden="true"
      />

      {steps.map((step, idx) => {
        const isDone = step.status === "done";
        const isActive = step.status === "active";
        const isClickable = (isDone || isActive) && !!onSelect;

        return (
          <GlassCard
            key={step.id}
            tone={isActive ? "default" : isDone ? "subtle" : "solid"}
            padding="sm"
            onClick={() => isClickable && onSelect?.(step.id)}
            className={`relative flex items-start gap-3.5 transition-all duration-200 ${
              isClickable ? "cursor-pointer" : "cursor-default"
            } ${
              isActive
                ? "rim shadow-[0_0_24px_-8px_rgba(94,78,240,0.5)] border-[var(--accent)]"
                : isDone
                ? "border-[var(--border)]"
                : "opacity-50 border-transparent"
            }`}
          >
            {/* Step node indicator */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 z-10 transition-all ${
                isActive
                  ? "bg-[var(--accent)] text-white shadow-[0_0_14px_rgba(94,78,240,0.8)]"
                  : isDone
                  ? "bg-[var(--good-bg)] text-[var(--good-fg)] border border-[var(--state-done)] shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                  : "bg-[var(--glass-strong)] text-[var(--text-3)] border border-[var(--border)]"
              }`}
            >
              {isDone ? "✓" : idx + 1}
            </div>

            {/* Step text content */}
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-center justify-between">
                <span className={`text-[14px] font-ui font-semibold ${isActive ? "text-[var(--text)]" : "text-[var(--text-2)]"}`}>
                  {step.title}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-3)] uppercase tracking-wider">
                  {step.status}
                </span>
              </div>
              {step.description && (
                <p className="text-[12px] sm:text-[13px] text-[var(--text-2)] mt-0.5 font-ui line-clamp-2">
                  {step.description}
                </p>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
