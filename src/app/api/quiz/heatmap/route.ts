import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getSkillHeatmapData } from "@/lib/m2/skill-heatmap";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";

    const heatmapData = await getSkillHeatmapData(userId);
    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error("Failed to generate skill heatmap data:", error);
    return NextResponse.json(
      { error: "Failed to generate skill heatmap data" },
      { status: 500 }
    );
  }
}
