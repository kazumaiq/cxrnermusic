"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Share2,
  ExternalLink,
  Check,
  Globe,
  MapPin,
  Sliders,
} from "lucide-react";
import type { CxrnerProfile } from "@/lib/ecosystemTypes";
import { isCeoAccount } from "@/lib/ecosystemTypes";
import { PlatformLogo, getPlatformVisualMeta } from "@/components/link/PlatformLogo";

interface ProfileHeroCardProps {
  profile: CxrnerProfile;
  totalInventoryCount?: number;
  pinnedCount?: number;
  isOwner?: boolean;
  previewMode?: boolean;
  copied?: boolean;
  onShare?: () => void;
  onOpenPass?: () => void;
}

function mapPlatformNameToKey(platform: string): string {
  const lower = platform.toLowerCase();
  if (lower.includes("spotify")) return "spotify";
  if (lower.includes("apple")) return "apple";
  if (lower.includes("яндекс") || lower.includes("yandex")) return "yandex";
  if (lower.includes("vk")) return "vk";
  if (lower.includes("youtube") || lower.includes("yt")) return "youtube";
  if (lower.includes("deezer")) return "deezer";
  if (lower.includes("звук") || lower.includes("zvuk")) return "zvuk";
  if (lower.includes("tidal")) return "tidal";
  if (lower.includes("soundcloud")) return "soundcloud";
  return "music";
}

