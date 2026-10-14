import { describe, it, expect } from "vitest";
import { executeSandboxedCode, validateBugFix } from "@/lib/sandbox";

describe("Node Worker Thread Sandbox", () => {
  it("executes valid JavaScript and returns value and logs", async () => {
    const code = `
      console.log("Hello from sandbox");
      const nums = [1, 2, 3, 4, 5];
      const sum = nums.reduce((acc, n) => acc + n, 0);
      return sum;
    `;

    const res = await executeSandboxedCode(code);

    expect(res.success).toBe(true);
    expect(res.result).toBe(15);
    expect(res.logs).toContain("Hello from sandbox");
    expect(res.timedOut).toBe(false);
  });

  it("strictly terminates infinite loops within configured timeout", async () => {
    const code = `
      while (true) {
        // infinite loop
      }
    `;

    const res = await executeSandboxedCode(code, { timeoutMs: 300 });

    expect(res.success).toBe(false);
    expect(res.timedOut).toBe(true);
    expect(res.error).toMatch(/timed out/i);
  });

  it("denies access to network APIs and environment", async () => {
    const code = `
      return {
        hasFetch: typeof fetch !== 'undefined',
        hasProcess: typeof process !== 'undefined',
        hasRequire: typeof require !== 'undefined',
        hasWebSocket: typeof WebSocket !== 'undefined',
      };
    `;

    const res = await executeSandboxedCode(code);

    expect(res.success).toBe(true);
    expect(res.result).toEqual({
      hasFetch: false,
      hasProcess: false,
      hasRequire: false,
      hasWebSocket: false,
    });
  });

  it("validates a correct bug fix against test cases", async () => {
    // Solves Two Sum correctly
    const solution = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) {
            return [map.get(complement), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const testCases = [
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        description: "Standard pair at start",
      },
      {
        input: [[3, 2, 4], 6],
        expected: [1, 2],
        description: "Pair in middle",
      },
      {
        input: [[3, 3], 6],
        expected: [0, 1],
        description: "Same element duplicate",
      },
    ];

    const validation = await validateBugFix(solution, "twoSum", testCases);

    expect(validation.passed).toBe(true);
    expect(validation.totalTests).toBe(3);
    expect(validation.passedTests).toBe(3);
    expect(validation.failedTests).toBe(0);
  });

  it("detects failed test cases on buggy implementations", async () => {
    // Buggy: returns indices in reverse order or wrong indices
    const buggySolution = `
      function twoSum(nums, target) {
        return [0, 0]; // Buggy hardcoded output
      }
    `;

    const testCases = [
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        description: "Standard pair",
      },
      {
        input: [[3, 2, 4], 6],
        expected: [1, 2],
        description: "Pair in middle",
      },
    ];

    const validation = await validateBugFix(buggySolution, "twoSum", testCases);

    expect(validation.passed).toBe(false);
    expect(validation.totalTests).toBe(2);
    expect(validation.passedTests).toBe(0);
    expect(validation.failedTests).toBe(2);
    expect(validation.results[0].passed).toBe(false);
  });

  it("handles syntax and runtime errors in user code without crashing", async () => {
    const invalidCode = `
      function divide(a, b) {
        throw new Error("Zero division test");
      }
    `;

    const testCases = [
      {
        input: [10, 0],
        expected: 0,
        description: "Divide by zero",
      },
    ];

    const validation = await validateBugFix(invalidCode, "divide", testCases);

    expect(validation.passed).toBe(false);
    expect(validation.failedTests).toBe(1);
    expect(validation.results[0].error).toContain("Zero division test");
  });
});
