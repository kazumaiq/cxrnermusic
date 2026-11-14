"use client";

import { useState } from "react";
import Image from "next/image";
import type { ItemRarity } from "@/lib/ecosystemTypes";

interface SpecimenVisualProps {
  itemId: string;
  itemName: string;
  rarity: ItemRarity;
  imageUrl?: string;
  serialNumber?: number;
  collectionName?: string;
  isSpecialReward?: boolean;
  className?: string;
  priority?: boolean;
  interactiveTilt?: boolean;
}

export const RARITY_THEMES: Record<
  ItemRarity,
  {
    border: string;
    glow: string;
    bg: string;
    text: string;
    pillBg: string;
    name: string;
  }
> = {
  common: {
    border: "border-slate-500/40",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.15)]",
    bg: "from-slate-900/60 to-black/80",
    text: "text-slate-300",
    pillBg: "bg-slate-800/80 border-slate-600 text-slate-300",
    name: "COMMON",
  },
  rare: {
    border: "border-[#00F0FF]/50",
    glow: "shadow-[0_0_28px_rgba(0,240,255,0.28)]",
    bg: "from-[#082F49]/70 to-black/80",
    text: "text-[#38BDF8]",
    pillBg: "bg-[#082F49]/80 border-[#00F0FF]/60 text-[#38BDF8]",
    name: "RARE",
  },
  epic: {
    border: "border-[#A855F7]/60",
    glow: "shadow-[0_0_35px_rgba(168,85,247,0.38)]",
    bg: "from-[#3B0764]/70 to-black/80",
    text: "text-[#C084FC]",
    pillBg: "bg-[#3B0764]/80 border-[#A855F7]/60 text-[#C084FC]",
    name: "EPIC",
  },
  legendary: {
    border: "border-[#F59E0B]/70",
    glow: "shadow-[0_0_45px_rgba(245,158,11,0.45)]",
    bg: "from-[#451A03]/75 to-black/85",
    text: "text-[#FCD34D]",
    pillBg: "bg-[#451A03]/80 border-[#F59E0B]/70 text-[#FCD34D]",
    name: "LEGENDARY",
  },
  mythic: {
    border: "border-[#F43F5E]/80",
    glow: "shadow-[0_0_60px_rgba(244,63,94,0.6)]",
    bg: "from-[#4C0519]/80 to-black/90",
    text: "text-[#FB7185]",
    pillBg: "bg-[#4C0519]/90 border-[#F43F5E]/80 text-[#FB7185]",
    name: "MYTHIC",
  },
  special_reward: {
    border: "border-[#EAB308]/90",
    glow: "shadow-[0_0_70px_rgba(234,179,8,0.7)]",
    bg: "from-[#422006]/90 to-black/95",
    text: "text-[#FDE047]",
    pillBg: "bg-[#422006]/90 border-[#EAB308] text-[#FEF08A]",
    name: "SPECIAL REWARD",
  },
};

export default function SpecimenVisual({
  itemId,
  itemName,
  rarity,
  imageUrl,
  serialNumber,
  collectionName,
  isSpecialReward = false,
  className = "",
  interactiveTilt = true,
}: SpecimenVisualProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);

  const theme = RARITY_THEMES[rarity] || RARITY_THEMES.common;
  const resolvedSrc = imageUrl || `/drop/items/${itemId}.svg`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.4s ease-out" : "none",
      }}
      className={`relative group rounded-3xl overflow-hidden border ${theme.border} ${theme.glow} bg-gradient-to-b ${theme.bg} p-2.5 transition-all duration-300 ${className}`}
    >
      {/* Specimen Ambient Backlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${theme.text}33, transparent 70%)`,
        }}
      />

      {/* Main Specimen Image Display */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center">
        {!imageError ? (
          <img
            src={resolvedSrc}
            alt={itemName}
            className="w-full h-full object-contain p-1 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] group-hover:scale-[1.03] transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <span className="font-display font-black text-xs text-white/40 uppercase tracking-widest">
              CXRNER SPECIMEN
            </span>
            <span className="font-mono text-[10px] text-white/60 mt-1">{itemName}</span>
          </div>
        )}

        {/* Holographic Specimen Seal Sticker (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/20 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
          <span className="font-mono text-[8px] uppercase tracking-wider text-white font-bold">
            {isSpecialReward ? "VIP VOUCHER" : `№${serialNumber ? String(serialNumber).padStart(6, "0") : "ARCHIVE"}`}
          </span>
        </div>

        {/* Rarity Pill (Top Right) */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full font-display font-black text-[9px] uppercase tracking-wider border backdrop-blur-md ${theme.pillBg}`}
          >
            {theme.name}
          </span>
        </div>
      </div>
    </div>
  );
}
