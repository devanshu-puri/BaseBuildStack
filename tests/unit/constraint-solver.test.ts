import { describe, it, expect } from "vitest";
import { Dimension, Clue } from "@/content/m4/logic-grid-schema";
import {
  solveLogicGrid,
  evaluateLogicGridSubmission,
} from "@/lib/m4/constraint-solver";
import { generateVerifiedLogicGrid } from "@/content/m4/logic-grid-generator";
import { getAllLogicGrids, getLogicGridById } from "@/content/m4/logic-grid-data";

describe("Module IV — Logic Grid CSP Constraint Solver", () => {
  const dimensions: Dimension[] = [
    { id: "dev", name: "Developer", items: ["Alice", "Bob", "Charlie"] },
    { id: "lang", name: "Language", items: ["Rust", "Go", "TypeScript"] },
    { id: "sys", name: "System", items: ["Auth", "Payments", "Search"] },
  ];

  it("should find exactly 1 unique solution when constraints are complete and consistent", () => {
    const clues: Clue[] = [
      { id: "c1", type: "is", itemA: "Alice", itemB: "Rust", text: "Alice uses Rust." },
      { id: "c2", type: "is", itemA: "Bob", itemB: "Go", text: "Bob uses Go." },
      { id: "c3", type: "is", itemA: "Rust", itemB: "Auth", text: "Rust is used for Auth." },
      { id: "c4", type: "is", itemA: "Go", itemB: "Payments", text: "Go is used for Payments." },
    ];

    const result = solveLogicGrid(dimensions, clues);

    expect(result.solutionCount).toBe(1);
    expect(result.isValid).toBe(true);
    expect(result.solutions).toHaveLength(1);

    const sol = result.solutions[0];
    const alice = sol.find((e) => e.dev === "Alice");
    expect(alice).toEqual({ dev: "Alice", lang: "Rust", sys: "Auth" });

    const charlie = sol.find((e) => e.dev === "Charlie");
    expect(charlie).toEqual({ dev: "Charlie", lang: "TypeScript", sys: "Search" });
  });

  it("should detect contradiction and report 0 solutions", () => {
    const contradictoryClues: Clue[] = [
      { id: "c1", type: "is", itemA: "Alice", itemB: "Rust", text: "Alice uses Rust." },
      { id: "c2", type: "isNot", itemA: "Alice", itemB: "Rust", text: "Alice does NOT use Rust." },
    ];

    const result = solveLogicGrid(dimensions, contradictoryClues);
    expect(result.solutionCount).toBe(0);
    expect(result.isValid).toBe(false);
  });

  it("should detect under-constrained clues and report multiple solutions (>1)", () => {
    // Only one clue provided for a 3x3 grid
    const underconstrainedClues: Clue[] = [
      { id: "c1", type: "is", itemA: "Alice", itemB: "Rust", text: "Alice uses Rust." },
    ];

    const result = solveLogicGrid(dimensions, underconstrainedClues);
    expect(result.solutionCount).toBeGreaterThan(1);
    expect(result.isValid).toBe(false);
  });

  it("should handle conditional and either-or constraints properly", () => {
    const conditionalClues: Clue[] = [
      { id: "c1", type: "is", itemA: "Alice", itemB: "Rust", text: "Alice uses Rust." },
      { id: "c2", type: "eitherOr", itemA: "Bob", itemB: "Go", itemC: "TypeScript", text: "Bob uses Go or TS." },
      { id: "c3", type: "isNot", itemA: "Bob", itemB: "TypeScript", text: "Bob does not use TS." },
      { id: "c4", type: "conditional", itemA: "Alice", itemB: "Rust", itemC: "Charlie", itemD: "Search", text: "If Alice uses Rust, Charlie works on Search." },
      { id: "c5", type: "is", itemA: "Bob", itemB: "Payments", text: "Bob works on Payments." },
    ];

    const result = solveLogicGrid(dimensions, conditionalClues);
    expect(result.solutionCount).toBe(1);
    expect(result.isValid).toBe(true);
  });

  it("should evaluate candidate submission accuracy correctly", () => {
    const canonical = [
      { dev: "Alice", lang: "Rust", sys: "Auth" },
      { dev: "Bob", lang: "Go", sys: "Payments" },
      { dev: "Charlie", lang: "TypeScript", sys: "Search" },
    ];

    const perfectUser = [
      { dev: "Alice", lang: "Rust", sys: "Auth" },
      { dev: "Bob", lang: "Go", sys: "Payments" },
      { dev: "Charlie", lang: "TypeScript", sys: "Search" },
    ];

    const res = evaluateLogicGridSubmission(canonical, perfectUser, dimensions);
    expect(res.correct).toBe(true);
    expect(res.accuracy).toBe(1);
    expect(res.mistakes).toHaveLength(0);

    const flawedUser = [
      { dev: "Alice", lang: "Go", sys: "Auth" }, // wrong lang
      { dev: "Bob", lang: "Rust", sys: "Payments" }, // wrong lang
      { dev: "Charlie", lang: "TypeScript", sys: "Search" },
    ];

    const flawedRes = evaluateLogicGridSubmission(canonical, flawedUser, dimensions);
    expect(flawedRes.correct).toBe(false);
    expect(flawedRes.accuracy).toBeLessThan(1);
    expect(flawedRes.mistakes.length).toBeGreaterThan(0);
  });
});

describe("Module IV — Acceptance Test: 30 Consecutive Single-Solution Puzzles", () => {
  it("verifies that 30 consecutive generated logic puzzles have EXACTLY 1 solution", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const puzzle = generateVerifiedLogicGrid(seed);

      // Verify puzzle dimensions & clues
      expect(puzzle.dimensions.length).toBeGreaterThanOrEqual(3);
      expect(puzzle.clues.length).toBeGreaterThanOrEqual(4);

      // Solve with CSP solver
      const solverResult = solveLogicGrid(puzzle.dimensions, puzzle.clues);

      // Must strictly be 1 solution
      expect(solverResult.solutionCount).toBe(1);
      expect(solverResult.isValid).toBe(true);
    }
  });

  it("verifies all pre-cached curated puzzles in the bank", () => {
    const all = getAllLogicGrids();
    expect(all.length).toBe(6);

    for (const puzzle of all) {
      const retrieved = getLogicGridById(puzzle.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(puzzle.id);

      const verification = solveLogicGrid(puzzle.dimensions, puzzle.clues);
      expect(verification.solutionCount).toBe(1);
    }
  });
});
