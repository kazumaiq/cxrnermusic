"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Container from "../components/Container";
import { Disc, ArrowLeft, Sparkles, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="section-padding pt-32 min-h-[80vh] flex items-center justify-center">
      <Container className="max-w-xl text-center">
        <div className="glass-panel rounded-3xl p-10 sm:p-12 border border-white/10 shadow-glow space-y-6">
          <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-neon via-magenta to-aqua p-0.5 shadow-glowStrong">
            <div className="w-full h-full rounded-full bg-night flex items-center justify-center">
              <Disc className="w-10 h-10 text-white animate-spin-slow" />
            </div>
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon via-white to-aqua">
              404
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white font-display">
              Трек не найден на этой частоте
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed">
              Страница была перемещена, удалена или вы перешли по неверной ссылке.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon to-aqua text-night font-bold text-xs uppercase tracking-wider shadow-glow hover:scale-105 transition"
            >
              <Home className="w-4 h-4 fill-night" />
              На главную
            </Link>

            <Link
              href="/#releases"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-badge border border-white/15 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <Disc className="w-4 h-4 text-aqua" />
              Каталог релизов
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
