"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import SpecularButton from "@/components/ui/specular-button";
import { AnimatedLogo } from "@/components/ui/animated-logo";

const primaryNav = [
  {
    name: "Home",
    href: "/home",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Progress",
    href: "/progress",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Bookmarks",
    href: "/bookmarks",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
];

const modules = [
  { name: "DSA Rounds", count: "0/60", href: "/dsa", tag: "M1" },
  { name: "Interview Quizzes", count: "0/10", href: "/quiz", tag: "M2" },
  { name: "Tech Bites", count: "0/8", href: "/m3", tag: "M3" },
  { name: "Mind Sprint", count: "Daily", href: "/m4", tag: "M4" },
];

export function SidebarNav() {
  const pathname = usePathname() || "";

  return (
    <aside
      aria-label="Desktop primary navigation"
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[248px] flex-col justify-between p-4 bg-[var(--glass-strong)] backdrop-blur-2xl border-r border-[var(--border)] z-40"
    >
      <div className="space-y-6">
        {/* Brand header */}
        <Link href="/home" className="flex items-center gap-3 px-2 py-1 group">
          <AnimatedLogo size={34} />
          <div>
            <span className="font-display font-extrabold text-[17px] text-[var(--text)] tracking-tight">
              BaseBuild<span className="font-normal text-[var(--text-3)]">Stack</span>
            </span>
          </div>
        </Link>

        {/* Primary nav list */}
        <nav aria-label="Main menu" className="space-y-1">
          {primaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[13px] font-medium transition-all ${
                  isActive
                    ? ""
                    : "text-[var(--text-2)] hover:bg-[var(--glass-subtle)] hover:text-[var(--text)]"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Module categories */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <div className="px-3 text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
            Modules
          </div>
          <div className="space-y-1">
            {modules.map((m) => {
              const isActive = pathname.startsWith(m.href);
              return (
                <Link
                  key={m.tag}
                  href={m.href}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-[12px] text-[13px] transition-colors ${
                    isActive
                      ? "bg-[var(--glass)] text-[var(--accent-bright)] font-semibold border border-[var(--border-strong)]"
                      : "text-[var(--text-2)] hover:bg-[var(--glass-subtle)] hover:text-[var(--text)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] text-[var(--text-3)] font-semibold">{m.tag}</span>
                    <span>{m.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-3)]">{m.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Mini Aurora CTA & Settings */}
      <div className="space-y-3 pt-3 border-t border-[var(--border)]">
        {/* Free-plan card becomes a mini aurora CTA per UI_SPEC §4.2 & §5 */}
        <div className="aurora-card p-3.5 rounded-[18px] space-y-2 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-white tracking-wide">Free Plan</span>
            <Chip v="PRO" tone="pro" className="text-[10px] py-0 px-2" />
          </div>
          <p className="text-[11px] text-[#B4B8CC] leading-snug">
            Adaptive weak-area quizzes &amp; repo analysis.
          </p>
          <SpecularButton
            size="sm"
            radius={9999}
            className="w-full mt-1.5 font-mono text-[11px] font-bold uppercase tracking-wider shadow-md"
            href="/settings"
          >
            Upgrade Plan ↗
          </SpecularButton>
        </div>

        {/* Settings link */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all ${
            pathname.startsWith("/settings")
              ? "bg-[var(--glass-strong)] text-[var(--accent-bright)] border border-[var(--border-strong)] font-semibold"
              : "text-[var(--text-2)] hover:bg-[var(--glass-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
