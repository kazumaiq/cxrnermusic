"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import {
  X,
  Sparkles,
  Award,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Box,
  RotateCcw,
} from "lucide-react";
import type { DropCaseConfig, DropInventoryItem, DropRarity } from "@/lib/ecosystemTypes";
import SpecimenVisual from "./SpecimenVisual";
import {
  playChargeUpSound,
  playScannerTickSound,
  playZipTearSound,
  playRevealSound,
  playClickSound,
  stopOpeningAudio,
} from "@/lib/soundFX";
import type { ZipStagePhase } from "./ZipPacket3DViewer";

const ZipPacket3DViewer = dynamic(() => import("./ZipPacket3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] sm:h-[360px] w-full flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/10">
      <Loader2 className="w-6 h-6 animate-spin text-[#B46BFF]" />
    </div>
  ),
});

const Artifact3DInspector = dynamic(() => import("./Artifact3DInspector"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] sm:h-[360px] w-full flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/10">
      <Loader2 className="w-6 h-6 animate-spin text-[#00F0FF]" />
    </div>
  ),
});

interface CaseOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseConfig: DropCaseConfig;
  userBalance: number;
  onSuccess: (
    item: DropInventoryItem,
    newBalance: number,
    claimCode?: string,
    isSpecial?: boolean
  ) => void;
  onInspectItem?: (item: DropInventoryItem) => void;
  onSalvageItem?: (item: DropInventoryItem) => Promise<void> | void;
}

const SALVAGE_REWARD_MAP: Record<DropRarity, number> = {
  common: 15,
  rare: 30,
  epic: 55,
  legendary: 120,
  mythic: 250,
  special_reward: 500,
};

interface RarityDirection {
  label: string;
  tagline: string;
  color: string;
  burstColors: string[];
  screenShake: boolean;
  glitch: boolean;
}

const RARITY_DIRECTION: Record<DropRarity, RarityDirection> = {
  common: {
    label: "COMMON SPECIMEN",
    tagline: "СТАНДАРТНЫЙ ОБРАЗЕЦ АРХИВА",
    color: "#A1A1AA",
    burstColors: ["#E4E4E7", "#A1A1AA", "#52525B"],
    screenShake: false,
    glitch: false,
  },
  rare: {
    label: "RARE // CYAN TIER",
    tagline: "РЕДКИЙ ЦИФРОВОЙ АРТЕФАКТ",
    color: "#00F0FF",
    burstColors: ["#00F0FF", "#38BDF8", "#FFFFFF"],
    screenShake: false,
    glitch: false,
  },
  epic: {
    label: "EPIC // ULTRAVIOLET",
    tagline: "ЭПИЧЕСКАЯ РЕЛИКВИЯ ЛЕЙБЛА",
    color: "#B46BFF",
    burstColors: ["#B46BFF", "#8737FF", "#E879F9"],
    screenShake: true,
    glitch: false,
  },
  legendary: {
    label: "LEGENDARY // SOLAR FLARE",
    tagline: "ЛЕГЕНДАРНЫЙ ОБРАЗЕЦ ХРАНИЛИЩА",
    color: "#F59E0B",
    burstColors: ["#F59E0B", "#FBBF24", "#FFFFFF"],
    screenShake: true,
    glitch: false,
  },
  mythic: {
    label: "MYTHIC // BREACH DETECTED",
    tagline: "МИФИЧЕСКАЯ АНОМАЛИЯ ARCHIVE",
    color: "#F43F5E",
    burstColors: ["#F43F5E", "#FB7185", "#00F0FF", "#FFFFFF"],
    screenShake: true,
    glitch: true,
  },
  special_reward: {
    label: "SPECIAL PRIZE // 0.1% VOUCHER",
    tagline: "ЭКСКЛЮЗИВНЫЙ ВАУЧЕР НА ОБЛОЖКУ",
    color: "#FACC15",
    burstColors: ["#FACC15", "#FEF08A", "#F59E0B", "#FFFFFF"],
    screenShake: true,
    glitch: true,
  },
};

const SEQUENCE_STEPS = [
  "01 // ПРОВЕРКА ПЕЧАТИ КЕЙСА",
  "02 // СКАНИРОВАНИЕ СЕРИЙНОГО КОДА",
  "03 // НАГНЕТАНИЕ ЭНЕРГИИ КАМЕРЫ",
  "04 // ВСКРЫТИЕ ВАКУУМНОЙ ПЛОМБЫ",
  "05 // РАЗРЫВ ZIP-МОЛНИИ",
  "06 // ИДЕНТИФИКАЦИЯ РЕДКОСТИ",
  "07 // ИЗВЛЕЧЕНИЕ АРТЕФАКТА",
];

