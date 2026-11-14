"use client";

import { useState } from "react";
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Boxes, Coins, ShieldCheck, Layers, Eye } from "lucide-react";

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTourModal({
  isOpen,
  onClose,
}: OnboardingTourModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: "Добро пожаловать в CXRNER DROP",
      subtitle: "ШАГ 1 ИЗ 6 • ОБЗОР ИГРЫ",
      text: "CXRNER DROP — это эксклюзивная браузерная коллекционная игра внутри официального сайта лейбла CXRNER MUSIC. Здесь музыканты и фанаты собирают цифровые артефакты лейбла и открывают реальные награды.",
      icon: Boxes,
      color: "#8737FF",
    },
    {
      title: "Что такое CXP и откуда он берётся",
      subtitle: "ШАГ 2 ИЗ 6 • ИГРОВАЯ ВАЛЮТА",
      text: "CXP — внутренняя валюта лейбла. Здесь нет доната за рубли: валюта начисляется за активность: заполнение профиля CXRNER ID (+100), привязку Telegram (+50), верификацию артиста (+100), отправку релизов (+150) и приглашение друзей.",
      icon: Coins,
      color: "#00F0FF",
    },
    {
      title: "Как открывать запечатанные кейсы",
      subtitle: "ШАГ 3 ИЗ 6 • ВЫБОР И ОТКРЫТИЕ",
      text: "Выбирай один из 3 кейсов: Base Archive, Black Specimen или Chrome Age. Нажми 'OPEN CASE', подтверди операцию — начнется физическая кинематографическая анимация лазерного разрыва ZIP-пакета.",
      icon: Sparkles,
      color: "#EC4899",
    },
    {
      title: "Степени редкости и честные шансы",
      subtitle: "ШАГ 4 ИЗ 6 • ПРОЗРАЧНОСТЬ",
      text: "В игре 5 уровней редкости: Common (55%), Rare (25%), Epic (13%), Legendary (5.5%), Mythic (1.4%) и супер-приз Cover Voucher (0.1%). Все вероятности открыты и не зависят от рандома на клиенте.",
      icon: ShieldCheck,
      color: "#F59E0B",
    },
    {
      title: "Где хранятся полученные предметы",
      subtitle: "ШАГ 5 ИЗ 6 • ИНВЕНТАРЬ И СЕРИЙНЫЕ НОМЕРА",
      text: "Каждый выпавший артефакт навсегда привязывается к вашему аккаунту с уникальным серийным номером (например, #000184). Вкладка 'Инвентарь' позволяет просматривать всю коллекцию в 3D.",
      icon: Layers,
      color: "#10B981",
    },
    {
      title: "Публичная витрина в профиле CXRNER ID",
      subtitle: "ШАГ 6 ИЗ 6 • ВЫСТАВКА В МУЗЕЕ",
      text: "Любой найденный артефакт можно поместить на публичную витрину вашего профиля /profile/:username. До 6 лучших предметов будут видеть ваши слушатели, продюсеры и гости лейбла!",
      icon: Eye,
      color: "#A855F7",
    },
  ];

  const current = tourSteps[stepIndex];
  const Icon = current.icon;

  const handleFinish = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      window.localStorage.setItem("cxrner_drop_onboarded", "true");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#B46BFF]/45 bg-[#090611] p-6 sm:p-8 shadow-[0_0_80px_rgba(135,55,255,0.35)] space-y-6">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-28 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${current.color}40, transparent 70%)`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span
              className="font-mono text-[10px] uppercase tracking-widest font-bold"
              style={{ color: current.color }}
            >
              {current.subtitle}
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white">
              {current.title}
            </h2>
          </div>
          <button
            onClick={handleFinish}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Visual Art / Icon Card */}
        <div className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl"
            style={{
              backgroundColor: `${current.color}20`,
              borderColor: `${current.color}60`,
              color: current.color,
              boxShadow: `0 0 30px ${current.color}40`,
            }}
          >
            <Icon className="w-8 h-8" />
          </div>

          <p className="text-xs sm:text-sm text-[#D9D9E2]/90 leading-relaxed max-w-md font-sans">
            {current.text}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 pt-2">
            {tourSteps.map((_, idx) => (
              <span
                key={idx}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: idx === stepIndex ? "24px" : "6px",
                  backgroundColor: idx === stepIndex ? current.color : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Don't show again toggle */}
        <label className="flex items-center gap-2.5 text-xs text-[#D9D9E2]/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-white/30 bg-black/60 text-[#8737FF] focus:ring-0 w-4 h-4 cursor-pointer"
          />
          <span>Больше не показывать обучение при входе</span>
        </label>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {stepIndex > 0 ? (
            <button
              onClick={() => setStepIndex((prev) => prev - 1)}
              className="px-4 py-2.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-[#D9D9E2] flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>
          ) : (
            <div />
          )}

          {stepIndex < tourSteps.length - 1 ? (
            <button
              onClick={() => setStepIndex((prev) => prev + 1)}
              className="btn-energy px-6 py-2.5 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2 shadow-[0_0_20px_rgba(135,55,255,0.4)]"
            >
              <span>Далее</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn-energy px-7 py-2.5 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_25px_rgba(135,55,255,0.5)] flex items-center gap-2"
            >
              <span>ENTER THE ARCHIVE</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
