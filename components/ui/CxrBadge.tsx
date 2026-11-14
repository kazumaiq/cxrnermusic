"use client";

import React from "react";

export type CxrBadgeTone =
  | "chrome"
  | "violet"
  | "cyan"
  | "emerald"
  | "amber"
  | "red"
  | "gold"
  | "neutral";

interface CxrBadgeProps {
  tone?: CxrBadgeTone;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

const TONE_MAP: Record<CxrBadgeTone, string> = {
  chrome: "bg-white/10 text-[#F4F4F8] border-white/25",
  violet: "bg-[#8737FF]/18 text-[#C792FF] border-[#B46BFF]/45 shadow-[0_0_16px_rgba(135,55,255,0.2)]",
  cyan: "bg-[#00F0FF]/12 text-[#70F8FF] border-[#00F0FF]/40 shadow-[0_0_14px_rgba(0,240,255,0.16)]",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  red: "bg-red-500/15 text-red-300 border-red-500/40",
  gold: "bg-yellow-500/18 text-yellow-200 border-yellow-400/50 shadow-[0_0_18px_rgba(250,204,21,0.22)]",
  neutral: "bg-white/[0.04] text-[#D9D9E2]/75 border-white/12",
};

const DOT_MAP: Record<CxrBadgeTone, string> = {
  chrome: "bg-white",
  violet: "bg-[#B46BFF]",
  cyan: "bg-[#00F0FF]",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
  gold: "bg-yellow-400",
  neutral: "bg-white/50",
};

export function CxrBadge({
  tone = "neutral",
  pulse = false,
  className = "",
  children,
}: CxrBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${TONE_MAP[tone]} ${className}`}
    >
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${DOT_MAP[tone]}`} />
      )}
      {children}
    </span>
  );
}
