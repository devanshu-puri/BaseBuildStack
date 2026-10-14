"use client";

import React, { useState } from "react";
import { Chip } from "./chip";

export interface CodeBlockProps {
  code: string;
  lang?: string;
  highlightLines?: number[];
  selectableLines?: boolean;
  selectedLine?: number;
  onSelectLine?: (lineNum: number) => void;
  className?: string;
}

export function CodeBlock({
  code,
  lang = "typescript",
  highlightLines = [],
  selectableLines = false,
  selectedLine,
  onSelectLine,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");

  const lines = code.trim().split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const decreaseFont = () => {
    if (fontSize === "lg") setFontSize("md");
    else if (fontSize === "md") setFontSize("sm");
  };

  const increaseFont = () => {
    if (fontSize === "sm") setFontSize("md");
    else if (fontSize === "md") setFontSize("lg");
  };

  const fontClasses = {
    sm: "text-[11px] leading-5",
    md: "text-[12px] sm:text-[13px] leading-6",
    lg: "text-[14px] sm:text-[15px] leading-7",
  }[fontSize];

  return (
    <div
      className={`rounded-[20px] overflow-hidden border border-[var(--border)] bg-[#0B0D17] text-[#F4F5FB] shadow-[0_16px_40px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Top Header Controls: Always dark glass */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.03] text-[11px] font-mono text-[#8A90AA]">
        <Chip k="LANG" v={lang} tone="default" className="bg-white/5 border-white/10 text-white" />

        <div className="flex items-center gap-2">
          {/* Font Resize A- / A+ */}
          <div className="flex items-center border border-white/10 rounded-[8px] overflow-hidden bg-white/5">
            <button
              type="button"
              onClick={decreaseFont}
              aria-label="Decrease font size"
              className="px-2.5 py-1 hover:bg-white/10 text-[#B4B8CC] hover:text-white transition-colors cursor-pointer"
            >
              A−
            </button>
            <div className="w-[1px] h-3 bg-white/10" />
            <button
              type="button"
              onClick={increaseFont}
              aria-label="Increase font size"
              className="px-2.5 py-1 hover:bg-white/10 text-[#B4B8CC] hover:text-white transition-colors cursor-pointer"
            >
              A+
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            className="px-3 py-1 rounded-[8px] border border-white/10 bg-white/5 text-[#B4B8CC] hover:text-white hover:border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copied ? (
              <span className="text-[#6EE7B7] font-semibold">Copied! ✓</span>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>
      </div>

      {/* Code Lines Container: Syntax Palette always-dark */}
      <div className="overflow-x-auto p-3 sm:p-4 font-mono">
        <pre className={fontClasses}>
          <code>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightLines.includes(lineNum);
              const isSelected = selectedLine === lineNum;

              return (
                <div
                  key={lineNum}
                  onClick={() => selectableLines && onSelectLine?.(lineNum)}
                  className={`flex items-center gap-3.5 px-2.5 py-0.5 rounded-[6px] transition-colors ${
                    selectableLines
                      ? "cursor-pointer min-h-[44px] sm:min-h-[28px] hover:bg-white/5"
                      : "min-h-[24px]"
                  } ${
                    isSelected
                      ? "bg-[rgba(94,78,240,0.18)] border-l-2 border-[#5E4EF0] text-white shadow-[inset_0_0_12px_rgba(94,78,240,0.2)]"
                      : isHighlighted
                      ? "bg-[rgba(255,107,107,0.18)] border-l-2 border-[#FF6B6B] text-[#FF8A8A]"
                      : ""
                  }`}
                >
                  <span className="w-8 shrink-0 text-right select-none text-[#8A90AA] text-[11px] font-mono opacity-50">
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre text-[#F4F5FB]">{line || " "}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
