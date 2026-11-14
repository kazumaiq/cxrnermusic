"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Award, Boxes } from "lucide-react";
import type { CxrnerProfile, DropInventoryItem, CxrnerArtistProfile } from "@/lib/ecosystemTypes";
import { ACHIEVEMENTS_CATALOG, isCeoAccount } from "@/lib/ecosystemTypes";
import SpecimenVisual from "@/components/drop/SpecimenVisual";
import ItemInspectModal from "@/components/drop/ItemInspectModal";
import HolographicPassModal from "@/components/profile/HolographicPassModal";
import ProfileHeroCard from "@/components/profile/ProfileHeroCard";

interface ProfileClientViewProps {
  profile: CxrnerProfile;
  pinnedItems: DropInventoryItem[];
  totalInventoryCount: number;
  artistProject: CxrnerArtistProfile | null;
  isOwner?: boolean;
}

export default function ProfileClientView({
  profile,
  pinnedItems,
  totalInventoryCount,
  isOwner = false,
}: ProfileClientViewProps) {
  const [selectedItem, setSelectedItem] = useState<DropInventoryItem | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isCeo = isCeoAccount({
    username: profile.username,
    badge: profile.equipped_badge,
    title: profile.equipped_title,
  });

  return (
    <div className="min-h-screen bg-[#06050A] text-[#D9D9E2] pt-20 pb-28 selection:bg-[#8737FF] selection:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Crisp Profile Hero Card */}
        <ProfileHeroCard
          profile={profile}
          totalInventoryCount={totalInventoryCount}
          pinnedCount={pinnedItems.length}
          isOwner={isOwner}
          copied={copied}
          onShare={handleShare}
          onOpenPass={() => setIsPassModalOpen(true)}
        />

        {/* =========================================================================
            MY COLLECTION (DIGITAL MUSEUM SHOWCASE)
           ========================================================================= */}
        <div className="mt-10 space-y-5">
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
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-[#D9D9E2]/65">
                Закреплено {pinnedItems.length} из 6 (Всего: {totalInventoryCount})
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="btn-energy px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold cursor-pointer"
              >
                {copied ? "Ссылка скопирована" : "Share My Collection"}
              </button>
            </div>
          </div>

          {pinnedItems.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-[#0C0A15] border border-white/10">
              <Boxes className="w-10 h-10 text-[#B46BFF]/60 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-white">Витрина пуста</h3>
              <p className="text-xs text-[#D9D9E2]/60 max-w-md mx-auto mt-1">
                Пользователь пока не закрепил коллекционные предметы DROP для публичной демонстрации.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {pinnedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="cxr-panel group rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-white/35 transition duration-300 flex flex-col justify-between gap-4 bg-[#0C0A15]"
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
                    <p className="text-xs text-[#D9D9E2]/65 line-clamp-2 mt-1 font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#D9D9E2]/65 group-hover:text-white transition">
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
        <div className="mt-12 space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#00F0FF] font-semibold">
            <Award className="w-4 h-4 text-[#B46BFF]" />
            <span>ACHIEVEMENTS // ДОСТИЖЕНИЯ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(isCeo ? ACHIEVEMENTS_CATALOG : ACHIEVEMENTS_CATALOG.slice(0, 3)).map((ach) => (
              <div
                key={ach.key}
                className={`p-4 rounded-2xl flex items-start gap-3 ${
                  isCeo && ach.key === "FOUNDER_SOVEREIGN"
                    ? "bg-[#130E08] border border-amber-400/50 sm:col-span-3"
                    : isCeo
                    ? "bg-[#0C0A15] border border-amber-400/25"
                    : "bg-[#0C0A15] border border-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCeo && ach.key === "FOUNDER_SOVEREIGN"
                      ? "bg-amber-500/20 border border-amber-300/50 text-amber-300"
                      : "bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#B46BFF]"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{ach.name}</h4>
                  <p className="text-xs text-[#D9D9E2]/65 mt-0.5 font-sans line-clamp-2">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Promo */}
        {!isOwner && (
          <div className="mt-14 p-7 sm:p-8 rounded-3xl bg-[#0D0A17] border border-[#B46BFF]/35 text-center space-y-3">
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
        )}
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
