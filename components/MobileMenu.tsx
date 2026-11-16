"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, User, Radio, Box, LogOut } from "lucide-react";
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
        className="fixed inset-0 z-[99999] bg-[#0D081D]/98 backdrop-blur-2xl flex flex-col justify-between p-5 sm:p-6 overflow-y-auto safe-bottom animate-fadeIn"
        style={{ touchAction: "manipulation" }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/12 flex-shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative w-9 h-9 rounded-xl bg-[#1A1238] border border-[#C084FC]/45 overflow-hidden shadow-[0_0_16px_rgba(139,92,246,0.35)]">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={36}
                height={36}
                className="object-contain w-full h-full p-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-base text-white">
                CXRNER MUSIC
              </span>
              <span className="font-sans text-[11px] font-semibold text-[#C9C1EA]">
                Лейбл и дистрибуция
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <SfxToggle />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/12 hover:bg-white/20 border border-white/25 text-white active:scale-95 transition"
              aria-label="Закрыть меню"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clean Primary Navigation */}
        <div className="py-6 flex flex-col gap-2.5 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isLink = item.href === "/link";
            const isDrop = item.href === "/drop";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl font-display font-bold text-lg transition ${
                  isActive
                    ? "bg-white text-[#0C071A] shadow-md"
                    : "bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.12]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLink && <Radio className={`w-5 h-5 ${isActive ? "text-[#0C071A]" : "text-[#22D3EE]"}`} />}
                  {isDrop && <Box className={`w-5 h-5 ${isActive ? "text-[#0C071A]" : "text-[#C084FC]"}`} />}
                  <span>{item.label}</span>
                </div>
                <ArrowUpRight className={`w-4 h-4 ${isActive ? "text-[#0C071A]" : "text-[#C9C1EA]"}`} />
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/12 flex flex-col gap-3 flex-shrink-0">
          <Link
            href="/submit-release"
            onClick={() => setIsOpen(false)}
            className="btn-energy w-full py-3.5 rounded-2xl font-sans font-extrabold text-sm flex items-center justify-center gap-2"
          >
            <span>Выпустить релиз</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-[#0C071A] font-sans font-extrabold text-sm transition"
              >
                <User className="w-4 h-4" />
                <span>Личный кабинет</span>
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 font-sans text-sm font-bold text-white hover:text-red-300 transition flex items-center gap-1.5"
                  aria-label="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="py-3 text-center rounded-2xl bg-white text-[#0C071A] font-sans text-sm font-extrabold transition"
              >
                Войти
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="py-3 text-center rounded-2xl bg-white/10 border border-white/20 font-sans text-sm font-bold text-white hover:bg-white/15 transition"
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
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/25 text-white active:scale-95 transition"
        aria-label="Открыть навигационное меню"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </div>
  );
}
