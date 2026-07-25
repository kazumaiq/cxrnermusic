import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

export default function Footer() {
  return <footer className="border-t border-white/10 py-10"><Container className="flex flex-col gap-7 text-sm text-white/55 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><span className="logo-badge h-8 w-8"><Image src="/logo.png" alt="CXRNER MUSIC" width={56} height={56} className="logo-img h-4 w-4" /></span><p className="brand-text text-sm">CXRNER MUSIC</p></div><p className="mt-3 max-w-md leading-6">Независимый лейбл и дистрибуция для артистов, которые звучат иначе.</p></div><div className="flex flex-wrap gap-x-5 gap-y-3"><Link href="/offer" className="transition hover:text-white">Публичная оферта</Link><Link href="/contact" className="transition hover:text-white">Контакты</Link><a href="https://t.me/moder_cxrner_bot" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">Отправить релиз ↗</a></div></Container></footer>;
}
