"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Coins,
  History,
  HelpCircle,
  Percent,
  Sparkles,
  ArrowRight,
  Pin,
  Eye,
  RotateCw,
  Trophy,
  User,
  ShieldCheck,
  ChevronRight,
  Award,
} from "lucide-react";
import type {
  DropCaseConfig,
  DropInventoryItem,
  DropHistoryEntry,
  ItemRarity,
} from "@/lib/ecosystemTypes";
import { DROP_CASES, DROP_SPECIMENS } from "@/lib/ecosystemTypes";
import SpecimenVisual, { RARITY_THEMES } from "./SpecimenVisual";
import ZipPacket3DViewer from "./ZipPacket3DViewer";
import CaseOpeningModal from "./CaseOpeningModal";
import DropRatesModal from "./DropRatesModal";
import HowToPlayModal from "./HowToPlayModal";
import GetCxpModal from "./GetCxpModal";
import DropHistoryModal from "./DropHistoryModal";
import ItemInspectModal from "./ItemInspectModal";
import OnboardingTourModal from "./OnboardingTourModal";
import { playClickSound } from "@/lib/soundFX";

interface DropGameArenaProps {
  initialItems: DropInventoryItem[];
  initialBalance: number;
  initialHistory: DropHistoryEntry[];
  username: string;
  isLoggedIn: boolean;
  defaultTab?: "play" | "inventory" | "prizes";
}

