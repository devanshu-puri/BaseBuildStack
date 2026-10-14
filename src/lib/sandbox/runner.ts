import { Worker } from "worker_threads";
import {
  SandboxOptions,
  SandboxResult,
  TestCase,
  BugValidationResult,
  TestCaseResult,
} from "./types";

/**
 * Worker evaluation template script executed inside isolated thread.
 */
const WORKER_SCRIPT = `
const { parentPort, workerData } = require('worker_threads');
const vm = require('vm');

const { code, timeoutMs, initialContext } = workerData;
const logs = [];

// Intercept console outputs
const sandboxConsole = {
  log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
  warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
  error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
};

// Isolated sandbox environment without network, process, or filesystem
const sandboxScope = {
  console: sandboxConsole,
  Math,
  Date,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Map,
  Set,
  Promise,
  Error,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  // Explicitly deny network and environment access
  fetch: undefined,
  process: undefined,
  require: undefined,
  import: undefined,
  global: undefined,
  globalThis: undefined,
  XMLHttpRequest: undefined,
  WebSocket: undefined,
  ...(initialContext || {})
};

const context = vm.createContext(sandboxScope);
const start = Date.now();

try {
  // Wrap in async IIFE to allow return statements and top-level expressions
  const wrappedCode = \`(async () => {
    \${code}
  })()\`;

  const script = new vm.Script(wrappedCode);
  const promise = script.runInContext(context, { timeout: timeoutMs });

  Promise.resolve(promise)
    .then(result => {
      parentPort.postMessage({
        success: true,
        result: result !== undefined ? result : null,
        logs,
        durationMs: Date.now() - start,
        timedOut: false,
      });
    })
    .catch(err => {
      const isTimeout = err && (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || String(err.message || '').toLowerCase().includes('timed out'));
      parentPort.postMessage({
        success: false,
        error: err ? err.message || String(err) : 'Runtime error',
        logs,
        durationMs: Date.now() - start,
        timedOut: Boolean(isTimeout),
      });
    });
} catch (err) {
  const isTimeout = err && (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || String(err.message || '').toLowerCase().includes('timed out'));
  parentPort.postMessage({
    success: false,
    error: err ? err.message || String(err) : 'Execution error',
    logs,
    durationMs: Date.now() - start,
    timedOut: Boolean(isTimeout),
  });
}
`;

/**
 * Execute arbitrary JavaScript code in an isolated Node worker thread with strict timeout and no network.
 */
export async function executeSandboxedCode(
  code: string,
  options: SandboxOptions = {}
): Promise<SandboxResult> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const memoryLimitMb = options.memoryLimitMb ?? 64;
  const start = Date.now();

  return new Promise<SandboxResult>((resolve) => {
    let hasResolved = false;
    let timer: NodeJS.Timeout | null = null;

    const worker = new Worker(WORKER_SCRIPT, {
      eval: true,
      workerData: {
        code,
        timeoutMs,
        initialContext: options.context || {},
      },
      resourceLimits: {
        maxOldGenerationSizeMb: memoryLimitMb,
      },
    });

    const cleanup = () => {
      if (timer) clearTimeout(timer);
    };

    // Hard watchdog timer in parent process in case of non-cooperative thread blocking
    timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        worker.terminate().finally(() => {
          resolve({
            success: false,
            result: null,
            logs: [],
            error: `Execution timed out after ${timeoutMs}ms`,
            durationMs: Date.now() - start,
            timedOut: true,
          });
        });
      }
    }, timeoutMs + 100);

    worker.on("message", (msg: SandboxResult) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        worker.terminate();
        resolve(msg);
      }
    });

    worker.on("error", (err) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({
          success: false,
          result: null,
          logs: [],
          error: err.message,
          durationMs: Date.now() - start,
          timedOut: false,
        });
      }
    });

    worker.on("exit", (code) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({
          success: false,
          result: null,
          logs: [],
          error: `Worker stopped with exit code ${code}`,
          durationMs: Date.now() - start,
          timedOut: false,
        });
      }
    });
  });
}

/**
 * Validates a bug fix or algorithm submission against a suite of test cases.
 */
export async function validateBugFix(
  code: string,
  entryFunctionName: string,
  testCases: TestCase[],
  options: SandboxOptions = {}
): Promise<BugValidationResult> {
  const start = Date.now();

  // Construct test runner wrapper script
  const testRunnerScript = `
    ${code}

    const __results = [];
    const __deepEqual = (a, b) => {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return a === b;
      }
    };

    const __tests = ${JSON.stringify(testCases)};

    for (let i = 0; i < __tests.length; i++) {
      const tc = __tests[i];
      let actual = undefined;
      let passed = false;
      let error = undefined;

      try {
        if (typeof ${entryFunctionName} !== 'function') {
          throw new Error('Entry function "${entryFunctionName}" is not defined or not a function');
        }
        actual = ${entryFunctionName}(...tc.input);
        passed = __deepEqual(actual, tc.expected);
      } catch (err) {
        error = err.message || String(err);
      }

      __results.push({
        description: tc.description || ('Test case #' + (i + 1)),
        input: tc.input,
        expected: tc.expected,
        actual,
        passed,
        error
      });
    }

    return __results;
  `;

  const runResult = await executeSandboxedCode(testRunnerScript, options);

  if (!runResult.success || !Array.isArray(runResult.result)) {
    return {
      passed: false,
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: testCases.length,
      results: testCases.map((tc, idx) => ({
        description: tc.description || `Test case #${idx + 1}`,
        input: tc.input,
        expected: tc.expected,
        actual: null,
        passed: false,
        error: runResult.error || "Sandbox evaluation failed",
      })),
      durationMs: Date.now() - start,
      logs: runResult.logs,
    };
  }

  const results = runResult.result as TestCaseResult[];
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.length - passedTests;

  return {
    passed: passedTests === results.length && results.length > 0,
    totalTests: results.length,
    passedTests,
    failedTests,
    results,
    durationMs: Date.now() - start,
    logs: runResult.logs,
  };
}
