import Link from "next/link";
import Container from "./Container";
import { Sparkles, Send, Globe, Disc, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-white/10 bg-nightSurface/80 backdrop-blur-2xl overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-neon/10 blur-[100px] pointer-events-none" />

      <Container className="pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-neon via-magenta to-aqua p-0.5 shadow-glow">
                <div className="w-full h-full rounded-full bg-night flex items-center justify-center font-display font-black text-sm text-white">
                  CX
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-[0.25em] text-white">
                  CXRNER MUSIC
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">
                  Global Independent Label
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              Международный независимый музыкальный лейбл и цифровая экосистема дистрибуции. Открываем таланты, продвигаем на 150+ платформ и сохраняем свободу творчества каждого артиста.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-aqua" />
                Официальный дистрибьютор
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge border-white/10">
                <Globe className="w-3.5 h-3.5 text-neon" />
                150+ стран мира
              </span>
            </div>
          </div>

          {/* Column 2: Навигация */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-neon mb-4">Навигация</h4>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <Link href="/#releases" className="hover:text-white transition inline-flex items-center gap-1">
                  Каталог релизов
                </Link>
              </li>
              <li>
                <Link href="/#artists" className="hover:text-white transition">
                  Артисты лейбла
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-white transition">
                  Сервисы и питчинг
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition">
                  База знаний & FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Связаться с командой
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Артистам */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-aqua mb-4">Артистам</h4>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <Link href="/submit-release" className="text-white hover:text-neonSoft transition font-semibold inline-flex items-center gap-1">
                  Отправить релиз <ArrowUpRight className="w-3.5 h-3.5 text-neon" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Личный кабинет
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-white transition">
                  Регистрация аккаунта
                </Link>
              </li>
              <li>
                <Link href="/offer" className="hover:text-white transition">
                  Условия и оферта 70/30
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/moder_cxrner_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-1 text-white/80"
                >
                  <Send className="w-3.5 h-3.5 text-aqua" />
                  Бот модерации
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Контакты & Соцсети */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-magenta mb-4">Связь</h4>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <a
                  href="https://t.me/kazumaiq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-1"
                >
                  Основатель: @kazumaiq
                </a>
              </li>
              <li>
                <a
                  href="mailto:cxrner.label@gmail.com"
                  className="hover:text-white transition inline-flex items-center gap-1 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-white/40" />
                  cxrner.label@gmail.com
                </a>
              </li>
              <li className="pt-2">
                <span className="block text-xs text-white/40 mb-1">Время ответа модерации:</span>
                <span className="text-xs text-aqua font-semibold">до 24-72 часов</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
          <p>© {currentYear} CXRNER MUSIC. Все права защищены. Дистрибуция и паблишинг.</p>
          <div className="flex items-center gap-6">
            <Link href="/offer" className="hover:text-white transition">
              Публичная оферта
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Контакты
            </Link>
            <a href="https://t.me/moder_cxrner_bot" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Telegram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
