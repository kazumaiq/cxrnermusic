import type { Metadata } from "next";
import Container from "../../components/Container";
import Reveal from "../../components/Reveal";

export const metadata: Metadata = {
  title: "Контакты — CXRNER MUSIC",
  description: "Контакты лейбла CXRNER MUSIC: email и Telegram.",
};

export default function ContactPage() {
  return (
    <section className="section-padding">
      <Container>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Контакты</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl font-display">Свяжитесь с нами</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-base text-white/70">
            Напишите нам, если хотите отправить релиз, получить консультацию или обсудить партнерство.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="glass rounded-2xl p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Email</p>
              <a
                href="mailto:cxrner.label@gmail.com"
                className="mt-3 block text-lg font-semibold text-white hover:text-neon"
              >
                cxrner.label@gmail.com
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="glass rounded-2xl p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Telegram</p>
              <a
                href="https://t.me/kazumaiq"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-lg font-semibold text-white hover:text-neon"
              >
                @kazumaiq
              </a>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
