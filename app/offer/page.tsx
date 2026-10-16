import type { Metadata } from "next";
import Link from "next/link";
import Container from "../../components/Container";
import { FileText, ShieldCheck, Scale, ArrowLeft, Send } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Публичная оферта — CXRNER MUSIC",
  description: "Публичная оферта, правила цифровой дистрибуции и условия сотрудничества с лейблом CXRNER MUSIC.",
};

export default function OfferPage() {
  return (
    <div className="section-padding pt-28 sm:pt-36">
      <Container className="max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться на главную
          </Link>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full tech-badge font-mono text-[10px] uppercase tracking-widest text-neutral-300 mb-3 border border-white/15">
            <Scale className="w-3.5 h-3.5 text-white" />
            Юридический документ
          </span>
          <h1 className="font-gothic text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            Публичная оферта
          </h1>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Условия сотрудничества, цифровой дистрибуции, монетизации и распределения роялти 70/30 между лейблом CXRNER MUSIC и артистами.
          </p>
        </div>

        {/* Legal Paper Container */}
        <div className="dark-panel bg-[#0a0a0a] rounded-3xl p-6 sm:p-10 border border-white/10 space-y-8 text-sm leading-relaxed text-white/75">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 text-neutral-300">
              <span className="font-mono text-xs text-white/40">01.</span>
              Общие положения
            </h2>
            <p>
              1.1. Настоящая публичная оферта является официальным предложением независимого музыкального лейбла CXRNER MUSIC заключить договор цифровой дистрибуции и паблишинга на изложенных ниже условиях.
            </p>
            <p>
              1.2. Акцептом настоящей оферты признается направление артистом заявки на релиз через официальную форму сайта (<Link href="/submit-release" className="text-white hover:underline">cxrnermusic.vercel.app/submit-release</Link>) или официального Telegram-бота (<a href="https://t.me/moder_cxrner_bot" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline">@moder_cxrner_bot</a>).
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 text-white">
              <span className="font-mono text-xs text-white/40">02.</span>
              Предмет соглашения
            </h2>
            <p>
              2.1. CXRNER MUSIC принимает на себя обязательства по цифровой дистрибуции музыкального материала (синглов, EP, альбомов) на мировые стриминговые платформы (Spotify, Apple Music, VK Музыка, Яндекс Музыка, YouTube Music, Deezer, TikTok и др.), питчингу редакторам и сбору роялти.
            </p>
            <p>
              2.2. Артист гарантирует, что является законным правообладателем аудиоматериала, сэмплов, текстов и графических материалов (обложек), и что контент не нарушает авторские и смежные права третьих лиц.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 text-white">
              <span className="font-mono text-xs text-white/40">03.</span>
              Распределение роялти и выплаты (70/30)
            </h2>
            <p>
              3.1. Базовая модель распределения чистого дохода от цифрового стриминга и продажи треков составляет <strong>70% в пользу Артиста</strong> и 30% в пользу Лейбла.
            </p>
            <p>
              3.2. Выплаты производятся по квартальному графику начислений от DSP: <strong>15 марта, 15 июня, 15 сентября и 15 декабря</strong>, при условии предоставления актуальных платежных реквизитов.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 text-neutral-300">
              <span className="font-mono text-xs text-white/40">04.</span>
              Отказ от эксклюзивности каталога
            </h2>
            <p>
              4.1. Договор с CXRNER MUSIC не запрещает артисту выпускать другие свои музыкальные произведения через сторонние лейблы или самостоятельно, если на конкретные отгруженные треки не подписан отдельный эксклюзивный контракт.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 text-white">
              <span className="font-mono text-xs text-white/40">05.</span>
              Контакты и реквизиты
            </h2>
            <p>Официальный канал связи: <a href="https://t.me/kazumaiq" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline">@kazumaiq</a></p>
            <p>Email: <a href="mailto:cxrner.label@gmail.com" className="text-white hover:underline">cxrner.label@gmail.com</a></p>
            <p>Telegram-бот: <a href="https://t.me/moder_cxrner_bot" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline">@moder_cxrner_bot</a></p>
          </section>
        </div>
      </Container>
    </div>
  );
}
