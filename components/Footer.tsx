import Link from "next/link";
import Container from "./Container";
import { Sparkles, Send, Globe, Disc, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-white/10 bg-[#060606] overflow-hidden">
      <Container className="pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black border border-white/20 group-hover:border-white transition duration-300">
                <span className="font-gothic font-black text-xs text-white">CX</span>
              </div>
              <div className="flex flex-col">
                <span className="font-gothic font-bold text-base tracking-[0.28em] text-white">
                  CXRNER MUSIC
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-neutral-500">
                  Global Independent Label
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-xs leading-6 text-neutral-400 font-sans">
              Международный независимый музыкальный лейбл и экосистема дистрибуции. Открываем таланты, продвигаем на 150+ платформ и сохраняем свободу творчества каждого артиста.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded tech-badge font-mono text-[10px] uppercase text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-300" />
                Официальный дистрибьютор
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded tech-badge font-mono text-[10px] uppercase text-neutral-400">
                <Globe className="w-3.5 h-3.5 text-neutral-300" />
                150+ стран мира
              </span>
            </div>
          </div>

          {/* Column 2: Навигация */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-neutral-300 mb-4">// НАВИГАЦИЯ</h4>
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
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-neutral-300 mb-4">// АРТИСТАМ</h4>
            <ul className="space-y-2.5 text-xs font-mono text-neutral-400">
              <li>
                <Link href="/submit-release" className="text-white hover:text-neutral-300 transition font-semibold inline-flex items-center gap-1">
                  Отправить релиз <ArrowUpRight className="w-3.5 h-3.5 text-white" />
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
                  className="hover:text-white transition inline-flex items-center gap-1 text-neutral-300"
                >
                  <Send className="w-3.5 h-3.5 text-neutral-400" />
                  Бот модерации
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Контакты & Соцсети */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-neutral-300 mb-4">// СВЯЗЬ</h4>
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
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
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
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-neutral-500">
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
