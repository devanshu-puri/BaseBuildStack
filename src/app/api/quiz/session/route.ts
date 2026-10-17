import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { QuizMode } from "@/content/m2/quiz-schema";
import { createQuizSession } from "@/lib/m2/quiz-session";
import { getUnseenCountPerSkill, DrillDifficultyFilter } from "@/lib/m2/drill-engine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const { searchParams } = new URL(req.url);
    const modeParam = (searchParams.get("mode") || "drills") as QuizMode | "drills";
    const difficultyParam = (searchParams.get("difficulty") || "mixed") as DrillDifficultyFilter;

    // Stats mode for setup drawer: returns unseen counts per skill
    if (searchParams.get("stats") === "true") {
      const counts = await getUnseenCountPerSkill(userId, difficultyParam);
      return NextResponse.json({ counts });
    }

    const limitParam = searchParams.get("limit") || searchParams.get("count");
    const skillsParam = searchParams.get("skills");
    const focusWeakParam = searchParams.get("focusWeak");
    const seedParam = searchParams.get("seed");

    const skills = skillsParam ? skillsParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const count = limitParam ? parseInt(limitParam, 10) : undefined;
    const focusWeak = focusWeakParam === "true" || focusWeakParam === "1";
    const seed = seedParam ? parseInt(seedParam, 10) : undefined;

    const session = await createQuizSession({
      userId,
      mode: modeParam,
      skills,
      difficulty: difficultyParam,
      count,
      focusWeak,
      seed,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to generate quiz session:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const body = await req.json();
    const {
      mode = "drills",
      skills,
      difficulty = "mixed",
      count = 10,
      focusWeak = false,
      seed,
    } = body;

    const session = await createQuizSession({
      userId,
      mode,
      skills: Array.isArray(skills) ? skills : undefined,
      difficulty,
      count: typeof count === "number" ? count : 10,
      focusWeak: Boolean(focusWeak),
      seed: typeof seed === "number" ? seed : undefined,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to generate quiz session via POST:", error);
    return NextResponse.json(
      { error: "Failed to create quiz session" },
      { status: 500 }
    );
  }
}
