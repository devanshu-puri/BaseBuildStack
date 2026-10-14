"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Dock, { type DockItemData } from "@/components/ui/dock";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  AlgorithmIcon,
  Brain02Icon,
  BookOpen01Icon,
  Analytics01Icon,
  Bookmark01Icon,
} from "@hugeicons/core-free-icons";

export function BottomNav() {
  const pathname = usePathname() || "";
  const router = useRouter();

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

  const items: DockItemData[] = [
    {
      icon: <HugeiconsIcon icon={Home01Icon} size={22} strokeWidth={1.8} className="text-white" />,
      label: "Home",
      href: "/home",
      active: pathname === "/home" || pathname === "/",
      menu: [
        { label: "Dashboard", onClick: () => router.push("/home") },
        { label: "Settings", onClick: () => router.push("/settings") },
      ],
    },
    {
      icon: <HugeiconsIcon icon={AlgorithmIcon} size={22} strokeWidth={1.8} className="text-white" />,
      label: "M1: DSA Rounds",
      href: "/dsa",
      active: pathname.startsWith("/dsa") || pathname.startsWith("/m1"),
      menu: [
        { label: "DSA Overview", onClick: () => router.push("/dsa") },
        { separator: true },
        { label: "Pattern Blitz (45s)", onClick: () => router.push("/dsa/blitz") },
        { label: "Bug Audit Mode", onClick: () => router.push("/dsa/bug-audit") },
        { label: "Open-Ended Drills", onClick: () => router.push("/dsa/open-ended") },
      ],
    },
    {
      icon: <HugeiconsIcon icon={Brain02Icon} size={22} strokeWidth={1.8} className="text-white" />,
      label: "M2: Skill Diagnostic",
      href: "/quiz",
      active: pathname.startsWith("/quiz") || pathname.startsWith("/m2"),
      menu: [
        { label: "Skill Diagnostic Hub", onClick: () => router.push("/quiz") },
        { separator: true },
        { label: "Quick Quiz (5m)", onClick: () => router.push("/quiz/quick") },
        { label: "Skill Heatmap", onClick: () => router.push("/quiz/heatmap") },
        { label: "Resume Extraction", onClick: () => router.push("/quiz/onboarding") },
      ],
    },
    {
      icon: <HugeiconsIcon icon={BookOpen01Icon} size={22} strokeWidth={1.8} className="text-white" />,
      label: "M3: Tech Bites",
      href: "/m3",
      active: pathname.startsWith("/m3"),
      menu: [
        { label: "Scrollytelling Path", onClick: () => router.push("/m3") },
        { separator: true },
        { label: "Spaced Mastery Retests", onClick: () => router.push("/m3/retest") },
      ],
    },
    {
      icon: <HugeiconsIcon icon={Analytics01Icon} size={22} strokeWidth={1.8} className="text-white" />,
      label: "Progress",
      href: "/progress",
      active: pathname.startsWith("/progress"),
      menu: [
        { label: "Progress & Streaks", onClick: () => router.push("/progress") },
        { label: "Metacognitive Insights", onClick: () => router.push("/m4/insights") },
      ],
    },
    {
      separator: true,
    },
    {
      icon: <HugeiconsIcon icon={Bookmark01Icon} size={22} strokeWidth={1.8} className="text-white" />,
      label: "Bookmarks",
      href: "/bookmarks",
      active: pathname.startsWith("/bookmarks"),
    },
  ];

  return (
    <nav
      aria-label="Floating liquid glass dock navigation"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none"
    >
      <Dock
        items={items}
        position="bottom"
        theme="dark"
        baseItemSize={48}
        magnification={64}
        distance={140}
        panelHeight={68}
        gap={8}
        roundness={0.65}
        bounce={true}
        tiles={true}
        showLabels={true}
        showIndicators={true}
        accentColor="#C084FC"
        className="shadow-2xl"
      />
    </nav>
  );
}

export { BottomNav as FloatingDock };
