"use client";

import { Sparkles, Zap, Radio, CornerDownRight } from "lucide-react";
import { triggerUniverseDisrupt, triggerUniverseShockwave } from "../../lib/universeBridge";
import { playQuantumDisrupt, play808Bass, playClickSound, setSfxEnabled, isSfxEnabled } from "../../lib/soundFX";

export default function HeroHudControls() {
  const handleDisrupt = () => {
    if (!isSfxEnabled()) setSfxEnabled(true);
    triggerUniverseDisrupt();
    playQuantumDisrupt();
  };

  const handleBassOverdrive = () => {
    if (!isSfxEnabled()) setSfxEnabled(true);
    triggerUniverseShockwave(1.0);
    play808Bass();
  };

  const scrollToBeatpad = () => {
    playClickSound();
    const el = document.getElementById("beatpad");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="pt-2 sm:pt-4 flex flex-col gap-2.5">
      {/* Interactive HUD Trigger Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleDisrupt}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#B46BFF]/40 bg-[#090611]/80 hover:bg-[#8737FF]/25 hover:border-[#B46BFF] transition duration-200 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#D9D9E2] cursor-pointer shadow-[0_0_15px_rgba(135,55,255,0.2)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B46BFF] group-hover:rotate-45 transition duration-300" />
          <span>Разрыв 3D-ядра</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/60">
            SPACE
          </span>
        </button>

        <button
          onClick={handleBassOverdrive}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 bg-[#090611]/80 hover:bg-white/15 hover:border-white/35 transition duration-200 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#D9D9E2] cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-[#00F0FF] group-hover:scale-110 transition duration-200" />
          <span>Саб-бас импульс</span>
        </button>

        <button
          onClick={scrollToBeatpad}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#8737FF]/40 bg-[#8737FF]/10 hover:bg-[#8737FF]/25 hover:border-[#8737FF] transition duration-200 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#B46BFF] cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-[#B46BFF] animate-pulse" />
          <span>Бит-станция</span>
          <CornerDownRight className="w-3 h-3" />
        </button>
      </div>

      {/* Cybernetic Micro-Telemetry Line */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#D9D9E2]/50">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
          <span>CORE: QUANTUM-ACTIVE</span>
        </div>
        <span>•</span>
        <span>DRAG 3D TO ROTATE</span>
        <span>•</span>
        <span>32-BIT DSP SYNTH</span>
      </div>
    </div>
  );
}
