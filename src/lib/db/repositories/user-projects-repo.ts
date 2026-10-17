import { UserScopedRepository } from "../repository";
import { UserProjectSchema, UserProjectDocument } from "../schemas";

export class UserProjectsRepository extends UserScopedRepository<UserProjectDocument> {
  constructor(userId: string) {
    super("user_projects", userId, UserProjectSchema);
  }

  async getProjects(): Promise<UserProjectDocument[]> {
    return this.find({}, { sort: { updatedAt: -1 } });
  }

  async getProjectById(id: string): Promise<UserProjectDocument | null> {
    return this.findOne({ id });
  }

  async saveProject(project: Omit<UserProjectDocument, "userId">): Promise<UserProjectDocument> {
    const existing = await this.findOne({ id: project.id });
    if (existing) {
      return this.upsert(
        { id: project.id },
        {
          ...project,
          version: (existing.version || 1) + 1,
          updatedAt: new Date(),
        }
      );
    }

    return this.create({
      ...project,
      userId: this.userId,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async setProjects(
    projects: Array<Omit<UserProjectDocument, "userId">>
  ): Promise<UserProjectDocument[]> {
    // Delete existing and bulk create
    await this.deleteMany({});
    const saved: UserProjectDocument[] = [];
    for (const p of projects) {
      const doc = await this.create({
        ...p,
        userId: this.userId,
        version: p.version || 1,
        createdAt: p.createdAt || new Date(),
        updatedAt: new Date(),
      });
      saved.push(doc);
    }
    return saved;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.deleteOne({ id });
  }
}

export function getUserProjectsRepository(userId: string): UserProjectsRepository {
  return new UserProjectsRepository(userId);
}
