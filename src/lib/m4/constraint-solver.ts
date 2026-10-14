import { Dimension, Clue } from "@/content/m4/logic-grid-schema";

export type EntityAssignment = Record<string, string>;

export interface SolverResult {
  solutionCount: number;
  solutions: EntityAssignment[][];
  isValid: boolean;
}

/**
 * Checks if a given entity tuple contains an item name.
 */
function entityHasItem(entity: EntityAssignment, item: string): boolean {
  return Object.values(entity).includes(item);
}

/**
 * Checks if items A and B are in the same entity.
 */
function arePaired(entities: EntityAssignment[], itemA: string, itemB: string): boolean {
  const entityA = entities.find((e) => entityHasItem(e, itemA));
  if (!entityA) return false;
  return entityHasItem(entityA, itemB);
}

/**
 * Determines which dimension an item belongs to.
 */
function getDimensionOfItem(dimensions: Dimension[], item: string): Dimension | undefined {
  return dimensions.find((d) => d.items.includes(item));
}

/**
 * Validates whether an assignment satisfies all clues.
 * Handles both complete and partial checks.
 */
export function checkCluesAgainstEntities(
  entities: EntityAssignment[],
  clues: Clue[],
  dimensions: Dimension[],
  isComplete = false
): boolean {
  for (const clue of clues) {
    const { type, itemA, itemB, itemC, itemD } = clue;

    const entityA = entities.find((e) => entityHasItem(e, itemA));
    const entityB = entities.find((e) => entityHasItem(e, itemB));

    if (type === "is") {
      // itemA is itemB
      if (entityA && entityB && entityA !== entityB) {
        return false;
      }
      // If dim of itemB is already assigned in entityA, but it's not itemB
      if (entityA) {
        const dimB = getDimensionOfItem(dimensions, itemB);
        if (dimB && entityA[dimB.id] && entityA[dimB.id] !== itemB) {
          return false;
        }
      }
      if (entityB) {
        const dimA = getDimensionOfItem(dimensions, itemA);
        if (dimA && entityB[dimA.id] && entityB[dimA.id] !== itemA) {
          return false;
        }
      }
      if (isComplete && !arePaired(entities, itemA, itemB)) {
        return false;
      }
    } else if (type === "isNot") {
      // itemA is NOT itemB
      if (entityA && entityB && entityA === entityB) {
        return false;
      }
      if (isComplete && arePaired(entities, itemA, itemB)) {
        return false;
      }
    } else if (type === "eitherOr") {
      // itemA is either itemB or itemC
      const optC = itemC || "";
      if (entityA) {
        const dimBC = getDimensionOfItem(dimensions, itemB);
        if (dimBC && entityA[dimBC.id]) {
          const val = entityA[dimBC.id];
          if (val !== itemB && val !== optC) {
            return false;
          }
        }
      }
      if (isComplete) {
        const hasB = arePaired(entities, itemA, itemB);
        const hasC = arePaired(entities, itemA, optC);
        if (!(hasB || hasC)) return false;
        if (hasB && hasC) return false;
      }
    } else if (type === "conditional") {
      // If itemA is itemB, then itemC is itemD
      const optC = itemC || "";
      const optD = itemD || "";
      if (isComplete) {
        if (arePaired(entities, itemA, itemB)) {
          if (!arePaired(entities, optC, optD)) {
            return false;
          }
        }
      } else {
        // If we know itemA is itemB, and we know itemC is NOT itemD
        if (entityA && entityB && entityA === entityB) {
          const entityC = entities.find((e) => entityHasItem(e, optC));
          const entityD = entities.find((e) => entityHasItem(e, optD));
          if (entityC && entityD && entityC !== entityD) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

/**
 * Generates all permutations of an array.
 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = permutations(remaining);
    for (const p of remainingPerms) {
      result.push([current, ...p]);
    }
  }
  return result;
}

/**
 * Deterministic Constraint Solver for Logic Grids.
 * Explores full state-space and counts all valid solutions.
 * Returns solutionCount === 1 iff the puzzle has exactly one unique solution.
 */
export function solveLogicGrid(
  dimensions: Dimension[],
  clues: Clue[],
  maxSolutions = 10
): SolverResult {
  if (dimensions.length < 2) {
    return { solutionCount: 0, solutions: [], isValid: false };
  }

  const primaryDim = dimensions[0];
  const otherDims = dimensions.slice(1);

  // Pre-generate permutations for each other dimension
  const dimPermutations: Array<{ dim: Dimension; perms: string[][] }> = otherDims.map(
    (dim) => ({
      dim,
      perms: permutations([...dim.items]),
    })
  );

  const foundSolutions: EntityAssignment[][] = [];

  // Recursive assignment of dimensions
  function search(dimIndex: number, currentEntities: EntityAssignment[]) {
    if (foundSolutions.length >= maxSolutions) return;

    if (dimIndex === otherDims.length) {
      // Complete assignment reached, verify all clues strictly
      if (checkCluesAgainstEntities(currentEntities, clues, dimensions, true)) {
        foundSolutions.push(currentEntities.map((e) => ({ ...e })));
      }
      return;
    }

    const { dim, perms } = dimPermutations[dimIndex];

    for (const perm of perms) {
      // Build updated entities with this dimension's permutation
      const nextEntities = currentEntities.map((e, idx) => ({
        ...e,
        [dim.id]: perm[idx],
      }));

      // Forward check clues on partial assignment
      if (checkCluesAgainstEntities(nextEntities, clues, dimensions, false)) {
        search(dimIndex + 1, nextEntities);
      }
    }
  }

  // Base entities indexed by primary dimension
  const baseEntities: EntityAssignment[] = primaryDim.items.map((item) => ({
    [primaryDim.id]: item,
  }));

  search(0, baseEntities);

  return {
    solutionCount: foundSolutions.length,
    solutions: foundSolutions,
    isValid: foundSolutions.length === 1,
  };
}

/**
 * Validates a logic grid submission against the canonical solution.
 */
export function evaluateLogicGridSubmission(
  canonicalSolution: EntityAssignment[],
  userAssignments: EntityAssignment[],
  dimensions: Dimension[]
): {
  correct: boolean;
  accuracy: number;
  mistakes: string[];
} {
  const mistakes: string[] = [];
  const primaryDim = dimensions[0];

  let totalPairs = 0;
  let correctPairs = 0;

  for (const primaryItem of primaryDim.items) {
    const canonicalEntity = canonicalSolution.find((e) => entityHasItem(e, primaryItem));
    const userEntity = userAssignments.find((e) => entityHasItem(e, primaryItem));

    if (!canonicalEntity || !userEntity) {
      mistakes.push(`Missing assignment for ${primaryItem}`);
      continue;
    }

    for (const dim of dimensions.slice(1)) {
      totalPairs++;
      const canonicalVal = canonicalEntity[dim.id];
      const userVal = userEntity[dim.id];

      if (canonicalVal === userVal) {
        correctPairs++;
      } else {
        mistakes.push(
          `${primaryItem} should be paired with ${dim.name} "${canonicalVal}", but got "${userVal || "None"}"`
        );
      }
    }
  }

  const correct = mistakes.length === 0;
  const accuracy = totalPairs > 0 ? Number((correctPairs / totalPairs).toFixed(2)) : 0;

  return {
    correct,
    accuracy,
    mistakes,
  };
}
