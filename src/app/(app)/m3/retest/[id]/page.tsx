import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllLessons, getLessonById } from "@/content/m3/lessons";
import { RetestRunner } from "@/components/m3/retest-runner";

export async function generateStaticParams() {
  const lessons = getAllLessons();
  return lessons.map((l) => ({ id: l.id }));
}

export default async function LessonRetestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLessonById(id);

  if (!lesson) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading re-test assessment...
        </div>
      }
    >
      <RetestRunner lesson={lesson} />
    </Suspense>
  );
}
