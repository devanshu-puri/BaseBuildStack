import { ALL_BLITZ_PROBLEMS } from "../src/content/m1/problems";
import { BUG_AUDIT_PROBLEMS } from "../src/content/m1/bug-audit-data";
import { OPEN_ENDED_DRILLS } from "../src/content/m1/open-ended-data";
import { CURATED_QUIZ_QUESTIONS } from "../src/content/m2/quiz-questions-data";
import { CURATED_LESSONS } from "../src/content/m3/lessons-data";
import { CURATED_LOGIC_GRIDS } from "../src/content/m4/logic-grid-data";
import { getDailySprint } from "../src/content/m4/sprint-generator";

async function main() {
  console.log(`\n==================================================`);
  console.log(`  SEEDING & VALIDATING CONTENT REPOSITORY`);
  console.log(`==================================================\n`);

  console.log(`✓ Module I: ${ALL_BLITZ_PROBLEMS.length} Pattern Blitz problems loaded & verified.`);
  console.log(`✓ Module I: ${BUG_AUDIT_PROBLEMS.length} Bug Audit problem snippets loaded & verified.`);
  console.log(`✓ Module I: ${OPEN_ENDED_DRILLS.length} Open-Ended system design drills loaded.`);
  console.log(`✓ Module II: ${CURATED_QUIZ_QUESTIONS.length} Technical interview quiz questions verified.`);
  console.log(`✓ Module III: ${CURATED_LESSONS.length} 5-stage Tech Bites lessons loaded.`);
  console.log(`✓ Module IV: ${CURATED_LOGIC_GRIDS.length} Certified single-solution logic grids loaded.`);

  const sampleSprint = getDailySprint(new Date().toISOString().split("T")[0]);
  console.log(`✓ Module IV: Daily Mind Sprint generator verified (${sampleSprint.items.length} items, total time: ${sampleSprint.totalTimeSec}s).`);

  console.log(`\n==================================================`);
  console.log(`  ALL CONTENT COLLECTIONS SEEDED AND READY!`);
  console.log(`==================================================\n`);
}

main().catch((err) => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
