"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Music2, User, Disc, HelpCircle, FileText, Send, Sparkles } from "lucide-react";

interface MobileMenuProps {
  isLoggedIn: boolean;
  navItems: { label: string; href: string }[];
}

export default function MobileMenu({ isLoggedIn, navItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/20 text-white active:scale-95 transition"
        aria-label="Открыть навигационное меню"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Fullscreen Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-[#050505]/98 backdrop-blur-3xl flex flex-col justify-between p-6 overflow-y-auto safe-bottom"
          >
            {/* Top Bar with Brand & Close */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center font-gothic font-bold text-xs text-white">
                  CX
                </div>
                <span className="font-gothic font-bold text-sm tracking-[0.25em] text-white">
                  CXRNER MUSIC
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/80 active:scale-95 transition"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="py-6 flex flex-col gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-500 px-3 mb-1">
                // РАЗДЕЛЫ САЙТА
              </p>
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * index }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl font-mono text-sm tracking-wider uppercase transition ${
                        isActive
                          ? "bg-white/10 text-white font-bold border border-white/25"
                          : "text-neutral-400 hover:text-white hover:bg-white/5 active:bg-white/10"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Actions & User Profile */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/5 border border-white/15 font-mono text-xs uppercase tracking-wider text-white transition active:scale-98"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    Личный кабинет артиста
                  </Link>
                  <Link
                    href="/submit-release"
                    onClick={() => setIsOpen(false)}
                    className="btn-void-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider active:scale-98 transition"
                  >
                    <span>Отправить релиз</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <form action="/auth/logout" method="post" className="w-full">
                    <button
                      type="submit"
                      className="w-full py-2.5 text-center font-mono text-[11px] uppercase tracking-wider text-neutral-500 hover:text-red-400 transition"
                    >
                      Выйти из профиля
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/submit-release"
                    onClick={() => setIsOpen(false)}
                    className="btn-void-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider active:scale-98 transition"
                  >
                    <span>Отправить релиз</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center py-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-wider text-neutral-300 active:scale-98 transition hover:text-white"
                    >
                      Вход
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center py-3 rounded-xl bg-white/10 border border-white/20 font-mono text-xs uppercase tracking-wider text-white active:scale-98 transition hover:bg-white/15"
                    >
                      Регистрация
                    </Link>
                  </div>
                </>
              )}

              {/* Direct Telegram link */}
              <a
                href="https://t.me/moder_cxrner_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-300 transition"
              >
                <Send className="w-3.5 h-3.5 text-neutral-400" />
                Telegram-бот @moder_cxrner_bot
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
