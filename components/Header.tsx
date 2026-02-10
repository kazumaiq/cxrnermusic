import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";

const navItems = [
  { label: "Главная", href: "/" },
  { label: "Релизы", href: "/#releases" },
  { label: "Артисты", href: "/#artists" },
  { label: "FAQ", href: "/#faq" },
  { label: "Оферта", href: "/offer" },
  { label: "Контакты", href: "/contact" },
];

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-night/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold tracking-[0.3em] text-white font-display"
        >
          <Image src="/images/logo.svg" alt="CXRNER MUSIC" width={36} height={36} className="h-9 w-9" />
          CXRNER MUSIC
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/contact"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-neon hover:text-white"
        >
          Связаться
        </Link>
      </Container>
    </header>
  );
}
