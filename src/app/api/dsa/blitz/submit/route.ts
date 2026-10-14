import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { submitBlitzAnswer } from "@/lib/m1/blitz-session";
import { z } from "zod";

const SubmitBlitzRequestSchema = z.object({
  problemId: z.string(),
  selectedPattern: z.string(),
  selectedInvariantIndex: z.number().int().min(0).max(3),
  ms: z.number().min(0),
  confidence: z.enum(["guessing", "unsure", "certain"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SubmitBlitzRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const verdict = await submitBlitzAnswer({
      userId: user.id,
      problemId: parsed.data.problemId,
      selectedPattern: parsed.data.selectedPattern,
      selectedInvariantIndex: parsed.data.selectedInvariantIndex,
      ms: parsed.data.ms,
      confidence: parsed.data.confidence,
    });

    return NextResponse.json({ success: true, verdict }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
