import Image from "next/image";
import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";
import MobileMenu from "./MobileMenu";
import SfxToggle from "./visual/SfxToggle";
import { User, ArrowUpRight, Radio } from "lucide-react";

const navItems = [
  { label: "Главная", href: "/" },
  { label: "CXRNER LINK", href: "/link" },
  { label: "DROP", href: "/cabinet/drop/inventory" },
  { label: "О лейбле", href: "/#about" },
  { label: "Релизы", href: "/#releases" },
  { label: "Артисты", href: "/#artists" },
  { label: "Дистрибуция", href: "/#distribution" },
  { label: "FAQ", href: "/#faq" },
  { label: "Контакты", href: "/contact" },
];

export default async function Header() {
  let isLoggedIn = false;
  try {
    const supabase = await getSupabaseServerClient();
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
    ]);
    isLoggedIn = Boolean(sessionResult && "data" in sessionResult && sessionResult.data?.session);
  } catch {
    isLoggedIn = false;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* On mobile: sits flush with top border-b. On sm+: elegant floating pill */}
      <div className="w-full sm:mx-auto sm:max-w-7xl sm:px-6 lg:px-8 sm:pt-4">
        <div className="w-full px-4 py-3 sm:px-6 sm:py-2.5 flex items-center justify-between border-b sm:border border-white/10 sm:border-[#D9D9E2]/15 sm:rounded-full shadow-[0_8px_32px_rgba(5,4,7,0.9)] backdrop-blur-2xl bg-[#050407]/92 sm:bg-[#050407]/85">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" data-cursor="HOME">
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
              <span className="font-display font-black text-sm sm:text-base tracking-wider text-white group-hover:text-[#B46BFF] transition">
                CXRNER
              </span>
              <span className="font-sans text-[8px] tracking-[0.2em] font-semibold uppercase text-[#D9D9E2]/60 -mt-0.5 hidden sm:block">
                MUSIC UNIVERSE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-sans font-medium text-[#D9D9E2]/80">
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
                  {isLink && <Radio className="w-3 h-3 text-[#B46BFF] animate-pulse" />}
                  <span>{item.label}</span>
                  {isLink && (
                    <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-[#8737FF] to-[#00F0FF] text-white text-[8px] font-bold tracking-wider shadow-[0_0_8px_#8737FF]">
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

          {/* Mobile Right Controls: Prominent CXRNER LINK Pill + Drawer */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B46BFF]/50 bg-gradient-to-r from-[#8737FF]/35 to-[#160B28] font-sans text-xs uppercase font-bold text-white tracking-wider shadow-[0_0_15px_rgba(135,55,255,0.4)] active:scale-95 transition"
            >
              <Radio className="w-3 h-3 text-[#00F0FF] animate-pulse" />
              <span>LINK</span>
              <span className="px-1 py-0.2 rounded bg-[#8737FF] text-[8px] font-black">NEW</span>
            </Link>
            <MobileMenu isLoggedIn={isLoggedIn} navItems={navItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
