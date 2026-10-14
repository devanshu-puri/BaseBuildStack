import { LogicGridPuzzle } from "./logic-grid-schema";
import { generateVerifiedLogicGrid } from "./logic-grid-generator";

// Pre-generate and cache curated verified puzzles (seeds 1 to 6)
export const CURATED_LOGIC_GRIDS: LogicGridPuzzle[] = [
  generateVerifiedLogicGrid(1),
  generateVerifiedLogicGrid(2),
  generateVerifiedLogicGrid(3),
  generateVerifiedLogicGrid(4),
  generateVerifiedLogicGrid(5),
  generateVerifiedLogicGrid(6),
];

/**
 * Returns all verified logic grid puzzles.
 */
export function getAllLogicGrids(): LogicGridPuzzle[] {
  return CURATED_LOGIC_GRIDS;
}

/**
 * Finds a logic grid puzzle by unique ID.
 */
export function getLogicGridById(id: string): LogicGridPuzzle | undefined {
  return CURATED_LOGIC_GRIDS.find((g) => g.id === id);
}
