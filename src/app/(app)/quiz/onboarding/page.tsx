"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StepperTimeline } from "@/components/ui/stepper-timeline";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { TargetRole, normalizeSkillAlias } from "@/lib/m2/skill-taxonomy";
import { ExtractedSkill, ExtractedProject } from "@/lib/m2/skill-extractor";

interface DiffSummary {
  newSkillsCount: number;
  newProjectsCount: number;
  modifiedCount: number;
}

export default function QuizOnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<"skills" | "projects">("skills");
  const [loading, setLoading] = useState(true);

  // Taxonomy & Options
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [popularStack, setPopularStack] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Existing profile snapshot for diffing
  const [existingSkills, setExistingSkills] = useState<ExtractedSkill[]>([]);
  const [existingProjects, setExistingProjects] = useState<ExtractedProject[]>([]);
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null);

  // Working state (unconfirmed until Step 2 Commit)
  const [skills, setSkills] = useState<ExtractedSkill[]>([]);
  const [projects, setProjects] = useState<ExtractedProject[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // New manual project form state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [manualProjName, setManualProjName] = useState("");
  const [manualProjSummary, setManualProjSummary] = useState("");
  const [manualProjRole, setManualProjRole] = useState("Software Engineer");
  const [manualProjTech, setManualProjTech] = useState("");
  const [manualProjMetrics, setManualProjMetrics] = useState("");

  // Resume upload state
  const [resumeText, setResumeText] = useState("");
  const [pasteMode, setPasteMode] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedMeta, setExtractedMeta] = useState<{ filename: string; count: number } | null>(null);

  // Commit & Success state
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastVerifiedDate, setLastVerifiedDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadTaxonomyAndProfile() {
      try {
        const res = await fetch("/api/quiz/onboarding");
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles || []);
          setPopularStack(data.popularStack || []);

          if (data.confirmedSkills && data.confirmedSkills.length > 0) {
            setSkills(data.confirmedSkills);
            setExistingSkills(data.confirmedSkills);
          }
          if (data.projects && data.projects.length > 0) {
            setProjects(data.projects);
            setExistingProjects(data.projects);
          }
          if (data.roles && data.roles.length > 0) {
            setSelectedRole(data.roles[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load onboarding taxonomy:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTaxonomyAndProfile();
  }, []);

  const handleToggleStackChip = (tech: string) => {
    const canonical = normalizeSkillAlias(tech);
    const resolvedName = canonical ? canonical.name : tech;

    const existingIndex = skills.findIndex((s) => s.name.toLowerCase() === resolvedName.toLowerCase());
    if (existingIndex >= 0) {
      setSkills(skills.filter((_, idx) => idx !== existingIndex));
    } else {
      setSkills([
        ...skills,
        {
          name: resolvedName,
          skillId: canonical ? canonical.id : undefined,
          level: "intermediate",
          source: "manual",
        },
      ]);
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const roleObj = roles.find((r) => r.id === roleId);
    if (!roleObj) return;

    const existingNames = new Set(skills.map((s) => s.name.toLowerCase()));
    const newItems: ExtractedSkill[] = [];

    for (const rec of roleObj.recommendedSkills) {
      if (!existingNames.has(rec.toLowerCase())) {
        existingNames.add(rec.toLowerCase());
        const canonical = normalizeSkillAlias(rec);
        newItems.push({
          name: canonical ? canonical.name : rec,
          skillId: canonical ? canonical.id : undefined,
          level: "intermediate",
          source: "manual",
        });
      }
    }

    if (newItems.length > 0) {
      setSkills([...skills, ...newItems]);
    }
  };

  const computeDiff = (
    newExtractedSkills: ExtractedSkill[],
    newExtractedProjects: ExtractedProject[]
  ) => {
    const existingSkillNames = new Set(existingSkills.map((s) => s.name.toLowerCase()));
    const addedSkills = newExtractedSkills.filter((s) => !existingSkillNames.has(s.name.toLowerCase()));

    const existingProjNames = new Set(existingProjects.map((p) => p.name.toLowerCase()));
    const addedProjects = newExtractedProjects.filter((p) => !existingProjNames.has(p.name.toLowerCase()));

    if (existingSkills.length > 0 || existingProjects.length > 0) {
      setDiffSummary({
        newSkillsCount: addedSkills.length,
        newProjectsCount: addedProjects.length,
        modifiedCount: newExtractedSkills.length - addedSkills.length,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/quiz/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process resume file");
      }

      const extractedSkills: ExtractedSkill[] = data.proposedSkills || [];
      const extractedProjects: ExtractedProject[] = data.proposedProjects || [];

      // Merge skills with existing selections
      const existingNames = new Set(skills.map((s) => s.name.toLowerCase()));
      const mergedSkills = [...skills];
      for (const item of extractedSkills) {
        if (!existingNames.has(item.name.toLowerCase())) {
          existingNames.add(item.name.toLowerCase());
          mergedSkills.push(item);
        }
      }

      // Merge projects
      const existingProjNames = new Set(projects.map((p) => p.name.toLowerCase()));
      const mergedProjects = [...projects];
      for (const proj of extractedProjects) {
        if (!existingProjNames.has(proj.name.toLowerCase())) {
          existingProjNames.add(proj.name.toLowerCase());
          mergedProjects.push(proj);
        }
      }

      computeDiff(extractedSkills, extractedProjects);
      setSkills(mergedSkills);
      setProjects(mergedProjects);
      setExtractedMeta({ filename: data.filename, count: extractedSkills.length });
      setStep(2);
    } catch (err: unknown) {
      console.error("File upload failed:", err);
      setUploadError(err instanceof Error ? err.message : "Error reading resume file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractPastedResume = async () => {
    if (!resumeText.trim()) return;

    setIsExtracting(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/quiz/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText, filename: "pasted-resume.txt" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse text");
      }

      const extractedSkills: ExtractedSkill[] = data.proposedSkills || [];
      const extractedProjects: ExtractedProject[] = data.proposedProjects || [];

      const existingNames = new Set(skills.map((s) => s.name.toLowerCase()));
      const mergedSkills = [...skills];
      for (const item of extractedSkills) {
        if (!existingNames.has(item.name.toLowerCase())) {
          existingNames.add(item.name.toLowerCase());
          mergedSkills.push(item);
        }
      }

      const existingProjNames = new Set(projects.map((p) => p.name.toLowerCase()));
      const mergedProjects = [...projects];
      for (const proj of extractedProjects) {
        if (!existingProjNames.has(proj.name.toLowerCase())) {
          existingProjNames.add(proj.name.toLowerCase());
          mergedProjects.push(proj);
        }
      }

      computeDiff(extractedSkills, extractedProjects);
      setSkills(mergedSkills);
      setProjects(mergedProjects);
      setExtractedMeta({ filename: "pasted-resume.txt", count: extractedSkills.length });
      setStep(2);
    } catch (err: unknown) {
      console.error("Resume extraction failed:", err);
      setUploadError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    const canonical = normalizeSkillAlias(trimmed);
    const finalName = canonical ? canonical.name : trimmed;

    const existingIndex = skills.findIndex((s) => s.name.toLowerCase() === finalName.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...skills];
      updated[existingIndex].level = newSkillLevel;
      setSkills(updated);
    } else {
      setSkills([
        ...skills,
        {
          name: finalName,
          skillId: canonical ? canonical.id : undefined,
          level: newSkillLevel,
          source: "manual",
        },
      ]);
    }

    setNewSkillName("");
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
  };

  const handleChangeSkillLevel = (name: string, level: "beginner" | "intermediate" | "advanced") => {
    setSkills(
      skills.map((s) => (s.name.toLowerCase() === name.toLowerCase() ? { ...s, level } : s))
    );
  };

  const handleCreateManualProject = () => {
    if (!manualProjName.trim()) return;

    const techArray = manualProjTech
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => normalizeSkillAlias(t)?.name || t);

    const metricsArray = manualProjMetrics
      .split(/[,;\n]/)
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const newProject: ExtractedProject = {
      id: `proj_manual_${Date.now()}`,
      name: manualProjName.trim(),
      summary: manualProjSummary.trim() || `Project implementing ${techArray.join(", ")}`,
      role: manualProjRole.trim() || "Software Engineer",
      techStack: techArray,
      responsibilities: [manualProjSummary.trim()].filter(Boolean),
      metrics: metricsArray,
      links: [],
      version: 1,
    };

    setProjects([...projects, newProject]);
    setShowAddProjectModal(false);
    setManualProjName("");
    setManualProjSummary("");
    setManualProjRole("Software Engineer");
    setManualProjTech("");
    setManualProjMetrics("");
  };

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  // Commit verified profile (skills + projects)
  const handleConfirmAndSave = async () => {
    if (skills.length === 0 || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/quiz/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          role: selectedRole,
          projects,
        }),
      });

      if (res.ok) {
        setLastVerifiedDate(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm font-mono text-[var(--muted)]">Loading Onboarding...</p>
      </div>
    );
  }

  const timelineSteps = [
    {
      id: "role_stack",
      title: "1. Role & Stack",
      description: "Pick target role, stack chips, or upload resume",
      status: (step === 1 ? "active" : "done") as "todo" | "active" | "done",
    },
    {
      id: "confirm",
      title: "2. Confirmation",
      description: "Review skills with evidence & confirm projects",
      status: (step === 2 ? "active" : "todo") as "todo" | "active" | "done",
    },
  ];

  if (savedSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6 pb-36">
        <GlassCard tone="strong" bezel className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-3xl font-bold shadow-[0_0_24px_rgba(94,78,240,0.35)]">
            ✓
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Profile Verified!</h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Saved <span className="font-bold text-[var(--fg)]">{skills.length} verified skills</span> and{" "}
              <span className="font-bold text-[var(--fg)]">{projects.length} projects</span> to your account.
            </p>
            {lastVerifiedDate && (
              <div className="text-[11px] font-mono text-[var(--accent)] pt-1">
                Last verified on {lastVerifiedDate}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button href="/quiz" variant="primary" size="lg" className="w-full">
              Start Interview Drills →
            </Button>
            <Button href="/home" variant="secondary" size="md" className="w-full">
              Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSavedSuccess(false)}
            >
              Edit Verified Stack Again
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-36">
      {/* Header Bar */}
      <GlassCard tone="subtle" bezel className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wider">
            MODULE II: PERSONALIZED QUIZZES
          </span>
          <Chip
            k="COUNT"
            v={`${skills.length} skills • ${projects.length} projects`}
            tone={skills.length > 0 ? "good" : "default"}
          />
        </div>
        <Link
          href="/quiz"
          className="text-xs font-mono text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
        >
          ✕ Cancel
        </Link>
      </GlassCard>

      {/* Stepper Timeline */}
      <GlassCard tone="default" bezel className="p-5">
        <StepperTimeline steps={timelineSteps} />
      </GlassCard>

      {/* STEP 1: Target Role, Stack Chips & Resume Upload */}
      {step === 1 && (
        <div className="space-y-6">
          {uploadError && (
            <div className="p-4 rounded-xl border border-[var(--state-bad-fg)]/30 bg-[var(--state-bad-bg)]/10 text-xs font-mono text-[var(--state-bad-fg)] flex items-center justify-between">
              <span>⚠️ {uploadError}</span>
              <button
                onClick={() => setUploadError(null)}
                className="text-xs font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. Target Role Selector */}
          <GlassCard tone="default" bezel className="p-6 space-y-3">
            <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
              1. Select Target Engineering Role
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--fg)] shadow-[0_0_12px_rgba(94,78,240,0.25)]"
                        : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{role.name}</div>
                    <div className="text-[10px] text-[var(--muted)] line-clamp-1 mt-1">
                      {role.recommendedSkills.slice(0, 3).join(", ")}...
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* 2. Popular Stack Chips */}
          <GlassCard tone="default" bezel className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
                2. Tap Your Stack Technologies
              </h2>
              <span className="text-xs font-mono text-[var(--muted)]">
                {skills.length} active
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularStack.map((tech) => {
                const isSelected = skills.some((s) => s.name.toLowerCase() === tech.toLowerCase());
                return (
                  <button
                    key={tech}
                    onClick={() => handleToggleStackChip(tech)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-fg,#ffffff)] border-[var(--accent)] font-semibold shadow-xs"
                        : "bg-[var(--glass-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--fg)]"
                    }`}
                  >
                    {isSelected ? `✓ ${tech}` : `+ ${tech}`}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* 3. Resume Upload Dropzone */}
          <GlassCard tone="default" bezel className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
                3. Or Extract Automatically from Resume (Skills & Projects)
              </h2>
              <button
                onClick={() => setPasteMode(!pasteMode)}
                className="text-xs font-mono text-[var(--accent)] hover:underline font-semibold cursor-pointer"
              >
                {pasteMode ? "Switch to File Dropzone" : "Paste Text Directly"}
              </button>
            </div>

            {pasteMode ? (
              <div className="space-y-3">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste raw resume or LinkedIn text here to extract skills and projects..."
                  rows={6}
                  className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-3 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={handleExtractPastedResume}
                  disabled={!resumeText.trim() || isExtracting}
                >
                  {isExtracting ? "Extracting Technologies & Projects..." : "Extract from Text →"}
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-6 cursor-pointer bg-[var(--glass-subtle)] transition-all">
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-3xl mb-2">📄</div>
                <div className="text-xs font-mono font-semibold text-[var(--fg)]">
                  {isExtracting ? "Parsing & Extracting Technologies & Projects..." : "Drag & drop resume or tap to browse"}
                </div>
                <div className="text-[11px] font-mono text-[var(--muted)] mt-1">
                  Supports PDF, Word (DOCX), Markdown, or plain text (Max 5 MB)
                </div>
              </label>
            )}
          </GlassCard>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              disabled={skills.length === 0}
              onClick={() => setStep(2)}
            >
              Continue to Confirmation ({skills.length} Skills) →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Skill & Project Confirmation Step (Nothing saved until committed) */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Header Info */}
          <GlassCard tone="default" bezel className="p-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
                Confirmation & Verification
              </h2>
              {extractedMeta && (
                <Chip k="SOURCE" v={`${extractedMeta.count} from ${extractedMeta.filename}`} tone="accent" />
              )}
            </div>

            {/* Re-upload Diff Notification */}
            {diffSummary && (
              <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs font-mono text-[var(--fg)] flex items-center justify-between">
                <span>
                  Diff detected: +{diffSummary.newSkillsCount} new skills, +{diffSummary.newProjectsCount} new projects.
                </span>
                <span className="text-[10px] text-[var(--muted)]">Review before saving</span>
              </div>
            )}

            <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">
              Review your technologies, adjust proficiency levels, and inspect your resume projects. Nothing is committed to your account until you confirm below.
            </p>

            {/* Tabs for Skills vs Projects */}
            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setActiveTab("skills")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeTab === "skills"
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "bg-[var(--glass-subtle)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                Skills ({skills.length})
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeTab === "projects"
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "bg-[var(--glass-subtle)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                Projects ({projects.length})
              </button>
            </div>
          </GlassCard>

          {/* TAB 1: SKILLS LIST & LEVEL SELECTOR */}
          {activeTab === "skills" && (
            <div className="space-y-4">
              {/* Add custom skill row */}
              <GlassCard tone="subtle" className="p-4 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Add another technology (e.g. Redis, Kafka, Kubernetes)..."
                  className="flex-1 text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomSkill()}
                />
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as "beginner" | "intermediate" | "advanced")}
                  className="text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl px-2.5 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddCustomSkill}
                >
                  Add
                </Button>
              </GlassCard>

              {/* Skills List with Evidence */}
              <div className="space-y-2.5">
                {skills.map((skill) => {
                  const usedInProjects = projects.filter((p) =>
                    p.techStack.some((t) => t.toLowerCase() === skill.name.toLowerCase())
                  );

                  return (
                    <GlassCard
                      key={skill.name}
                      tone="subtle"
                      className="p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[var(--fg)]">
                            {skill.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--muted)] uppercase">
                            {skill.source}
                          </span>
                          {skill.yearsHint && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                              {skill.yearsHint}
                            </span>
                          )}
                          {usedInProjects.length > 0 && (
                            <span className="text-[10px] font-mono text-[var(--state-good-fg)]">
                              used in {usedInProjects.length} {usedInProjects.length === 1 ? "project" : "projects"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={skill.level}
                            onChange={(e) =>
                              handleChangeSkillLevel(skill.name, e.target.value as "beginner" | "intermediate" | "advanced")
                            }
                            className="text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>

                          <button
                            onClick={() => handleRemoveSkill(skill.name)}
                            aria-label={`Remove ${skill.name}`}
                            className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--state-bad-fg)] hover:border-[var(--state-bad-fg)] flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Line evidence from resume text */}
                      {skill.evidence && (
                        <div className="text-[11px] text-[var(--muted)] italic bg-[var(--glass-subtle)] p-2 rounded-lg border border-[var(--border)] line-clamp-2">
                          &ldquo;{skill.evidence}&rdquo;
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS LIST */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--muted)]">
                  Projects feed the **Project Interview Panel** read-and-learn Q&As.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddProjectModal(true)}
                >
                  + Add Project Manually
                </Button>
              </div>

              {/* Add Project Modal / Card */}
              {showAddProjectModal && (
                <GlassCard tone="default" bezel className="p-5 space-y-3 border-[var(--accent)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[var(--fg)]">
                      New Project
                    </span>
                    <button
                      onClick={() => setShowAddProjectModal(false)}
                      className="text-xs text-[var(--muted)] hover:text-[var(--fg)] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="text"
                    value={manualProjName}
                    onChange={(e) => setManualProjName(e.target.value)}
                    placeholder="Project Name (e.g. Distributed Cache Proxy)..."
                    className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />

                  <input
                    type="text"
                    value={manualProjRole}
                    onChange={(e) => setManualProjRole(e.target.value)}
                    placeholder="Your Role (e.g. Lead Backend Engineer)..."
                    className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />

                  <textarea
                    value={manualProjSummary}
                    onChange={(e) => setManualProjSummary(e.target.value)}
                    placeholder="Project summary and architecture details..."
                    rows={2}
                    className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />

                  <input
                    type="text"
                    value={manualProjTech}
                    onChange={(e) => setManualProjTech(e.target.value)}
                    placeholder="Technologies used (comma separated, e.g. Node.js, Redis, Docker)..."
                    className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />

                  <input
                    type="text"
                    value={manualProjMetrics}
                    onChange={(e) => setManualProjMetrics(e.target.value)}
                    placeholder="Key metrics (e.g. 10k RPS, 50ms p99 latency)..."
                    className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddProjectModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateManualProject}
                      disabled={!manualProjName.trim()}
                    >
                      Add Project
                    </Button>
                  </div>
                </GlassCard>
              )}

              {/* Projects List */}
              <div className="space-y-3">
                {projects.map((project) => (
                  <GlassCard
                    key={project.id}
                    tone="subtle"
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-[var(--fg)]">
                          {project.name}
                        </div>
                        <div className="text-xs font-mono text-[var(--accent)]">
                          {project.role}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveProject(project.id)}
                        aria-label={`Remove ${project.name}`}
                        className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--state-bad-fg)] hover:border-[var(--state-bad-fg)] flex items-center justify-center text-xs transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {project.summary && (
                      <p className="text-xs text-[var(--muted)] font-ui leading-relaxed">
                        {project.summary}
                      </p>
                    )}

                    {/* Tech Stack Chips */}
                    {project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.techStack.map((tech) => (
                          <Chip key={tech} v={tech} tone="default" className="text-[10px]" />
                        ))}
                      </div>
                    )}

                    {/* Metrics Chips */}
                    {project.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.metrics.map((metric) => (
                          <span
                            key={metric}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                          >
                            📈 {metric}
                          </span>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                ))}

                {projects.length === 0 && (
                  <div className="py-8 text-center rounded-2xl border border-dashed border-[var(--border)] p-4 text-xs font-mono text-[var(--muted)]">
                    No projects found or added yet. Upload a resume with a projects section or tap &ldquo;+ Add Project Manually&rdquo; above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
            >
              ← Back to Stack Selection
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={skills.length === 0 || isSaving}
              onClick={handleConfirmAndSave}
            >
              {isSaving
                ? "Saving Profile..."
                : `Commit & Save (${skills.length} Skills, ${projects.length} Projects) →`}
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Bottom CTA for Mobile */}
      <BottomCTA
        label={
          step === 1
            ? `Continue with ${skills.length} Skills →`
            : isSaving
            ? "Saving Profile..."
            : `Commit & Save (${skills.length} Skills, ${projects.length} Projects) →`
        }
        onClick={() => {
          if (step === 1) setStep(2);
          else handleConfirmAndSave();
        }}
        disabled={skills.length === 0 || isSaving}
      />
    </div>
  );
}
