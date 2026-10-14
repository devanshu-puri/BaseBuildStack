"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const railItems = [
  {
    name: "Home",
    href: "/home",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Progress",
    href: "/progress",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Bookmarks",
    href: "/bookmarks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
];

const moduleItems = [
  { name: "M1 DSA", href: "/dsa", tag: "M1" },
  { name: "M2 Quizzes", href: "/quiz", tag: "M2" },
  { name: "M3 Bites", href: "/m3", tag: "M3" },
  { name: "M4 Sprint", href: "/m4", tag: "M4" },
];

export function IconRail() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Tablet sidebar navigation rail"
      className="hidden sm:flex lg:hidden fixed top-0 left-0 bottom-0 w-[72px] flex-col items-center justify-between py-4 bg-[var(--glass-strong)] backdrop-blur-xl border-r border-[var(--border)] z-40"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Brand Logo icon */}
        <Link
          href="/home"
          aria-label="BaseBuildStack home"
          className="w-10 h-10 rounded-[12px] bg-[var(--accent-grad)] text-white font-bold font-mono text-[16px] flex items-center justify-center border border-white/20 shadow-[0_0_16px_rgba(94,78,240,0.5)]"
        >
          B
        </Link>

        {/* Primary nav icons */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {railItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[var(--accent-grad)] text-white shadow-[0_0_16px_rgba(94,78,240,0.6)]"
                    : "text-[var(--text-2)] hover:bg-[var(--glass-subtle)] hover:text-[var(--text)]"
                }`}
              >
                {item.icon}
              </Link>
            );
          })}
        </div>

        {/* Module shortcut chips */}
        <div className="w-8 border-t border-[var(--border)] my-1" />
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {moduleItems.map((m) => (
            <Link
              key={m.tag}
              href={m.href}
              title={m.name}
              aria-label={m.name}
              className="w-9 h-8 rounded-[10px] bg-[var(--glass-subtle)] text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--border-strong)] border border-[var(--border)] font-mono text-[11px] font-semibold flex items-center justify-center transition-colors"
            >
              {m.tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="px-2 w-full flex justify-center">
        <Link
          href="/settings"
          title="Settings"
          aria-label="Settings"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            pathname.startsWith("/settings")
              ? "bg-[var(--glass-strong)] text-[var(--accent-bright)] border border-[var(--border-strong)]"
              : "text-[var(--text-2)] hover:bg-[var(--glass-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
