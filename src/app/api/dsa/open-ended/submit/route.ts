import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { submitOpenEndedDrill } from "@/lib/m1/open-ended-session";

const SubmitOpenEndedSchema = z.object({
  drillId: z.string(),
  phase1Selected: z.number().int().min(0).max(3),
  phase2Selected: z.number().int().min(0).max(3),
  phase3Selected: z.number().int().min(0).max(3),
  freeTextDefence: z.string().optional(),
  ms: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  try {
    const body = await req.json();
    const parsed = SubmitOpenEndedSchema.parse(body);

    const verdict = await submitOpenEndedDrill({
      userId,
      drillId: parsed.drillId,
      phase1Selected: parsed.phase1Selected,
      phase2Selected: parsed.phase2Selected,
      phase3Selected: parsed.phase3Selected,
      freeTextDefence: parsed.freeTextDefence,
      ms: parsed.ms,
    });

    return NextResponse.json({ verdict });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 400 }
      );
    }

    console.error("Open-ended drill submission error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to submit drill" },
      { status: 500 }
    );
  }
}
