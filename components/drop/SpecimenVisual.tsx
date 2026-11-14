"use client";

import { useRef, useState } from "react";
import type { DropRarity } from "@/lib/ecosystemTypes";

interface SpecimenVisualProps {
  itemId: string;
  itemName: string;
  rarity: DropRarity;
  imageUrl?: string;
  serialNumber?: number;
  collectionName?: string;
  isSpecialReward?: boolean;
  interactiveTilt?: boolean;
  className?: string;
}

const RARITY_PALETTE: Record<
  DropRarity,
  {
    name: string;
    label: string;
    color: string;
    border: string;
    glow: string;
    bg: string;
    pillBg: string;
  }
> = {
  common: {
    name: "COMMON",
    label: "COMMON",
    color: "#A1A1AA",
    border: "border-zinc-500/35",
    glow: "shadow-[0_8px_24px_rgba(0,0,0,0.65)]",
    bg: "from-[#121216] via-[#09090D] to-[#050408]",
    pillBg: "bg-zinc-500/20 text-zinc-200 border-zinc-400/35",
  },
  rare: {
    name: "RARE",
    label: "RARE",
    color: "#00F0FF",
    border: "border-[#00F0FF]/45",
    glow: "shadow-[0_10px_28px_rgba(0,240,255,0.16)]",
    bg: "from-[#091820] via-[#070B12] to-[#040307]",
    pillBg: "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/45",
  },
  epic: {
    name: "EPIC",
    label: "EPIC",
    color: "#B46BFF",
    border: "border-[#B46BFF]/55",
    glow: "shadow-[0_12px_32px_rgba(135,55,255,0.28)]",
    bg: "from-[#170B2A] via-[#0B0613] to-[#040307]",
    pillBg: "bg-[#8737FF]/20 text-[#D8B4FE] border-[#B46BFF]/50",
  },
  legendary: {
    name: "LEGENDARY",
    label: "LEGENDARY",
    color: "#F59E0B",
    border: "border-amber-400/60",
    glow: "shadow-[0_12px_36px_rgba(245,158,11,0.28)]",
    bg: "from-[#221606] via-[#0D0905] to-[#040307]",
    pillBg: "bg-amber-500/20 text-amber-300 border-amber-400/55",
  },
  mythic: {
    name: "MYTHIC",
    label: "MYTHIC",
    color: "#F43F5E",
    border: "border-rose-500/65",
    glow: "shadow-[0_14px_40px_rgba(244,63,94,0.34)]",
    bg: "from-[#260812] via-[#100409] to-[#040307]",
    pillBg: "bg-rose-500/20 text-rose-300 border-rose-500/55",
  },
  special_reward: {
    name: "SPECIAL",
    label: "SPECIAL",
    color: "#FACC15",
    border: "border-yellow-400/75",
    glow: "shadow-[0_16px_44px_rgba(250,204,21,0.36)]",
    bg: "from-[#2A2006] via-[#110D04] to-[#040307]",
    pillBg: "bg-yellow-500/20 text-yellow-200 border-yellow-400/60",
  },
};

export const RARITY_THEMES = RARITY_PALETTE;

export default function SpecimenVisual({
  itemId,
  itemName,
  rarity,
  imageUrl,
  serialNumber,
  isSpecialReward = false,
  interactiveTilt = true,
  className = "",
}: SpecimenVisualProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hovered: false });

  const resolvedRarity: DropRarity = isSpecialReward ? "special_reward" : rarity;
  const pal = RARITY_PALETTE[resolvedRarity] || RARITY_PALETTE.common;
  const resolvedImg = imageUrl || `/drop/items/${itemId}.jpg`;
  const isHighTier =
    resolvedRarity === "epic" ||
    resolvedRarity === "legendary" ||
    resolvedRarity === "mythic" ||
    resolvedRarity === "special_reward";

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveTilt || !cardRef.current) return;
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 14,
      ry: (px - 0.5) * 14,
      gx: px * 100,
      gy: py * 100,
      hovered: true,
    });
  };

  const onLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovered: false });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transform: interactiveTilt
          ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : undefined,
      }}
      className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden border bg-gradient-to-b ${pal.bg} ${pal.border} ${pal.glow} transition-transform duration-200 ease-out select-none ${className}`}
    >
      {/* Top Specimen Pouch Zipper Bar */}
      <div className="relative z-20 flex items-center justify-between px-2.5 py-1.5 bg-black/70 border-b border-white/10 backdrop-blur-md">
        <span
          className="font-mono text-[8px] font-black uppercase tracking-widest"
          style={{ color: pal.color }}
        >
          {pal.label}
        </span>
        {serialNumber !== undefined && (
          <span className="font-mono text-[8px] text-white/60">
            #{String(serialNumber).padStart(5, "0")}
          </span>
        )}
      </div>

      {/* Artwork Stage */}
      <div className="relative z-10 h-[calc(100%-26px)] w-full p-2 flex items-center justify-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${pal.color}44 0%, transparent 68%)`,
          }}
        />

        <img
          src={resolvedImg}
          alt={itemName}
          className="relative z-10 w-full h-full object-contain rounded-lg drop-shadow-[0_12px_20px_rgba(0,0,0,0.85)]"
        />

        {/* Foil Specular Glare */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            opacity: tilt.hovered ? 0.32 : 0.1,
            background: `radial-gradient(circle 140px at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.65), transparent 70%)`,
          }}
        />

        {/* Subtle Laser Scanline for High Rarities */}
        {isHighTier && (
          <div
            className="pointer-events-none absolute inset-x-0 h-[1.5px] z-20 opacity-45 animate-laser-sweep"
            style={{
              background: `linear-gradient(90deg, transparent, ${pal.color}, transparent)`,
              boxShadow: `0 0 10px ${pal.color}`,
            }}
          />
        )}
      </div>
    </div>
  );
}
