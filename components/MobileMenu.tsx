"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, User, Disc, Music, Sparkles } from "lucide-react";

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

  // Prevent background scroll when mobile menu is open
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

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const modalContent = isOpen && mounted ? (
    <div
      className="fixed inset-0 z-[99999] bg-[#07070c]/98 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto safe-bottom animate-fadeIn"
      style={{ touchAction: "manipulation" }}
    >
      {/* Top Bar with Brand & Close Button */}
      <div className="flex items-center justify-between pb-5 border-b border-white/10 flex-shrink-0">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2.5"
        >
          <div className="relative w-9 h-9 rounded-xl bg-black/80 border border-purple-500/40 overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Image
              src="/logo.png"
              alt="CXRNER MUSIC"
              width={36}
              height={36}
              className="object-contain w-full h-full p-0.5"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-gothic font-bold text-sm tracking-[0.25em] text-white">
              CXRNER MUSIC
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400">
              МУЗЫКАЛЬНЫЙ ЛЕЙБЛ
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

      {/* Navigation Links */}
      <div className="py-6 flex flex-col gap-2 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 px-3 mb-1">
          // НАВИГАЦИЯ
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl font-mono text-sm tracking-wider uppercase transition ${
                isActive
                  ? "bg-purple-600/20 text-white font-bold border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  : "text-neutral-300 hover:text-white hover:bg-white/5 active:bg-white/10"
              }`}
            >
              <span>{item.label}</span>
              <ArrowUpRight className="w-4 h-4 text-neutral-500" />
            </Link>
          );
        })}

        {/* Direct link to Yandex Music */}
        <a
          href="https://music.yandex.ru/label/5978511"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3.5 mt-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-300 font-mono text-xs uppercase tracking-wider hover:bg-purple-900/40 transition"
        >
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span>Яндекс Музыка лейбла</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-400" />
        </a>
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="pt-5 border-t border-white/10 flex flex-col gap-3 flex-shrink-0">
        <Link
          href="/submit-release"
          onClick={() => setIsOpen(false)}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono font-bold text-xs uppercase tracking-widest text-center shadow-[0_0_20px_rgba(139,92,246,0.35)] active:scale-98 transition flex items-center justify-center gap-2"
        >
          <span>Отправить релиз</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 font-mono text-xs uppercase tracking-wider text-white transition active:scale-98"
            >
              <User className="w-4 h-4 text-purple-400" />
              Кабинет артиста
            </Link>
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-red-400 transition"
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
              className="py-3 text-center rounded-xl bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-wider text-neutral-300 hover:text-white transition active:bg-white/10"
            >
              Вход
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setIsOpen(false)}
              className="py-3 text-center rounded-xl bg-purple-500/10 border border-purple-500/30 font-mono text-xs uppercase tracking-wider text-purple-300 hover:text-white transition active:bg-purple-500/20"
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
      {/* Trigger Button (3 Stripes) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white active:scale-95 transition"
        aria-label="Открыть навигационное меню"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Render drawer directly into document.body to avoid backdrop-filter trapping */}
      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </div>
  );
}
