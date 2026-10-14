import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { RetestSubmissionPayloadSchema } from "@/content/m3/lesson-schema";
import { submitLessonRetest } from "@/lib/m3/retest-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const body = await req.json();
    const parsed = RetestSubmissionPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await submitLessonRetest(userId, parsed.data);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to submit lesson retest:", error);
    return NextResponse.json(
      { error: "Failed to submit lesson retest" },
      { status: 500 }
    );
  }
}
