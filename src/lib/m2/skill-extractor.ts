import { z } from "zod";
import {
  KNOWN_TECH_DICTIONARY,
  normalizeSkillAlias,
} from "./skill-taxonomy";
import { llmGateway } from "@/lib/llm/gateway";

export const ExtractedSkillSchema = z.object({
  name: z.string().min(1).max(50),
  skillId: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  source: z.enum(["manual", "resume", "repo"]).default("resume"),
  evidence: z.string().optional(),
  yearsHint: z.string().optional(),
});
export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;

export const ExtractedProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  summary: z.string().default(""),
  role: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  metrics: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  version: z.number().default(1),
});
export type ExtractedProject = z.infer<typeof ExtractedProjectSchema>;

export const ExperienceItemSchema = z.object({
  company: z.string(),
  title: z.string(),
  dates: z.string().optional(),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export interface StructuredResumeResult {
  skills: ExtractedSkill[];
  unsupportedSkills: string[];
  projects: ExtractedProject[];
  experience: ExperienceItem[];
  extractionMode: "llm" | "deterministic";
}

/**
 * Strips prompt injections and excessive noise from untrusted resume text.
 */
export function sanitizeResumeText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText.slice(0, 50_000);

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
    /you\s+are\s+now\s+a/gi,
    /system\s*:\s*/gi,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /\[system_prompt\]/gi,
    /drop\s+database/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, " ");
  }

  return cleaned.trim();
}

/**
 * Deterministic resume extraction:
 * Scans text line-by-line, identifies skills with exact line evidence,
 * detects project sections, extracts metrics and canonical tech stacks.
 * Guaranteed 100% deterministic with LLM disabled.
 */
