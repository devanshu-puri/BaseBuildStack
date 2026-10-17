import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getProjectQuestionsRepository,
  getXpRepository,
} from "@/lib/db/repositories";

const UpdateStatusSchema = z.object({
  questionId: z.string().min(1),
  status: z.enum(["got_it", "need_review", "unreviewed"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user-123";

    const body = await req.json();
    const parsed = UpdateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { questionId, status } = parsed.data;
    const questionsRepo = getProjectQuestionsRepository(userId);
    await questionsRepo.updateQuestionStatus(questionId, status);

    let xpAwarded = 0;
    if (status === "got_it") {
      const xpRepo = getXpRepository(userId);
      const res = await xpRepo.awardXp("m2_project_mastery", 10, questionId);
      if (res.added) {
        xpAwarded = 10;
      }
    }

    return NextResponse.json({
      success: true,
      questionId,
      status,
      xpAwarded,
    });
  } catch (error) {
    console.error("[API /api/quiz/projects/status] Error:", error);
    return NextResponse.json(
      { error: "Failed to update project question status" },
      { status: 500 }
    );
  }
}
