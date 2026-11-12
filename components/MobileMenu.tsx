"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, User, Music } from "lucide-react";

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
        className="fixed inset-0 z-[99999] bg-[#050407]/98 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto safe-bottom animate-fadeIn"
        style={{ touchAction: "manipulation" }}
      >
        <div className="flex items-center justify-between pb-5 border-b border-white/10 flex-shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative w-9 h-9 rounded-xl bg-[#090611] border border-[#B46BFF]/40 overflow-hidden shadow-[0_0_16px_rgba(135,55,255,0.3)]">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={36}
                height={36}
                className="object-contain w-full h-full p-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heavy font-bold text-base tracking-[0.24em] text-white">
                CXRNER MUSIC
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#B46BFF]">
                RECORD LABEL & DISTRIBUTION
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white active:scale-95 transition"
            aria-label="Закрыть меню"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="py-6 flex flex-col gap-1.5 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D9D9E2]/45 px-3 mb-2">
            // NAVIGATION
          </p>
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl font-heavy text-2xl tracking-wide uppercase transition ${
                  isActive
                    ? "bg-[#8737FF]/20 text-white border border-[#B46BFF]/45"
                    : "text-[#D9D9E2]/85 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-[#B46BFF]">
                    0{idx + 1}
                  </span>
                  <span>{item.label}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#B46BFF]" />
              </Link>
            );
          })}

          <Link
            href="/offer"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between w-full px-4 py-3 mt-1 rounded-2xl text-[#D9D9E2]/70 hover:text-white hover:bg-white/5 font-mono text-xs uppercase tracking-wider transition"
          >
            <span>Публичная оферта 70/30</span>
            <ArrowUpRight className="w-4 h-4 opacity-50" />
          </Link>

          <a
            href="https://music.yandex.ru/label/5978511"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-4 py-3.5 mt-2 rounded-2xl bg-[#160B28]/60 border border-[#B46BFF]/30 text-white font-mono text-xs uppercase tracking-wider hover:bg-[#8737FF]/25 transition"
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#B46BFF]" />
              <span>Яндекс Музыка лейбла</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#B46BFF]" />
          </a>
        </div>

        <div className="pt-5 border-t border-white/10 flex flex-col gap-3 flex-shrink-0">
          <Link
            href="/submit-release"
            onClick={() => setIsOpen(false)}
            className="btn-energy w-full py-4 rounded-2xl font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>Отправить релиз</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 font-mono text-xs uppercase tracking-wider text-white transition"
              >
                <User className="w-4 h-4 text-[#B46BFF]" />
                Кабинет артиста
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/65 hover:text-red-400 transition"
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
                className="py-3 text-center rounded-xl bg-white/5 border border-white/15 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] hover:text-white transition"
              >
                Вход
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="py-3 text-center rounded-xl bg-[#8737FF]/15 border border-[#B46BFF]/35 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#8737FF]/25 transition"
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
