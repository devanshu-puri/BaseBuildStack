import React from "react";

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const heightClass = size === "sm" ? "h-1.5" : "h-2 sm:h-2.5";

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-mono text-[var(--text-2)]">
          {label && <span>{label}</span>}
          <span className="tabular-nums font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`bar ${heightClass} w-full rounded-full bg-[var(--glass)] border border-[var(--border)] overflow-hidden`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i
          style={{ width: `${percentage}%` }}
          className="transition-all duration-500 ease-out"
        />
      </div>
    </div>
  );
}
