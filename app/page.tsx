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
import { faqItems, services, stats, testimonials } from "../data/site";
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
  Music,
  ExternalLink,
  Users,
  CheckCircle2,
  Quote,
  Clock,
  Radio,
} from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, releases, artists] = await Promise.all([
    getFeaturedRelease(),
    getReleases(),
    getArtists(),
  ]);

  return (
    <div className="relative overflow-hidden text-[#F5F5F7]">
      {/* ===================== HERO SECTION ===================== */}
      <section id="hero" className="relative min-h-[95vh] flex flex-col justify-between pt-32 sm:pt-40 pb-16 sm:pb-24 overflow-hidden">
        {/* Luminous Purple & Violet Ambient Lighting Blooms */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-600/12 rounded-full blur-[130px] pointer-events-none -z-10" />

        <Container className="relative z-10 w-full flex-1 flex flex-col justify-between">
          {/* Main Hero Spatial Composition */}
          <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Brand Logo & Category Badge */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-black/80 border border-purple-500/40 p-1 shadow-[0_0_20px_rgba(168,85,247,0.35)] flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="CXRNER MUSIC"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full p-0.5"
                    priority
                  />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>МУЗЫКАЛЬНЫЙ ЛЕЙБЛ И ДИСТРИБУЦИЯ</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="font-heavy text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-[0.88] text-white uppercase select-none">
                CXRNER <br />
                <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-white bg-clip-text text-transparent">
                  MUSIC
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-4 font-gothic text-lg sm:text-xl md:text-2xl text-purple-200 tracking-wide uppercase font-bold">
                Твой трек на всех цифровых витринах мира
              </p>

              {/* Factual human description */}
              <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed font-sans">
                Выпускаем музыку независимых артистов в Яндекс Музыку, VK Музыку, Spotify,
                Apple Music и еще на 150+ стримингов. Прозрачная модель роялти 70/30, оперативная
                модерация за 24–72 часа и персональный кабинет артиста.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/submit-release"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] active:scale-95 transition duration-200"
                >
                  <span>ОТПРАВИТЬ РЕЛИЗ</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="https://music.yandex.ru/label/5978511"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-semibold bg-white/10 hover:bg-white/15 border border-purple-500/30 text-white hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition duration-200"
                >
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>ЯНДЕКС МУЗЫКА</span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                </a>
              </div>

              {/* Key Guarantees & Features */}
              <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>70/30 роялти</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>24–72ч старт</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>150+ стримингов</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Питчинг</span>
                </div>
              </div>
            </div>

            {/* Right Dominant 1-Disc 3D Centerpiece */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              {/* Single Solid 3D Vinyl Record */}
              <div className="w-full relative aspect-square max-w-[500px] lg:max-w-[560px]">
                <VinylCanvas
                  featuredTitle={
                    !featured.title?.toLowerCase().includes("breakthroug")
                      ? featured.title
                      : "The Sadness of Reality"
                  }
                  featuredArtist={
                    !featured.title?.toLowerCase().includes("breakthroug")
                      ? featured.artist
                      : "Neimeks"
                  }
                  featuredCover={
                    !featured.title?.toLowerCase().includes("breakthroug") && featured.cover
                      ? featured.cover
                      : "/covers/the-sadness-of-reality.jpg"
                  }
                />
              </div>

              {/* Audio Waveform Player with real Yandex link */}
              <div className="w-full mt-6 max-w-[500px]">
                <InteractiveAudioPreview
                  track={{
                    title: "The Sadness of Reality",
                    artist: "Neimeks",
                    cover: "/covers/the-sadness-of-reality.jpg",
                    audioSrc: "/audio/the-sadness-of-reality.mp3",
                    yandexUrl: "https://music.yandex.ru/album/44422385?utm_source=web&utm_medium=copy_link",
                    artistUrl: "https://music.yandex.ru/artist/25572730",
                    genre: "Phonk / Electronic",
                  }}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent my-6" />

      {/* ===================== STATS BAR ===================== */}
      <section className="relative py-16 sm:py-20 border-y border-purple-500/20 bg-[#090912]/20 backdrop-blur-sm">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <ScrollReveal key={stat.label} delay={idx * 100}>
                <div className="p-4 rounded-2xl bg-[#0e0e1a]/50 border border-white/5 hover:border-purple-500/30 transition duration-300">
                  <p className="font-heavy text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                    {stat.display ?? <Counter to={stat.value} suffix={stat.suffix} />}

                  </p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-purple-300 font-medium">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent my-8" />

      {/* ===================== RELEASES SHOWCASE ===================== */}
      <section id="releases" className="py-20 sm:py-28 relative">
        <Container>
          <ScrollReveal>
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-widest text-purple-400">
                  <Disc className="w-4 h-4 text-purple-400" />
                  <span>КАТАЛОГ РЕЛИЗОВ</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gothic uppercase tracking-wide">
                  Свежие релизы лейбла
                </h2>
                <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-xl font-sans">
                  Слушайте новые треки резидентов CXRNER MUSIC на Яндекс Музыке, Spotify, Apple Music и VK.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://music.yandex.ru/label/5978511"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-mono text-xs uppercase tracking-wider transition duration-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                >
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>Все треки на Яндекс Музыке ↗</span>
                </a>

                <Link
                  href="/submit-release"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider font-bold transition duration-300 shadow-md"
                >
                  <span>Выпустить трек</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ReleasesCatalog initialReleases={releases} />
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-8" />

      {/* ===================== WORKFLOW / PROCESS ===================== */}
      <section className="py-20 sm:py-28 relative bg-transparent border-y border-purple-500/15">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-400 block mb-2">
                КАК ЭТО РАБОТАЕТ
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gothic uppercase tracking-wide">
                4 простых шага до релиза
              </h2>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 font-sans">
                От отправки трека до появления на стримингах и первых официальных выплат.
              </p>
            </div>
          </ScrollReveal>

          <WorkflowSection />

          <ScrollReveal delay={200}>
            <div className="mt-14 text-center">
              <Link
                href="/submit-release"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.35)] active:scale-95 transition"
              >
                <span>Перейти к отправке трека</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent my-8" />

      {/* ===================== ARTISTS ROSTER ===================== */}
      <section id="artists" className="py-20 sm:py-28 relative bg-transparent">
        <Container>
          <ScrollReveal>
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-purple-400 block mb-2">
                  АРТИСТЫ
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gothic uppercase tracking-wide">
                  Резиденты CXRNER MUSIC
                </h2>
                <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-xl font-sans">
                  Музыканты, которые сотрудничают с нами и собирают сотни тысяч прослушиваний.
                </p>
              </div>

              <a
                href="https://t.me/moder_cxrner_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 font-mono text-xs uppercase tracking-wider transition duration-300 w-fit"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Стать резидентом лейбла ↗</span>
              </a>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists.map((artist, idx) => (
              <ScrollReveal key={artist.id} delay={idx * 70}>
                <div className="group rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between bg-[#0b0b18]/70 backdrop-blur-md hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-500/30 group-hover:border-purple-400 transition duration-300">
                        <Image
                          src={encodeURI(artist.avatar)}
                          alt={artist.name}
                          fill
                          sizes="64px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-gothic font-bold text-white text-lg group-hover:text-purple-300 transition truncate">
                          {artist.name}
                        </h3>
                        <p className="font-mono text-xs text-purple-400 font-medium mt-0.5">
                          {artist.listeners} слушателей
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {artist.bio}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">РЕЗИДЕНТ</span>
                    {artist.links && artist.links[0] ? (
                      <a
                        href={artist.links[0].href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-purple-400 hover:text-purple-300 transition"
                      >
                        <span>Яндекс Музыка</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <a
                        href="https://music.yandex.ru/label/5978511"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-purple-400 hover:text-purple-300 transition"
                      >
                        <span>Профиль ↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-8" />

      {/* ===================== SERVICES / ADVANTAGES ===================== */}
      <section id="services" className="py-20 sm:py-28 relative bg-transparent border-y border-purple-500/15">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-400 block mb-2">
                ВОЗМОЖНОСТИ
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gothic uppercase tracking-wide">
                Сервисы полного цикла
              </h2>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 font-sans">
                Всё необходимое для успешного релиза, продвижения и юридической защиты вашего творчества.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <ScrollReveal key={service.title} delay={idx * 80}>
                <div className="group rounded-2xl p-7 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 bg-[#0d0d1a]/70 backdrop-blur-md relative overflow-hidden hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:text-white group-hover:bg-purple-600/30 transition duration-300 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                    <Sparkles className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                  </div>
                  <h3 className="font-gothic text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition">{service.title}</h3>
                  <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                    {service.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent my-8" />

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="py-20 sm:py-28 relative bg-transparent">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-400 block mb-2">
                ОТЗЫВЫ АРТИСТОВ
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gothic uppercase tracking-wide">
                Что говорят артисты лейбла
              </h2>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 font-sans">
                Реальный опыт работы, скорость модерации и уровень поддержки.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((item, idx) => (
              <ScrollReveal key={item.name} delay={idx * 100}>
                <div className="h-full rounded-2xl p-7 sm:p-8 border border-purple-500/20 hover:border-purple-500/45 transition-all duration-300 bg-[#0c0c18]/70 backdrop-blur-md flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]">
                  <div>
                    <Quote className="w-8 h-8 text-purple-500/40 mb-3 group-hover:text-purple-400 transition duration-300" />
                    <p className="text-sm sm:text-base leading-relaxed text-neutral-200 font-sans italic">
                      «{item.quote}»
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-5 mt-6 border-t border-white/10">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30 flex-shrink-0 group-hover:border-purple-400 transition">
                      <Image
                        src={item.avatar}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-gothic font-bold text-white text-base tracking-wide group-hover:text-purple-300 transition">
                        {item.name}
                      </p>
                      <p className="font-mono text-xs text-purple-400 mt-0.5">
                        Артист CXRNER MUSIC
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Smooth Ambient Transition Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-8" />

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="py-20 sm:py-28 relative bg-[#08080f]/30 backdrop-blur-sm border-t border-purple-500/15">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-400 block mb-2">
                ВОПРОСЫ И ОТВЕТЫ
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gothic uppercase tracking-wide">
                Часто задаваемые вопросы
              </h2>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 font-sans">
                Всё, что важно знать перед отправкой первого трека на лейбл.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <FaqAccordion items={faqItems} />
          </ScrollReveal>
        </Container>
      </section>

      {/* ===================== FINAL CALL-TO-ACTION ===================== */}
      <section className="py-20 sm:py-28 relative">
        <Container>
          <ScrollReveal scale={0.97}>
            <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 lg:p-16 border border-purple-500/35 bg-gradient-to-b from-[#181030]/80 via-[#100a22]/70 to-[#07050e]/80 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.25)] text-center">
              {/* Backlight Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-500/25 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider text-purple-300 mb-5 border border-purple-500/40 bg-purple-500/15">
                  ТВОЙ СЛЕДУЮЩИЙ РЕЛИЗ
                </span>

                <h2 className="font-gothic text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase">
                  ГОТОВ ВЫПУСТИТЬ ТРЕК? <br />
                  <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-white bg-clip-text text-transparent">
                    ПРИСОЕДИНЯЙСЯ К ЛЕЙБЛУ
                  </span>
                </h2>

                <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-xl mx-auto leading-relaxed font-sans">
                  Отправьте заявку через сайт или официальный Telegram-бот.
                  Команда модерации оценит трек и свяжется с вами в течение 24–72 часов.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/submit-release"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] active:scale-95 transition"
                  >
                    <span>Отправить трек на лейбл</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="https://t.me/moder_cxrner_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-medium border border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 hover:text-white transition"
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
