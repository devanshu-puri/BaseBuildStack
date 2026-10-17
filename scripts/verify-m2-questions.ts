import { ALL_M2_QUESTIONS } from "../src/content/m2/question-bank";
import { validateM2QuestionBank } from "../src/lib/m2/question-validator";

async function main() {
  console.log("==================================================");
  console.log("🔍 Validating Module II Question Bank...");
  console.log(`📦 Total Seeded Questions: ${ALL_M2_QUESTIONS.length}`);
  console.log("==================================================");

  const start = Date.now();
  const validationResult = await validateM2QuestionBank(ALL_M2_QUESTIONS);
  const elapsed = Date.now() - start;

  if (validationResult.duplicates.length > 0) {
    console.warn("\n⚠️ Potential Duplicates Detected:");
    for (const dup of validationResult.duplicates) {
      console.warn(`  - ${dup}`);
    }
  }

  if (validationResult.errors.length > 0) {
    console.error("\n❌ Validation Errors Found:");
    for (const err of validationResult.errors) {
      console.error(`  - [${err.id}] ${err.message}`);
    }
    process.exit(1);
  }

  // Generate Coverage Statistics
  const skillCounts: Record<string, number> = {};
  const diffCounts: Record<string, number> = { basic: 0, medium: 0, hard: 0 };
  const modeCounts: Record<string, number> = {
    skill_drill: 0,
    core_fundamentals: 0,
  };
  let highFreqCount = 0;

  for (const q of ALL_M2_QUESTIONS) {
    skillCounts[q.skillId] = (skillCounts[q.skillId] || 0) + 1;
    diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
    for (const m of q.mode) {
      modeCounts[m] = (modeCounts[m] || 0) + 1;
    }
    if (q.interviewFrequency >= 4) {
      highFreqCount++;
    }
  }

  console.log("\n📊 Question Bank Coverage Report:");
  console.log("--------------------------------------------------");
  console.log("By Skill:");
  for (const [skill, count] of Object.entries(skillCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${skill.padEnd(20)}: ${count} question(s)`);
  }

  console.log("\nBy Difficulty:");
  for (const [diff, count] of Object.entries(diffCounts)) {
    console.log(`  - ${diff.padEnd(12)}: ${count}`);
  }

  console.log("\nBy Mode:");
  for (const [mode, count] of Object.entries(modeCounts)) {
    console.log(`  - ${mode.padEnd(20)}: ${count}`);
  }

  console.log(`\nCore Interview Frequency (>= 4): ${highFreqCount}`);
  console.log(`Sandbox-Verified Output Questions: ${validationResult.verifiedOutputs}`);
  console.log(`Validation Duration: ${elapsed}ms`);
  console.log("--------------------------------------------------");
  console.log("✅ All Module II questions passed schema, integrity & sandbox verification!");
}

main().catch((err) => {
  console.error("Fatal error during question validation:", err);
  process.exit(1);
});
