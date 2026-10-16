import Image from "next/image";
import Link from "next/link";
import Container from "../components/Container";
import Counter from "../components/Counter";
import VinylCanvas from "../components/3d/VinylCanvas";
import InteractiveAudioPreview from "../components/InteractiveAudioPreview";
import ReleasesCatalog from "../components/ReleasesCatalog";
import WorkflowSection from "../components/WorkflowSection";
import FaqAccordion from "../components/FaqAccordion";
import ScrollReveal from "../components/visual/ScrollReveal";
import { ChromeStarburst, ChromeOrganicSpine, TechnicalCrosshair } from "../components/ChromeSpines";
import { faqItems, services, stats, testimonials, whyUs } from "../data/site";
import { getArtists } from "../lib/artists";
import { getFeaturedRelease } from "../lib/featured";
import { getReleases } from "../lib/releases";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Headphones,
  ShieldCheck,
  Disc,
  Radio,
  ExternalLink,
  Users,
  CheckCircle,
  Quote,
} from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, releases, artists] = await Promise.all([
    getFeaturedRelease(),
    getReleases(),
    getArtists(),
  ]);

  return (
    <div className="relative overflow-hidden text-[#EAEAEA]">
      {/* ===================== HERO SECTION ===================== */}
      <section id="hero" className="relative min-h-[94vh] flex flex-col justify-between pt-24 sm:pt-28 pb-12 overflow-hidden">
        {/* Background Chrome Organic Spines & Ambient Diffraction */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <ChromeOrganicSpine className="absolute -top-16 -right-24 w-[780px] lg:w-[1020px] max-w-none opacity-45 mix-blend-screen" />
          <ChromeStarburst className="absolute top-28 left-8 sm:left-24" size={32} />
          <ChromeStarburst className="absolute top-1/2 right-12 sm:right-32" size={24} />
          <ChromeStarburst className="absolute bottom-24 left-1/3" size={20} />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-white/[0.04] blur-[120px] rounded-full pointer-events-none" />
        </div>

        <Container className="relative z-10 w-full flex-1 flex flex-col justify-between">
          {/* Top Technical Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10 text-neutral-400 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              <span className="text-white font-bold">[CXR::RECORDINGS // UNDERGROUND_SYS]</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-neutral-500">
              <span>FREQ_RES::12Hz-28kHz</span>
              <span>•</span>
              <span>AUDIO_180G_VINYL</span>
              <span>•</span>
              <span className="text-white">150+ DSP DISTRIBUTION</span>
            </div>
          </div>

          {/* Main Hero Spatial Composition */}
          <div className="my-auto py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Massive Industrial Typography & Narrative */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div>
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2.5 block">
                  // INTERNATIONAL INDEPENDENT RECORD LABEL
                </span>
                <h1 className="font-heavy text-6xl sm:text-8xl md:text-9xl lg:text-[7.5rem] xl:text-[9rem] tracking-tight leading-[0.84] text-white uppercase select-none">
                  CXRNER <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
                    MUSIC
                  </span>
                </h1>
                <p className="mt-4 font-unbounded text-sm sm:text-base md:text-lg text-neutral-200 tracking-wide uppercase font-bold">
                  БЕСКОМПРОМИССНЫЙ ЗВУК НОВОЙ ЭРЫ
                </p>
              </div>

              {/* Subtitle Statement */}
              <p className="mt-5 text-sm sm:text-base text-neutral-400 max-w-xl leading-relaxed font-sans">
                Глобальная цифровая экосистема для артистов с бескомпромиссным характером.
                Прямая отгрузка в Spotify, Apple Music, VK и Яндекс, редакционный питчинг
                и честное распределение роялти 70/30.
              </p>

              {/* High Contrast Brutalist CTA Controls */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/submit-release"
                  className="btn-void-primary inline-flex items-center justify-center gap-2 px-8 py-4 font-mono text-xs sm:text-sm uppercase tracking-widest font-black shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition duration-200 rounded-full"
                >
                  <span>ОТПРАВИТЬ РЕЛИЗ</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#releases"
                  className="btn-void-ghost inline-flex items-center justify-center gap-2 px-8 py-4 font-mono text-xs sm:text-sm uppercase tracking-widest font-bold border border-white/25 text-neutral-300 hover:text-white hover:border-white transition duration-200 rounded-full"
                >
                  <Disc className="w-4 h-4 text-neutral-400" />
                  <span>КАТАЛОГ МУЗЫКИ</span>
                </a>
              </div>

              {/* Technical Spec Badges */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[10px] sm:text-[11px] text-neutral-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-white flex-shrink-0" />
                  <span>РОЯЛТИ 70/30</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-white flex-shrink-0" />
                  <span>МОДЕРАЦИЯ 24–72Ч</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Headphones className="w-3.5 h-3.5 text-white flex-shrink-0" />
                  <span>DSP ПИТЧИНГ</span>
                </div>
              </div>
            </div>

            {/* Right Dominant 3D Centerpiece */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              {/* Backing Subtle Starburst Flares */}
              <div className="absolute -top-8 -right-8 pointer-events-none z-10">
                <ChromeStarburst size={42} />
              </div>

              {/* 3D Vinyl Object (Dominant size with dynamic frustum fit) */}
              <div className="w-full relative aspect-square max-w-[540px] lg:max-w-[620px]">
                <VinylCanvas
                  featuredTitle={featured.title}
                  featuredArtist={featured.artist}
                  featuredCover={featured.cover}
                />
              </div>

              {/* Audio Waveform Player Bar */}
              <div className="w-full mt-6 max-w-[540px]">
                <InteractiveAudioPreview
                  track={{
                    title: featured.title,
                    artist: featured.artist,
                    cover: featured.cover,
                    genre: "Phonk / Industrial Electronic",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Technical Corner Coordinates */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
            <div className="flex items-center gap-3">
              <TechnicalCrosshair />
              <span>SYS::2.0_STABLE</span>
            </div>
            <span>[LAT 55.7558° N // LON 37.6173° E]</span>
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} CXRNER</span>
              <TechnicalCrosshair />
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section className="relative py-10 border-y border-white/10 bg-[#070707]/90 backdrop-blur-xl">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, idx) => (
              <ScrollReveal key={stat.label} delay={idx * 100}>
                <div className="p-3">
                  <p className="font-heavy text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                    {stat.display ?? <Counter to={stat.value} suffix={stat.suffix} />}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== RELEASES SHOWCASE ===================== */}
      <section id="releases" className="section-padding relative">
        <Container>
          <ScrollReveal>
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// КАТАЛОГ МУЗЫКИ</p>
                <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
                  Свежие релизы лейбла
                </h2>
                <p className="mt-2 text-sm text-neutral-400 max-w-xl font-sans">
                  Открывайте новые треки резидентов CXRNER MUSIC на всех мировых цифровых витринах.
                </p>
              </div>

              <Link
                href="/submit-release"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full tech-badge font-mono text-xs uppercase tracking-wider text-white hover:border-white transition duration-300 w-fit"
              >
                <span>Выпустить свой трек</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>

          <ReleasesCatalog initialReleases={releases} />
        </Container>
      </section>

      {/* ===================== WORKFLOW / PROCESS ===================== */}
      <section className="section-padding relative bg-[#070707]/90 border-y border-white/10">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// ПРОЦЕСС</p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
                Как выпустить трек через CXRNER
              </h2>
              <p className="mt-3 text-sm text-neutral-400 font-sans">
                От заполнения анкеты до появления релиза на 150+ платформах и официальных выплат.
              </p>
            </div>
          </ScrollReveal>

          <WorkflowSection />

          <ScrollReveal delay={200}>
            <div className="mt-12 text-center">
              <Link
                href="/submit-release"
                className="btn-void-primary inline-flex items-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 transition"
              >
                <span>Перейти к подаче заявки</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* ===================== ARTISTS ROSTER ===================== */}
      <section id="artists" className="section-padding relative">
        <Container>
          <ScrollReveal>
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// РЕЗИДЕНТЫ</p>
                <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
                  Артисты CXRNER MUSIC
                </h2>
                <p className="mt-2 text-sm text-neutral-400 max-w-xl font-sans">
                  Музыканты, которые формируют неповторимый стиль и мрачное гипнотическое звучание.
                </p>
              </div>

              <a
                href="https://t.me/moder_cxrner_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full tech-badge font-mono text-xs uppercase tracking-wider text-neutral-300 hover:text-white hover:border-white transition duration-300 w-fit"
              >
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>Стать резидентом ↗</span>
              </a>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {artists.map((artist, idx) => (
              <ScrollReveal key={artist.id} delay={idx * 80}>
                <Link
                  href={`/artists/${artist.id}`}
                  className="group rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-4 bg-[#0a0a0a]/90 backdrop-blur-md"
                >
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden flex-shrink-0 border border-white/20 group-hover:border-white transition duration-300">
                    <Image
                      src={encodeURI(artist.avatar)}
                      alt={artist.name}
                      fill
                      sizes="72px"
                      className="object-cover grayscale group-hover:grayscale-0 transition duration-500"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-gothic font-bold text-white text-base group-hover:text-neutral-200 transition truncate">
                      {artist.name}
                    </h3>
                    <p className="font-mono text-xs text-neutral-500 font-medium mt-0.5">
                      {artist.listeners} слушателей / мес
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate mt-1">
                      {artist.bio}
                    </p>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 group-hover:text-white group-hover:bg-white/10 transition">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== SERVICES / BENTO GRID ===================== */}
      <section id="services" className="section-padding relative bg-[#070707]/90 border-y border-white/10">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// ВОЗМОЖНОСТИ</p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
                Сервисы полного цикла для артиста
              </h2>
              <p className="mt-3 text-sm text-neutral-400 font-sans">
                Всё, что необходимо для успешного релиза, мирового продвижения и защиты ваших прав.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, idx) => (
              <ScrollReveal key={service.title} delay={idx * 90}>
                <div
                  className="group rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 bg-[#0a0a0a]/90 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="w-11 h-11 rounded-lg bg-black border border-white/15 flex items-center justify-center text-white group-hover:border-white/50 transition duration-300 mb-5">
                    <Sparkles className="w-5 h-5 text-neutral-300 group-hover:text-white" />
                  </div>
                  <h3 className="font-gothic text-lg font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                    {service.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-neutral-600 font-mono text-[9px] uppercase tracking-widest">
                    <span>CXR::SPEC_0{idx + 1}</span>
                    <span className="text-neutral-400 group-hover:text-white transition">ACTIVE</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== ASYMMETRICAL TESTIMONIALS / ARCHIVE ===================== */}
      <section className="section-padding relative">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// ОТЗЫВЫ АРТИСТОВ</p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
                Что говорят артисты лейбла
              </h2>
              <p className="mt-3 text-sm text-neutral-400 font-sans">
                Реальный опыт сотрудничества, прозрачной модерации и независимого роста.
              </p>
            </div>
          </ScrollReveal>

          {/* Expressive Asymmetric Editorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {testimonials.map((item, idx) => {
              // Asymmetric alternating columns
              const isWide = idx % 3 === 0 || idx === 3;
              const colSpan = isWide ? "md:col-span-7" : "md:col-span-5";

              return (
                <div key={item.name} className={`${colSpan} flex flex-col`}>
                  <ScrollReveal delay={idx * 120} className="h-full">
                    <div className="h-full rounded-2xl p-7 sm:p-8 border border-white/10 hover:border-white/25 transition-all duration-300 bg-gradient-to-b from-[#0e0e0e]/90 to-[#070707]/90 backdrop-blur-md flex flex-col justify-between relative group">
                      {/* Top transmission index */}
                      <div className="flex items-center justify-between pb-4 border-b border-white/10 text-neutral-500 font-mono text-[10px] uppercase tracking-widest">
                        <span>[TRANSMISSION // 0{idx + 1}]</span>
                        <span className="text-neutral-400">VERIFIED ARTIST</span>
                      </div>

                      {/* Quote Text */}
                      <div className="my-6">
                        <Quote className="w-6 h-6 text-neutral-600 mb-3 group-hover:text-white transition duration-300" />
                        <p className="text-sm sm:text-base leading-relaxed text-neutral-200 font-sans font-normal italic">
                          «{item.quote}»
                        </p>
                      </div>

                      {/* Artist Footer */}
                      <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/25 bg-black flex-shrink-0 group-hover:border-white transition duration-300">
                          <Image
                            src={item.avatar}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover grayscale group-hover:grayscale-0 transition duration-500"
                          />
                        </div>
                        <div>
                          <p className="font-gothic font-bold text-white text-base tracking-wide">
                            {item.name}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                            CXRNER RESIDENT // ARTIST
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="section-padding relative bg-[#070707]/90 border-t border-white/10">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// FAQ</p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
                Часто задаваемые вопросы
              </h2>
              <p className="mt-3 text-sm text-neutral-400 font-sans">
                Всё, что вам нужно знать перед отправкой первого трека на лейбл.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <FaqAccordion items={faqItems} />
          </ScrollReveal>
        </Container>
      </section>

      {/* ===================== FINAL CALL-TO-ACTION ===================== */}
      <section className="section-padding relative">
        <Container>
          <ScrollReveal scale={0.96}>
            <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 border border-white/20 bg-gradient-to-b from-[#121212]/95 to-[#070707]/95 backdrop-blur-xl shadow-2xl text-center">
              <div className="relative z-10 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-[0.25em] tech-badge text-neutral-300 mb-4 border border-white/15">
                  [CXR::NEXT_RELEASE]
                </span>

                <h2 className="font-gothic text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase">
                  ТВОЯ МУЗЫКА. ТВОЙ ЗВУК. <br />
                  <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                    ТВОЙ РЕЛИЗ.
                  </span>
                </h2>

                <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed font-sans">
                  Отправь свой трек прямо сейчас через сайт или официальный Telegram-бот.
                  Команда модерации оценит материал и вернется с ответом в течение 24-72 часов.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/submit-release"
                    className="btn-void-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 transition"
                  >
                    <span>Отправить трек на лейбл</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="https://t.me/moder_cxrner_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-void-ghost w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-medium border border-white/20 text-neutral-300 hover:text-white transition"
                  >
                    <span>Открыть Telegram-бота ↗</span>
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </div>
  );
}