export default function DropGameArena({
  initialItems,
  initialBalance,
  initialHistory,
  username,
  isLoggedIn,
  defaultTab = "play",
}: DropGameArenaProps) {
  const [activeTab, setActiveTab] = useState<"play" | "inventory" | "prizes">(defaultTab);
  const [items, setItems] = useState<DropInventoryItem[]>(initialItems);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [history, setHistory] = useState<DropHistoryEntry[]>(initialHistory);

  // Case selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_001_archive");
  const selectedCase =
    DROP_CASES.find((c) => c.id === selectedCaseId) || DROP_CASES[0];

  // Inventory filtering
  const [inventoryRarityFilter, setInventoryRarityFilter] = useState<string>("all");
  const [catalogRarityFilter, setCatalogRarityFilter] = useState<string>("all");

  // Modals state
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isGetCxpModalOpen, setIsGetCxpModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<DropInventoryItem | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Check onboarding on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const onboarded = window.localStorage.getItem("cxrner_drop_onboarded");
      if (!onboarded) {
        setIsTourModalOpen(true);
      }
    }
  }, []);

  const pinnedCount = items.filter((i) => i.is_pinned).length;

  const handleCaseSuccess = (data: {
    item: DropInventoryItem;
    balanceAfter: number;
    claimCode?: string;
    isSpecialReward?: boolean;
  }) => {
    setBalance(data.balanceAfter);
    setItems((prev) => [data.item, ...prev]);

    // Append to history
    const newEntry: DropHistoryEntry = {
      id: crypto.randomUUID(),
      user_id: username,
      case_id: selectedCase.id,
      case_name: selectedCase.name,
      item_id: data.item.item_id,
      item_name: data.item.item_name,
      rarity: data.item.rarity,
      serial_number: data.item.serial_number,
      cxp_spent: selectedCase.price_cxp,
      created_at: new Date().toISOString(),
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  const handleTogglePin = async (item: DropInventoryItem) => {
    const newPinned = !item.is_pinned;
    if (newPinned && pinnedCount >= 6) {
      setStatusNotice("Максимум 6 предметов на витрине публичного профиля");
      setTimeout(() => setStatusNotice(null), 3000);
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
        setStatusNotice(
          newPinned
            ? `Предмет "${item.item_name}" помещён на публичную витрину!`
            : `Предмет "${item.item_name}" снят с витрины.`
        );
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch {
      setStatusNotice("Ошибка обновления статуса предмета");
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleInspectSpecimen = (specimen: (typeof DROP_SPECIMENS)[number]) => {
    playClickSound();
    const dummyItem: DropInventoryItem = {
      id: specimen.item_id,
      user_id: username,
      item_id: specimen.item_id,
      item_name: specimen.item_name,
      specimen_code: specimen.specimen_code,
      specimen_class: specimen.specimen_class,
      collection_name: specimen.collection_name,
      rarity: specimen.rarity,
      drop_chance: specimen.drop_chance,
      serial_number: 1,
      description: specimen.description,
      image_url: specimen.image_url,
      model_3d_type: "procedural",
      model_color: specimen.model_color,
      obtained_via: "specimen_archive",
      is_equipped: false,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
    };
    setInspectingItem(dummyItem);
  };

  const filteredItems =
    inventoryRarityFilter === "all"
      ? items
      : items.filter((i) => i.rarity === inventoryRarityFilter);

  // Mock live ticker drops
  const liveRecentDrops = [
    { name: "CHROME SPIKE", rarity: "legendary", user: "kazumaiq", serial: "001601" },
    { name: "VOID CROWN", rarity: "legendary", user: "neimeks", serial: "001777" },
    { name: "WATCHER EYE", rarity: "epic", user: "cerrera_dark", serial: "001150" },
    { name: "CYBER VINYL GENESIS", rarity: "common", user: "phonk_lord", serial: "000184" },
    { name: "COVER VOUCHER", rarity: "special_reward", user: "starox", serial: "000000" },
    { name: "CHROME DISC", rarity: "rare", user: "mvrtx", serial: "000671" },
  ];

  return (
    <div className="min-h-screen bg-[#05030A] pt-14 sm:pt-20 text-white selection:bg-[#8737FF] selection:text-white">
      {/* =====================================================================
          TOP GAMING HUD BAR
          ===================================================================== */}
      <header className="sticky top-14 sm:top-20 z-40 w-full border-b border-white/10 bg-[#07050D]/95 backdrop-blur-xl">
        {/* Desktop View: Single Spacious Row */}
        <div className="hidden sm:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 items-center justify-between gap-4">
          {/* Left: Brand & Return */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 group hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8737FF] to-[#00F0FF] p-0.5 shadow-[0_0_15px_rgba(135,55,255,0.5)]">
                <div className="w-full h-full bg-[#090611] rounded-[10px] flex items-center justify-center">
                  <Boxes className="w-4 h-4 text-[#00F0FF]" />
                </div>
              </div>
              <div className="hidden xs:block">
                <span className="font-display font-black text-sm uppercase tracking-wider text-white">
                  CXRNER DROP
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#B46BFF] block -mt-0.5">
                  SPECIMEN ARCHIVE
                </span>
              </div>
            </Link>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 ml-2">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("play");
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition ${
                  activeTab === "play"
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                    : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                КЕЙСЫ // PLAY
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("prizes");
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "prizes"
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                    : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                <span>ПРИЗЫ И ШАНСЫ</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[9px] font-bold">
                  10+1
                </span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("inventory");
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "inventory"
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                    : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                <span>ИНВЕНТАРЬ</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/60 text-[9px] text-white font-bold">
                  {items.length}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Currency Balance & Help Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* CXP Balance Widget */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <Coins className="w-4 h-4 text-[#00F0FF] animate-pulse" />
              <span className="font-display font-black text-sm text-white">
                {balance}
              </span>
              <span className="font-display font-black text-[10px] text-[#00F0FF] uppercase tracking-wider">
                CXP
              </span>
              <button
                onClick={() => setIsGetCxpModalOpen(true)}
                className="ml-1 px-2 py-0.5 rounded-full bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] text-[9px] font-bold uppercase transition"
              >
                + GET
              </button>
            </div>

            {/* Quick Action Icon Buttons */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              title="История открытий"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[#D9D9E2]/80 hover:text-white transition"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRatesModalOpen(true)}
              title="Шансы выпадения"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[#D9D9E2]/80 hover:text-white transition"
            >
              <Percent className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsHelpModalOpen(true)}
              title="Как играть"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[#D9D9E2]/80 hover:text-white transition"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Profile Link */}
            {isLoggedIn ? (
              <Link
                href={`/profile/${username}`}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-white transition"
              >
                <User className="w-3.5 h-3.5 text-[#B46BFF]" />
                <span>@{username}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="btn-energy px-4 py-1.5 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_15px_rgba(135,55,255,0.4)]"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
        {/* Mobile View: Compact 2-tier HUD (Zero Overflow, Easy Touch) */}
        <div className="sm:hidden px-3 py-2 space-y-2">
          {/* Top row: Brand & Balance & Quick Actions */}
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8737FF] to-[#00F0FF] p-0.5 shadow-[0_0_10px_rgba(135,55,255,0.5)]">
                <div className="w-full h-full bg-[#090611] rounded-[6px] flex items-center justify-center">
                  <Boxes className="w-3.5 h-3.5 text-[#00F0FF]" />
                </div>
              </div>
              <span className="font-display font-black text-xs uppercase tracking-wider text-white">
                DROP
              </span>
            </Link>

            <div className="flex items-center gap-1.5">
              {/* CXP Balance */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 border border-[#00F0FF]/40">
                <Coins className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="font-display font-black text-xs text-white">
                  {balance}
                </span>
                <span className="font-mono text-[8px] text-[#00F0FF] font-bold">
                  CXP
                </span>
                <button
                  onClick={() => setIsGetCxpModalOpen(true)}
                  className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#00F0FF]/25 text-[#00F0FF] text-[8px] font-bold uppercase"
                >
                  +
                </button>
              </div>

              {/* Quick Icons */}
              <button
                onClick={() => setIsRatesModalOpen(true)}
                title="Шансы выпадения"
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 hover:text-white"
              >
                <Percent className="w-3.5 h-3.5 text-[#00F0FF]" />
              </button>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                title="История"
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 hover:text-white"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsHelpModalOpen(true)}
                title="Как играть"
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 hover:text-white"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#B46BFF]" />
              </button>
            </div>
          </div>

          {/* Bottom row: Mode Tabs (Full Width 3 equal segments) */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-[10px] uppercase tracking-wider">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("play");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold ${
                activeTab === "play"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              КЕЙСЫ
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("prizes");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold flex items-center justify-center gap-1 ${
                activeTab === "prizes"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              <span>ПРИЗЫ</span>
              <span className="px-1 py-0.2 rounded bg-[#00F0FF]/25 text-[#00F0FF] text-[7px] font-bold">
                10+1
              </span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("inventory");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold flex items-center justify-center gap-1 ${
                activeTab === "inventory"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              <span>ИНВЕНТАРЬ</span>
              <span className="px-1 py-0.2 rounded bg-black/60 text-white text-[7px] font-bold">
                {items.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Alert Notification */}
      {statusNotice && (
        <div className="fixed top-24 sm:top-28 right-4 z-50 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-xl text-emerald-300 text-xs font-mono shadow-2xl animate-fade-in">
          {statusNotice}
        </div>
      )}

      {/* =====================================================================
          LIVE RECENT DROPS TICKER
          ===================================================================== */}
      <div className="py-2 px-4 border-b border-white/10 bg-black/40 overflow-hidden flex items-center gap-4 text-xs font-mono select-none">
        <span className="text-[#00F0FF] uppercase tracking-widest text-[9px] font-bold shrink-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
          LIVE DROPS:
        </span>
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-[#D9D9E2]/70 text-[10px]">
          {liveRecentDrops.map((drop, idx) => {
            const theme = RARITY_THEMES[drop.rarity as ItemRarity] || RARITY_THEMES.common;
            return (
              <div key={idx} className="inline-flex items-center gap-2">
                <span className="text-white/40">@{drop.user}:</span>
                <span className="text-white font-bold">{drop.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${theme.pillBg}`}
                >
                  {drop.rarity}
                </span>
                <span className="text-white/20">•</span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* ===================================================================
            TAB 1: PLAY ARENA
            =================================================================== */}
        {activeTab === "play" && (
          <div className="space-y-12">
            {/* Header Stage */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-xs uppercase tracking-widest text-[#D9D9E2]">
                <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
                <span>SEALED SPECIMEN ARCHIVE</span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-tight">
                CXRNER DROP
              </h1>
              <p className="text-xs sm:text-sm text-[#D9D9E2]/80 leading-relaxed font-sans">
                Открывай запечатанные образцы, находи уникальные коллекционные предметы и пополняй собственный цифровой музей.
              </p>
            </div>

            {/* Case Selector Carousel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {DROP_CASES.map((c) => {
                const isSelected = c.id === selectedCase.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedCaseId(c.id);
                    }}
                    className={`p-5 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group ${
                      isSelected
                        ? "border-[#B46BFF] bg-gradient-to-b from-[#160B28] to-[#07050D] shadow-[0_0_40px_rgba(135,55,255,0.35)] scale-[1.02]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
                    }`}
                  >
                    {/* Top Case Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#00F0FF] font-bold">
                        {c.subtitle}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-white/15 font-mono text-[10px] text-white font-bold">
                        {c.price_cxp} CXP
                      </span>
                    </div>

                    <h3 className="font-display font-black text-lg uppercase tracking-tight text-white mb-1">
                      {c.name}
                    </h3>

                    <p className="text-xs text-[#D9D9E2]/70 leading-relaxed mb-4 line-clamp-2 font-sans">
                      {c.description}
                    </p>

                    {/* Case Pouch Thumbnail */}
                    <div className="relative aspect-[3/4] w-28 mx-auto rounded-xl overflow-hidden p-1 flex items-center justify-center">
                      <img
                        src={c.cover_url}
                        alt={c.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-[#B46BFF]/30 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#00F0FF] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                        <span>ВЫБРАННЫЙ КЕЙС</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Central Opening Arena Stage */}
            <div className="relative rounded-3xl border border-[#B46BFF]/40 bg-gradient-to-b from-[#090611] via-[#05030A] to-black p-6 sm:p-10 shadow-[0_0_80px_rgba(135,55,255,0.25)] overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left 3D Viewport */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                  <div className="w-full max-w-sm">
                    <ZipPacket3DViewer
                      caseId={selectedCase.id}
                      themeColor={
                        selectedCase.id === "case_002_black_specimen"
                          ? "#A21CAF"
                          : selectedCase.id === "case_003_chrome_age"
                          ? "#00F0FF"
                          : "#8737FF"
                      }
                    />
                  </div>
                </div>

                {/* Right Action Terminal */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF]">
                      <span>АКТИВНЫЙ ОБРАЗЕЦ</span>
                    </div>
                    <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-white">
                      {selectedCase.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#D9D9E2]/80 leading-relaxed font-sans">
                      {selectedCase.description}
                    </p>
                  </div>

                  {/* Pricing and Stats Bar */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                    <div>
                      <span className="text-white/40 block text-[10px] mb-0.5">СТОИМОСТЬ</span>
                      <span className="font-display font-black text-lg text-white">
                        {selectedCase.price_cxp} CXP
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] mb-0.5">ВАШ БАЛАНС</span>
                      <span
                        className={`font-display font-black text-lg ${
                          balance >= selectedCase.price_cxp
                            ? "text-[#00F0FF]"
                            : "text-rose-400"
                        }`}
                      >
                        {balance} CXP
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-white/40 block text-[10px] mb-0.5">СПЕЦ-НАГРАДА</span>
                      <span className="font-display font-black text-xs text-amber-300">
                        VOUCHER (0.1%)
                      </span>
                    </div>
                  </div>

                  {/* Main Action CTAs */}
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsOpeningModalOpen(true)}
                      className="w-full btn-energy py-4 rounded-full font-sans text-sm uppercase font-bold tracking-wider text-white shadow-[0_0_35px_rgba(135,55,255,0.45)] hover:shadow-[0_0_55px_rgba(135,55,255,0.65)] flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                      <Boxes className="w-5 h-5 text-[#00F0FF]" />
                      <span>OPEN CASE ({selectedCase.price_cxp} CXP)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsRatesModalOpen(true)}
                        className="py-3 px-4 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] flex items-center justify-center gap-1.5 transition"
                      >
                        <Percent className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span>Вероятности (Drop Rates)</span>
                      </button>
                      <button
                        onClick={() => setIsHelpModalOpen(true)}
                        className="py-3 px-4 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] flex items-center justify-center gap-1.5 transition"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#B46BFF]" />
                        <span>Как играть</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Prizes Showcase Gallery */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF] mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>PRIZE POOL // PHYSICAL SPECIMENS</span>
                  </div>
                  <h3 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white">
                    ТОПОВЫЕ ПРИЗЫ АРХИВА (10 ПРЕДМЕТОВ + ВАУЧЕР)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveTab("prizes");
                  }}
                  className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-[#00F0FF] flex items-center gap-1.5 transition self-start"
                >
                  <span>Все предметы и шансы</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of the 10 real prizes + voucher */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {DROP_SPECIMENS.filter((s) => s.rarity !== "common").map((specimen) => {
                  const theme = RARITY_THEMES[specimen.rarity] || RARITY_THEMES.common;
                  return (
                    <div
                      key={specimen.item_id}
                      onClick={() => handleInspectSpecimen(specimen)}
                      className={`cursor-pointer rounded-2xl p-2.5 bg-gradient-to-b ${theme.bg} border ${theme.border} ${theme.glow} hover:scale-[1.03] transition-all duration-300 group flex flex-col justify-between`}
                    >
                      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/60 mb-2 p-1 flex items-center justify-center">
                        <img
                          src={specimen.image_url}
                          alt={specimen.item_name}
                          className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-white/20 font-mono text-[7px] text-[#00F0FF] font-bold">
                          {specimen.specimen_code || "SPECIMEN"}
                        </div>
                        <div className="absolute top-1.5 right-1.5">
                          <span className={`px-1.5 py-0.5 rounded font-display font-black text-[7px] uppercase border ${theme.pillBg}`}>
                            {theme.name}
                          </span>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/90 border border-white/20 font-mono text-[8px] font-bold text-amber-300">
                          {specimen.drop_chance}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-display font-black text-[10px] sm:text-xs uppercase tracking-tight text-white line-clamp-1">
                          {specimen.item_name}
                        </h4>
                        <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
                          <span>{specimen.specimen_class || "OBJECT"}</span>
                          <span className="text-[#00F0FF] font-bold">{specimen.drop_chance}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HOW TO PLAY Compact Guide Grid */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#B46BFF] font-bold block">
                    ИНФОРМАЦИОННЫЙ БЛОК
                  </span>
                  <h3 className="font-display font-black text-xl uppercase tracking-tight text-white">
                    HOW TO PLAY // 5 ПРОСТЫХ ШАГОВ
                  </h3>
                </div>
                <button
                  onClick={() => setIsTourModalOpen(true)}
                  className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] transition self-start"
                >
                  Интерактивный тур
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {[
                  {
                    num: "01",
                    title: "GET CXP",
                    desc: "Получай игровую валюту за задания и активность CXRNER.",
                    color: "#00F0FF",
                  },
                  {
                    num: "02",
                    title: "OPEN CASES",
                    desc: "Выбирай кейс и открывай запечатанный образец.",
                    color: "#8737FF",
                  },
                  {
                    num: "03",
                    title: "COLLECT",
                    desc: "Получай уникальные предметы и добавляй их в инвентарь.",
                    color: "#EC4899",
                  },
                  {
                    num: "04",
                    title: "SHOW OFF",
                    desc: "Выставляй любимые предметы на публичной витрине CXRNER ID.",
                    color: "#F59E0B",
                  },
                  {
                    num: "05",
                    title: "UNLOCK REWARDS",
                    desc: "Собирай достижения и получай специальные награды.",
                    color: "#10B981",
                  },
                ].map((s) => (
                  <div
                    key={s.num}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5"
                  >
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: s.color }}
                    >
                      {s.num} —
                    </span>
                    <h4 className="font-display font-black text-xs uppercase tracking-wide text-white">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-[#D9D9E2]/70 leading-relaxed font-sans">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: INVENTORY & SHOWCASE
            =================================================================== */}
        {/* ===================================================================
            TAB: PRIZES & ODDS CATALOG
            =================================================================== */}
        {activeTab === "prizes" && (
          <div className="space-y-8 animate-fade-in">
            {/* Catalog Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF] mb-1">
                  <Percent className="w-3 h-3" />
                  <span>TRANSPARENT PROBABILITIES & SPECIMEN VAULT</span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                  КАТАЛОГ ПРИЗОВ И ШАНСЫ ВЫПАДЕНИЯ
                </h2>
                <p className="text-xs text-[#D9D9E2]/70 font-sans mt-1">
                  Полный список из 10 физических образцов в вакуумных ZIP-пакетах архива лейбла и суперприза (0.1% Ваучер на обложку).
                </p>
              </div>

              {/* Rarity Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-2xl bg-white/[0.03] border border-white/10">
                {[
                  { key: "all", label: "ВСЕ ПРИЗЫ" },
                  { key: "special_reward", label: "SPECIAL (0.1%)" },
                  { key: "mythic", label: "MYTHIC (1.4%)" },
                  { key: "legendary", label: "LEGENDARY (5.5%)" },
                  { key: "epic", label: "EPIC (13%)" },
                  { key: "rare", label: "RARE (25%)" },
                  { key: "common", label: "COMMON (55%)" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      playClickSound();
                      setCatalogRarityFilter(f.key);
                    }}
                    className={`px-3 py-1 rounded-xl font-mono text-[10px] uppercase tracking-wider transition ${
                      catalogRarityFilter === f.key
                        ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
                        : "text-[#D9D9E2]/60 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DROP_SPECIMENS.filter(
                (s) =>
                  catalogRarityFilter === "all" || s.rarity === catalogRarityFilter
              ).map((specimen) => {
                const theme = RARITY_THEMES[specimen.rarity] || RARITY_THEMES.common;
                return (
                  <div
                    key={specimen.item_id}
                    className={`rounded-3xl p-4 bg-gradient-to-b ${theme.bg} border ${theme.border} ${theme.glow} flex flex-col justify-between space-y-3 transition-all duration-300 hover:scale-[1.02]`}
                  >
                    <div className="space-y-3">
                      {/* Top Specimen Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {specimen.specimen_code && (
                            <span className="px-2 py-0.5 rounded-full bg-black/80 border border-white/20 font-mono text-[9px] text-[#00F0FF] font-bold">
                              {specimen.specimen_code}
                            </span>
                          )}
                          <span className="font-mono text-[9px] text-white/50 uppercase">
                            {specimen.specimen_class || "OBJECT"}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-display font-black text-[9px] uppercase border ${theme.pillBg}`}>
                          {theme.name}
                        </span>
                      </div>

                      {/* Photo Pouch Image */}
                      <div
                        onClick={() => handleInspectSpecimen(specimen)}
                        className="cursor-pointer relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10 p-2 flex items-center justify-center group"
                      >
                        <img
                          src={specimen.image_url}
                          alt={specimen.item_name}
                          className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/90 border border-amber-500/40 font-mono text-[10px] font-bold text-amber-300">
                          ШАНС: {specimen.drop_chance}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-display font-black text-sm uppercase tracking-wide text-white">
                          {specimen.item_name}
                        </h3>
                        <p className="font-mono text-[10px] text-[#00F0FF] uppercase mt-0.5">
                          КОЛЛЕКЦИЯ: {specimen.collection_name}
                        </p>
                        <p className="text-xs text-[#D9D9E2]/75 font-sans mt-2 line-clamp-3 leading-relaxed">
                          {specimen.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-amber-300">
                        Шанс: {specimen.drop_chance}
                      </span>
                      <button
                        onClick={() => handleInspectSpecimen(specimen)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 font-mono text-[10px] uppercase text-white transition flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-[#00F0FF]" />
                        <span>3D Осмотр</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-8">
            {/* Inventory Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                  Личный инвентарь ({items.length})
                </h2>
                <p className="text-xs text-[#D9D9E2]/70">
                  Все полученные образцы привязаны к вашему аккаунту. До 6 предметов можно выставить на публичную витрину профиля.
                </p>
              </div>

              {/* Rarity Filter Bar */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "Все" },
                  { key: "common", label: "Common" },
                  { key: "rare", label: "Rare" },
                  { key: "epic", label: "Epic" },
                  { key: "legendary", label: "Legendary" },
                  { key: "mythic", label: "Mythic" },
                  { key: "special_reward", label: "Special" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setInventoryRarityFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition ${
                      inventoryRarityFilter === f.key
                        ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                        : "bg-white/[0.04] text-[#D9D9E2]/70 hover:text-white border border-white/10"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Grid */}
            {filteredItems.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                <Boxes className="w-12 h-12 text-[#8737FF]/60 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-white">
                    В инвентаре пока пусто
                  </h3>
                  <p className="text-xs text-[#D9D9E2]/60 max-w-sm mx-auto">
                    Открывай кейсы в разделе PLAY, собирай коллекцию и выставляй артефакты на витрину.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("play")}
                  className="btn-energy px-6 py-2.5 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_20px_rgba(135,55,255,0.4)]"
                >
                  Перейти к кейсам
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 transition-all duration-300 space-y-3 group"
                  >
                    <SpecimenVisual
                      itemId={item.item_id}
                      itemName={item.item_name}
                      rarity={item.rarity}
                      imageUrl={item.image_url}
                      serialNumber={item.serial_number}
                      collectionName={item.collection_name}
                      isSpecialReward={item.rarity === "special_reward"}
                      interactiveTilt={false}
                    />

                    <div className="space-y-1 text-center">
                      <h4 className="font-display font-black text-xs uppercase tracking-tight text-white truncate">
                        {item.item_name}
                      </h4>
                      <p className="font-mono text-[9px] text-[#D9D9E2]/60 uppercase">
                        №{String(item.serial_number).padStart(6, "0")}
                      </p>
                    </div>

                    {/* Actions Row */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => setInspectingItem(item)}
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[9px] uppercase tracking-wider text-white flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3 text-[#00F0FF]" />
                        <span>3D</span>
                      </button>
                      <button
                        onClick={() => handleTogglePin(item)}
                        className={`py-1.5 px-2 rounded-lg font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition ${
                          item.is_pinned
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/[0.04] text-[#D9D9E2]/70 hover:text-white border border-white/10"
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{item.is_pinned ? "Витрина" : "+ Витрина"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =====================================================================
          ALL MODALS
          ===================================================================== */}
      <CaseOpeningModal
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        caseConfig={selectedCase}
        userBalance={balance}
        onSuccess={handleCaseSuccess}
        onInspectItem={(item) => setInspectingItem(item)}
      />

      <DropRatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        caseConfig={selectedCase}
      />

      <HowToPlayModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenGetCxp={() => setIsGetCxpModalOpen(true)}
      />

      <GetCxpModal
        isOpen={isGetCxpModalOpen}
        onClose={() => setIsGetCxpModalOpen(false)}
        userBalance={balance}
      />

      <DropHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
      />

      <ItemInspectModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
        onTogglePin={handleTogglePin}
      />

      <OnboardingTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
      />
    </div>
  );
}
