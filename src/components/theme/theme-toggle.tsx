"use client";

import React from "react";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light (Pearl)" : "dark"} theme`}
      title={`Switch to ${resolvedTheme === "dark" ? "light (Pearl)" : "dark"} theme`}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--glass)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-strong)] hover:border-[var(--border-strong)] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent-bright)] ${className}`}
    >
      {resolvedTheme === "dark" ? (
        // Sun icon for switching to light
        <svg
          className="w-4 h-4 transition-transform hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for switching to dark
        <svg
          className="w-4 h-4 transition-transform hover:-rotate-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
