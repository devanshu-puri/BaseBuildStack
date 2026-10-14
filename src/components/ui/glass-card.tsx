import React from "react";

export type GlassTone = "default" | "subtle" | "strong" | "solid" | "aurora";
export type GlassPadding = "none" | "sm" | "md" | "lg";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: GlassTone;
  tint?: "m1" | "m2" | "m3" | "m4" | string;
  padding?: GlassPadding;
  interactive?: boolean;
  bezel?: boolean;
  as?: React.ElementType;
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<GlassTone, string> = {
  default: "glass",
  subtle: "glass glass--subtle",
  strong: "glass glass--strong",
  solid: "glass glass--solid",
  aurora: "aurora-card",
};

const PADDING_CLASSES: Record<GlassPadding, string> = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6 md:p-7",
};

const TINT_STYLES: Record<string, React.CSSProperties> = {
  m1: { "--tint": "var(--aurora-violet)" } as React.CSSProperties,
  m2: { "--tint": "var(--state-running)" } as React.CSSProperties,
  m3: { "--tint": "var(--aurora-azure)" } as React.CSSProperties,
  m4: { "--tint": "var(--aurora-mint)" } as React.CSSProperties,
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      tone = "default",
      tint,
      padding = "md",
      interactive = false,
      bezel = false,
      as: Component = "div",
      className = "",
      style,
      children,
      ...props
    },
    ref
  ) => {
    const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.default;
    const paddingClass = PADDING_CLASSES[padding];
    const interactiveClass = interactive ? "glass--interactive cursor-pointer" : "";
    const tintStyle = tint && TINT_STYLES[tint] ? TINT_STYLES[tint] : undefined;

    const cardContent = (
      <Component
        ref={ref}
        className={`${toneClass} ${paddingClass} ${interactiveClass} ${className}`}
        style={{ ...tintStyle, ...style }}
        {...props}
      >
        {children}
      </Component>
    );

    if (bezel) {
      return <div className="bezel">{cardContent}</div>;
    }

    return cardContent;
  }
);

GlassCard.displayName = "GlassCard";
