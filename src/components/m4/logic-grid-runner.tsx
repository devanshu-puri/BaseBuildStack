"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { FeedbackCard } from "@/components/ui/feedback-card";
import { LogicGridPuzzle, CellState, EntityAssignment } from "@/content/m4/logic-grid-schema";

interface LogicGridRunnerProps {
  puzzle: LogicGridPuzzle;
}

export function LogicGridRunner({ puzzle }: LogicGridRunnerProps) {

  const primaryDim = puzzle.dimensions[0];
  const otherDims = puzzle.dimensions.slice(1);

  // Cell state key: `${rowItem}::${colItem}` -> 'empty' | 'cross' | 'check'
  const [gridState, setGridState] = useState<Record<string, CellState>>({});
  // Struck-through clues: Set of clue IDs
  const [checkedClues, setCheckedClues] = useState<Record<string, boolean>>({});

  // Keyboard navigation focus
  const [focusRow, setFocusRow] = useState(0);
  const [focusCol, setFocusCol] = useState(0);

  // Confidence rating before reveal: "guessing" | "unsure" | "certain"
  const [confidence, setConfidence] = useState<"guessing" | "unsure" | "certain">("certain");

  // Socratic hint state
  const [hint, setHint] = useState<{
    text: string;
    source: string;
  } | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    accuracy: number;
    xpAwarded: number;
    feedback: string;
    mistakes?: string[];
  } | null>(null);

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = typeof performance !== "undefined" ? performance.now() : 0;
  }, []);

  // Collect all column items across other dimensions
  const colItems = useMemo(() => {
    const items: Array<{ item: string; dimId: string; dimName: string }> = [];
    otherDims.forEach((dim) => {
      dim.items.forEach((item) => {
        items.push({ item, dimId: dim.id, dimName: dim.name });
      });
    });
    return items;
  }, [otherDims]);

  // Cycle cell state: empty -> cross -> check -> empty
  const cycleCell = (rowItem: string, colItem: string) => {
    const key = `${rowItem}::${colItem}`;
    setGridState((prev) => {
      const current = prev[key] || "empty";
      const next: CellState =
        current === "empty" ? "cross" : current === "cross" ? "check" : "empty";
      return { ...prev, [key]: next };
    });
  };

  // Keyboard navigation on grid container
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (result) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusRow((prev) => Math.min(primaryDim.items.length - 1, prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusRow((prev) => Math.max(0, prev - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusCol((prev) => Math.min(colItems.length - 1, prev + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusCol((prev) => Math.max(0, prev - 1));
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const rowItem = primaryDim.items[focusRow];
      const col = colItems[focusCol];
      if (rowItem && col) {
        cycleCell(rowItem, col.item);
      }
    }
  };

  // Toggle clue checklist item
  const toggleClue = (clueId: string) => {
    setCheckedClues((prev) => ({
      ...prev,
      [clueId]: !prev[clueId],
    }));
  };

  // Convert check marks into entity assignments for evaluation
  const extractAssignments = (): EntityAssignment[] => {
    const assignments: EntityAssignment[] = [];

    for (const primaryItem of primaryDim.items) {
      const entity: EntityAssignment = {
        [primaryDim.id]: primaryItem,
      };

      for (const dim of otherDims) {
        for (const item of dim.items) {
          const key = `${primaryItem}::${item}`;
          if (gridState[key] === "check") {
            entity[dim.id] = item;
          }
        }
      }

      assignments.push(entity);
    }

    return assignments;
  };

  // Request a Socratic guiding question without revealing answers
  const handleRequestHint = async () => {
    setIsLoadingHint(true);
    setHintError(null);
    try {
      const activeClueIds = Object.keys(checkedClues).filter((k) => checkedClues[k]);
      const res = await fetch("/api/m4/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          assignments: extractAssignments(),
          checkedClueIds: activeClueIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setHint({
          text: data.data.hint,
          source: data.data.source,
        });
      } else {
        setHintError(data.error || "Failed to retrieve Socratic hint.");
      }
    } catch {
      setHintError("Network error while requesting hint.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Submit assessment to API
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    const durationMs = Math.max(0, Math.round(now - (startTimeRef.current || 0)));
    const userAssignments = extractAssignments();

    try {
      const res = await fetch(`/api/m4/logic-grid/${puzzle.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          assignments: userAssignments,
          durationMs,
          confidence,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setResult(json.data);
      } else {
        throw new Error(json.error || "Failed to submit logic grid");
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count total checks
  const totalChecks = Object.values(gridState).filter((s) => s === "check").length;
  const expectedChecks = primaryDim.items.length * otherDims.length;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/m4/logic-grid"
          className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 font-mono"
        >
          ← Logic Grid Puzzles
        </Link>

        <div className="flex items-center gap-2">
          <Chip k="SOLVER" v="Certified 1 Solution" tone="good" className="text-[11px]" />
          <Chip k="REWARD" v={`+${puzzle.xpAward} XP`} tone="accent" className="text-[11px]" />
        </div>
      </div>

      {/* Puzzle Title Card */}
      <GlassCard tone="default" bezel className="p-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            Deterministic Constraint Deduction
          </span>
          <span className="text-xs text-[var(--muted)]">•</span>
          <span className="text-xs text-[var(--muted)] capitalize">
            {puzzle.difficulty} difficulty
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
          {puzzle.title}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)]">
          {puzzle.description}
        </p>

        <div className="flex items-center gap-3 pt-2 text-xs font-mono text-[var(--muted)]">
          <span>Click cell: EMPTY → ✗ (Cross) → ✓ (Check)</span>
          <span>•</span>
          <span>Keyboard: Arrow keys + Space/Enter</span>
        </div>
      </GlassCard>

      {/* Main Grid + Clues Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Deduction Matrix (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard
            tone="default"
            bezel
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="p-4 overflow-x-auto focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <div className="min-w-[480px]">
              <table className="w-full border-collapse text-left">
                <thead>
                  {/* Category Group Header */}
                  <tr>
                    <th className="p-2 border-b border-r border-[var(--border)] text-[11px] font-mono text-[var(--muted)]">
                      {primaryDim.name}
                    </th>
                    {otherDims.map((dim) => (
                      <th
                        key={dim.id}
                        colSpan={dim.items.length}
                        className="p-2 border-b border-r border-[var(--border)] text-center text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider bg-[var(--glass-subtle)]"
                      >
                        {dim.name}
                      </th>
                    ))}
                  </tr>
                  {/* Column Item Names */}
                  <tr>
                    <th className="p-2 border-b border-r border-[var(--border)]" />
                    {colItems.map((col, cIdx) => (
                      <th
                        key={`${col.dimId}-${col.item}`}
                        className={`p-2 border-b border-r border-[var(--border)] text-[11px] font-mono text-center truncate max-w-[80px] ${
                          focusCol === cIdx ? "bg-[var(--accent)]/15 font-bold text-[var(--accent)]" : "text-[var(--muted)]"
                        }`}
                        title={col.item}
                      >
                        {col.item}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {primaryDim.items.map((rowItem, rIdx) => (
                    <tr key={rowItem} className="border-b border-[var(--border)]">
                      {/* Row Label */}
                      <td
                        className={`p-2.5 border-r border-[var(--border)] text-xs font-bold font-mono truncate max-w-[100px] text-[var(--fg)] ${
                          focusRow === rIdx ? "bg-[var(--accent)]/15" : ""
                        }`}
                        title={rowItem}
                      >
                        {rowItem}
                      </td>

                      {/* Deduction Cells */}
                      {colItems.map((col, cIdx) => {
                        const key = `${rowItem}::${col.item}`;
                        const state = gridState[key] || "empty";
                        const isFocused = focusRow === rIdx && focusCol === cIdx;

                        return (
                          <td
                            key={key}
                            onClick={() => !result && cycleCell(rowItem, col.item)}
                            className={`p-0 border-r border-[var(--border)] text-center select-none cursor-pointer transition-colors ${
                              isFocused ? "ring-2 ring-[var(--accent)] ring-inset" : ""
                            } ${
                              state === "check"
                                ? "bg-[var(--state-good-bg)]"
                                : state === "cross"
                                ? "bg-[var(--glass-subtle)]"
                                : "hover:bg-[var(--glass-subtle)]"
                            }`}
                          >
                            <div className="w-10 h-10 flex items-center justify-center font-mono text-sm font-bold">
                              {state === "check" && (
                                <span className="text-[var(--state-good-fg)]">✓</span>
                              )}
                              {state === "cross" && (
                                <span className="text-[var(--muted)] opacity-50">✗</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Confidence Calibration Selector before Submission */}
          {!result && (
            <GlassCard tone="subtle" className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--muted)] font-semibold uppercase tracking-wider">
                  Confidence Calibration Before Reveal:
                </span>
                <span className="text-[var(--fg)] capitalize font-semibold">
                  {confidence === "certain"
                    ? "100% Certain"
                    : confidence === "unsure"
                    ? "Unsure / Neutral"
                    : "Guessing"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConfidence("guessing")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    confidence === "guessing"
                      ? "bg-[var(--state-warn-bg)] text-[var(--state-warn-fg)] border-[var(--state-warn-fg)] shadow-xs"
                      : "bg-[var(--glass-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--fg)]"
                  }`}
                >
                  🤔 Guessing
                </button>
                <button
                  type="button"
                  onClick={() => setConfidence("unsure")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    confidence === "unsure"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)] shadow-xs"
                      : "bg-[var(--glass-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--fg)]"
                  }`}
                >
                  ⚖️ Unsure
                </button>
                <button
                  type="button"
                  onClick={() => setConfidence("certain")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    confidence === "certain"
                      ? "bg-[var(--state-good-bg)] text-[var(--state-good-fg)] border-[var(--state-good-fg)] shadow-xs"
                      : "bg-[var(--glass-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--fg)]"
                  }`}
                >
                  🎯 100% Certain
                </button>
              </div>
            </GlassCard>
          )}

          {/* Quick Actions & Validation Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
              <span>Confirmed Pairs:</span>
              <span className="font-bold text-[var(--fg)]">
                {totalChecks} / {expectedChecks}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setGridState({})}
                disabled={Boolean(result)}
              >
                Clear Grid
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isSubmitting || Boolean(result)}
              >
                {isSubmitting ? "Verifying Solution..." : "Verify Deduction Solution →"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Clues List + Socratic Hint (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Socratic Hint Panel */}
          <GlassCard tone="subtle" bezel className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💡</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg)] font-mono">
                  Socratic Logic Guidance
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestHint}
                disabled={isLoadingHint || Boolean(result)}
              >
                {isLoadingHint ? "Analyzing Clues..." : "Ask Hint"}
              </Button>
            </div>

            {hint && (
              <GlassCard tone="default" className="p-4 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1">
                    <span>Guiding Question</span>
                    <span>•</span>
                    <span className="capitalize">{hint.source} Safe</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setHint(null)}
                    className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)] cursor-pointer"
                  >
                    ✕ Dismiss
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[var(--fg)] italic leading-relaxed">
                  &ldquo;{hint.text}&rdquo;
                </p>
                <p className="text-[10px] text-[var(--muted)] font-mono">
                  Socratic hints guide your deduction path without leaking solution pairings.
                </p>
              </GlassCard>
            )}

            {hintError && (
              <p className="text-xs text-[var(--state-bad-fg)] font-mono">{hintError}</p>
            )}
          </GlassCard>

          <GlassCard tone="default" bezel className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)] font-mono">
                Deduction Clues ({puzzle.clues.length})
              </h2>
              <span className="text-[11px] font-mono text-[var(--muted)]">
                Click clue to cross out
              </span>
            </div>

            <div className="space-y-2.5">
              {puzzle.clues.map((clue, idx) => {
                const isChecked = Boolean(checkedClues[clue.id]);

                return (
                  <div
                    key={clue.id}
                    onClick={() => toggleClue(clue.id)}
                    className={`p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer flex items-start gap-2.5 ${
                      isChecked
                        ? "bg-[var(--glass-subtle)] border-transparent text-[var(--muted)] line-through opacity-60"
                        : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 ${
                        isChecked
                          ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg,#ffffff)] font-bold"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {isChecked ? "✓" : idx + 1}
                    </span>
                    <span className="flex-1">{clue.text}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Post-submission Result & 5-Part FeedbackCard */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-[var(--border)] animate-in fade-in">
          <FeedbackCard
            verdict={result.correct ? "correct" : "incorrect"}
            why={result.feedback}
            distractors={result.mistakes || []}
            takeaway="Logic grids are solved by binary elimination: placing a confirmed check eliminates all alternative candidates in that row and column sub-grid."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <Link
                href="/m4/logic-grid"
                className="text-xs font-semibold text-[var(--accent)] hover:underline font-mono"
              >
                ← Choose Another Logic Grid
              </Link>
              <span className="text-[var(--muted)]">•</span>
              <Link
                href="/m4/insights"
                className="text-xs font-semibold text-[var(--accent)] hover:underline font-mono"
              >
                View Metacognitive Calibration Dashboard →
              </Link>
            </div>

            <Button
              href="/m4"
              variant="primary"
              size="md"
            >
              Return to Module IV Hub →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
