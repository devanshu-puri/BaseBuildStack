import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserProjectsRepository,
  getProjectQuestionsRepository,
} from "@/lib/db/repositories";
import {
  generateQuestionsForProject,
  CANONICAL_SAMPLE_PROJECT,
} from "@/lib/m2/project-panel-generator";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user-123";

    const userProjectsRepo = getUserProjectsRepository(userId);
    const questionsRepo = getProjectQuestionsRepository(userId);

    const searchParams = req.nextUrl.searchParams;
    const requestedProjectId = searchParams.get("projectId");
    const refresh = searchParams.get("refresh") === "true";

    let projects = await userProjectsRepo.getProjects();

    // If user has no saved projects yet, provide canonical sample architecture project
    let isSample = false;
    if (projects.length === 0) {
      projects = [CANONICAL_SAMPLE_PROJECT];
      isSample = true;
    }

    const activeProject =
      (requestedProjectId
        ? projects.find((p) => p.id === requestedProjectId)
        : null) || projects[0];

    let questions = await questionsRepo.getQuestionsByProject(activeProject.id);

    if (questions.length === 0 || refresh) {
      const generated = generateQuestionsForProject(activeProject);
      questions = await questionsRepo.setQuestionsForProject(activeProject.id, generated);
    }

    const stats = {
      total: questions.length,
      gotIt: questions.filter((q) => q.status === "got_it").length,
      needReview: questions.filter((q) => q.status === "need_review").length,
      unreviewed: questions.filter((q) => q.status === "unreviewed").length,
    };

    return NextResponse.json({
      success: true,
      projects,
      activeProject,
      isSample,
      questions,
      stats,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("[API /api/quiz/projects] Error:", error);
    return NextResponse.json(
      { error: "Failed to load project interview panel data" },
      { status: 500 }
    );
  }
}
