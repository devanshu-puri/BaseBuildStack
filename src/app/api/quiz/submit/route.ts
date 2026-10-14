import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { QuizSubmissionPayloadSchema } from "@/content/m2/quiz-schema";
import { submitQuizAnswer } from "@/lib/m2/quiz-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const body = await req.json();
    const parsedPayload = QuizSubmissionPayloadSchema.safeParse(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: "Invalid submission payload", details: parsedPayload.error.format() },
        { status: 400 }
      );
    }

    const result = await submitQuizAnswer({
      userId,
      payload: parsedPayload.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to evaluate quiz submission:", error);
    return NextResponse.json(
      { error: "Failed to evaluate quiz submission" },
      { status: 500 }
    );
  }
}
