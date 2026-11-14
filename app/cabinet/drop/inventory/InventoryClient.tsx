"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Sparkles,
  Pin,
  EyeOff,
  Eye,
  ExternalLink,
  Package,
} from "lucide-react";
import type { DropInventoryItem } from "@/lib/ecosystemTypes";
import { DROP_CASES } from "@/lib/ecosystemTypes";
import SpecimenVisual from "@/components/drop/SpecimenVisual";
import ItemInspectModal from "@/components/drop/ItemInspectModal";
import CaseOpeningModal from "@/components/drop/CaseOpeningModal";
import { playClickSound } from "@/lib/soundFX";

interface InventoryClientProps {
  initialItems: DropInventoryItem[];
  initialBalance: number;
  username: string;
}

export default function InventoryClient({
  initialItems,
  initialBalance,
  username,
}: InventoryClientProps) {
  const [items, setItems] = useState<DropInventoryItem[]>(initialItems);
  const [balance, setBalance] = useState(initialBalance);
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<DropInventoryItem | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const pinnedCount = items.filter((i) => i.is_pinned).length;
  const defaultCase = DROP_CASES[0];

  const handleCaseSuccess = (
    newItem: DropInventoryItem,
    newBalance: number,
    claimCode?: string,
    isSpecial?: boolean
  ) => {
    const normalized: DropInventoryItem = {
      ...newItem,
      ...(claimCode ? { claim_code: claimCode } : {}),
      ...(isSpecial ? { is_special_reward: true } : {}),
    };
    setBalance(newBalance);
    setItems((prev) => [normalized, ...prev]);
  };

  const handleTogglePin = async (item: DropInventoryItem) => {
    const newPinned = !item.is_pinned;
    if (newPinned && pinnedCount >= 6) {
      setErrorNotice("Максимум 6 предметов на витрине публичного профиля");
      return;
    }

    try {
      const res = await fetch("/api/cabinet/drop/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, isPinned: newPinned }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
        setInspectItem((cur) =>
          cur && cur.id === item.id ? { ...cur, is_pinned: newPinned } : cur
        );
      }
    } catch {
      // ignore
    }
  };

  const handleToggleHide = async (item: DropInventoryItem) => {
    const newHidden = !item.is_hidden;
    try {
      const res = await fetch("/api/cabinet/drop/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, isHidden: newHidden }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
      }
    } catch {
      // ignore
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterRarity === "all") return true;
    return item.rarity === filterRarity;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Bar: CXP Balance & Open Case Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <Boxes className="w-4 h-4 text-[#00F0FF]" />
            <span>CXRNER DROP // ИНВЕНТАРЬ И КОЛЛЕКЦИЯ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1 uppercase">
            Коллекционные Экспонаты
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/65 mt-0.5">
            Нажмите на любой предмет, чтобы рассмотреть 3D-упаковку, либо закрепите до 6 артефактов на публичной витрине.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CXP Balance Badge */}
          <div className="px-4 py-2 rounded-full bg-[#8737FF]/15 border border-[#8737FF]/40 text-[#B46BFF] font-mono text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span>{balance} CXP</span>
          </div>

          {/* Open Drop Button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setErrorNotice(null);
              setIsOpeningModalOpen(true);
            }}
            className="btn-energy px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Открыть DROP (50 CXP)</span>
          </button>

          {/* View Public Showcase */}
          <Link
            href={`/profile/${username}`}
            target="_blank"
            className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-mono text-white flex items-center gap-1.5 transition"
          >
            <span>Витрина ({pinnedCount}/6)</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 font-sans text-xs sm:text-sm">
          {errorNotice}
        </div>
      )}

      {/* Rarity Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {["all", "common", "rare", "epic", "legendary", "mythic", "special_reward"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              playClickSound();
              setFilterRarity(r);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
              filterRarity === r
                ? "bg-white text-[#050407] font-bold shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                : "bg-white/[0.04] text-[#D9D9E2]/65 hover:text-white border border-white/10"
            }`}
          >
            {r === "all"
              ? `Все (${items.length})`
              : r === "special_reward"
              ? "Special"
              : r}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="cxr-panel p-14 text-center rounded-3xl">
          <Boxes className="w-12 h-12 text-[#B46BFF]/40 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white uppercase">
            В этой категории нет предметов
          </h3>
          <p className="text-xs text-[#D9D9E2]/60 mt-1 max-w-sm mx-auto">
            Откройте запечатанный кейс CXRNER DROP, чтобы получить редкие экспонаты в коллекцию.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`cxr-panel rounded-2xl p-4 flex flex-col justify-between transition duration-300 ${
                item.is_pinned
                  ? "border-[#B46BFF]/60 shadow-[0_0_24px_rgba(135,55,255,0.22)]"
                  : ""
              }`}
            >
              <div>
                {/* Interactive Specimen Slab Preview */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setInspectItem(item);
                  }}
                  className="w-full text-left relative group cursor-pointer block"
                >
                  <SpecimenVisual
                    itemId={item.item_id}
                    itemName={item.item_name}
                    rarity={item.is_special_reward ? "special_reward" : item.rarity}
                    imageUrl={item.image_url}
                    serialNumber={item.serial_number}
                    collectionName={item.collection_name}
                    isSpecialReward={Boolean(item.is_special_reward)}
                    interactiveTilt
                  />
                  <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <span className="px-3 py-1 rounded-full bg-black/85 border border-white/25 text-white font-mono text-[10px] uppercase tracking-wider shadow-lg">
                      360° 3D Осмотр
                    </span>
                  </div>
                </button>

                {/* Details */}
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="uppercase text-[#00F0FF] font-semibold truncate">
                      {item.collection_name || "CXRNER ARCHIVE"}
                    </span>
                    <span className="text-white/45 shrink-0">
                      #{String(item.serial_number).padStart(5, "0")}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-white uppercase truncate">
                    {item.item_name}
                  </h4>
                  <p className="text-xs text-[#D9D9E2]/60 font-sans line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    handleTogglePin(item);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-mono text-[11px] flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    item.is_pinned
                      ? "bg-[#8737FF]/20 border-[#8737FF] text-[#B46BFF] font-bold"
                      : "bg-white/[0.04] border-white/10 text-[#D9D9E2]/70 hover:text-white"
                  }`}
                  title={item.is_pinned ? "Убрать с витрины" : "Закрепить на витрине"}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{item.is_pinned ? "На витрине" : "Закрепить"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setInspectItem(item);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/12 font-mono text-[11px] font-bold text-[#00F0FF] transition cursor-pointer"
                  title="Открыть 3D-осмотр"
                >
                  3D
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    handleToggleHide(item);
                  }}
                  className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                    item.is_hidden
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/[0.04] border-white/10 text-[#D9D9E2]/60 hover:text-white"
                  }`}
                  title={item.is_hidden ? "Предмет скрыт" : "Скрыть из профиля"}
                >
                  {item.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Opening Modal (Unified 3D Pouch Chamber) */}
      <CaseOpeningModal
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        caseConfig={defaultCase}
        userBalance={balance}
        onSuccess={handleCaseSuccess}
        onInspectItem={(item) => setInspectItem(item)}
      />

      {/* Unified 3D Specimen Inspection Modal */}
      <ItemInspectModal
        item={inspectItem}
        onClose={() => setInspectItem(null)}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
}
