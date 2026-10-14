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
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/12 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-black/30 bg-[#1a1c26] text-white hover:text-white hover:border-white/25 hover:bg-[#222533] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.35)] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-purple-400 active:scale-95 ${className}`}
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
