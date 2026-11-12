"use client";

import { useState } from "react";
import { ArrowRight, Calculator, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { playClickSound } from "../../lib/soundFX";

export default function RoyaltyCalculator() {
  const [streams, setStreams] = useState<number>(500000);

  // Average streaming payout in Russian & CIS markets per stream (~0.24 ₽)
  const avgPayoutPerStream = 0.24;
  const grossRevenue = streams * avgPayoutPerStream;

  // CXRNER model: 70% to Artist
  const cxrnerPayout = Math.round(grossRevenue * 0.7);

  // Traditional Major Label model: ~18% to Artist after recoupment
  const majorPayout = Math.round(grossRevenue * 0.18);

  // Net benefit
  const difference = cxrnerPayout - majorPayout;

  const presets = [
    { label: "100K", value: 100000 },
    { label: "500K", value: 500000 },
    { label: "1M", value: 1000000 },
    { label: "2.5M", value: 2500000 },
    { label: "5M", value: 5000000 },
  ];

  const formatRub = (num: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  return (
    <div className="relative rounded-3xl border border-[#B46BFF]/35 bg-[#090611]/85 backdrop-blur-2xl p-6 sm:p-10 lg:p-12 shadow-[0_0_90px_rgba(135,55,255,0.2)] overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8737FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-[10px] uppercase tracking-[0.22em] text-[#D9D9E2]">
              <Calculator className="w-3 h-3 text-[#B46BFF]" />
              <span>[05.B] ИНТЕРАКТИВНЫЙ РОЯЛТИ-СИМУЛЯТОР</span>
            </div>
            <h3 className="font-heavy text-3xl sm:text-4xl uppercase tracking-tight text-white">
              Рассчитайте ваш доход на CXRNER
            </h3>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Сравните прозрачную модель 70/30 с традиционными мейджор-лейблами (15–20%).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#00F0FF]">
              70% ВАШИ / 30% ЛЕЙБЛ
            </span>
          </div>
        </div>

        {/* Streams Slider Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#D9D9E2]/70">
              Ежемесячные прослушивания на всех витринах:
            </span>
            <span className="font-heavy text-2xl sm:text-3xl text-white tracking-tight">
              {formatNumber(streams)}{" "}
              <span className="font-mono text-xs text-[#B46BFF] uppercase tracking-widest">
                стримов
              </span>
            </span>
          </div>

          <div className="relative pt-1">
            <input
              type="range"
              min="25000"
              max="5000000"
              step="25000"
              value={streams}
              onChange={(e) => {
                setStreams(Number(e.target.value));
              }}
              className="w-full h-2.5 bg-[#160B28] rounded-lg appearance-none cursor-pointer accent-[#B46BFF] hover:accent-white transition"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/50 mr-2">
              Быстрый выбор:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setStreams(preset.value);
                  playClickSound();
                }}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition ${
                  streams === preset.value
                    ? "bg-[#8737FF] text-white shadow-[0_0_15px_#8737FF]"
                    : "bg-white/5 border border-white/10 text-[#D9D9E2]/70 hover:bg-white/10"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {/* CXRNER Card (Highlighted) */}
          <div className="relative p-6 sm:p-7 rounded-2xl border-2 border-[#B46BFF] bg-gradient-to-br from-[#8737FF]/20 via-[#160B28]/60 to-[#050407]/80 shadow-[0_0_40px_rgba(135,55,255,0.3)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8737FF] font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(135,55,255,0.6)]">
                <Sparkles className="w-3 h-3" />
                CXRNER MUSIC (70%)
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00F0FF]">
                ЧЕСТНЫЙ СПЛИТ
              </span>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#D9D9E2]/70 mb-1">
                Ваша выплата артиста:
              </p>
              <p className="font-heavy text-4xl sm:text-5xl text-white tracking-tight leading-none">
                {formatRub(cxrnerPayout)}
              </p>
              <p className="font-mono text-[10px] text-[#00F0FF] mt-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                + {formatRub(difference)} больше, чем на обычном лейбле
              </p>
            </div>

            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#8737FF] via-[#B46BFF] to-[#00F0FF] h-full rounded-full transition-all duration-300"
                style={{ width: "70%" }}
              />
            </div>
          </div>

          {/* Traditional Major Label Card */}
          <div className="p-6 sm:p-7 rounded-2xl border border-white/10 bg-[#090611]/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/60">
                Обычный мейджор-лейбл (18%)
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                КАБАЛЬНЫЙ КОНТРАКТ
              </span>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#D9D9E2]/50 mb-1">
                Выплата артиста:
              </p>
              <p className="font-heavy text-4xl sm:text-5xl text-[#D9D9E2]/50 tracking-tight leading-none">
                {formatRub(majorPayout)}
              </p>
              <p className="font-mono text-[10px] text-white/40 mt-2">
                До 82% забирает лейбл и дистрибьютор
              </p>
            </div>

            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-white/30 h-full rounded-full transition-all duration-300"
                style={{ width: "18%" }}
              />
            </div>
          </div>
        </div>

        {/* Benefits checklist & CTA */}
        <div className="pt-4 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] text-[#D9D9E2]/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
              <span>Все мастер-права остаются у артиста</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
              <span>Ежеквартальные прозрачные отчеты</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
              <span>Питчинг в редакции Яндекс, VK и Spotify</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
              <span>Вывод средств без скрытых комиссий</span>
            </div>
          </div>

          <Link
            href="/submit-release"
            className="btn-energy px-8 py-4 rounded-full font-mono text-xs uppercase tracking-[0.2em] font-bold inline-flex items-center justify-center gap-3 whitespace-nowrap shadow-[0_0_30px_rgba(135,55,255,0.4)]"
          >
            <span>Зафиксировать 70/30</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
