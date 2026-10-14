import { UserScopedRepository } from "../repository";
import { ProfileSchema, ProfileDocument } from "../schemas";

export class ProfileRepository extends UserScopedRepository<ProfileDocument> {
  constructor(userId: string) {
    super("profiles", userId, ProfileSchema);
  }

  async getProfile(): Promise<ProfileDocument | null> {
    return this.findOne();
  }

  async ensureProfile(): Promise<ProfileDocument> {
    const existing = await this.getProfile();
    if (existing) return existing;

    return this.create({
      userId: this.userId,
      skills: [],
      keepResume: false,
      updatedAt: new Date(),
    });
  }

  async addSkill(skill: {
    name: string;
    level: "beginner" | "intermediate" | "advanced";
    source: "manual" | "resume" | "repo";
    confirmed?: boolean;
  }): Promise<ProfileDocument> {
    const profile = await this.ensureProfile();
    const existingSkills = profile.skills.filter(
      (s) => s.name.toLowerCase() !== skill.name.toLowerCase()
    );
    existingSkills.push({
      name: skill.name,
      level: skill.level,
      source: skill.source,
      confirmed: skill.confirmed ?? true,
    });

    return this.upsert({}, { skills: existingSkills, updatedAt: new Date() });
  }

  async setResumeMeta(meta: {
    filename: string;
    uploadedAt: Date;
    extractedCount: number;
    keepResume: boolean;
  }): Promise<ProfileDocument> {
    await this.ensureProfile();
    return this.upsert(
      {},
      {
        resumeMeta: {
          filename: meta.filename,
          uploadedAt: meta.uploadedAt,
          extractedCount: meta.extractedCount,
        },
        keepResume: meta.keepResume,
        updatedAt: new Date(),
      }
    );
  }

  async updateSkills(
    skills: ProfileDocument["skills"]
  ): Promise<ProfileDocument> {
    await this.ensureProfile();
    return this.upsert({}, { skills, updatedAt: new Date() });
  }
}

export function getProfileRepository(userId: string): ProfileRepository {
  return new ProfileRepository(userId);
}
