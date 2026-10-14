"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
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

export function BottomNav() {
  const pathname = usePathname() || "";

  // Hide FloatingDock on focus modes per UI_SPEC §7 so BottomCTA can take bottom slot
  const isFocusScreen =
    pathname.includes("/blitz") ||
    pathname.includes("/bug-audit") ||
    pathname.includes("/open-ended") ||
    pathname.startsWith("/m3/lesson/") ||
    (pathname.startsWith("/m3/retest/") && pathname !== "/m3/retest") ||
    pathname.startsWith("/m4/sprint") ||
    (pathname.startsWith("/m4/logic-grid/") && pathname !== "/m4/logic-grid") ||
    (pathname.startsWith("/quiz/") &&
      pathname !== "/quiz" &&
      pathname !== "/quiz/heatmap" &&
      pathname !== "/quiz/onboarding") ||
    (pathname.startsWith("/m2/quiz/") &&
      pathname !== "/m2/quiz" &&
      pathname !== "/m2/heatmap");

  if (isFocusScreen) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="sm:hidden dock"
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            title={item.name}
            aria-label={item.name}
            className="group relative"
          >
            {item.icon}
          </Link>
        );
      })}
    </nav>
  );
}

export { BottomNav as FloatingDock };
