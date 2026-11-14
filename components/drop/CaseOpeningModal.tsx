"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Boxes,
  ArrowRight,
  ShieldAlert,
  Award,
  RotateCw,
  ExternalLink,
  Check,
  Eye,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { DropCaseConfig, DropInventoryItem, ItemRarity } from "@/lib/ecosystemTypes";
import { RARITY_THEMES } from "./SpecimenVisual";
import SpecimenVisual from "./SpecimenVisual";
import CollectionItem3DViewer from "@/components/3d/CollectionItem3DViewer";
import {
  playZipTearSound,
  playChargeUpSound,
  playRevealSound,
  playClickSound,
} from "@/lib/soundFX";

interface CaseOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseConfig: DropCaseConfig;
  userBalance: number;
  onSuccess: (data: {
    item: DropInventoryItem;
    balanceAfter: number;
    claimCode?: string;
    isSpecialReward?: boolean;
  }) => void;
  onInspectItem?: (item: DropInventoryItem) => void;
}

export default function CaseOpeningModal({
  isOpen,
  onClose,
  caseConfig,
  userBalance,
  onSuccess,
  onInspectItem,
}: CaseOpeningModalProps) {
  // Stages: "confirm" | "opening" | "revealed"
  const [stage, setStage] = useState<"confirm" | "opening" | "revealed">("confirm");
  const [openingProgress, setOpeningProgress] = useState(0); // 0 to 100
  const [openedItem, setOpenedItem] = useState<DropInventoryItem | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [isSpecial, setIsSpecial] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [view3D, setView3D] = useState(false);
  const [flashBurst, setFlashBurst] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStage("confirm");
      setOpeningProgress(0);
      setOpenedItem(null);
      setClaimCode(null);
      setIsSpecial(false);
      setErrorMessage(null);
      setCopiedCode(false);
      setView3D(false);
      setFlashBurst(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, caseConfig]);

  if (!isOpen) return null;

  const handleStartOpening = async () => {
    if (userBalance < caseConfig.price_cxp) {
      setErrorMessage(
        `Недостаточно CXP. Требуется: ${caseConfig.price_cxp} CXP. Баланс: ${userBalance} CXP.`
      );
      return;
    }

    setStage("opening");
    setOpeningProgress(0);
    setErrorMessage(null);

    // Audio SFX sequence
    playZipTearSound();
    playChargeUpSound();

    // Start 4.5s animation progress timer
    const startTime = Date.now();
    const duration = 4600;

    let serverResult: any = null;
    let apiError: string | null = null;

    // Fire API call concurrently
    const apiPromise = fetch("/api/cabinet/drop/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseConfig.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          serverResult = data;
        } else {
          apiError = data.error || "Ошибка открытия кейса";
        }
      })
      .catch((err) => {
        apiError = err.message || "Ошибка сети";
      });

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setOpeningProgress(progress);

      if (elapsed >= duration) {
        clearInterval(interval);
        await apiPromise;

        if (apiError || !serverResult) {
          setErrorMessage(apiError || "Не удалось завершить открытие кейса");
          setStage("confirm");
          return;
        }

        // Commit server result
        setOpenedItem(serverResult.item);
        setIsSpecial(Boolean(serverResult.isSpecialReward));
        if (serverResult.claimCode) {
          setClaimCode(serverResult.claimCode);
        }

        // Trigger brief cinematic flash burst
        setFlashBurst(true);
        setTimeout(() => setFlashBurst(false), 380);

        setStage("revealed");

        // Audio reveal fanfare
        playRevealSound(serverResult.item.rarity);

        // Tier-Specific Confetti Celebration
        const rarity = serverResult.item.rarity;
        const rarityColors: Record<string, string[]> = {
          special_reward: ["#F59E0B", "#FCD34D", "#FFFFFF", "#8737FF", "#00F0FF"],
          mythic: ["#F43F5E", "#FB7185", "#8737FF", "#FFFFFF", "#05030A"],
          legendary: ["#F59E0B", "#FCD34D", "#FFFFFF", "#FFB703"],
          epic: ["#A855F7", "#C084FC", "#00F0FF", "#FFFFFF"],
          rare: ["#00F0FF", "#38BDF8", "#FFFFFF", "#818CF8"],
          common: ["#94A3B8", "#CBD5E1", "#FFFFFF"],
        };
        const colors = rarityColors[rarity] || ["#8737FF", "#00F0FF", "#FFFFFF"];
        const particleCount = serverResult.isSpecialReward
          ? 160
          : rarity === "mythic"
          ? 130
          : rarity === "legendary"
          ? 110
          : 80;

        try {
          confetti({
            particleCount,
            spread: 90,
            origin: { y: 0.5 },
            colors,
          });

          // Secondary dual-side salvo for high tier drops
          if (["special_reward", "mythic", "legendary"].includes(rarity)) {
            setTimeout(() => {
              confetti({
                particleCount: 75,
                angle: 60,
                spread: 65,
                origin: { x: 0.08, y: 0.62 },
                colors,
              });
              confetti({
                particleCount: 75,
                angle: 120,
                spread: 65,
                origin: { x: 0.92, y: 0.62 },
                colors,
              });
            }, 260);
          }
        } catch {}

        onSuccess({
          item: serverResult.item,
          balanceAfter: serverResult.balanceAfter,
          claimCode: serverResult.claimCode,
          isSpecialReward: serverResult.isSpecialReward,
        });
      }
    }, 50);

    timerRef.current = interval;
  };

  const handleCopyCode = () => {
    if (claimCode) {
      navigator.clipboard.writeText(claimCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#B46BFF]/45 bg-[#090611] shadow-[0_0_80px_rgba(135,55,255,0.35)] overflow-hidden">
        {/* Blinding Reveal Flash Burst Overlay */}
        {flashBurst && (
          <div className="absolute inset-0 z-40 bg-white pointer-events-none transition-opacity duration-300 animate-pulse" />
        )}

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-[#8737FF]/35 to-transparent blur-3xl pointer-events-none" />

        {/* Modal Close Button (available in confirm and revealed stages) */}
        {stage !== "opening" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ===================================================================
            STAGE 1: CONFIRMATION DIALOG (PRE-OPEN)
            =================================================================== */}
        {stage === "confirm" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]">
                <Boxes className="w-3.5 h-3.5 text-[#B46BFF]" />
                <span>CONFIRM CASE UNSEAL</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                {caseConfig.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#D9D9E2]/75 max-w-md mx-auto">
                {caseConfig.description}
              </p>
            </div>

            {/* Case Pouch Preview Visual */}
            <div className="relative w-36 h-48 mx-auto rounded-2xl overflow-hidden border border-[#B46BFF]/30 bg-black/50 p-2 flex items-center justify-center shadow-xl">
              <img
                src={caseConfig.cover_url}
                alt={caseConfig.name}
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Transaction Breakdown */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-[#D9D9E2]/70">
                <span>Стоимость открытия:</span>
                <span className="font-display font-black text-white text-sm">
                  {caseConfig.price_cxp} CXP
                </span>
              </div>
              <div className="flex justify-between items-center text-[#D9D9E2]/70">
                <span>Ваш баланс:</span>
                <span
                  className={`font-display font-black text-sm ${
                    userBalance >= caseConfig.price_cxp ? "text-[#00F0FF]" : "text-rose-400"
                  }`}
                >
                  {userBalance} CXP
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[#D9D9E2]/50 text-[10px]">
                <span>Гарантия безопасности:</span>
                <span className="text-emerald-400">100% Cryptographic Roll</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-sans">
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] transition"
              >
                Отмена
              </button>
              <button
                onClick={handleStartOpening}
                disabled={userBalance < caseConfig.price_cxp}
                className="btn-energy px-5 py-3 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_25px_rgba(135,55,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                OPEN CASE ({caseConfig.price_cxp} CXP)
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STAGE 2: PHYSICAL CASE OPENING ANIMATION (4.6 SECONDS)
            =================================================================== */}
        {stage === "opening" && (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF] animate-pulse">
                // UNSEALING SPECIMEN POUCH //
              </span>
              <h3 className="font-display font-black text-xl uppercase tracking-tight text-white">
                {openingProgress < 30
                  ? "Инициализация капсулы..."
                  : openingProgress < 65
                  ? "Разрыв лазерного шва..."
                  : openingProgress < 90
                  ? "Снятие криптографической защиты..."
                  : "Декодирование артефакта!"}
              </h3>
            </div>

            {/* Visual Zipper Tear Centerpiece with container vibration */}
            <div
              className={`relative w-44 h-60 mx-auto flex items-center justify-center transition-transform ${
                openingProgress > 30 ? "animate-drop-shake" : ""
              }`}
            >
              {/* Expanding Volumetric Light Glow */}
              <div
                className="absolute inset-0 rounded-full blur-3xl transition-all duration-300 pointer-events-none"
                style={{
                  background:
                    openingProgress > 70
                      ? "radial-gradient(circle, rgba(0,240,255,0.85), rgba(135,55,255,0.7), transparent)"
                      : "radial-gradient(circle, rgba(135,55,255,0.55), transparent)",
                  transform: `scale(${1 + openingProgress / 70})`,
                  opacity: 0.45 + openingProgress / 140,
                }}
              />

              {/* Case Visual with Rip Effect */}
              <div
                className="relative z-10 w-full h-full transition-transform duration-300"
                style={{
                  transform: `scale(${1 + Math.sin(openingProgress / 8) * 0.06})`,
                }}
              >
                <img
                  src={caseConfig.cover_url}
                  alt="Opening Case"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(135,55,255,0.7)]"
                />

                {/* Laser Zipper Rip Line with spark ping */}
                {openingProgress > 20 && openingProgress < 90 && (
                  <div
                    className="absolute top-[28%] left-0 h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-white shadow-[0_0_20px_#00F0FF]"
                    style={{
                      width: `${Math.min(100, (openingProgress - 20) * 1.5)}%`,
                    }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_15px_#FFF] animate-ping" />
                  </div>
                )}
              </div>
            </div>

            {/* High-Tech Diagnostic Hacker Readout */}
            <div className="h-6 flex items-center justify-center font-mono text-[10px] text-[#00F0FF] tracking-wider uppercase">
              {openingProgress < 25 && "// INITIALIZING DECOMPRESSION CHAMBER //"}
              {openingProgress >= 25 && openingProgress < 50 && "// CUTTING LASER SEAL • VACUUM RELEASE //"}
              {openingProgress >= 50 && openingProgress < 75 && "// ANALYZING SPECIMEN FREQUENCY //"}
              {openingProgress >= 75 && openingProgress < 95 && "// DECRYPTING CRYPTO SIGNATURE... //"}
              {openingProgress >= 95 && "// EXTRACTION READY • REVEALING! //"}
            </div>

            {/* Cinematic Progress Bar */}
            <div className="max-w-xs mx-auto space-y-2">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8737FF] via-[#00F0FF] to-white rounded-full transition-all duration-100 shadow-[0_0_10px_#00F0FF]"
                  style={{ width: `${openingProgress}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-[#D9D9E2]/50 tracking-widest">
                {openingProgress}% COMPLETED
              </span>
            </div>
          </div>
        )}

        {/* ===================================================================
            STAGE 3: ITEM REVEAL WINDOW (CINEMATIC WOW REVEAL)
            =================================================================== */}
        {stage === "revealed" && openedItem && (
          <div className="relative p-6 sm:p-8 space-y-6">
            {/* Rotating Sunburst Background Lightbeams */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-35">
              <div
                className="w-[600px] h-[600px] rounded-full animate-drop-sunburst"
                style={{
                  background: `conic-gradient(from 0deg at 50% 50%, rgba(135,55,255,0.3) 0deg 15deg, transparent 15deg 30deg, rgba(0,240,255,0.25) 30deg 45deg, transparent 45deg 60deg, rgba(135,55,255,0.3) 60deg 75deg, transparent 75deg 90deg, rgba(0,240,255,0.25) 90deg 105deg, transparent 105deg 120deg, rgba(135,55,255,0.3) 120deg 135deg, transparent 135deg 150deg, rgba(0,240,255,0.25) 150deg 165deg, transparent 165deg 180deg, rgba(135,55,255,0.3) 180deg 195deg, transparent 195deg 210deg, rgba(0,240,255,0.25) 210deg 225deg, transparent 225deg 240deg, rgba(135,55,255,0.3) 240deg 255deg, transparent 255deg 270deg, rgba(0,240,255,0.25) 270deg 285deg, transparent 285deg 300deg, rgba(135,55,255,0.3) 300deg 315deg, transparent 315deg 330deg, rgba(0,240,255,0.25) 330deg 345deg, transparent 345deg 360deg)`,
                }}
              />
            </div>

            {/* Header Notification */}
            <div className="relative z-10 text-center space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#00F0FF]">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>NEW SPECIMEN DISCOVERED</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                {openedItem.item_name}
              </h2>
              <p className="font-mono text-xs text-[#D9D9E2]/70 uppercase tracking-widest">
                COLLECTION: {openedItem.collection_name} • №
                {String(openedItem.serial_number).padStart(6, "0")}
              </p>
            </div>

            {/* 2D / 3D Toggle */}
            <div className="relative z-10 flex justify-center gap-2">
              <button
                onClick={() => setView3D(false)}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition ${
                  !view3D
                    ? "bg-white text-black font-bold shadow-md"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                2D POUCH
              </button>
              <button
                onClick={() => setView3D(true)}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition ${
                  view3D
                    ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                3D MESH
              </button>
            </div>

            {/* Specimen Visual Presentation with Bouncy Card Pop Animation */}
            <div className="relative z-10 max-w-[280px] mx-auto animate-drop-card-pop">
              {view3D ? (
                <div className="w-full h-64 rounded-2xl bg-black/60 border border-white/10 p-2">
                  <CollectionItem3DViewer
                    itemName={openedItem.item_name}
                    rarity={openedItem.rarity as any}
                    modelColor={openedItem.model_color}
                    serialNumber={openedItem.serial_number}
                  />
                </div>
              ) : (
                <SpecimenVisual
                  itemId={openedItem.item_id}
                  itemName={openedItem.item_name}
                  rarity={openedItem.rarity}
                  imageUrl={openedItem.image_url}
                  serialNumber={openedItem.serial_number}
                  collectionName={openedItem.collection_name}
                  isSpecialReward={isSpecial}
                />
              )}
            </div>

            {/* Description */}
            <p className="relative z-10 text-xs sm:text-sm text-[#D9D9E2]/85 text-center max-w-md mx-auto leading-relaxed font-sans">
              {openedItem.description}
            </p>

            {/* Special Voucher Claim Notice */}
            {isSpecial && claimCode && (
              <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-900/30 to-amber-500/20 border border-amber-500/50 space-y-3 text-center shadow-xl">
                <div className="flex items-center justify-center gap-2 font-display font-black text-xs text-amber-300 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>ВЫ ВЫИГРАЛИ БЕСПЛАТНУЮ ОБЛОЖКУ РЕЛИЗА!</span>
                </div>
                <p className="text-xs text-[#D9D9E2]/90 leading-relaxed font-sans">
                  Напишите лично дизайнеру в Telegram:{" "}
                  <a
                    href="https://t.me/kazumaiq"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-300 font-bold underline"
                  >
                    @kazumaiq
                  </a>
                  . Отправьте свой никнейм и код выигрыша для согласования дизайна.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-lg bg-black/60 border border-amber-500/60 font-mono text-xs font-bold text-amber-300">
                    {claimCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-mono text-xs uppercase flex items-center gap-1 transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{copiedCode ? "Скопировано" : "Копировать код"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={onClose}
                className="btn-energy px-4 py-3 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_20px_rgba(135,55,255,0.4)]"
              >
                В инвентарь
              </button>
              {onInspectItem && (
                <button
                  onClick={() => {
                    onClose();
                    onInspectItem(openedItem);
                  }}
                  className="px-4 py-3 rounded-full border border-white/20 bg-white/[0.05] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>3D Осмотр</span>
                </button>
              )}
              <button
                onClick={() => setStage("confirm")}
                className="px-4 py-3 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 hover:bg-[#8737FF]/25 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] flex items-center justify-center gap-1.5 transition"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#B46BFF]" />
                <span>Открыть ещё</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
