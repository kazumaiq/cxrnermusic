"use client";

import React from "react";
import { CxrSurface } from "./CxrSurface";

interface CxrStatBlockProps {
  index?: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "none" | "violet" | "cyan" | "emerald" | "amber" | "gold";
  icon?: React.ReactNode;
  className?: string;
}

export function CxrStatBlock({
  index,
  label,
  value,
  sub,
  accent = "violet",
  icon,
  className = "",
}: CxrStatBlockProps) {
  return (
    <CxrSurface variant="panel" accent={accent} interactive className={`p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {index && (
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#B46BFF]/85">
              // {index}
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#D9D9E2]/55">
            {label}
          </span>
        </div>
        {icon && <div className="text-[#D9D9E2]/70 shrink-0">{icon}</div>}
      </div>

      <div className="mt-3 font-display font-black text-2xl sm:text-3xl tracking-tight text-white tabular-nums">
        {value}
      </div>

      {sub && (
        <div className="mt-1.5 font-mono text-[10px] text-[#D9D9E2]/50 truncate">
          {sub}
        </div>
      )}
    </CxrSurface>
  );
}
