import Container from "../components/Container";
import Counter from "../components/Counter";
import InteractiveAudioPreview from "../components/InteractiveAudioPreview";
import ReleasesCatalog from "../components/ReleasesCatalog";
import ArtistsShowcase from "../components/ArtistsShowcase";
import DistributionSection from "../components/DistributionSection";
import WhyCxrnerSection from "../components/WhyCxrnerSection";
import FaqAccordion from "../components/FaqAccordion";
import IntroSequence from "../components/visual/IntroSequence";
import ScrollChoreographer from "../components/visual/ScrollChoreographer";
import MagneticButton from "../components/visual/MagneticButton";
import { faqItems, stats } from "../data/site";
import { getArtists } from "../lib/artists";
import { getFeaturedRelease } from "../lib/featured";
import { getReleases } from "../lib/releases";
import { ArrowDown, ArrowRight, ArrowUpRight, Disc3, Send } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, releases, artists] = await Promise.all([
    getFeaturedRelease(),
    getReleases(),
    getArtists(),
  ]);

  const activeFeaturedTitle =
    featured.title && !featured.title.toLowerCase().includes("breakthroug")
      ? featured.title
      : "The Sadness of Reality";
  const activeFeaturedArtist =
    featured.title && !featured.title.toLowerCase().includes("breakthroug")
      ? featured.artist
      : "Neimeks";
  const activeFeaturedCover =
    featured.title && !featured.title.toLowerCase().includes("breakthroug") && featured.cover
      ? featured.cover
      : "/covers/the-sadness-of-reality.jpg";

  return (
    <div className="relative text-white overflow-x-clip">
      {/* Skippable Cinematic Intro & GSAP Scroll Choreography */}
      <IntroSequence />
      <ScrollChoreographer />

      {/* =====================================================================
          SECTION 01 — HERO / COSMIC CORE STAGE
          ===================================================================== */}
      <section
        id="hero"
        className="relative min-h-[100svh] flex flex-col justify-between pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-10"
      >
        <Container className="relative z-10 flex-1 flex flex-col justify-between gap-4">
          {/* Desktop Top Micro-Line Only (Avoids duplicate logo peeking under mobile header) */}
          <div className="hidden lg:flex items-center justify-between gap-4 border-b border-white/10 pb-3.5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#D9D9E2]/65">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8737FF] shadow-[0_0_10px_#8737FF]" />
              <span>INDEPENDENT RECORD LABEL &amp; DISTRIBUTION</span>
            </div>
            <div className="flex items-center gap-6">
              <span>70/30 РОЯЛТИ</span>
              <span>150+ ПЛАТФОРМ</span>
              <span>24–72Ч МОДЕРАЦИЯ</span>
            </div>
          </div>

          {/* Center Monumental Composition (Leaves right side / top mobile stage open for 3D Core) */}
          <div className="my-auto py-2 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-end">
            {/* Dedicated mobile 3D visual stage above hero headline */}
            <div className="h-[215px] sm:h-[250px] lg:hidden pointer-events-none" aria-hidden="true" />

            <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
              <div className="overflow-hidden py-0.5">
                <div
                  data-reveal="mask-line"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#090611]/75 backdrop-blur-md font-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#D9D9E2] whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B46BFF]" />
                  <span>Лейбл и дистрибуция • 70/30</span>
                </div>
              </div>

              <h1 className="font-heavy uppercase tracking-tight leading-[1.04] select-none -space-y-2 sm:-space-y-3 lg:-space-y-4">
                <span className="block overflow-hidden py-1">
                  <span
                    data-reveal="mask-line"
                    className="block text-[15.5vw] sm:text-[13vw] lg:text-[9.2rem] text-chrome-gradient"
                  >
                    CXRNER
                  </span>
                </span>
                <span className="block overflow-hidden py-1">
                  <span
                    data-reveal="mask-line"
                    className="block text-[15.5vw] sm:text-[13vw] lg:text-[9.2rem] text-violet-energy"
                  >
                    MUSIC
                  </span>
                </span>
              </h1>

              <p className="max-w-lg text-[13px] sm:text-base text-[#D9D9E2]/85 leading-relaxed">
                Выпускаем релизы на Яндекс Музыке, VK Музыке, Spotify, Apple Music и
                ещё 150+ площадках. Прозрачные роялти 70/30, питчинг в плейлисты и
                личный кабинет артиста.
              </p>

              {/* Key Label Metrics Pills on Mobile/Tablet */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#B46BFF] lg:hidden">
                <span>70/30 РОЯЛТИ</span>
                <span className="text-white/25">•</span>
                <span>150+ ПЛАТФОРМ</span>
                <span className="text-white/25">•</span>
                <span>24–72Ч РЕЛИЗ</span>
              </div>

              {/* Magnetic CTAs */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <MagneticButton
                  href="/submit-release"
                  cursorLabel="SUBMIT"
                  className="btn-energy px-7 py-3.5 sm:px-8 sm:py-4 rounded-full font-mono text-xs uppercase tracking-[0.18em] font-bold"
                >
                  <span>Отправить релиз</span>
                  <ArrowRight className="w-4 h-4" />
                </MagneticButton>

                <MagneticButton
                  href="#releases"
                  cursorLabel="CATALOG"
                  className="btn-void-ghost px-7 py-3.5 sm:px-8 sm:py-4 font-mono text-xs uppercase tracking-[0.18em]"
                >
                  <Disc3 className="w-4 h-4 text-[#B46BFF]" />
                  <span>Слушать релизы</span>
                </MagneticButton>
              </div>
            </div>

            {/* Right Column: Spacer for 3D Core + Audio-Reactive Track Dock */}
            <div className="lg:col-span-5 flex flex-col justify-end items-end gap-4 pt-2 lg:pt-0">
              <div className="w-full max-w-[440px]">
                <InteractiveAudioPreview
                  track={{
                    title: activeFeaturedTitle,
                    artist: activeFeaturedArtist,
                    cover: activeFeaturedCover,
                    audioSrc: "/audio/the-sadness-of-reality.mp3",
                    yandexUrl:
                      "https://music.yandex.ru/album/44422385?utm_source=web&utm_medium=copy_link",
                    artistUrl: "https://music.yandex.ru/artist/25572730",
                    genre: "Phonk / Electronic",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Scroll Prompt */}
          <div className="hidden sm:flex items-center justify-between pt-3 border-t border-white/10 font-mono text-[10px] uppercase tracking-[0.26em] text-[#D9D9E2]/55">
            <span>SCROLL TO EXPLORE UNIVERSE</span>
            <a
              href="#about"
              className="inline-flex items-center gap-2 hover:text-white transition"
            >
              <span>02 / О ЛЕЙБЛЕ</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#B46BFF] animate-bounce" />
            </a>
          </div>
        </Container>
      </section>

      {/* Kinetic Scrubbed Divider Marquee */}
      <div className="relative py-6 border-y border-white/10 overflow-hidden bg-[#090611]/35 backdrop-blur-sm select-none">
        <div
          data-scrub-x="1"
          className="whitespace-nowrap font-heavy text-4xl sm:text-6xl uppercase tracking-[0.12em] text-outline-chrome opacity-55"
        >
          CXRNER MUSIC — 150+ STREAMING PLATFORMS — 70/30 ROYALTY — 256 TERRITORIES —
          MUSIC WITHOUT BOUNDARIES — CXRNER MUSIC —
        </div>
      </div>

      {/* =====================================================================
          SECTION 02 — ABOUT CXRNER (MUSIC WITHOUT BOUNDARIES)
          ===================================================================== */}
      <section id="about" className="relative py-24 sm:py-36">
        <Container className="relative z-10 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Side: Open for 3D Core & Sweeping Chrome Ring */}
            <div className="lg:col-span-5 space-y-4">
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#B46BFF] block">
                [02] ABOUT CXRNER
              </span>
              <div className="p-6 rounded-3xl border border-white/10 bg-[#090611]/55 backdrop-blur-xl space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#D9D9E2]/55">
                  LABEL PHILOSOPHY
                </p>
                <p className="text-sm sm:text-base text-[#D9D9E2]/85 leading-relaxed">
                  CXRNER MUSIC — это не потоковый агрегатор, а цифровая экосистема
                  вокруг артиста. Мы объединяем мгновенную глобальную дистрибуцию,
                  редакционный питчинг и честную экономику без кабальных контрактов.
                </p>
              </div>
            </div>

            {/* Right Side: Monumental Kinetic Headline + Editorial Blocks */}
            <div className="lg:col-span-7 space-y-10">
              <h2 className="font-heavy text-5xl sm:text-7xl md:text-8xl uppercase tracking-tight leading-[0.88]">
                <span className="block overflow-hidden">
                  <span data-reveal="mask-line" className="block text-white">
                    MUSIC
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span data-reveal="mask-line" className="block text-outline-violet">
                    WITHOUT
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span data-reveal="mask-line" className="block text-violet-energy">
                    BOUNDARIES.
                  </span>
                </span>
              </h2>

              <div
                data-reveal="stagger-group"
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <div
                  data-stagger-item
                  className="p-6 rounded-2xl border border-white/10 bg-[#090611]/50 backdrop-blur-md"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#B46BFF] mb-2">
                    // SOUND & IDENTITY
                  </p>
                  <p className="text-sm text-[#D9D9E2]/80 leading-relaxed">
                    Работаем со всеми актуальными жанрами — от фонка, трэпа и
                    электроники до альтернативы и поп-сцены.
                  </p>
                </div>

                <div
                  data-stagger-item
                  className="p-6 rounded-2xl border border-white/10 bg-[#090611]/50 backdrop-blur-md"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#B46BFF] mb-2">
                    // DIRECT CONTROL
                  </p>
                  <p className="text-sm text-[#D9D9E2]/80 leading-relaxed">
                    Отслеживайте статус модерации, коды UPC/ISRC и синхронизацию с
                    Telegram-ботом в личном кабинете артиста.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Telemetry Stats Row */}
          <div
            data-reveal="stagger-group"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-white/15"
          >
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                data-stagger-item
                className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-[#090611]/60 backdrop-blur-md hover:border-[#B46BFF]/45 transition duration-300"
              >
                <span className="font-mono text-[10px] text-[#B46BFF] tracking-widest block mb-2">
                  // 0{idx + 1}
                </span>
                <p className="font-heavy text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
                  {stat.display ?? <Counter to={stat.value} suffix={stat.suffix} />}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#D9D9E2]/65">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <div className="cosmic-hairline" />

      {/* =====================================================================
          SECTION 03 — RELEASES SHOWCASE
          ===================================================================== */}
      <section id="releases" className="relative py-24 sm:py-36">
        <Container className="relative z-10">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#B46BFF] block">
                [03] RELEASE CATALOG
              </span>
              <h2 className="font-heavy text-5xl sm:text-7xl uppercase tracking-tight leading-[0.9] text-white">
                <span className="block overflow-hidden">
                  <span data-reveal="mask-line" className="block">
                    Свежие релизы
                  </span>
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton
                href="/submit-release"
                cursorLabel="UPLOAD"
                className="btn-void-primary px-6 py-3 text-[11px]"
              >
                <span>Выпустить трек</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </MagneticButton>
            </div>
          </div>

          <ReleasesCatalog initialReleases={releases} />
        </Container>
      </section>

      <div className="cosmic-hairline" />

      {/* =====================================================================
          SECTION 04 — ARTISTS ROSTER
          ===================================================================== */}
      <section id="artists" className="relative py-24 sm:py-36">
        <Container className="relative z-10">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#B46BFF] block">
                [04] LABEL ROSTER
              </span>
              <h2 className="font-heavy text-5xl sm:text-7xl uppercase tracking-tight leading-[0.9] text-white">
                <span className="block overflow-hidden">
                  <span data-reveal="mask-line" className="block">
                    Резиденты CXRNER
                  </span>
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[#D9D9E2]/75 max-w-xl">
                Артисты, чьи треки выходят на лейбле и набирают сотни тысяч
                ежемесячных слушателей на мировых витринах.
              </p>
            </div>

            <MagneticButton
              href="https://t.me/moder_cxrner_bot"
              external
              cursorLabel="JOIN"
              className="btn-void-ghost px-6 py-3 text-[11px]"
            >
              <Send className="w-3.5 h-3.5 text-[#B46BFF]" />
              <span>Стать резидентом</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>

          <ArtistsShowcase artists={artists} />
        </Container>
      </section>

      <div className="cosmic-hairline" />

      {/* =====================================================================
          SECTION 05 — DISTRIBUTION NETWORK
          ===================================================================== */}
      <section id="distribution" className="relative py-24 sm:py-36">
        <Container className="relative z-10">
          <div className="mb-14 max-w-3xl space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#B46BFF] block">
              [05] GLOBAL DISTRIBUTION NETWORK
            </span>
            <h2 className="font-heavy text-5xl sm:text-7xl uppercase tracking-tight leading-[0.9] text-white">
              <span className="block overflow-hidden">
                <span data-reveal="mask-line" className="block">
                  От студии до всех витрин мира
                </span>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#D9D9E2]/75 max-w-2xl">
              Сквозная архитектура доставки релизов: от A&R-модерации и присвоения
              UPC/ISRC до попадания в редакционные плейлисты и квартальных выплат.
            </p>
          </div>

          <DistributionSection />
        </Container>
      </section>

      <div className="cosmic-hairline" />

      {/* =====================================================================
          SECTION 06 — WHY CXRNER & FAQ
          ===================================================================== */}
      <section id="why-cxrner" className="relative py-24 sm:py-36">
        <Container className="relative z-10 space-y-24">
          <div className="space-y-10">
            <div className="max-w-3xl space-y-3">
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#B46BFF] block">
                [06] WHY CXRNER MUSIC
              </span>
              <h2 className="font-heavy text-5xl sm:text-7xl uppercase tracking-tight leading-[0.9] text-white">
                <span className="block overflow-hidden">
                  <span data-reveal="mask-line" className="block">
                    Архитектура преимуществ
                  </span>
                </span>
              </h2>
            </div>

            <WhyCxrnerSection />
          </div>

          {/* FAQ Subsection */}
          <div id="faq" className="space-y-10 pt-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#B46BFF] block">
                // KNOWLEDGE BASE
              </span>
              <h3 className="font-heavy text-4xl sm:text-6xl uppercase tracking-tight text-white">
                Частые вопросы
              </h3>
              <p className="text-sm text-[#D9D9E2]/70">
                Всё, что нужно знать о роялти, сроках модерации, питчинге и личном кабинете.
              </p>
            </div>

            <FaqAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      {/* =====================================================================
          SECTION 07 — SEND YOUR RELEASE (ENERGY PORTAL)
          ===================================================================== */}
      <section id="send-release" className="relative py-28 sm:py-40">
        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 rounded-3xl p-8 sm:p-14 lg:p-20 border border-[#B46BFF]/35 bg-[#090611]/65 backdrop-blur-2xl shadow-[0_0_90px_rgba(135,55,255,0.22)]">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-[10px] uppercase tracking-[0.28em] text-[#D9D9E2]">
              <span className="w-2 h-2 rounded-full bg-[#B46BFF] animate-ping" />
              [07] RELEASE SUBMISSION PORTAL
            </span>

            <h2 className="font-heavy text-5xl sm:text-7xl md:text-8xl uppercase tracking-tight leading-[0.88] text-white">
              <span className="block overflow-hidden">
                <span data-reveal="mask-line" className="block">
                  ГОТОВ ВЫПУСТИТЬ
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-reveal="mask-line" className="block text-violet-energy">
                  СЛЕДУЮЩИЙ РЕЛИЗ?
                </span>
              </span>
            </h2>

            <p className="max-w-xl mx-auto text-sm sm:text-base text-[#D9D9E2]/80 leading-relaxed">
              Отправьте трек через официальную форму сайта с прямой интеграцией в
              личный кабинет и модерацию — ответ команды придёт в течение 24–72 часов.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton
                href="/submit-release"
                cursorLabel="LAUNCH"
                className="btn-energy w-full sm:w-auto px-10 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-[0.2em] font-bold"
              >
                <span>Отправить релиз</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <MagneticButton
                href="https://t.me/moder_cxrner_bot"
                external
                cursorLabel="BOT"
                className="btn-void-ghost w-full sm:w-auto px-8 py-4 font-mono text-xs sm:text-sm uppercase tracking-[0.18em]"
              >
                <Send className="w-4 h-4 text-[#B46BFF]" />
                <span>Telegram-бот</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </MagneticButton>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
