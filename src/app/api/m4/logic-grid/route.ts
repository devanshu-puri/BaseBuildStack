import { NextResponse } from "next/server";
import { getAllLogicGrids } from "@/content/m4/logic-grid-data";

export async function GET() {
  try {
    const grids = getAllLogicGrids();

    // Strip canonical solutions when sending to client
    const safeGrids = grids.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      dimensions: g.dimensions,
      clueCount: g.clues.length,
      difficulty: g.difficulty,
      xpAward: g.xpAward,
    }));

    return NextResponse.json({
      ok: true,
      data: safeGrids,
    });
  } catch (error) {
    console.error("Failed to list logic grid puzzles:", error);
    return NextResponse.json(
      { error: "Failed to list logic grid puzzles" },
      { status: 500 }
    );
  }
}
