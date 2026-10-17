import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDebugDeck } from "@/lib/m2/debug-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user-123";

    const searchParams = req.nextUrl.searchParams;
    const skillId = searchParams.get("skillId") || undefined;
    const difficultyRaw = searchParams.get("difficulty");
    const countRaw = searchParams.get("count");

    const difficulty =
      difficultyRaw === "basic" || difficultyRaw === "medium" || difficultyRaw === "hard"
        ? difficultyRaw
        : "mixed";

    const count = countRaw ? parseInt(countRaw, 10) : 5;

    const result = await getDebugDeck(userId, {
      skillId,
      difficulty,
      count,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API /api/quiz/practical] Error:", error);
    return NextResponse.json(
      { error: "Failed to load debugging deck" },
      { status: 500 }
    );
  }
}
