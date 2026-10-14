"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("AI Engineer");
  const [loading, setLoading] = useState(false);

  const roles = [
    "AI Engineer",
    "Full-Stack / Backend",
    "Frontend Engineer",
    "DevOps / Cloud",
  ];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const result = await signIn("demo", {
      email,
      name: email.split("@")[0],
      callbackUrl: "/home",
      redirect: false,
    });
    if (result?.url) {
      window.location.href = result.url;
    } else {
      window.location.href = "/home";
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GlassCard tone="strong" padding="lg" className="w-full max-w-[460px] space-y-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            <span className="font-mono text-[11px] font-semibold text-[var(--text)]">
              Candidate Onboarding
            </span>
          </div>
          <h1 className="font-display text-[26px] font-bold text-[var(--text)] tracking-tight">
            Create your account
          </h1>
          <p className="font-ui text-[13px] text-[var(--text-2)]">
            Set your target role and start diagnosing knowledge gaps in minutes.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Target Role Chips */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-2 font-semibold">
              Select Target Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => {
                const isSelected = targetRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTargetRole(r)}
                    className={`p-3 rounded-[14px] text-[12px] font-medium border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border-[var(--accent)] text-[var(--accent-bright)] font-semibold shadow-[0_0_12px_rgba(94,78,240,0.3)]"
                        : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-1.5 font-semibold">
              Work / Personal Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent-bright)] outline-none transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="md"
            className="w-full"
          >
            Start Free Preparation &rarr;
          </Button>
        </form>

        <div className="pt-2 border-t border-[var(--border)] text-center">
          <p className="text-[11px] text-[var(--text-3)] font-ui">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[var(--text)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
