import React from "react";

export interface StatBlockProps {
  label?: string;
  caption?: string;
  value: React.ReactNode;
  delta?: string | number;
  deltaTone?: "good" | "bad" | "neutral";
  gradient?: boolean;
  aurora?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_NUMERALS: Record<string, string> = {
  sm: "text-[24px] sm:text-[28px]",
  md: "text-[32px] sm:text-[40px]",
  lg: "text-[48px] sm:text-[56px]",
  xl: "numeral text-[56px] sm:text-[72px] lg:text-[88px]",
};

export function StatBlock({
  label,
  caption,
  value,
  delta,
  deltaTone = "good",
  gradient = false,
  aurora = false,
  size = "md",
  className = "",
}: StatBlockProps) {
  const displayLabel = label || caption || "";
  const sizeClass = SIZE_NUMERALS[size] || SIZE_NUMERALS.md;
  const useAurora = gradient || aurora;

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {/* Caption / eyebrow: mono meta uppercase */}
      {displayLabel && (
        <span className="text-[11px] sm:text-[12px] font-mono tracking-wider uppercase text-[var(--muted)] font-semibold">
          {displayLabel}
        </span>
      )}

      {/* Numeral: display font, tabular */}
      <div className="flex items-baseline gap-2.5">
        <span
          className={`font-display font-extrabold tracking-tight tabular-nums leading-none ${sizeClass} ${
            useAurora ? "numeral--aurora" : "text-[var(--fg)]"
          }`}
        >
          {value}
        </span>

        {/* Delta chip */}
        {delta !== undefined && (
          <span
            className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-[6px] ${
              deltaTone === "good"
                ? "bg-[var(--state-good-bg)] text-[var(--state-good-fg)]"
                : deltaTone === "bad"
                ? "bg-[var(--state-bad-bg)] text-[var(--state-bad-fg)]"
                : "bg-[var(--glass-subtle)] text-[var(--muted)]"
            }`}
          >
            {typeof delta === "number" && delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  );
}
