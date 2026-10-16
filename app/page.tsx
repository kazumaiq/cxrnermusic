import Image from "next/image";
import Link from "next/link";
import Container from "../components/Container";
import Reveal from "../components/Reveal";
import GlowButton from "../components/GlowButton";
import Counter from "../components/Counter";
import SectionHeader from "../components/SectionHeader";
import VinylCanvas from "../components/3d/VinylCanvas";
import InteractiveAudioPreview from "../components/InteractiveAudioPreview";
import ReleasesCatalog from "../components/ReleasesCatalog";
import WorkflowSection from "../components/WorkflowSection";
import FaqAccordion from "../components/FaqAccordion";
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
} from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, releases, artists] = await Promise.all([
    getFeaturedRelease(),
    getReleases(),
    getArtists(),
  ]);

  return (
    <div className="relative overflow-hidden">
      {/* ===================== HERO SECTION ===================== */}
      <section id="hero" className="relative min-h-[90vh] flex items-center pt-28 sm:pt-36 pb-16 lg:pb-24">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-7 z-10">
              {/* Technical Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full tech-badge font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-neutral-300 mb-6 border border-white/20 bg-black/60">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>[CXR::RECORDINGS // GLOBAL_DISTRIBUTION]</span>
                <span className="text-neutral-600">|</span>
                <span className="text-white">150+ DSP</span>
              </div>

              {/* Massive Bold Heading */}
              <h1 className="font-gothic text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] text-white uppercase">
                ЗВУК, КОТОРЫЙ <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                  МЕНЯЕТ РЕАЛЬНОСТЬ.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-sm sm:text-base md:text-lg text-neutral-400 max-w-2xl leading-relaxed font-sans">
                CXRNER MUSIC — международный независимый лейбл для артистов с бескомпромиссным характером.
                Мы берем на себя прямую цифровую доставку, официальный ISRC/UPC кодинг, питчинг в редакторские плейлисты
                и честные выплаты роялти 70/30.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/submit-release"
                  className="btn-void-primary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold shadow-[0_0_25px_rgba(255,255,255,0.18)] active:scale-95 transition duration-300"
                >
                  <span>Отправить релиз</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#releases"
                  className="btn-void-ghost inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-medium border border-white/20 text-neutral-300 hover:text-white hover:border-white transition duration-300"
                >
                  <Disc className="w-4 h-4 text-neutral-400" />
                  <span>Каталог музыки</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-[11px] text-neutral-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white flex-shrink-0" />
                  <span>Роялти 70/30 артисту</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-white flex-shrink-0" />
                  <span>Модерация 24–72 ч</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Headphones className="w-4 h-4 text-white flex-shrink-0" />
                  <span>Редакционный питчинг</span>
                </div>
              </div>
            </div>

            {/* Right 3D Visual Centerpiece */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              <div className="w-full max-w-[500px]">
                <VinylCanvas
                  featuredTitle={featured.title}
                  featuredArtist={featured.artist}
                  featuredCover={featured.cover}
                />
              </div>

              {/* Audio Preview Bar below 3D Vinyl */}
              <div className="w-full mt-4 max-w-[500px]">
                <InteractiveAudioPreview
                  track={{
                    title: featured.title,
                    artist: featured.artist,
                    cover: featured.cover,
                    genre: "Phonk / Electronic",
                  }}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section className="relative py-8 border-y border-white/10 bg-[#070707] backdrop-blur-xl">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="p-3">
                <p className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {stat.display ?? <Counter to={stat.value} suffix={stat.suffix} />}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== RELEASES SHOWCASE ===================== */}
      <section id="releases" className="section-padding relative">
        <Container>
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

          <ReleasesCatalog initialReleases={releases} />
        </Container>
      </section>

      {/* ===================== WORKFLOW / PROCESS ===================== */}
      <section className="section-padding relative bg-[#070707] border-y border-white/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// ПРОЦЕСС</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
              Как выпустить трек через CXRNER
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-sans">
              От заполнения анкеты до появления релиза на 150+ платформах и официальных выплат.
            </p>
          </div>

          <WorkflowSection />

          <div className="mt-10 text-center">
            <Link
              href="/submit-release"
              className="btn-void-primary inline-flex items-center gap-2 px-8 py-4 rounded-full font-mono text-xs sm:text-sm uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 transition"
            >
              <span>Перейти к подаче заявки</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ===================== ARTISTS ROSTER ===================== */}
      <section id="artists" className="section-padding relative">
        <Container>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group dark-panel rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-4 bg-[#0a0a0a]"
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
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== SERVICES / BENTO GRID ===================== */}
      <section id="services" className="section-padding relative bg-[#070707] border-y border-white/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// ВОЗМОЖНОСТИ</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
              Сервисы полного цикла для артиста
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-sans">
              Всё, что необходимо для успешного релиза, мирового продвижения и защиты ваших прав.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => (
              <div
                key={service.title}
                className="group dark-panel rounded-2xl p-6 border border-white/10 hover:border-white/25 transition-all duration-300 bg-[#0a0a0a]"
              >
                <div className="w-11 h-11 rounded-lg bg-black border border-white/15 flex items-center justify-center text-white group-hover:border-white/40 transition duration-300 mb-5">
                  <Sparkles className="w-5 h-5 text-neutral-300 group-hover:text-white" />
                </div>
                <h3 className="font-gothic text-lg font-bold text-white mb-2">{service.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="section-padding relative">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// ОТЗЫВЫ</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
              Что говорят артисты лейбла
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-sans">
              Реальный опыт сотрудничества, оперативной модерации и надежной поддержки.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="dark-panel rounded-2xl p-6 border border-white/10 hover:border-white/25 transition flex flex-col justify-between bg-[#0a0a0a]"
              >
                <p className="text-sm leading-relaxed text-neutral-300 italic mb-6 font-sans">
                  «{item.quote}»
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-black">
                    <Image src={item.avatar} alt={item.name} fill sizes="40px" className="object-cover grayscale" />
                  </div>
                  <div>
                    <p className="font-gothic font-bold text-white text-sm">{item.name}</p>
                    <p className="font-mono text-[11px] text-neutral-500 uppercase tracking-wider">Артист CXRNER MUSIC</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="section-padding relative bg-[#070707] border-t border-white/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">// FAQ</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-white font-gothic uppercase tracking-wide">
              Часто задаваемые вопросы
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-sans">
              Всё, что вам нужно знать перед отправкой первого трека на лейбл.
            </p>
          </div>

          <FaqAccordion items={faqItems} />
        </Container>
      </section>

      {/* ===================== FINAL CALL-TO-ACTION ===================== */}
      <section className="section-padding relative">
        <Container>
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 border border-white/20 bg-gradient-to-b from-[#121212] to-[#070707] shadow-2xl text-center">
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
        </Container>
      </section>
    </div>
  );
}
