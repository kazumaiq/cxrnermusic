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

        setStage("revealed");

        // Audio reveal
        playRevealSound(serverResult.item.rarity);

        // Confetti celebration
        if (
          ["rare", "epic", "legendary", "mythic", "special_reward"].includes(
            serverResult.item.rarity
          )
        ) {
          try {
            confetti({
              particleCount: serverResult.isSpecialReward ? 140 : 80,
              spread: serverResult.isSpecialReward ? 100 : 70,
              origin: { y: 0.55 },
              colors: serverResult.isSpecialReward
                ? ["#F59E0B", "#FCD34D", "#FFFFFF", "#8737FF"]
                : undefined,
            });
          } catch {}
        }

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

            {/* Visual Zipper Tear Centerpiece */}
            <div className="relative w-44 h-60 mx-auto flex items-center justify-center">
              {/* Expanding Volumetric Light Glow */}
              <div
                className="absolute inset-0 rounded-full blur-2xl transition-all duration-300 pointer-events-none"
                style={{
                  background:
                    openingProgress > 70
                      ? "radial-gradient(circle, rgba(0,240,255,0.8), rgba(135,55,255,0.6), transparent)"
                      : "radial-gradient(circle, rgba(135,55,255,0.5), transparent)",
                  transform: `scale(${1 + openingProgress / 80})`,
                  opacity: 0.4 + openingProgress / 160,
                }}
              />

              {/* Case Visual with Rip Effect */}
              <div
                className="relative z-10 w-full h-full transition-transform duration-300"
                style={{
                  transform: `scale(${1 + Math.sin(openingProgress / 10) * 0.05})`,
                }}
              >
                <img
                  src={caseConfig.cover_url}
                  alt="Opening Case"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(135,55,255,0.6)]"
                />

                {/* Laser Zipper Rip Line */}
                {openingProgress > 25 && openingProgress < 85 && (
                  <div
                    className="absolute top-[28%] left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_15px_#00F0FF]"
                    style={{
                      width: `${Math.min(100, (openingProgress - 25) * 2)}%`,
                    }}
                  />
                )}
              </div>
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
            STAGE 3: ITEM REVEAL WINDOW
            =================================================================== */}
        {stage === "revealed" && openedItem && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Notification */}
            <div className="text-center space-y-1.5">
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

            {/* Specimen Visual Presentation */}
            <div className="max-w-[280px] mx-auto">
              <SpecimenVisual
                itemId={openedItem.item_id}
                itemName={openedItem.item_name}
                rarity={openedItem.rarity}
                imageUrl={openedItem.image_url}
                serialNumber={openedItem.serial_number}
                collectionName={openedItem.collection_name}
                isSpecialReward={isSpecial}
              />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#D9D9E2]/85 text-center max-w-md mx-auto leading-relaxed">
              {openedItem.description}
            </p>

            {/* Special Voucher Claim Notice */}
            {isSpecial && claimCode && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-900/30 to-amber-500/20 border border-amber-500/50 space-y-3 text-center">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
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
