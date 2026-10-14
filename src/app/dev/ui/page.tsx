"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { BentoTile } from "@/components/ui/bento-tile";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StatBlock } from "@/components/ui/stat-block";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { DifficultyMeter } from "@/components/ui/difficulty-meter";
import { Avatar } from "@/components/ui/avatar";
import { OptionButton } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { CodeBlock } from "@/components/ui/code-block";
import { MilestoneCard, GlowTile } from "@/components/ui/milestone-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Dialog } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTheme } from "@/components/theme/theme-provider";

export default function DevUiGalleryPage() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOption, setSelectedOption] = useState<number | null>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto space-y-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="chip bg-[var(--accent)] text-white font-mono text-[11px] font-bold">
              DEV ONLY
            </span>
            <h1 className="font-display text-[28px] sm:text-[36px] font-extrabold text-[var(--text)] tracking-tight">
              UI Primitives Gallery
            </h1>
          </div>
          <p className="font-ui text-[14px] text-[var(--text-2)] mt-1">
            Visual inspection suite for all v2 Aurora Glass design tokens and interactive primitives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--text-3)]">
            Active Theme: <strong className="text-[var(--text)] uppercase">{resolvedTheme}</strong>
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* 1. GlassCard Variants */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)] flex items-center gap-2">
          <span>GlassCard Tones & Elevation</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard tone="default" padding="md">
            <span className="font-mono text-xs text-[var(--text-3)] block mb-1">tone=&quot;default&quot;</span>
            <h4 className="font-bold text-[var(--text)]">Standard Glass</h4>
            <p className="text-xs text-[var(--text-2)] mt-1">16px blur + hairline border + top rim highlight.</p>
          </GlassCard>

          <GlassCard tone="subtle" padding="md">
            <span className="font-mono text-xs text-[var(--text-3)] block mb-1">tone=&quot;subtle&quot;</span>
            <h4 className="font-bold text-[var(--text)]">Subtle Glass</h4>
            <p className="text-xs text-[var(--text-2)] mt-1">Low-opacity 3% fill for nested grouping.</p>
          </GlassCard>

          <GlassCard tone="strong" padding="md">
            <span className="font-mono text-xs text-[var(--text-3)] block mb-1">tone=&quot;strong&quot;</span>
            <h4 className="font-bold text-[var(--text)]">Strong Glass</h4>
            <p className="text-xs text-[var(--text-2)] mt-1">24px blur for floating sheets, dock & modals.</p>
          </GlassCard>

          <GlassCard tone="solid" padding="md">
            <span className="font-mono text-xs text-[var(--text-3)] block mb-1">tone=&quot;solid&quot;</span>
            <h4 className="font-bold text-[var(--text)]">Solid Fallback</h4>
            <p className="text-xs text-[var(--text-2)] mt-1">Zero blur for long list performance and battery saving.</p>
          </GlassCard>
        </div>

        {/* Aurora Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <GlassCard tone="aurora" padding="lg">
            <span className="chip bg-white/20 text-white font-mono text-[11px] mb-2 inline-block">
              tone=&quot;aurora&quot;
            </span>
            <h3 className="font-display text-2xl font-bold text-white">
              Luminous <span className="gradient-keyword">Atmosphere</span> Card
            </h3>
            <p className="text-sm text-[#B4B8CC] mt-2 max-w-md">
              Hero card featuring multi-stop radial aurora blends with a soft dark scrim protecting typography.
            </p>
          </GlassCard>

          <div className="bezel">
            <GlassCard tone="default" padding="lg">
              <span className="font-mono text-xs text-[var(--text-3)] block mb-1">bezel=true</span>
              <h3 className="font-display text-2xl font-bold text-[var(--text)]">
                Bento Inset Bezel Frame
              </h3>
              <p className="text-sm text-[var(--text-2)] mt-2">
                Outer 1px hairline bezel frame with 6px inset padding wrapping the inner glass surface.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 2. BentoTile Showcase */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          BentoTile Grid Composition
        </h2>
        <div className="bento">
          <BentoTile
            span={6}
            visual={
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-[14px] bg-[var(--accent)]/20 border border-[var(--accent)] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(94,78,240,0.4)]">
                  ⚡
                </span>
                <span className="font-display text-2xl font-extrabold text-[var(--text)]">
                  Pattern Blitz
                </span>
              </div>
            }
            badge={<Chip k="MODULE" v="I" tone="accent" />}
            title="DSA & Modern Technical Rounds"
            desc="Drill 61 canonical interview patterns in high-speed 45-second sprints."
            footer={<span className="font-mono text-xs text-[var(--accent-bright)] font-semibold">SRS ACTIVE →</span>}
          />

          <BentoTile
            span={6}
            visual={
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-[14px] bg-[var(--aurora-mint)]/20 border border-[var(--aurora-mint)] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(46,230,197,0.4)]">
                  🧠
                </span>
                <span className="font-display text-2xl font-extrabold text-[var(--text)]">
                  Mind Sprint
                </span>
              </div>
            }
            badge={<Chip k="DAILY" v="5 MIN" tone="done" />}
            title="Logic & Cognitive Calibration"
            desc="5-minute daily workout across deduction, Fermi estimates, and memory chains."
            footer={<span className="font-mono text-xs text-[var(--state-done)] font-semibold">STREAK: 12 DAYS →</span>}
          />
        </div>
      </section>

      {/* 3. Buttons & Chips */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          Buttons & Chips
        </h2>
        <GlassCard tone="default" padding="lg" className="space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)] block font-semibold">
              Buttons: Variants & States
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Accent</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="cta">Large CTA Button</Button>
              <Button variant="secondary">Secondary Glass</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="icon-glass" aria-label="Icon Glass">
                ↗
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[var(--border)]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)] block font-semibold">
              Chips: Tones & Metadata
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <Chip k="TIME" v="O(N)" />
              <Chip k="SPACE" v="O(1)" tone="accent" />
              <Chip k="STATUS" v="PASSED" tone="good" />
              <Chip k="STATUS" v="FAILED" tone="bad" />
              <Chip k="RUNNER" v="RUNNING" tone="running" />
              <Chip k="QUEUE" v="WAITING" tone="waiting" />
              <Chip k="SRS" v="MASTERED" tone="done" />
              <Chip k="MEM" v="REPEAT" tone="repeat" />
              <Chip v="PRO PLAN" tone="pro" />
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 4. Numerals, Stats & Progress */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          Numerals, StatBlocks & Data Viz
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard tone="default" padding="md">
            <StatBlock label="TOTAL XP" value="1,840" delta="+120" size="lg" gradient />
          </GlassCard>
          <GlassCard tone="default" padding="md">
            <StatBlock label="STREAK" value="14d" delta="+1" size="md" />
          </GlassCard>
          <GlassCard tone="default" padding="md" className="flex items-center justify-between">
            <StatBlock label="RECALL ACCURACY" value="88%" size="md" />
            <ProgressRing value={88} size={64} />
          </GlassCard>
          <GlassCard tone="default" padding="md" className="space-y-3">
            <span className="font-mono text-xs uppercase text-[var(--text-3)] block font-semibold">
              DIFFICULTY PIP METERS
            </span>
            <div className="space-y-2">
              <DifficultyMeter level={1} showLabel />
              <DifficultyMeter level={2} showLabel />
              <DifficultyMeter level={3} showLabel />
            </div>
          </GlassCard>
        </div>

        <GlassCard tone="default" padding="md" className="space-y-4">
          <span className="font-mono text-xs uppercase text-[var(--text-3)] block font-semibold">
            Progress Bars & Segmented Tabs
          </span>
          <ProgressBar value={72} showLabel label="Module II Mastery" />
          <SegmentedTabs
            items={[
              { id: "all", label: "All Items", count: 24 },
              { id: "dsa", label: "DSA Rounds", count: 8 },
              { id: "quiz", label: "Quizzes", count: 12 },
              { id: "bites", label: "Tech Bites", count: 4 },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </GlassCard>
      </section>

      {/* 5. Interactive Question OptionButtons & FeedbackCard */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          Focus Modes: Options & Feedback
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <span className="font-mono text-xs uppercase text-[var(--text-3)] block font-semibold">
              Interactive OptionButtons
            </span>
            <OptionButton
              prefix="A"
              label="Pre-sort array and initialize two pointers at head and tail (O(N log N))"
              state={selectedOption === 0 ? "selected" : "idle"}
              onClick={() => setSelectedOption(0)}
            />
            <OptionButton
              prefix="B"
              label="Store complement in Hash Map for single-pass lookup (O(N) time, O(N) space)"
              state="correct"
              onClick={() => setSelectedOption(1)}
            />
            <OptionButton
              prefix="C"
              label="Run brute-force nested iteration comparing every pair (O(N²))"
              state="incorrect"
              onClick={() => setSelectedOption(2)}
            />
            <OptionButton
              prefix="D"
              label="Build a monotonic deque with sliding window invariant"
              state="disabled"
            />
          </div>

          <div>
            <FeedbackCard
              verdict="correct"
              why="The hash map provides O(1) average lookup time for the complement target - num, reducing total runtime to O(N)."
              distractors={[
                "Pre-sorting destroys original indices unless mapped, incurring O(N log N) overhead.",
                "Nested loop exceeds the 10^5 input size limit causing TLE.",
              ]}
              takeaway="When looking for pairs with a target sum, swap quadratic search time for linear auxiliary space via hash complements."
            />
          </div>
        </div>
      </section>

      {/* 6. CodeBlock */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          CodeBlock (Always Dark with Line Highlighting)
        </h2>
        <CodeBlock
          lang="typescript"
          highlightLines={[5]}
          selectedLine={5}
          code={`export function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`}
        />
      </section>

      {/* 7. Milestones & GlowTiles */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          Milestones & GlowTiles
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlowTile numeral="01" label="First Lesson Passed" unlocked tint="good" />
          <GlowTile numeral="02" label="7-Day Streak Achieved" unlocked tint="good" />
          <GlowTile numeral="03" label="50 Blitz Problems" unlocked={false} />
          <GlowTile numeral="04" label="Mastered RAG Pipeline" unlocked={false} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <MilestoneCard
            title="Algorithm Archaeologist"
            condition="Solve 25 Bug Audit items with zero hint leaks"
            unlocked
            progress="25 / 25 completed"
            xp="+150 XP"
          />
          <MilestoneCard
            title="Metacognitive Master"
            condition="Reach 90% calibration across 50 confidence ratings"
            unlocked={false}
            progress="34 / 50 samples"
            xp="+250 XP"
          />
        </div>
      </section>

      {/* 8. States & Overlays */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">
          States, Overlays & Avatars
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard tone="default" padding="md" className="space-y-3">
            <span className="font-mono text-xs uppercase text-[var(--text-3)] block font-semibold">
              Avatars (Conic Aurora Ring)
            </span>
            <div className="flex items-center gap-4">
              <Avatar size="sm" name="Alice" />
              <Avatar size="md" name="Devanshu" />
              <Avatar size="lg" name="Gemini" />
            </div>
            <div className="pt-4 border-t border-[var(--border)] flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>
                Open Dialog/Sheet
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowToast(true)}>
                Trigger Toast
              </Button>
            </div>
          </GlassCard>

          <EmptyState
            title="No Bookmarks Saved"
            description="Star key problems and lesson stages during your drills to review them here."
            action={{ label: "Explore DSA", href: "/dsa" }}
          />

          <ErrorState
            title="Simulation Watchdog Error"
            message="Sandbox worker thread exceeded 1000ms execution timeout."
            eventId="err_m1_sandbox_timeout"
            onRetry={() => {}}
          />
        </div>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </section>

      {/* Modals & Toasts */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Responsive Sheet / Dialog"
        description="Renders as an interactive bottom sheet on mobile (radius 28 top) and a centered glass dialog on desktop."
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-[var(--text-2)]">
            This dialog features a frosted glass backdrop filter, keyboard Escape listener, body scroll lock, and touch dismiss handle on mobile.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>

      {showToast && (
        <Toast
          message="Progress saved to spaced repetition queue."
          tone="good"
          action={{ label: "View", onClick: () => {} }}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
