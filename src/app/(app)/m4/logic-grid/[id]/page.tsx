import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllLogicGrids, getLogicGridById } from "@/content/m4/logic-grid-data";
import { LogicGridRunner } from "@/components/m4/logic-grid-runner";

export async function generateStaticParams() {
  const puzzles = getAllLogicGrids();
  return puzzles.map((p) => ({ id: p.id }));
}

export default async function LogicGridPuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const puzzle = getLogicGridById(id);

  if (!puzzle) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading logic grid matrix...
        </div>
      }
    >
      <LogicGridRunner puzzle={puzzle} />
    </Suspense>
  );
}
