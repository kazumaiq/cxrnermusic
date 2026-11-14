"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Box, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { CxrSurface } from "../ui/CxrSurface";
import { CxrButton } from "../ui/CxrButton";
import { CxrBadge } from "../ui/CxrBadge";
import { DROP_SPECIMENS, type DropRarity } from "@/lib/ecosystemTypes";
import { playHoverSound, playClickSound } from "@/lib/soundFX";

const RARITY_STYLES: Record<DropRarity, { label: string; color: string }> = {
  common: { label: "COMMON", color: "#9CA3AF" },
  rare: { label: "RARE", color: "#00F0FF" },
  epic: { label: "EPIC", color: "#B46BFF" },
  legendary: { label: "LEGENDARY", color: "#F59E0B" },
  mythic: { label: "MYTHIC", color: "#F43F5E" },
  special_reward: { label: "SPECIAL PRIZE", color: "#FACC15" },
};

export default function CxrnerDropShowcaseSection() {
  const showcaseItems = useMemo(() => {
    const jpgs = DROP_SPECIMENS.filter((s) => s.image_url.endsWith(".jpg"));
    return jpgs.slice(0, 5);
  }, []);

  const [activeId, setActiveId] = useState(
    showcaseItems[0]?.item_id || DROP_SPECIMENS[0]?.item_id || ""
  );
  const activeSpecimen =
    showcaseItems.find((s) => s.item_id === activeId) ||
    showcaseItems[0] ||
    DROP_SPECIMENS[0];
  const rarityMeta = activeSpecimen
    ? RARITY_STYLES[activeSpecimen.rarity] || RARITY_STYLES.rare
    : RARITY_STYLES.legendary;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left: Specimen Vault Interactive Inspection Stage */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <CxrSurface variant="chrome" accent="violet" className="p-5 sm:p-7 space-y-5">
            {/* Top Telemetry Bar */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#D9D9E2]/65">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B46BFF] animate-pulse" />
                <span>
                  VAULT SPECIMEN // {activeSpecimen?.specimen_code || "ARCHIVE"}
                </span>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full border font-mono text-[9px] font-bold uppercase tracking-widest"
                style={{
                  color: rarityMeta.color,
                  borderColor: `${rarityMeta.color}66`,
                  backgroundColor: `${rarityMeta.color}18`,
                }}
              >
                {rarityMeta.label} · {activeSpecimen?.drop_chance || "—"}
              </span>
            </div>

            {/* Active Specimen High-Craft Frame */}
            {activeSpecimen && (
              <div className="relative rounded-2xl border border-white/15 bg-[#050409] overflow-hidden aspect-[4/3] flex items-center justify-center p-4 group">
                <div
                  className="pointer-events-none absolute inset-0 opacity-25 transition-all duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 45%, ${rarityMeta.color}55 0%, transparent 70%)`,
                  }}
                />
                {/* Sweeping metallic light reflection */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-chrome-sheen" />

                <img
                  src={activeSpecimen.image_url}
                  alt={activeSpecimen.item_name}
                  className="relative z-10 w-full h-full object-contain max-h-[270px] rounded-xl transition-transform duration-500 group-hover:scale-[1.03] drop-shadow-[0_24px_48px_rgba(0,0,0,0.9)]"
                />

                <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#06050B]/90 border border-white/12 backdrop-blur-xl">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-white truncate">
                      {activeSpecimen.item_name}
                    </p>
                    <p className="font-mono text-[10px] text-[#D9D9E2]/55 truncate">
                      {activeSpecimen.description}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#00F0FF] shrink-0">
                    SEALED ZIP
                  </span>
                </div>
              </div>
            )}

            {/* Real ZIP Packet Rack Selector */}
            <div className="grid grid-cols-5 gap-2">
              {showcaseItems.map((item) => {
                const selected = item.item_id === activeSpecimen?.item_id;
                const rCfg = RARITY_STYLES[item.rarity] || RARITY_STYLES.common;
                return (
                  <button
                    key={item.item_id}
                    type="button"
                    onMouseEnter={() => {
                      playHoverSound();
                      setActiveId(item.item_id);
                    }}
                    onClick={() => {
                      playClickSound();
                      setActiveId(item.item_id);
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer bg-[#07060D] ${
                      selected
                        ? "border-white scale-[1.03] shadow-[0_0_20px_rgba(180,107,255,0.4)]"
                        : "border-white/12 opacity-65 hover:opacity-100 hover:border-white/35"
                    }`}
                  >
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className="absolute bottom-1 right-1 w-2 h-2 rounded-full ring-1 ring-black"
                      style={{ backgroundColor: rCfg.color }}
                    />
                  </button>
                );
              })}
            </div>
          </CxrSurface>
        </div>

        {/* Right: Editorial Pitch & Spec Metrics */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <CxrBadge tone="violet" pulse>
              SPECIMEN ARCHIVE GAME
            </CxrBadge>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#D9D9E2]/45">
              // SERVICE MODULE 02
            </span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-[0.98]">
            CXRNER <span className="text-violet-energy">DROP</span>
          </h2>

          <p className="text-sm sm:text-base text-[#D9D9E2]/75 leading-relaxed max-w-xl">
            Лаборатория цифровых артефактов лейбла. Вскрывайте запечатанные
            ZIP-образцы за CXP, собирайте редкие предметы в 3D-инвентаре,
            закрепляйте витрину в публичном CXRNER ID и выигрывайте эксклюзивные
            обложки для своих релизов.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <CxrSurface variant="obsidian" className="p-4">
              <div className="font-display font-black text-2xl text-white">3</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/55 mt-1">
                Контейнера
              </div>
            </CxrSurface>
            <CxrSurface variant="obsidian" className="p-4">
              <div className="font-display font-black text-2xl text-[#B46BFF]">
                {DROP_SPECIMENS.length}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/55 mt-1">
                Артефактов
              </div>
            </CxrSurface>
            <CxrSurface variant="obsidian" className="p-4">
              <div className="font-display font-black text-2xl text-yellow-300">
                0.1%
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/55 mt-1">
                Cover Voucher
              </div>
            </CxrSurface>
          </div>

          <div className="space-y-2.5 font-mono text-xs text-[#D9D9E2]/75">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#00F0FF] shrink-0" />
              <span>Прозрачные шансы выпадения — от Common до 0.1% Voucher</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#B46BFF] shrink-0" />
              <span>Интерактивный 3D-осмотр каждого артефакта и витрина CXRNER ID</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>Спецприз: Бесплатная обложка с уникальным Claim-кодом</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <CxrButton href="/drop" variant="energy" size="lg">
              <Box className="w-4 h-4" />
              <span>ОТКРЫТЬ CXRNER DROP</span>
              <ArrowRight className="w-4 h-4" />
            </CxrButton>
            <CxrButton href="/dashboard" variant="ghost" size="lg">
              <span>Получить CXP</span>
            </CxrButton>
          </div>
        </div>
      </div>
    </div>
  );
}
