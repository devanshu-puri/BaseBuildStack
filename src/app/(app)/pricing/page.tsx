"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { usePricingModal } from "@/components/payments/pricing-context";

export default function PricingPage() {
  const { openPricingModal } = usePricingModal();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const faqs = [
    {
      q: "Can I try out the payment gateway for free?",
      a: "Yes! Our Razorpay checkout modal provides an instant 1-click 'Free Sandbox Test Payment' that runs the real server-side fulfillment and unlocks all Pro features immediately for free without requiring a credit card or bank details.",
    },
    {
      q: "What payment methods are supported?",
      a: "Razorpay supports all major credit/debit cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking across 50+ banks, and popular digital wallets.",
    },
    {
      q: "What is the difference between Free and Pro?",
      a: "Free gives you 5 DSA blitz cards/day, 5 bug audit sandbox tests, 2 Tech Bites preview lessons, and the 5-minute Mind Sprint. Pro unlocks unlimited DSA & Bug Audits, all 8+ lessons with +3d/+10d SRS mastery retests, AI rubric grading on system designs, and customized STAR project interview panels.",
    },
    {
      q: "Is there any lock-in or recurring auto-debit?",
      a: "No hidden charges or unexpected debits. Test mode transactions are strictly simulated, and subscription periods are clearly visible in your Account Settings.",
    },
  ];

  return (
    <div className="space-y-8 max-w-[840px] mx-auto py-4 pb-32 sm:pb-16 px-2 sm:px-4">
      {/* Hero */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-bright)] text-xs font-mono">
          <span>⚡ Transparent Pricing</span>
          <span>&bull;</span>
          <span>Zero Lock-in</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-black text-[var(--text)] tracking-tight">
          Invest in Your Next Senior Offer
        </h1>
        <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-[560px] mx-auto leading-relaxed">
          Master algorithmic problem solving, production debugging, system architecture, and project defense in one feedback loop.
        </p>

        {/* Billing Switcher */}
        <div className="pt-3 flex items-center justify-center">
          <div className="inline-flex p-1 rounded-full bg-[var(--glass)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                  : "text-[var(--text-2)] hover:text-[var(--text)] font-medium"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                  : "text-[var(--text-2)] hover:text-[var(--text)] font-medium"
              }`}
            >
              <span>Yearly Access</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/25 text-emerald-300 font-bold">
                2 MONTHS FREE
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-stretch">
        {/* Free Plan */}
        <div className="order-2 md:order-1 rounded-[26px] border border-[var(--border)] bg-[var(--glass)] p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between min-h-[26px]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-3)] font-semibold">
                Starter Experience
              </span>
              <Chip v="Always Free" tone="default" />
            </div>

            <h3 className="font-display text-2xl font-bold text-[var(--text)] flex items-center min-h-[32px]">
              Free Tier
            </h3>

            <div className="flex items-baseline gap-1.5 min-h-[48px]">
              <span className="font-display text-3xl sm:text-4xl font-black text-[var(--text)]">₹0</span>
              <span className="text-xs text-[var(--text-3)] font-normal font-ui">/ forever</span>
            </div>

            <p className="font-ui text-xs text-[var(--text-2)] leading-relaxed min-h-[40px]">
              Essential daily warm-ups and introductory curriculum to build regular interview practice habits.
            </p>

            <div className="border-t border-[var(--border)] pt-4 space-y-2.5 text-xs font-ui text-[var(--text-2)]">
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-400 font-bold shrink-0">✓</span>
                <span>5 Pattern Blitz DSA rounds per day</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-400 font-bold shrink-0">✓</span>
                <span>5 Bug Audits with isolated sandbox evaluation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-400 font-bold shrink-0">✓</span>
                <span>First 2 Tech Bites preview lessons</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-400 font-bold shrink-0">✓</span>
                <span>5-minute daily Mind Sprint workouts</span>
              </div>
              <div className="flex items-center gap-2.5 text-[var(--text-3)]">
                <span className="w-4 text-[var(--text-3)] font-bold shrink-0">✗</span>
                <span>AI rubric system design evaluation &amp; pushback</span>
              </div>
              <div className="flex items-center gap-2.5 text-[var(--text-3)]">
                <span className="w-4 text-[var(--text-3)] font-bold shrink-0">✗</span>
                <span>Resume project defense &amp; STAR panels</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5 border-t border-[var(--border)] mt-4">
            <Button variant="secondary" size="lg" className="w-full text-xs font-mono" href="/home">
              Continue with Free
            </Button>
            <p className="text-center text-[10px] font-mono text-[var(--text-3)] h-[20px] flex items-center justify-center">
              No credit card or commitment required
            </p>
          </div>
        </div>

        {/* Pro Plan (Aurora Card - Shown FIRST on mobile!) */}
        <div className="order-1 md:order-2 aurora-card p-6 sm:p-7 rounded-[26px] text-white flex flex-col justify-between relative shadow-[0_0_48px_-8px_rgba(94,78,240,0.5)] border border-[var(--accent-bright)]/45">
          <div className="space-y-4">
            <div className="flex items-center justify-between min-h-[26px]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C084FC] font-bold">
                All-Inclusive Access
              </span>
              <Chip v="Recommended" tone="pro" className="font-bold text-xs" />
            </div>

            <h3 className="font-display text-2xl font-bold text-white flex items-center min-h-[32px]">
              BaseBuildStack Pro
            </h3>

            <div className="flex items-baseline gap-1.5 min-h-[48px]">
              <span className="font-display text-3xl sm:text-4xl font-black text-white">
                {billingCycle === "yearly" ? "₹89" : "₹9"}
              </span>
              <span className="text-xs text-[#B4B8CC] font-normal font-ui">
                {billingCycle === "yearly" ? "/ year" : "/ month"}
              </span>
            </div>

            <p className="font-ui text-xs text-[#E2E8F0] leading-relaxed min-h-[40px]">
              Uncapped practice, full 8+ lessons with SRS, AI rubric grading &amp; STAR defense.
            </p>

            <div className="border-t border-white/15 pt-4 space-y-2.5 text-xs font-ui text-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-300 font-bold shrink-0">✓</span>
                <span className="font-medium text-white">Unlimited Pattern Blitz &amp; Bug Audits</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-300 font-bold shrink-0">✓</span>
                <span className="font-medium text-white">All 8 Tech Bites with spaced SRS retests</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-300 font-bold shrink-0">✓</span>
                <span>System design open-ended decision trees &amp; rubric</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-300 font-bold shrink-0">✓</span>
                <span>Custom resume parsing &amp; Senior Project STAR panel</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-300 font-bold shrink-0">✓</span>
                <span>Metacognitive calibration &amp; 3-Score readiness metrics</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 text-emerald-300 font-bold shrink-0">✓</span>
                <span>Instant sandbox execution verification on Node workers</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5 border-t border-white/15 mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => openPricingModal()}
              className="w-full text-xs font-mono font-bold uppercase tracking-wider shadow-xl bg-gradient-to-r from-[var(--accent)] to-[#8B5CF6] hover:brightness-110 cursor-pointer"
            >
              Open Checkout ({billingCycle === "yearly" ? "₹89" : "₹9"}) &rarr;
            </Button>
            <p className="text-center text-[10px] font-mono text-[#B4B8CC] h-[20px] flex items-center justify-center">
              ⚡ Instant 1-Click Demo Sandbox &amp; Razorpay Gateway
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4 pt-6 border-t border-[var(--border)]">
        <h2 className="font-display text-xl font-bold text-[var(--text)] text-center">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <GlassCard key={i} tone="subtle" padding="md" className="space-y-2">
              <h4 className="font-display text-[14px] font-bold text-[var(--text)]">
                {faq.q}
              </h4>
              <p className="font-ui text-[12px] text-[var(--text-2)] leading-relaxed">
                {faq.a}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
