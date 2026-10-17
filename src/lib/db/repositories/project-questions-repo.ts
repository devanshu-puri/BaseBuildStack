import { UserScopedRepository } from "../repository";
import { ProjectQuestionSchema, ProjectQuestionDocument } from "../schemas";

export class ProjectQuestionsRepository extends UserScopedRepository<ProjectQuestionDocument> {
  constructor(userId: string) {
    super("project_questions", userId, ProjectQuestionSchema);
  }

  async getQuestionsByProject(projectId: string): Promise<ProjectQuestionDocument[]> {
    return this.find({ projectId });
  }

  async getAllQuestions(): Promise<ProjectQuestionDocument[]> {
    return this.find({});
  }

  async updateQuestionStatus(
    id: string,
    status: "got_it" | "need_review" | "unreviewed"
  ): Promise<boolean> {
    const updated = await this.upsert(
      { id },
      {
        status,
        updatedAt: new Date(),
      }
    );
    return Boolean(updated);
  }

  async setQuestionsForProject(
    projectId: string,
    questions: Array<Omit<ProjectQuestionDocument, "userId"> | Omit<ProjectQuestionDocument, "userId" | "createdAt" | "updatedAt">>
  ): Promise<ProjectQuestionDocument[]> {
    await this.deleteMany({ projectId });
    const created: ProjectQuestionDocument[] = [];
    for (const q of questions) {
      const doc = await this.create({
        ...q,
        projectId,
        userId: this.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      created.push(doc);
    }
    return created;
  }
}

export function getProjectQuestionsRepository(userId: string): ProjectQuestionsRepository {
  return new ProjectQuestionsRepository(userId);
}
