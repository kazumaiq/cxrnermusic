"use client";

import Link from "next/link";
import { ArrowRight, Box, Sparkles } from "lucide-react";

export default function CxrnerDropHeroCard() {
  return (
    <Link
      href="/drop"
      className="group relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#120C1E]/95 to-[#06040A]/95 border border-[#B46BFF]/35 hover:border-[#B46BFF]/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_40px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#8737FF]/20 blur-2xl group-hover:bg-[#8737FF]/35 transition-colors" />

      <div className="relative z-10 flex items-center gap-3.5 min-w-0">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/15 bg-[#08050E] shrink-0">
          <img
            src="/drop/items/specimen_void_crown_17.jpg"
            alt="CXRNER DROP"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B46BFF] shadow-[0_0_8px_#B46BFF]" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-sm text-white uppercase tracking-wide">
              CXRNER DROP
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#8737FF] text-[8px] font-mono font-bold text-white uppercase">
              ARCHIVE
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#D9D9E2]/60 truncate">
            Вскрывай кейсы · 15 артефактов &amp; CXP
          </p>
        </div>
      </div>

      <div className="relative z-10 w-8 h-8 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center text-white group-hover:bg-[#8737FF] group-hover:border-[#B46BFF] transition-all shrink-0">
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
