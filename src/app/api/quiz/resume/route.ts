import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { extractSkillsFromResume } from "@/lib/m2/skill-extractor";
import { parseResumeFile } from "@/lib/m2/resume-parser";
import { getProfileRepository } from "@/lib/db/repositories";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest_user";

  try {
    const contentType = req.headers.get("content-type") || "";
    let resumeText = "";
    let filename = "pasted-resume.txt";
    let keepResume = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      keepResume = formData.get("keepResume") === "true";

      if (!file) {
        return NextResponse.json(
          { error: "No file provided. Please choose a PDF, DOCX, Markdown, or text file." },
          { status: 400 }
        );
      }

      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const parsed = await parseResumeFile(buffer, filename, file.type);
        resumeText = parsed.text;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to parse resume file";
        return NextResponse.json({ error: message }, { status: 422 });
      }
    } else {
      const body = await req.json();
      resumeText = body.text || "";
      filename = body.filename || "pasted-resume.txt";
      keepResume = body.keepResume === true;
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text is empty. Please paste your text or upload a document." },
        { status: 400 }
      );
    }

    // Structured extraction: produces canonical skills with evidence + projects with metrics
    const extraction = await extractSkillsFromResume(resumeText);

    if (keepResume && userId !== "guest_user") {
      try {
        const profileRepo = getProfileRepository(userId);
        await profileRepo.setResumeMeta({
          filename,
          uploadedAt: new Date(),
          extractedCount: extraction.skills.length,
          keepResume: true,
        });
      } catch (err) {
        console.warn("Failed to save resume metadata:", err);
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      proposedSkills: extraction.skills,
      proposedProjects: extraction.projects,
      unsupportedSkills: extraction.unsupportedSkills,
      experience: extraction.experience,
      extractionMode: extraction.extractionMode,
      extractedCount: extraction.skills.length,
    });
  } catch (err: unknown) {
    console.error("Resume extraction failed:", err);
    const message = err instanceof Error ? err.message : "Internal error processing resume";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
