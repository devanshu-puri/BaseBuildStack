import { NextRequest, NextResponse } from "next/server";
import { getDebugHint } from "@/lib/m2/debug-session";

export async function GET(req: NextRequest) {
  try {
    const challengeId = req.nextUrl.searchParams.get("challengeId");
    if (!challengeId) {
      return NextResponse.json(
        { error: "Missing challengeId query parameter" },
        { status: 400 }
      );
    }

    const hint = getDebugHint(challengeId);
    return NextResponse.json({
      success: true,
      ...hint,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to retrieve hint";
    console.error("[API /api/quiz/practical/hint] Error:", error);
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }
}
