import Link from "next/link";
import Image from "next/image";
import Container from "./Container";
import { Sparkles, Send, Globe, Disc, ShieldCheck, Mail, ArrowUpRight, Music } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-purple-500/20 bg-gradient-to-b from-[#090910]/75 to-[#040407]/85 backdrop-blur-md overflow-hidden">
      {/* Ambient purple bloom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-black/80 border border-purple-500/40 group-hover:border-purple-400 overflow-hidden transition duration-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Image
                  src="/logo.png"
                  alt="CXRNER MUSIC"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full p-1 group-hover:scale-105 transition"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-gothic font-bold text-base tracking-[0.28em] text-white group-hover:text-purple-300 transition">
                  CXRNER MUSIC
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-purple-400">
                  Global Independent Label
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-xs leading-6 text-neutral-300 font-sans">
              Международный независимый музыкальный лейбл и экосистема цифровой дистрибуции.
              Выпускаем треки на 150+ стримингов, защищаем авторские права и обеспечиваем прозрачные выплаты 70/30.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <a
                href="https://music.yandex.ru/label/5978511"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 font-mono text-[10px] uppercase text-purple-300 hover:bg-purple-500/20 transition"
              >
                <Music className="w-3.5 h-3.5 text-purple-400" />
                Яндекс Музыка лейбла
              </a>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 font-mono text-[10px] uppercase text-neutral-300">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                150+ стран мира
              </span>
            </div>
          </div>

          {/* Column 2: Навигация */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-purple-300 mb-4">// НАВИГАЦИЯ</h4>
            <ul className="space-y-2.5 text-xs font-mono text-neutral-400">
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
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-purple-300 mb-4">// АРТИСТАМ</h4>
            <ul className="space-y-2.5 text-xs font-mono text-neutral-400">
              <li>
                <Link href="/submit-release" className="text-white hover:text-purple-300 transition font-semibold inline-flex items-center gap-1">
                  Отправить релиз <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
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
                  className="hover:text-white transition inline-flex items-center gap-1 text-purple-300"
                >
                  <Send className="w-3.5 h-3.5 text-purple-400" />
                  Бот модерации
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Контакты & Соцсети */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-purple-300 mb-4">// СВЯЗЬ</h4>
            <ul className="space-y-2.5 text-xs font-mono text-neutral-400">
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
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  cxrner.label@gmail.com
                </a>
              </li>
              <li className="pt-2">
                <span className="block font-mono text-[11px] text-neutral-500 mb-1">Время ответа модерации:</span>
                <span className="font-mono text-xs text-white font-semibold">24-72 часа</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-neutral-400">
          <p>© {currentYear} CXRNER MUSIC. Официальная дистрибуция и паблишинг.</p>
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
