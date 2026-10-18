"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import { usePricingModal } from "@/components/payments/pricing-context";

export interface TopBarProps {
  title?: string;
  showBack?: boolean;
}

export function TopBar({ title, showBack = false }: TopBarProps) {
  const pathname = usePathname() || "";
  const { openPricingModal, isPro, streak } = usePricingModal();

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[#0d0f17]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="w-9 h-9 rounded-xl border border-white/12 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-black/30 bg-[#1a1c26] text-white hover:text-white hover:border-white/25 hover:bg-[#222533] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.35)] transition-all flex items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-purple-400"
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
        ) : (
          <Link href="/home" className="sm:hidden flex items-center justify-center">
            <AnimatedLogo size={30} />
          </Link>
        )}
        <h1 className="font-display text-[17px] sm:text-[19px] font-bold text-[var(--text)] tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pro Status / Upgrade Pill (Highlighted on mobile & desktop) */}
        {isPro ? (
          <button
            type="button"
            onClick={() => openPricingModal()}
            title="Pro Membership Active - Click to view perks"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/25 via-emerald-950/40 to-black/40 text-xs font-mono font-bold text-white shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-extrabold tracking-wide">PRO</span>
            <span className="text-[10px] text-emerald-200/90 font-medium hidden xs:inline sm:inline">ACTIVE</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openPricingModal()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[var(--accent-bright)]/45 bg-gradient-to-b from-[var(--accent)]/35 to-[var(--accent)]/15 text-xs font-mono font-bold text-white shadow-[0_0_16px_rgba(94,78,240,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-[11px] text-[#C084FC]">⚡</span>
            <span>PRO</span>
            <span className="text-[10px] text-emerald-300 font-semibold hidden xs:inline sm:inline">₹9</span>
          </button>
        )}

        {/* Current Live Streak Indicator */}
        {streak > 0 ? (
          <div
            title={`Current Streak: ${streak} day${streak > 1 ? "s" : ""}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-black/30 bg-[#1c1815] text-xs font-mono font-semibold text-amber-400 shadow-[inset_0_1px_0_rgba(245,158,11,0.25),0_4px_12px_rgba(0,0,0,0.35)] select-none"
          >
            <span className="text-sm animate-pulse">🔥</span>
            <span className="font-bold text-white">{streak}</span>
            <span className="text-[10px] text-amber-400/80 uppercase tracking-wider hidden sm:inline">DAY STREAK</span>
          </div>
        ) : (
          <div
            title="Streak: 0 days (Complete a quiz or drill today to start your streak!)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/30 bg-[#16171f] text-xs font-mono font-semibold text-[var(--text-3)] shadow-sm select-none"
          >
            <span className="text-sm opacity-50">🔥</span>
            <span className="font-bold text-[var(--text-2)]">0</span>
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider hidden sm:inline">DAY STREAK</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Avatar link to Settings with conic aurora ring */}
        <Link
          href="/settings"
          aria-label="Settings profile"
          className="p-0.5 rounded-xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-black/30 bg-[#1a1c26] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.35)] hover:border-white/25 transition-all flex items-center justify-center focus-visible:outline-2 focus-visible:outline-purple-400"
        >
          <Avatar size="sm" name="User" />
        </Link>
      </div>
    </header>
  );
}