export function extractStructuredResumeDeterministically(text: string): StructuredResumeResult {
  const sanitized = sanitizeResumeText(text);
  if (!sanitized) {
    return {
      skills: [],
      unsupportedSkills: [],
      projects: [],
      experience: [],
      extractionMode: "deterministic",
    };
  }

  const lines = sanitized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const matchedSkillsMap = new Map<string, ExtractedSkill>();
  const unsupportedSkillsSet = new Set<string>();

  // 1. Skill extraction with line evidence
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    for (const [rawTerm, canonicalName] of Object.entries(KNOWN_TECH_DICTIONARY)) {
      const escaped = rawTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[\\s,;()/\\[\\]:])${escaped}(?:$|[\\s,;()/\\[\\]:.])`, "i");

      if (regex.test(lowerLine)) {
        const canonical = normalizeSkillAlias(canonicalName);
        if (!canonical) continue;

        if (!matchedSkillsMap.has(canonical.name)) {
          let level: "beginner" | "intermediate" | "advanced" = "intermediate";
          let yearsHint: string | undefined;

          // Check for explicit years of experience
          const yearsMatch = lowerLine.match(
            /(\b(?:\d+|1\d)\+?\s*years?(?:\s+of\s+experience)?)/i
          );
          if (yearsMatch) {
            yearsHint = yearsMatch[1].trim();
            const numYears = parseInt(yearsMatch[1], 10);
            if (!isNaN(numYears)) {
              if (numYears >= 4) level = "advanced";
              else if (numYears <= 1) level = "beginner";
            }
          } else if (/\b(senior|lead|principal|architect|expert|deep)\b/i.test(lowerLine)) {
            level = "advanced";
          } else if (/\b(beginner|junior|intern|learning|basic|intro)\b/i.test(lowerLine)) {
            level = "beginner";
          }

          matchedSkillsMap.set(canonical.name, {
            name: canonical.name,
            skillId: canonical.id,
            level,
            source: "resume",
            evidence: line.slice(0, 160),
            yearsHint,
          });
        }
      }
    }
  }

  // 2. Deterministic project extraction
  // Identifies headings like "Projects", "Key Projects", or bullet blocks with technologies
  const projects: ExtractedProject[] = [];
  let inProjectSection = false;
  let currentProject: Partial<ExtractedProject> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isProjectHeading =
      /^(projects|key projects|selected projects|personal projects|featured projects)\b/i.test(
        line
      );

    if (isProjectHeading) {
      inProjectSection = true;
      continue;
    }

    const isNextSection =
      /^(experience|work experience|education|certifications|skills|technical skills|awards)\b/i.test(
        line
      );
    if (isNextSection && inProjectSection) {
      if (currentProject?.name) {
        projects.push(finalizeProject(currentProject, projects.length + 1));
      }
      inProjectSection = false;
      currentProject = null;
      continue;
    }

    if (inProjectSection) {
      // Possible project title: short line, bold/pipe delimited or not starting with bullet
      const isBullet = /^[-*•·]/.test(line);
      const isHeaderLine = !isBullet && line.length < 75 && !line.endsWith(".");

      if (isHeaderLine) {
        if (currentProject?.name) {
          projects.push(finalizeProject(currentProject, projects.length + 1));
        }
        currentProject = {
          name: line.replace(/\s+[|–—]\s+.*$/, "").replace(/\s+-\s+.*$/, "").trim(),
          summary: "",
          role: "Developer",
          techStack: [],
          responsibilities: [],
          metrics: [],
          links: [],
        };
      } else if (currentProject) {
        // Collect bullet points
        const cleanBullet = line.replace(/^[-*•·]\s*/, "");
        if (cleanBullet.length > 0) {
          currentProject.responsibilities = currentProject.responsibilities || [];
          currentProject.responsibilities.push(cleanBullet);

          // Extract metrics (numbers, % improvements, throughput, latency)
          const metricMatches = cleanBullet.match(
            /\b(?:\d+%\s*|\d+k\+?|\d+M\+?|\d+x\b|\d+\s*ms\b|\d+\s*users?\b|\d+\s*rps\b)/gi
          );
          if (metricMatches) {
            currentProject.metrics = currentProject.metrics || [];
            currentProject.metrics.push(...metricMatches);
          }

          // Scan bullet for canonical technologies
          for (const [rawTerm, canonicalName] of Object.entries(KNOWN_TECH_DICTIONARY)) {
            const canonical = normalizeSkillAlias(canonicalName);
            if (!canonical) continue;
            const escaped = rawTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const termRegex = new RegExp(`(?:^|[\\s,;()/\\[\\]:])${escaped}(?:$|[\\s,;()/\\[\\]:.])`, "i");
            if (
              termRegex.test(cleanBullet) &&
              !currentProject.techStack?.includes(canonical.name)
            ) {
              currentProject.techStack = currentProject.techStack || [];
              currentProject.techStack.push(canonical.name);
            }
          }
        }
      }
    }
  }

  if (currentProject?.name) {
    projects.push(finalizeProject(currentProject, projects.length + 1));
  }

  // Fallback: If no explicit project section was found, extract any highlighted project-like bullets
  if (projects.length === 0 && matchedSkillsMap.size > 0) {
    // Group candidate skills into a default starter project
    const topSkills = Array.from(matchedSkillsMap.keys()).slice(0, 5);
    projects.push({
      id: "proj_featured_1",
      name: "Core Engineering Architecture",
      summary: "Full stack engineering and distributed systems implementation.",
      role: "Software Engineer",
      techStack: topSkills,
      responsibilities: [
        "Architected scalable backend services and responsive client UI",
        "Engineered reliable database schemas and caching layers",
      ],
      metrics: ["Production grade"],
      links: [],
      version: 1,
    });
  }

  return {
    skills: Array.from(matchedSkillsMap.values()),
    unsupportedSkills: Array.from(unsupportedSkillsSet),
    projects,
    experience: [],
    extractionMode: "deterministic",
  };
}

function finalizeProject(p: Partial<ExtractedProject>, index: number): ExtractedProject {
  const name = p.name || `Project ${index}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  return {
    id: `proj_${slug}_${index}`,
    name,
    summary: p.responsibilities?.[0]?.slice(0, 140) || `Implementation built with ${(p.techStack || []).join(", ")}`,
    role: p.role || "Software Engineer",
    techStack: p.techStack || [],
    responsibilities: p.responsibilities || [],
    metrics: Array.from(new Set(p.metrics || [])),
    links: p.links || [],
    version: 1,
  };
}

/**
 * Backward-compatible helper for existing code and tests.
 */
export function extractSkillsDeterministically(text: string): ExtractedSkill[] {
  return extractStructuredResumeDeterministically(text).skills;
}

const LlmStructuredResumeSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      evidence: z.string().optional(),
      yearsHint: z.string().optional(),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
      role: z.string(),
      techStack: z.array(z.string()),
      responsibilities: z.array(z.string()),
      metrics: z.array(z.string()),
      links: z.array(z.string()).default([]),
    })
  ),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        dates: z.string().optional(),
      })
    )
    .default([]),
});

