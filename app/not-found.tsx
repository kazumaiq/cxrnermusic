"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Container from "../components/Container";

export default function NotFoundPage() {
  return (
    <section className="section-padding">
      <Container>
        <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">404</p>
          <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl font-display">
            Страница не найдена
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Такой страницы нет. Возможно, ссылка устарела или была введена с ошибкой.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:border-neon hover:text-white"
            >
              На главную
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

