"use client";

import Link from "next/link";
import { X, Coins, ArrowRight, CheckCircle2, Sparkles, User, ShieldCheck, Disc3, Users } from "lucide-react";
import { CXP_QUESTS_CATALOG } from "@/lib/ecosystemTypes";

interface GetCxpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
}

export default function GetCxpModal({
  isOpen,
  onClose,
  userBalance,
}: GetCxpModalProps) {
  if (!isOpen) return null;

  const questIcons: Record<string, any> = {
    quest_profile_80: User,
    quest_telegram_link: Sparkles,
    quest_artist_verification: ShieldCheck,
    quest_submit_release: Disc3,
    quest_invite_artist: Users,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#00F0FF]/45 bg-[#090611] p-6 sm:p-8 shadow-[0_0_80px_rgba(0,240,255,0.3)] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF]">
              <Coins className="w-3.5 h-3.5" />
              <span>CXP EARNING HUB</span>
            </div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white">
              Как получить валюту CXP
            </h2>
            <p className="text-xs text-[#D9D9E2]/75">
              Выполняй задания внутри экосистемы CXRNER MUSIC и накапливай валюту для открытия запечатанных кейсов.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8737FF]/20 to-[#00F0FF]/15 border border-white/15 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]/70 block">
              ТЕКУЩИЙ БАЛАНС
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display font-black text-2xl text-white">
                {userBalance}
              </span>
              <span className="font-display font-black text-sm text-[#00F0FF]">
                CXP
              </span>
            </div>
          </div>
          <span className="font-mono text-xs text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full bg-emerald-500/10">
            Активный кошелёк
          </span>
        </div>

        {/* Quests List */}
        <div className="space-y-3">
          {CXP_QUESTS_CATALOG.map((quest) => {
            const Icon = questIcons[quest.id] || Sparkles;
            return (
              <div
                key={quest.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-[#00F0FF]/40"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-display font-black text-xs uppercase tracking-wide text-white">
                      {quest.title}
                    </h3>
                    <p className="text-xs text-[#D9D9E2]/75 leading-relaxed max-w-md">
                      {quest.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <span className="font-display font-black text-xs text-[#00F0FF] bg-[#00F0FF]/15 px-2.5 py-1 rounded-lg border border-[#00F0FF]/30">
                    +{quest.reward_cxp} CXP
                  </span>
                  <Link
                    href={quest.action_href}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-wider transition"
                  >
                    <span>{quest.action_label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-white transition"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
