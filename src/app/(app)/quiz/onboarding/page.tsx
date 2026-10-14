"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { StepperTimeline } from "@/components/ui/stepper-timeline";
import { BottomCTA } from "@/components/ui/bottom-cta";
import { TargetRole } from "@/lib/m2/skill-taxonomy";
import { ExtractedSkill } from "@/lib/m2/skill-extractor";

export default function QuizOnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);

  // Taxonomy & Options
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [popularStack, setPopularStack] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Skills state (unconfirmed until Step 2 confirmation)
  const [skills, setSkills] = useState<ExtractedSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // Resume upload state
  const [resumeText, setResumeText] = useState("");
  const [pasteMode, setPasteMode] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMeta, setExtractedMeta] = useState<{ filename: string; count: number } | null>(null);

  // Final confirmation state
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const res = await fetch("/api/quiz/onboarding");
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles || []);
          setPopularStack(data.popularStack || []);

          if (data.confirmedSkills && data.confirmedSkills.length > 0) {
            setSkills(data.confirmedSkills);
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

    loadTaxonomy();
  }, []);

  const handleToggleStackChip = (tech: string) => {
    const existingIndex = skills.findIndex((s) => s.name.toLowerCase() === tech.toLowerCase());
    if (existingIndex >= 0) {
      setSkills(skills.filter((_, idx) => idx !== existingIndex));
    } else {
      setSkills([...skills, { name: tech, level: "intermediate", source: "manual" }]);
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const roleObj = roles.find((r) => r.id === roleId);
    if (!roleObj) return;

    // Add recommended skills if not already present
    const existingNames = new Set(skills.map((s) => s.name.toLowerCase()));
    const newItems: ExtractedSkill[] = [];

    for (const rec of roleObj.recommendedSkills) {
      if (!existingNames.has(rec.toLowerCase())) {
        existingNames.add(rec.toLowerCase());
        newItems.push({ name: rec, level: "intermediate", source: "manual" });
      }
    }

    if (newItems.length > 0) {
      setSkills([...skills, ...newItems]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/quiz/resume", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const extracted: ExtractedSkill[] = data.proposedSkills || [];

        // Merge with existing skills without duplicate names
        const existingNames = new Set(skills.map((s) => s.name.toLowerCase()));
        const merged = [...skills];

        for (const item of extracted) {
          if (!existingNames.has(item.name.toLowerCase())) {
            existingNames.add(item.name.toLowerCase());
            merged.push(item);
          }
        }

        setSkills(merged);
        setExtractedMeta({ filename: data.filename, count: extracted.length });
        setStep(2); // Advance directly to confirmation
      }
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractPastedResume = async () => {
    if (!resumeText.trim()) return;

    setIsExtracting(true);
    try {
      const res = await fetch("/api/quiz/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText, filename: "pasted-resume.txt" }),
      });

      if (res.ok) {
        const data = await res.json();
        const extracted: ExtractedSkill[] = data.proposedSkills || [];

        const existingNames = new Set(skills.map((s) => s.name.toLowerCase()));
        const merged = [...skills];

        for (const item of extracted) {
          if (!existingNames.has(item.name.toLowerCase())) {
            existingNames.add(item.name.toLowerCase());
            merged.push(item);
          }
        }

        setSkills(merged);
        setExtractedMeta({ filename: "pasted-resume.txt", count: extracted.length });
        setStep(2);
      }
    } catch (err) {
      console.error("Resume extraction failed:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    const existingIndex = skills.findIndex((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...skills];
      updated[existingIndex].level = newSkillLevel;
      setSkills(updated);
    } else {
      setSkills([...skills, { name: trimmed, level: newSkillLevel, source: "manual" }]);
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

  const handleConfirmAndSave = async () => {
    if (skills.length === 0 || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/quiz/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, role: selectedRole }),
      });

      if (res.ok) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error("Failed to save skills:", err);
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
      title: "Role & Stack",
      description: "Pick target role, stack chips, or upload resume",
      status: (step === 1 ? "active" : "done") as "todo" | "active" | "done",
    },
    {
      id: "confirm",
      title: "Skill Confirmation",
      description: "Review, adjust levels, and commit your skills",
      status: (step === 2 ? "active" : "todo") as "todo" | "active" | "done",
    },
  ];

  if (savedSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <GlassCard tone="strong" bezel className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-3xl font-bold shadow-[0_0_24px_rgba(94,78,240,0.35)]">
            ✓
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Profile Configured!</h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Saved {skills.length} confirmed skills to your interview profile. Your personalized quizzes and skill heatmap are now ready.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button href="/home" variant="primary" size="lg" className="w-full">
              Go to Dashboard →
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => setSavedSuccess(false)}
            >
              Adjust Skills Again
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28">
      {/* Header Bar */}
      <GlassCard tone="subtle" bezel className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wider">
            MODULE II: PERSONALIZED QUIZZES
          </span>
          <Chip
            k="COUNT"
            v={`${skills.length} skills selected`}
            tone={skills.length > 0 ? "good" : "default"}
          />
        </div>
      </GlassCard>

      {/* Stepper Timeline */}
      <GlassCard tone="default" bezel className="p-5">
        <StepperTimeline steps={timelineSteps} />
      </GlassCard>

      {/* STEP 1: Target Role, Tech Stack Chips, and Resume Upload */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Target Role Selector */}
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
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Popular Stack Chips */}
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

          {/* Resume Upload Dropzone */}
          <GlassCard tone="default" bezel className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
                3. Or Extract Automatically from Resume
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
                  placeholder="Paste raw resume or LinkedIn text here to extract skills..."
                  rows={5}
                  className="w-full text-xs font-mono bg-[var(--glass-subtle)] border border-[var(--border)] rounded-xl p-3 text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={handleExtractPastedResume}
                  disabled={!resumeText.trim() || isExtracting}
                >
                  {isExtracting ? "Extracting Skills..." : "Extract Skills from Text →"}
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
                  {isExtracting ? "Parsing & Extracting Technologies..." : "Drag & drop resume or tap to browse"}
                </div>
                <div className="text-[11px] font-mono text-[var(--muted)] mt-1">
                  Supports PDF, Word, Markdown, or plain text
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
              Continue with {skills.length} Skills →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Skill Confirmation Grid & Level Selector (Nothing saved until confirmed) */}
      {step === 2 && (
        <div className="space-y-6">
          <GlassCard tone="default" bezel className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider font-mono">
                Skill Confirmation
              </h2>
              {extractedMeta && (
                <Chip k="EXTRACTED" v={`${extractedMeta.count} from ${extractedMeta.filename}`} tone="accent" />
              )}
            </div>
            <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">
              Review and adjust your proficiency levels before saving. Nothing is committed to your account until you confirm below.
            </p>
          </GlassCard>

          {/* Add custom skill input */}
          <GlassCard tone="subtle" className="p-4 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Add another technology (e.g. Redis, Kafka)..."
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

          {/* Confirmed Skills Grid */}
          <div className="space-y-2.5">
            {skills.map((skill) => (
              <GlassCard
                key={skill.name}
                tone="subtle"
                className="flex items-center justify-between p-3.5 gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[var(--fg)]">
                    {skill.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--muted)] uppercase">
                    {skill.source}
                  </span>
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
              </GlassCard>
            ))}
          </div>

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
              {isSaving ? "Saving Skills..." : `Confirm & Save ${skills.length} Skills →`}
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action */}
      <BottomCTA
        label={
          step === 1
            ? `Continue with ${skills.length} Skills →`
            : isSaving
            ? "Saving Profile..."
            : `Confirm & Commit ${skills.length} Skills →`
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
