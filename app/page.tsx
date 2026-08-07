import Image from "next/image";
import Link from "next/link";
import Container from "../components/Container";
import Reveal from "../components/Reveal";
import GlowButton from "../components/GlowButton";
import Counter from "../components/Counter";
import SectionHeader from "../components/SectionHeader";
import Faq from "../components/Faq";
import { faqItems, services, stats, testimonials, whyUs } from "../data/site";
import { getArtists } from "../lib/artists";
import { getFeaturedRelease } from "../lib/featured";
import { getReleases } from "../lib/releases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [featured, releases, artists] = await Promise.all([getFeaturedRelease(), getReleases(), getArtists()]);
  const isRemoteCover = featured.cover.startsWith("http");

  return (
    <main>
      <section id="hero" className="hero-section relative overflow-hidden">
        <Container className="section-padding pt-28 md:pt-40">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div className="max-w-2xl">
              <Reveal><p className="eyebrow">Независимый лейбл · глобальная сцена</p></Reveal>
              <Reveal delay={0.04}>
                <h1 className="mt-5 font-display text-[clamp(2.75rem,7vw,5.9rem)] font-semibold leading-[.98] tracking-[-.05em] text-white">
                  Музыка, которая <span className="gradient-text">находит своих.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-7 max-w-xl text-base leading-7 text-white/65 md:text-lg">CXRNER MUSIC помогает артистам выпускать музыку, расти и звучать уверенно — от первого питча до глобальных платформ.</p>
              </Reveal>
              <Reveal delay={0.14}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <GlowButton href="https://t.me/moder_cxrner_bot" external variant="primary">Отправить релиз <span aria-hidden>↗</span></GlowButton>
                  <GlowButton href="#releases" variant="ghost">Слушать релизы</GlowButton>
                </div>
              </Reveal>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/50">
                <span><i className="status-dot bg-neon" /> Дистрибуция по миру</span>
                <span><i className="status-dot bg-aqua" /> Питчинг редакторам</span>
                <span><i className="status-dot bg-magenta" /> Прозрачные выплаты</span>
              </div>
            </div>
            <Reveal delay={0.12} y={24}>
              <div className="feature-card group">
                <div className="feature-art relative aspect-square overflow-hidden rounded-[1.35rem]">
                  {isRemoteCover ? <img src={featured.cover} alt={`Обложка релиза ${featured.title}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <Image src={featured.cover} alt={`Обложка релиза ${featured.title}`} fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover transition duration-700 group-hover:scale-105" priority />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                    <div><p className="text-xs uppercase tracking-[.28em] text-white/55">Новинка недели</p><p className="mt-2 text-2xl font-semibold text-white">{featured.title}</p><p className="text-white/65">{featured.artist}</p></div>
                    <span className="rounded-full border border-white/20 bg-black/25 px-3 py-2 text-xs text-white/75 backdrop-blur">CXRNER</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="about" className="section-padding pt-8 md:pt-16"><Container><div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><SectionHeader eyebrow="О лейбле" title="Свобода быть собой." description="Мы соединяем андеграундную энергию и современную индустрию — без шаблонов и лишнего шума." /><Reveal><p className="glass rounded-2xl p-6 text-base leading-7 text-white/65">Сопровождаем артистов от идеи и релиза до продвижения, сохраняя характер музыки. В фокусе — честная коммуникация, сильный визуальный образ и понятный рост.</p></Reveal></div></Container></section>

      <section id="stats" className="section-padding pt-0"><Container><div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{stats.map((stat, index) => <Reveal key={stat.label} delay={index * .04}><div className="stat-card"><p className="font-display text-3xl font-semibold text-white md:text-4xl">{stat.display ?? <Counter to={stat.value} suffix={stat.suffix} />}</p><p className="mt-2 text-xs uppercase tracking-[.18em] text-white/45 md:text-sm">{stat.label}</p></div></Reveal>)}</div></Container></section>

      <section id="why" className="section-padding"><Container><SectionHeader eyebrow="Почему мы" title="Собираем всё важное в одном месте." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{whyUs.map((item, index) => <Reveal key={item.title} delay={index * .04}><article className="info-card"><span className="card-number">0{index + 1}</span><h3 className="mt-10 text-lg font-semibold text-white">{item.title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{item.description}</p></article></Reveal>)}</div></Container></section>

      <section id="releases" className="section-padding"><Container><SectionHeader eyebrow="Релизы" title="Слушай новое." description="Свежие релизы артистов CXRNER MUSIC на любимых платформах." rightSlot={<GlowButton href="https://t.me/moder_cxrner_bot" external variant="ghost">Стать артистом ↗</GlowButton>} /><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{releases.map((release, index) => { const remote = release.cover.startsWith("http"); return <Reveal key={`${release.title}-${index}`} delay={index * .04}><article className="release-card group"><div className="relative aspect-square overflow-hidden rounded-2xl">{remote ? <img src={release.cover} alt={`${release.title} — ${release.artist}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <Image src={release.cover} alt={`${release.title} — ${release.artist}`} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />}</div><div className="mt-4"><p className="text-lg font-semibold text-white">{release.title}</p><p className="text-sm text-white/50">{release.artist}</p><div className="mt-3 flex flex-wrap gap-2">{release.links.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="platform-link">{link.label}</a>)}</div></div></article></Reveal> })}</div></Container></section>

      <section id="services" className="section-padding"><Container><SectionHeader eyebrow="Сервисы" title="Полный цикл для артиста." /><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service, index) => <Reveal key={service.title} delay={index * .04}><article className="service-card"><span className="service-icon">✦</span><h3 className="text-lg font-semibold text-white">{service.title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{service.description}</p></article></Reveal>)}</div></Container></section>

      <section id="artists" className="section-padding"><Container><SectionHeader eyebrow="Артисты" title="Лица нашего звучания." description="Открывай артистов CXRNER MUSIC и переходи в их профиль." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{artists.map((artist, index) => <Reveal key={artist.id} delay={index * .03}><Link href={`/artists/${artist.id}`} className="artist-card group"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15"><Image src={encodeURI(artist.avatar)} alt={artist.name} fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-110" /></div><div className="min-w-0"><p className="font-semibold text-white">{artist.name}</p><p className="mt-1 text-xs text-white/45">{artist.listeners} слушателей / месяц</p><p className="mt-2 truncate text-xs text-white/40">{artist.bio}</p></div><span className="ml-auto text-white/30 transition group-hover:text-neon">↗</span></Link></Reveal>)}</div></Container></section>

      <section id="testimonials" className="section-padding"><Container><SectionHeader eyebrow="Отзывы" title="Артисты говорят за нас." /><div className="mt-10 grid gap-4 lg:grid-cols-2">{testimonials.map((item, index) => <Reveal key={item.name} delay={index * .04}><article className="quote-card"><div className="flex items-center gap-4"><div className="relative h-12 w-12 overflow-hidden rounded-full"><Image src={item.avatar} alt={item.name} fill sizes="48px" className="object-cover" /></div><div><p className="font-semibold text-white">{item.name}</p><p className="text-xs text-neon">Артист CXRNER MUSIC</p></div></div><p className="mt-5 text-sm leading-7 text-white/65">“{item.quote}”</p></article></Reveal>)}</div></Container></section>

      <section id="faq" className="section-padding"><Container><SectionHeader eyebrow="FAQ" title="Частые вопросы." description="Коротко отвечаем на главное о релизах, промо и сотрудничестве." /><div className="mt-10"><Faq items={faqItems} /></div></Container></section>

      <section id="join" className="section-padding pt-8"><Container><Reveal><div className="cta-card"><p className="eyebrow">Готовы к следующему релизу?</p><h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">Твоя музыка. Твоя история. <span className="gradient-text">Твоя сцена.</span></h2><p className="mt-5 max-w-xl text-white/60">Отправь релиз в Telegram — ответим в течение 24 часов.</p><div className="mt-8"><GlowButton href="https://t.me/moder_cxrner_bot" external variant="primary">Отправить релиз ↗</GlowButton></div></div></Reveal></Container></section>
    </main>
  );
}
