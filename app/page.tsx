import Link from "next/link";
import { ArrowRight, ArrowUpRight, Radio, Send, Sparkles, ShieldCheck, Globe, Disc3 } from "lucide-react";
import Container from "../components/Container";
import IntroSequence from "../components/visual/IntroSequence";
import ScrollChoreographer from "../components/visual/ScrollChoreographer";
import InteractiveAudioPreview from "../components/InteractiveAudioPreview";
import HeroHudControls from "../components/visual/HeroHudControls";
import CxrnerDropHeroCard from "../components/drop/CxrnerDropHeroCard";
import CxrnerDropShowcaseSection from "../components/drop/CxrnerDropShowcaseSection";
import BeatLaunchpad from "../components/visual/BeatLaunchpad";
import CxrnerLinkSection from "../components/CxrnerLinkSection";
import ReleasesCatalog from "../components/ReleasesCatalog";
import ArtistsShowcase from "../components/ArtistsShowcase";
import DistributionSection from "../components/DistributionSection";
import WhyCxrnerSection from "../components/WhyCxrnerSection";
import FaqAccordion from "../components/FaqAccordion";
import { getReleases } from "../lib/releases";
import { getArtists } from "../lib/artists";
import { faqItems } from "../data/site";

export const dynamic = "force-dynamic";

const HERO_TRACK = {
  title: "The Sadness of Reality",
  artist: "Neimeks",
  cover: "/covers/the-sadness-of-reality.jpg",
  audioSrc: "/audio/the-sadness-of-reality.mp3",
  genre: "Electronic / Atmospheric",
  yandexUrl: "https://music.yandex.ru/album/44422385",
  artistUrl: "https://music.yandex.ru/artist/25572730",
};

const LABEL_METRICS = [
  { code: "01", value: "900K+", label: "СТРИМОВ", sub: "Глобальные прослушивания" },
  { code: "02", value: "280+", label: "АРТИСТОВ", sub: "Независимые резиденты" },
  { code: "03", value: "350+", label: "РЕЛИЗОВ", sub: "Активный каталог лейбла" },
  { code: "04", value: "150+", label: "ПЛАТФОРМ", sub: "Яндекс, VK, Spotify, Apple" },
];

