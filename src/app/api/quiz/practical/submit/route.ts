import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { evaluateDebugLineClick } from "@/lib/m2/debug-session";

const SubmitBodySchema = z.object({
  challengeId: z.string().min(1),
  clickedLine: z.number().int().min(1),
  attemptNumber: z.number().int().min(1).max(2),
  usedHint: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user-123";

    const body = await req.json();
    const parsed = SubmitBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await evaluateDebugLineClick(userId, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/quiz/practical/submit] Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate debugging attempt" },
      { status: 500 }
    );
  }
}
