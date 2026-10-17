import React, { Suspense } from "react";
import { ProjectPanelClient } from "./project-panel-client";

export default function ProjectPanelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Loading project interview panel...
            </p>
          </div>
        </div>
      }
    >
      <ProjectPanelClient />
    </Suspense>
  );
}
