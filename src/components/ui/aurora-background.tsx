"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import PatternWaves from "./pattern-waves";

export type AuroraIntensity = "app" | "hero" | "focus";

interface AuroraBackgroundProps {
  intensity?: AuroraIntensity;
}

export function AuroraBackground({ intensity: propIntensity }: AuroraBackgroundProps) {
  const pathname = usePathname() || "";
  const { resolvedTheme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const isLight = mounted && resolvedTheme === "light";

  // Dynamic opacity based on screen intensity mode
  const waveOpacity = isLight
    ? computedIntensity === "hero"
      ? 0.35
      : computedIntensity === "focus"
      ? 0.18
      : 0.28
    : computedIntensity === "hero"
    ? 0.52
    : computedIntensity === "focus"
    ? 0.25
    : 0.42;

  // On mobile devices, use the lightweight, crash-proof CSS living Aurora blades
  // to avoid WebGL shader arithmetic overflows, high battery drain, and canvas whiteout.
  if (mounted && isMobile) {
    return (
      <div
        className="aurora fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
        data-intensity={computedIntensity}
        data-paused={isPaused}
        style={{ backgroundColor: isLight ? "#F8F9FC" : "#07080a" }}
        aria-hidden="true"
      >
        <div className="blades-container" style={{ opacity: isLight ? 0.35 : undefined }}>
          <div className="light-blade blade-1" />
          <div className="light-blade blade-2" />
          <div className="light-blade blade-3" />
        </div>
        <div
          className="aurora-vignette"
          style={{
            background: isLight
              ? "radial-gradient(ellipse 92% 84% at 50% 45%, transparent 18%, rgba(248, 249, 252, 0.4) 55%, rgba(248, 249, 252, 0.85) 80%, #F8F9FC 100%)"
              : undefined,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
      style={{ backgroundColor: isLight ? "#F8F9FC" : "#07080a" }}
      aria-hidden="true"
    >
      {mounted && !isMobile && (
        <PatternWaves
          preset="silk"
          pattern="dot"
          wave="silk"
          color={isLight ? "#6C4DFF" : "#8B7CFF"}
          backgroundColor={isLight ? "#F8F9FC" : "#07080a"}
          opacity={waveOpacity}
          spacing={10}
          markSize={0.92}
          depth={0.85}
          light={0}
          shine={0.65}
          contrast={1.15}
          speed={0.28}
          scale={1.05}
          direction={25}
          fade="edges"
          fadeSize={0.5}
          interactive={true}
          cursorSize={55}
          cursorStrength={0.55}
          paused={isPaused}
          intro={true}
          className="w-full h-full"
        />
      )}
    </div>
  );
}
