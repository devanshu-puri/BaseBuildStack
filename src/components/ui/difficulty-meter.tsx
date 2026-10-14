import React from "react";

export type DifficultyLevel = 1 | 2 | 3;

export interface DifficultyMeterProps {
  level: DifficultyLevel;
  showLabel?: boolean;
  className?: string;
}

const LEVEL_META: Record<DifficultyLevel, { label: string; color: string; glow: string }> = {
  1: {
    label: "Easy",
    color: "var(--aurora-mint)",
    glow: "0 0 10px rgba(46,230,197,0.7)",
  },
  2: {
    label: "Medium",
    color: "var(--state-running)",
    glow: "0 0 10px rgba(255,181,71,0.7)",
  },
  3: {
    label: "Hard",
    color: "var(--aurora-rose)",
    glow: "0 0 10px rgba(255,95,162,0.7)",
  },
};

export function DifficultyMeter({
  level,
  showLabel = false,
  className = "",
}: DifficultyMeterProps) {
  const meta = LEVEL_META[level] || LEVEL_META[1];

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={`Difficulty: ${meta.label}`}
      aria-label={`Difficulty level ${level} of 3: ${meta.label}`}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {[1, 2, 3].map((pip) => {
          const isActive = pip <= level;
          return (
            <span
              key={pip}
              className="w-2 h-2 rounded-full transition-all duration-200"
              style={{
                backgroundColor: isActive ? meta.color : "var(--glass-strong)",
                border: `1px solid ${isActive ? meta.color : "var(--border)"}`,
                boxShadow: isActive ? meta.glow : "none",
              }}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-3)] font-medium">
          {meta.label}
        </span>
      )}
    </div>
  );
}
