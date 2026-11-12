"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSfxEnabled, setSfxEnabled, subscribeSfx } from "../../lib/soundFX";

export default function SfxToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isSfxEnabled());
    return subscribeSfx((val) => setEnabled(val));
  }, []);

  const toggle = () => {
    setSfxEnabled(!enabled);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-cursor="SFX"
      aria-label={enabled ? "Отключить звуковые эффекты интерфейса" : "Включить звуковые эффекты интерфейса"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all duration-300 border ${
        enabled
          ? "border-[#B46BFF]/60 bg-[#8737FF]/20 text-white shadow-[0_0_12px_rgba(180,107,255,0.35)]"
          : "border-white/10 bg-[#090611]/60 text-[#D9D9E2]/50 hover:text-white hover:border-white/20"
      } ${className}`}
      title={enabled ? "Звуки интерфейса включены" : "Включить звуковые эффекты интерфейса"}
    >
      {enabled ? (
        <Volume2 className="w-3.5 h-3.5 text-[#B46BFF] animate-pulse" />
      ) : (
        <VolumeX className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">SFX {enabled ? "ON" : "OFF"}</span>
    </button>
  );
}
