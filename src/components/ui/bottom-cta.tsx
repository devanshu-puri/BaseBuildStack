"use client";

import React from "react";
import { Button, ButtonVariant } from "./button";

export interface BottomCTAProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  floatingAboveDock?: boolean;
  className?: string;
}

export function BottomCTA({
  label,
  icon,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  floatingAboveDock = false,
  className = "",
}: BottomCTAProps) {
  const bottomPositionClass = floatingAboveDock
    ? "bottom-[calc(88px+env(safe-area-inset-bottom))]"
    : "bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))]";

  return (
    <div
      className={`fixed sm:sticky ${bottomPositionClass} left-0 right-0 sm:left-auto sm:right-auto z-40 p-4 sm:p-0 sm:pt-6 bg-[var(--bg-base)]/80 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-[var(--border)] sm:border-0 ${className}`}
    >
      <div className="max-w-[420px] mx-auto sm:ml-auto sm:mr-0">
        <Button
          variant={variant as ButtonVariant}
          size="lg"
          onClick={onClick}
          disabled={disabled}
          loading={loading}
          icon={icon}
          className="w-full shadow-[0_12px_36px_rgba(94,78,240,0.5)]"
        >
          {label}
        </Button>
      </div>
    </div>
  );
}
