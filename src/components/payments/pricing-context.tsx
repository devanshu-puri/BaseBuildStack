"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PricingModal } from "./pricing-modal";

interface PricingContextValue {
  openPricingModal: (initialMessage?: string) => void;
  closePricingModal: () => void;
  isPricingModalOpen: boolean;
  isPro: boolean;
  plan: string;
  refreshEntitlements: () => Promise<void>;
}

const PricingContext = createContext<PricingContextValue | undefined>(undefined);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | undefined>(undefined);
  const [isPro, setIsPro] = useState(false);
  const [plan, setPlan] = useState("free");

  const refreshEntitlements = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.entitlements) {
          setIsPro(Boolean(data.entitlements.isPro));
          setPlan(data.entitlements.plan || "free");
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
