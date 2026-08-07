import type { Metadata } from "next";
import Container from "../../components/Container";
import Reveal from "../../components/Reveal";

export const metadata: Metadata = { title: "Контакты — CXRNER MUSIC", description: "Контакты лейбла CXRNER MUSIC: email и Telegram." };

export default function ContactPage() {
  return <main className="section-padding pt-32"><Container><Reveal><p className="eyebrow">Контакты</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-white md:text-7xl">Свяжитесь с нами</h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/65">Напишите нам, если хотите отправить релиз, получить консультацию или обсудить партнёрство.</p></Reveal><div className="mt-10 grid gap-4 md:grid-cols-2"><Reveal><a href="mailto:cxrner.label@gmail.com" className="info-card block"><p className="text-xs uppercase tracking-[.25em] text-white/40">Email</p><p className="mt-4 text-lg font-semibold text-white transition group-hover:text-neon">cxrner.label@gmail.com</p></a></Reveal><Reveal delay={.05}><a href="https://t.me/kazumaiq" target="_blank" rel="noopener noreferrer" className="info-card block"><p className="text-xs uppercase tracking-[.25em] text-white/40">Telegram</p><p className="mt-4 text-lg font-semibold text-white">@kazumaiq ↗</p></a></Reveal></div></Container></main>;
}
