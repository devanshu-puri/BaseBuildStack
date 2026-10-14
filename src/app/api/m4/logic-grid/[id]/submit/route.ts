import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { LogicGridSubmissionSchema } from "@/content/m4/logic-grid-schema";
import { getLogicGridById } from "@/content/m4/logic-grid-data";
import { evaluateLogicGridSubmission } from "@/lib/m4/constraint-solver";
import { getXpRepository } from "@/lib/db/repositories/xp-repo";
import { getProgressRepository } from "@/lib/db/repositories/progress-repo";
import { getAttemptRepository } from "@/lib/db/repositories/attempt-repo";
import { getMistakeRepository } from "@/lib/db/repositories/mistake-repo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "guest_user";
    const { id } = await params;

    const puzzle = getLogicGridById(id);
    if (!puzzle) {
      return NextResponse.json(
        { error: `Puzzle not found: ${id}` },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = LogicGridSubmissionSchema.safeParse({
      ...body,
      puzzleId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { assignments, durationMs } = parsed.data;

    const evalResult = evaluateLogicGridSubmission(
      puzzle.solution,
      assignments,
      puzzle.dimensions
    );

    let xpAwarded = 0;
    let totalXp = 0;

    if (evalResult.correct) {
      try {
        const xpRepo = getXpRepository(userId);
        const awardRes = await xpRepo.awardXp(
          "logic_grid",
          puzzle.xpAward,
          `m4_grid_${id}`
        );
        xpAwarded = awardRes.added ? puzzle.xpAward : 0;
        totalXp = awardRes.totalXp;
      } catch (err) {
        console.warn("Failed to award logic grid XP:", err);
        xpAwarded = puzzle.xpAward;
      }

      try {
        const progressRepo = getProgressRepository(userId);
        await progressRepo.setProgress("m4", id, "completed", 5);
      } catch (err) {
        console.warn("Failed to update progress:", err);
      }
    } else {
      try {
        const mistakeRepo = getMistakeRepository(userId);
        await mistakeRepo.recordMistake(
          "m4",
          id,
          `Logic Grid ${puzzle.title} deduction errors: ${evalResult.mistakes.slice(0, 2).join("; ")}`
        );
      } catch (err) {
        console.warn("Failed to record mistake:", err);
      }
    }

    try {
      const attemptRepo = getAttemptRepository(userId);
      await attemptRepo.recordAttempt({
        module: "m4",
        itemId: id,
        answer: assignments,
        correct: evalResult.correct,
        ms: durationMs,
        confidence: parsed.data.confidence,
        changes: 0,
      });
    } catch (err) {
      console.warn("Failed to record attempt:", err);
    }

    return NextResponse.json({
      ok: true,
      data: {
        puzzleId: id,
        correct: evalResult.correct,
        accuracy: evalResult.accuracy,
        xpAwarded,
        totalXp,
        feedback: evalResult.correct
          ? `Outstanding! You successfully solved the logic grid puzzle with 100% deduction precision.`
          : `Some assignments do not match the unique constraint solution. Review the clues and retry.`,
        solution: puzzle.solution,
        mistakes: evalResult.mistakes,
      },
    });
  } catch (error) {
    console.error("Failed to submit logic grid solution:", error);
    return NextResponse.json(
      { error: "Failed to evaluate logic grid" },
      { status: 500 }
    );
  }
}
