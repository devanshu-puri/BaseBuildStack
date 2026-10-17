import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateDiagnosticScores } from "@/lib/m2/readiness-calculator";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user-123";

    const insights = await calculateDiagnosticScores(userId);

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("[API /api/quiz/insights] Error:", error);
    return NextResponse.json(
      { error: "Failed to calculate diagnostic insights" },
      { status: 500 }
    );
  }
}
