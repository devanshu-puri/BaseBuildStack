"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { PlanId } from "@/lib/payments/types";
import { launchRazorpayCheckout } from "@/lib/payments/razorpay-client";

export interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPlan?: PlanId;
  initialMessage?: string;
  alreadyPro?: boolean;
}

export function PricingModal({
  open,
  onClose,
  onSuccess,
  defaultPlan = "pro_monthly",
  initialMessage,
  alreadyPro = false,
}: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [mobileTab, setMobileTab] = useState<"pro" | "free">("pro");
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoFallback, setShowDemoFallback] = useState(false);
  const [showRecheckout, setShowRecheckout] = useState(false);
  const [successData, setSuccessData] = useState<{
    planId: PlanId;
    isPro: boolean;
    providerRef?: string;
    isDemo?: boolean;
  } | null>(null);

  const activePlanId: PlanId = billingCycle === "yearly" ? "pro_yearly" : "pro_monthly";
  const proPrice = billingCycle === "yearly" ? "₹89" : "₹9";
  const proPeriod = billingCycle === "yearly" ? "/ year" : "/ month";

  // 1-Click Demo / Sandbox Payment Handler
  const handleDemoPayment = async () => {
    setIsSimulating(true);
    setErrorMessage(null);
    setShowDemoFallback(false);

    try {
      const res = await fetch("/api/payments/simulate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: activePlanId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData({
          planId: activePlanId,
          isPro: true,
          providerRef: "sandbox_free_demo",
          isDemo: true,
        });
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.error || "Demo payment simulation failed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Demo payment error";
      setErrorMessage(msg);
    } finally {
      setIsSimulating(false);
    }
  };

  // Real / Test Razorpay Checkout Handler
  const handleRazorpayCheckout = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setShowDemoFallback(false);

    try {
      // 1. Create Order on backend
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: activePlanId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setShowDemoFallback(true);
        throw new Error(
          errData.error ||
            "Razorpay order initialization pending. Try the instant 1-Click Free Demo Payment below!"
        );
      }

      const { order } = await res.json();

      // 2. Launch Razorpay Checkout Modal
      await launchRazorpayCheckout({
        order,
        planId: activePlanId,
        onSuccess: (result) => {
          setSuccessData({
            planId: activePlanId,
            isPro: true,
            providerRef: result.paymentId,
            isDemo: false,
          });
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          setErrorMessage(err);
          setShowDemoFallback(true);
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment checkout error";
      setErrorMessage(msg);
      setShowDemoFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessData(null);
    setErrorMessage(null);
    setShowDemoFallback(false);
    setShowRecheckout(false);
    onClose();
  };

  // If user is already Pro and not requesting re-checkout, show their active membership dashboard
  const isViewingActivePro = (alreadyPro || successData?.isPro) && !showRecheckout;

  return (
    <Dialog
      open={open}
      onClose={handleResetAndClose}
      size="lg"
      padding="none"
      className="p-0 overflow-y-auto overscroll-contain"
    >
      {isViewingActivePro ? (
        <div className="p-5 sm:p-8 text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--state-done)] to-[var(--accent)] text-white flex items-center justify-center text-3xl shadow-[0_0_32px_rgba(46,204,113,0.4)]">
            ✨
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Pro Membership &bull; Unlimited Access</span>
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
              Welcome to BaseBuildStack Pro
            </h2>
            <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] max-w-[500px] mx-auto leading-relaxed">
              Your Pro entitlements are active. You have full access to uncapped drills, all 8 Tech Bites lessons with SRS spaced repetition, AI rubric grading, and senior project STAR defense panels.
            </p>
          </div>

          <div className="p-4 rounded-[18px] bg-[var(--glass-subtle)] border border-[var(--border)] max-w-[480px] mx-auto text-left space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center text-[var(--text-2)]">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span>●</span> ACTIVE PRO
              </span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-2)]">
              <span>Current Plan:</span>
              <span className="text-[var(--text)] font-bold">BaseBuildStack Pro ({proPrice})</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 space-y-1.5 text-[11px] font-ui text-[var(--text-2)]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Unlimited DSA Pattern Blitz cards &amp; Bug Audits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Full Tech Bites 8-lesson curriculum with +3d/+10d SRS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>System design open-ended decision trees &amp; AI rubric grading</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Senior Project STAR interview panel simulator</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8"
              onClick={handleResetAndClose}
            >
              Continue Training &rarr;
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="text-xs font-mono text-[var(--text-3)] hover:text-[var(--text)]"
              onClick={() => setShowRecheckout(true)}
            >
              Test Payment Flow Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-bright)] text-xs font-mono">
              <span>⚡ Razorpay &amp; Demo Sandbox</span>
              <span>&bull;</span>
              <span>Instant Pro Unlock</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
              Unlock Full Platform Access
            </h2>
            <p className="hidden sm:block font-ui text-xs text-[var(--text-2)] max-w-[500px] mx-auto leading-relaxed">
              {initialMessage ||
                "Practice with uncapped technical rounds, full lesson curriculum, AI rubric evaluation, and senior project interview panels."}
            </p>

            {/* Billing Cycle Switcher */}
            <div className="pt-0.5 flex items-center justify-center">
              <div className="inline-flex p-1 rounded-full bg-[var(--glass)] border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3.5 sm:px-4 py-1 rounded-full text-[11px] sm:text-xs font-mono transition-all cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                      : "text-[var(--text-2)] hover:text-[var(--text)] font-medium"
                  }`}
                >
                  Monthly (₹9)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-3.5 sm:px-4 py-1 rounded-full text-[11px] sm:text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === "yearly"
                      ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                      : "text-[var(--text-2)] hover:text-[var(--text)] font-medium"
                  }`}
                >
                  <span>Yearly (₹89)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/30 text-emerald-300 font-bold">
                    SAVE 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="md:hidden pt-0.5 flex items-center justify-center">
              <div className="w-full grid grid-cols-2 p-0.5 rounded-full bg-[var(--glass-strong)] border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setMobileTab("pro")}
                  className={`py-1.5 px-3 rounded-full text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === "pro"
                      ? "bg-gradient-to-r from-[var(--accent)] to-[#8B5CF6] text-white shadow-md"
                      : "text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>⚡ Pro Plan</span>
                  <span className="text-[10px] font-bold opacity-90">({proPrice})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("free")}
                  className={`py-1.5 px-3 rounded-full text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === "free"
                      ? "bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] shadow-sm"
                      : "text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>Free Tier</span>
                  <span className="text-[10px] opacity-75">(₹0)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid: Buttons positioned at top of each card so they are 100% visible on all viewports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 items-stretch">
            {/* Free Plan Card */}
            <div
              className={`rounded-[22px] border border-[var(--border)] bg-[var(--glass)] p-4 sm:p-5 flex flex-col justify-between transition-all ${
                mobileTab === "free" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="space-y-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between min-h-[24px]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                    Starter Experience
                  </span>
                  <Chip v="Current Tier" tone="default" className="text-[10px]" />
                </div>

                {/* Plan Title */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--text)] min-h-[28px] flex items-center">
                  Free Tier
                </h3>

                {/* Price Block */}
                <div className="flex items-baseline gap-1.5 min-h-[36px]">
                  <span className="text-3xl sm:text-4xl font-black text-[var(--text)] font-display">₹0</span>
                  <span className="text-xs text-[var(--text-3)] font-normal font-ui">/ forever</span>
                </div>

                {/* Free Action Buttons (Positioned directly under price) */}
                <div className="space-y-1.5 pt-1">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full text-xs font-mono font-medium opacity-80 cursor-default"
                    disabled
                  >
                    Active Free Plan
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("pro")}
                    className="w-full md:hidden py-1.5 px-3 rounded-xl text-xs font-mono text-[var(--accent-bright)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡ Switch to Pro ({proPrice}) &rarr;</span>
                  </button>
                  <div className="h-[24px] hidden md:flex items-center justify-center text-[10px] font-mono text-[var(--text-3)]">
                    Basic warm-ups &amp; 5 drills/day
                  </div>
                </div>

                {/* Description */}
                <p className="font-ui text-xs text-[var(--text-2)] leading-relaxed pt-1">
                  Essential daily warm-ups and introductory curriculum to build interview habits.
                </p>

                {/* Features List */}
                <ul className="border-t border-[var(--border)] pt-2.5 space-y-1.5 text-xs font-ui text-[var(--text-2)]">
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-400 font-bold shrink-0">✓</span>
                    <span>5 Pattern Blitz DSA cards / day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-400 font-bold shrink-0">✓</span>
                    <span>5 Bug Audits with isolated sandbox / day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-400 font-bold shrink-0">✓</span>
                    <span>First 2 Tech Bites preview lessons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-400 font-bold shrink-0">✓</span>
                    <span>5-minute daily Mind Sprint workouts</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--text-3)]">
                    <span className="w-3.5 text-[var(--text-3)] font-bold shrink-0">✗</span>
                    <span>AI rubric system design grading</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--text-3)]">
                    <span className="w-3.5 text-[var(--text-3)] font-bold shrink-0">✗</span>
                    <span>Resume project defense &amp; STAR panels</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div
              className={`aurora-card rounded-[22px] p-4 sm:p-5 text-white flex flex-col justify-between relative shadow-[0_0_36px_-6px_rgba(94,78,240,0.5)] border border-[var(--accent-bright)]/45 transition-all ${
                mobileTab === "pro" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="space-y-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between min-h-[24px]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C084FC] font-bold">
                    Full Access
                  </span>
                  <Chip v="Most Popular" tone="pro" className="text-[10px] font-bold" />
                </div>

                {/* Plan Title */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white min-h-[28px] flex items-center">
                  BaseBuildStack Pro
                </h3>

                {/* Price Block */}
                <div className="flex items-baseline gap-1.5 min-h-[36px]">
                  <span className="text-3xl sm:text-4xl font-black text-white font-display">
                    {proPrice}
                  </span>
                  <span className="text-xs text-[#B4B8CC] font-normal font-ui">
                    {proPeriod}
                  </span>
                </div>

                {/* Pro Action Buttons: Positioned directly under price for 100% instant visibility */}
                <div className="space-y-1.5 pt-1">
                  {/* Primary Razorpay Button */}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleRazorpayCheckout}
                    disabled={isLoading || isSimulating}
                    loading={isLoading}
                    className="w-full text-xs font-mono font-bold uppercase tracking-wider shadow-lg bg-gradient-to-r from-[var(--accent)] to-[#8B5CF6] hover:brightness-110 cursor-pointer"
                  >
                    {isLoading ? "Connecting Razorpay..." : `Pay ${proPrice} with Razorpay`}
                  </Button>

                  {/* Instant Demo Payment Button */}
                  <button
                    type="button"
                    onClick={handleDemoPayment}
                    disabled={isLoading || isSimulating}
                    className="w-full py-2 px-3 rounded-xl text-xs font-mono font-bold text-white bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <span className="text-emerald-300">⚡</span>
                    <span>{isSimulating ? "Unlocking Sandbox Pro..." : "Try Demo Payment (Instant Pro)"}</span>
                  </button>

                  {/* Direct UPI */}
                  <a
                    href="https://razorpay.me/@devanshupuri"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1 px-2.5 rounded-lg text-[10px] font-mono text-[#E2E8F0] hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📱</span>
                    <span>Direct UPI: razorpay.me/@devanshupuri ↗</span>
                  </a>
                </div>

                {/* Description */}
                <p className="font-ui text-xs text-[#E2E8F0] leading-relaxed pt-1">
                  Uncapped practice, full 8+ lessons with SRS, AI rubric grading &amp; STAR defense.
                </p>

                {/* Features List */}
                <ul className="border-t border-white/15 pt-2.5 space-y-1.5 text-xs font-ui text-[#E2E8F0]">
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-300 font-bold shrink-0">✓</span>
                    <span className="font-medium text-white">Unlimited DSA Blitz &amp; Bug Audits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-300 font-bold shrink-0">✓</span>
                    <span className="font-medium text-white">All 8+ Tech Bites with spaced SRS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-300 font-bold shrink-0">✓</span>
                    <span>AI Rubric system design evaluation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-300 font-bold shrink-0">✓</span>
                    <span>Senior project defense &amp; STAR panels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-300 font-bold shrink-0">✓</span>
                    <span>Metacognitive accuracy heatmaps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 text-emerald-300 font-bold shrink-0">✓</span>
                    <span>Node worker execution environment</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fallback Banner if Razorpay failed */}
          {showDemoFallback && (
            <div className="p-3 rounded-[16px] bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/30 text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
              <div className="space-y-0.5">
                <span className="font-bold text-white">⚡ Razorpay Live Onboarding In Review:</span>
                <p className="text-[11px] text-amber-200/90 font-ui">
                  Your website review is in progress at Razorpay. Click below to unlock Pro instantly with the Free Demo Payment!
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoPayment}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-mono font-bold text-xs hover:bg-emerald-600 transition-all cursor-pointer shrink-0"
              >
                {isSimulating ? "Unlocking..." : "Unlock Pro Now (Free Demo) &rarr;"}
              </button>
            </div>
          )}

          {/* Error Message display */}
          {errorMessage && !showDemoFallback && (
            <div className="p-3 rounded-[14px] bg-[var(--bad-bg)] border border-[#FF6B6B]/40 text-[#FF8A8A] text-xs font-mono flex items-center justify-between">
              <span className="leading-relaxed">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-bold underline ml-2 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="text-center space-y-1 text-[11px] font-mono text-[var(--text-3)] pt-1">
            <p>
              🔒 256-bit encrypted checkout via Razorpay &bull; Test Mode &amp; 1-Click Demo Supported
            </p>
            <p>
              Have a VIP coupon code?{" "}
              <a href="/settings" className="text-[var(--accent-bright)] hover:underline font-bold">
                Redeem access code in Settings &rarr;
              </a>
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
