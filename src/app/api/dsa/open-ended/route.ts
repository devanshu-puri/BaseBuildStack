import { NextRequest, NextResponse } from "next/server";
import { ALL_OPEN_ENDED_DRILLS, getOpenEndedDrillById } from "@/content/m1/open-ended-problems";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const drill = getOpenEndedDrillById(id);
    if (!drill) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }
    return NextResponse.json({ drill });
  }

  // Return all drills with high-level summary
  const summaryList = ALL_OPEN_ENDED_DRILLS.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    difficulty: d.difficulty,
    vagueScenario: d.vagueScenario,
  }));

  return NextResponse.json({ drills: summaryList });
}
