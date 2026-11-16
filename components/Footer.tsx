import Link from "next/link";
import Image from "next/image";
import Container from "./Container";
import { ArrowUpRight, Globe, Mail, Music, Send } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-white/15 bg-[#0D081D]/92 backdrop-blur-2xl overflow-hidden">
      {/* Vivid Cosmic Horizon Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[780px] h-56 bg-[#8B5CF6]/18 rounded-full blur-[130px] pointer-events-none" />

      <Container className="pt-16 pb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-white/12">
          {/* Brand Identity */}
          <div className="lg:col-span-5 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#1A1238] border border-white/25 group-hover:border-[#C084FC] overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.3)] transition">
                <Image
                  src="/logo.png"
                  alt="CXRNER MUSIC"
                  width={44}
                  height={44}
                  className="object-contain w-full h-full p-1"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg text-white">
                  CXRNER MUSIC
                </span>
                <span className="font-sans text-xs font-semibold text-[#C084FC]">
                  Независимый музыкальный лейбл
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-[#E6E1FA] font-sans">
              Международная цифровая дистрибуция на 150+ площадок, умные смарт-ссылки и честные роялти 70/30.
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://music.yandex.ru/label/5978511"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#C084FC]/45 bg-[#8B5CF6]/20 font-sans text-xs font-bold text-white hover:bg-[#8B5CF6]/35 transition"
              >
                <Music className="w-3.5 h-3.5 text-[#E9D5FF]" />
                <span>Яндекс Музыка</span>
                <ArrowUpRight className="w-3 h-3 opacity-80" />
              </a>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/15 bg-white/[0.06] font-sans text-xs font-semibold text-white">
                <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>150+ площадок</span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2">
            <h4 className="font-sans text-xs font-extrabold uppercase tracking-wider text-[#C084FC] mb-4">
              Экосистема
            </h4>
            <ul className="space-y-2.5 text-sm font-sans text-[#DED8F6]">
              <li>
                <Link href="/link" className="text-white font-semibold hover:text-[#22D3EE] transition">
                  CXRNER LINK
                </Link>
              </li>
              <li>
                <Link href="/drop" className="text-white font-semibold hover:text-[#C084FC] transition">
                  CXRNER DROP
                </Link>
              </li>
              <li>
                <Link href="/#releases" className="hover:text-white transition">
                  Каталог релизов
                </Link>
              </li>
              <li>
                <Link href="/#artists" className="hover:text-white transition">
                  Артисты
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition">
                  Частые вопросы
                </Link>
              </li>
            </ul>
          </div>

          {/* Artist Links */}
          <div className="lg:col-span-2">
            <h4 className="font-sans text-xs font-extrabold uppercase tracking-wider text-[#C084FC] mb-4">
              Артистам
            </h4>
            <ul className="space-y-2.5 text-sm font-sans text-[#DED8F6]">
              <li>
                <Link
                  href="/submit-release"
                  className="text-white hover:text-[#C084FC] transition inline-flex items-center gap-1 font-semibold"
                >
                  <span>Выпустить релиз</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C084FC]" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Личный кабинет
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-white transition">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link href="/offer" className="hover:text-white transition">
                  Оферта 70/30
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Channels */}
          <div className="lg:col-span-3">
            <h4 className="font-sans text-xs font-extrabold uppercase tracking-wider text-[#C084FC] mb-4">
              Связь и бот
            </h4>
            <ul className="space-y-3 text-sm font-sans text-[#DED8F6]">
              <li>
                <a
                  href="https://t.me/moder_cxrner_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span>Бот: @moder_cxrner_bot</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/kazumaiq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Основатель: @kazumaiq</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:cxrner.label@gmail.com"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-white" />
                  <span>cxrner.label@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-[#C9C1EA]">
          <p>© {currentYear} CXRNER MUSIC. Официальный лейбл и дистрибуция.</p>
          <div className="flex items-center gap-6">
            <Link href="/offer" className="hover:text-white transition">
              Публичная оферта
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Контакты
            </Link>
            <a
              href="https://music.yandex.ru/label/5978511"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Яндекс Музыка
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
