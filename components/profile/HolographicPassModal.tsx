"use client";

import React, { useState } from "react";
import { Check, Copy, QrCode, RotateCw, ShieldCheck, Sparkles, X } from "lucide-react";
import type { CxrnerProfile, DropInventoryItem } from "@/lib/ecosystemTypes";
import { isCeoAccount } from "@/lib/ecosystemTypes";

interface HolographicPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CxrnerProfile;
  topArtifact?: DropInventoryItem | null;
  totalArtifacts: number;
}

export default function HolographicPassModal({
  isOpen,
  onClose,
  profile,
  topArtifact,
  totalArtifacts,
}: HolographicPassModalProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const relY = (e.clientY - rect.top) / Math.max(1, rect.height);
    const rotY = (relX - 0.5) * 26;
    const rotX = (0.5 - relY) * 22;
    setTilt({
      x: rotX,
      y: rotY,
      glareX: Math.round(relX * 100),
      glareY: Math.round(relY * 100),
    });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const handleCopyPassUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const isCeo = isCeoAccount({
    username: profile.username,
    badge: profile.equipped_badge,
    title: profile.equipped_title,
  });

  const serialNumber = isCeo
    ? "CXR-CEO-0001"
    : `CXR-${String(profile.id || "0001")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md flex flex-col items-center space-y-5">
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00F0FF]">
            <Sparkles className="w-3.5 h-3.5 text-[#8737FF]" />
            <span>3D HOLOGRAPHIC VIP PASS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chrome Lanyard Shackle Visual */}
        <div className="flex flex-col items-center -mb-3 z-20 pointer-events-none">
          <div className="w-1.5 h-8 bg-gradient-to-b from-transparent via-white/50 to-zinc-300 rounded-full" />
          <div className="w-12 h-4 rounded-full border-2 border-zinc-300 bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
        </div>

        {/* Interactive 3D Badge Container */}
        <div
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={() => setFlipped((f) => !f)}
          className="relative w-[310px] sm:w-[340px] h-[470px] cursor-pointer select-none"
          style={{ perspective: "1200px" }}
        >
          <div
            className={`relative w-full h-full rounded-[28px] p-6 flex flex-col justify-between overflow-hidden transition-transform duration-200 ease-out ${
              isCeo
                ? "border-2 border-amber-300/80 bg-gradient-to-b from-[#231507] via-[#0B0719] to-[#040D12] shadow-[0_30px_95px_rgba(251,191,36,0.45)]"
                : "border border-white/30 bg-gradient-to-b from-[#150D2A] via-[#090612] to-[#050409] shadow-[0_30px_90px_rgba(135,55,255,0.45)]"
            }`}
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${
                tilt.y + (flipped ? 180 : 0)
              }deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Top Punch Slot */}
            <div className="w-16 h-2.5 rounded-full bg-black/90 border border-white/25 mx-auto mb-1" />

            {/* Iridescent Holographic Foil Overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen transition-opacity"
              style={{
                background: isCeo
                  ? `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(251,191,36,0.65) 0%, rgba(0,240,255,0.45) 40%, rgba(180,107,255,0.25) 70%, transparent 90%)`
                  : `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(0,240,255,0.55) 0%, rgba(180,107,255,0.35) 35%, rgba(255,46,147,0.2) 65%, transparent 85%)`,
              }}
            />

            {!flipped ? (
              /* FRONT OF VIP PASS */
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div>
                    <div className="font-display font-black text-xs tracking-wider text-white">
                      CXRNER MUSIC
                    </div>
                    <div
                      className={`font-mono text-[9px] uppercase tracking-[0.22em] ${
                        isCeo ? "text-amber-300 font-bold" : "text-[#00F0FF]"
                      }`}
                    >
                      {isCeo ? "👑 SOVEREIGN FOUNDER PASS" : "ALL-ACCESS RESIDENT ID"}
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold ${
                      isCeo
                        ? "bg-amber-500/25 border border-amber-300/60 text-amber-200"
                        : "bg-[#8737FF]/25 border border-[#B46BFF]/50 text-[#E9D5FF]"
                    }`}
                  >
                    {serialNumber}
                  </div>
                </div>

                {/* Resident Avatar & Name */}
                <div className="flex flex-col items-center text-center my-auto space-y-3 py-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#00F0FF] bg-black shadow-[0_0_30px_rgba(0,240,255,0.35)]">
                      <img
                        src={profile.avatar_url || "/logo.png"}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {profile.is_artist_verified && (
                      <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#00F0FF] text-[#050407] font-mono text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-lg">
                        <ShieldCheck className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display font-black text-xl uppercase tracking-tight text-white">
                      {profile.display_name}
                    </h3>
                    <p className="font-mono text-xs text-[#00F0FF]">@{profile.username}</p>
                  </div>

                  {/* Top DROP Trophy Strip */}
                  <div className="w-full p-3 rounded-2xl bg-black/60 border border-white/15 text-left flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[8px] uppercase tracking-widest text-white/45">
                        ГЛАВНЫЙ АРТЕФАКТ CXRNER DROP
                      </div>
                      <div className="font-display font-bold text-xs text-[#E9D5FF] uppercase truncate mt-0.5">
                        {topArtifact?.item_name || "SPECIMEN COLLECTOR"}
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-[#8737FF]/25 border border-[#B46BFF]/40 font-mono text-[10px] font-bold text-[#00F0FF] shrink-0">
                      {totalArtifacts} шт.
                    </div>
                  </div>
                </div>

                {/* Bottom Metallic Security Strip */}
                <div className="pt-3 border-t border-white/15 flex items-center justify-between font-mono text-[9px] text-white/60">
                  <span className={isCeo ? "text-amber-300 font-bold" : ""}>
                    {isCeo ? "CLEARANCE: ROOT 00 // CEO" : "CLEARANCE: LEVEL 09"}
                  </span>
                  <span className="text-[#00F0FF] font-bold">НАЖМИТЕ ДЛЯ ОБОРОТА ↻</span>
                </div>
              </div>
            ) : (
              /* BACK OF VIP PASS (rotated 180deg) */
              <div
                className="relative z-10 flex flex-col justify-between h-full text-center"
                style={{ transform: "rotateY(180deg)" }}
              >
                <div className="border-b border-white/15 pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00F0FF]">
                  SECURITY VERIFICATION MATRIX
                </div>

                <div className="my-auto space-y-4">
                  <div className="w-36 h-36 mx-auto rounded-2xl bg-white p-3 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.35)]">
                    <QrCode className="w-full h-full text-[#050407]" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-display font-bold text-sm text-white uppercase">
                      @{profile.username}
                    </div>
                    <p className="font-mono text-[10px] text-white/55 max-w-[230px] mx-auto">
                      Официальный голографический пропуск резидента экосистемы CXRNER MUSIC.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/15 font-mono text-[9px] text-white/50 flex items-center justify-between">
                  <span>ID: {serialNumber}</span>
                  <span className="text-[#B46BFF]">ЛИЦЕВАЯ СТОРОНА ↻</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="px-4 py-2.5 rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] font-mono text-xs uppercase tracking-wider text-white inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Перевернуть 3D</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPassUrl}
            className="btn-energy px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Ссылка скопирована</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Поделиться пропуском</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
