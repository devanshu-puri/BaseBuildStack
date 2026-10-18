"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [targetRole, setTargetRole] = useState("AI Engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    "AI Engineer",
    "Full-Stack / Backend",
    "Frontend Engineer",
    "DevOps / Cloud",
  ];

  const handleOAuth = async (provider: "github" | "google") => {
    setLoading(true);
    setError(null);
    try {
      await signIn(provider, { callbackUrl: "/home" });
    } catch {
      setError(`Failed to connect to ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Call secure registration endpoint
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, targetRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Automatically log the candidate in
      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/home",
        redirect: false,
      });

      if (signInResult?.url) {
        window.location.href = signInResult.url;
      } else {
        window.location.href = "/home";
      }
    } catch {
      setError("Network error while creating account. Please try again.");
      setLoading(false);
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

        {/* OAuth Fast Sign Up */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] hover:bg-[var(--glass)] hover:border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text)] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Sign up with GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] hover:bg-[var(--glass)] hover:border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text)] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Sign up with Google</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
          <span className="text-[11px] font-mono uppercase text-[var(--text-3)]">or create email account</span>
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
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

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-1.5 font-semibold">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Dev"
              className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent-bright)] outline-none transition-colors"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-1.5 font-semibold">
              Email Address
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

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                Password (min. 8 characters)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-mono text-[var(--accent-bright)] hover:underline cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent-bright)] outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-[14px] bg-[var(--bad-bg)] border border-[#FF6B6B]/40 text-[#FF6B6B] text-[12px] font-medium leading-relaxed">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="md"
            className="w-full"
          >
            Create Account &rarr;
          </Button>

          <p className="text-[11px] text-center text-[var(--text-3)]">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[var(--accent-bright)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </GlassCard>
    </main>
  );
}
