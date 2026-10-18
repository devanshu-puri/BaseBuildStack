"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PricingModal } from "./pricing-modal";

interface PricingContextValue {
  openPricingModal: (initialMessage?: string) => void;
  closePricingModal: () => void;
  isPricingModalOpen: boolean;
  isPro: boolean;
  plan: string;
  streak: number;
  longestStreak: number;
  dueSrsCount: number;
  totalXp: number;
  accuracy: number;
  drillsDone: number;
  completed: { m1: number; m2: number; m3: number; m4: number };
  refreshEntitlements: () => Promise<void>;
}

const PricingContext = createContext<PricingContextValue | undefined>(undefined);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | undefined>(undefined);
  const [isPro, setIsPro] = useState(false);
  const [plan, setPlan] = useState("free");
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [dueSrsCount, setDueSrsCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [drillsDone, setDrillsDone] = useState(0);
  const [completed, setCompleted] = useState({ m1: 0, m2: 0, m3: 0, m4: 0 });

  const refreshEntitlements = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.entitlements) {
          setIsPro(Boolean(data.entitlements.isPro));
          setPlan(data.entitlements.plan || "free");
        }
        if (typeof data?.streak === "number") {
          setStreak(data.streak);
        }
        if (typeof data?.longestStreak === "number") {
          setLongestStreak(data.longestStreak);
        }
        if (typeof data?.dueSrsCount === "number") {
          setDueSrsCount(data.dueSrsCount);
        }
        if (typeof data?.totalXp === "number") {
          setTotalXp(data.totalXp);
        }
        if (typeof data?.accuracy === "number") {
          setAccuracy(data.accuracy);
        }
        if (typeof data?.drillsDone === "number") {
          setDrillsDone(data.drillsDone);
        }
        if (data?.completed) {
          setCompleted({
            m1: Number(data.completed.m1) || 0,
            m2: Number(data.completed.m2) || 0,
            m3: Number(data.completed.m3) || 0,
            m4: Number(data.completed.m4) || 0,
          });
        }
      }
    } catch {
      // non-blocking fallback
    }
  }, []);

  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  const openPricingModal = useCallback((initialMessage?: string) => {
    setCustomMessage(initialMessage);
    setIsOpen(true);
  }, []);

  const closePricingModal = useCallback(() => {
    setIsOpen(false);
    setCustomMessage(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsPro(true);
    setPlan("pro");
    refreshEntitlements();
  }, [refreshEntitlements]);

  return (
    <PricingContext.Provider
      value={{
        openPricingModal,
        closePricingModal,
        isPricingModalOpen: isOpen,
        isPro,
        plan,
        streak,
        longestStreak,
        dueSrsCount,
        totalXp,
        accuracy,
        drillsDone,
        completed,
        refreshEntitlements,
      }}
    >
      {children}
      <PricingModal
        open={isOpen}
        onClose={closePricingModal}
        onSuccess={handleSuccess}
        initialMessage={customMessage}
        alreadyPro={isPro}
      />
    </PricingContext.Provider>
  );
}

export function usePricingModal(): PricingContextValue {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error("usePricingModal must be used within a PricingProvider");
  }
  return context;
}
