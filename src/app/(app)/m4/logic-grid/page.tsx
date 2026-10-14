import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getAllLogicGrids } from "@/content/m4/logic-grid-data";

export default function LogicGridIndexPage() {
  const puzzles = getAllLogicGrids();

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] py-6 sm:py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--brand-accent)] font-semibold">
              Module IV • Deductive Reasoning
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Interactive Logic Grid Puzzles
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Every puzzle is verified by a deterministic CSP constraint solver to guarantee <strong>exactly 1 unique solution</strong> with zero ambiguities.
          </p>
        </div>

        <Link
          href="/m4"
          className="px-3.5 py-2 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-accent)] transition-colors self-start sm:self-auto shrink-0"
        >
          ← Return to Module IV
        </Link>
      </div>

      {/* Grid of Verified Puzzles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {puzzles.map((p) => (
          <Card
            key={p.id}
            tone="default"
            padding="lg"
            className="space-y-4 flex flex-col justify-between hover:border-[var(--brand-accent)] transition-all border-l-4 border-l-[var(--brand-accent)]"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Chip v="1 Solution Verified" tone="good" className="text-[10px]" />
                <span className="text-[11px] font-mono text-[var(--brand-accent)] font-semibold">
                  +{p.xpAward} XP
                </span>
              </div>

              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {p.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {p.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.dimensions.map((d) => (
                  <Chip
                    key={d.id}
                    k={d.name}
                    v={`${d.items.length}`}
                    tone="default"
                    className="text-[10px]"
                  />
                ))}
              </div>
            </div>

            <Link
              href={`/m4/logic-grid/${p.id}`}
              className="w-full py-2.5 rounded-[12px] bg-[var(--brand-accent)] text-[var(--text-on-accent)] font-bold text-xs text-center hover:opacity-90 transition-opacity block"
            >
              Solve Logic Grid →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
