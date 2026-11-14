"use client";

import React from "react";

export type CxrSurfaceVariant = "obsidian" | "panel" | "chrome" | "elevated";

interface CxrSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CxrSurfaceVariant;
  accent?: "none" | "violet" | "cyan" | "emerald" | "amber" | "gold";
  interactive?: boolean;
  topHairline?: boolean;
}

const ACCENT_RIM: Record<NonNullable<CxrSurfaceProps["accent"]>, string> = {
  none: "",
  violet: "hover:border-[#B46BFF]/45",
  cyan: "hover:border-[#00F0FF]/45",
  emerald: "hover:border-emerald-400/45",
  amber: "hover:border-amber-400/45",
  gold: "hover:border-yellow-400/50",
};

const TOP_LINE_BG: Record<NonNullable<CxrSurfaceProps["accent"]>, string> = {
  none: "via-white/25",
  violet: "via-[#B46BFF]/75",
  cyan: "via-[#00F0FF]/75",
  emerald: "via-emerald-400/75",
  amber: "via-amber-400/75",
  gold: "via-yellow-400/85",
};

export function CxrSurface({
  variant = "panel",
  accent = "none",
  interactive = false,
  topHairline = true,
  className = "",
  children,
  ...rest
}: CxrSurfaceProps) {
  const variantCls =
    variant === "chrome"
      ? "cxr-panel-chrome"
      : variant === "obsidian"
      ? "cxr-panel-obsidian"
      : variant === "elevated"
      ? "bg-[#110E19]/95 border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      : "cxr-panel";

  const interactiveCls = interactive
    ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_72px_rgba(0,0,0,0.85)]"
    : "";

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${variantCls} ${ACCENT_RIM[accent]} ${interactiveCls} ${className}`}
      {...rest}
    >
      {topHairline && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${TOP_LINE_BG[accent]} to-transparent`}
        />
      )}
      {children}
    </div>
  );
}
