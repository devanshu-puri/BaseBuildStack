import React from "react";
import Link from "next/link";
import SpecularButton from "./specular-button";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon-glass" | "cta" | "specular";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  href?: string;
  as?: React.ElementType;
  tint?: string;
  glow?: number;
  intensity?: number;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghost: "btn--ghost",
  "icon-glass": "btn--icon-glass",
  cta: "btn--primary btn--cta",
  specular: "btn--specular",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3.5 text-[13px] py-1",
  md: "min-h-[44px] px-5 text-[14px] py-2",
  lg: "min-h-[52px] px-7 text-[15px] py-3",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      href,
      className = "",
      children,
      tint,
      glow,
      intensity,
      type = "button",
      ...props
    },
    ref
  ) => {
    // For primary and cta, render the glassy opaque SpecularButton with dynamic specular edge
    if (variant === "primary" || variant === "cta" || variant === "specular") {
      return (
        <SpecularButton
          ref={ref as unknown as React.ForwardedRef<HTMLButtonElement & HTMLAnchorElement>}
          size={size}
          href={href}
          loading={loading}
          disabled={disabled}
          icon={icon}
          iconPosition={iconPosition}
          className={className}
          tint={tint || "#ffffff"}
          tintOpacity={0.08}
          blur={16}
          textColor="#f5f5f5"
          lineColor="#ffffff"
          baseColor="rgba(255, 255, 255, 0.22)"
          glow={glow ?? 1}
          intensity={intensity ?? 1}
          type={type as "button" | "submit" | "reset"}
          {...props}
        >
          {children}
        </SpecularButton>
      );
    }

    const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.secondary;
    const sizeClass = variant === "icon-glass" ? "" : SIZE_CLASSES[size];
    const isDisabled = disabled || loading;

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === "left" && (
          <span className="inline-flex shrink-0 items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === "right" && (
          <span className="inline-flex shrink-0 items-center justify-center ml-1" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );

    if (href && !isDisabled) {
      return (
        <Link
          href={href}
          className={`btn ${variantClass} ${sizeClass} ${className}`}
          role="button"
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`btn ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