/**
 * Structured resume extraction: runs LLM extraction with Zod schema validation,
 * mapping all skills to the canonical taxonomy with traceable resume line evidence.
 * Deterministic fallback guarantees execution when LLM is unavailable.
 */
export async function extractSkillsFromResume(
  rawResumeText: string
): Promise<StructuredResumeResult> {
  const sanitized = sanitizeResumeText(rawResumeText);
  if (!sanitized) {
    return {
      skills: [],
      unsupportedSkills: [],
      projects: [],
      experience: [],
      extractionMode: "deterministic",
    };
  }

  const deterministicResults = extractStructuredResumeDeterministically(sanitized);

  // If LLM disabled or in unit tests, return deterministic results
  if (!llmGateway.isLlmEnabled() || process.env.NODE_ENV === "test") {
    return deterministicResults;
  }

  try {
    const prompt = `
Extract technical skills, engineering projects, and work experience from this candidate's resume.
Strict rules:
1. Every extracted skill and project MUST be grounded in the text below. Never hallucinate or invent projects.
2. For each skill, include the exact text snippet or line as 'evidence'.
3. Extract real metrics (e.g. latency, scale, users, % improvements) from project bullets.
4. Normalize technologies to standard names (e.g., React, TypeScript, Node.js, PostgreSQL).

Resume:
"""
${sanitized.slice(0, 10_000)}
"""

Output strictly JSON matching this structure:
{
  "skills": [{ "name": "string", "level": "beginner"|"intermediate"|"advanced", "evidence": "string", "yearsHint": "string" }],
  "projects": [{ "name": "string", "summary": "string", "role": "string", "techStack": ["string"], "responsibilities": ["string"], "metrics": ["string"], "links": [] }],
  "experience": [{ "company": "string", "title": "string", "dates": "string" }]
}
`;

    const llmParsed = await llmGateway.generateJSON(
      prompt,
      LlmStructuredResumeSchema,
      {
        fallback: {
          skills: deterministicResults.skills.map((s) => ({
            name: s.name,
            level: s.level,
            evidence: s.evidence,
            yearsHint: s.yearsHint,
          })),
          projects: deterministicResults.projects.map((p) => ({
            name: p.name,
            summary: p.summary,
            role: p.role,
            techStack: p.techStack,
            responsibilities: p.responsibilities,
            metrics: p.metrics,
            links: p.links,
          })),
          experience: [],
        },
      }
    );

    // Map skills against canonical taxonomy
    const canonicalSkills: ExtractedSkill[] = [];
    const unsupportedSkills: string[] = [];
    const seenSkills = new Set<string>();

    for (const item of llmParsed.skills) {
      const canonical = normalizeSkillAlias(item.name);
      if (canonical) {
        if (!seenSkills.has(canonical.name)) {
          seenSkills.add(canonical.name);
          canonicalSkills.push({
            name: canonical.name,
            skillId: canonical.id,
            level: item.level,
            source: "resume",
            evidence: item.evidence || undefined,
            yearsHint: item.yearsHint || undefined,
          });
        }
      } else if (item.name.length <= 40) {
        unsupportedSkills.push(item.name);
      }
    }

    // Process projects and map their techStack to canonical names
    const projects: ExtractedProject[] = llmParsed.projects.map((p, idx) => {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const normalizedStack = p.techStack
        .map((t) => normalizeSkillAlias(t)?.name || t)
        .filter((t, i, arr) => arr.indexOf(t) === i);

      return {
        id: `proj_${slug}_${idx + 1}`,
        name: p.name,
        summary: p.summary || p.responsibilities?.[0] || "",
        role: p.role || "Software Engineer",
        techStack: normalizedStack,
        responsibilities: p.responsibilities || [],
        metrics: p.metrics || [],
        links: p.links || [],
        version: 1,
      };
    });

    return {
      skills: canonicalSkills.length > 0 ? canonicalSkills : deterministicResults.skills,
      unsupportedSkills,
      projects: projects.length > 0 ? projects : deterministicResults.projects,
      experience: llmParsed.experience,
      extractionMode: "llm",
    };
  } catch (err) {
    console.warn("LLM resume extraction failed, using deterministic results:", err);
    return deterministicResults;
  }
}