export default function CaseOpeningModal({
  isOpen,
  onClose,
  caseConfig,
  userBalance,
  onSuccess,
  onInspectItem,
  onSalvageItem,
}: CaseOpeningModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"confirm" | "opening" | "revealed">("confirm");
  const [zipPhase, setZipPhase] = useState<ZipStagePhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [wonItem, setWonItem] = useState<DropInventoryItem | null>(null);
  const [claimCode, setClaimCode] = useState<string | undefined>();
  const [isSpecial, setIsSpecial] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "3d">("card");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSalvaging, setIsSalvaging] = useState(false);

  const timersRef = useRef<number[]>([]);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    setMounted(true);
    return () => clearAllTimers();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (stage === "revealed" && backdropRef.current) {
      backdropRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stage]);

  useEffect(() => {
    if (isOpen) {
      clearAllTimers();
      stopOpeningAudio();
      setStage("confirm");
      setZipPhase("idle");
      setStepIndex(0);
      setProgress(0);
      setError("");
      setWonItem(null);
      setClaimCode(undefined);
      setIsSpecial(false);
      setViewMode("card");
    } else {
      stopOpeningAudio();
    }
    return () => {
      stopOpeningAudio();
    };
  }, [isOpen, caseConfig.id]);

  if (!isOpen || !mounted) return null;

  const caseAccent =
    caseConfig.id === "case_002_black_specimen"
      ? "#A855F7"
      : caseConfig.id === "case_003_chrome_age"
      ? "#00F0FF"
      : "#8737FF";

  const canAfford = userBalance >= caseConfig.price_cxp;

  const fireRarityCelebration = (rarity: DropRarity) => {
    const dir = RARITY_DIRECTION[rarity] || RARITY_DIRECTION.common;
    if (rarity === "common") return;

    try {
      confetti({
        particleCount: rarity === "special_reward" || rarity === "mythic" ? 130 : 75,
        spread: rarity === "special_reward" ? 95 : 68,
        origin: { y: 0.56 },
        colors: dir.burstColors,
      });

      if (rarity === "legendary" || rarity === "mythic" || rarity === "special_reward") {
        window.setTimeout(() => {
          confetti({
            particleCount: 65,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.65 },
            colors: dir.burstColors,
          });
          confetti({
            particleCount: 65,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.65 },
            colors: dir.burstColors,
          });
        }, 280);
      }
    } catch {
      // Safe fallback if canvas confetti unavailable
    }
  };

  const startOpening = async () => {
    if (!canAfford) {
      setError(`Недостаточно CXP. Необходимо ${caseConfig.price_cxp} CXP.`);
      return;
    }

    clearAllTimers();
    stopOpeningAudio();
    setError("");
    setStage("opening");
    setZipPhase("charging");
    setStepIndex(0);
    setProgress(10);
    playChargeUpSound(2.15);

    // Concurrent API call determining authoritative drop server-side
    const apiPromise = fetch("/api/cabinet/drop/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseConfig.id }),
    }).then(async (res) => {
      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`Ошибка ответа сервера (${res.status}). Попробуй ещё раз.`);
      }
      if (!res.ok || !json?.ok || !json?.item) {
        throw new Error(json?.error || `Ошибка открытия кейса (${res.status})`);
      }
      return json;
    });

    const triggerHaptic = (pattern: number | number[]) => {
      try {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(pattern);
        }
      } catch {}
    };

    // Multi-beat choreographed timeline tight-synced with physical 3D zipper + foley sound (fast 1.72s total!)
    const beats: Array<{ ms: number; fn: () => void }> = [
      {
        ms: 220,
        fn: () => {
          setStepIndex(1);
          setProgress(28);
          playScannerTickSound(1);
        },
      },
      {
        ms: 480,
        fn: () => {
          setStepIndex(2);
          setProgress(48);
          playScannerTickSound(2);
        },
      },
      {
        ms: 760,
        fn: () => {
          setStepIndex(3);
          setProgress(66);
          playScannerTickSound(3);
        },
      },
      {
        ms: 1050,
        fn: () => {
          setStepIndex(4);
          setProgress(84);
          setZipPhase("ripping");
          playZipTearSound();
          triggerHaptic([18, 35, 22]);
        },
      },
      {
        ms: 1380,
        fn: () => {
          setStepIndex(5);
          setProgress(96);
          setZipPhase("bloom");
          triggerHaptic(32);
        },
      },
    ];

    beats.forEach((b) => {
      timersRef.current.push(window.setTimeout(b.fn, b.ms));
    });

    try {
      const [result] = await Promise.all([
        apiPromise,
        new Promise((r) => {
          timersRef.current.push(window.setTimeout(r, 1720));
        }),
      ]);

      const item = result.item as DropInventoryItem;
      const balanceAfter = Number(result.balanceAfter ?? userBalance - caseConfig.price_cxp);
      const itemRarity: DropRarity = result.isSpecialReward ? "special_reward" : item.rarity;

      setWonItem(item);
      setClaimCode(result.claimCode);
      setIsSpecial(Boolean(result.isSpecialReward));
      setStepIndex(6);
      setProgress(100);
      setZipPhase("revealed");
      setStage("revealed");

      playRevealSound(itemRarity);
      triggerHaptic(itemRarity === "common" ? 25 : [35, 28, 70]);
      fireRarityCelebration(itemRarity);
      onSuccess(item, balanceAfter, result.claimCode, Boolean(result.isSpecialReward));
    } catch (err: any) {
      clearAllTimers();
      stopOpeningAudio();
      setStage("confirm");
      setZipPhase("idle");
      const rawMsg = String(err?.message || "");
      const friendly =
        rawMsg === "Load failed" || rawMsg === "Failed to fetch"
          ? "Сеть прервала соединение. Повтори открытие — проверь баланс или обнови страницу."
          : rawMsg || "Сбой синхронизации открытия кейса";
      setError(friendly);
    }
  };

  const activeDir = wonItem
    ? RARITY_DIRECTION[isSpecial ? "special_reward" : wonItem.rarity] || RARITY_DIRECTION.common
    : RARITY_DIRECTION.common;

  const modalBody = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9998] overflow-y-auto overscroll-contain bg-[#030206]/92 backdrop-blur-2xl"
      style={{ WebkitOverflowScrolling: "touch" }}
      onClick={() => {
        if (stage !== "opening") {
          playClickSound();
          onClose();
        }
      }}
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start px-3 pt-4 pb-28 sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative my-auto w-full max-w-xl sm:max-w-2xl rounded-3xl border bg-gradient-to-b from-[#0E0B18] via-[#07050C] to-[#040307] shadow-[0_30px_100px_rgba(0,0,0,0.92)] ${
            stage === "revealed" && activeDir.screenShake ? "animate-[dropShakeIntense_0.45s_ease-out]" : ""
          }`}
          style={{
            borderColor:
              stage === "revealed" ? `${activeDir.color}77` : "rgba(255,255,255,0.14)",
          }}
        >
          {/* Sticky Top Precision Metallic Header Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-7 py-3.5 rounded-t-3xl border-b border-white/10 bg-[#0D0A16]/95 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{
                  backgroundColor: stage === "revealed" ? activeDir.color : caseAccent,
                }}
              />
              <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/85 truncate">
                {stage === "confirm"
                  ? `CHAMBER // ${caseConfig.name}`
                  : stage === "opening"
                  ? "UNSEALING PROTOCOL ACTIVE"
                  : activeDir.label}
              </span>
            </div>

            {stage !== "opening" && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-2 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/15 text-white transition shrink-0"
                aria-label="Закрыть окно"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* STAGE 1 & 2: CONFIRM OR LIVE 3D UNSEALING SEQUENCE */}
          {stage !== "revealed" && (
            <div className="p-4 sm:p-7 space-y-5">
              {/* Live Unified 3D Specimen Pouch Stage */}
              <div className="relative rounded-2xl border border-white/12 bg-[#040308] overflow-hidden">
                <ZipPacket3DViewer
                  caseId={caseConfig.id}
                  themeColor={zipPhase === "bloom" ? "#FFFFFF" : caseAccent}
                  stagePhase={zipPhase}
                  labelCode={caseConfig.subtitle}
                  specimenName={caseConfig.name}
                  heightClass="h-[245px] sm:h-[310px]"
                />

              {/* Laser Scan + Physical Zip-Seam Tear + Cryo Decompression Flash Overlays */}
              {stage === "opening" && (
                <>
                  {/* Corner targeting brackets */}
                  <div className="pointer-events-none absolute inset-3 z-20">
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00F0FF]/70 rounded-tl" />
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00F0FF]/70 rounded-tr" />
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00F0FF]/70 rounded-bl" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00F0FF]/70 rounded-br" />
                  </div>

                  {zipPhase === "charging" && (
                    <div className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_16px_#00F0FF] animate-laser-sweep z-20" />
                  )}

                  {zipPhase === "ripping" && (
                    <>
                      <div
                        className="pointer-events-none absolute left-[12%] right-[12%] top-[23%] h-[3px] origin-right rounded-full z-30 animate-[dropZipSlice_0.68s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                        style={{
                          background: `linear-gradient(90deg, #FFFFFF, ${caseAccent}, #00F0FF)`,
                          boxShadow: `0 0 24px ${caseAccent}, 0 0 10px #FFFFFF`,
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                        <div className="w-28 h-28 rounded-full border-2 border-[#00F0FF] animate-shockwave-ring" />
                      </div>
                    </>
                  )}

                  {zipPhase === "bloom" && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0 z-30 rounded-2xl animate-[dropFlashBurst_0.7s_ease-out_forwards]"
                        style={{
                          background: `radial-gradient(circle at 50% 35%, rgba(255,255,255,0.95) 0%, ${caseAccent}88 45%, transparent 80%)`,
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                        <div className="w-36 h-36 rounded-full border border-white/80 animate-shockwave-ring" />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {stage === "opening" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#00F0FF] font-bold tracking-wider">
                    {SEQUENCE_STEPS[stepIndex]}
                  </span>
                  <span className="text-white/70 tabular-nums">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8737FF] via-[#B46BFF] to-[#00F0FF] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 font-mono text-xs">
                  <div>
                    <span className="text-white/45 block text-[10px]">СТОИМОСТЬ ВСКРЫТИЯ</span>
                    <span className="font-display font-black text-xl text-white">
                      {caseConfig.price_cxp} CXP
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/45 block text-[10px]">ДОСТУПНЫЙ БАЛАНС</span>
                    <span
                      className={`font-display font-black text-xl ${
                        canAfford ? "text-[#00F0FF]" : "text-rose-400"
                      }`}
                    >
                      {userBalance} CXP
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={startOpening}
                  disabled={!canAfford}
                  className="w-full btn-energy py-4 rounded-full font-display text-xs sm:text-sm uppercase font-black tracking-wider text-white disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                  <span>
                    {canAfford
                      ? `ВСКРЫТЬ ОБРАЗЕЦ ЗА ${caseConfig.price_cxp} CXP`
                      : `НЕ ХВАТАЕТ ${caseConfig.price_cxp - userBalance} CXP`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 3: DISTINCT PER-RARITY REVEAL SHOWCASE */}
        {stage === "revealed" && wonItem && (
          <div className="p-4 sm:p-7 space-y-4 sm:space-y-5 relative overflow-x-clip">
            <div
              className="pointer-events-none absolute inset-0 opacity-20 rounded-b-3xl"
              style={{
                background: `radial-gradient(circle at 50% 25%, ${activeDir.color}, transparent 68%)`,
              }}
            />

            <div className="relative z-10 text-center space-y-1">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
                  activeDir.glitch ? "animate-glitch-slice" : ""
                }`}
                style={{
                  color: activeDir.color,
                  borderColor: `${activeDir.color}66`,
                  backgroundColor: `${activeDir.color}18`,
                }}
              >
                <span>{activeDir.tagline}</span>
              </div>

              <h2 className="font-display font-black text-xl sm:text-3xl uppercase tracking-tight text-white leading-tight pt-1">
                {wonItem.item_name}
              </h2>
              <p className="font-mono text-[11px] text-white/60">
                СЕРИЙНЫЙ №{String(wonItem.serial_number).padStart(6, "0")} ·{" "}
                {wonItem.collection_name || "CXRNER ARCHIVE"}
              </p>
            </div>

            {/* Dual Mode View Switcher: Museum Slab / Interactive 3D Pouch */}
            <div className="relative z-10 flex justify-center">
              <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/12 font-mono text-[10px] uppercase">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setViewMode("card");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    viewMode === "card"
                      ? "bg-white text-[#050407] font-bold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Экспонат</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setViewMode("3d");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    viewMode === "3d"
                      ? "bg-white text-[#050407] font-bold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>3D Осмотр</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 flex justify-center">
              {viewMode === "card" ? (
                <div className="relative flex items-center justify-center">
                  {/* Rotating Studio Sunburst Aura Behind Revealed Card */}
                  <div
                    className="pointer-events-none absolute -inset-12 opacity-30 animate-drop-sunburst"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0deg, ${activeDir.color}55 24deg, transparent 58deg, transparent 120deg, ${activeDir.color}44 148deg, transparent 180deg, transparent 240deg, ${activeDir.color}55 268deg, transparent 305deg)`,
                      maskImage: "radial-gradient(circle, black 35%, transparent 72%)",
                      WebkitMaskImage: "radial-gradient(circle, black 35%, transparent 72%)",
                    }}
                  />
                  <div className="relative w-44 sm:w-56 animate-[dropSpecimenEntrance_0.68s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <SpecimenVisual
                      itemId={wonItem.item_id}
                      itemName={wonItem.item_name}
                      rarity={isSpecial ? "special_reward" : wonItem.rarity}
                      imageUrl={wonItem.image_url}
                      serialNumber={wonItem.serial_number}
                      collectionName={wonItem.collection_name}
                      isSpecialReward={isSpecial}
                      interactiveTilt
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md">
                  <Artifact3DInspector
                    itemId={wonItem.item_id}
                    itemName={wonItem.item_name}
                    specimenCode={wonItem.specimen_code}
                    rarity={isSpecial ? "special_reward" : wonItem.rarity}
                    imageUrl={wonItem.image_url}
                    serialNumber={wonItem.serial_number}
                    collectionName={wonItem.collection_name}
                    themeColor={activeDir.color}
                    heightClass="h-[300px] sm:h-[360px]"
                  />
                </div>
              )}
            </div>

            {wonItem.description && (
              <p className="relative z-10 text-center text-xs text-[#D9D9E2]/70 max-w-md mx-auto leading-relaxed">
                {wonItem.description}
              </p>
            )}

            {/* Special Cover Voucher Code Banner */}
            {claimCode && (
              <div className="relative z-10 p-4 rounded-2xl bg-yellow-500/12 border border-yellow-400/50 space-y-2.5 text-center">
                <div className="inline-flex items-center gap-2 font-mono text-xs font-bold text-yellow-300 uppercase">
                  <Award className="w-4 h-4" />
                  <span>ОФИЦИАЛЬНЫЙ CLAIM-КОД ВАУЧЕРА</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-4 py-2 rounded-xl bg-black/70 border border-yellow-400/40 font-mono text-base font-black text-yellow-200 tracking-widest">
                    {claimCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(claimCode);
                      setCopiedCode(true);
                      window.setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-2.5 rounded-xl bg-yellow-400 text-[#050407] hover:brightness-110 transition"
                    title="Копировать код"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-yellow-100/80">
                  Передайте этот код основателю (@kazumaiq) или в поддержку кабинета для активации бесплатного дизайна обложки.
                </p>
              </div>
            )}

            {/* Post-Reveal Actions */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={startOpening}
                disabled={userBalance < caseConfig.price_cxp}
                className="btn-energy min-h-[44px] py-3 px-4 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ещё раз ({caseConfig.price_cxp})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (viewMode !== "3d") {
                    setViewMode("3d");
                  } else if (onInspectItem) {
                    onClose();
                    onInspectItem(wonItem);
                  } else {
                    setViewMode("card");
                  }
                }}
                className="btn-void-ghost min-h-[44px] py-3 px-4 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Box className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{viewMode === "3d" ? "Полный 3D стенд" : "3D Осмотр"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] py-3 px-4 rounded-full bg-white text-[#050407] hover:brightness-95 font-mono text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer"
              >
                Готово
              </button>
            </div>

            {onSalvageItem && !isSpecial && wonItem.id && (
              <div className="relative z-10 pt-1">
                <button
                  type="button"
                  disabled={isSalvaging}
                  onClick={async () => {
                    playClickSound();
                    setIsSalvaging(true);
                    try {
                      await onSalvageItem(wonItem);
                      onClose();
                    } finally {
                      setIsSalvaging(false);
                    }
                  }}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 font-mono text-[11px] font-bold uppercase tracking-wider text-[#00F0FF] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isSalvaging
                      ? "Распыление образца..."
                      : `⚡ Распылить в энергию (+${SALVAGE_REWARD_MAP[wonItem.rarity] || 15} CXP)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalBody, document.body);
}
