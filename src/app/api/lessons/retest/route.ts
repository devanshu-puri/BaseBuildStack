import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLessonRetestDeck } from "@/lib/m3/retest-session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const deck = await getLessonRetestDeck(userId);

    return NextResponse.json({
      ok: true,
      data: deck,
    });
  } catch (error) {
    console.error("Failed to load lesson retest deck:", error);
    return NextResponse.json(
      { error: "Failed to load retest deck" },
      { status: 500 }
    );
  }
}