export default function ProfileHeroCard({
  profile,
  totalInventoryCount = 0,
  pinnedCount = 0,
  isOwner = false,
  previewMode = false,
  copied = false,
  onShare,
  onOpenPass,
}: ProfileHeroCardProps) {
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [bannerBroken, setBannerBroken] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [profile.avatar_url]);

  useEffect(() => {
    setBannerBroken(false);
  }, [profile.banner_url]);

  const isCeo = isCeoAccount({
    username: profile.username,
    badge: profile.equipped_badge,
    title: profile.equipped_title,
  });

  const frameClass =
    isCeo || profile.equipped_frame === "frame-ceo-sovereign"
      ? "ring-2 ring-amber-300 border border-amber-200/80 shadow-[0_8px_28px_rgba(251,191,36,0.35)]"
      : profile.equipped_frame === "frame-cyber-chrome"
      ? "ring-2 ring-white/80 border border-white/60 shadow-[0_8px_22px_rgba(255,255,255,0.22)]"
      : profile.equipped_frame === "frame-neon-purple"
      ? "ring-2 ring-[#8737FF] border border-[#B46BFF]/80 shadow-[0_8px_24px_rgba(135,55,255,0.45)]"
      : profile.equipped_frame === "frame-mythic-gold"
      ? "ring-2 ring-amber-400 border border-amber-300/70 shadow-[0_8px_24px_rgba(251,191,36,0.32)]"
      : profile.equipped_frame === "frame-glitch-cyan"
      ? "ring-2 ring-[#00F0FF] border border-[#00F0FF]/80 shadow-[0_8px_24px_rgba(0,240,255,0.35)]"
      : "border-2 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.65)]";

  const auraClass =
    isCeo || profile.equipped_effect === "effect-ceo-crown"
      ? "ring-offset-2 ring-offset-[#0C0A15] shadow-[0_0_28px_rgba(251,191,36,0.45)]"
      : profile.equipped_effect === "effect-purple-aura"
      ? "ring-offset-2 ring-offset-[#0C0A15] shadow-[0_0_24px_rgba(180,107,255,0.5)]"
      : profile.equipped_effect === "effect-cyan-pulse"
      ? "ring-offset-2 ring-offset-[#0C0A15] shadow-[0_0_24px_rgba(0,240,255,0.5)]"
      : profile.equipped_effect === "effect-chrome-sheen"
      ? "ring-offset-2 ring-offset-[#0C0A15] shadow-[0_0_20px_rgba(255,255,255,0.45)]"
      : "";

  const initialLetter = String(profile.display_name || profile.username || "C")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className={`rounded-3xl bg-[#0C0A15] overflow-hidden ${
        isCeo
          ? "border border-amber-400/50 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
          : "border border-white/12 shadow-[0_16px_48px_rgba(0,0,0,0.8)]"
      }`}
    >
      {/* Top Clean Toolbar — Zero Overlap Guaranteed */}
      <div className="px-4 sm:px-6 py-3 bg-[#08060F] border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {isCeo ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/45 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200 truncate">
              <span>👑</span>
              <span className="truncate">FOUNDER & CEO · #000001</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider text-[#D9D9E2]/80 truncate">
              <Sparkles className="w-3 h-3 text-[#00F0FF] shrink-0" />
              <span className="truncate">CXRNER ID · @{profile.username}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {previewMode ? (
            <span className="px-3 py-1 rounded-full bg-[#00F0FF]/12 border border-[#00F0FF]/35 font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
              Предпросмотр в реальном времени
            </span>
          ) : (
            <>
              {onOpenPass && (
                <button
                  type="button"
                  onClick={onOpenPass}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8737FF] hover:bg-[#9955FF] text-[11px] font-mono font-bold text-white shadow-[0_4px_14px_rgba(135,55,255,0.4)] transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>3D Пропуск</span>
                </button>
              )}
              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-[11px] font-mono font-medium text-white transition active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#B46BFF]" />
                      <span>Поделиться</span>
                    </>
                  )}
                </button>
              )}
              {isOwner && (
                <Link
                  href="/cabinet/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00F0FF]/12 hover:bg-[#00F0FF]/22 border border-[#00F0FF]/35 text-[11px] font-mono font-bold text-[#00F0FF] transition"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Настроить</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Crisp Architectural Header Banner */}
      <div
        className={`relative w-full overflow-hidden ${
          previewMode ? "h-32 sm:h-40" : "h-36 sm:h-52"
        } ${
          isCeo
            ? "bg-gradient-to-br from-[#201407] via-[#120A24] to-[#081A24]"
            : "bg-gradient-to-br from-[#160D28] via-[#0B0816] to-[#08131E]"
        }`}
      >
        {profile.banner_url && !bannerBroken ? (
          <img
            src={profile.banner_url}
            alt="Обложка профиля"
            onError={() => setBannerBroken(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full relative"
            style={{
              backgroundImage: isCeo
                ? "linear-gradient(to right, rgba(251,191,36,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.07) 1px, transparent 1px)"
                : "linear-gradient(to right, rgba(135,55,255,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          >
            <div className="absolute right-6 top-1/2 -translate-y-1/2 font-display font-black text-3xl sm:text-5xl tracking-[0.25em] text-white/[0.04] select-none pointer-events-none uppercase">
              CXRNER
            </div>
          </div>
        )}
        {/* Sharp bottom fade scrim ONLY along bottom edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0C0A15] to-transparent" />
      </div>

      {/* Main Content */}
      <div className="px-5 sm:px-8 pb-7 relative">
        {/* Identity Row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 -mt-12 sm:-mt-16 mb-5">
          {/* Bulletproof Avatar */}
          <div className="relative shrink-0 self-start">
            <div
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#120F1E] flex items-center justify-center ${frameClass} ${auraClass}`}
            >
              {profile.avatar_url && !avatarBroken ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  onError={() => setAvatarBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1233] via-[#0E0B1A] to-[#081A24] select-none">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white">
                    {initialLetter}
                  </span>
                </div>
              )}
            </div>

            {profile.is_artist_verified && (
              <div
                className={`absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full border-2 border-[#0C0A15] ${
                  isCeo
                    ? "bg-gradient-to-r from-amber-400 to-[#00F0FF] text-[#050407] shadow-md"
                    : "bg-[#8737FF] text-white shadow-md"
                }`}
                title={isCeo ? "FOUNDER & CEO // CXRNER MUSIC" : "CXRNER VERIFIED ARTIST"}
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            )}
          </div>

          {/* Display Name & Status Badges */}
          <div className="flex-1 min-w-0 space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={`font-display font-black text-2xl sm:text-3xl tracking-tight leading-none ${
                  isCeo
                    ? "bg-gradient-to-r from-amber-200 via-white to-[#00F0FF] bg-clip-text text-transparent"
                    : "text-white"
                }`}
              >
                {profile.display_name || profile.username}
              </h1>

              {isCeo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-300/60 text-amber-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span>👑</span>
                  <span>FOUNDER & CEO</span>
                </span>
              )}

              {profile.is_artist_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8737FF]/20 border border-[#8737FF]/60 text-[#E9D5FF] text-[10px] font-mono font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-[#00F0FF]" />
                  <span>VERIFIED</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-[#D9D9E2]/65">
              <span className="text-white/80 font-semibold">@{profile.username}</span>
              {profile.equipped_title && (
                <>
                  <span className="text-white/25">•</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                      isCeo
                        ? "bg-[#00F0FF]/12 border border-[#00F0FF]/35 text-[#00F0FF] font-bold"
                        : "bg-white/[0.06] border border-white/10 text-white/85"
                    }`}
                  >
                    {profile.equipped_title}
                  </span>
                </>
              )}
              {profile.country && (
                <>
                  <span className="text-white/25">•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B46BFF]" />
                    {profile.city ? `${profile.city}, ` : ""}
                    {profile.country}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-[#D9D9E2]/90 font-sans leading-relaxed max-w-3xl whitespace-pre-line mb-5">
            {profile.bio}
          </p>
        )}

        {/* Categorized Roles & Genres */}
        {(profile.music_roles?.length > 0 || profile.genres?.length > 0) && (
          <div className="space-y-2.5 pb-5 border-b border-white/10">
            {profile.music_roles && profile.music_roles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 mr-1">
                  Роли:
                </span>
                {profile.music_roles.map((role) => (
                  <span
                    key={role}
                    className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/12 text-[11px] font-mono text-white/95"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
            {profile.genres && profile.genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 mr-1">
                  Жанры:
                </span>
                {profile.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-lg bg-[#8737FF]/15 border border-[#8737FF]/35 text-[11px] font-mono text-[#D8B4FE]"
                  >
                    #{g}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Official DSP & Social Links */}
        {(profile.music_links?.length > 0 || profile.social_links?.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-4 pb-1">
            {profile.music_links?.map((link, idx) => {
              const pKey = mapPlatformNameToKey(link.platform);
              const meta = getPlatformVisualMeta(pKey);
              return (
                <a
                  key={`ml-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/12 hover:border-white/30 text-xs font-mono text-white transition"
                >
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: meta.bgGradient, color: meta.fgColor }}
                  >
                    <PlatformLogo platformKey={pKey} className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-semibold">{link.platform}</span>
                  <ExternalLink className="w-3 h-3 opacity-45" />
                </a>
              );
            })}
            {profile.social_links?.map((link, idx) => (
              <a
                key={`sl-${idx}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/12 hover:border-[#00F0FF]/50 text-xs font-mono text-white transition"
              >
                <Globe className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="font-semibold">{link.platform}</span>
                <ExternalLink className="w-3 h-3 opacity-45" />
              </a>
            ))}
          </div>
        )}

        {/* Crisp CEO Executive Strip */}
        {isCeo && !previewMode && (
          <div className="mt-5 pt-4 border-t border-amber-400/25 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#120D07] border border-amber-400/35">
              <div className="font-mono text-[9px] uppercase tracking-wider text-amber-200/70">
                СТАТУС
              </div>
              <div className="font-display font-black text-xs sm:text-sm text-amber-300 mt-1">
                FOUNDER & CEO
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#071117] border border-[#00F0FF]/30">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]/75">
                ДИСТРИБУЦИЯ
              </div>
              <div className="font-display font-black text-xs sm:text-sm text-white mt-1">
                150+ DSP · 70/30
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#110B1D] border border-[#B46BFF]/35">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#E9D5FF]/75">
                ПРОПУСК
              </div>
              <div className="font-display font-black text-xs sm:text-sm text-[#00F0FF] mt-1">
                GENESIS #000001
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#071510] border border-emerald-400/30">
              <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-200/75">
                КОЛЛЕКЦИЯ DROP
              </div>
              <div className="font-display font-black text-xs sm:text-sm text-emerald-300 mt-1">
                {totalInventoryCount} АРТЕФАКТОВ ({pinnedCount} ВИТР.)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
