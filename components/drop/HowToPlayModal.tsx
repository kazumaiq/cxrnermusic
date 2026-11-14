"use client";

import { X, Coins, Boxes, Layers, Sparkles, Trophy, ArrowRight } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGetCxp?: () => void;
}

export default function HowToPlayModal({
  isOpen,
  onClose,
  onOpenGetCxp,
}: HowToPlayModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      step: "01",
      title: "GET CXP",
      desc: "Получай игровую валюту за задания, ежедневную активность, заполнение профиля CXRNER ID и приглашение музыкантов.",
      icon: Coins,
      color: "#00F0FF",
    },
    {
      step: "02",
      title: "OPEN CASES",
      desc: "Выбирай один из запечатанных кейсов архива: Archive, Black Specimen или Chrome Age, и запускай лазерное вскрытие.",
      icon: Boxes,
      color: "#8737FF",
    },
    {
      step: "03",
      title: "COLLECT",
      desc: "Находи уникальные музыкальные артефакты 5 степеней редкости. Каждый предмет имеет свой серийный номер в реестре.",
      icon: Layers,
      color: "#EC4899",
    },
    {
      step: "04",
      title: "SHOW OFF",
      desc: "Выставляй до 6 любимых предметов на персональную витрину своего публичного профиля CXRNER ID для всех слушателей.",
      icon: Sparkles,
      color: "#F59E0B",
    },
    {
      step: "05",
      title: "UNLOCK REWARDS",
      desc: "Открывай редкие достижения лейбла, получай бонусный CXP и выигрывай эксклюзивный ваучер на бесплатную обложку от @kazumaiq.",
      icon: Trophy,
      color: "#10B981",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#B46BFF]/45 bg-[#090611] p-6 sm:p-8 shadow-[0_0_80px_rgba(135,55,255,0.3)] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#B46BFF] font-bold">
              // ИНСТРУКЦИЯ ИГРОКА //
            </span>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white">
              Как играть в CXRNER DROP
            </h2>
            <p className="text-xs text-[#D9D9E2]/75">
              CXRNER DROP — это браузерная игра для артистов и слушателей лейбла. Никаких реальных денег: только игровая валюта CXP.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-4 transition hover:border-white/25"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${st.color}15`,
                    borderColor: `${st.color}40`,
                    color: st.color,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: st.color }}
                    >
                      {st.step}
                    </span>
                    <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-wide text-white">
                      {st.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#D9D9E2]/80 leading-relaxed font-sans">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {onOpenGetCxp && (
            <button
              onClick={() => {
                onClose();
                onOpenGetCxp();
              }}
              className="btn-energy py-3 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_20px_rgba(135,55,255,0.4)]"
            >
              Получить CXP
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 font-mono text-xs uppercase tracking-wider text-white transition"
          >
            Всё понятно
          </button>
        </div>
      </div>
    </div>
  );
}
