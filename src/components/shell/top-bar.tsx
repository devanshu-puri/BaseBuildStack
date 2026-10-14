"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";

export interface TopBarProps {
  title?: string;
  showBack?: boolean;
}

export function TopBar({ title, showBack = false }: TopBarProps) {
  const pathname = usePathname() || "";

  const getPageTitle = () => {
    if (title) return title;
    if (pathname.includes("/home")) return "Home";
    if (pathname.includes("/progress")) return "Progress";
    if (pathname.includes("/bookmarks")) return "Bookmarks";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/dsa") || pathname.includes("/m1")) return "DSA Rounds";
    if (pathname.includes("/quiz") || pathname.includes("/m2")) return "Interview Quizzes";
    if (pathname.includes("/m3")) return "Tech Bites";
    if (pathname.includes("/m4")) return "Mind Sprint";
    return "BaseBuildStack";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[var(--bg-base)]/75 backdrop-blur-md border-b border-[var(--border)] transition-colors">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="p-2 rounded-full border border-[var(--border)] bg-[var(--glass)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent-bright)]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="font-display text-[17px] sm:text-[19px] font-bold text-[var(--text)] tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger on lg+ */}
        <button
          type="button"
          aria-label="Search"
          className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] text-[12px] text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>Search...</span>
          <kbd className="font-mono text-[10px] bg-[var(--glass-strong)] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-2)]">
            /
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Avatar link to Settings with conic aurora ring */}
        <Link
          href="/settings"
          aria-label="Settings profile"
          className="focus-visible:outline-2 focus-visible:outline-[var(--accent-bright)] rounded-full"
        >
          <Avatar size="sm" name="User" />
        </Link>
      </div>
    </header>
  );
}
