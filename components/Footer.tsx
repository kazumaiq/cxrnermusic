import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <Container className="flex flex-col gap-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/images/logo.svg" alt="CXRNER MUSIC" width={32} height={32} className="h-8 w-8" />
            <p className="text-base font-semibold text-white font-display">CXRNER MUSIC</p>
          </div>
          <p className="mt-2 max-w-md">
            Независимый лейбл и дистрибуция для артистов, которые звучат иначе.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/offer" className="hover:text-white">
            Публичная оферта
          </Link>
          <Link href="/contact" className="hover:text-white">
            Контакты
          </Link>
          <a href="https://t.me/moder_cxrner_bot" className="hover:text-white">
            Отправить релиз
          </a>
        </div>
      </Container>
    </footer>
  );
}
