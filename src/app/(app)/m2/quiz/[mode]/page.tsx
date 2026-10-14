import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [
    { mode: "quick" },
    { mode: "fundamentals" },
    { mode: "practical" },
    { mode: "weak_area" },
  ];
}

export default async function M2QuizRedirectPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  redirect(`/quiz/${mode}`);
}
