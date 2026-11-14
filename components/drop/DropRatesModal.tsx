"use client";

import { X, Percent, ShieldCheck, Award } from "lucide-react";
import type { DropCaseConfig } from "@/lib/ecosystemTypes";
import { DROP_SPECIMENS } from "@/lib/ecosystemTypes";
import { RARITY_THEMES } from "./SpecimenVisual";

interface DropRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseConfig: DropCaseConfig;
}

export default function DropRatesModal({
  isOpen,
  onClose,
  caseConfig,
}: DropRatesModalProps) {
  if (!isOpen) return null;

  const rates = [
    {
      rarity: "common",
      label: "COMMON (Базовый)",
      rate: caseConfig.drop_rates.common,
      color: "#94A3B8",
      items: DROP_SPECIMENS.filter((s) => s.rarity === "common"),
    },
    {
      rarity: "rare",
      label: "RARE (Редкий)",
      rate: caseConfig.drop_rates.rare,
      color: "#00F0FF",
      items: DROP_SPECIMENS.filter((s) => s.rarity === "rare"),
    },
    {
      rarity: "epic",
      label: "EPIC (Эпический)",
      rate: caseConfig.drop_rates.epic,
      color: "#A855F7",
      items: DROP_SPECIMENS.filter((s) => s.rarity === "epic"),
    },
    {
      rarity: "legendary",
      label: "LEGENDARY (Легендарный)",
      rate: caseConfig.drop_rates.legendary,
      color: "#F59E0B",
      items: DROP_SPECIMENS.filter((s) => s.rarity === "legendary"),
    },
    {
      rarity: "mythic",
      label: "MYTHIC (Мифический)",
      rate: caseConfig.drop_rates.mythic,
      color: "#F43F5E",
      items: DROP_SPECIMENS.filter((s) => s.rarity === "mythic"),
    },
    {
      rarity: "special_reward",
      label: "SPECIAL REWARD (Ваучер на обложку)",
      rate: caseConfig.drop_rates.special_reward,
      color: "#EAB308",
      items: DROP_SPECIMENS.filter((s) => s.rarity === "special_reward"),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#B46BFF]/45 bg-[#090611] p-6 sm:p-8 shadow-[0_0_80px_rgba(135,55,255,0.3)] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF]">
              <Percent className="w-3.5 h-3.5" />
              <span>TRANSPARENT PROBABILITIES</span>
            </div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white">
              Вероятности выпадения ({caseConfig.name})
            </h2>
            <p className="text-xs text-[#D9D9E2]/75">
              Все шансы фиксированы на сервере и рассчитываются криптографически независимым алгоритмом при каждом открытии.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rates Table Cards */}
        <div className="space-y-3">
          {rates.map((tier) => (
            <div
              key={tier.rarity}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 transition hover:border-white/25"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tier.color, boxShadow: `0 0 10px ${tier.color}` }}
                  />
                  <span className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-white">
                    {tier.label}
                  </span>
                </div>
                <span
                  className="font-display font-black text-sm sm:text-base"
                  style={{ color: tier.color }}
                >
                  {tier.rate}%
                </span>
              </div>

              {/* Progress Bar of odds */}
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, tier.rate * 1.5)}%`,
                    backgroundColor: tier.color,
                  }}
                />
              </div>

              {/* Available Items in this Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {tier.items.map((it) => (
                  <div
                    key={it.item_id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-black/60 border border-white/10 hover:border-white/25 transition"
                  >
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-black/80 border border-white/10 shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={it.image_url || `/drop/items/${it.item_id}.jpg`}
                        alt={it.item_name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith(".svg")) {
                            target.src = `/drop/items/${it.item_id}.svg`;
                          }
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {it.specimen_code && (
                          <span className="px-1.5 py-0.2 rounded bg-white/10 font-mono text-[8px] text-[#00F0FF] font-bold">
                            {it.specimen_code}
                          </span>
                        )}
                        <span className="font-mono text-[8px] text-white/50 uppercase">
                          {it.specimen_class || "SPECIMEN"}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-[11px] uppercase tracking-wide text-white truncate">
                        {it.item_name}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] font-bold" style={{ color: tier.color }}>
                        {it.drop_chance || `${(tier.rate / tier.items.length).toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Special Reward Note */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-[#D9D9E2]/90 leading-relaxed font-sans">
          <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">
              Специальная награда: Ваучер на бесплатную обложку (0.1%)
            </strong>
            Шанс выпадения ваучера является полностью честным. При выигрыше генерируется уникальный claim-код, проверяемый лично основателем CXRNER MUSIC (@kazumaiq).
          </div>
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
