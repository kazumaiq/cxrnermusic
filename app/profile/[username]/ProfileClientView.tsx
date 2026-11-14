"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Share2,
  ExternalLink,
  Award,
  Boxes,
  Music,
  Check,
  X,
  Disc,
  Radio,
  Globe,
  MapPin,
} from "lucide-react";
import type { CxrnerProfile, DropInventoryItem, CxrnerArtistProfile } from "@/lib/ecosystemTypes";
import { ACHIEVEMENTS_CATALOG, isCeoAccount } from "@/lib/ecosystemTypes";
import SpecimenVisual from "@/components/drop/SpecimenVisual";
import ItemInspectModal from "@/components/drop/ItemInspectModal";
import HolographicPassModal from "@/components/profile/HolographicPassModal";

interface ProfileClientViewProps {
  profile: CxrnerProfile;
  pinnedItems: DropInventoryItem[];
  totalInventoryCount: number;
  artistProject: CxrnerArtistProfile | null;
}

export default function ProfileClientView({
  profile,
  pinnedItems,
  totalInventoryCount,
  artistProject,
}: ProfileClientViewProps) {
  const [selectedItem, setSelectedItem] = useState<DropInventoryItem | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isCeo = isCeoAccount({
    username: profile.username,
    badge: profile.equipped_badge,
    title: profile.equipped_title,
  });

  const equippedEffectClass =
    isCeo || profile.equipped_effect === "effect-ceo-crown"
      ? "ring-4 ring-amber-400/90 shadow-[0_0_45px_rgba(251,191,36,0.75),0_0_85px_rgba(0,240,255,0.45)]"
      : profile.equipped_effect === "effect-purple-aura"
      ? "ring-4 ring-[#B46BFF]/70 shadow-[0_0_30px_rgba(180,107,255,0.7)]"
      : profile.equipped_effect === "effect-cyan-pulse"
      ? "ring-4 ring-[#00F0FF]/70 shadow-[0_0_30px_rgba(0,240,255,0.7)]"
      : profile.equipped_effect === "effect-chrome-sheen"
      ? "ring-4 ring-white/80 shadow-[0_0_24px_rgba(255,255,255,0.8)]"
      : "ring-2 ring-white/10";

  const equippedFrameBorder =
    isCeo || profile.equipped_frame === "frame-ceo-sovereign"
      ? "border-2 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.65)]"
      : profile.equipped_frame === "frame-cyber-chrome"
      ? "border-2 border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
      : profile.equipped_frame === "frame-neon-purple"
      ? "border-2 border-[#8737FF] shadow-[0_0_20px_rgba(135,55,255,0.6)]"
      : profile.equipped_frame === "frame-mythic-gold"
      ? "border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
      : profile.equipped_frame === "frame-glitch-cyan"
      ? "border-2 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.6)]"
      : "border border-white/20";

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-20 pb-28 selection:bg-[#8737FF] selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[780px] h-[380px] blur-[130px] rounded-full ${
            isCeo ? "bg-amber-500/20" : "bg-[#8737FF]/15"
          }`}
        />
        <div className="absolute top-[450px] right-10 w-[450px] h-[450px] bg-[#00F0FF]/12 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card Shell */}
        <div
          className={`rounded-3xl bg-[#090611]/85 overflow-hidden backdrop-blur-2xl ${
            isCeo
              ? "border-2 border-amber-400/50 shadow-[0_24px_80px_rgba(245,158,11,0.28),0_0_50px_rgba(0,240,255,0.16)]"
              : "border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.85)]"
          }`}
        >
          {/* Header Banner */}
          <div
            className={`relative h-48 sm:h-68 w-full overflow-hidden ${
              isCeo
                ? "bg-gradient-to-r from-[#1F1205] via-[#120926] to-[#061A24]"
                : "bg-gradient-to-r from-[#160B28] via-[#090611] to-[#12081C]"
            }`}
          >
            {profile.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover opacity-80"
              />
            ) : isCeo ? (
              <div className="w-full h-full opacity-85 bg-[radial-gradient(circle_at_25%_35%,rgba(251,191,36,0.38)_0%,rgba(135,55,255,0.28)_45%,rgba(0,240,255,0.22)_80%,transparent_100%)]" />
            ) : (
              <div className="w-full h-full opacity-40 bg-[radial-gradient(circle_at_center,_rgba(135,55,255,0.25)_0%,_transparent_70%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090611] via-transparent to-black/30" />

            {/* Exclusive CEO Sovereign Crest on Top-Left */}
            {isCeo && (
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-[#8737FF]/35 to-[#00F0FF]/30 border border-amber-300/60 backdrop-blur-md shadow-[0_0_25px_rgba(251,191,36,0.45)]">
                <span className="text-sm">👑</span>
                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                  FOUNDER & CEO // ROOT ID #000001
                </span>
              </div>
            )}

            {/* Share & 3D VIP Pass floating buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPassModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8737FF]/80 hover:bg-[#8737FF] border border-[#00F0FF]/50 text-xs font-mono font-bold text-white shadow-[0_0_20px_rgba(135,55,255,0.6)] backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>🪪 3D VIP-ПРОПУСК</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-xs font-mono font-medium text-white shadow-lg backdrop-blur-md transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ссылка скопирована!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#B46BFF]" />
                    <span>Поделиться</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Identity Bar */}
          <div className="px-5 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar + Frame */}
              <div className="relative shrink-0">
                <div
                  className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-[#0A0714] ${equippedFrameBorder} ${equippedEffectClass} transition-all duration-300`}
                >
                  <img
                    src={profile.avatar_url || "/logo.png"}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {profile.is_artist_verified && (
                  <div
                    className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-2 border-[#090611] text-white ${
                      isCeo
                        ? "bg-gradient-to-r from-amber-400 to-[#00F0FF] text-[#050407] shadow-[0_0_18px_rgba(251,191,36,0.9)]"
                        : "bg-[#8737FF] shadow-[0_0_12px_#8737FF]"
                    }`}
                    title={isCeo ? "FOUNDER & CEO // CXRNER MUSIC" : "CXRNER VERIFIED ARTIST"}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Title & Stats */}
              <div className="flex-1 sm:ml-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1
                    className={`font-display font-black text-2xl sm:text-4xl tracking-wide ${
                      isCeo
                        ? "bg-gradient-to-r from-amber-200 via-white to-[#00F0FF] bg-clip-text text-transparent"
                        : "text-white"
                    }`}
                  >
                    {profile.display_name}
                  </h1>
                  {isCeo && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 via-[#8737FF]/25 to-[#00F0FF]/25 border border-amber-300/70 text-amber-200 text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                      <span>👑</span>
                      <span>FOUNDER & CEO</span>
                    </span>
                  )}
                  {profile.is_artist_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8737FF]/20 border border-[#8737FF]/60 text-[#B46BFF] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-[#00F0FF]" />
                      VERIFIED
                    </span>
                  )}
                  {profile.equipped_title && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ${
                        isCeo
                          ? "bg-[#00F0FF]/15 border border-[#00F0FF]/45 text-[#00F0FF] font-bold"
                          : "bg-white/5 border border-white/10 text-white/80"
                      }`}
                    >
                      {profile.equipped_title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#D9D9E2]/60 mt-1">
                  <span>@{profile.username}</span>
                  {profile.country && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#B46BFF]" />
                        {profile.city ? `${profile.city}, ` : ""}
                        {profile.country}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio & Roles */}
            <div className="space-y-4">
              {profile.bio && (
                <p className="text-sm sm:text-base text-[#D9D9E2]/85 font-sans leading-relaxed max-w-3xl whitespace-pre-line">
                  {profile.bio}
                </p>
              )}

              {/* Music Roles */}
              {profile.music_roles && profile.music_roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.music_roles.map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-white/90"
                    >
                      {role}
                    </span>
                  ))}
                  {profile.genres &&
                    profile.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-0.5 rounded-md bg-[#8737FF]/15 border border-[#8737FF]/30 text-[11px] font-mono text-[#B46BFF]"
                      >
                        #{g}
                      </span>
                    ))}
                </div>
              )}

              {/* Streaming & Social Links */}
              {(profile.music_links?.length > 0 || profile.social_links?.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {profile.music_links?.map((link, idx) => (
                    <a
                      key={`ml-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white transition hover:border-[#B46BFF]"
                    >
                      <Music className="w-3 h-3 text-[#B46BFF]" />
                      <span>{link.platform}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  ))}
                  {profile.social_links?.map((link, idx) => (
                    <a
                      key={`sl-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white transition hover:border-[#00F0FF]"
                    >
                      <Globe className="w-3 h-3 text-[#00F0FF]" />
                      <span>{link.platform}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  ))}
                </div>
              )}
              {/* Exclusive CEO Executive Telemetry Strip */}
              {isCeo && (
                <div className="pt-4 border-t border-amber-400/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300 font-bold">
                      👑 EXECUTIVE COMMAND // ТЕЛЕМЕТРИЯ ОСНОВАТЕЛЯ ЭКОСИСТЕМЫ
                    </span>
                    <span className="font-mono text-[10px] text-[#00F0FF] font-bold">
                      CLEARANCE: ROOT 00
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-black/60 to-transparent border border-amber-400/35">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-amber-200/70">
                        СТАТУС РЕЗИДЕНТА
                      </div>
                      <div className="font-display font-black text-sm text-amber-300 mt-1">
                        FOUNDER & CEO
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00F0FF]/15 via-black/60 to-transparent border border-[#00F0FF]/35">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]/75">
                        СЕТЬ ДИСТРИБУЦИИ
                      </div>
                      <div className="font-display font-black text-sm text-white mt-1">
                        150+ DSP · 70/30
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-[#8737FF]/20 via-black/60 to-transparent border border-[#B46BFF]/40">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-[#E9D5FF]/75">
                        СЕРИЙНЫЙ ПРОПУСК
                      </div>
                      <div className="font-display font-black text-sm text-[#00F0FF] mt-1">
                        GENESIS #000001
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-black/60 to-transparent border border-emerald-400/35">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-200/75">
                        РЕЙТИНГ КОЛЛЕКЦИИ
                      </div>
                      <div className="font-display font-black text-sm text-emerald-300 mt-1">
                        RANK #01 // 9,999 PTS
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            MY COLLECTION (DIGITAL MUSEUM SHOWCASE)
           ========================================================================= */}
        <div className="mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
                <Boxes className="w-4 h-4 text-[#00F0FF]" />
                <span>MY COLLECTION // ЦИФРОВОЙ МУЗЕЙ</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-wide mt-1">
                Экспонаты & Артефакты
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#D9D9E2]/60">
                Закреплено {pinnedItems.length} из 6 (Всего: {totalInventoryCount})
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="btn-energy px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold"
              >
                Share My Collection
              </button>
            </div>
          </div>

          {pinnedItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#090611]/60 border border-white/10 backdrop-blur-md">
              <Boxes className="w-12 h-12 text-[#B46BFF]/50 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-white">Витрина пуста</h3>
              <p className="text-xs text-[#D9D9E2]/60 max-w-md mx-auto mt-1">
                Пользователь пока не закрепил коллекционные предметы DROP для публичной демонстрации.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pinnedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="cxr-panel group rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-white/35 transition duration-300 flex flex-col justify-between gap-4"
                >
                  <div className="w-full max-w-[230px] mx-auto">
                    <SpecimenVisual
                      itemId={item.item_id}
                      itemName={item.item_name}
                      rarity={item.rarity}
                      imageUrl={item.image_url}
                      serialNumber={item.serial_number}
                      collectionName={item.collection_name}
                      isSpecialReward={item.rarity === "special_reward"}
                      interactiveTilt
                    />
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase text-[#00F0FF] font-semibold tracking-wider">
                      {item.collection_name}
                    </div>
                    <h4 className="font-display font-bold text-base text-white mt-0.5 group-hover:text-[#B46BFF] transition">
                      {item.item_name}
                    </h4>
                    <p className="text-xs text-[#D9D9E2]/60 line-clamp-2 mt-1 font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#D9D9E2]/55 group-hover:text-white transition">
                    <span>3D ОСМОТР ЭКСПОНАТА</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            ACHIEVEMENTS SECTION
           ========================================================================= */}
        <div className="mt-14 space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#00F0FF] font-semibold">
            <Award className="w-4 h-4 text-[#B46BFF]" />
            <span>ACHIEVEMENTS // ДОСТИЖЕНИЯ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(isCeo ? ACHIEVEMENTS_CATALOG : ACHIEVEMENTS_CATALOG.slice(0, 3)).map((ach) => (
              <div
                key={ach.key}
                className={`p-4 rounded-2xl backdrop-blur-md flex items-start gap-3 ${
                  isCeo && ach.key === "FOUNDER_SOVEREIGN"
                    ? "bg-gradient-to-r from-amber-500/20 via-[#090611]/90 to-[#00F0FF]/15 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.25)] sm:col-span-3"
                    : isCeo
                    ? "bg-[#090611]/85 border border-amber-400/25"
                    : "bg-[#090611]/70 border border-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCeo && ach.key === "FOUNDER_SOVEREIGN"
                      ? "bg-amber-500/25 border border-amber-300/60 text-amber-300"
                      : "bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#B46BFF]"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{ach.name}</h4>
                  <p className="text-xs text-[#D9D9E2]/60 mt-0.5 font-sans line-clamp-2">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Promo */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#160B28] via-[#090611] to-[#12081C] border border-[#B46BFF]/40 text-center space-y-3">
          <h3 className="font-display font-black text-xl text-white">
            Создайте свой персональный CXRNER ID
          </h3>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/70 max-w-lg mx-auto">
            Получите личный цифровой профиль, открывайте предметы в DROP, развивайте сеть артистов и собирайте эксклюзивные артефакты.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/register"
              className="btn-energy px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-block"
            >
              Зарегистрироваться в CXRNER
            </Link>
          </div>
        </div>
      </div>

      {/* 3D Specimen Fullscreen Inspection Modal */}
      {selectedItem && (
        <ItemInspectModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* 3D Holographic VIP Pass Modal */}
      <HolographicPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        profile={profile}
        topArtifact={pinnedItems[0] || null}
        totalArtifacts={totalInventoryCount}
      />
    </div>
  );
}
