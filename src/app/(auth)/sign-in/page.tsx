"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleOAuth = (provider: "github" | "google") => {
    signIn(provider, { callbackUrl: "/home" });
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    await signIn("demo", {
      email: email || "candidate@basebuildstack.internal",
      callbackUrl: "/home",
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // In dev / demo, sign in directly with credentials provider
    await signIn("demo", {
      email,
      callbackUrl: "/home",
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GlassCard tone="strong" padding="lg" className="w-full max-w-[440px] space-y-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--glass-subtle)] border border-[var(--border)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            <span className="font-mono text-[11px] font-semibold text-[var(--text)]">
              BaseBuildStack Auth
            </span>
          </div>
          <h1 className="font-display text-[26px] font-bold text-[var(--text)] tracking-tight">
            Sign in to your account
          </h1>
          <p className="font-ui text-[13px] text-[var(--text-2)]">
            One account across phone and laptop with isolated data persistence.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            className="w-full py-2.5 px-4 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] hover:bg-[var(--glass)] hover:border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("google")}
            className="w-full py-2.5 px-4 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] hover:bg-[var(--glass)] hover:border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
          <span className="text-[11px] font-mono uppercase text-[var(--text-3)]">or email magic link</span>
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
        </div>

        {/* Email Magic Link Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-1.5 font-semibold">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
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
            Continue with Email
          </Button>
        </form>

        {sent && (
          <div className="p-3 rounded-[14px] bg-[var(--good-bg)] text-[var(--good-fg)] text-[12px] text-center font-medium">
            Session authenticated! Redirecting...
          </div>
        )}

        {/* Fast Dev / Demo Access */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2.5">
          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2.5 px-3 rounded-full border border-dashed border-[var(--border-strong)] bg-[var(--glass-subtle)] hover:bg-[var(--glass)] text-[12px] font-mono text-[var(--text)] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Chip v="DEV" tone="accent" className="text-[10px] py-0 px-1.5" />
            <span>Instant Demo Candidate Sign In &rarr;</span>
          </button>

          <p className="text-[11px] text-center text-[var(--text-3)]">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-[var(--text)] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
