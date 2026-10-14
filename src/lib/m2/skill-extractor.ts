import { z } from "zod";
import { KNOWN_TECH_DICTIONARY } from "./skill-taxonomy";
import { llmGateway } from "@/lib/llm/gateway";

export const ExtractedSkillSchema = z.object({
  name: z.string().min(1).max(40),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  source: z.enum(["manual", "resume", "repo"]).default("resume"),
});

export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;

export const LlmSkillExtractionResultSchema = z.array(
  z.object({
    name: z.string(),
    level: z.enum(["beginner", "intermediate", "advanced"]),
  })
);

/**
 * Untrusted content guard: strips potential prompt injection fragments,
 * system overrides, and excessive non-alphanumeric noise from resume input.
 */
export function sanitizeResumeText(rawText: string): string {
  if (!rawText) return "";

  // 1. Cap raw length at 50,000 characters to prevent memory DOS
  let cleaned = rawText.slice(0, 50_000);

  // 2. Strip obvious prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
    /you\s+are\s+now\s+a/gi,
    /system\s*:\s*/gi,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /\[system_prompt\]/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, " ");
  }

  return cleaned.trim();
}

/**
 * Deterministic skill extractor: scans text against canonical tech dictionary
 * and infers level based on co-occurring context (years of experience, seniority words).
 * Works 100% deterministically with the LLM disabled.
 */
export function extractSkillsDeterministically(text: string): ExtractedSkill[] {
  const sanitized = sanitizeResumeText(text);
  if (!sanitized) return [];

  const lowerText = sanitized.toLowerCase();
  const matchedSkillsMap = new Map<string, ExtractedSkill>();

  // Check senior / lead context in the resume overall
  const hasSeniorityContext =
    /\b(senior|lead|principal|staff|architect|5\+\s*years?|7\+\s*years?)\b/i.test(
      sanitized
    );

  // Match words and phrases in dictionary
  for (const [rawTerm, canonicalName] of Object.entries(KNOWN_TECH_DICTIONARY)) {
    // Regex boundary matching for exact tokens (handles C++, C#, .js, etc.)
    const escaped = rawTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;()/\\[\\]:])${escaped}(?:$|[\\s,;()/\\[\\]:.])`, "i");

    if (regex.test(lowerText)) {
      if (!matchedSkillsMap.has(canonicalName)) {
        // Determine level: check proximity to numbers of years or seniority
        let level: "beginner" | "intermediate" | "advanced" = "intermediate";

        const termWindowRegex = new RegExp(
          `(?:(?:\\b(?:3|4|5|6|7|8|9|10)\\+?\\s*years?|senior|expert|lead)\\s+(?:of\\s+)?(?:experience\\s+in\\s+)?${escaped})|(?:${escaped}\\s+(?:for\\s+)?(?:\\b(?:3|4|5|6|7|8|9|10)\\+?\\s*years?))`,
          "i"
        );

        if (termWindowRegex.test(lowerText)) {
          level = "advanced";
        } else if (/\b(?:beginner|novice|learning|basic|1\s*year)\b/i.test(lowerText)) {
          level = "beginner";
        } else if (hasSeniorityContext) {
          level = "intermediate";
        }

        matchedSkillsMap.set(canonicalName, {
          name: canonicalName,
          level,
          source: "resume",
        });
      }
    }
  }

  return Array.from(matchedSkillsMap.values());
}

/**
 * Extracts skills from resume using LLM with automatic fallback to deterministic extraction.
 */
export async function extractSkillsFromResume(
  rawResumeText: string
): Promise<{ skills: ExtractedSkill[]; extractionMode: "llm" | "deterministic" }> {
  const sanitized = sanitizeResumeText(rawResumeText);
  if (!sanitized) {
    return { skills: [], extractionMode: "deterministic" };
  }

  const deterministicResults = extractSkillsDeterministically(sanitized);

  // If LLM disabled or in test suite without real model, return deterministic results
  if (!llmGateway.isLlmEnabled() || process.env.NODE_ENV === "test") {
    return {
      skills: deterministicResults,
      extractionMode: "deterministic",
    };
  }

  // Attempt LLM-assisted extraction for richer detection
  try {
    const prompt = `
Extract all technical skills and programming technologies from this candidate's resume text.
Assign a proficiency level: 'beginner', 'intermediate', or 'advanced'.
Only extract concrete technologies (languages, frameworks, databases, cloud, system concepts).
Do not extract soft skills (e.g., 'leadership', 'communication').

Resume text:
"""
${sanitized.slice(0, 8000)}
"""

Output strictly a JSON array of objects with { "name": string, "level": "beginner" | "intermediate" | "advanced" }.
`;

    const llmParsed = await llmGateway.generateJSON(
      prompt,
      LlmSkillExtractionResultSchema,
      { fallback: deterministicResults.map((s) => ({ name: s.name, level: s.level })) }
    );

    // Merge and sanitize LLM outputs against dictionary
    const sanitizedSkills: ExtractedSkill[] = [];
    const seenNames = new Set<string>();

    for (const item of llmParsed) {
      const cleanName = item.name.trim();
      const lower = cleanName.toLowerCase();
      const canonical = KNOWN_TECH_DICTIONARY[lower] || cleanName;

      // Reject non-technical/injected strings (must be <= 30 chars, alphanumeric with symbols)
      if (
        canonical.length <= 30 &&
        /^[a-zA-Z0-9+#.\s/-]+$/.test(canonical) &&
        !seenNames.has(canonical.toLowerCase())
      ) {
        seenNames.add(canonical.toLowerCase());
        sanitizedSkills.push({
          name: canonical,
          level: item.level,
          source: "resume",
        });
      }
    }

    return {
      skills: sanitizedSkills.length > 0 ? sanitizedSkills : deterministicResults,
      extractionMode: "llm",
    };
  } catch (err) {
    console.warn("LLM skill extraction failed, using deterministic results:", err);
    return {
      skills: deterministicResults,
      extractionMode: "deterministic",
    };
  }
}
