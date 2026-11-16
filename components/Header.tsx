"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Radio, Box, User, ArrowUpRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import SfxToggle from "./visual/SfxToggle";
import MobileMenu from "./MobileMenu";
import { playClickSound } from "@/lib/soundFX";

const NAV_ITEMS = [
  { label: "Главная", href: "/" },
  { label: "Релизы", href: "/#releases" },
  { label: "CXRNER LINK", href: "/link" },
  { label: "CXRNER DROP", href: "/drop" },
];

export default function Header() {
  const pathname = usePathname() || "";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data?.user) {
        setIsLoggedIn(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (mounted) {
        setIsLoggedIn(Boolean(session?.user));
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0E0922]/90 backdrop-blur-2xl border-b border-white/15 shadow-[0_14px_40px_rgba(7,4,18,0.65)]"
          : "bg-gradient-to-b from-[#0E0922]/85 via-[#0E0922]/50 to-transparent backdrop-blur-md border-b border-white/[0.06]"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <Link
          href="/"
          onClick={() => playClickSound()}
          className="inline-flex items-center gap-3 group shrink-0"
        >
          <div className="relative w-9 h-9 rounded-xl bg-[#1A1238] border border-white/25 group-hover:border-[#C084FC] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-all duration-300">
            <Image
              src="/logo.png"
              alt="CXRNER MUSIC"
              width={36}
              height={36}
              className="object-contain w-full h-full p-1"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white">
              CXRNER
            </span>
            <span className="font-sans text-[10px] font-semibold text-[#C9C1EA] mt-0.5">
              Music Label
            </span>
          </div>
        </Link>

        {/* Clean 4-Tab Desktop Navigation */}
        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-xl"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const isDrop = item.href === "/drop";
            const isLink = item.href === "/link";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => playClickSound()}
                className={`relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-sans text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-white text-[#0C071A] shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
                    : isDrop
                    ? "text-[#E9D5FF] hover:text-white hover:bg-[#8B5CF6]/25"
                    : isLink
                    ? "text-[#A5F3FC] hover:text-white hover:bg-[#22D3EE]/18"
                    : "text-[#E6E1FA] hover:text-white hover:bg-white/[0.1]"
                }`}
              >
                {isLink && <Radio className="w-3.5 h-3.5" />}
                {isDrop && <Box className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Clean Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden lg:block">
            <SfxToggle />
          </div>

          <Link
            href="/submit-release"
            onClick={() => playClickSound()}
            className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8B5CF6]/25 hover:bg-[#8B5CF6]/40 border border-[#C084FC]/45 font-sans text-[13px] font-bold text-white transition"
          >
            <span>Выпустить трек</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E9D5FF]" />
          </Link>

          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/login"}
            onClick={() => playClickSound()}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#0C071A] font-sans text-[13px] font-extrabold shadow-[0_6px_22px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_28px_rgba(192,132,252,0.45)] hover:-translate-y-0.5 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>{isLoggedIn ? "Кабинет" : "Войти"}</span>
          </Link>

          <div className="md:hidden">
            <MobileMenu isLoggedIn={isLoggedIn} navItems={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </header>
  );
}
