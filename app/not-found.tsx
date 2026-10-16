"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Container from "../components/Container";
import { Disc, ArrowLeft, Sparkles, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="section-padding pt-32 min-h-[80vh] flex items-center justify-center">
      <Container className="max-w-xl text-center">
        <div className="dark-panel rounded-3xl p-10 sm:p-12 border border-white/10 shadow-2xl space-y-6 bg-[#0a0a0a]">
          <div className="relative w-16 h-16 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Disc className="w-8 h-8 text-neutral-300 animate-spin-slow" />
          </div>

          <div>
            <span className="font-gothic text-6xl sm:text-7xl font-black text-white tracking-widest">
              404
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white font-gothic uppercase tracking-wide">
              Трек не найден
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
              Страница была перемещена, удалена или вы перешли по несуществующему адресу.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="btn-void-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 transition"
            >
              <Home className="w-4 h-4" />
              <span>На главную</span>
            </Link>

            <Link
              href="/#releases"
              className="btn-void-ghost w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/15 font-mono text-xs uppercase tracking-wider text-neutral-300 hover:text-white transition"
            >
              <Disc className="w-4 h-4 text-neutral-400" />
              <span>Каталог релизов</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
