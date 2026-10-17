import React, { Suspense } from "react";
import { QuizRunnerClient } from "./quiz-runner-client";

export function generateStaticParams() {
  return [
    { mode: "quick" },
    { mode: "drills" },
    { mode: "fundamentals" },
    { mode: "practical" },
    { mode: "weak_area" },
    { mode: "projects" },
  ];
}

export default async function QuizRunnerPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Loading quiz...</p>
          </div>
        </div>
      }
    >
      <QuizRunnerClient initialMode={mode} />
    </Suspense>
  );
}
