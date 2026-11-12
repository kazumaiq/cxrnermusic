"use client";

import Link from "next/link";
import {
  Link2,
  Clock,
  BarChart3,
  Paintbrush,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Disc3,
  Play,
  Check,
} from "lucide-react";
import MagneticButton from "./visual/MagneticButton";

export default function CxrnerLinkSection() {
  return (
    <section id="cxrner-link" className="relative py-24 sm:py-36 overflow-hidden">
      {/* Background radial lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(135,55,255,0.15),transparent_70%)] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-xs uppercase tracking-[0.24em] text-[#D9D9E2]">
            <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
            <span>[03] SMART LINKS &amp; PRE-SAVE PLATFORM</span>
            <span className="px-1.5 py-0.2 rounded bg-[#00F0FF] text-black text-[9px] font-bold">
              NEW
            </span>
          </div>

          <h2 className="font-heavy text-5xl sm:text-7xl uppercase tracking-tight leading-[0.9] text-white">
            <span className="block overflow-hidden">
              <span className="block">CXRNER LINK</span>
            </span>
            <span className="block overflow-hidden">
              <span className="block text-violet-energy">Умные смарт-страницы</span>
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#D9D9E2]/75 max-w-2xl leading-relaxed">
            Собственный аналог BandLink и Feature.fm внутри экосистемы CXRNER MUSIC. Создавайте страницы релизов за 30 секунд по коду UPC, настраивайте дизайн в реальном времени, запускайте Pre-save кампании и отслеживайте реальные переходы на 150+ стримингов.
          </p>
        </div>

        {/* Showcase Grid: Phone Interactive Simulation + Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Visual Smart Link Phone Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] rounded-[36px] p-3.5 bg-[#090611]/90 border border-[#B46BFF]/40 shadow-[0_0_60px_rgba(135,55,255,0.3)] backdrop-blur-2xl">
              {/* Phone Notch / Speaker */}
              <div className="w-24 h-4 bg-black/80 rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>

              {/* Inside Smart Link Page Mockup */}
              <div className="rounded-[26px] bg-[#050407] border border-white/10 p-4 space-y-4 text-center overflow-hidden relative">
                {/* Background blurred cover glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,107,255,0.25),transparent_65%)] pointer-events-none" />

                {/* Release Artwork */}
                <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                  <img
                    src="/covers/the-sadness-of-reality.jpg"
                    alt="CXRNER Release"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/80 border border-[#00F0FF]/50 font-mono text-[8px] uppercase tracking-wider text-[#00F0FF] font-bold">
                    OUT NOW
                  </div>
                </div>

                {/* Meta */}
                <div className="space-y-1">
                  <h4 className="font-heavy text-base uppercase text-white tracking-tight">
                    The Sadness of Reality
                  </h4>
                  <div className="flex items-center justify-center gap-1 font-mono text-xs text-[#D9D9E2]/70">
                    <span>Neimeks</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#B46BFF]">
                    CXRNER MUSIC · 2026
                  </p>
                </div>

                {/* Mockup Streaming Buttons */}
                <div className="space-y-2 pt-1 text-left font-mono text-xs">
                  {[
                    { name: "Яндекс Музыка", key: "yandex", btn: "Слушать", color: "#FFCC00" },
                    { name: "Spotify", key: "spotify", btn: "Play", color: "#1DB954" },
                    { name: "Apple Music", key: "apple", btn: "Listen", color: "#FC3C44" },
                    { name: "VK Музыка", key: "vk", btn: "Слушать", color: "#0077FF" },
                  ].map((dsp) => (
                    <div
                      key={dsp.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: dsp.color }}
                        />
                        <span className="text-white font-medium text-[11px]">{dsp.name}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#8737FF]/25 border border-[#B46BFF]/40 text-[#B46BFF] text-[10px] font-bold uppercase tracking-wider">
                        {dsp.btn}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Address Pill */}
                <div className="pt-2 border-t border-white/10">
                  <p className="font-mono text-[9px] text-[#D9D9E2]/50">
                    cxrnermusic.vercel.app/link/neimeks-reality
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Feature Cards Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#090611]/60 backdrop-blur-md hover:border-[#B46BFF]/40 transition group space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF]">
                  <Link2 className="w-5 h-5" />
                </div>
                <h3 className="font-heavy text-lg uppercase tracking-tight text-white">
                  Автопоиск по UPC / EAN
                </h3>
                <p className="text-xs text-[#D9D9E2]/75 leading-relaxed font-sans">
                  Вставьте штрихкод релиза — система с контрольной суммой Modulo-10 мгновенно подтянет официальную обложку, метаданные и прямые ссылки на Apple Music и Deezer.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#090611]/60 backdrop-blur-md hover:border-[#00F0FF]/40 transition group space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-heavy text-lg uppercase tracking-tight text-white">
                  Pre-save &amp; Auto Out Now
                </h3>
                <p className="text-xs text-[#D9D9E2]/75 leading-relaxed font-sans">
                  Таймер обратного отсчёта до даты релиза. Сбор подписок фанатов через Email и Telegram. В полночь релиз автоматически переключается в статус «Слушать сейчас».
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#090611]/60 backdrop-blur-md hover:border-[#FF2E93]/40 transition group space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 flex items-center justify-center text-[#FF2E93]">
                  <Paintbrush className="w-5 h-5" />
                </div>
                <h3 className="font-heavy text-lg uppercase tracking-tight text-white">
                  Живой Page Builder
                </h3>
                <p className="text-xs text-[#D9D9E2]/75 leading-relaxed font-sans">
                  Визуальный конструктор с мобильным предпросмотром: 4 дизайн-темы (CYBER, CINEMATIC, MINIMAL, BRUTAL), слайдер размытия фона и стили кнопок.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#090611]/60 backdrop-blur-md hover:border-[#B46BFF]/40 transition group space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-heavy text-lg uppercase tracking-tight text-white">
                  Честная аналитика
                </h3>
                <p className="text-xs text-[#D9D9E2]/75 leading-relaxed font-sans">
                  Автоматическая фильтрация ботов, клики по каждой площадке (Spotify, Яндекс, VK), географическая карта посетителей и отслеживание конверсии (CTR).
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <MagneticButton
                href="/dashboard/links/new"
                cursorLabel="CREATE"
                className="btn-energy px-8 py-4 rounded-full font-mono text-xs uppercase tracking-[0.18em] font-bold shadow-[0_0_30px_rgba(135,55,255,0.4)]"
              >
                <span>Создать Smart Link</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <MagneticButton
                href="/dashboard/links"
                cursorLabel="LINKS"
                className="btn-void-ghost px-7 py-4 font-mono text-xs uppercase tracking-[0.18em] border border-white/15 hover:border-white/30 text-white"
              >
                <span>Мои смарт-ссылки</span>
              </MagneticButton>

              <Link
                href="/link"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-4 font-mono text-xs uppercase tracking-wider text-[#B46BFF] hover:text-white transition"
              >
                <span>Обзор сервиса</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
