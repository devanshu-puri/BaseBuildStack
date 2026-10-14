
import React from "react";
import Link from "next/link";
import { BentoTile } from "@/components/ui/bento-tile";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/ui/stat-block";

export default function HomePage() {
  const modules = [
    {
      id: "m1",
      tag: "Module I",
      title: "DSA & Modern Technical Rounds",
      desc: "Pattern Blitz (45s cards), Bug Audit (line-spotting), and Open-Ended system drills.",
      progress: "0 / 60 completed",
      tint: "m1" as const,
      icon: "⚡",
      href: "/dsa",
      visual: (
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--aurora-violet)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-violet)] animate-pulse shadow-[0_0_8px_var(--aurora-violet)]" />
          <span>61 CANONICAL PATTERNS · SM-2</span>
        </div>
      ),
    },
    {
      id: "m2",
      tag: "Module II",
      title: "Personalized Interview Quizzes",
      desc: "Adaptive questions tailored to your stack, resume skills, and project claims.",
      progress: "0 / 10 completed",
      tint: "m2" as const,
      icon: "🎯",
      href: "/quiz",
      visual: (
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--state-running)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--state-running)] shadow-[0_0_8px_var(--state-running)]" />
          <span>4-QUADRANT CONFIDENCE CALIBRATION</span>
        </div>
      ),
    },
    {
      id: "m3",
      tag: "Module III",
      title: "Tech Bites (15-Minute Lessons)",
      desc: "Interactive 5-stage conceptual models with clickable architecture diagrams.",
      progress: "0 / 8 completed",
      tint: "m3" as const,
      icon: "🧩",
      href: "/m3",
      visual: (
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--aurora-azure)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-azure)] shadow-[0_0_8px_var(--aurora-azure)]" />
          <span>CLICKABLE RAG PIPELINE DIAGRAM</span>
        </div>
      ),
    },
    {
      id: "m4",
      tag: "Module IV",
      title: "Logic & Cognitive Practice",
      desc: "Daily 5-minute Mind Sprints, single-solution logic grids, and metacognition calibration.",
      progress: "Streak: 4 days",
      tint: "m4" as const,
      icon: "🧠",
      href: "/m4",
      visual: (
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--aurora-mint)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-mint)] shadow-[0_0_8px_var(--aurora-mint)]" />
          <span>DAILY SPRINT · CONSTRAINT SOLVER</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Bento Grid: Row 1 */}
      <div className="bento">
        {/* Hero Card: span 8 cols on desktop (lg+) */}
        <div className="bezel lg:col-span-8">
          <GlassCard
            tone="aurora"
            padding="lg"
            className="flex flex-col justify-between min-h-[260px] text-white"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                  Ready to continue
                </span>
                <Link
                  href="/m3/lesson/rag-pipeline"
                  aria-label="Start lesson"
                  className="arrow-btn"
                >
                  ↗
                </Link>
              </div>

              <div>
                <h2 className="font-display text-[26px] sm:text-[34px] font-extrabold text-white leading-tight">
                  RAG Pipeline <span className="gradient-keyword">Architecture</span>
                </h2>
                <p className="font-ui text-[14px] text-[#B4B8CC] mt-2 max-w-[560px] leading-relaxed">
                  Interactive 5-stage conceptual model: Embed query &rarr; Vector search &rarr; Rerank &rarr; Augment prompt &rarr; Generate response.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="primary"
                size="md"
                href="/m3/lesson/rag-pipeline"
                className="shadow-[0_8px_24px_rgba(94,78,240,0.6)]"
              >
                Start Lesson &rarr;
              </Button>
              <Chip k="STAGE" v="1 of 5" tone="default" className="bg-white/10 border-white/15 text-white" />
            </div>
          </GlassCard>
        </div>

        {/* Mind Sprint Tile: span 4 cols on desktop (lg+) */}
        <div className="bezel lg:col-span-4">
          <GlassCard
            tone="default"
            padding="lg"
            className="h-full flex flex-col justify-between space-y-4 rim border-[var(--accent)]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase text-[var(--accent-bright)] font-semibold">
                  Daily Workout
                </span>
                <Chip v="5 MIN" tone="done" />
              </div>
              <h3 className="font-display text-[20px] font-bold text-[var(--text)]">
                Today&apos;s Mind Sprint
              </h3>
              <p className="font-ui text-[13px] text-[var(--text-2)] leading-relaxed">
                5 fast-paced cognitive items: pattern recognition, deduction, and Fermi calibration.
              </p>
            </div>

            <Button variant="secondary" size="md" href="/m4/sprint" className="w-full">
              Begin Workout ⚡
            </Button>
          </GlassCard>
        </div>
      </div>

      {/* Mobile only stats row (below xl) */}
      <div className="xl:hidden grid grid-cols-2 gap-3 sm:gap-4">
        <GlassCard tone="default" padding="sm" className="space-y-1">
          <StatBlock label="CURRENT STREAK" value="4d" delta="+1" size="sm" />
        </GlassCard>
        <GlassCard tone="default" padding="sm" className="space-y-1">
          <StatBlock label="DUE SRS REVIEWS" value="3" size="sm" />
        </GlassCard>
      </div>

      {/* Module Overview Section: 2x2 Bento grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[var(--text)]">
            Core Modules
          </h3>
          <span className="font-mono text-[11px] text-[var(--text-3)] uppercase tracking-wider">
            Deterministic Engine Active
          </span>
        </div>

        <div className="bento">
          {modules.map((m) => (
            <BentoTile
              key={m.id}
              span={6}
              tint={m.tint}
              visual={m.visual}
              badge={<Chip k="MODULE" v={m.tag} tone="accent" />}
              title={
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">{m.icon}</span>
                  <span>{m.title}</span>
                </div>
              }
              desc={m.desc}
              footer={
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[var(--text-3)]">{m.progress}</span>
                  <Link
                    href={m.href}
                    className="font-mono text-[12px] font-bold text-[var(--accent-bright)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Module</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
