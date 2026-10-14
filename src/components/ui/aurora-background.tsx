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
      <i className="blob b1" />
      <i className="blob b2" />
      <i className="blob b3" />
      <i className="blob b4" />
    </div>
  );
}
