"use client";

import { useState } from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { testimonials } from "../data/site";
import { playHoverSound, playClickSound } from "../lib/soundFX";

const ADVANTAGE_BANDS = [
  {
    code: "01",
    keyword: "70 / 30",
    headline: "ПРОЗРАЧНЫЕ РОЯЛТИ",
    sub: "70% В ПОЛЬЗУ АРТИСТА · ВЫПЛАТЫ 15 МАРТА, 15 ИЮНЯ, 15 СЕНТЯБРЯ, 15 ДЕКАБРЯ",
    detail:
      "Честная модель без скрытых комиссий. Артист получает 70% чистого дохода от стримингов и полные отчёты по начислениям.",
  },
  {
    code: "02",
    keyword: "12–72Ч",
    headline: "СКОРОСТЬ ЗАПУСКА",
    sub: "МОДЕРАЦИЯ ДО 3 ДНЕЙ · ОТГРУЗКА ОТ 12 ЧАСОВ",
    detail:
      "Быстрая проверка A&R-командой, оперативная обратная связь в Telegram и моментальный запуск отгрузки после аппрува.",
  },
  {
    code: "03",
    keyword: "FREEDOM",
    headline: "БЕЗ ЭКСКЛЮЗИВА",
    sub: "СВОБОДА КАТАЛОГА · ПРАВА ОСТАЮТСЯ ПОД КОНТРОЛЕМ",
    detail:
      "Контракт CXRNER MUSIC не запрещает вам выпускать другие треки самостоятельно или через сторонние лейблы.",
  },
  {
    code: "04",
    keyword: "PITCHING",
    headline: "РЕДАКЦИОННЫЙ ОХВАТ",
    sub: "ЯНДЕКС МУЗЫКА · VK МУЗЫКА · ЗВУК · YOUTUBE OAC & TIKTOK",
    detail:
      "Прямой питчинг в официальные плейлисты, помощь с оформлением карточек артистов, Official Artist Channel и верификацией.",
  },
];

export default function WhyCxrnerSection() {
  const [activeBand, setActiveBand] = useState(0);

  return (
    <div className="space-y-20">
      {/* Interactive Oversized Typographic Advantage Bands */}
      <div className="border-t border-white/15">
        {ADVANTAGE_BANDS.map((item, idx) => {
          const isOpen = activeBand === idx;
          return (
            <div
              key={item.code}
              onMouseEnter={() => {
                if (activeBand !== idx) {
                  setActiveBand(idx);
                  playHoverSound();
                }
              }}
              onClick={() => {
                setActiveBand(idx);
                playClickSound();
              }}
              data-cursor="EXPAND"
              className={`group cursor-pointer border-b border-white/15 py-6 sm:py-9 px-2 sm:px-4 transition-all duration-500 ${
                isOpen ? "bg-[#160B28]/45" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center">
                {/* Index & Massive Metric */}
                <div className="lg:col-span-4 flex items-baseline gap-3.5">
                  <span className="font-mono text-xs font-semibold text-[#B46BFF] tracking-wider select-none">
                    {item.code}
                  </span>
                  <span
                    className={`font-display font-black text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-none transition-all duration-300 ${
                      isOpen ? "text-violet-energy" : "text-outline-chrome group-hover:text-white"
                    }`}
                  >
                    {item.keyword}
                  </span>
                </div>

                {/* Headline & Spec */}
                <div className="lg:col-span-5">
                  <h3 className="font-display font-bold text-lg sm:text-2xl text-white uppercase tracking-tight">
                    {item.headline}
                  </h3>
                  <p className="mt-1 font-sans text-xs uppercase tracking-wider text-[#B46BFF] font-semibold">
                    {item.sub}
                  </p>
                </div>

                {/* Expandable Narrative */}
                <div className="lg:col-span-3">
                  <p
                    className={`text-xs sm:text-sm leading-relaxed transition-all duration-300 ${
                      isOpen ? "text-white opacity-100" : "text-[#D9D9E2]/60 opacity-85"
                    }`}
                  >
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Artist Testimonials Editorial Strip */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B46BFF] block mb-2">
              // ARTIST_FEEDBACK
            </span>
            <h3 className="font-heavy text-3xl sm:text-5xl text-white uppercase tracking-tight">
              Голос резидентов лейбла
            </h3>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#D9D9E2]/50">
            РЕАЛЬНЫЕ ОТЗЫВЫ АРТИСТОВ CXRNER
          </span>
        </div>

        <div
          data-reveal="stagger-group"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {testimonials.map((t, i) => (
            <blockquote
              key={t.name}
              data-stagger-item
              className="rounded-3xl p-6 sm:p-8 border border-white/10 bg-[#090611]/70 backdrop-blur-xl flex flex-col justify-between gap-6 hover:border-[#B46BFF]/45 transition duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Quote className="w-7 h-7 text-[#8737FF]/65" />
                  <span className="font-mono text-[10px] text-[#D9D9E2]/40">
                    QUOTE // 0{i + 1}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-[#D9D9E2] leading-relaxed">
                  «{t.quote}»
                </p>
              </div>

              <footer className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#B46BFF]/40 bg-[#050407]">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <cite className="not-italic font-heavy text-lg text-white uppercase tracking-wide block leading-none">
                    {t.name}
                  </cite>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#B46BFF] mt-1 block">
                    Артист CXRNER MUSIC
                  </span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}
