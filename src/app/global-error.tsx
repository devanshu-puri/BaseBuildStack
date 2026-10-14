"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[var(--bg-canvas,#0F1115)] text-[var(--text-primary,#FFFFFF)] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--bg-card,#161920)] border border-[var(--border-subtle,#262A34)] text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--danger,#FF5C5C)]/10 text-[var(--danger,#FF5C5C)] flex items-center justify-center font-mono font-bold text-xl">
            !
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--text-secondary,#A0A5B2)]">
              An unexpected error occurred. It has been reported to telemetry.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-[var(--accent-lime,#C6F25A)] text-[var(--bg-canvas,#0F1115)] font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
