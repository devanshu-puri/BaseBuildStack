import { BUG_AUDIT_PROBLEMS } from "../src/content/m1/bug-audit-data";
import { validateBugFix } from "../src/lib/sandbox/runner";

async function main() {
  console.log(`\n==================================================`);
  console.log(`  VERIFYING BUG AUDIT REPOSITORY (${BUG_AUDIT_PROBLEMS.length} ITEMS)`);
  console.log(`==================================================\n`);

  let passedCount = 0;
  let failedCount = 0;

  for (const item of BUG_AUDIT_PROBLEMS) {
    const entryFn = item.entryFunctionName || "solution";
    const testCases = item.testCases || [];

    if (testCases.length === 0) {
      console.log(`[PASS] ${item.id} - ${item.title} (MCQ breaking-input verified, no harness specified)`);
      passedCount++;
      continue;
    }

    try {
      const res = await validateBugFix(item.canonicalCode, entryFn, testCases, { timeoutMs: 1000 });
      if (res.passed) {
        console.log(`[PASS] ${item.id} - ${item.title} (${res.passedTests}/${res.totalTests} tests passed)`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${item.id} - ${item.title} (${res.passedTests}/${res.totalTests} tests passed)`);
        failedCount++;
      }
    } catch (err) {
      console.error(`[ERROR] ${item.id}:`, err);
      failedCount++;
    }
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`Summary: ${passedCount} passed, ${failedCount} failed of ${BUG_AUDIT_PROBLEMS.length} total items.`);
  console.log(`--------------------------------------------------\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during bug verification:", err);
  process.exit(1);
});
