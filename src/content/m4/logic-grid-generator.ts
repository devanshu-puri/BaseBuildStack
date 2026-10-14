import {
  Dimension,
  Clue,
  LogicGridPuzzle,
} from "./logic-grid-schema";
import { solveLogicGrid } from "@/lib/m4/constraint-solver";

// Curated theme templates for generator
const THEMES = [
  {
    title: "Distributed Migration Hackathon",
    desc: "Match each lead engineer to their migrated microservice and target cloud region.",
    dim1: { id: "engineer", name: "Engineer", items: ["Alice", "Bob", "Charlie", "Diana"] },
    dim2: { id: "service", name: "Service", items: ["Auth", "Payments", "Search", "Ingest"] },
    dim3: { id: "region", name: "Region", items: ["US-East", "EU-West", "AP-South", "SA-East"] },
  },
  {
    title: "Compiler Optimisation Summit",
    desc: "Deduce which architect designed which compiler pass and target ISA.",
    dim1: { id: "architect", name: "Architect", items: ["Elena", "Faisal", "Grace", "Hector"] },
    dim2: { id: "pass", name: "Compiler Pass", items: ["DeadCode", "Inlining", "Vectorize", "RegAlloc"] },
    dim3: { id: "isa", name: "Architecture", items: ["x86-64", "ARM64", "RISC-V", "Wasm"] },
  },
  {
    title: "Production Incident Triage",
    desc: "Assign the root cause incident to the affected datastore and on-call engineer.",
    dim1: { id: "engineer", name: "Engineer", items: ["Kavya", "Liam", "Mei", "Noah"] },
    dim2: { id: "datastore", name: "Datastore", items: ["PostgreSQL", "Redis", "Kafka", "ClickHouse"] },
    dim3: { id: "incident", name: "Incident", items: ["OOM-Killed", "Deadlock", "Split-Brain", "Disk-Full"] },
  },
];

// Seeded pseudorandom number generator for reproducibility
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(array: T[], rand: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Deterministically generates a verified logic grid puzzle guaranteed to have EXACTLY 1 solution.
 * Rejects any puzzle configuration where solver count != 1.
 */
export function generateVerifiedLogicGrid(seedNumber: number): LogicGridPuzzle {
  const rand = mulberry32(seedNumber);
  const theme = THEMES[seedNumber % THEMES.length];

  const dimensions: Dimension[] = [
    { ...theme.dim1, items: [...theme.dim1.items] },
    { ...theme.dim2, items: [...theme.dim2.items] },
    { ...theme.dim3, items: [...theme.dim3.items] },
  ];

  const N = dimensions[0].items.length;

  // 1. Choose a canonical bijection
  const p1 = dimensions[0].items;
  const p2 = shuffle(dimensions[1].items, rand);
  const p3 = shuffle(dimensions[2].items, rand);

  const canonicalSolution = p1.map((item, idx) => ({
    [dimensions[0].id]: item,
    [dimensions[1].id]: p2[idx],
    [dimensions[2].id]: p3[idx],
  }));

  // Helper to generate positive clue
  const makePositiveClue = (id: string, a: string, b: string): Clue => ({
    id,
    type: "is",
    itemA: a,
    itemB: b,
    text: `${a} is assigned to ${b}.`,
  });

  // Helper to generate negative clue
  const makeNegativeClue = (id: string, a: string, b: string): Clue => ({
    id,
    type: "isNot",
    itemA: a,
    itemB: b,
    text: `${a} is not assigned to ${b}.`,
  });

  // Helper for either-or clue
  const makeEitherOrClue = (id: string, a: string, b: string, c: string): Clue => ({
    id,
    type: "eitherOr",
    itemA: a,
    itemB: b,
    itemC: c,
    text: `${a} is assigned to either ${b} or ${c}.`,
  });

  // Candidate clue pool directly derived from the canonical solution
  const clueCandidates: Clue[] = [];
  let clueId = 1;

  // Positive clues between dim0 and dim1
  for (let i = 0; i < N - 1; i++) {
    clueCandidates.push(makePositiveClue(`c-${clueId++}`, p1[i], p2[i]));
  }

  // Positive clues between dim1 and dim2
  for (let i = 0; i < N - 1; i++) {
    clueCandidates.push(makePositiveClue(`c-${clueId++}`, p2[i], p3[i]));
  }

  // Negative cross clues
  for (let i = 0; i < N; i++) {
    const wrongIdx1 = (i + 1) % N;
    clueCandidates.push(makeNegativeClue(`c-${clueId++}`, p1[i], p2[wrongIdx1]));
    const wrongIdx2 = (i + 2) % N;
    clueCandidates.push(makeNegativeClue(`c-${clueId++}`, p1[i], p3[wrongIdx2]));
    clueCandidates.push(makeNegativeClue(`c-${clueId++}`, p2[i], p3[wrongIdx1]));
  }

  // Either-or clues
  for (let i = 0; i < N; i++) {
    const wrongIdx = (i + 1) % N;
    clueCandidates.push(makeEitherOrClue(`c-${clueId++}`, p1[i], p2[i], p2[wrongIdx]));
  }

  // Greedy clue selection to reach exactly 1 solution
  const activeClues: Clue[] = [];
  const shuffledCandidates = shuffle(clueCandidates, rand);

  for (const candidate of shuffledCandidates) {
    activeClues.push(candidate);
    const result = solveLogicGrid(dimensions, activeClues);

    if (result.solutionCount === 1) {
      // Exactly one unique solution reached!
      break;
    }
  }

  // Final verification using CSP solver
  const finalVerification = solveLogicGrid(dimensions, activeClues);

  if (finalVerification.solutionCount !== 1) {
    // If randomized greedy selection didn't reach 1, add guaranteed canonical anchor clues
    const anchorClues: Clue[] = [];
    let anchorId = 100;
    for (let i = 0; i < N; i++) {
      anchorClues.push(makePositiveClue(`anc-${anchorId++}`, p1[i], p2[i]));
      anchorClues.push(makePositiveClue(`anc-${anchorId++}`, p2[i], p3[i]));
    }
    // Remove last 2 anchors and replace with negative clues to keep it a puzzle
    const refinedClues: Clue[] = [
      anchorClues[0],
      anchorClues[1],
      anchorClues[2],
      makeNegativeClue(`anc-${anchorId++}`, p1[N - 1], p2[0]),
      makeNegativeClue(`anc-${anchorId++}`, p1[N - 1], p3[0]),
      makePositiveClue(`anc-${anchorId++}`, p1[N - 1], p2[N - 1]),
      makePositiveClue(`anc-${anchorId++}`, p2[N - 1], p3[N - 1]),
    ];

    const anchoredResult = solveLogicGrid(dimensions, refinedClues);
    if (anchoredResult.solutionCount !== 1) {
      throw new Error(`Failed to generate single-solution logic grid for seed ${seedNumber}`);
    }

    return {
      id: `grid-${seedNumber}`,
      title: `${theme.title} #${seedNumber}`,
      description: theme.desc,
      dimensions,
      clues: refinedClues,
      solution: canonicalSolution,
      difficulty: "medium",
      xpAward: 50,
    };
  }

  return {
    id: `grid-${seedNumber}`,
    title: `${theme.title} #${seedNumber}`,
    description: theme.desc,
    dimensions,
    clues: activeClues,
    solution: canonicalSolution,
    difficulty: "medium",
    xpAward: 50,
  };
}
