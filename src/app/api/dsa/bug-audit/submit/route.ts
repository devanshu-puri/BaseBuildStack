import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { submitBugAuditAnswer } from "@/lib/m1/bug-audit-session";

const SubmitBugAuditSchema = z.object({
  problemId: z.string(),
  selectedLineNumber: z.number().int().min(1),
  selectedBreakingInputIndex: z.number().int().min(0).max(3),
  ms: z.number().min(0),
  confidence: z.enum(["guessing", "unsure", "certain"]).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  try {
    const body = await req.json();
    const parsed = SubmitBugAuditSchema.parse(body);

    const verdict = await submitBugAuditAnswer({
      userId,
      problemId: parsed.problemId,
      selectedLineNumber: parsed.selectedLineNumber,
      selectedBreakingInputIndex: parsed.selectedBreakingInputIndex,
      ms: parsed.ms,
      confidence: parsed.confidence,
    });

    return NextResponse.json({ verdict });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 400 }
      );
    }

    console.error("Bug audit submission error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to submit answer" },
      { status: 500 }
    );
  }
}
