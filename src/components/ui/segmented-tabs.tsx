"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface SegmentedTabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedTabs({
  items,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedTabsProps) {
  return (
    <div className="max-w-full overflow-x-auto scrollbar-none py-1">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={`inline-flex items-center p-1 rounded-full bg-[var(--glass-subtle)] border border-[var(--border)] shrink-0 backdrop-blur-md ${className}`}
      >
        {items.map((tab) => {
          const isActive = tab.id === value;
          const sizeClasses =
            size === "sm"
              ? "px-3 py-1 text-[12px]"
              : "px-4 py-1.5 text-[13px] sm:text-[14px]";

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${sizeClasses} ${
                isActive
                  ? "bg-[var(--accent-grad)] text-[var(--on-accent)] font-semibold shadow-[0_4px_16px_rgba(94,78,240,0.45)] inset-shadow-sm"
                  : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-subtle)]"
              }`}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--glass)] text-[var(--text-3)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
