import { CURATED_LOGIC_GRIDS } from "../src/content/m4/logic-grid-data";
import { solveLogicGrid } from "../src/lib/m4/constraint-solver";

async function main() {
  console.log(`\n==================================================`);
  console.log(`  VERIFYING LOGIC GRID PUZZLE BANK (${CURATED_LOGIC_GRIDS.length} PUZZLES)`);
  console.log(`==================================================\n`);

  let passed = 0;
  let failed = 0;

  for (const puzzle of CURATED_LOGIC_GRIDS) {
    const result = solveLogicGrid(puzzle.dimensions, puzzle.clues);
    if (result.isValid && result.solutionCount === 1) {
      console.log(`[PASS] ${puzzle.id} - "${puzzle.title}": Certified exactly 1 unique solution`);
      passed++;
    } else {
      console.error(
        `[FAIL] ${puzzle.id} - "${puzzle.title}": Invalid solution count (${result.solutionCount})`
      );
      failed++;
    }
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`Summary: ${passed} valid, ${failed} invalid of ${CURATED_LOGIC_GRIDS.length} total puzzles.`);
  console.log(`--------------------------------------------------\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during puzzle verification:", err);
  process.exit(1);
});
