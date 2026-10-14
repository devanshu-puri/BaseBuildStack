"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type AuroraIntensity = "app" | "hero" | "focus";

interface AuroraBackgroundProps {
  intensity?: AuroraIntensity;
}

export function AuroraBackground({ intensity: propIntensity }: AuroraBackgroundProps) {
  const pathname = usePathname() || "";
  const [isPaused, setIsPaused] = useState(false);

  // Compute route-driven intensity when not explicitly provided
  const computedIntensity: AuroraIntensity = React.useMemo(() => {
    if (propIntensity) return propIntensity;

    if (pathname === "/" || pathname === "/landing") {
      return "hero";
    }

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
      return "focus";
    }

    return "app";
  }, [pathname, propIntensity]);

  // Pause animation when tab is not visible (saves CPU/GPU)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="aurora"
      data-intensity={computedIntensity}
      data-paused={isPaused ? "true" : "false"}
      aria-hidden="true"
    >
      {/* 1. Living Warm Aurora Diagonal Light-Blades */}
      <div className="blades-container">
        <div className="light-blade blade-1" />
        <div className="light-blade blade-2" />
        <div className="light-blade blade-3" />
        <div className="light-blade blade-4" />
        <div className="light-blade blade-5" />
      </div>

      {/* 2. Soft Radial Vignette: Frames edges and grounds into near-black #07080a */}
      <div className="aurora-vignette" />

      {/* 3. Subtle Film Grain: SVG feTurbulence for crafted optical texture */}
      <svg
        className="aurora-grain pointer-events-none absolute inset-0 w-full h-full opacity-[0.04] mix-blend-overlay"
        aria-hidden="true"
      >
        <filter id="aurora-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#aurora-noise)" />
      </svg>
    </div>
  );
}
