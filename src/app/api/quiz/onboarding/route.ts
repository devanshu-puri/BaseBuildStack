import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfileRepository } from "@/lib/db/repositories";
import { TARGET_ROLES, POPULAR_STACK_CHIPS } from "@/lib/m2/skill-taxonomy";
import { ExtractedSkillSchema } from "@/lib/m2/skill-extractor";

const SaveSkillsSchema = z.object({
  skills: z.array(ExtractedSkillSchema),
  role: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  const profileRepo = getProfileRepository(userId);
  const profile = await profileRepo.getProfile();

  return NextResponse.json({
    roles: TARGET_ROLES,
    popularStack: POPULAR_STACK_CHIPS,
    confirmedSkills: profile?.skills || [],
    resumeMeta: profile?.resumeMeta,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  try {
    const body = await req.json();
    const parsed = SaveSkillsSchema.parse(body);

    const profileRepo = getProfileRepository(userId);
    const updated = await profileRepo.updateSkills(
      parsed.skills.map((s) => ({
        name: s.name,
        level: s.level,
        source: s.source,
        confirmed: true,
      }))
    );

    return NextResponse.json({
      success: true,
      skills: updated.skills,
      count: updated.skills.length,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 400 }
      );
    }

    console.error("Failed to save confirmed skills:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
