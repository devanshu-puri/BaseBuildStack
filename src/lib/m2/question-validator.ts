import {
  M2Question,
  M2QuestionSchema,
} from "@/content/m2/question-schema";
import { executeSandboxedCode } from "@/lib/sandbox/runner";

export interface ValidationIssue {
  id: string;
  field?: string;
  message: string;
}

export interface BankValidationResult {
  total: number;
  valid: boolean;
  errors: ValidationIssue[];
  duplicates: string[];
  verifiedOutputs: number;
}

/**
 * Validates question against Zod schema and returns clean error list.
 */
export function validateM2QuestionSchema(q: unknown): {
  valid: boolean;
  errors: string[];
  data?: M2Question;
} {
  const parsed = M2QuestionSchema.safeParse(q);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ),
    };
  }
  return { valid: true, errors: [], data: parsed.data };
}

/**
 * Validates logical integrity rules:
 * - All correctOptionIds exist in options
 * - Every distractor option has an explanation in whyWrong
 * - No duplicate option texts
 * - Code snippet fields are valid if present
 */
export function validateM2QuestionIntegrity(q: M2Question): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const optionIdSet = new Set(q.options.map((opt) => opt.id));
  const optionTexts = new Set<string>();

  for (const opt of q.options) {
    const normText = opt.text.trim().toLowerCase();
    if (optionTexts.has(normText)) {
      errors.push(`Duplicate option text detected: "${opt.text}"`);
    }
    optionTexts.add(normText);
  }

  for (const cId of q.correctOptionIds) {
    if (!optionIdSet.has(cId)) {
      errors.push(`correctOptionId "${cId}" is not present in options array.`);
    }
  }

  // Check distractor explanations
  const correctSet = new Set(q.correctOptionIds);
  const distractors = q.options.filter((opt) => !correctSet.has(opt.id));

  for (const distractor of distractors) {
    const explanation = q.explanation.whyWrong?.[distractor.id];
    if (!explanation || explanation.trim().length < 5) {
      errors.push(
        `Distractor option "${distractor.id}" (${distractor.text.slice(0, 20)}...) lacks an explanation in explanation.whyWrong.`
      );
    }
  }

  // Code snippet validation
  if (q.code) {
    if (!q.code.language || q.code.language.trim().length === 0) {
      errors.push("Code snippet language is missing or empty.");
    }
    if (!q.code.source || q.code.source.trim().length === 0) {
      errors.push("Code snippet source is missing or empty.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalizes execution outputs by trimming and standardizing quote/whitespace differences.
 */
export function normalizeOutput(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/^['"`]|['"`]$/g, "");
}

/**
 * Executes output-prediction question code in sandbox and verifies the actual output.
 */
export async function validateM2QuestionOutputSandbox(
  q: M2Question
): Promise<{
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  error?: string;
}> {
  if (q.type !== "output") {
    return { passed: true };
  }

  if (!q.code || !q.code.source) {
    return {
      passed: false,
      error: "Output prediction question requires a code snippet.",
    };
  }

  const lang = q.code.language.toLowerCase().trim();
  const supportedLangs = ["javascript", "js", "typescript", "ts", "node"];

  if (!supportedLangs.includes(lang)) {
    // Other languages skip Node sandbox verification but pass schema
    return { passed: true };
  }

  const correctOption = q.options.find((opt) => opt.id === q.correctOptionIds[0]);
  const expected = q.expectedOutput || (correctOption ? correctOption.text : "");

  try {
    const sandboxResult = await executeSandboxedCode(q.code.source, {
      timeoutMs: 2500,
    });

    if (!sandboxResult.success) {
      return {
        passed: false,
        error: `Sandbox execution failed: ${sandboxResult.error}`,
      };
    }

    // Determine actual output: either logs joined by \n or returned value
    let actualStr = "";
    if (sandboxResult.logs && sandboxResult.logs.length > 0) {
      actualStr = sandboxResult.logs.join("\n");
    } else if (sandboxResult.result !== null && sandboxResult.result !== undefined) {
      actualStr =
        typeof sandboxResult.result === "object"
          ? JSON.stringify(sandboxResult.result)
          : String(sandboxResult.result);
    }

    const normActual = normalizeOutput(actualStr);
    const normExpected = normalizeOutput(expected);

    // Exact match or contains match for common console outputs
    const matches =
      normActual === normExpected ||
      normActual === normExpected.replace(/;\s*$/, "") ||
      normActual.replace(/\s+/g, "") === normExpected.replace(/\s+/g, "");

    return {
      passed: matches,
      actualOutput: normActual,
      expectedOutput: normExpected,
      error: matches
        ? undefined
        : `Output mismatch: Sandbox produced "${normActual}", but expected "${normExpected}"`,
    };
  } catch (err) {
    return {
      passed: false,
      error: `Sandbox runner exception: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Validates an entire question bank collection.
 */
export async function validateM2QuestionBank(
  questions: M2Question[]
): Promise<BankValidationResult> {
  const errors: ValidationIssue[] = [];
  const duplicates: string[] = [];
  const seenIds = new Set<string>();
  const seenPrompts = new Map<string, string>();
  let verifiedOutputs = 0;

  for (const q of questions) {
    // 1. Unique ID
    if (seenIds.has(q.id)) {
      errors.push({ id: q.id, message: `Duplicate question id "${q.id}"` });
    }
    seenIds.add(q.id);

    // 2. Duplicate prompt detection (normalized)
    const normPrompt = q.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
    if (seenPrompts.has(normPrompt)) {
      const existingId = seenPrompts.get(normPrompt)!;
      duplicates.push(
        `Questions "${q.id}" and "${existingId}" share nearly identical prompts.`
      );
    } else {
      seenPrompts.set(normPrompt, q.id);
    }

    // 3. Schema validation
    const schemaRes = validateM2QuestionSchema(q);
    if (!schemaRes.valid) {
      for (const err of schemaRes.errors) {
        errors.push({ id: q.id, message: `Schema error: ${err}` });
      }
    }

    // 4. Integrity validation
    const integrityRes = validateM2QuestionIntegrity(q);
    if (!integrityRes.valid) {
      for (const err of integrityRes.errors) {
        errors.push({ id: q.id, message: `Integrity error: ${err}` });
      }
    }

    // 5. Sandbox output verification
    if (q.type === "output") {
      const outputRes = await validateM2QuestionOutputSandbox(q);
      if (!outputRes.passed) {
        errors.push({
          id: q.id,
          message: `Output verification error: ${outputRes.error}`,
        });
      } else {
        verifiedOutputs++;
      }
    }
  }

  return {
    total: questions.length,
    valid: errors.length === 0,
    errors,
    duplicates,
    verifiedOutputs,
  };
}
