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
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  DropCaseConfig,
  DropInventoryItem,
  DropHistoryEntry,
  ItemRarity,
} from "@/lib/ecosystemTypes";
import {
  DROP_CASES,
  DROP_SPECIMENS,
  SALVAGE_CXP_BY_RARITY,
  FUSION_NEXT_RARITY,
} from "@/lib/ecosystemTypes";
import SpecimenVisual, { RARITY_THEMES } from "./SpecimenVisual";
import ZipPacket3DViewer from "./ZipPacket3DViewer";
import CaseOpeningModal from "./CaseOpeningModal";
import DropRatesModal from "./DropRatesModal";
import HowToPlayModal from "./HowToPlayModal";
import GetCxpModal from "./GetCxpModal";
import DropHistoryModal from "./DropHistoryModal";
import ItemInspectModal from "./ItemInspectModal";
import OnboardingTourModal from "./OnboardingTourModal";
import { playClickSound, isSfxEnabled, setSfxEnabled } from "@/lib/soundFX";

interface DropGameArenaProps {
  initialItems: DropInventoryItem[];
  initialBalance: number;
  initialHistory: DropHistoryEntry[];
  username: string;
  isLoggedIn: boolean;
  defaultTab?: "play" | "inventory" | "prizes" | "fusion";
}

interface LiveFeedEntry {
  id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  item_id: string;
  item_name: string;
  specimen_code: string;
  collection_name: string;
  rarity: ItemRarity;
  serial_number: number;
  image_url: string;
  description: string;
  case_name: string;
}

interface DailyScanState {
  canClaimToday: boolean;
  currentStreak: number;
  nextStreakDay: number;
  lastClaimedDate: string | null;
  totalScans: number;
  rewardsSchedule: Array<{ day: number; cxp: number; bonusItem?: boolean }>;
}

