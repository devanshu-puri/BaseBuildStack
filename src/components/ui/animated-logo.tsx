"use client";

import React, { useState } from "react";

export interface AnimatedLogoProps {
  size?: number;
  className?: string;
  showBorder?: boolean;
}

/**
 * AnimatedLogo
 * Renders the 3D Seamless Aurora Pyramid logo.
 * The 4 frustum layers cascade drop in, stack seamlessly, rest and rotate
 * for 3-4 seconds, peel up smoothly, and repeat.
 */
export function AnimatedLogo({
  size = 34,
  className = "",
  showBorder = true,
}: AnimatedLogoProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative shrink-0 rounded-[11px] overflow-hidden select-none transition-all ${
        showBorder
          ? "border border-purple-500/30 bg-[#0d0a17]/90 shadow-[0_0_18px_rgba(88,64,204,0.45)] hover:border-purple-400/50 hover:shadow-[0_0_24px_rgba(190,153,227,0.5)]"
          : "bg-transparent"
      } ${className}`}
    >
      <iframe
        src="/aurora-logo.html"
        title="BaseBuildStack Aurora Logo"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full border-0 block pointer-events-none transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
