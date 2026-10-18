"use client";

import React from "react";
import Link from "next/link";
import { BentoTile } from "@/components/ui/bento-tile";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/ui/stat-block";
import { usePricingModal } from "@/components/payments/pricing-context";

const FEATURED_TOPICS = [
  {
    id: "rag-pipeline",
    category: "AI & LLM SYSTEMS",
    title: "RAG Pipeline",
    highlight: "Architecture",
    desc: "Interactive 5-stage conceptual model: Embed query → Vector search → Rerank → Augment prompt → Generate response.",
    stage: "1 OF 5",
  },
  {
    id: "caching-fundamentals",
    category: "BACKEND ARCHITECTURE",
    title: "Caching & Cache-Aside",
    highlight: "Strategy",
    desc: "Master in-memory caching patterns, latency trade-offs, and how to prevent cache stampedes under high concurrency.",
    stage: "1 OF 5",
  },
  {
    id: "embeddings-similarity",
    category: "VECTOR SEARCH",
    title: "Vector Embeddings &",
    highlight: "Similarity Search",
    desc: "Understand high-dimensional dense vector spaces, cosine distance vs Euclidean metric, and how semantic similarity works.",
    stage: "1 OF 5",
  },
  {
    id: "tokens-context",
    category: "LLM FOUNDATIONS",
    title: "Tokens & Context",
    highlight: "Window Scaling",
    desc: "Master Byte-Pair Encoding (BPE), token-to-word ratios, and how context window memory limits impact system design.",
    stage: "1 OF 5",
  },
  {
    id: "http-rest",
    category: "DISTRIBUTED SYSTEMS",
    title: "HTTP/REST & Idempotent",
    highlight: "API Design",
    desc: "Master REST conventions, safe vs idempotent HTTP verbs, and robust idempotency key design for financial transactions.",
    stage: "1 OF 5",
  },
  {
    id: "docker-containers",
    category: "DEVOPS & CLOUD",
    title: "Docker & Container",
    highlight: "Isolation",
    desc: "Namespaces, cgroups, layered UnionFS, and process virtualization on the host Linux kernel.",
    stage: "1 OF 5",
  },
  {
    id: "llm-basics",
    category: "AI & LLM SYSTEMS",
    title: "LLM Autoregressive",
    highlight: "Generation",
    desc: "Understand how Large Language Models generate text token-by-token and control randomness via temperature.",
    stage: "1 OF 5",
  },
];

export default function HomePage() {
  const { streak, dueSrsCount, completed } = usePricingModal();
  const [topicIndex, setTopicIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTopicIndex((prev) => (prev + 1) % FEATURED_TOPICS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentTopic = FEATURED_TOPICS[topicIndex];

  const modules = [
    {
      id: "m1",
      tag: "Module I",
      title: "DSA & Modern Technical Rounds",
      desc: "Pattern Blitz (45s cards), Bug Audit (line-spotting), and Open-Ended system drills.",
      progress: `${completed.m1} / 60 completed`,
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
      progress: `${completed.m2} / 10 completed`,
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
      progress: `${completed.m3} / 8 completed`,
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
      progress: streak > 0 ? `Streak: ${streak} day${streak === 1 ? "" : "s"}` : "Streak: 0 days",
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
            className="flex flex-col justify-between min-h-[260px] text-white transition-all duration-500"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-purple-200/90 font-semibold px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                    {currentTopic.category}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-white/70 font-medium hidden sm:inline">
                    {completed.m3 > 0 ? "Continue Learning" : "Ready to Continue"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Topic indicators */}
                  <div className="flex items-center gap-1 mr-1">
                    {FEATURED_TOPICS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTopicIndex(i)}
                        title={`Switch to topic ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === topicIndex
                            ? "w-4 bg-white shadow-[0_0_8px_white]"
                            : "w-1.5 bg-white/30 hover:bg-white/60"
                        }`}
                      />
                    ))}
                  </div>

                  <Link
                    href="/m3"
                    aria-label="Start learning in Module 3"
                    className="arrow-btn"
                  >
                    ↗
                  </Link>
                </div>
              </div>

              <div>
                <h2 className="font-display text-[26px] sm:text-[34px] font-extrabold text-white leading-tight transition-opacity duration-300">
                  {currentTopic.title} <span className="gradient-keyword">{currentTopic.highlight}</span>
                </h2>
                <p className="font-ui text-[14px] text-[#B4B8CC] mt-2 max-w-[560px] leading-relaxed transition-opacity duration-300">
                  {currentTopic.desc}
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="primary"
                size="md"
                href="/m3"
                className="shadow-[0_8px_24px_rgba(94,78,240,0.6)] cursor-pointer"
              >
                Start Learning →
              </Button>
              <Chip k="STAGE" v={currentTopic.stage} tone="default" className="bg-white/10 border-white/15 text-white" />
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
          <StatBlock label="CURRENT STREAK" value={`${streak}d`} delta={streak > 0 ? `+${streak}` : "+0"} size="sm" />
        </GlassCard>
        <GlassCard tone="default" padding="sm" className="space-y-1">
          <StatBlock label="DUE SRS REVIEWS" value={String(dueSrsCount)} size="sm" />
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
              tag={m.tag}
              title={m.title}
              desc={m.desc}
              progress={m.progress}
              tint={m.tint}
              icon={m.icon}
              href={m.href}
              visual={m.visual}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
