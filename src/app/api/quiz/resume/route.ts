import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { extractSkillsFromResume } from "@/lib/m2/skill-extractor";
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
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      filename = file.name;
      // Read text content from uploaded file
      resumeText = await file.text();
    } else {
      const body = await req.json();
      resumeText = body.text || "";
      filename = body.filename || "pasted-resume.txt";
      keepResume = body.keepResume === true;
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text is empty" },
        { status: 400 }
      );
    }

    // Extract proposed skills without committing to database yet
    const { skills, extractionMode } = await extractSkillsFromResume(resumeText);

    // Save resume metadata (not raw file content) if user requested
    if (keepResume && userId !== "guest_user") {
      const profileRepo = getProfileRepository(userId);
      await profileRepo.setResumeMeta({
        filename,
        uploadedAt: new Date(),
        extractedCount: skills.length,
        keepResume: true,
      });
    }

    return NextResponse.json({
      proposedSkills: skills,
      extractionMode,
      filename,
      extractedCount: skills.length,
    });
  } catch (err) {
    console.error("Resume extraction failed:", err);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
}
