"use client";

import { useEffect, useState } from "react";
import Link from "next/image";
import NextLink from "next/link";
import { Users, Sparkles, ArrowRight, ShieldCheck, Gift, Disc } from "lucide-react";

interface JoinClientViewProps {
  initialRefCode: string;
}

export default function JoinClientView({ initialRefCode }: JoinClientViewProps) {
  const [refCode, setRefCode] = useState(initialRefCode);

  useEffect(() => {
    if (refCode) {
      try {
        localStorage.setItem("cxrner_ref_code", refCode);
        document.cookie = `cxrner_ref_code=${encodeURIComponent(refCode)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {
        // ignore
      }
    } else {
      try {
        const stored = localStorage.getItem("cxrner_ref_code");
        if (stored) setRefCode(stored);
      } catch {
        // ignore
      }
    }
  }, [refCode]);

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] flex items-center justify-center p-4 selection:bg-[#8737FF] selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#8737FF]/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#00F0FF]/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto my-12 animate-fadeIn">
        <div className="rounded-3xl bg-[#090611]/90 border border-white/15 p-6 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-center space-y-6">
          {/* Logo badge */}
          <div className="w-16 h-16 rounded-2xl bg-[#0A0714] border border-[#B46BFF]/40 mx-auto flex items-center justify-center shadow-[0_0_24px_rgba(135,55,255,0.4)]">
            <Users className="w-8 h-8 text-[#00F0FF]" />
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#00F0FF] font-bold">
              ПЕРСОНАЛЬНОЕ ПРИГЛАШЕНИЕ
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
              Добро пожаловать в CXRNER MUSIC
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70 max-w-md mx-auto mt-2 leading-relaxed">
              Вас пригласили стать частью цифровой экосистемы лейбла. Создайте свой единый CXRNER ID, получайте валюту CXP и выпускайте релизы на 150+ площадках.
            </p>
          </div>

          {refCode && (
            <div className="p-4 rounded-2xl bg-[#160B28]/60 border border-[#8737FF]/40 inline-flex items-center gap-3">
              <Gift className="w-4 h-4 text-[#B46BFF]" />
              <div className="text-left font-mono text-xs">
                <span className="text-[#D9D9E2]/50 block text-[10px] uppercase">Реферальный код:</span>
                <span className="text-white font-bold tracking-widest text-sm">{refCode}</span>
              </div>
            </div>
          )}

          {/* Perks list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-mono text-xs pt-2">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#B46BFF] shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-bold">+50 CXP Бонус</div>
                <div className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  За заполнение профиля на 80% и привязку Telegram.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-bold">+100 CXP за статус</div>
                <div className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  При верификации вашей артистической карточки.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <NextLink
              href={refCode ? `/auth/register?ref=${encodeURIComponent(refCode)}` : "/auth/register"}
              className="btn-energy w-full sm:w-auto px-8 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center justify-center gap-2 shadow-xl"
            >
              <span>Создать аккаунт</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>

            <NextLink
              href={refCode ? `/auth/login?ref=${encodeURIComponent(refCode)}` : "/auth/login"}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 font-mono text-xs uppercase tracking-wider text-white transition"
            >
              Уже есть аккаунт? Войти
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