export default function DropGameArena({
  initialItems,
  initialBalance,
  initialHistory,
  username,
  isLoggedIn,
  defaultTab = "play",
}: DropGameArenaProps) {
  const [activeTab, setActiveTab] = useState<
    "play" | "battle" | "leaderboard" | "inventory" | "prizes" | "fusion"
  >(defaultTab);
  const [items, setItems] = useState<DropInventoryItem[]>(initialItems);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [animatedBalance, setAnimatedBalance] = useState<number>(initialBalance);
  const [sfxOn, setSfxOn] = useState<boolean>(true);
  const [history, setHistory] = useState<DropHistoryEntry[]>(initialHistory);

  // Live Feed, Daily Scan, Fusion Lab, 1v1 Battle, Leaderboard & Gift/Promo state
  const [liveFeed, setLiveFeed] = useState<LiveFeedEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dailyScan, setDailyScan] = useState<DailyScanState | null>(null);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [fusionRarity, setFusionRarity] = useState<"common" | "rare" | "epic" | "legendary">("common");
  const [selectedFusionIds, setSelectedFusionIds] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isClaimingPromo, setIsClaimingPromo] = useState(false);
  const [giftShareUrl, setGiftShareUrl] = useState<string | null>(null);
  const [battleOpponent, setBattleOpponent] = useState("CYBER-BOT // ARCHIVE-09");
  const [isBattling, setIsBattling] = useState(false);
  const [battleResult, setBattleResult] = useState<any | null>(null);

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

  // Animate CXP balance counter smoothly
  useEffect(() => {
    if (animatedBalance === balance) return;
    const diff = balance - animatedBalance;
    const step = Math.sign(diff) * Math.max(1, Math.min(Math.abs(diff), Math.ceil(Math.abs(diff) / 6)));
    const timer = setTimeout(() => {
      setAnimatedBalance((prev) => prev + step);
    }, 30);
    return () => clearTimeout(timer);
  }, [balance, animatedBalance]);

  // Sync SFX state and load Live Feed + Daily Scan status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSfxOn(isSfxEnabled());
    }
    fetch("/api/cabinet/drop/actions")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.liveFeed)) setLiveFeed(d.liveFeed);
        if (Array.isArray(d?.feed) && !d?.liveFeed) setLiveFeed(d.feed);
        if (Array.isArray(d?.leaderboard)) setLeaderboard(d.leaderboard);
        if (d?.dailyScan) setDailyScan(d.dailyScan);
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const giftParam = params.get("gift");
      if (giftParam) {
        setPromoCodeInput(giftParam);
      }
    }
  }, []);

  const handleClaimPromoCode = async (overrideCode?: string) => {
    const code = (overrideCode ?? promoCodeInput).trim();
    if (!code || isClaimingPromo) return;
    if (!isLoggedIn) {
      setStatusNotice("Войдите в аккаунт CXRNER ID, чтобы активировать промокод или подарок");
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }
    setIsClaimingPromo(true);
    try {
      const res = await fetch("/api/cabinet/drop/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_promo", code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusNotice(data.error || "Не удалось активировать код");
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
      if (typeof data.newBalance === "number") setBalance(data.newBalance);
      setPromoCodeInput("");
      if (data.droppedItem) {
        const mapped: DropInventoryItem = {
          id: crypto.randomUUID(),
          user_id: username,
          item_id: data.droppedItem.id,
          item_name: data.droppedItem.name,
          specimen_code: data.droppedItem.specimen_code,
          rarity: data.droppedItem.rarity,
          serial_number: data.droppedItem.serial || 101,
          image_url: data.droppedItem.image_url,
          description: data.droppedItem.description,
          collection_name: data.droppedItem.collection_name || "SPECIMEN ARCHIVE",
          model_3d_type: "procedural",
          model_color: "#00F0FF",
          obtained_via: "promo_gift",
          is_equipped: false,
          is_pinned: false,
          is_hidden: false,
          created_at: new Date().toISOString(),
        };
        setItems((prev) => [mapped, ...prev]);
        setInspectingItem(mapped);
      }
      setStatusNotice(`🎁 ${data.message || "Бонус успешно получен!"}`);
      setTimeout(() => setStatusNotice(null), 4500);
    } catch {
      setStatusNotice("Ошибка сети при проверке кода");
      setTimeout(() => setStatusNotice(null), 3500);
    } finally {
      setIsClaimingPromo(false);
    }
  };

  const handleCreateGiftLink = async (item: DropInventoryItem) => {
    if (!isLoggedIn) return;
    playClickSound();
    try {
      const res = await fetch("/api/cabinet/drop/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_gift", inventoryItemId: item.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusNotice(data.error || "Не удалось упаковать подарок");
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
      const fullUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${data.giftUrl}`
          : data.giftUrl;
      setGiftShareUrl(fullUrl);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      navigator.clipboard?.writeText(fullUrl).catch(() => {});
      setStatusNotice(
        `🎁 Ссылка-подарок на «${item.item_name}» скопирована! Отправьте её другу.`
      );
      setTimeout(() => setStatusNotice(null), 5000);
    } catch {
      setStatusNotice("Ошибка создания подарочной капсулы");
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  const handleRunCaseBattle = async () => {
    if (isBattling) return;
    if (!isLoggedIn) {
      setStatusNotice("Войдите в аккаунт CXRNER ID для участия в 1v1 Дуэли");
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }
    playClickSound();
    setIsBattling(true);
    setBattleResult(null);
    const backendCaseId =
      selectedCase.id === "case_003_blackout"
        ? "case-003"
        : selectedCase.id === "case_002_chrome"
        ? "case-002"
        : "case-001";
    try {
      const res = await fetch("/api/cabinet/drop/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "case_battle",
          caseId: backendCaseId,
          opponentName: battleOpponent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusNotice(data.error || "Не удалось запустить дуэль");
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
      if (typeof data.newBalance === "number") setBalance(data.newBalance);
      setBattleResult(data);
      if (data.won && data.userRoll && data.botRoll) {
        const toInv = (roll: any): DropInventoryItem => ({
          id: crypto.randomUUID(),
          user_id: username,
          item_id: roll.id,
          item_name: roll.name,
          specimen_code: roll.specimen_code,
          rarity: roll.rarity,
          serial_number: roll.serial || 101,
          image_url: roll.image_url,
          description: roll.description,
          collection_name: roll.collection_name || "SPECIMEN ARCHIVE",
          model_3d_type: "procedural",
          model_color: "#8737FF",
          obtained_via: "case_battle_1v1",
          is_equipped: false,
          is_pinned: false,
          is_hidden: false,
          created_at: new Date().toISOString(),
        });
        setItems((prev) => [toInv(data.botRoll), toInv(data.userRoll), ...prev]);
        setStatusNotice(
          `🏆 ПОБЕДА В ДУЭЛИ! Вы забрали ОБА артефакта: «${data.userRoll.name}» и «${data.botRoll.name}»!`
        );
      } else {
        setStatusNotice(
          `⚔️ Соперник выбил старший образец. Вам начислен кэшбэк +${data.cashbackCxp || 20} CXP!`
        );
      }
      setTimeout(() => setStatusNotice(null), 5000);
    } catch {
      setStatusNotice("Сбой сети при проведении дуэли");
      setTimeout(() => setStatusNotice(null), 3500);
    } finally {
      setIsBattling(false);
    }
  };

  const handleSalvageItem = async (item: DropInventoryItem) => {
    if (!item?.id || item.id === "preview" || item.id.startsWith("seed_")) return;
    try {
      const res = await fetch("/api/cabinet/drop/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvage",
          inventoryItemId: item.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusNotice(data.error || "Не удалось распылить предмет");
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedFusionIds((prev) => prev.filter((id) => id !== item.id));
      if (typeof data.newBalance === "number") setBalance(data.newBalance);
      if (inspectingItem?.id === item.id) setInspectingItem(null);
      setStatusNotice(
        `⚡ Образец «${item.item_name}» распылён! Начислено +${data.refundedCxp} CXP.`
      );
      setTimeout(() => setStatusNotice(null), 3500);
    } catch {
      setStatusNotice("Ошибка сети при распылении предмета");
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  const handleClaimDailyScan = async () => {
    if (!isLoggedIn) {
      setStatusNotice("Войдите в аккаунт CXRNER ID, чтобы получать ежедневный бонус CXP");
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }
    setIsClaimingDaily(true);
    try {
      const res = await fetch("/api/cabinet/drop/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "daily_scan" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusNotice(data.error || "Скан уже выполнен сегодня");
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
      if (typeof data.newBalance === "number") setBalance(data.newBalance);
      if (data.dailyScan) setDailyScan(data.dailyScan);
      if (data.bonusItem) {
        setItems((prev) => [data.bonusItem, ...prev]);
        setInspectingItem(data.bonusItem);
        setStatusNotice(
          `🔥 7 ДНЕЙ СЕРИИ! Начислено +${data.awardedCxp} CXP и бонусный артефакт «${data.bonusItem.item_name}»!`
        );
      } else {
        setStatusNotice(
          `⚡ Ежедневный скан архива (День ${data.streakDay}/7): +${data.awardedCxp} CXP!`
        );
      }
      setTimeout(() => setStatusNotice(null), 4000);
    } catch {
      setStatusNotice("Ошибка при выполнении ежедневного скана");
      setTimeout(() => setStatusNotice(null), 3500);
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const eligibleFusionItems = items.filter(
    (i) => i.rarity === fusionRarity && !i.is_special_reward
  );

  const handleAutoSelectFusion = (targetRarity = fusionRarity) => {
    playClickSound();
    const candidates = items.filter(
      (i) => i.rarity === targetRarity && !i.is_special_reward
    );
    // Prefer unpinned items and duplicates first
    const sorted = [...candidates].sort((a, b) => Number(a.is_pinned) - Number(b.is_pinned));
    setSelectedFusionIds(sorted.slice(0, 5).map((i) => i.id));
  };

  const handleExecuteFusion = async () => {
    if (selectedFusionIds.length !== 5 || isFusing) return;
    playClickSound();
    setIsFusing(true);
    try {
      const res = await fetch("/api/cabinet/drop/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fuse",
          itemIds: selectedFusionIds,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusNotice(data.error || "Ошибка синтеза образцов");
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
      const removeSet = new Set(selectedFusionIds);
      setItems((prev) => [data.fusedItem, ...prev.filter((i) => !removeSet.has(i.id))]);
      setSelectedFusionIds([]);
      if (typeof data.newBalance === "number") setBalance(data.newBalance);
      if (Array.isArray(data.liveFeed)) setLiveFeed(data.liveFeed);
      setInspectingItem(data.fusedItem);
      setStatusNotice(
        `✨ СИНТЕЗ ЗАВЕРШЁН! Получен «${data.fusedItem.item_name}» [${data.fusedItem.rarity.toUpperCase()}] и +${data.bonusCxp} CXP!`
      );
      setTimeout(() => setStatusNotice(null), 4500);
    } catch {
      setStatusNotice("Сбой сети при синтезе");
      setTimeout(() => setStatusNotice(null), 3500);
    } finally {
      setIsFusing(false);
    }
  };

  const pinnedCount = items.filter((i) => i.is_pinned).length;

  const handleCaseSuccess = (
    item: DropInventoryItem,
    balanceAfter: number,
    claimCode?: string,
    isSpecialReward?: boolean
  ) => {
    const normalizedItem: DropInventoryItem = {
      ...item,
      ...(claimCode ? { claim_code: claimCode } : {}),
      ...(isSpecialReward ? { is_special_reward: true } : {}),
    };
    setBalance(balanceAfter);
    setItems((prev) => [normalizedItem, ...prev]);

    // Append to history
    const newEntry: DropHistoryEntry = {
      id: crypto.randomUUID(),
      user_id: username,
      case_id: selectedCase.id,
      case_name: selectedCase.name,
      item_id: item.item_id,
      item_name: item.item_name,
      rarity: item.rarity,
      serial_number: item.serial_number,
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
    <div className="min-h-screen bg-[#05030A] pt-16 sm:pt-[72px] text-white selection:bg-[#8737FF] selection:text-white relative">
      {/* Ambient Cosmic Atmosphere & Glow Layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-[#8737FF]/15 rounded-full blur-[140px] animate-drop-pulse" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-[#00F0FF]/10 rounded-full blur-[150px] animate-drop-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[500px] bg-[#3B0764]/20 rounded-full blur-[160px]" />
        <div className="absolute inset-0 gothic-grid opacity-25" />
      </div>
      {/* =====================================================================
          TOP GAMING HUD BAR
          ===================================================================== */}
      <header className="sticky top-16 sm:top-[72px] z-30 w-full border-b border-white/10 bg-[#07050D]/95 backdrop-blur-xl">
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
                  14+4
                </span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("battle");
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "battle"
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                    : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                <span>⚔️ ДУЭЛЬ 1v1</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("leaderboard");
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "leaderboard"
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                    : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                <span>🏆 ЗАЛ СЛАВЫ</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("fusion");
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "fusion"
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                    : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                <span>СИНТЕЗ</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#B46BFF]/25 text-[#E9D5FF] text-[9px] font-bold">
                  5→1
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
                {animatedBalance}
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

            {/* Audio SFX Toggle */}
            <button
              onClick={() => {
                const next = !sfxOn;
                setSfxOn(next);
                setSfxEnabled(next);
              }}
              title={sfxOn ? "Звуковые эффекты: ВКЛ" : "Звуковые эффекты: ВЫКЛ"}
              className={`p-2 rounded-xl border transition ${
                sfxOn
                  ? "bg-[#8737FF]/20 border-[#B46BFF]/50 text-[#B46BFF] shadow-[0_0_12px_rgba(135,55,255,0.35)]"
                  : "bg-white/[0.04] border-white/10 text-white/40 hover:text-white"
              }`}
            >
              {sfxOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
                  {animatedBalance}
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
              <button
                onClick={() => {
                  const next = !sfxOn;
                  setSfxOn(next);
                  setSfxEnabled(next);
                }}
                title={sfxOn ? "Звук: ВКЛ" : "Звук: ВЫКЛ"}
                className={`p-1.5 rounded-lg border transition ${
                  sfxOn
                    ? "bg-[#8737FF]/25 border-[#B46BFF]/50 text-[#B46BFF]"
                    : "bg-white/[0.04] border-white/10 text-white/40"
                }`}
              >
                {sfxOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom row: Mode Tabs (6 compact segments on mobile) */}
          <div className="grid grid-cols-6 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-[8px] uppercase tracking-wider">
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
                setActiveTab("battle");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold ${
                activeTab === "battle"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              ⚔️ 1v1
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("leaderboard");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold ${
                activeTab === "leaderboard"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              🏆 ТОП
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("prizes");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold flex items-center justify-center gap-0.5 ${
                activeTab === "prizes"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              <span>ПРИЗЫ</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("fusion");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold flex items-center justify-center gap-0.5 ${
                activeTab === "fusion"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              <span>СИНТЕЗ</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("inventory");
              }}
              className={`py-1.5 rounded-lg text-center transition font-bold flex items-center justify-center gap-0.5 ${
                activeTab === "inventory"
                  ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                  : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              <span>СКЛАД</span>
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
          LIVE RECENT DROPS TICKER (REAL-TIME ARCHIVE FEED + 3D INSPECT)
          ===================================================================== */}
      <div className="py-2 px-4 border-b border-white/10 bg-black/50 overflow-hidden flex items-center gap-4 text-xs font-mono select-none">
        <span className="text-[#00F0FF] uppercase tracking-widest text-[9px] font-bold shrink-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
          LIVE DROPS:
        </span>
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar whitespace-nowrap text-[#D9D9E2]/75 text-[10px]">
          {(liveFeed.length > 0
            ? liveFeed
            : liveRecentDrops.map((d, i) => ({
                id: `seed_fallback_${i}`,
                username: d.user,
                display_name: d.user,
                is_verified: i % 2 === 0,
                item_id:
                  DROP_SPECIMENS.find((s) =>
                    s.item_name.toLowerCase().includes(d.name.toLowerCase())
                  )?.item_id || DROP_SPECIMENS[0].item_id,
                item_name: d.name,
                specimen_code: "ARCHIVE",
                collection_name: "ARCHIVE",
                rarity: d.rarity as ItemRarity,
                serial_number: Number(d.serial) || 101,
                image_url:
                  DROP_SPECIMENS.find((s) =>
                    s.item_name.toLowerCase().includes(d.name.toLowerCase())
                  )?.image_url || DROP_SPECIMENS[0].image_url,
                description: "",
                case_name: "CASE 001 — ARCHIVE",
              }))
          ).map((drop, idx) => {
            const theme = RARITY_THEMES[drop.rarity as ItemRarity] || RARITY_THEMES.common;
            return (
              <button
                type="button"
                key={drop.id || idx}
                onClick={() => {
                  const match =
                    DROP_SPECIMENS.find((s) => s.item_id === drop.item_id) ||
                    DROP_SPECIMENS.find((s) =>
                      s.item_name.toLowerCase().includes(drop.item_name.toLowerCase())
                    );
                  if (match) {
                    setInspectingItem({
                      id: `seed_inspect_${idx}`,
                      user_id: drop.username,
                      item_id: match.item_id,
                      item_name: match.item_name,
                      specimen_code: match.specimen_code,
                      specimen_class: match.specimen_class,
                      collection_name: match.collection_name,
                      rarity: match.rarity,
                      drop_chance: match.drop_chance,
                      serial_number: drop.serial_number || 101,
                      description: match.description,
                      image_url: match.image_url,
                      model_3d_type: "procedural",
                      model_color: match.model_color,
                      obtained_via: drop.case_name || "LIVE ARCHIVE",
                      is_equipped: false,
                      is_pinned: false,
                      is_hidden: false,
                      created_at: new Date().toISOString(),
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.09] border border-white/10 transition group cursor-pointer text-left"
                title="Нажмите для 3D-осмотра выпавшего артефакта"
              >
                <span className="text-white/60">@{drop.username}</span>
                {drop.is_verified && <span className="text-[#00F0FF] text-[9px]">✓</span>}
                <span className="text-white font-bold group-hover:text-[#00F0FF] transition-colors">
                  {drop.item_name}
                </span>
                <span className="text-white/40 text-[9px]">
                  #{String(drop.serial_number || 1).padStart(4, "0")}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${theme.pillBg}`}
                >
                  {drop.rarity === "special_reward" ? "SPECIAL" : drop.rarity}
                </span>
              </button>
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

            {/* DAILY ARCHIVE SCAN // 7-DAY STREAK CALIBRATION */}
            <div className="rounded-3xl border border-[#00F0FF]/30 bg-gradient-to-r from-[#00F0FF]/[0.07] via-[#090612] to-[#8737FF]/[0.1] p-4 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.08)] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ЕЖЕДНЕВНОЕ СКАНИРОВАНИЕ АРХИВА // СЕРИЯ 7 ДНЕЙ</span>
                  </div>
                  <h3 className="font-display font-black text-lg sm:text-xl uppercase tracking-tight text-white">
                    БЕСПЛАТНАЯ КАЛИБРОВКА CXP + БОНУСНЫЙ ОБРАЗЕЦ НА 7-Й ДЕНЬ
                  </h3>
                  <p className="text-xs text-[#D9D9E2]/75 font-sans">
                    Заходи каждый день, запускай сканер хранилища и забирай от +15 до +75 CXP. На 7-й день серии — гарантированный редкий артефакт бесплатно!
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isClaimingDaily || (dailyScan !== null && !dailyScan.canClaimToday)}
                  onClick={handleClaimDailyScan}
                  className={`shrink-0 px-6 py-3.5 rounded-full font-mono text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                    dailyScan && !dailyScan.canClaimToday
                      ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 cursor-default"
                      : "btn-energy text-white shadow-[0_0_25px_rgba(135,55,255,0.5)]"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isClaimingDaily
                      ? "Сканирование..."
                      : dailyScan && !dailyScan.canClaimToday
                      ? `✓ Скан выполнен (Серия: ${dailyScan.currentStreak}/7)`
                      : `⚡ Запустить ежедневный скан (+${
                          dailyScan?.rewardsSchedule?.find(
                            (r) => r.day === (dailyScan?.nextStreakDay || 1)
                          )?.cxp || 15
                        } CXP)`}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-1">
                {[
                  { day: 1, cxp: 15 },
                  { day: 2, cxp: 20 },
                  { day: 3, cxp: 25 },
                  { day: 4, cxp: 30 },
                  { day: 5, cxp: 40 },
                  { day: 6, cxp: 50 },
                  { day: 7, cxp: 75, bonus: true },
                ].map((d) => {
                  const streak = dailyScan?.currentStreak || 0;
                  const nextDay = dailyScan?.nextStreakDay || 1;
                  const isDone = d.day <= streak && !(dailyScan?.canClaimToday && d.day === nextDay);
                  const isCurrent = Boolean(dailyScan?.canClaimToday ?? true) && d.day === nextDay;
                  return (
                    <div
                      key={d.day}
                      className={`p-2 sm:p-2.5 rounded-2xl border text-center transition ${
                        isDone
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                          : isCurrent
                          ? "border-[#00F0FF] bg-[#00F0FF]/15 text-white shadow-[0_0_18px_rgba(0,240,255,0.25)]"
                          : "border-white/10 bg-black/40 text-white/45"
                      }`}
                    >
                      <div className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider font-bold">
                        ДЕНЬ {d.day}
                      </div>
                      <div className="font-display font-black text-xs sm:text-sm mt-0.5">
                        +{d.cxp}
                      </div>
                      <div className="font-mono text-[7px] sm:text-[8px] uppercase opacity-80">
                        {d.bonus ? "🎁 +ДРОП" : isDone ? "✓ ВЗЯТО" : "CXP"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Case Selector Carousel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {DROP_CASES.map((c) => {
                const isSelected = c.id === selectedCase.id;
                const cAccent =
                  c.id === "case_002_black_specimen"
                    ? "#A855F7"
                    : c.id === "case_003_chrome_age"
                    ? "#00F0FF"
                    : "#8737FF";
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedCaseId(c.id);
                    }}
                    className={`p-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? "border-white/40 bg-gradient-to-b from-[#130E20] to-[#06040A] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_20px_50px_rgba(0,0,0,0.75)] -translate-y-0.5"
                        : "border-white/10 bg-[#08060D]/80 hover:border-white/25 hover:bg-[#0D0A15]"
                    }`}
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${cAccent}, transparent)`,
                        opacity: isSelected ? 1 : 0.25,
                      }}
                    />

                    {/* Top Case Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="font-mono text-[9px] uppercase tracking-widest font-bold"
                        style={{ color: cAccent }}
                      >
                        {c.subtitle}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/70 border border-white/15 font-mono text-[10px] text-white font-bold">
                        {c.price_cxp} CXP
                      </span>
                    </div>

                    <h3 className="font-display font-black text-lg uppercase tracking-tight text-white mb-1">
                      {c.name}
                    </h3>

                    <p className="text-xs text-[#D9D9E2]/65 leading-relaxed mb-4 line-clamp-2 font-sans">
                      {c.description}
                    </p>

                    {/* Case Pouch Thumbnail */}
                    <div className="relative aspect-[3/4] w-28 mx-auto rounded-xl overflow-hidden p-1 flex items-center justify-center">
                      <img
                        src={c.cover_url}
                        alt={c.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_10px_22px_rgba(0,0,0,0.75)] group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {isSelected && (
                      <div
                        className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold"
                        style={{ color: cAccent }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: cAccent }}
                        />
                        <span>АКТИВНЫЙ КОНТЕЙНЕР</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Central Opening Arena Stage */}
            <div className="cxr-panel-chrome rounded-3xl p-5 sm:p-10 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left 3D Viewport */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                  <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#050409] p-2">
                    <ZipPacket3DViewer
                      caseId={selectedCase.id}
                      themeColor={
                        selectedCase.id === "case_002_black_specimen"
                          ? "#A855F7"
                          : selectedCase.id === "case_003_chrome_age"
                          ? "#00F0FF"
                          : "#8737FF"
                      }
                      labelCode={selectedCase.subtitle}
                      specimenName={selectedCase.name}
                      heightClass="h-[290px] sm:h-[360px]"
                    />
                  </div>
                </div>

                {/* Right Action Terminal */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/35 bg-[#00F0FF]/10 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF]">
                      <span>SPECIMEN CHAMBER // ONLINE</span>
                    </div>
                    <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-white">
                      {selectedCase.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#D9D9E2]/75 leading-relaxed font-sans">
                      {selectedCase.description}
                    </p>
                  </div>

                  {/* Pricing and Stats Bar */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                    <div>
                      <span className="text-white/45 block text-[10px] mb-0.5">СТОИМОСТЬ</span>
                      <span className="font-display font-black text-lg text-white">
                        {selectedCase.price_cxp} CXP
                      </span>
                    </div>
                    <div>
                      <span className="text-white/45 block text-[10px] mb-0.5">ВАШ БАЛАНС</span>
                      <span
                        className={`font-display font-black text-lg ${
                          balance >= selectedCase.price_cxp
                            ? "text-[#00F0FF]"
                            : "text-rose-400"
                        }`}
                      >
                        {animatedBalance} CXP
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-white/45 block text-[10px] mb-0.5">СПЕЦПРИЗ</span>
                      <span className="font-display font-black text-xs text-yellow-300">
                        COVER VOUCHER (0.1%)
                      </span>
                    </div>
                  </div>

                  {/* Main Action CTAs */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        playClickSound();
                        setIsOpeningModalOpen(true);
                      }}
                      className="w-full btn-energy py-4 rounded-full font-display text-sm uppercase font-black tracking-wider text-white flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Boxes className="w-5 h-5 text-[#00F0FF]" />
                      <span>ВСКРЫТЬ КЕЙС ({selectedCase.price_cxp} CXP)</span>
                    </button>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <button
                        onClick={() => {
                          playClickSound();
                          setIsRatesModalOpen(true);
                        }}
                        className="py-2.5 px-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#D9D9E2] flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Percent className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span>Шансы</span>
                      </button>

                      <button
                        onClick={() => {
                          playClickSound();
                          setIsHelpModalOpen(true);
                        }}
                        className="py-2.5 px-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#D9D9E2] flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#B46BFF]" />
                        <span>Правила</span>
                      </button>

                      <button
                        onClick={() => {
                          const next = !sfxOn;
                          setSfxOn(next);
                          setSfxEnabled(next);
                        }}
                        title={sfxOn ? "Звук: ВКЛ" : "Звук: ВЫКЛ"}
                        className={`col-span-2 sm:col-span-1 py-2.5 px-3 rounded-full border font-mono text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sfxOn
                            ? "bg-[#8737FF]/20 border-[#B46BFF]/50 text-[#D9B8FF]"
                            : "bg-white/[0.04] border-white/10 text-white/50"
                        }`}
                      >
                        {sfxOn ? (
                          <Volume2 className="w-3.5 h-3.5" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5" />
                        )}
                        <span>{sfxOn ? "SFX ON" : "SFX OFF"}</span>
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

        {/* ===================================================================
            TAB: ARCHIVE FUSION LAB (5 -> 1 CRAFTING)
            =================================================================== */}
        {activeTab === "fusion" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#E3C8FF] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>ARCHIVE FUSION LAB // СИНТЕЗ 5 → 1</span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                  ЛАБОРАТОРИЯ СИНТЕЗА АРТЕФАКТОВ
                </h2>
                <p className="text-xs text-[#D9D9E2]/75 font-sans mt-1 max-w-2xl">
                  Объедините 5 любых образцов одной редкости из вашего инвентаря, чтобы гарантированно синтезировать 1 предмет следующего уровня редкости и получить бонус +15 CXP.
                </p>
              </div>

              {/* Tier Selector */}
              <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10">
                {(
                  [
                    { from: "common", to: "RARE", label: "5× COMMON → RARE" },
                    { from: "rare", to: "EPIC", label: "5× RARE → EPIC" },
                    { from: "epic", to: "LEGENDARY", label: "5× EPIC → LEGENDARY" },
                    { from: "legendary", to: "MYTHIC", label: "5× LEGENDARY → MYTHIC" },
                  ] as const
                ).map((tier) => {
                  const count = items.filter(
                    (i) => i.rarity === tier.from && !i.is_special_reward
                  ).length;
                  return (
                    <button
                      key={tier.from}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setFusionRarity(tier.from);
                        setSelectedFusionIds([]);
                      }}
                      className={`px-3 py-2 rounded-xl font-mono text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        fusionRarity === tier.from
                          ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                          : "text-[#D9D9E2]/65 hover:text-white"
                      }`}
                    >
                      <span>{tier.label}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/50 text-[#00F0FF] text-[9px] font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5-Slot Fusion Chamber */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[#B46BFF]/35 bg-gradient-to-b from-[#130C24] via-[#090612] to-[#050309] shadow-[0_24px_80px_rgba(0,0,0,0.85)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-bold block">
                    КАМЕРА МОЛЕКУЛЯРНОЙ СБОРКИ // ВЫБРАНО {selectedFusionIds.length} ИЗ 5
                  </span>
                  <h3 className="font-display font-black text-lg sm:text-xl uppercase text-white mt-0.5">
                    ЦЕЛЬ СИНТЕЗА: 1× {(FUSION_NEXT_RARITY[fusionRarity] || "rare").toUpperCase()} + 15 CXP
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={eligibleFusionItems.length < 5}
                    onClick={() => handleAutoSelectFusion(fusionRarity)}
                    className="px-4 py-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 font-mono text-[11px] uppercase tracking-wider font-bold text-[#00F0FF] transition disabled:opacity-40 cursor-pointer"
                  >
                    Авто-выбор 5 шт.
                  </button>
                  {selectedFusionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedFusionIds([])}
                      className="px-3.5 py-2 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/10 font-mono text-[11px] uppercase tracking-wider text-white/70 transition cursor-pointer"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>

              {/* 5 Input Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, slotIdx) => {
                  const selId = selectedFusionIds[slotIdx];
                  const selItem = items.find((i) => i.id === selId);
                  return (
                    <div
                      key={slotIdx}
                      onClick={() => {
                        if (selItem) {
                          setSelectedFusionIds((prev) => prev.filter((id) => id !== selItem.id));
                        }
                      }}
                      className={`min-h-[150px] rounded-2xl border p-3 flex flex-col items-center justify-center text-center transition ${
                        selItem
                          ? "border-[#00F0FF]/60 bg-[#00F0FF]/[0.08] cursor-pointer hover:border-rose-400/60"
                          : "border-dashed border-white/15 bg-black/40 text-white/35"
                      }`}
                    >
                      {selItem ? (
                        <>
                          <img
                            src={selItem.image_url}
                            alt={selItem.item_name}
                            className="w-16 h-16 object-contain mb-2"
                          />
                          <div className="font-display font-black text-[10px] uppercase text-white line-clamp-1">
                            {selItem.item_name}
                          </div>
                          <div className="font-mono text-[9px] text-[#00F0FF] mt-0.5">
                            #{String(selItem.serial_number).padStart(4, "0")}
                          </div>
                          <span className="font-mono text-[8px] text-white/50 uppercase mt-1">
                            Нажмите, чтобы убрать
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center font-mono text-xs text-white/40 mb-1.5">
                            0{slotIdx + 1}
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-wider">
                            СЛОТ {fusionRarity.toUpperCase()}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={selectedFusionIds.length !== 5 || isFusing}
                onClick={handleExecuteFusion}
                className="w-full py-4 rounded-2xl btn-energy font-mono text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_30px_rgba(135,55,255,0.5)] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isFusing
                    ? "МОЛЕКУЛЯРНЫЙ СИНТЕЗ ОБРАЗЦА..."
                    : `⚡ СИНТЕЗИРОВАТЬ 1× ${(
                        FUSION_NEXT_RARITY[fusionRarity] || "rare"
                      ).toUpperCase()} (+15 CXP)`}
                </span>
              </button>
            </div>

            {/* Eligible Inventory Items to Pick From */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-black text-base uppercase text-white">
                  ДОСТУПНЫЕ ПРЕДМЕТЫ {fusionRarity.toUpperCase()} В ИНВЕНТАРЕ ({eligibleFusionItems.length})
                </h4>
                <span className="font-mono text-[11px] text-white/55">
                  Нажмите на карточки ниже, чтобы добавить в камеру синтеза
                </span>
              </div>

              {eligibleFusionItems.length === 0 ? (
                <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02] text-center space-y-2">
                  <p className="font-mono text-xs text-white/60">
                    В вашем инвентаре пока нет предметов редкости {fusionRarity.toUpperCase()}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {eligibleFusionItems.map((item) => {
                    const isSelected = selectedFusionIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          playClickSound();
                          if (isSelected) {
                            setSelectedFusionIds((prev) => prev.filter((id) => id !== item.id));
                          } else if (selectedFusionIds.length < 5) {
                            setSelectedFusionIds((prev) => [...prev, item.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 ${
                          isSelected
                            ? "border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/30"
                        }`}
                      >
                        <div className="aspect-square rounded-xl bg-black/50 p-2 flex items-center justify-center relative">
                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="w-full h-full object-contain"
                          />
                          {isSelected && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#00F0FF] text-[#050407] font-mono text-[9px] font-black">
                              В СЛОТЕ
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="font-display font-black text-xs uppercase text-white truncate">
                            {item.item_name}
                          </div>
                          <div className="font-mono text-[9px] text-white/55">
                            #{String(item.serial_number).padStart(6, "0")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[9px] uppercase tracking-wider text-white flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#00F0FF]" />
                        <span>3D</span>
                      </button>
                      <button
                        onClick={() => handleTogglePin(item)}
                        className={`py-1.5 px-2 rounded-lg font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer ${
                          item.is_pinned
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/[0.04] text-[#D9D9E2]/70 hover:text-white border border-white/10"
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{item.is_pinned ? "Витрина" : "+ Витрина"}</span>
                      </button>
                      {!item.is_special_reward && item.rarity !== "special_reward" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSalvageItem(item)}
                            className="col-span-2 py-1.5 px-2 rounded-lg border border-[#00F0FF]/35 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 font-mono text-[9px] uppercase tracking-wider font-bold text-[#00F0FF] flex items-center justify-center gap-1 transition cursor-pointer"
                            title="Распылить предмет и вернуть CXP"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>⚡ Распылить (+{SALVAGE_CXP_BY_RARITY[item.rarity] || 15} CXP)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateGiftLink(item)}
                            className="col-span-2 py-1.5 px-2 rounded-lg border border-[#B46BFF]/40 bg-[#8737FF]/15 hover:bg-[#8737FF]/25 font-mono text-[9px] uppercase tracking-wider font-bold text-[#E9D5FF] flex items-center justify-center gap-1 transition cursor-pointer"
                            title="Упаковать артефакт в подарочную ссылку для друга"
                          >
                            <span>🎁 Подарить другу (ссылка)</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB: 1v1 CASE BATTLE ARENA
            =================================================================== */}
        {activeTab === "battle" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl border border-[#8737FF]/40 bg-gradient-to-b from-[#110A22]/95 via-[#080510]/95 to-[#050408] shadow-[0_24px_80px_rgba(0,0,0,0.85)] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/40 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF73B5]">
                    <span>⚔️ PVP UNSEALING // CASE BATTLE 1v1</span>
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-white">
                    ДУЭЛЬ КАПСУЛ <span className="text-chrome-gradient">1 НА 1</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#D9D9E2]/75 max-w-2xl">
                    Одновременное вскрытие выбранного кейса против соперника. Тот, кому выпадает более ценный образец,{" "}
                    <span className="text-[#00F0FF] font-bold">забирает ОБА артефакта</span>! При поражении вы получаете{" "}
                    <span className="text-[#B46BFF] font-bold">кэшбэк +20 CXP</span>.
                  </p>
                </div>

                {/*Promo Code Quick Bar inside Battle/Drop */}
                <div className="flex items-center gap-2 bg-black/55 border border-white/15 rounded-2xl p-1.5">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Промокод (напр. CXRNER2026)"
                    className="bg-transparent px-3 py-1.5 text-xs font-mono text-white placeholder-white/35 focus:outline-none w-44 sm:w-52"
                  />
                  <button
                    type="button"
                    onClick={() => handleClaimPromoCode()}
                    disabled={isClaimingPromo}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00F0FF] text-[#050407] font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer shrink-0"
                  >
                    {isClaimingPromo ? "..." : "🎁 Ввести"}
                  </button>
                </div>
              </div>

              {/* Select Case & Opponent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/55 block">
                    1. ВЫБЕРИТЕ КАПСУЛУ ДЛЯ ДУЭЛИ:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {DROP_CASES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCaseId(c.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          selectedCaseId === c.id
                            ? "border-[#00F0FF] bg-[#00F0FF]/15 text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                            : "border-white/10 bg-black/40 text-white/65 hover:text-white"
                        }`}
                      >
                        <div className="font-display font-bold text-xs uppercase truncate">
                          {c.name.replace("CASE ", "")}
                        </div>
                        <div className="font-mono text-[10px] text-[#00F0FF] font-bold mt-1">
                          {c.price_cxp} CXP
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/55 block">
                    2. ВЫБЕРИТЕ СОПЕРНИКА:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "CYBER-BOT // ARCHIVE-09",
                      "KAZUMA // PHANTOM",
                      "VOID HUNTER // X7",
                    ].map((opp) => (
                      <button
                        key={opp}
                        type="button"
                        onClick={() => setBattleOpponent(opp)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          battleOpponent === opp
                            ? "border-[#B46BFF] bg-[#8737FF]/20 text-white"
                            : "border-white/10 bg-black/40 text-white/65 hover:text-white"
                        }`}
                      >
                        <div className="font-mono text-[10px] font-bold uppercase truncate">
                          {opp.split(" // ")[0]}
                        </div>
                        <div className="font-mono text-[9px] text-white/45 mt-1 truncate">
                          {opp.split(" // ")[1]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Battle Stage */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center pt-2">
                {/* Player Card */}
                <div className="md:col-span-5 p-5 rounded-2xl border border-[#00F0FF]/35 bg-black/55 text-center space-y-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00F0FF] font-bold">
                    ВЫ · @{username}
                  </span>
                  {battleResult?.userRoll ? (
                    <div className="space-y-2">
                      <img
                        src={battleResult.userRoll.image_url || "/drop/items/common-chip.svg"}
                        alt={battleResult.userRoll.name}
                        className="w-28 h-28 mx-auto object-contain"
                      />
                      <div className="font-display font-black text-base text-white uppercase">
                        {battleResult.userRoll.name}
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 font-mono text-[10px] uppercase text-[#00F0FF] font-bold">
                        {String(battleResult.userRoll.rarity).toUpperCase()} · №{battleResult.userRoll.serial}
                      </span>
                    </div>
                  ) : (
                    <div className="py-8 font-mono text-xs text-white/45">
                      {isBattling ? "ВСКРЫТИЕ КАПСУЛЫ..." : "ГОТОВ К ДУЭЛИ"}
                    </div>
                  )}
                </div>

                {/* Center VS Trigger */}
                <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8737FF] to-[#FF2E93] flex items-center justify-center font-display font-black text-sm text-white shadow-[0_0_25px_rgba(255,46,147,0.5)]">
                    VS
                  </div>
                </div>

                {/* Opponent Card */}
                <div className="md:col-span-5 p-5 rounded-2xl border border-[#FF2E93]/35 bg-black/55 text-center space-y-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF73B5] font-bold">
                    СОПЕРНИК · {battleOpponent}
                  </span>
                  {battleResult?.botRoll ? (
                    <div className="space-y-2">
                      <img
                        src={battleResult.botRoll.image_url || "/drop/items/common-chip.svg"}
                        alt={battleResult.botRoll.name}
                        className="w-28 h-28 mx-auto object-contain"
                      />
                      <div className="font-display font-black text-base text-white uppercase">
                        {battleResult.botRoll.name}
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FF2E93]/20 border border-[#FF2E93]/40 font-mono text-[10px] uppercase text-[#FF73B5] font-bold">
                        {String(battleResult.botRoll.rarity).toUpperCase()} · №{battleResult.botRoll.serial}
                      </span>
                    </div>
                  ) : (
                    <div className="py-8 font-mono text-xs text-white/45">
                      {isBattling ? "СИНХРОННЫЙ ПРОТОКОЛ..." : "ОЖИДАЕТ ВЫЗОВА"}
                    </div>
                  )}
                </div>
              </div>

              {battleResult && (
                <div
                  className={`p-4 rounded-2xl border text-center font-mono text-xs font-bold ${
                    battleResult.won
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                      : "border-[#B46BFF]/45 bg-[#8737FF]/15 text-[#E9D5FF]"
                  }`}
                >
                  {battleResult.won
                    ? `🏆 ВЫ ПОБЕДИЛИ И ЗАБРАЛИ ОБА АРТЕФАКТА В СВОЙ ИНВЕНТАРЬ!`
                    : `⚡ Соперник выбил старший ранг. Вам возвращён кэшбэк +${battleResult.cashbackCxp || 20} CXP!`}
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleRunCaseBattle}
                  disabled={isBattling}
                  className="btn-energy px-10 py-4 rounded-full font-display font-black text-sm uppercase tracking-wider text-white shadow-[0_0_35px_rgba(135,55,255,0.6)] cursor-pointer disabled:opacity-50"
                >
                  {isBattling
                    ? "⚔️ ИДЁТ ДУЭЛЬ КАПСУЛ..."
                    : `⚔️ НАЧАТЬ ДУЭЛЬ 1v1 ЗА ${selectedCase.price_cxp} CXP`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB: COLLECTORS HALL OF FAME (LEADERBOARD)
            =================================================================== */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl border border-[#00F0FF]/35 bg-gradient-to-b from-[#0A111D]/95 via-[#07050F]/95 to-[#050409] shadow-[0_24px_80px_rgba(0,0,0,0.85)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00F0FF]">
                    <span>🏆 COLLECTORS HALL OF FAME // TOP HUNTERS</span>
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-white">
                    ЗАЛ СЛАВЫ <span className="text-chrome-gradient">CXRNER DROP</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#D9D9E2]/70 max-w-2xl">
                    Рейтинг главных охотников за редкими цифровыми образцами архива. Нажмите «3D Осмотр», чтобы изучить лучший трофей любого резидента.
                  </p>
                </div>

                {giftShareUrl && (
                  <div className="p-3 rounded-2xl bg-[#8737FF]/20 border border-[#B46BFF]/50 font-mono text-[11px] text-white flex items-center gap-2">
                    <span className="truncate max-w-xs">🎁 {giftShareUrl}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {leaderboard.map((hunter, idx) => {
                  const rank = hunter.rank || idx + 1;
                  return (
                    <div
                      key={hunter.userId || idx}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition ${
                        rank === 1
                          ? "border-[#F59E0B]/50 bg-gradient-to-r from-[#F59E0B]/15 via-white/[0.03] to-transparent"
                          : rank === 2
                          ? "border-[#00F0FF]/40 bg-gradient-to-r from-[#00F0FF]/10 via-white/[0.02] to-transparent"
                          : rank === 3
                          ? "border-[#B46BFF]/40 bg-gradient-to-r from-[#8737FF]/12 via-white/[0.02] to-transparent"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl font-mono text-sm font-black flex items-center justify-center shrink-0 border ${
                            rank === 1
                              ? "bg-[#F59E0B]/25 border-[#F59E0B]/60 text-[#FBBF24]"
                              : rank === 2
                              ? "bg-[#00F0FF]/20 border-[#00F0FF]/50 text-[#00F0FF]"
                              : rank === 3
                              ? "bg-[#8737FF]/25 border-[#B46BFF]/50 text-[#E9D5FF]"
                              : "bg-black/50 border-white/10 text-white/60"
                          }`}
                        >
                          #{String(rank).padStart(2, "0")}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${hunter.username}`}
                              className="font-display font-black text-base text-white hover:text-[#00F0FF] uppercase truncate transition"
                            >
                              {hunter.displayName}
                            </Link>
                            {hunter.isVerified && (
                              <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 font-mono text-[9px] text-[#00F0FF] font-bold">
                                VERIFIED
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-white/55">
                            @{hunter.username} · {hunter.totalArtifacts} образцов ·{" "}
                            <span className="text-[#00F0FF] font-bold">
                              {hunter.collectorScore} PTS
                            </span>
                          </div>
                        </div>
                      </div>

                      {hunter.topArtifact && (
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                          <div className="text-left sm:text-right">
                            <div className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                              ГЛАВНЫЙ ТРОФЕЙ:
                            </div>
                            <div className="font-display font-bold text-xs text-[#E9D5FF] uppercase">
                              {hunter.topArtifact.name}{" "}
                              <span className="font-mono text-[10px] text-[#00F0FF]">
                                ({hunter.topArtifact.specimen_code})
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const spec =
                                DROP_SPECIMENS.find(
                                  (s) =>
                                    s.item_id === hunter.topArtifact.item_id ||
                                    s.specimen_code === hunter.topArtifact.specimen_code
                                ) || DROP_SPECIMENS[0];
                              handleInspectSpecimen(spec);
                            }}
                            className="px-3.5 py-2 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] shrink-0 cursor-pointer transition"
                          >
                            🧊 3D Осмотр
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
        onSalvageItem={handleSalvageItem}
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
        onSalvage={handleSalvageItem}
      />

      <OnboardingTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
      />
    </div>
  );
}
