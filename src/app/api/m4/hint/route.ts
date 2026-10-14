import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLogicGridById } from "@/content/m4/logic-grid-data";
import { getSocraticHint } from "@/lib/m4/socratic-hints";

const HintRequestSchema = z.object({
  puzzleId: z.string(),
  assignments: z.array(z.record(z.string(), z.string())).default([]),
  checkedClueIds: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = HintRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid hint request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { puzzleId, assignments, checkedClueIds } = parsed.data;
    const puzzle = getLogicGridById(puzzleId);

    if (!puzzle) {
      return NextResponse.json(
        { error: `Puzzle not found: ${puzzleId}` },
        { status: 404 }
      );
    }

    const hintResult = await getSocraticHint({
      puzzle,
      assignments,
      checkedClueIds,
    });

    return NextResponse.json({
      ok: true,
      data: hintResult,
    });
  } catch (error) {
    console.error("Failed to generate Socratic hint:", error);
    return NextResponse.json(
      { error: "Failed to generate Socratic hint" },
      { status: 500 }
    );
  }
}
