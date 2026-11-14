"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Boxes, ShieldAlert, Award } from "lucide-react";

export default function CxrnerDropHeroCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#B46BFF]/45 bg-[#07050d] p-5 sm:p-7 shadow-[0_0_50px_rgba(135,55,255,0.22)] transition-all duration-500 hover:border-[#B46BFF]/75 hover:shadow-[0_0_70px_rgba(135,55,255,0.35)] group">
      {/* Background ambient cosmic rays & gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-br from-[#8737FF]/30 via-[#EC4899]/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-[#00F0FF]/20 via-[#8737FF]/15 to-transparent blur-3xl" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Brand, Badges, Content */}
        <div className="space-y-3.5 max-w-xl">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#B46BFF]/50 bg-[#8737FF]/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9D9E2] shadow-[0_0_12px_rgba(180,107,255,0.35)]">
              <Boxes className="h-3 w-3 text-[#B46BFF] animate-pulse" />
              <span>CXRNER DROP</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-2.5 w-2.5 text-[#00F0FF]" />
              <span>SPECIMEN ARCHIVE</span>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] bg-gradient-to-r from-[#8737FF] to-[#00F0FF] text-white font-black tracking-wider shadow-[0_0_10px_#8737FF]">
              BROWSER GAME
            </span>
          </div>

          {/* Heavy Headline */}
          <div>
            <h3 className="font-display font-black text-xl sm:text-2xl md:text-3xl uppercase tracking-tight text-white leading-tight">
              <span className="bg-gradient-to-r from-white via-[#EAD5FF] to-[#B46BFF] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(180,107,255,0.45)]">
                CXRNER DROP // SPECIMEN ARCHIVE
              </span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#D9D9E2]/85 font-sans leading-relaxed">
              Открывай запечатанные кейсы, находи редкие артефакты, собирай собственную коллекцию и получай эксклюзивные награды CXRNER MUSIC.
            </p>
          </div>

          {/* Features Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-sans text-xs font-semibold text-[#D9D9E2]/85">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
              <span>25+ Артефактов</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B46BFF]" />
              <span>5 Тиров редкости</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10 col-span-2 sm:col-span-1">
              <Award className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Cover Voucher 0.1%</span>
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              href="/drop"
              className="btn-energy group/btn relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_30px_rgba(135,55,255,0.45)] hover:shadow-[0_0_45px_rgba(135,55,255,0.65)] active:scale-95 transition"
            >
              <Boxes className="w-4 h-4 text-[#00F0FF] group-hover/btn:rotate-12 transition-transform" />
              <span>ENTER DROP →</span>
            </Link>

            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D9D9E2]/60">
              COLLECT. DISCOVER. OWN.
            </span>
          </div>
        </div>

        {/* Right Side: Visual 3D Miniature Preview */}
        <div className="relative shrink-0 w-36 sm:w-44 md:w-52 aspect-[3/4] mx-auto md:mx-0 rounded-2xl overflow-hidden border border-[#B46BFF]/40 bg-gradient-to-b from-[#160B28] to-[#05030A] p-2 flex items-center justify-center shadow-[0_0_30px_rgba(135,55,255,0.3)] group-hover:scale-105 transition-transform duration-500">
          <img
            src="/drop/cases/case_001_archive.svg"
            alt="CXRNER DROP Sealed Case"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          />
          {/* Holographic light sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
