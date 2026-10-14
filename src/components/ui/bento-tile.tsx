import React from "react";
import { GlassCard } from "./glass-card";

export interface BentoTileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  visual?: React.ReactNode;
  title: React.ReactNode;
  desc?: React.ReactNode;
  bezel?: boolean;
  tint?: "m1" | "m2" | "m3" | "m4" | string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  children?: React.ReactNode;
}

const SPAN_CLASSES: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

export function BentoTile({
  span = 6,
  visual,
  title,
  desc,
  bezel = true,
  tint,
  badge,
  footer,
  interactive = false,
  className = "",
  children,
  onClick,
  ...props
}: BentoTileProps) {
  const spanClass = SPAN_CLASSES[span] || SPAN_CLASSES[6];

  const content = (
    <GlassCard
      tone="default"
      tint={tint}
      interactive={interactive}
      onClick={onClick}
      padding="none"
      className={`flex flex-col h-full overflow-hidden ${className}`}
      {...props}
    >
      {/* Visual zone (top >= 55% / min 120px) */}
      {visual && (
        <div className="tile__visual flex items-center justify-center p-6 bg-[var(--glass-subtle)] border-b border-[var(--border)]">
          {visual}
        </div>
      )}

      {/* Content zone */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {badge && <div className="mb-2">{badge}</div>}
          <div className="tile__title">{title}</div>
          {desc && <div className="tile__desc">{desc}</div>}
        </div>

        {children}

        {footer && <div className="pt-2 border-t border-[var(--border)]">{footer}</div>}
      </div>
    </GlassCard>
  );

  if (bezel) {
    return <div className={`bezel ${spanClass}`}>{content}</div>;
  }

  return <div className={spanClass}>{content}</div>;
}
