import Image from "next/image";
import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";
import MobileMenu from "./MobileMenu";
import SfxToggle from "./visual/SfxToggle";
import { User, ArrowUpRight } from "lucide-react";

const navItems = [
  { label: "Главная", href: "/" },
  { label: "О лейбле", href: "/#about" },
  { label: "Релизы", href: "/#releases" },
  { label: "Артисты", href: "/#artists" },
  { label: "Дистрибуция", href: "/#distribution" },
  { label: "CXRNER LINK", href: "/link" },
  { label: "FAQ", href: "/#faq" },
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
        <div className="rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between border border-[#D9D9E2]/15 shadow-[0_12px_40px_rgba(5,4,7,0.85)] backdrop-blur-2xl bg-[#050407]/80">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group" data-cursor="HOME">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#090611] border border-[#D9D9E2]/20 group-hover:border-[#B46BFF] overflow-hidden shadow-[0_0_18px_rgba(135,55,255,0.28)] transition duration-300">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={36}
                height={36}
                className="object-contain w-full h-full p-0.5 group-hover:scale-110 transition duration-300"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heavy font-bold text-sm sm:text-base tracking-[0.28em] text-white group-hover:text-[#B46BFF] transition">
                CXRNER
              </span>
              <span className="font-mono text-[8px] tracking-[0.28em] uppercase text-[#D9D9E2]/60 -mt-0.5 hidden sm:block">
                MUSIC UNIVERSE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[11px] font-mono uppercase tracking-[0.16em] text-[#D9D9E2]/75">
            {navItems.map((item) => {
              const isLink = item.href === "/link";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition duration-200 py-1 relative group whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isLink ? "text-white font-semibold" : "hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {isLink && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#8737FF] text-white text-[8px] font-bold tracking-wider shadow-[0_0_8px_#8737FF]">
                      NEW
                    </span>
                  )}
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-[#8737FF] to-white transition-all duration-300 group-hover:w-full" />
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <SfxToggle />
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#B46BFF]/35 bg-[#8737FF]/12 text-[11px] font-mono uppercase tracking-wider text-white hover:bg-[#8737FF]/25 transition"
                >
                  <User className="w-3.5 h-3.5 text-[#B46BFF]" />
                  <span>Кабинет</span>
                </Link>
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="px-2.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/50 hover:text-red-400 transition"
                  >
                    Выйти
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider text-[#D9D9E2]/75 hover:text-white transition"
              >
                Вход
              </Link>
            )}

            <Link
              href="/submit-release"
              data-cursor="SUBMIT"
              className="btn-energy px-5 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider font-bold whitespace-nowrap shrink-0"
            >
              <span>Отправить релиз</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

          {/* Mobile Right Controls: Quick Link Button + Drawer */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/20 font-mono text-[10px] uppercase font-bold text-white tracking-wider shadow-[0_0_12px_rgba(135,55,255,0.35)]"
            >
              <span>LINK</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
            </Link>
            <MobileMenu isLoggedIn={isLoggedIn} navItems={navItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
