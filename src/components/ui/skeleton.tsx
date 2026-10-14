import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "card" | "text" | "circle" | "button";
}

export function Skeleton({
  variant = "card",
  className = "",
  ...props
}: SkeletonProps) {
  let baseStyle = "animate-pulse bg-[var(--glass-strong)] border border-[var(--border)]";

  if (variant === "text") {
    baseStyle += " h-4 rounded-[6px] w-full";
  } else if (variant === "circle") {
    baseStyle += " rounded-full w-10 h-10 shrink-0";
  } else if (variant === "button") {
    baseStyle += " h-11 rounded-full w-32";
  } else {
    baseStyle += " rounded-[24px] min-h-[140px]";
  }

  return <div className={`${baseStyle} ${className}`} aria-hidden="true" {...props} />;
}
