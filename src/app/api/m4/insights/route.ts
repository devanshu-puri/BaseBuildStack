import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserMetacognitionReport } from "@/lib/m4/metacognition";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const report = await getUserMetacognitionReport(userId);

    return NextResponse.json({
      ok: true,
      data: report,
    });
  } catch (error) {
    console.error("Failed to generate metacognition insights:", error);
    return NextResponse.json(
      { error: "Failed to generate metacognition insights" },
      { status: 500 }
    );
  }
}
