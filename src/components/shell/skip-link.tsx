import React from "react";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-[var(--on-accent)] focus:rounded-full focus:font-semibold focus:shadow-[0_0_20px_rgba(94,78,240,0.6)] focus:outline-2 focus:outline-[var(--accent-bright)] text-[14px]"
    >
      Skip to content
    </a>
  );
}
