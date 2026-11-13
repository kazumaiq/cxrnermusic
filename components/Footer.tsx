import Link from "next/link";
import Image from "next/image";
import Container from "./Container";
import { ArrowUpRight, Globe, Mail, Music, Send } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-white/15 bg-[#050407]/90 backdrop-blur-2xl overflow-hidden">
      {/* Subtle Cosmic Horizon Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[780px] h-56 bg-[#8737FF]/12 rounded-full blur-[130px] pointer-events-none" />

      <Container className="pt-16 pb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-white/10">
          {/* Brand Identity */}
          <div className="lg:col-span-5 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#090611] border border-[#D9D9E2]/20 group-hover:border-[#B46BFF] overflow-hidden shadow-[0_0_20px_rgba(135,55,255,0.28)] transition">
                <Image
                  src="/logo.png"
                  alt="CXRNER MUSIC"
                  width={44}
                  height={44}
                  className="object-contain w-full h-full p-1"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-lg tracking-wider text-white uppercase">
                  CXRNER MUSIC
                </span>
                <span className="font-sans text-[9px] tracking-[0.2em] font-semibold uppercase text-[#B46BFF]">
                  GLOBAL INDEPENDENT RECORD LABEL
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-[#D9D9E2]/75 font-sans">
              Международный независимый музыкальный лейбл и цифровая дистрибуция.
              150+ стриминговых платформ, глобальный охват и честная модель роялти 70/30.
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://music.yandex.ru/label/5978511"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#B46BFF]/35 bg-[#8737FF]/12 font-sans text-xs uppercase font-semibold tracking-wider text-white hover:bg-[#8737FF]/25 transition"
              >
                <Music className="w-3.5 h-3.5 text-[#B46BFF]" />
                <span>Яндекс Музыка</span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </a>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 font-sans text-xs uppercase font-medium tracking-wider text-[#D9D9E2]/85">
                <Globe className="w-3.5 h-3.5 text-[#D9D9E2]" />
                <span>150+ DSP · Global</span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#B46BFF] mb-4">
              РАЗДЕЛЫ
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-[#D9D9E2]/65">
              <li>
                <Link
                  href="/link"
                  className="text-white hover:text-[#B46BFF] transition inline-flex items-center gap-1.5 font-semibold"
                >
                  <span className="text-[#00F0FF]">CXRNER LINK</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#8737FF] text-white text-[8px] font-bold">
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition">
                  О лейбле
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
                <Link href="/#distribution" className="hover:text-white transition">
                  Дистрибуция
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Artist Ecosystem */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#B46BFF] mb-4">
              // АРТИСТАМ
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-[#D9D9E2]/65">
              <li>
                <Link
                  href="/link"
                  className="text-white hover:text-[#B46BFF] transition inline-flex items-center gap-1.5 font-semibold"
                >
                  <span className="text-[#00F0FF]">CXRNER LINK</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#8737FF] text-white text-[8px] font-bold">
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/submit-release"
                  className="text-white hover:text-[#B46BFF] transition inline-flex items-center gap-1 font-semibold"
                >
                  <span>Отправить релиз</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B46BFF]" />
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
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#B46BFF] mb-4">
              // ОФИЦИАЛЬНЫЕ КАНАЛЫ
            </h4>
            <ul className="space-y-3 text-xs font-mono text-[#D9D9E2]/70">
              <li>
                <a
                  href="https://t.me/moder_cxrner_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#B46BFF]" />
                  <span>Telegram-бот: @moder_cxrner_bot</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/kazumaiq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#D9D9E2]" />
                  <span>Основатель / A&R: @kazumaiq</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:cxrner.label@gmail.com"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D9D9E2]" />
                  <span>cxrner.label@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Monumental Typographic Watermark */}
        <div className="py-8 overflow-hidden select-none pointer-events-none">
          <p className="font-heavy text-[14vw] sm:text-[10vw] leading-[0.82] tracking-tight uppercase text-center text-outline-chrome opacity-40">
            CXRNER MUSIC
          </p>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#D9D9E2]/55">
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
