"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StepperTimeline } from "@/components/ui/stepper-timeline";
import { CodeBlock } from "@/components/ui/code-block";
import { MilestoneCard } from "@/components/ui/milestone-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { OptionButton, OptionState } from "@/components/ui/option-button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { BottomCTA } from "@/components/ui/bottom-cta";

export default function DevTokensPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLine, setSelectedLine] = useState<number | undefined>(2);
  const [optionState, setOptionState] = useState<OptionState>("selected");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  const sampleCode = `function findMaxAverage(nums: number[], k: number): number {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let max = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k]; // invariant window slide
    if (sum > max) max = sum;
  }
  return max / k;
}`;

  return (
    <main className="min-h-screen canvas-dot-grid p-4 sm:p-8 lg:p-12 transition-colors">
      <div className="max-w-[1040px] mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <div className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Design System &amp; UI Primitives
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-bold text-[var(--text-primary)]">
              Core Component <span className="highlighter-pill">Primitives</span>
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-[13px] font-mono rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--border-focus)] transition-colors self-start sm:self-auto cursor-pointer"
          >
            Toggle Theme: <span className="font-bold uppercase">{theme}</span>
          </button>
        </header>

        {/* 1. Tabs & Stepper */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            1. Segmented Tabs &amp; Stepper Timeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card tone="default" padding="md" className="space-y-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-muted)] font-mono uppercase">
                SegmentedTabs (Pill)
              </h3>
              <SegmentedTabs
                value={activeTab}
                onChange={setActiveTab}
                items={[
                  { id: "overview", label: "Overview" },
                  { id: "pseudocode", label: "Pseudocode" },
                  { id: "visualize", label: "Visualize" },
                  { id: "analysis", label: "Analysis" },
                ]}
              />
              <p className="text-[13px] text-[var(--text-secondary)]">
                Active tab selected: <span className="font-mono font-semibold">{activeTab}</span>
              </p>
            </Card>

            <Card tone="default" padding="md" className="space-y-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-muted)] font-mono uppercase">
                StepperTimeline (5 Stages)
              </h3>
              <StepperTimeline
                steps={[
                  { id: "1", title: "01 Why", description: "Why traditional search fails", status: "done" },
                  { id: "2", title: "02 Mental Model", description: "Vector embeddings & cosine similarity", status: "active" },
                  { id: "3", title: "03 See It", description: "Clickable RAG architecture diagram", status: "todo" },
                ]}
              />
            </Card>
          </div>
        </section>

        {/* 2. CodeBlock & Line Selection */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            2. CodeBlock (Bug Audit Line-Tap &amp; Font Controls)
          </h2>
          <CodeBlock
            code={sampleCode}
            lang="typescript"
            selectableLines
            selectedLine={selectedLine}
            onSelectLine={setSelectedLine}
            highlightLines={[6]}
          />
          <p className="text-[12px] font-mono text-[var(--text-muted)]">
            Selected line for bug audit: Line {selectedLine || "None"} (Tap targets $\ge$ 44px on mobile)
          </p>
        </section>

        {/* 3. MCQ Option Buttons & Feedback Card */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            3. MCQ Option Buttons &amp; 5-Part FeedbackCard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold text-[var(--text-muted)] font-mono uppercase">
                Option Button States
              </h3>
              <OptionButton
                prefix="A"
                label="Sliding Window invariant (shrink left pointer when sum >= target)"
                state={optionState}
                onClick={() => setOptionState(optionState === "selected" ? "idle" : "selected")}
              />
              <OptionButton
                prefix="B"
                label="Dynamic Programming state transition"
                state="idle"
              />
              <OptionButton
                prefix="C"
                label="Correct Verified Option"
                state="correct"
              />
              <OptionButton
                prefix="D"
                label="Incorrect option chosen by user"
                state="incorrect"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold text-[var(--text-muted)] font-mono uppercase">
                5-Part FeedbackCard
              </h3>
              <FeedbackCard
                verdict="incorrect"
                why="The window size must remain fixed at k. Incrementing the right pointer without subtracting nums[i - k] accumulates all previous prefix elements."
                distractors={[
                  "Two pointers would require a sorted monotonic array, which sorting would destroy in O(N log N).",
                  "Prefix sums work but require O(N) auxiliary space instead of O(1).",
                ]}
                takeaway="Fixed-size sliding windows require subtracting the outgoing element on every step."
              />
            </div>
          </div>
        </section>

        {/* 4. MilestoneCard & ProgressRing */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            4. Milestones &amp; Progress Ring
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <MilestoneCard
              title="First Steps"
              condition="Complete your first drill session"
              progress="1 / 1"
              unlocked={true}
              xp="+50 XP"
            />
            <MilestoneCard
              title="Bug Hunter"
              condition="Spot the buggy line in 5 snippets"
              progress="3 / 5"
              unlocked={false}
              xp="+150 XP"
            />
            <Card tone="default" padding="md" className="flex items-center justify-around">
              <ProgressRing value={86} label="ACCURACY" />
              <ProgressRing value={45} label="LESSONS" />
            </Card>
          </div>
        </section>

        {/* 5. BottomCTA */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            5. Responsive Bottom CTA
          </h2>
          <Card tone="subtle" padding="md">
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">
              Fixed on mobile with safe-area scrim; sticky inside column (`max-width: 420px`) on desktop.
            </p>
            <BottomCTA
              label="Continue to Next Stage"
              icon={<span>&rarr;</span>}
              onClick={() => alert("CTA triggered")}
            />
          </Card>
        </section>
      </div>
    </main>
  );
}
