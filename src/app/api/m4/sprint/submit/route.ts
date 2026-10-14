import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { SprintSubmissionPayloadSchema } from "@/content/m4/sprint-schema";
import { evaluateDailySprint } from "@/lib/m4/sprint-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const body = await req.json();
    const parsed = SprintSubmissionPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await evaluateDailySprint(userId, parsed.data);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to evaluate sprint session:", error);
    return NextResponse.json(
      { error: "Failed to evaluate sprint session" },
      { status: 500 }
    );
  }
}
