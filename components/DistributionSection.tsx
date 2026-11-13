"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Radio } from "lucide-react";
import { services } from "../data/site";
import { setUniverseTargetNode } from "../lib/universeBridge";
import { playClickSound, playHoverSound } from "../lib/soundFX";

const PIPELINE = [
  {
    code: "01",
    phase: "INGESTION",
    title: "Подача заявки",
    metric: "2 минуты",
    detail:
      "Заполните анкету на сайте или отправьте материалы через официального Telegram-бота. Прикрепите WAV/FLAC, обложку 3000×3000 и скриншот DAW.",
  },
  {
    code: "02",
    phase: "A&R_MODERATION",
    title: "Модерация и контроль",
    metric: "24–72 часа",
    detail:
      "Команда проверяет сведение, мастеринг, чистоту прав и соответствие техническим стандартам витрин. Отслеживайте статус в реальном времени.",
  },
  {
    code: "03",
    phase: "GLOBAL_DELIVERY",
    title: "Отгрузка на 150+ DSP",
    metric: "от 12 часов",
    detail:
      "Присваиваем официальные коды UPC и ISRC. Трек доставляется в Яндекс Музыку, VK Музыку, Spotify, Apple Music, TikTok, YouTube Music и на все мировые площадки.",
  },
  {
    code: "04",
    phase: "PITCHING_&_GROWTH",
    title: "Питчинг и промо",
    metric: "за 3–4 недели",
    detail:
      "При заблаговременной подаче отправляем релиз редакторам Яндекс Музыки, VK Музыки и Звука, подключаем Content ID и библиотеку TikTok.",
  },
  {
    code: "05",
    phase: "ROYALTY_SPLIT",
    title: "Выплаты 70/30",
    metric: "Ежеквартально",
    detail:
      "70% чистого дохода остаётся у артиста. Прозрачные отчёты и регулярные выплаты по графику: 15 марта, 15 июня, 15 сентября и 15 декабря.",
  },
];

const DSP_NETWORK = [
  "Яндекс Музыка",
  "VK Музыка",
  "Spotify",
  "Apple Music",
  "Звук",
  "YouTube Music",
  "TikTok",
  "Deezer",
  "Shazam",
  "Amazon Music",
  "Tidal",
  "150+ ПЛАТФОРМ",
];

export default function DistributionSection() {
  const [activeStage, setActiveStage] = useState(0);
  const current = PIPELINE[activeStage];

  return (
    <div className="space-y-12">
      {/* Interactive Pipeline Console synced visually with the 3D Network Constellation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left: Interactive Stage Selector List */}
        <div className="lg:col-span-6 space-y-2.5">
          {PIPELINE.map((item, idx) => {
            const isActive = idx === activeStage;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setActiveStage(idx);
                  setUniverseTargetNode(idx * 4 + 2);
                  playClickSound();
                }}
                onMouseEnter={() => {
                  setActiveStage(idx);
                  setUniverseTargetNode(idx * 4 + 2);
                  playHoverSound();
                }}
                onMouseLeave={() => setUniverseTargetNode(-1)}
                data-cursor={`STEP ${item.code}`}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                  isActive
                    ? "border-[#B46BFF]/70 bg-[#160B28]/75 shadow-[0_0_32px_rgba(135,55,255,0.22)]"
                    : "border-white/10 bg-[#090611]/55 hover:border-white/25 hover:bg-[#090611]/85"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold tracking-widest ${
                      isActive ? "text-[#B46BFF]" : "text-[#D9D9E2]/45"
                    }`}
                  >
                    {item.code}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#D9D9E2]/45">
                      {item.phase}
                    </p>
                    <h3 className="font-heavy text-xl sm:text-2xl text-white uppercase tracking-wide truncate">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <span
                  className={`flex-shrink-0 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider border ${
                    isActive
                      ? "bg-[#8737FF] border-[#B46BFF] text-white"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/70"
                  }`}
                >
                  {item.metric}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Active Stage Architectural Telemetry Display */}
        <div className="lg:col-span-6 rounded-3xl border border-[#D9D9E2]/15 bg-[#090611]/75 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#8737FF]/20 blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B46BFF]">
                // NODE_{current.code} · {current.phase}
              </span>
              <span className="font-mono text-xs text-white px-3 py-1 rounded-full border border-white/15 bg-white/5">
                {current.metric}
              </span>
            </div>

            <div className="font-heavy text-7xl sm:text-8xl text-outline-chrome leading-none select-none">
              {current.code}
            </div>

            <div className="space-y-3">
              <h4 className="font-heavy text-3xl sm:text-4xl text-white uppercase tracking-tight">
                {current.title}
              </h4>
              <p className="text-sm sm:text-base text-[#D9D9E2]/80 leading-relaxed">
                {current.detail}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#B46BFF]">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Глобальная сеть доставки // наведите на платформу</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DSP_NETWORK.map((dsp, dIdx) => (
                <button
                  key={dsp}
                  type="button"
                  onMouseEnter={() => {
                    setUniverseTargetNode((dIdx * 2 + 1) % 24);
                    playHoverSound();
                  }}
                  onMouseLeave={() => setUniverseTargetNode(-1)}
                  data-cursor="DSP"
                  className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] hover:bg-[#8737FF]/25 hover:border-[#B46BFF]/60 hover:text-white font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/75 transition-all duration-200"
                >
                  {dsp}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/submit-release"
                data-cursor="SUBMIT"
                className="btn-energy px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest"
              >
                <span>Запустить релиз</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/offer"
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 hover:text-white transition px-3 py-2"
              >
                <span>Условия оферты 70/30</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Label Services Matrix (Minimal Architectural Strip, NOT generic cards) */}
      <div className="rounded-3xl border border-white/10 bg-[#050407]/70 backdrop-blur-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B46BFF]">
            // FULL-CYCLE INFRASTRUCTURE
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]/50">
            6 КЛЮЧЕВЫХ НАПРАВЛЕНИЙ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {services.map((srv, i) => (
            <div
              key={srv.title}
              className="p-6 hover:bg-[#160B28]/40 transition duration-300 border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#B46BFF] tracking-widest">
                  0{i + 1}
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#D9D9E2]/45" />
              </div>
              <h4 className="font-heavy text-2xl text-white uppercase tracking-wide mb-2">
                {srv.title}
              </h4>
              <p className="text-xs sm:text-sm text-[#D9D9E2]/70 leading-relaxed">
                {srv.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
