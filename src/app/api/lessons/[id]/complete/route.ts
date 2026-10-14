import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { LessonCompletionPayloadSchema } from "@/content/m3/lesson-schema";
import { completeLessonSession } from "@/lib/m3/lesson-session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";
    const { id } = await params;

    const body = await req.json();
    const parsed = LessonCompletionPayloadSchema.safeParse({
      ...body,
      lessonId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await completeLessonSession({
      userId,
      payload: parsed.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to complete lesson session:", error);
    return NextResponse.json(
      { error: "Failed to complete lesson session" },
      { status: 500 }
    );
  }
}
