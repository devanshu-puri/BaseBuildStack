import React from "react";
import { GlassCard, GlassCardProps, GlassTone } from "./glass-card";

export type CardTone = "default" | "subtle" | "accent" | "good" | "bad" | "strong" | "solid" | "aurora";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends Omit<GlassCardProps, "tone"> {
  tone?: CardTone;
}

/**
 * Card primitive updated for Aurora Glass design system.
 * Transparently delegates to GlassCard while mapping legacy tones.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ tone = "default", className = "", children, ...props }, ref) => {
    let glassTone: GlassTone = "default";
    let extraClasses = "";

    if (tone === "subtle") glassTone = "subtle";
    else if (tone === "strong") glassTone = "strong";
    else if (tone === "solid") glassTone = "solid";
    else if (tone === "aurora") glassTone = "aurora";
    else if (tone === "accent") {
      glassTone = "default";
      extraClasses = "rim";
    } else if (tone === "good") {
      glassTone = "default";
      extraClasses = "rim rim--good";
    } else if (tone === "bad") {
      glassTone = "default";
      extraClasses = "rim rim--bad";
    }

    return (
      <GlassCard
        ref={ref}
        tone={glassTone}
        className={`${extraClasses} ${className}`}
        {...props}
      >
        {children}
      </GlassCard>
    );
  }
);

Card.displayName = "Card";

export { GlassCard };
