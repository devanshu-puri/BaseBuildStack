import { LogicGridPuzzle, EntityAssignment } from "@/content/m4/logic-grid-schema";
import { LlmGateway } from "@/lib/llm/gateway";

export interface SocraticHintValidation {
  valid: boolean;
  reason?: string;
  leakedItems?: [string, string];
}

export interface SocraticHintResult {
  hint: string;
  source: "llm" | "deterministic";
  fallbackReason?: string;
  clueId?: string;
}

/**
 * Regex patterns that represent affirmative solution leaks or direct instructions.
 */
const FORBIDDEN_LEAK_PATTERNS = [
  /\b(the answer is|the correct answer is|the solution is|the right answer is)\b/i,
  /\b(you should pair|you must pair|pair\s+\w+\s+with\s+\w+)\b/i,
  /\b(assign\s+\w+\s+to\s+\w+)\b/i,
  /\b(the correct choice is|the correct assignment is)\b/i,
  /\b(put\s+\w+\s+with\s+\w+)\b/i,
  /\b(must be placed in|is definitely assigned to)\b/i,
];

/**
 * Validates whether an LLM-generated hint is truly Socratic and does not leak secret solution pairings.
 */
export function validateSocraticHint(
  hintText: string,
  puzzle: LogicGridPuzzle,
  currentAssignments: EntityAssignment[] = []
): SocraticHintValidation {
  const trimmed = hintText.trim();

  // 1. Minimum and maximum length check
  if (trimmed.length < 15) {
    return { valid: false, reason: "Hint is too brief to be helpful." };
  }
  if (trimmed.length > 500) {
    return { valid: false, reason: "Hint is too long; Socratic guidance should be concise." };
  }

  // 2. Must contain a question mark to be a Socratic guiding question
  if (!trimmed.includes("?")) {
    return {
      valid: false,
      reason: "Socratic hints must pose a question to guide thinking, not give a statement.",
    };
  }

  // 3. Reject direct giveaway patterns
  for (const pattern of FORBIDDEN_LEAK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason: "Hint contains direct answer giveaway phrasing.",
      };
    }
  }

  // 4. Secret pairing leak detector:
  // Identify all pairings in puzzle.solution that are NOT already deduced by the user.
  const confirmedPairs = new Set<string>();
  for (const assignment of currentAssignments) {
    const keys = Object.keys(assignment);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const valA = assignment[keys[i]];
        const valB = assignment[keys[j]];
        if (valA && valB) {
          confirmedPairs.add(`${valA}:::${valB}`);
          confirmedPairs.add(`${valB}:::${valA}`);
        }
      }
    }
  }

  // Extract secret solution pairings
  for (const solutionEntity of puzzle.solution) {
    const keys = Object.keys(solutionEntity);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const valA = solutionEntity[keys[i]];
        const valB = solutionEntity[keys[j]];
        if (!valA || !valB) continue;

        // If the user already confirmed this pair, mentioning them isn't a new leak
        if (confirmedPairs.has(`${valA}:::${valB}`)) continue;

        // Check if the hint explicitly pairs them together affirmatively:
        // e.g. "valA is valB", "valA has valB", "valA with valB", "valA uses valB"
        const escapedA = escapeRegex(valA);
        const escapedB = escapeRegex(valB);

        const affirmativePairRegex1 = new RegExp(
          `\\b${escapedA}\\b\\s+(is|has|uses|wears|takes|pairs with|matches with|drives|works at|contains)\\s+\\b${escapedB}\\b`,
          "i"
        );
        const affirmativePairRegex2 = new RegExp(
          `\\b${escapedB}\\b\\s+(is|has|uses|wears|takes|pairs with|matches with|drives|works at|contains)\\s+\\b${escapedA}\\b`,
          "i"
        );

        if (
          affirmativePairRegex1.test(trimmed) ||
          affirmativePairRegex2.test(trimmed)
        ) {
          return {
            valid: false,
            reason: `Hint leaks unconfirmed solution pairing: ${valA} <-> ${valB}.`,
            leakedItems: [valA, valB],
          };
        }
      }
    }
  }

  return { valid: true };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Deterministically generates a 100% safe Socratic guiding question from puzzle clues.
 */
