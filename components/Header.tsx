import Image from "next/image";
import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";
import Container from "./Container";

const navItems = [
  { label: "Главная", href: "/" }, { label: "Релизы", href: "/#releases" },
  { label: "Артисты", href: "/#artists" }, { label: "FAQ", href: "/#faq" },
  { label: "Оферта", href: "/offer" }, { label: "Контакты", href: "/contact" },
];

export default async function Header() {
  let isLoggedIn = false;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    isLoggedIn = Boolean(session);
  } catch { isLoggedIn = false; }

  return <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-night/70 backdrop-blur-2xl">
    <Container className="flex h-[4.5rem] items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="logo-badge h-9 w-9 md:h-10 md:w-10"><Image src="/logo.png" alt="CXRNER MUSIC" width={64} height={64} className="logo-img h-5 w-5 md:h-6 md:w-6" priority /></span>
        <span className="brand-text text-sm sm:text-base md:text-lg">CXRNER MUSIC</span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-white/60 lg:flex">{navItems.map(item => <Link key={item.href} href={item.href} className="transition hover:text-white">{item.label}</Link>)}</nav>
      <div className="hidden items-center gap-3 md:flex">
        {isLoggedIn ? <><Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-white/80 transition hover:border-neon hover:text-white">Кабинет</Link><form action="/auth/logout" method="post"><button type="submit" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.25em] text-white/50 transition hover:border-red-400/60 hover:text-red-300">Выйти</button></form></> : <><Link href="/auth/login" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-white/80 transition hover:border-neon hover:text-white">Войти</Link><Link href="/contact" className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-night transition hover:bg-neon">Связаться</Link></>}
      </div>
      <details className="relative md:hidden"><summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/15 text-white/80" aria-label="Открыть меню">☰</summary><nav className="absolute right-0 top-14 w-56 rounded-2xl border border-white/10 bg-[#130b22]/95 p-3 shadow-2xl backdrop-blur-xl">{navItems.map(item => <Link key={item.href} href={item.href} className="block rounded-xl px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white">{item.label}</Link>)}<Link href="/contact" className="mt-2 block rounded-xl bg-neon px-4 py-3 text-center text-sm font-semibold text-night">Связаться</Link></nav></details>
    </Container>
  </header>;
}
