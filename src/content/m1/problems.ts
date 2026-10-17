import { BlitzProblem, BlitzProblemSchema } from "./schema";
export type { BlitzProblem } from "./schema";
import { arraysAndHashingProblems } from "./data/p0-arrays-hashing";
import { twoPointersProblems } from "./data/p1-two-pointers";
import { slidingWindowProblems } from "./data/p2-sliding-window";
import { monotonicStackAndCycleProblems } from "./data/p3-monotonic-stack";
import { binarySearchProblems } from "./data/p4-binary-search";
import { linkedListProblems } from "./data/p5-linked-lists";
import { heapsAndIntervalsProblems } from "./data/p6-heaps-intervals";
import { treesAndGraphsProblems } from "./data/p7-trees-graphs";
import { dpAndAdvancedProblems } from "./data/p8-dp-advanced";

const RAW_PROBLEMS: BlitzProblem[] = [
  ...arraysAndHashingProblems,
  ...twoPointersProblems,
  ...slidingWindowProblems,
  ...monotonicStackAndCycleProblems,
  ...binarySearchProblems,
  ...linkedListProblems,
  ...heapsAndIntervalsProblems,
  ...treesAndGraphsProblems,
  ...dpAndAdvancedProblems,
];

// Strictly validate every seeded problem at runtime boundary
export const ALL_BLITZ_PROBLEMS: BlitzProblem[] = RAW_PROBLEMS.map((p) =>
  BlitzProblemSchema.parse(p)
);

export function getBlitzProblemById(id: string): BlitzProblem | undefined {
  return ALL_BLITZ_PROBLEMS.find((p) => p.id === id);
}

export function getBlitzProblemsByCategory(category: string): BlitzProblem[] {
  return ALL_BLITZ_PROBLEMS.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
}

export function getBlitzCategories(): string[] {
  const categories = new Set(ALL_BLITZ_PROBLEMS.map((p) => p.category));
  return Array.from(categories);
}
