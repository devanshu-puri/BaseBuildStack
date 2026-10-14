import React from "react";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<string, { outer: string; inner: string; font: string }> = {
  sm: { outer: "w-8 h-8 p-[2px]", inner: "w-full h-full", font: "text-[12px]" },
  md: { outer: "w-10 h-10 p-[2px]", inner: "w-full h-full", font: "text-[14px]" },
  lg: { outer: "w-12 h-12 p-[2.5px]", inner: "w-full h-full", font: "text-[16px]" },
};

export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeConfig = SIZES[size] || SIZES.md;
  const initial = name ? name.charAt(0).toUpperCase() : "U";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 ${sizeConfig.outer} ${className}`}
      style={{
        background:
          "conic-gradient(from 0deg, var(--aurora-violet), var(--aurora-azure), var(--aurora-mint), var(--aurora-rose), var(--aurora-violet))",
        boxShadow: "0 0 16px -2px rgba(43, 183, 255, 0.4)",
      }}
    >
      <div
        className={`rounded-full bg-[var(--surface-solid)] flex items-center justify-center overflow-hidden border border-[var(--border)] text-[var(--text)] font-mono font-bold ${sizeConfig.inner} ${sizeConfig.font}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </div>
    </div>
  );
}
