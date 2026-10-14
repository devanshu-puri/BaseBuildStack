import { NextRequest, NextResponse } from "next/server";
import { getLogicGridById } from "@/content/m4/logic-grid-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const puzzle = getLogicGridById(id);

    if (!puzzle) {
      return NextResponse.json(
        { error: `Logic grid puzzle not found: ${id}` },
        { status: 404 }
      );
    }

    // Strip canonical solution for candidate display
    const safePuzzle = {
      id: puzzle.id,
      title: puzzle.title,
      description: puzzle.description,
      dimensions: puzzle.dimensions,
      clues: puzzle.clues,
      difficulty: puzzle.difficulty,
      xpAward: puzzle.xpAward,
    };

    return NextResponse.json({
      ok: true,
      data: safePuzzle,
    });
  } catch (error) {
    console.error("Failed to load logic grid puzzle:", error);
    return NextResponse.json(
      { error: "Failed to load logic grid puzzle" },
      { status: 500 }
    );
  }
}
