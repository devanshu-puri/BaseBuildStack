import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { QuizModeSchema } from "@/content/m2/quiz-schema";
import { createQuizSession } from "@/lib/m2/quiz-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const { searchParams } = new URL(req.url);
    const modeParam = searchParams.get("mode") || "quick";
    const limitParam = searchParams.get("limit");

    const parsedMode = QuizModeSchema.safeParse(modeParam);
    const mode = parsedMode.success ? parsedMode.data : "quick";
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const session = await createQuizSession({
      userId,
      mode,
      limit: limit && !isNaN(limit) ? limit : undefined,
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
