export interface SandboxOptions {
  timeoutMs?: number; // default 2000ms
  memoryLimitMb?: number; // default 64MB
  context?: Record<string, unknown>;
}

export interface SandboxResult {
  success: boolean;
  result: unknown;
  logs: string[];
  error?: string;
  durationMs: number;
  timedOut: boolean;
}

export interface TestCase {
  input: unknown[];
  expected: unknown;
  description?: string;
}

export interface TestCaseResult {
  description: string;
  input: unknown[];
  expected: unknown;
  actual: unknown;
  passed: boolean;
  error?: string;
}

export interface BugValidationResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestCaseResult[];
  durationMs: number;
  logs: string[];
}
