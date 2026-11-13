"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, User, Music, Radio, Sparkles } from "lucide-react";
import SfxToggle from "./visual/SfxToggle";

interface MobileMenuProps {
  isLoggedIn: boolean;
  navItems: { label: string; href: string }[];
}

export default function MobileMenu({ isLoggedIn, navItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const modalContent =
    isOpen && mounted ? (
      <div
        className="fixed inset-0 z-[99999] bg-[#050407]/98 backdrop-blur-2xl flex flex-col justify-between p-5 sm:p-6 overflow-y-auto safe-bottom animate-fadeIn"
        style={{ touchAction: "manipulation" }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative w-8 h-8 rounded-xl bg-[#090611] border border-[#B46BFF]/40 overflow-hidden shadow-[0_0_16px_rgba(135,55,255,0.3)]">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={32}
                height={32}
                className="object-contain w-full h-full p-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-wider text-white">
                CXRNER MUSIC
              </span>
              <span className="font-sans text-[8px] font-semibold uppercase tracking-wider text-[#B46BFF]">
                RECORD LABEL & DISTRIBUTION
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <SfxToggle />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white active:scale-95 transition"
              aria-label="Закрыть меню"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <div className="py-4 flex flex-col gap-2 flex-1">
          {/* Featured CXRNER LINK Promo Card on Mobile */}
          <Link
            href="/link"
            onClick={() => setIsOpen(false)}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#8737FF]/25 via-[#160B28]/90 to-[#090611] border border-[#B46BFF]/50 shadow-[0_0_24px_rgba(135,55,255,0.25)] flex items-center justify-between gap-3 group active:scale-[0.98] transition"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-wider text-[#00F0FF] font-bold">
                <Radio className="w-3 h-3 text-[#00F0FF] animate-pulse" />
                <span>СМАРТ-ССЫЛКИ · NEW</span>
              </div>
              <h4 className="font-display font-black text-base uppercase text-white tracking-wide flex items-center gap-2">
                <span>CXRNER LINK</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-sans font-bold bg-[#8737FF] text-white">
                  LIVE
                </span>
              </h4>
              <p className="font-sans text-xs text-[#D9D9E2]/80 leading-tight">
                Умные страницы релизов и Pre-save для артистов
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:bg-[#8737FF] transition">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </Link>

          <p className="font-sans text-xs uppercase tracking-wider font-semibold text-[#D9D9E2]/50 px-2 mt-2">
            НАВИГАЦИЯ
          </p>

          <div className="flex flex-col gap-1">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href;
              const isLink = item.href === "/link";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-display font-bold text-base tracking-normal uppercase transition ${
                    isActive
                      ? "bg-[#8737FF]/20 text-white border border-[#B46BFF]/45"
                      : isLink
                      ? "text-white bg-white/5 border border-[#B46BFF]/30"
                      : "text-[#D9D9E2]/85 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-[#B46BFF]">
                      0{idx + 1}
                    </span>
                    <span>{item.label}</span>
                    {isLink && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#8737FF] text-white font-mono text-[9px] font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#B46BFF] opacity-60" />
                </Link>
              );
            })}
          </div>

          <a
            href="https://music.yandex.ru/label/5978511"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3.5 py-3 rounded-xl bg-[#160B28]/50 border border-[#B46BFF]/30 text-white font-mono text-xs uppercase tracking-wider hover:bg-[#8737FF]/25 transition"
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#B46BFF]" />
              <span>Яндекс Музыка лейбла</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#B46BFF]" />
          </a>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5 flex-shrink-0">
          <Link
            href="/submit-release"
            onClick={() => setIsOpen(false)}
            className="btn-energy w-full py-3.5 rounded-2xl font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>Отправить релиз</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 border border-white/20 font-mono text-xs uppercase tracking-wider text-white transition"
              >
                <User className="w-4 h-4 text-[#B46BFF]" />
                Кабинет артиста
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/65 hover:text-red-400 transition"
                >
                  Выйти
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="py-2.5 text-center rounded-xl bg-white/5 border border-white/15 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] hover:text-white transition"
              >
                Вход
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="py-2.5 text-center rounded-xl bg-[#8737FF]/15 border border-[#B46BFF]/35 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#8737FF]/25 transition"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white active:scale-95 transition"
        aria-label="Открыть навигационное меню"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </div>
  );
}
