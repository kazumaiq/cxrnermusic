import Image from "next/image";
import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";
import Container from "./Container";
import MobileMenu from "./MobileMenu";
import { Sparkles, User, ArrowUpRight } from "lucide-react";

const navItems = [
  { label: "Главная", href: "/" },
  { label: "Релизы", href: "/#releases" },
  { label: "Артисты", href: "/#artists" },
  { label: "Услуги", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Оферта", href: "/offer" },
  { label: "Контакты", href: "/contact" },
];

export default async function Header() {
  let isLoggedIn = false;
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    isLoggedIn = Boolean(session);
  } catch {
    isLoggedIn = false;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4">
        <div className="glass-panel rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-neon via-magenta to-aqua p-0.5 shadow-glow group-hover:scale-105 transition duration-300">
              <div className="w-full h-full rounded-full bg-night flex items-center justify-center">
                <span className="font-display font-black text-xs tracking-tighter text-white">CX</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xs sm:text-sm tracking-[0.25em] text-white group-hover:text-neonSoft transition">
                CXRNER
              </span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-white/40 -mt-1 hidden sm:block">
                MUSIC LABEL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition duration-200 hover:text-white hover:text-glow py-1 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-neon to-aqua transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-badge text-xs font-semibold uppercase tracking-wider text-white hover:border-neon hover:text-neonSoft transition"
                >
                  <User className="w-3.5 h-3.5 text-neon" />
                  Кабинет
                </Link>
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/50 hover:text-red-400 transition"
                  >
                    Выйти
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/75 hover:text-white transition"
              >
                Вход
              </Link>
            )}

            {/* Primary CTA */}
            <Link
              href="/submit-release"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-neon via-magenta to-aqua text-night font-bold text-xs uppercase tracking-wider shadow-glow hover:shadow-glowStrong hover:scale-105 active:scale-95 transition duration-300"
            >
              <Sparkles className="w-3.5 h-3.5 fill-night" />
              Отправить релиз
            </Link>
          </div>

          {/* Mobile Menu Component */}
          <MobileMenu isLoggedIn={isLoggedIn} navItems={navItems} />
        </div>
      </div>
    </header>
  );
}
