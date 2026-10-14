import React from "react";
import { notFound } from "next/navigation";
import { getAllLessons, getLessonById } from "@/content/m3/lessons";
import { LessonPlayer } from "@/components/m3/lesson-player";

export function generateStaticParams() {
  const lessons = getAllLessons();
  return lessons.map((l) => ({
    id: l.id,
  }));
}

export default async function LessonPlayerPage({
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
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-4">
      <LessonPlayer lesson={lesson} />
    </div>
  );
}
