"use client";

import { useState } from "react";
import { X, History, Filter } from "lucide-react";
import type { DropHistoryEntry, ItemRarity } from "@/lib/ecosystemTypes";
import { RARITY_THEMES } from "./SpecimenVisual";

interface DropHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DropHistoryEntry[];
}

export default function DropHistoryModal({
  isOpen,
  onClose,
  history,
}: DropHistoryModalProps) {
  const [filterRarity, setFilterRarity] = useState<string>("all");

  if (!isOpen) return null;

  const filtered =
    filterRarity === "all"
      ? history
      : history.filter((h) => h.rarity === filterRarity);

  const filters = [
    { key: "all", label: "Все" },
    { key: "common", label: "Common" },
    { key: "rare", label: "Rare" },
    { key: "epic", label: "Epic" },
    { key: "legendary", label: "Legendary" },
    { key: "mythic", label: "Mythic" },
    { key: "special_reward", label: "Special" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#B46BFF]/45 bg-[#090611] p-6 sm:p-8 shadow-[0_0_80px_rgba(135,55,255,0.3)] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]">
              <History className="w-3.5 h-3.5 text-[#B46BFF]" />
              <span>DROP ARCHIVE LOGS</span>
            </div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white">
              История открытий ({history.length})
            </h2>
            <p className="text-xs text-[#D9D9E2]/75">
              Все завершённые открытия запечатанных кейсов с фиксацией серийного номера и времени.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterRarity(f.key)}
              className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition ${
                filterRarity === f.key
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "bg-white/[0.04] text-[#D9D9E2]/70 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List of Entries */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <p className="font-display font-black text-sm uppercase tracking-wide text-white/50">
              Открытий не найдено
            </p>
            <p className="text-xs text-[#D9D9E2]/50">
              Попробуйте сменить фильтр или откройте свой первый кейс.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => {
              const theme = RARITY_THEMES[item.rarity as ItemRarity] || RARITY_THEMES.common;
              const dateStr = new Date(item.created_at).toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4 transition hover:border-white/25"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={`/drop/items/${item.item_id}.svg`}
                        alt={item.item_name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-black text-xs sm:text-sm uppercase tracking-wide text-white">
                          {item.item_name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-display font-black uppercase tracking-wider border ${theme.pillBg}`}
                        >
                          {theme.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] text-[#D9D9E2]/60 mt-0.5">
                        <span>{item.case_name}</span>
                        <span>•</span>
                        <span>№{String(item.serial_number).padStart(6, "0")}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-display font-black text-xs text-[#8737FF] bg-[#8737FF]/10 px-2.5 py-1 rounded-lg border border-[#8737FF]/30 shrink-0">
                    -{item.cxp_spent} CXP
                  </span>
                </div>
              );
            })}
          </div>
        )}

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
