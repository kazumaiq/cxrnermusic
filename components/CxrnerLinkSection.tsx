"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Radio, Barcode, Clock, BarChart3, Palette, ExternalLink } from "lucide-react";
import { CxrSurface } from "./ui/CxrSurface";
import { CxrButton } from "./ui/CxrButton";
import { CxrBadge } from "./ui/CxrBadge";
import { PlatformLogo, getPlatformVisualMeta } from "./link/PlatformLogo";
import { playClickSound, playHoverSound } from "@/lib/soundFX";

const PREVIEW_THEMES = [
  { id: "CYBER", name: "Cyber Grid", accent: "#00F0FF", bg: "from-[#060913] via-[#0B0617] to-[#040307]" },
  { id: "CINEMATIC", name: "Cinematic", accent: "#B46BFF", bg: "from-[#12071F] via-[#07050C] to-[#040307]" },
  { id: "BRUTAL", name: "Brutal Chrome", accent: "#FFFFFF", bg: "from-[#17171B] via-[#0A0A0D] to-[#040307]" },
  { id: "SAKURA", name: "Sakura Night", accent: "#FF68B4", bg: "from-[#1C0A17] via-[#0A050B] to-[#040307]" },
];

const LINK_CAPABILITIES = [
  {
    code: "01",
    icon: Barcode,
    title: "UPC Автосборка за 30 сек",
    desc: "Введите штрихкод — обложка, метаданные и ссылки соберутся автоматически.",
  },
  {
    code: "02",
    icon: Clock,
    title: "Pre-save до премьеры",
    desc: "Таймер обратного отсчёта и сбор фанатской базы до старта продаж.",
  },
  {
    code: "03",
    icon: Palette,
    title: "7 авторских тем",
    desc: "Тонкая настройка акцентов, кнопок, размытия и типографики.",
  },
  {
    code: "04",
    icon: BarChart3,
    title: "Аналитика переходов",
    desc: "Живая воронка просмотров, CTR и кликов по каждой DSP-витрине.",
  },
];

export default function CxrnerLinkSection() {
  const [activeThemeIdx, setActiveThemeIdx] = useState(0);
  const currentTheme = PREVIEW_THEMES[activeThemeIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left: Architectural Copy & Feature Grid */}
      <div className="lg:col-span-7 space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <CxrBadge tone="cyan" pulse>
              SMART RELEASE ROUTING
            </CxrBadge>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#D9D9E2]/45">
              // SERVICE MODULE 01
            </span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-[0.98]">
            CXRNER <span className="text-chrome-gradient">LINK</span>
          </h2>

          <p className="text-sm sm:text-base text-[#D9D9E2]/75 max-w-xl leading-relaxed">
            Персональная страница для каждого релиза. Объединяйте Яндекс Музыку, VK,
            Spotify и Apple Music на одном экране с высокой конверсией и live-статистикой.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {LINK_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <CxrSurface
                key={cap.code}
                variant="obsidian"
                accent="cyan"
                interactive
                className="p-4 sm:p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/25 flex items-center justify-center text-[#00F0FF]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] text-white/35 tracking-widest">
                    /{cap.code}
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white">
                  {cap.title}
                </h3>
                <p className="text-xs text-[#D9D9E2]/60 leading-relaxed">{cap.desc}</p>
              </CxrSurface>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <CxrButton href="/dashboard/links/new" variant="cyan" size="md">
            <span>Создать Smart Link</span>
            <ArrowRight className="w-4 h-4" />
          </CxrButton>
          <CxrButton href="/link" variant="ghost" size="md">
            <span>Обзор сервиса</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </CxrButton>
        </div>
      </div>

      {/* Right: Interactive Obsidian Studio Phone Mockup */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <CxrSurface variant="chrome" className="w-full max-w-[360px] p-5 sm:p-6 space-y-5">
          {/* Interactive Theme Switcher Bar */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D9D9E2]/60 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#00F0FF]" />
              <span>PREVIEW</span>
            </span>
            <div className="flex items-center gap-1.5">
              {PREVIEW_THEMES.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setActiveThemeIdx(idx);
                  }}
                  onMouseEnter={() => playHoverSound()}
                  className={`px-2 py-1 rounded-md font-mono text-[9px] font-bold uppercase transition cursor-pointer ${
                    activeThemeIdx === idx
                      ? "bg-white text-[#050407]"
                      : "bg-white/[0.06] text-white/60 hover:text-white"
                  }`}
                >
                  {t.id}
                </button>
              ))}
            </div>
          </div>

          {/* Device Screen */}
          <div
            className={`relative rounded-2xl border border-white/15 bg-gradient-to-b ${currentTheme.bg} p-5 space-y-4 overflow-hidden shadow-inner`}
          >
            <div
              className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl opacity-35 transition-colors duration-500"
              style={{ backgroundColor: currentTheme.accent }}
            />

            <div className="relative flex flex-col items-center text-center space-y-2.5">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/20 shadow-[0_14px_34px_rgba(0,0,0,0.75)]">
                <img
                  src="/covers/the-sadness-of-reality.jpg"
                  alt="Neimeks — The Sadness of Reality"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-display font-black text-sm text-white uppercase tracking-tight">
                  The Sadness of Reality
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/60 mt-0.5">
                  Neimeks · CXRNER MUSIC
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {[
                { key: "yandex", name: "Яндекс Музыка", tag: "PLAY" },
                { key: "vk", name: "VK Музыка", tag: "PLAY" },
                { key: "spotify", name: "Spotify", tag: "STREAM" },
                { key: "apple", name: "Apple Music", tag: "LISTEN" },
              ].map((plat) => {
                const meta = getPlatformVisualMeta(plat.key);
                return (
                  <div
                    key={plat.name}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-white/10"
                        style={{ background: meta.bgGradient, color: meta.fgColor }}
                      >
                        <PlatformLogo platformKey={plat.key} className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-sans text-xs font-bold text-white">
                        {plat.name}
                      </span>
                    </div>
                    <span
                      className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#050407]"
                      style={{ backgroundColor: currentTheme.accent }}
                    >
                      {plat.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-[#D9D9E2]/55">
            <span>THEME: {currentTheme.name.toUpperCase()}</span>
            <Link href="/link" className="text-[#00F0FF] hover:underline">
              cxrnermusic.app/link/*
            </Link>
          </div>
        </CxrSurface>
      </div>
    </div>
  );
}
