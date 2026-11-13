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
import { ACHIEVEMENTS_CATALOG } from "@/lib/ecosystemTypes";
import CollectionItem3DViewer from "@/components/3d/CollectionItem3DViewer";

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
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const equippedEffectClass =
    profile.equipped_effect === "effect-purple-aura"
      ? "ring-4 ring-[#B46BFF]/70 shadow-[0_0_30px_rgba(180,107,255,0.7)]"
      : profile.equipped_effect === "effect-cyan-pulse"
      ? "ring-4 ring-[#00F0FF]/70 shadow-[0_0_30px_rgba(0,240,255,0.7)]"
      : profile.equipped_effect === "effect-chrome-sheen"
      ? "ring-4 ring-white/80 shadow-[0_0_24px_rgba(255,255,255,0.8)]"
      : "ring-2 ring-white/10";

  const equippedFrameBorder =
    profile.equipped_frame === "frame-cyber-chrome"
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#8737FF]/15 blur-[120px] rounded-full" />
        <div className="absolute top-[450px] right-10 w-[450px] h-[450px] bg-[#00F0FF]/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card Shell */}
        <div className="rounded-3xl bg-[#090611]/80 border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-2xl">
          {/* Header Banner */}
          <div className="relative h-44 sm:h-64 w-full bg-gradient-to-r from-[#160B28] via-[#090611] to-[#12081C] overflow-hidden">
            {profile.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full opacity-40 bg-[radial-gradient(circle_at_center,_rgba(135,55,255,0.25)_0%,_transparent_70%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090611] via-transparent to-black/30" />

            {/* Share button floating */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
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
                    className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[#8737FF] border-2 border-[#090611] text-white shadow-[0_0_12px_#8737FF]"
                    title="CXRNER VERIFIED ARTIST"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Title & Stats */}
              <div className="flex-1 sm:ml-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
                    {profile.display_name}
                  </h1>
                  {profile.is_artist_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8737FF]/20 border border-[#8737FF]/60 text-[#B46BFF] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-[#00F0FF]" />
                      VERIFIED
                    </span>
                  )}
                  {profile.equipped_title && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80 font-mono text-[10px] uppercase tracking-wider">
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
                  className="group relative rounded-2xl bg-[#0A0714] border border-white/15 p-5 cursor-pointer hover:border-[#B46BFF] hover:shadow-[0_8px_32px_rgba(135,55,255,0.25)] transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Rarity & Serial */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold border ${
                          item.rarity === "mythic"
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : item.rarity === "legendary"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : item.rarity === "epic"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : item.rarity === "rare"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : "bg-white/10 text-white/70 border-white/20"
                        }`}
                      >
                        {item.rarity}
                      </span>
                      <span className="font-mono text-xs text-[#D9D9E2]/50">
                        #{String(item.serial_number).padStart(4, "0")}
                      </span>
                    </div>

                    {/* Central 3D Graphic Preview */}
                    <div className="relative h-44 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition duration-300">
                      <div
                        className="w-24 h-24 rounded-full blur-xl absolute"
                        style={{ backgroundColor: item.model_color, opacity: 0.3 }}
                      />
                      <CollectionItem3DViewer
                        itemName={item.item_name}
                        rarity={item.rarity}
                        modelColor={item.model_color}
                        serialNumber={item.serial_number}
                      />
                    </div>

                    {/* Item Details */}
                    <div className="mt-4">
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
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#D9D9E2]/50 group-hover:text-white transition">
                    <span>360° INSPECT</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
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
            {ACHIEVEMENTS_CATALOG.slice(0, 3).map((ach) => (
              <div
                key={ach.key}
                className="p-4 rounded-2xl bg-[#090611]/70 border border-white/10 backdrop-blur-md flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center shrink-0 text-[#B46BFF]">
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#090611] border border-white/20 rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.9)] p-6 sm:p-8 animate-fadeIn">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase text-[#00F0FF] font-bold">
                  {selectedItem.collection_name}
                </span>
                <span className="text-[#D9D9E2]/40">•</span>
                <span className="font-mono text-xs text-[#D9D9E2]/70">
                  #{String(selectedItem.serial_number).padStart(4, "0")}
                </span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                {selectedItem.item_name}
              </h2>

              {/* 3D Canvas */}
              <CollectionItem3DViewer
                itemName={selectedItem.item_name}
                rarity={selectedItem.rarity}
                modelColor={selectedItem.model_color}
                serialNumber={selectedItem.serial_number}
              />

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D9D9E2]/60">Категория редкости:</span>
                  <span className="text-[#B46BFF] font-bold uppercase">{selectedItem.rarity}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D9D9E2]/60">Способ получения:</span>
                  <span className="text-white">{selectedItem.obtained_via}</span>
                </div>
                <p className="text-xs text-[#D9D9E2]/80 font-sans pt-2 border-t border-white/10">
                  {selectedItem.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
