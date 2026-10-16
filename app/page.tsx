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
      <section id="hero" className="relative min-h-[92vh] flex items-center pt-28 sm:pt-36 pb-16 lg:pb-24">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-7 z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-badge border border-neon/30 text-white/90 text-xs font-semibold tracking-wider uppercase mb-6 shadow-glow">
                <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
                <span>GLOBAL RECORD LABEL 2.0</span>
                <span className="text-white/30">|</span>
                <span className="text-aqua">150+ СТРИМИНГОВ</span>
              </div>

              {/* Massive Bold Heading */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
                МУЗЫКА, КОТОРАЯ <br className="hidden sm:inline" />
                <span className="brand-gradient-text neon-text-glow">
                  ЗАХВАТЫВАЕТ МИР.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-sm sm:text-base md:text-lg text-white/70 max-w-2xl leading-relaxed font-body">
                CXRNER MUSIC — международный независимый лейбл для артистов с характером.
                Мы берем на себя быструю цифровую отгрузку, питчинг в редакторские плейлисты
                и монетизацию, пока вы создаете звук будущего.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/submit-release"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-neon via-magenta to-aqua text-night font-bold text-sm sm:text-base uppercase tracking-wider shadow-glow hover:shadow-glowStrong hover:scale-105 active:scale-95 transition duration-300"
                >
                  <Sparkles className="w-4 h-4 fill-night" />
                  Отправить релиз
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#releases"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass-badge border border-white/15 text-white font-semibold text-sm sm:text-base hover:bg-white/10 hover:border-neon/40 transition duration-300"
                >
                  <Disc className="w-4 h-4 text-aqua" />
                  Каталог релизов
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-aqua flex-shrink-0" />
                  <span>Роялти 70/30 в пользу артиста</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-neon flex-shrink-0" />
                  <span>Модерация за 1–3 дня</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Headphones className="w-4 h-4 text-magenta flex-shrink-0" />
                  <span>Редакционный плейлистинг</span>
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

              {/* Quick Audio Preview Bar below 3D Vinyl */}
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
      <section className="relative py-8 border-y border-white/10 bg-nightSurface/50 backdrop-blur-xl">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="p-3">
                <p className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white brand-gradient-text">
                  {stat.display ?? <Counter to={stat.value} suffix={stat.suffix} />}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50 font-semibold">
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
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-aqua">Каталог музыки</p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display">
                Свежие релизы лейбла
              </h2>
              <p className="mt-2 text-sm text-white/60 max-w-xl">
                Открывайте новые треки артистов CXRNER MUSIC на всех мировых стримингах.
              </p>
            </div>

            <Link
              href="/submit-release"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-badge border border-neon/40 text-xs font-semibold uppercase tracking-wider text-neonSoft hover:bg-neon/15 hover:text-white transition duration-300 w-fit"
            >
              <span>Выпустить свой трек</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ReleasesCatalog initialReleases={releases} />
        </Container>
      </section>

      {/* ===================== WORKFLOW / PROCESS ===================== */}
      <section className="section-padding relative bg-nightSurface/40 border-y border-white/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Простой путь</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display">
              Как выпустить трек через CXRNER
            </h2>
            <p className="mt-3 text-sm text-white/60">
              От заполнения анкеты до появления трека на стримингах и первой выплаты роялти.
            </p>
          </div>

          <WorkflowSection />

          <div className="mt-10 text-center">
            <Link
              href="/submit-release"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-neon to-aqua text-night font-bold text-xs sm:text-sm uppercase tracking-wider shadow-glow hover:shadow-glowStrong active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4 fill-night" />
              Перейти к подаче заявки
            </Link>
          </div>
        </Container>
      </section>

      {/* ===================== ARTISTS ROSTER ===================== */}
      <section id="artists" className="section-padding relative">
        <Container>
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-magenta">Резиденты</p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display">
                Артисты CXRNER MUSIC
              </h2>
              <p className="mt-2 text-sm text-white/60 max-w-xl">
                Музыканты, которые формируют узнаваемый стиль и звучание нашего лейбла.
              </p>
            </div>

            <a
              href="https://t.me/moder_cxrner_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-badge border border-white/15 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition duration-300 w-fit"
            >
              <Users className="w-3.5 h-3.5 text-aqua" />
              Стать резидентом лейбла ↗
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group glass-panel rounded-2xl p-4 border border-white/10 hover:border-aqua/40 hover:shadow-glowAqua transition-all duration-300 flex items-center gap-4"
              >
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/15 group-hover:border-neon group-hover:scale-105 transition duration-300">
                  <Image
                    src={encodeURI(artist.avatar)}
                    alt={artist.name}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-base group-hover:text-aqua transition truncate">
                    {artist.name}
                  </h3>
                  <p className="text-xs text-white/50 font-medium mt-0.5">
                    {artist.listeners} слушателей / мес
                  </p>
                  <p className="text-[11px] text-white/40 truncate mt-1">
                    {artist.bio}
                  </p>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-aqua group-hover:bg-aqua/10 transition">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== SERVICES / BENTO GRID ===================== */}
      <section id="services" className="section-padding relative bg-nightSurface/30 border-y border-white/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-aqua">Возможности</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display">
              Сервисы полного цикла для артиста
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Всё, что необходимо для успешного релиза, продвижения и защиты ваших прав.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="group glass-panel rounded-2xl p-6 border border-white/10 hover:border-neon/40 hover:shadow-glow transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-neon/20 to-aqua/20 border border-white/10 flex items-center justify-center text-neon group-hover:scale-110 group-hover:border-neon/50 transition duration-300 mb-5">
                  <Sparkles className="w-5 h-5 text-neon" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
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
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-magenta">Отзывы</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display">
              Что говорят артисты лейбла
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Реальный опыт сотрудничества, оперативной модерации и поддержки.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-white/20 transition flex flex-col justify-between"
              >
                <p className="text-sm leading-relaxed text-white/80 italic mb-6">
                  «{item.quote}»
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/15 bg-white/5">
                    <Image src={item.avatar} alt={item.name} fill sizes="40px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{item.name}</p>
                    <p className="text-xs text-neonSoft">Артист CXRNER MUSIC</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="section-padding relative bg-nightSurface/30 border-t border-white/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">FAQ</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display">
              Часто задаваемые вопросы
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Всё, что вам нужно знать перед отправкой первого трека на лейбл.
            </p>
          </div>

          <FaqAccordion items={faqItems} />
        </Container>
      </section>

      {/* ===================== FINAL CALL-TO-ACTION ===================== */}
      <section className="section-padding relative">
        <Container>
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 border border-neon/40 bg-gradient-to-br from-neon/20 via-nightSurface to-aqua/10 shadow-glowStrong text-center">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-neon/30 blur-[90px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge text-xs font-bold uppercase tracking-widest text-neon mb-4">
                <Sparkles className="w-3.5 h-3.5 text-neon" />
                Твой следующий хит
              </span>

              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Твоя музыка. Твоя история. <br />
                <span className="brand-gradient-text neon-text-glow">ТВОЙ РЕЛИЗ.</span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
                Отправь свой трек прямо сейчас через сайт или Telegram-бота.
                Команда модерации оценит материал и вернется с ответом в течение 24-72 часов.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/submit-release"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-neon via-magenta to-aqua text-night font-bold text-sm uppercase tracking-wider shadow-glow hover:scale-105 active:scale-95 transition"
                >
                  <Sparkles className="w-4 h-4 fill-night" />
                  Отправить трек на лейбл
                </Link>

                <a
                  href="https://t.me/moder_cxrner_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass-badge border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition"
                >
                  Открыть Telegram-бота ↗
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
