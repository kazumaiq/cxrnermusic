import Image from "next/image";
import Container from "../components/Container";
import Reveal from "../components/Reveal";
import RevealText from "../components/RevealText";
import GlowButton from "../components/GlowButton";
import Counter from "../components/Counter";
import ParallaxOrbs from "../components/ParallaxOrbs";
import SectionHeader from "../components/SectionHeader";
import Faq from "../components/Faq";
import { artists, faqItems, services, stats, testimonials, whyUs } from "../data/site";
import { getFeaturedRelease } from "../lib/featured";
import { getReleases } from "../lib/releases";

export default async function HomePage() {
  const featured = await getFeaturedRelease();
  const releases = await getReleases();
  const isRemoteCover = featured.cover.startsWith("http");

  return (
    <>
      <section id="hero" className="relative overflow-hidden">
        <ParallaxOrbs />
        <Container className="section-padding">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Reveal>
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-neon/80">
                  <Image src="/images/logo.png" alt="Логотип CXRNER MUSIC" width={40} height={40} className="h-10 w-10" />
                  CXRNER MUSIC
                </div>
              </Reveal>
              <RevealText
                as="h1"
                text="Независимый музыкальный лейбл и дистрибуция"
                className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl font-display text-glow"
              />
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-base text-white/70 md:text-lg">
                  Мы соединяем артистов с мировой аудиторией: релизы, плейлистинг, маркетинг и монетизация в одном месте.
                </p>
              </Reveal>
              <div className="mt-8 flex flex-wrap gap-4">
                <GlowButton
                  href="https://t.me/moder_cxrner_bot"
                  external
                  variant="primary"
                  aria-label="Отправить релиз в Telegram"
                >
                  Отправить релиз
                </GlowButton>
                <GlowButton href="/#releases" variant="ghost" aria-label="Смотреть релизы">
                  Смотреть релизы
                </GlowButton>
              </div>
              <Reveal delay={0.2}>
                <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-neon" />
                    Глобальная дистрибуция
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-aqua" />
                    Редакционный питчинг
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-magenta" />
                    Монетизация контента
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl p-6 neon-border">
                <div className="relative aspect-square overflow-hidden rounded-2xl">
                  {isRemoteCover ? (
                    <img src={featured.cover} alt="Обложка релиза" className="h-full w-full object-cover" />
                  ) : (
                    <Image
                      src={featured.cover}
                      alt="Обложка релиза"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      priority
                    />
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{featured.title}</p>
                    <p className="text-sm text-white/60">{featured.artist}</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
                    Новинка
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 animate-float rounded-full bg-neon/20 blur-2xl md:block" />
            </div>
          </div>
        </Container>
      </section>

      <section id="about" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="О лейбле"
            title="CXRNER MUSIC — стиль, атмосфера, индивидуальность"
            description="Независимый музыкальный лейбл на стыке андеграунда и современной сцены."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="glass rounded-2xl p-6 text-base text-white/75">
                CXRNER MUSIC — независимый музыкальный лейбл, работающий на стыке андеграунда и современной сцены. Мы
                делаем упор на стиль, атмосферу и индивидуальность, а не на шаблоны и тренды.
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="glass rounded-2xl p-6 text-base text-white/75">
                Сопровождаем артистов от релиза до продвижения, сохраняя характер и честность музыки.
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="stats" className="section-padding">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 0.05}>
                <div className="glass glow-hover rounded-2xl px-6 py-8 text-center">
                  <p className="text-3xl font-semibold text-white">
                    {stat.display ? (
                      <span>{stat.display}</span>
                    ) : (
                      <Counter to={stat.value} suffix={stat.suffix} />
                    )}
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/60">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="why" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="Почему мы"
            title="Коротко о главном"
            description="Четыре причины, почему артисты выбирают CXRNER MUSIC."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05} scale={0.98} blur={6}>
                <div className="glass glow-hover rounded-2xl p-6">
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm text-white/70">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="releases" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="Релизы"
            title="Витрина свежих релизов"
            description="Эстетика, саунд и данные — всё, чтобы релиз выглядел и звучал премиально."
            rightSlot={
              <GlowButton href="https://t.me/moder_cxrner_bot" external variant="ghost">
                Отправить релиз
              </GlowButton>
            }
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {releases.map((release, index) => {
              const isRemote = release.cover.startsWith("http");
              return (
                <Reveal key={`${release.title}-${index}`} delay={index * 0.05} blur={6}>
                  <div className="glass glow-hover group rounded-3xl p-4 transition hover:-translate-y-1 hover:shadow-glow">
                    <Reveal className="relative aspect-square overflow-hidden rounded-2xl" y={0} scale={0.92} blur={0}>
                      {isRemote ? (
                        <img
                          src={release.cover}
                          alt={`${release.title} — ${release.artist}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={release.cover}
                          alt={`${release.title} — ${release.artist}`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                    </Reveal>
                    <div className="mt-4">
                      <p className="text-lg font-semibold text-white">{release.title}</p>
                      <p className="text-sm text-white/60">{release.artist}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {release.links.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:border-neon hover:text-white"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="testimonials" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="Отзывы"
            title="Артисты о работе с CXRNER MUSIC"
            description="Реальные отзывы артистов о модерации, поддержке и релизах."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 0.05} blur={6}>
                <div className="glass glow-hover rounded-3xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/10">
                      <Image src={item.avatar} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Артист</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-white/75 leading-relaxed">{item.quote}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="services" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="Сервисы"
            title="Полный цикл для артистов"
            description="От дистрибуции до TikTok — команда CXRNER MUSIC закрывает весь цикл релиза и роста."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.05} blur={6}>
                <div className="glass glow-hover rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-glow">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-neon" />
                    <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-white/70">{service.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="artists" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="Артисты лейбла"
            title="Комьюнити артистов CXRNER MUSIC"
            description="Актуальные слушатели в месяц и артисты, которые создают наше звучание."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist, index) => (
              <Reveal key={artist.name} delay={index * 0.05} blur={6}>
                <div className="glass glow-hover flex items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-glow">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/10">
                    <Image
                      src={encodeURI(artist.avatar)}
                      alt={artist.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{artist.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Слушателей в месяц</p>
                    <p className="mt-1 text-sm text-white/70">{artist.listeners}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="faq" className="section-padding">
        <Container>
          <SectionHeader
            eyebrow="FAQ"
            title="Частые вопросы"
            description="Ответы на основные вопросы по релизам, промо и условиям сотрудничества."
          />
          <div className="mt-10">
            <Faq items={faqItems} />
          </div>
        </Container>
      </section>

      <section id="join" className="section-padding">
        <Container>
          <Reveal>
            <div className="glass rounded-3xl p-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-neon/80">Присоединиться</p>
              <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl font-display">
                Хочешь выпустить релиз на CXRNER MUSIC?
              </h2>
              <p className="mt-4 text-base text-white/70">
                Заполни короткую заявку и отправь релиз в Telegram — мы ответим в течение 24 часов.
              </p>
              <div className="mt-8 flex justify-center">
                <GlowButton href="https://t.me/moder_cxrner_bot" external variant="primary">
                  Отправить релиз
                </GlowButton>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
