import React from "react";

export interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showText?: boolean;
  centerContent?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  label,
  showText = true,
  centerContent,
  className = "",
}: ProgressRingProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedValue / 100) * circumference;
  const gradientId = React.useId();

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="50%" stopColor="var(--aurora-azure)" />
            <stop offset="100%" stopColor="var(--aurora-mint)" />
          </linearGradient>
        </defs>

        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Foreground aurora gradient circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ filter: "drop-shadow(0 0 6px rgba(43, 183, 255, 0.45))" }}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center content or percentage */}
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-[12px] font-bold text-[var(--text)]">
        {centerContent ? (
          centerContent
        ) : showText ? (
          <span>{Math.round(normalizedValue)}%</span>
        ) : null}
      </div>

      {label && (
        <span className="text-[11px] font-mono text-[var(--text-3)] mt-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