export function generateFallbackSocraticHint(
  puzzle: LogicGridPuzzle,
  currentAssignments: EntityAssignment[] = [],
  checkedClueIds: string[] = []
): { hint: string; clueId?: string } {
  const checkedSet = new Set(checkedClueIds);
  const resolvedItems = new Set<string>();
  for (const a of currentAssignments) {
    Object.values(a).forEach((v) => resolvedItems.add(v));
  }

  // Pick an unchecked clue first, prioritizing items not yet confirmed
  const candidateClues = puzzle.clues.filter((c) => !checkedSet.has(c.id));
  const unresolvedClues = candidateClues.filter(
    (c) => !resolvedItems.has(c.itemA) || !resolvedItems.has(c.itemB)
  );
  const targetClue =
    unresolvedClues.length > 0
      ? unresolvedClues[0]
      : candidateClues.length > 0
      ? candidateClues[0]
      : puzzle.clues[0];

  if (!targetClue) {
    return {
      hint: "What happens if you examine the row and column with the most elimination marks?",
    };
  }

  const clueIndex = puzzle.clues.findIndex((c) => c.id === targetClue.id) + 1;

  let hintText = "";
  switch (targetClue.type) {
    case "eitherOr":
      hintText = `Consider Clue #${clueIndex}: "${targetClue.text}". Have you tested what happens if "${targetClue.itemA}" is ruled out? What does that force for the other options?`;
      break;
    case "isNot":
      hintText = `Look at Clue #${clueIndex}: "${targetClue.text}". Once you eliminate "${targetClue.itemB}" for "${targetClue.itemA}", which remaining cells in that section are still open?`;
      break;
    case "conditional":
      hintText = `Review Clue #${clueIndex}: "${targetClue.text}". What prerequisite must be established before "${targetClue.itemA}" can be placed?`;
      break;
    case "is":
    default:
      hintText = `Revisit Clue #${clueIndex}: "${targetClue.text}". Once this relationship is established, what possibilities does it eliminate for the remaining candidates?`;
      break;
  }

  return {
    hint: hintText,
    clueId: targetClue.id,
  };
}

/**
 * Primary entrypoint for Socratic hints with LLM synthesis and deterministic fallback.
 */
export async function getSocraticHint(params: {
  puzzle: LogicGridPuzzle;
  assignments?: EntityAssignment[];
  checkedClueIds?: string[];
}): Promise<SocraticHintResult> {
  const { puzzle, assignments = [], checkedClueIds = [] } = params;
  const fallback = generateFallbackSocraticHint(puzzle, assignments, checkedClueIds);

  const gateway = new LlmGateway();
  if (!gateway.isLlmEnabled()) {
    return {
      hint: fallback.hint,
      source: "deterministic",
      clueId: fallback.clueId,
    };
  }

  try {
    const clueList = puzzle.clues
      .map((c, i) => `${i + 1}. [${c.type}] ${c.text}`)
      .join("\n");

    const prompt = `You are a master Socratic logic tutor helping a student solve a logic grid deduction puzzle.
Puzzle Title: "${puzzle.title}"
Clues:
${clueList}

Student's current confirmed deductions:
${JSON.stringify(assignments, null, 2)}

The student is stuck and requested a hint.
STRICT RULES:
1. NEVER reveal any answer, assignment, or final pairing.
2. DO NOT state "The answer is..." or tell the student what goes where.
3. Formulate exactly ONE concise Socratic guiding question (1-2 sentences) that points their attention to a specific clue or elimination pattern without giving anything away.
4. MUST end with a question mark '?'.`;

    const provider = gateway.getProvider();
    const result = await provider.generate(prompt, {
      temperature: 0.3,
      maxTokens: 120,
    });

    const validation = validateSocraticHint(result.text, puzzle, assignments);
    if (validation.valid) {
      return {
        hint: result.text.trim(),
        source: "llm",
        clueId: fallback.clueId,
      };
    }

    // If LLM response leaked or failed Socratic criteria, fall back deterministically
    return {
      hint: fallback.hint,
      source: "deterministic",
      fallbackReason: validation.reason,
      clueId: fallback.clueId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM generation failed";
    return {
      hint: fallback.hint,
      source: "deterministic",
      fallbackReason: message,
      clueId: fallback.clueId,
    };
  }
}
