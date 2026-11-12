"use client";

import Link from "next/link";
import { ArrowUpRight, Radio, Sparkles, Disc, BarChart3, Zap, ShieldCheck } from "lucide-react";

interface CxrnerLinkHeroCardProps {
  activeCount?: number;
}

export default function CxrnerLinkHeroCard({ activeCount = 0 }: CxrnerLinkHeroCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#B46BFF]/30 bg-[#07050d] p-6 sm:p-8 md:p-10 shadow-[0_0_60px_rgba(135,55,255,0.18)] transition-all duration-500 hover:border-[#B46BFF]/60 hover:shadow-[0_0_80px_rgba(135,55,255,0.28)]">
      {/* Background ambient cosmic rays & gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#8737FF]/25 via-[#FF0077]/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-[#00F0FF]/15 via-[#8737FF]/10 to-transparent blur-3xl" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Side: Brand, Equalizer, Content */}
        <div className="space-y-5 max-w-2xl">
          {/* Header Badges & Audio Spectrum */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>LIVE SMART ROUTING</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#B46BFF]">
              <Sparkles className="h-3 w-3" />
              <span>PRE-SAVE &amp; MULTI-LINK</span>
            </div>

            {/* Simulated Live Audio Equalizer Bars */}
            <div className="hidden sm:flex items-end gap-1 h-4 px-2 py-0.5 rounded-full bg-black/50 border border-white/10">
              <span className="w-1 bg-[#00F0FF] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-[#8737FF] rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-4" />
              <span className="w-1 bg-[#FF2E93] rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2" />
              <span className="w-1 bg-[#00F0FF] rounded-full animate-[pulse_1.4s_ease-in-out_infinite] h-3.5" />
              <span className="w-1 bg-[#B46BFF] rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2.5" />
            </div>
          </div>

          {/* Heavy Headline */}
          <div>
            <h2 className="font-heavy text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white leading-none">
              <span className="bg-gradient-to-r from-white via-[#EAD5FF] to-[#B46BFF] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(180,107,255,0.4)]">
                CXRNER LINK™
              </span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-[#D9D9E2]/80 font-sans leading-relaxed">
              Музыкальные смарт-страницы в стиле <span className="text-white font-semibold">STMPD RCRDS</span> и <span className="text-white font-semibold">Narvent</span>. Автопоиск по UPC, динамический обратный отсчёт до секунды выхода и раздельная аналитика нажатия каждой кнопки для артиста.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/70">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
              <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>UPC Автопоиск</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
              <span>Pre-save таймер</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
              <BarChart3 className="w-3.5 h-3.5 text-[#FF2E93]" />
              <span>Клики кнопок</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>150+ Площадок</span>
            </div>
          </div>

          {/* High-conversion CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard/links/new"
              className="btn-energy group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-mono text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_30px_rgba(135,55,255,0.45)] hover:shadow-[0_0_45px_rgba(135,55,255,0.65)] active:scale-95 transition"
            >
              <Zap className="w-4 h-4 text-[#00F0FF] group-hover:rotate-12 transition-transform" />
              <span>Создать Smart Link</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/links"
              className="btn-void-ghost inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 bg-white/[0.04] font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition"
            >
              <span>Мои ссылки</span>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#8737FF] text-[10px] font-bold text-white shadow-sm">
                  {activeCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Right Side: 3D Holographic Vinyl & CD Visual */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex-shrink-0 group">
            {/* Spinning Holographic Vinyl Disc */}
            <div
              className="absolute inset-0 rounded-full border border-white/15 bg-gradient-to-tr from-[#050409] via-[#120B20] to-[#050409] shadow-[0_0_50px_rgba(135,55,255,0.35)] animate-[spin_18s_linear_infinite]"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(circle at center, #050407, #090611 2px, #050407 4px, #120B20 6px)",
              }}
            >
              {/* Iridescent light sheen across vinyl */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#8737FF]/20 to-[#00F0FF]/25 mix-blend-screen opacity-75" />
            </div>

            {/* Glowing Vinyl Center Label */}
            <div className="absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#B46BFF]/80 bg-gradient-to-br from-[#8737FF] via-[#160B28] to-black flex flex-col items-center justify-center p-2 text-center shadow-[0_0_25px_rgba(180,107,255,0.6)] z-10 group-hover:scale-105 transition duration-300">
              <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-[#00F0FF] animate-pulse" />
              <span className="font-heavy text-[8px] sm:text-[9px] uppercase tracking-widest text-white mt-1">
                CXRNER
              </span>
              <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-[#00F0FF]">
                LINK DSP
              </span>
            </div>

            {/* Outer orbit ring */}
            <div className="absolute -inset-3 rounded-full border border-[#00F0FF]/20 animate-pulse pointer-events-none" />
            <div className="absolute -inset-6 rounded-full border border-[#B46BFF]/10 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
