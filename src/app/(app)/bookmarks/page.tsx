"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { EmptyState } from "@/components/ui/empty-state";

export default function BookmarksPage() {
  const [filter, setFilter] = useState("all");

  const allBookmarks = [
    {
      id: "bm-1",
      module: "M1",
      title: "Sliding Window Maximum Invariant",
      meta: "TIME O(N) · SPACE O(K)",
      savedAt: "Yesterday",
    },
    {
      id: "bm-2",
      module: "M3",
      title: "RAG Stage 03: Reranker Model Latency",
      meta: "Lesson reference note",
      savedAt: "3 days ago",
    },
  ];

  const filtered = allBookmarks.filter((b) => {
    if (filter === "all") return true;
    return b.module.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            Saved Bookmarks &amp; Revisions
          </h1>
          <p className="font-ui text-xs sm:text-sm text-[var(--text-2)]">
            Unified across all 4 modules in your user-scoped database.
          </p>
        </div>
        <Chip k="SAVED" v={`${allBookmarks.length} Items`} tone="default" />
      </header>

      {/* Module Filter Tabs */}
      <SegmentedTabs
        items={[
          { id: "all", label: "All Items", count: allBookmarks.length },
          { id: "m1", label: "M1 DSA", count: 1 },
          { id: "m2", label: "M2 Quizzes", count: 0 },
          { id: "m3", label: "M3 Tech Bites", count: 1 },
          { id: "m4", label: "M4 Mind Sprint", count: 0 },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {/* Bookmarked Cards or EmptyState */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <GlassCard key={b.id} tone="solid" padding="md" className="space-y-3 hover:border-[var(--border-strong)] transition-all">
              <div className="flex items-center justify-between">
                <Chip v={b.module} tone="accent" />
                <span className="text-[11px] font-mono text-[var(--text-3)]">{b.savedAt}</span>
              </div>
              <div>
                <h4 className="font-display text-[15px] sm:text-[16px] font-bold text-[var(--text)]">{b.title}</h4>
                <p className="text-[12px] font-mono text-[var(--text-2)] mt-1">{b.meta}</p>
              </div>
              <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                <span className="text-[12px] font-mono font-bold text-[var(--accent-bright)] hover:underline cursor-pointer">
                  Review Item &rarr;
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${filter.toUpperCase()} Bookmarks Found`}
          description="Star key problems and lesson reference cards during your drills to review them here."
          action={{ label: "View All Bookmarks", onClick: () => setFilter("all") }}
        />
      )}

      {/* Keyboard Shortcut Info Box */}
      <GlassCard tone="subtle" padding="md" className="text-center space-y-2 py-6">
        <p className="font-ui text-xs sm:text-sm text-[var(--text-2)]">
          Tap the bookmark icon or press <kbd className="font-mono text-[11px] px-1.5 py-0.5 bg-[var(--glass)] rounded border border-[var(--border)] text-[var(--text)]">B</kbd> during any drill or lesson to save cards here for revision.
        </p>
      </GlassCard>
    </div>
  );
}
