import React from "react";
import Link from "next/link";
import { BentoTile } from "@/components/ui/bento-tile";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export default function DsaHubPage() {
  const modes = [
    {
      id: "blitz",
      title: "Pattern Blitz",
      chips: ["45S CARDS", "61 CANONICAL"],
      desc: "Rapid-fire pattern recognition and invariant recall across Sliding Window, Two Pointers, Monotonic Stack, and DP.",
      href: "/dsa/blitz",
      cta: "Launch Blitz",
      tint: "m1" as const,
      footer: "SRS ACTIVE · 5 DUE TODAY",
      visual: (
        <div className="flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-[16px] bg-[var(--aurora-violet)]/15 border border-[var(--aurora-violet)] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(108,77,255,0.4)]">
            ⚡
          </span>
          <span className="font-mono text-[11px] text-[var(--aurora-violet)] font-bold tracking-wider">
            SPEED RUNNER
          </span>
        </div>
      ),
    },
    {
      id: "bug-audit",
      title: "Bug Audit Mode",
      chips: ["CODE AUDIT", "LINE SPOTTING"],
      desc: "Audit real 12–20 line snippets. Tap the exact buggy line, choose the breaking input test case, and verify in worker sandbox.",
      href: "/dsa/bug-audit",
      cta: "Launch Audit",
      tint: "m2" as const,
      footer: "ISOLATED SANDBOX WATCHDOG",
      visual: (
        <div className="flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-[16px] bg-[var(--state-running)]/15 border border-[var(--state-running)] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,181,71,0.4)]">
            🔍
          </span>
          <span className="font-mono text-[11px] text-[var(--state-running)] font-bold tracking-wider">
            SANDBOX EXECUTION
          </span>
        </div>
      ),
    },
    {
      id: "open-ended",
      title: "Open-Ended Drills",
      chips: ["SYSTEM DESIGN", "3-PHASE TREE"],
      desc: "Realistic system design interviews: Estimate scale constraints, map primitives, and defend against dynamic pushback.",
      href: "/dsa/open-ended",
      cta: "Start Drill",
      tint: "m3" as const,
      footer: "RUBRIC GRADING ENGINE",
      visual: (
        <div className="flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-[16px] bg-[var(--aurora-azure)]/15 border border-[var(--aurora-azure)] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(43,183,255,0.4)]">
            🏗️
          </span>
          <span className="font-mono text-[11px] text-[var(--aurora-azure)] font-bold tracking-wider">
            DECISION TREE
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <header className="space-y-3 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <Chip k="MODULE" v="I" tone="accent" />
          <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
            Algorithmic &amp; Architectural Rounds
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
          DSA &amp; Modern Technical Rounds
        </h1>
        <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
          Drill the core formats of modern technical interviews: lightning pattern identification, precision code debugging, and open-ended architecture trade-offs.
        </p>
      </header>

      {/* 3 Equal Bento Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modes.map((mode) => (
          <BentoTile
            key={mode.id}
            span={4 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}
            tint={mode.tint}
            visual={mode.visual}
            badge={
              <div className="flex items-center gap-1.5 flex-wrap">
                {mode.chips.map((c) => (
                  <Chip key={c} v={c} tone="default" className="text-[10px]" />
                ))}
              </div>
            }
            title={<span className="font-display font-bold text-lg">{mode.title}</span>}
            desc={mode.desc}
            footer={
              <div className="space-y-3 pt-2">
                <span className="font-mono text-[10px] text-[var(--text-3)] tracking-wider block">
                  {mode.footer}
                </span>
                <Button variant="primary" size="md" href={mode.href} className="w-full">
                  {mode.cta} &rarr;
                </Button>
              </div>
            }
          />
        ))}
      </div>

      {/* Bottom Ghost Links */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] text-xs font-mono text-[var(--text-3)]">
        <Link href="/home" className="hover:text-[var(--text)] transition-colors">
          &larr; Back to Home Dashboard
        </Link>
        <Link href="/progress" className="hover:text-[var(--accent-bright)] transition-colors">
          View Spaced Repetition Progress &rarr;
        </Link>
      </div>
    </div>
  );
}
