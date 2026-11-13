"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Sparkles,
  Flame,
  Pin,
  EyeOff,
  Eye,
  Check,
  ExternalLink,
  RotateCw,
  X,
  Package,
} from "lucide-react";
import type { DropInventoryItem, ItemRarity } from "@/lib/ecosystemTypes";
import CollectionItem3DViewer from "@/components/3d/CollectionItem3DViewer";
import confetti from "canvas-confetti";

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
  const [opening, setOpening] = useState(false);
  const [openedItem, setOpenedItem] = useState<DropInventoryItem | null>(null);
  const [inspectItem, setInspectItem] = useState<DropInventoryItem | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const pinnedCount = items.filter((i) => i.is_pinned).length;

  const handleOpenCase = async () => {
    if (balance < 50) {
      setErrorNotice("Недостаточно CXP. Заполните профиль или пригласите артистов для получения валюты.");
      return;
    }

    setOpening(true);
    setErrorNotice(null);

    try {
      const res = await fetch("/api/cabinet/drop/open", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorNotice(data.error || "Ошибка открытия кейса");
        setOpening(false);
        return;
      }

      setBalance((prev) => Math.max(0, prev - 50));
      setOpenedItem(data.item);
      setItems((prev) => [data.item, ...prev]);

      // Launch confetti if rare or higher
      if (["rare", "epic", "legendary", "mythic"].includes(data.item.rarity)) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    } catch {
      setErrorNotice("Ошибка сети при открытии кейса");
    } finally {
      setOpening(false);
    }
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
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Коллекционные Экспонаты
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Открывайте редкие музыкальные артефакты, экипируйте профиль и формируйте витрину своего музея.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* CXP Balance Badge */}
          <div className="px-4 py-2 rounded-full bg-[#8737FF]/15 border border-[#8737FF]/40 text-[#B46BFF] font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_16px_rgba(135,55,255,0.25)]">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span>БАЛАНС: {balance} CXP</span>
          </div>

          {/* Open Drop Button */}
          <button
            type="button"
            onClick={handleOpenCase}
            disabled={opening}
            className="btn-energy px-5 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{opening ? "Открытие..." : "Открыть DROP (50 CXP)"}</span>
          </button>

          {/* View Public Showcase */}
          <Link
            href={`/profile/${username}`}
            target="_blank"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-mono text-white flex items-center gap-1.5 transition"
          >
            <span>Витрина ({pinnedCount}/6)</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
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
        {["all", "common", "rare", "epic", "legendary", "mythic"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilterRarity(r)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition ${
              filterRarity === r
                ? "bg-white text-black font-bold shadow-lg"
                : "bg-white/5 text-[#D9D9E2]/60 hover:text-white border border-white/10"
            }`}
          >
            {r === "all" ? `Все (${items.length})` : r}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#090611] border border-white/10">
          <Boxes className="w-12 h-12 text-[#B46BFF]/40 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white">В этой категории нет предметов</h3>
          <p className="text-xs text-[#D9D9E2]/60 mt-1">
            Откройте кейс CXRNER DROP для получения новых экспонатов.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl bg-[#090611] border p-5 flex flex-col justify-between transition duration-300 ${
                item.is_pinned
                  ? "border-[#B46BFF] shadow-[0_0_24px_rgba(135,55,255,0.2)]"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div>
                {/* Header: Rarity & Serial */}
                <div className="flex items-center justify-between mb-3">
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

                {/* 3D Model Preview box */}
                <div
                  onClick={() => setInspectItem(item)}
                  className="relative h-44 rounded-xl bg-black/60 border border-white/10 cursor-pointer overflow-hidden flex items-center justify-center group"
                >
                  <CollectionItem3DViewer
                    itemName={item.item_name}
                    rarity={item.rarity}
                    modelColor={item.model_color}
                    serialNumber={item.serial_number}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="px-3 py-1.5 rounded-full bg-black/80 border border-white/30 text-white font-mono text-[11px] shadow-lg">
                      360° INSPECT
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4">
                  <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-semibold">
                    {item.collection_name}
                  </span>
                  <h4 className="font-display font-bold text-base text-white mt-0.5">
                    {item.item_name}
                  </h4>
                  <p className="text-xs text-[#D9D9E2]/60 font-sans mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePin(item)}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5 border transition ${
                    item.is_pinned
                      ? "bg-[#8737FF]/20 border-[#8737FF] text-[#B46BFF] font-bold"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/60 hover:text-white"
                  }`}
                  title={item.is_pinned ? "Убрать с витрины" : "Закрепить на витрине"}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{item.is_pinned ? "На витрине" : "Закрепить"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleHide(item)}
                  className={`p-2 rounded-xl border text-xs transition ${
                    item.is_hidden
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/60 hover:text-white"
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

      {/* Opening Result Modal */}
      {openedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#090611] border border-[#B46BFF]/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-[0_24px_64px_rgba(135,55,255,0.4)] animate-fadeIn">
            <button
              type="button"
              onClick={() => setOpenedItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs uppercase tracking-widest text-[#00F0FF] font-bold">
              ВЫПАЛ НОВЫЙ ЭКСПОНАТ!
            </span>
            <h2 className="font-display font-black text-2xl text-white">{openedItem.item_name}</h2>

            <div className="relative h-60 rounded-2xl bg-black/60 border border-white/10 overflow-hidden">
              <CollectionItem3DViewer
                itemName={openedItem.item_name}
                rarity={openedItem.rarity}
                modelColor={openedItem.model_color}
                serialNumber={openedItem.serial_number}
              />
            </div>

            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-full bg-[#8737FF]/20 border border-[#8737FF] text-[#B46BFF] uppercase font-bold">
                {openedItem.rarity}
              </span>
              <span className="text-[#D9D9E2]/60">#{String(openedItem.serial_number).padStart(4, "0")}</span>
            </div>

            <p className="text-xs text-[#D9D9E2]/80 font-sans max-w-sm mx-auto">
              {openedItem.description}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setOpenedItem(null)}
                className="btn-energy px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold"
              >
                Забрать в инвентарь
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360° Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#090611] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-4 animate-fadeIn">
            <button
              type="button"
              onClick={() => setInspectItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#00F0FF] font-bold uppercase">{inspectItem.collection_name}</span>
              <span className="text-[#D9D9E2]/40">•</span>
              <span className="text-[#D9D9E2]/60">#{String(inspectItem.serial_number).padStart(4, "0")}</span>
            </div>

            <h2 className="font-display font-black text-2xl text-white">{inspectItem.item_name}</h2>

            <CollectionItem3DViewer
              itemName={inspectItem.item_name}
              rarity={inspectItem.rarity}
              modelColor={inspectItem.model_color}
              serialNumber={inspectItem.serial_number}
            />

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-[#D9D9E2]/60">Редкость:</span>
                <span className="text-[#B46BFF] uppercase font-bold">{inspectItem.rarity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D9D9E2]/60">Способ получения:</span>
                <span className="text-white">{inspectItem.obtained_via}</span>
              </div>
              <p className="text-xs text-[#D9D9E2]/80 font-sans pt-2 border-t border-white/10">
                {inspectItem.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
