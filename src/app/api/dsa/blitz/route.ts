import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBlitzDeck } from "@/lib/m1/blitz-session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cards, dailyQuotaReached } = await getBlitzDeck(user.id);

    return NextResponse.json(
      {
        cards,
        dailyQuotaReached,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
