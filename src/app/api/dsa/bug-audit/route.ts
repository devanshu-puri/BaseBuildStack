import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBugAuditDeck } from "@/lib/m1/bug-audit-session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  const { searchParams } = new URL(req.url);
  const size = Math.min(10, Math.max(1, parseInt(searchParams.get("size") || "5", 10)));

  try {
    const result = await getBugAuditDeck(userId, size);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error generating bug audit deck:", err);
    return NextResponse.json(
      { error: "Failed to generate bug audit deck" },
      { status: 500 }
    );
  }
}
