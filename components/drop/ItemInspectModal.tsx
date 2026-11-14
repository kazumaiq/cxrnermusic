"use client";

import { useState } from "react";
import { X, Pin, Sparkles, ExternalLink, RotateCw, Check } from "lucide-react";
import type { DropInventoryItem, ItemRarity } from "@/lib/ecosystemTypes";
import CollectionItem3DViewer from "@/components/3d/CollectionItem3DViewer";
import SpecimenVisual, { RARITY_THEMES } from "./SpecimenVisual";

interface ItemInspectModalProps {
  item: DropInventoryItem | null;
  onClose: () => void;
  onTogglePin?: (item: DropInventoryItem) => void;
}

export default function ItemInspectModal({
  item,
  onClose,
  onTogglePin,
}: ItemInspectModalProps) {
  const [view3D, setView3D] = useState(true);

  if (!item) return null;

  const theme = RARITY_THEMES[item.rarity as ItemRarity] || RARITY_THEMES.common;
  const isSpecial = item.rarity === "special_reward";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#B46BFF]/45 bg-[#090611] p-6 sm:p-8 shadow-[0_0_80px_rgba(135,55,255,0.35)] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full font-display font-black text-[9px] uppercase tracking-wider border backdrop-blur-md ${theme.pillBg}`}
              >
                {theme.name}
              </span>
              <span className="font-mono text-xs text-[#D9D9E2]/60 uppercase tracking-widest">
                №{String(item.serial_number).padStart(6, "0")}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white">
              {item.item_name}
            </h2>
            <p className="font-mono text-xs text-[#00F0FF] uppercase tracking-wider">
              КОЛЛЕКЦИЯ: {item.collection_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D / 2D Toggle */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setView3D(false)}
            className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition ${
              !view3D
                ? "bg-white text-black font-bold"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            2D POUCH
          </button>
          <button
            onClick={() => setView3D(true)}
            className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition ${
              view3D
                ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            3D MESH
          </button>
        </div>

        {/* Centerpiece Visual */}
        <div className="rounded-2xl overflow-hidden bg-black/60 border border-white/10 p-4 flex items-center justify-center">
          {view3D ? (
            <div className="w-full h-64 sm:h-72">
              <CollectionItem3DViewer
                itemName={item.item_name}
                rarity={item.rarity as any}
                modelColor={item.model_color}
                serialNumber={item.serial_number}
              />
            </div>
          ) : (
            <div className="max-w-[260px] mx-auto py-2">
              <SpecimenVisual
                itemId={item.item_id}
                itemName={item.item_name}
                rarity={item.rarity}
                imageUrl={item.image_url}
                serialNumber={item.serial_number}
                collectionName={item.collection_name}
                isSpecialReward={isSpecial}
              />
            </div>
          )}
        </div>

        {/* Description & Technical Metadata */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[#D9D9E2]/85 leading-relaxed font-sans">
            {item.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-[10px] text-[#D9D9E2]/70">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="block text-white/40 mb-0.5">ИСТОЧНИК</span>
              <span className="text-white font-bold uppercase">{item.obtained_via}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="block text-white/40 mb-0.5">ДАТА ПОЛУЧЕНИЯ</span>
              <span className="text-white font-bold">
                {new Date(item.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
              <span className="block text-white/40 mb-0.5">СТАТУС ВИТРИНЫ</span>
              <span
                className={`font-bold ${
                  item.is_pinned ? "text-emerald-400" : "text-white/60"
                }`}
              >
                {item.is_pinned ? "На витрине" : "В архиве"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(item)}
              className={`py-3 rounded-full font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                item.is_pinned
                  ? "bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30"
                  : "btn-energy text-white shadow-[0_0_20px_rgba(135,55,255,0.4)]"
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{item.is_pinned ? "Убрать с витрины" : "Поместить на витрину"}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-white transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
