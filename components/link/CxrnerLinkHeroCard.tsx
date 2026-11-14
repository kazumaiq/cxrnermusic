"use client";

import Link from "next/link";
import { ArrowUpRight, Radio, Sparkles, BarChart3, Zap, ShieldCheck } from "lucide-react";

interface CxrnerLinkHeroCardProps {
  activeCount?: number;
}

export default function CxrnerLinkHeroCard({ activeCount = 0 }: CxrnerLinkHeroCardProps) {
  return (
    <div className="cxr-panel-chrome rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-300 hover:border-white/30">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Side */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>SMART ROUTING STUDIO</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#D9D9E2]/55">
              PRE-SAVE · UPC LOOKUP · ANALYTICS
            </span>
          </div>

          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-white">
              CXRNER <span className="text-[#00F0FF]">LINK</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#D9D9E2]/75 font-sans leading-relaxed">
              Соберите умную страницу релиза за 30 секунд: автозагрузка обложки по UPC,
              Pre-save таймер, 7 тем конструктора и детальная аналитика переходов.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-[#D9D9E2]/80">
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>UPC Поиск</span>
            </div>
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
              <span>Pre-save</span>
            </div>
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CTR Отчеты</span>
            </div>
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>150+ DSP</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard/links/new"
              className="btn-void-primary px-6 py-3 text-[11px]"
            >
              <Zap className="w-3.5 h-3.5 text-[#8737FF]" />
              <span>Создать Smart Link</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/dashboard/links"
              className="btn-void-ghost px-6 py-3 text-[11px]"
            >
              <span>Мои ссылки ({activeCount})</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Live Active Link Telemetry Summary */}
        <div className="lg:w-64 p-5 rounded-2xl bg-[#040307]/90 border border-white/12 flex flex-col justify-between gap-4 shrink-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D9D9E2]/55">
            АКТИВНЫХ СТРАНИЦ
          </div>
          <div className="font-display font-black text-4xl sm:text-5xl text-white tabular-nums">
            {activeCount}
          </div>
          <Link
            href="/dashboard/links"
            className="font-mono text-[11px] text-[#00F0FF] hover:underline inline-flex items-center gap-1"
          >
            <span>Открыть менеджер</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
