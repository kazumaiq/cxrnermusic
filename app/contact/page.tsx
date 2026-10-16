import type { Metadata } from "next";
import Link from "next/link";
import Container from "../../components/Container";
import {
  Send,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Disc,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Контакты — CXRNER MUSIC",
  description: "Официальные контакты музыкального лейбла CXRNER MUSIC: Telegram, Email и поддержка артистов.",
};

export default function ContactPage() {
  return (
    <div className="section-padding pt-28 sm:pt-36">
      <Container className="max-w-4xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full tech-badge font-mono text-[10px] uppercase tracking-widest text-neutral-300 mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            [CXR::COMMUNICATIONS]
          </span>
          <h1 className="font-gothic text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Контакты лейбла
          </h1>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed font-sans">
            Есть вопросы по отгрузке трека, роялти или промо? Свяжитесь с нами напрямую
            через официальный Telegram или отправьте запрос по электронной почте.
          </p>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Channel 1: Telegram Bot */}
          <a
            href="https://t.me/moder_cxrner_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="group dark-panel rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between bg-[#0a0a0a]"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white mb-5 group-hover:border-white/40 transition duration-300">
                <Send className="w-5 h-5 text-neutral-300 group-hover:text-white" />
              </div>
              <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">
                // БОТ МОДЕРАЦИИ
              </p>
              <h3 className="font-gothic text-lg font-bold text-white group-hover:text-neutral-200 transition">
                @moder_cxrner_bot
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-sans">
                Подача заявок на дистрибуцию, проверка статуса треков и оперативная связь.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-neutral-500 group-hover:text-white">
              <span>Открыть бота</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
            </div>
          </a>

          {/* Channel 2: Founder Direct */}
          <a
            href="https://t.me/kazumaiq"
            target="_blank"
            rel="noopener noreferrer"
            className="group dark-panel rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between bg-[#0a0a0a]"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white mb-5 group-hover:border-white/40 transition duration-300">
                <MessageSquare className="w-5 h-5 text-neutral-300 group-hover:text-white" />
              </div>
              <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">
                // ОСНОВАТЕЛЬ / A&R
              </p>
              <h3 className="font-gothic text-lg font-bold text-white group-hover:text-neutral-200 transition">
                @kazumaiq
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-sans">
                Спецпроекты, эксклюзивные контракты, YouTube OAC и TikTok верификация.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-neutral-500 group-hover:text-white">
              <span>Написать в Telegram</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
            </div>
          </a>

          {/* Channel 3: Email */}
          <a
            href="mailto:cxrner.label@gmail.com"
            className="group dark-panel rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between bg-[#0a0a0a]"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white mb-5 group-hover:border-white/40 transition duration-300">
                <Mail className="w-5 h-5 text-neutral-300 group-hover:text-white" />
              </div>
              <p className="font-mono text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">
                // ОФИЦИАЛЬНАЯ ПОЧТА
              </p>
              <h3 className="font-mono text-sm font-bold text-white group-hover:text-neutral-200 transition truncate">
                cxrner.label@gmail.com
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-sans">
                Официальные запросы правообладателей, юридические вопросы и партнерства.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-neutral-500 group-hover:text-white">
              <span>Отправить email</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
            </div>
          </a>
        </div>

        {/* Operating Hours & Guarantee Banner */}
        <div className="dark-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-black border border-white/15 flex items-center justify-center flex-shrink-0 text-white">
              <Clock className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="font-gothic font-bold text-white text-base uppercase">Регламент ответа команды</h3>
              <p className="font-sans text-xs text-neutral-400 mt-0.5">
                Модерация релизов: от 24 до 72 часов. Ответы в Telegram: в течение рабочего дня.
              </p>
            </div>
          </div>

          <Link
            href="/submit-release"
            className="btn-void-primary inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 transition whitespace-nowrap"
          >
            <span>Отправить релиз</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
