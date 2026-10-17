import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getProfileRepository,
  getUserProjectsRepository,
} from "@/lib/db/repositories";
import { TARGET_ROLES, POPULAR_STACK_CHIPS, normalizeSkillAlias } from "@/lib/m2/skill-taxonomy";

const OnboardingSkillSchema = z.object({
  name: z.string().min(1).max(50),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  source: z.enum(["manual", "resume", "repo"]).default("manual"),
  evidence: z.string().optional(),
  yearsHint: z.string().optional(),
  skillId: z.string().optional(),
});

const OnboardingProjectSchema = z.object({
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

const SaveOnboardingSchema = z.object({
  skills: z.array(OnboardingSkillSchema),
  role: z.string().optional(),
  projects: z.array(OnboardingProjectSchema).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  const profileRepo = getProfileRepository(userId);
  const profile = await profileRepo.getProfile();

  const userProjectsRepo = getUserProjectsRepository(userId);
  const projects = await userProjectsRepo.getProjects();

  return NextResponse.json({
    roles: TARGET_ROLES,
    popularStack: POPULAR_STACK_CHIPS,
    confirmedSkills: profile?.skills || [],
    projects,
    resumeMeta: profile?.resumeMeta,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  try {
    const body = await req.json();
    const parsed = SaveOnboardingSchema.parse(body);

    const profileRepo = getProfileRepository(userId);
    const now = new Date();

    const normalizedSkills = parsed.skills.map((s) => {
      const canonical = normalizeSkillAlias(s.name);
      return {
        skillId: canonical ? canonical.id : s.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: canonical ? canonical.name : s.name,
        level: s.level,
        source: s.source,
        evidence: s.evidence || undefined,
        yearsHint: s.yearsHint || undefined,
        verifiedAt: now,
        confirmed: true,
      };
    });

    const updated = await profileRepo.updateSkills(normalizedSkills);

    let savedProjects: unknown[] = [];
    if (parsed.projects && parsed.projects.length > 0) {
      const userProjectsRepo = getUserProjectsRepository(userId);
      savedProjects = await userProjectsRepo.setProjects(
        parsed.projects.map((p) => ({
          ...p,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      skills: updated.skills,
      count: updated.skills.length,
      projects: savedProjects,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 400 }
      );
    }

    console.error("Failed to save confirmed skills & projects:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