export default async function HomePage() {
  const [releases, artists] = await Promise.all([getReleases(), getArtists()]);

  return (
    <div className="relative min-h-[100svh] text-white selection:bg-[#8737FF] selection:text-white">
      <IntroSequence />
      <ScrollChoreographer />

      {/* =================================================================
          01 // HERO STAGE (Uncluttered Monumental Composition + 3D Core)
          ================================================================= */}
      <section
        id="hero"
        className="relative min-h-[100svh] flex items-center pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden"
      >
        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Architectural Column */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/15 backdrop-blur-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
                <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#D9D9E2]">
                  INDEPENDENT RECORD LABEL · 70/30 ROYALTY
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display font-black text-[13vw] sm:text-7xl xl:text-[86px] uppercase tracking-[-0.03em] leading-[0.88] text-white">
                  <span className="block text-chrome-gradient">CXRNER</span>
                  <span className="block text-white">MUSIC</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-[#D9D9E2]/75 max-w-xl leading-relaxed font-sans pt-1">
                  Дистрибуция на 150+ площадок мира, прямой питчинг плейлистов и
                  собственная цифровая экосистема инструментов для артистов.
                </p>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/submit-release"
                  className="btn-void-primary px-6 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs"
                >
                  <span>Отправить релиз</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="btn-void-ghost px-6 sm:px-7 py-3.5 sm:py-4 text-[11px] sm:text-xs"
                >
                  <span>Личный кабинет</span>
                  <ArrowUpRight className="w-4 h-4 opacity-70" />
                </Link>
              </div>

              {/* Dual Ecosystem Service Dock (LINK + DROP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-2xl">
                <Link
                  href="/link"
                  className="group relative flex items-center justify-between gap-3.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0B111A]/95 to-[#06040A]/95 border border-[#00F0FF]/30 hover:border-[#00F0FF]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_40px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[#00F0FF]/12 blur-2xl group-hover:bg-[#00F0FF]/25 transition-colors" />
                  <div className="relative z-10 flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/35 flex items-center justify-center text-[#00F0FF] shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-sm text-white uppercase tracking-wide">
                          CXRNER LINK
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#00F0FF] text-[8px] font-mono font-bold text-[#040307] uppercase">
                          UPC
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-[#D9D9E2]/60 truncate">
                        Смарт-ссылки · Pre-save · Статистика
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 w-8 h-8 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center text-white group-hover:bg-[#00F0FF] group-hover:text-[#040307] transition-all shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <CxrnerDropHeroCard />
              </div>

              <HeroHudControls />
            </div>

            {/* Right Studio Stage: Balanced space around 3D Core + Studio Audio Unit */}
            <div className="lg:col-span-5 flex flex-col justify-end lg:pt-24">
              <div className="cxr-panel-chrome rounded-3xl p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#D9D9E2]/65">
                    <Disc3 className="w-3.5 h-3.5 text-[#B46BFF]" />
                    <span>FEATURED MASTER // 24-BIT</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#00F0FF]">LIVE PLAYBACK</span>
                </div>
                <InteractiveAudioPreview track={HERO_TRACK} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Architectural Ticker Band */}
      <div className="relative z-10 border-y border-white/10 bg-[#040307]/85 backdrop-blur-xl py-3.5 overflow-hidden select-none">
        <div className="flex items-center gap-10 whitespace-nowrap animate-marquee font-mono text-[11px] uppercase tracking-[0.26em] text-[#D9D9E2]/60">
          <span>CXRNER MUSIC ECOSYSTEM</span>
          <span className="text-[#00F0FF]">◆</span>
          <span>70 / 30 TRANSPARENT ROYALTY</span>
          <span className="text-[#B46BFF]">◆</span>
          <span>150+ STREAMING DSPs</span>
          <span className="text-[#00F0FF]">◆</span>
          <span>CXRNER LINK SMART ROUTING</span>
          <span className="text-[#B46BFF]">◆</span>
          <span>CXRNER DROP SPECIMEN ARCHIVE</span>
          <span className="text-[#00F0FF]">◆</span>
          <span>CXRNER ID ARTISTS NETWORK</span>
          <span className="text-[#B46BFF]">◆</span>
          <span>24–72H MODERATION PIPELINE</span>
        </div>
      </div>

      {/* =================================================================
          02 // ABOUT & TELEMETRY
          ================================================================= */}
      <section id="about" className="relative z-10 py-20 sm:py-28">
        <Container className="space-y-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B46BFF]">
                // 01 ECOSYSTEM TELEMETRY
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
                Масштаб <span className="text-chrome-gradient">Лейбла</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/65 max-w-md leading-relaxed">
              Независимая инфраструктура нового поколения: дистрибуция без скрытых
              комиссий, техническая автоматизация и единый кабинет артиста.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {LABEL_METRICS.map((m) => (
              <div
                key={m.code}
                className="cxr-panel rounded-2xl p-5 sm:p-7 space-y-3 hover:border-white/25 transition"
              >
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]/45">
                  <span>// {m.code}</span>
                  <Globe className="w-3.5 h-3.5 text-[#00F0FF]/70" />
                </div>
                <div className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                  {m.value}
                </div>
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#B46BFF]">
                    {m.label}
                  </div>
                  <div className="text-[11px] text-[#D9D9E2]/55 mt-0.5">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Embedded Beat Studio Launchpad */}
          <div id="beatpad" className="pt-2">
            <BeatLaunchpad />
          </div>
        </Container>
      </section>

      <div className="cxr-hairline-h opacity-50" />

      {/* =================================================================
          03 // CXRNER LINK SHOWCASE
          ================================================================= */}
      <section id="cxrner-link" className="relative z-10 py-20 sm:py-28">
        <Container>
          <CxrnerLinkSection />
        </Container>
      </section>

      <div className="cxr-hairline-h opacity-50" />

      {/* =================================================================
          04 // CXRNER DROP ARCHIVE SHOWCASE (REAL ZIP SPECIMENS)
          ================================================================= */}
      <section id="cxrner-drop" className="relative z-10 py-20 sm:py-28">
        <Container>
          <CxrnerDropShowcaseSection />
        </Container>
      </section>

      <div className="cxr-hairline-h opacity-50" />

      {/* =================================================================
          05 // RELEASES CATALOG
          ================================================================= */}
      <section id="releases" className="relative z-10 py-20 sm:py-28">
        <Container className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00F0FF]">
                // 04 OFFICIAL CATALOG
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
                Последние <span className="text-chrome-gradient">Релизы</span>
              </h2>
            </div>
            <Link
              href="/submit-release"
              className="btn-void-ghost px-5 py-2.5 text-[11px] self-start md:self-auto"
            >
              <span>Выпустить релиз</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ReleasesCatalog initialReleases={releases} />
        </Container>
      </section>

      <div className="cxr-hairline-h opacity-50" />

      {/* =================================================================
          06 // ARTISTS ROSTER
          ================================================================= */}
      <section id="artists" className="relative z-10 py-20 sm:py-28">
        <Container className="space-y-10">
          <div className="space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B46BFF]">
              // 05 ARTISTS ROSTER
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
              Резиденты <span className="text-violet-energy">CXRNER</span>
            </h2>
          </div>
          <ArtistsShowcase artists={artists} />
        </Container>
      </section>

      <div className="cxr-hairline-h opacity-50" />

      {/* =================================================================
          07 // DISTRIBUTION PIPELINE
          ================================================================= */}
      <section id="distribution" className="relative z-10 py-20 sm:py-28">
        <Container className="space-y-10">
          <div className="space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00F0FF]">
              // 06 GLOBAL PIPELINE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
              Дистрибуция <span className="text-chrome-gradient">150+ DSP</span>
            </h2>
          </div>
          <DistributionSection />
        </Container>
      </section>

      <div className="cxr-hairline-h opacity-50" />

      {/* =================================================================
          08 // WHY CXRNER & FAQ
          ================================================================= */}
      <section id="why-cxrner" className="relative z-10 py-20 sm:py-28">
        <Container className="space-y-20">
          <div className="space-y-10">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B46BFF]">
                // 07 ARCHITECTURE ADVANTAGE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
                Условия <span className="text-chrome-gradient">Работы</span>
              </h2>
            </div>
            <WhyCxrnerSection />
          </div>

          <div id="faq" className="space-y-8 pt-6">
            <div className="text-center space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00F0FF]">
                // KNOWLEDGE BASE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-white">
                Частые вопросы
              </h2>
            </div>
            <FaqAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      {/* =================================================================
          09 // FINAL PORTAL CTA
          ================================================================= */}
      <section id="send-release" className="relative z-10 py-16 sm:py-24">
        <Container>
          <div className="cxr-panel-chrome rounded-3xl p-8 sm:p-14 text-center space-y-7 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 font-mono text-[10px] uppercase tracking-[0.24em] text-[#D9D9E2]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>A&amp;R SUBMISSION PORTAL // OPEN</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white leading-[0.95] max-w-3xl mx-auto">
              Готов выпустить релиз с <span className="text-violet-energy">CXRNER</span>?
            </h2>

            <p className="text-xs sm:text-base text-[#D9D9E2]/70 max-w-xl mx-auto leading-relaxed">
              Загрузите аудио и обложку за 2 минуты. Модерация до 72 часов,
              присвоение UPC/ISRC и полный контроль в личном кабинете.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/submit-release"
                className="btn-void-primary px-8 py-4 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Отправить заявку онлайн</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://t.me/moder_cxrner_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-void-ghost px-7 py-4 text-xs"
              >
                <Send className="w-4 h-4 text-[#B46BFF]" />
                <span>Telegram-бот модерации</span>
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
