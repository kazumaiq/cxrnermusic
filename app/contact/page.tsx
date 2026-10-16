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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge text-[11px] font-bold uppercase tracking-widest text-aqua mb-3 shadow-glowAqua">
            <Sparkles className="w-3.5 h-3.5 text-aqua" />
            Всегда на связи
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            Контакты лейбла
          </h1>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Есть вопросы по отгрузке трека, роялти или промо? Свяжитесь с нами напрямую
            через Telegram или отправьте запрос по электронной почте.
          </p>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Channel 1: Telegram Bot */}
          <a
            href="https://t.me/moder_cxrner_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="group glass-panel rounded-3xl p-6 border border-white/10 hover:border-neon/50 hover:shadow-glow transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-neon/15 border border-neon/30 flex items-center justify-center text-neon mb-5 group-hover:scale-110 transition duration-300">
                <Send className="w-6 h-6 text-neon" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-neon mb-1">
                Бот модерации 24/7
              </p>
              <h3 className="text-lg font-bold text-white group-hover:text-neonSoft transition">
                @moder_cxrner_bot
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Подача заявок на дистрибуцию, проверка статуса треков и оперативная связь.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 group-hover:text-white">
              <span>Открыть бота</span>
              <ArrowRight className="w-4 h-4 text-neon" />
            </div>
          </a>

          {/* Channel 2: Founder Direct */}
          <a
            href="https://t.me/kazumaiq"
            target="_blank"
            rel="noopener noreferrer"
            className="group glass-panel rounded-3xl p-6 border border-white/10 hover:border-aqua/50 hover:shadow-glowAqua transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-aqua/15 border border-aqua/30 flex items-center justify-center text-aqua mb-5 group-hover:scale-110 transition duration-300">
                <MessageSquare className="w-6 h-6 text-aqua" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-aqua mb-1">
                Основатель / A&R
              </p>
              <h3 className="text-lg font-bold text-white group-hover:text-aqua transition">
                @kazumaiq
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Вопросы спецпроектов, эксклюзивного контракта, YouTube OAC и TikTok верификации.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 group-hover:text-white">
              <span>Написать в Telegram</span>
              <ArrowRight className="w-4 h-4 text-aqua" />
            </div>
          </a>

          {/* Channel 3: Email */}
          <a
            href="mailto:cxrner.label@gmail.com"
            className="group glass-panel rounded-3xl p-6 border border-white/10 hover:border-magenta/50 hover:shadow-glowMagenta transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-magenta/15 border border-magenta/30 flex items-center justify-center text-magenta mb-5 group-hover:scale-110 transition duration-300">
                <Mail className="w-6 h-6 text-magenta" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-magenta mb-1">
                Официальная почта
              </p>
              <h3 className="text-base font-bold text-white group-hover:text-magenta transition truncate">
                cxrner.label@gmail.com
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Для официальных запросов правообладателей, юридических вопросов и партнёрств.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 group-hover:text-white">
              <span>Отправить email</span>
              <ArrowRight className="w-4 h-4 text-magenta" />
            </div>
          </a>
        </div>

        {/* Operating Hours & Guarantee Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-aqua">
              <Clock className="w-6 h-6 text-aqua" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Регламент ответа команды</h3>
              <p className="text-xs text-white/60 mt-0.5">
                Модерация релизов: от 12 часов до 3 дней. Ответы в Telegram: в течение дня.
              </p>
            </div>
          </div>

          <Link
            href="/submit-release"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon to-aqua text-night font-bold text-xs uppercase tracking-wider shadow-glow hover:scale-105 active:scale-95 transition whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 fill-night" />
            Отправить релиз
          </Link>
        </div>
      </Container>
    </div>
  );
}
