"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTheme } from "@/components/theme/theme-provider";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [couponCode, setCouponCode] = useState("PRO100");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleRedeemCoupon = async (codeToRedeem?: string) => {
    const code = (codeToRedeem || couponCode).trim();
    if (!code) return;
    setIsRedeeming(true);
    setCouponStatus(null);
    try {
      const res = await fetch("/api/payments/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCouponStatus({ success: true, message: data.message });
      } else {
        setCouponStatus({ success: false, message: data.error || "Failed to redeem coupon." });
      }
    } catch {
      setCouponStatus({ success: false, message: "Network error while redeeming coupon." });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[720px] mx-auto py-2">
      <header className="border-b border-[var(--border)] pb-6 space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
          Account &amp; Preferences
        </h1>
        <p className="font-ui text-xs sm:text-sm text-[var(--text-2)]">
          Manage your role, stack, appearance, and access entitlements.
        </p>
      </header>

      {/* Pro Entitlements & Coupon Redemption */}
      <GlassCard tone="default" padding="lg" className="space-y-4 rim border-[var(--accent)] shadow-[0_0_24px_-8px_rgba(94,78,240,0.35)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-bright)] font-bold">
              Full Platform Access
            </span>
            <h3 className="font-display text-[18px] font-bold text-[var(--text)] mt-0.5">
              Redeem Access Coupon
            </h3>
          </div>
          <Chip v={couponStatus?.success ? "Pro Unlocked" : "VIP Coupon Available"} tone="pro" />
        </div>
        <p className="font-ui text-[13px] text-[var(--text-2)] leading-relaxed">
          Enter an access code below to unlock unlimited daily drills, all 8 Tech Bites lessons, rubric grading, and complete module content.
        </p>

        <div className="space-y-2 pt-1">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
            Coupon Code:
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon (e.g. PRO100)"
              className="w-full sm:flex-1 px-4 py-2.5 rounded-full bg-[var(--glass-subtle)] border border-[var(--border)] font-mono text-sm uppercase tracking-wider text-[var(--text)] focus:outline-none focus:border-[var(--accent-bright)]"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => handleRedeemCoupon()}
              disabled={isRedeeming || !couponCode.trim()}
              loading={isRedeeming}
              className="w-full sm:w-auto"
            >
              Redeem Coupon &rarr;
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[var(--text-3)]">
            <span>Instant Codes:</span>
            <button
              type="button"
              onClick={() => {
                setCouponCode("PRO100");
                handleRedeemCoupon("PRO100");
              }}
              className="px-2 py-0.5 rounded-full bg-[var(--glass)] border border-[var(--border)] hover:border-[var(--accent-bright)] text-[var(--accent-bright)] font-bold cursor-pointer"
            >
              PRO100
            </button>
            <button
              type="button"
              onClick={() => {
                setCouponCode("BASEBUILDVIP");
                handleRedeemCoupon("BASEBUILDVIP");
              }}
              className="px-2 py-0.5 rounded-full bg-[var(--glass)] border border-[var(--border)] hover:border-[var(--accent-bright)] text-[var(--accent-bright)] font-bold cursor-pointer"
            >
              BASEBUILDVIP
            </button>
          </div>
        </div>

        {couponStatus && (
          <div
            className={`p-3.5 rounded-[16px] border text-xs font-mono leading-relaxed ${
              couponStatus.success
                ? "bg-[var(--good-bg)] text-[var(--good-fg)] border-[var(--state-done)]"
                : "bg-[var(--bad-bg)] text-[var(--bad-fg)] border-[#FF6B6B]"
            }`}
          >
            {couponStatus.message}
          </div>
        )}
      </GlassCard>

      {/* Profile & Target Role */}
      <GlassCard tone="default" padding="lg" className="space-y-4">
        <h3 className="font-display text-[18px] font-bold text-[var(--text)]">
          Target Role &amp; Stack
        </h3>
        <div className="space-y-3.5 text-[13px]">
          <div>
            <label className="block text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wider mb-1.5 font-semibold">
              Target Role
            </label>
            <div className="p-3 rounded-[16px] bg-[var(--glass-subtle)] border border-[var(--border)] font-medium text-[var(--text)]">
              AI Engineer (LLMs, RAG, Agents)
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wider mb-1.5 font-semibold">
              Primary Stack Chips
            </label>
            <div className="flex flex-wrap gap-2">
              <Chip v="TypeScript" tone="default" />
              <Chip v="Next.js" tone="default" />
              <Chip v="Python" tone="default" />
              <Chip v="MongoDB Atlas" tone="default" />
              <Chip v="PyTorch / Transformers" tone="accent" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Theme & Display */}
      <GlassCard tone="default" padding="lg" className="space-y-4">
        <h3 className="font-display text-[18px] font-bold text-[var(--text)]">
          Appearance &amp; Accessibility
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-[15px] font-semibold text-[var(--text)]">Theme Mode</div>
            <p className="font-ui text-[12px] text-[var(--text-2)] mt-0.5">
              Active: <strong className="text-[var(--accent-bright)] uppercase font-mono">{resolvedTheme}</strong> ({theme})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-[var(--accent)] text-white font-bold"
                  : "bg-[var(--glass)] text-[var(--text-2)] border border-[var(--border)]"
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                theme === "light"
                  ? "bg-[var(--accent)] text-white font-bold"
                  : "bg-[var(--glass)] text-[var(--text-2)] border border-[var(--border)]"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                theme === "system"
                  ? "bg-[var(--accent)] text-white font-bold"
                  : "bg-[var(--glass)] text-[var(--text-2)] border border-[var(--border)]"
              }`}
            >
              System
            </button>
            <ThemeToggle />
          </div>
        </div>
      </GlassCard>

      {/* Data Privacy & Self-Serve Controls */}
      <GlassCard tone="default" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[18px] font-bold text-[var(--text)]">
            Data Privacy &amp; GDPR Controls
          </h3>
          <Chip v="Isolated Repos" tone="done" />
        </div>
        <p className="font-ui text-[13px] text-[var(--text-2)] leading-relaxed">
          BaseBuildStack maintains strict per-user data isolation. Every query is scoped by your session. No advertising trackers are loaded.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm">
            Export All Data (JSON)
          </Button>
          <button
            type="button"
            className="px-4 py-2 rounded-full text-[12px] font-semibold border border-[#FF6B6B]/40 text-[#FF8A8A] bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 transition-all cursor-pointer"
          >
            Delete Account &amp; Data
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
