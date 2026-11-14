"use client";

import React from "react";
import { playClickSound } from "@/lib/soundFX";

export interface CxrTabOption<T extends string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

interface CxrTabsProps<T extends string> {
  items: CxrTabOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export function CxrTabs<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: CxrTabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-full bg-[#0A0812]/90 border border-white/12 backdrop-blur-xl shadow-inner overflow-x-auto max-w-full no-scrollbar ${className}`}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (!active) {
                playClickSound();
                onChange(item.id);
              }
            }}
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer ${
              active
                ? "bg-white text-[#050407] shadow-[0_4px_18px_rgba(255,255,255,0.2)]"
                : "text-[#D9D9E2]/65 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  active ? "bg-[#050407]/15 text-[#050407]" : "bg-white/10 text-white/75"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
