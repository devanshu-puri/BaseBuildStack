"use client";

import React from "react";
import { SkipLink } from "./skip-link";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { IconRail } from "./icon-rail";
import { SidebarNav } from "./sidebar-nav";
import { ContextPanel } from "./context-panel";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col text-[var(--text)] relative">
      {/* 1. Skip to Content Link */}
      <SkipLink />

      {/* 2. Responsive Side Navigations */}
      {/* sm only: 72px Icon Rail */}
      <React.Suspense fallback={null}>
        <IconRail />
      </React.Suspense>

      {/* lg+ only: 248px Glass Sidebar */}
      <React.Suspense fallback={null}>
        <SidebarNav />
      </React.Suspense>

      {/* 3. Main Viewport Container */}
      <div className="flex-1 flex flex-col sm:pl-[72px] lg:pl-[248px] min-w-0 transition-[padding]">
        {/* TopBar on mobile and desktop */}
        <React.Suspense fallback={null}>
          <TopBar />
        </React.Suspense>

        {/* Flexible Center Content + XL Context Panel */}
        <div className="flex-1 flex justify-center w-full min-w-0">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 w-full max-w-[1040px] px-4 sm:px-6 lg:px-8 py-6 pb-[calc(108px+env(safe-area-inset-bottom))] sm:pb-12 outline-none min-w-0"
          >
            {children}
          </main>

          {/* xl only: 320px Context Panel */}
          <ContextPanel />
        </div>
      </div>

      {/* 4. Mobile Floating Dock (< 640px) */}
      <React.Suspense fallback={null}>
        <BottomNav />
      </React.Suspense>
    </div>
  );
}
