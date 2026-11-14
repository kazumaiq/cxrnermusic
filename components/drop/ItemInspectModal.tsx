"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { X, Pin, Box, Eye, Award, Sparkles, Loader2 } from "lucide-react";
import type { DropInventoryItem, DropRarity } from "@/lib/ecosystemTypes";
import SpecimenVisual from "./SpecimenVisual";
import { playClickSound } from "@/lib/soundFX";

const ZipPacket3DViewer = dynamic(() => import("./ZipPacket3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] sm:h-[340px] w-full flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/10">
      <Loader2 className="w-6 h-6 animate-spin text-[#B46BFF]" />
    </div>
  ),
});

interface ItemInspectModalProps {
  item: DropInventoryItem | null;
  onClose: () => void;
  onTogglePin?: (item: DropInventoryItem) => void;
}

const RARITY_COLOR: Record<DropRarity, string> = {
  common: "#A1A1AA",
  rare: "#00F0FF",
  epic: "#B46BFF",
  legendary: "#F59E0B",
  mythic: "#F43F5E",
  special_reward: "#FACC15",
};

export default function ItemInspectModal({
  item,
  onClose,
  onTogglePin,
}: ItemInspectModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"3d" | "card">("3d");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!item) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [item]);

  if (!item || !mounted) return null;

  const isSpecial = item.rarity === "special_reward" || item.is_special_reward;
  const accentColor = RARITY_COLOR[isSpecial ? "special_reward" : item.rarity] || "#B46BFF";

  const content = (
    <div
      className="fixed inset-0 z-[9998] overflow-y-auto overscroll-contain bg-[#030206]/92 backdrop-blur-2xl"
      style={{ WebkitOverflowScrolling: "touch" }}
      onClick={onClose}
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start px-3 pt-4 pb-28 sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative my-auto w-full max-w-xl sm:max-w-2xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#110D1C] via-[#07050C] to-[#040307] shadow-[0_32px_100px_rgba(0,0,0,0.92)]"
        >
          {/* Sticky Top Specimen Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-7 py-3.5 rounded-t-3xl border-b border-white/10 bg-[#100C1A]/95 backdrop-blur-xl">
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-white/85 font-bold truncate">
                SPECIMEN // #{String(item.serial_number).padStart(6, "0")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-2 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/15 text-white transition shrink-0"
              aria-label="Закрыть осмотр"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-7 space-y-5">
            {/* Header & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                  <span
                    className="px-2 py-0.5 rounded-full border"
                    style={{
                      color: accentColor,
                      borderColor: `${accentColor}55`,
                      backgroundColor: `${accentColor}16`,
                    }}
                  >
                    {isSpecial ? "SPECIAL PRIZE" : item.rarity}
                  </span>
                  {item.specimen_code && (
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/15 text-[#00F0FF]">
                      {item.specimen_code}
                    </span>
                  )}
                  {item.drop_chance && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/12 border border-amber-400/35 text-amber-300">
                      ШАНС: {item.drop_chance}
                    </span>
                  )}
                </div>
                <h2 className="font-display font-black text-xl sm:text-3xl text-white uppercase tracking-tight leading-tight">
                  {item.item_name}
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                  КОЛЛЕКЦИЯ: {item.collection_name || "CXRNER ARCHIVE"}
                </p>
              </div>

              <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/12 font-mono text-[10px] uppercase self-start shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setMode("3d");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    mode === "3d"
                      ? "bg-white text-[#050407] font-bold"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>3D Пакет</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setMode("card");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    mode === "card"
                      ? "bg-white text-[#050407] font-bold"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Карта</span>
                </button>
              </div>
            </div>

            {/* Interactive Stage */}
            {mode === "3d" ? (
              <div className="rounded-2xl border border-white/12 bg-[#040308] overflow-hidden">
                <ZipPacket3DViewer
                  imageUrl={item.image_url}
                  themeColor={accentColor}
                  labelCode={item.specimen_code || `#${String(item.serial_number).padStart(6, "0")}`}
                  specimenName={item.item_name}
                  stagePhase="idle"
                  heightClass="h-[250px] sm:h-[325px]"
                />
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <div className="w-48 sm:w-60">
                  <SpecimenVisual
                    itemId={item.item_id}
                    itemName={item.item_name}
                    rarity={isSpecial ? "special_reward" : item.rarity}
                    imageUrl={item.image_url}
                    serialNumber={item.serial_number}
                    collectionName={item.collection_name}
                    isSpecialReward={isSpecial}
                    interactiveTilt
                  />
                </div>
              </div>
            )}

            {/* Description & Metadata Telemetry */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <p className="text-xs sm:text-sm text-[#D9D9E2]/80 leading-relaxed">
                {item.description ||
                  "Цифровой коллекционный образец архива CXRNER MUSIC, запечатанный в защитный вакуумный ZIP-пакет."}
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 font-mono text-[10px]">
                <div className="p-2.5 rounded-xl bg-black/45 border border-white/10">
                  <span className="text-white/45 block mb-0.5">ИСТОЧНИК</span>
                  <span className="text-white font-bold uppercase truncate block">
                    {item.obtained_via || "ARCHIVE"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/45 border border-white/10">
                  <span className="text-white/45 block mb-0.5">ВИТРИНА ПРОФИЛЯ</span>
                  <span className={item.is_pinned ? "text-emerald-300 font-bold" : "text-white/75"}>
                    {item.is_pinned ? "ЗАКРЕПЛЕНО" : "В ИНВЕНТАРЕ"}
                  </span>
                </div>
              </div>

              {item.claim_code && (
                <div className="pt-1 flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-400/40 text-yellow-200 font-mono text-[10px] font-bold inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>CLAIM: {item.claim_code}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {onTogglePin && item.id !== "preview" && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onTogglePin(item);
                  }}
                  className={`min-h-[44px] py-3 rounded-full font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    item.is_pinned
                      ? "bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30"
                      : "btn-energy text-white"
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{item.is_pinned ? "Убрать с витрины" : "Поместить на витрину"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className={`w-full min-h-[44px] py-3 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/12 font-mono text-xs uppercase tracking-wider text-white transition cursor-pointer ${
                  !onTogglePin || item.id === "preview" ? "sm:col-span-2" : ""
                }`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
