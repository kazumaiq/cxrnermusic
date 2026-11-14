"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Radio, Box, User, ArrowUpRight, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import SfxToggle from "./visual/SfxToggle";
import MobileMenu from "./MobileMenu";
import { playClickSound } from "@/lib/soundFX";

const NAV_ITEMS = [
  { label: "Главная", href: "/" },
  { label: "Релизы", href: "/#releases" },
  { label: "Артисты", href: "/#artists" },
  { label: "Дистрибуция", href: "/#distribution" },
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
          ? "bg-[#040307]/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
          : "bg-gradient-to-b from-[#040307]/85 via-[#040307]/45 to-transparent backdrop-blur-md border-b border-white/[0.04]"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3">
        {/* Brand Identity */}
        <Link
          href="/"
          onClick={() => playClickSound()}
          className="inline-flex items-center gap-3 group shrink-0"
        >
          <div className="relative w-9 h-9 rounded-xl bg-[#0C0914] border border-white/18 group-hover:border-[#B46BFF]/70 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300">
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
            <span className="font-display font-black text-sm sm:text-base tracking-[0.06em] text-white uppercase">
              CXRNER
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.26em] text-[#D9D9E2]/55 uppercase mt-0.5">
              MUSIC ECOSYSTEM
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Rail */}
        <nav
          aria-label="Основная навигация"
          className="hidden lg:flex items-center gap-1 px-1.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.09] backdrop-blur-xl"
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
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-white text-[#050407] shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                    : isDrop
                    ? "text-[#D9B8FF] hover:text-white hover:bg-[#8737FF]/20"
                    : isLink
                    ? "text-[#79F7FF] hover:text-white hover:bg-[#00F0FF]/12"
                    : "text-[#D9D9E2]/70 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isLink && <Radio className="w-3 h-3" />}
                {isDrop && <Box className="w-3 h-3" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block">
            <SfxToggle />
          </div>

          <Link
            href="/drop"
            onClick={() => playClickSound()}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8737FF]/20 border border-[#B46BFF]/45 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#8737FF]/35 transition"
          >
            <Box className="w-3 h-3 text-[#B46BFF]" />
            <span>DROP</span>
          </Link>

          <Link
            href="/link"
            onClick={() => playClickSound()}
            className="hidden sm:inline-flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00F0FF]/12 border border-[#00F0FF]/40 font-mono text-[10px] font-bold uppercase tracking-wider text-[#79F7FF]"
          >
            <Radio className="w-3 h-3" />
            <span>LINK</span>
          </Link>

          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/login"}
            onClick={() => playClickSound()}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#050407] font-mono text-[11px] font-extrabold uppercase tracking-wider shadow-[0_6px_22px_rgba(255,255,255,0.16)] hover:shadow-[0_8px_28px_rgba(180,107,255,0.35)] hover:-translate-y-0.5 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>{isLoggedIn ? "Кабинет" : "Войти"}</span>
          </Link>

          <Link
            href="/submit-release"
            onClick={() => playClickSound()}
            className="hidden xl:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
            <span>Релиз</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </Link>

          <div className="lg:hidden">
            <MobileMenu isLoggedIn={isLoggedIn} navItems={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </header>
  );
}
