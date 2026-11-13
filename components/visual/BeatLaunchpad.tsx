"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  play808Bass,
  playHardKick,
  playPhonkCowbell,
  playTrapClap,
  playHiHat,
  playGlitchLaser,
  playQuantumDisrupt,
  setSfxEnabled,
  isSfxEnabled,
} from "../../lib/soundFX";
import { triggerUniverseShockwave, triggerUniverseDisrupt } from "../../lib/universeBridge";
import { Sparkles, Play, Square, Volume2 } from "lucide-react";

interface PadConfig {
  id: string;
  name: string;
  keyLabel: string;
  keys: string[];
  color: string;
  borderColor: string;
  accentShadow: string;
  trigger: () => void;
  shockwaveStrength: number;
}

export default function BeatLaunchpad() {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoStepRef = useRef(0);

  const pads: PadConfig[] = [
    {
      id: "808",
      name: "808 SUB",
      keyLabel: "1 / Q",
      keys: ["1", "q", "й"],
      color: "from-[#8737FF]/40 to-[#4B0082]/30",
      borderColor: "border-[#8737FF]",
      accentShadow: "shadow-[0_0_30px_rgba(135,55,255,0.45)]",
      trigger: play808Bass,
      shockwaveStrength: 1.0,
    },
    {
      id: "kick",
      name: "HARD KICK",
      keyLabel: "2 / W",
      keys: ["2", "w", "ц"],
      color: "from-[#B46BFF]/35 to-[#160B28]/40",
      borderColor: "border-[#B46BFF]",
      accentShadow: "shadow-[0_0_30px_rgba(180,107,255,0.4)]",
      trigger: playHardKick,
      shockwaveStrength: 0.85,
    },
    {
      id: "cowbell",
      name: "PHONK BELL",
      keyLabel: "3 / E",
      keys: ["3", "e", "у"],
      color: "from-[#00F0FF]/35 to-[#050407]/40",
      borderColor: "border-[#00F0FF]",
      accentShadow: "shadow-[0_0_30px_rgba(0,240,255,0.4)]",
      trigger: playPhonkCowbell,
      shockwaveStrength: 0.65,
    },
    {
      id: "clap",
      name: "TRAP CLAP",
      keyLabel: "4 / A",
      keys: ["4", "a", "ф"],
      color: "from-[#FF2E93]/35 to-[#160B28]/40",
      borderColor: "border-[#FF2E93]",
      accentShadow: "shadow-[0_0_30px_rgba(255,46,147,0.4)]",
      trigger: playTrapClap,
      shockwaveStrength: 0.7,
    },
    {
      id: "hihat",
      name: "HI-HAT",
      keyLabel: "5 / S",
      keys: ["5", "s", "ы"],
      color: "from-[#D9D9E2]/30 to-[#050407]/40",
      borderColor: "border-white/50",
      accentShadow: "shadow-[0_0_25px_rgba(255,255,255,0.3)]",
      trigger: playHiHat,
      shockwaveStrength: 0.35,
    },
    {
      id: "laser",
      name: "GLITCH LASER",
      keyLabel: "6 / D",
      keys: ["6", "d", "в"],
      color: "from-[#9D00FF]/40 to-[#160B28]/40",
      borderColor: "border-[#9D00FF]",
      accentShadow: "shadow-[0_0_30px_rgba(157,0,255,0.45)]",
      trigger: playGlitchLaser,
      shockwaveStrength: 0.8,
    },
  ];

  const triggerPad = useCallback((pad: PadConfig) => {
    // If user interacts with beatpad, make sure sound is unmuted
    if (!isSfxEnabled()) {
      setSfxEnabled(true);
    }
    pad.trigger();
    triggerUniverseShockwave(pad.shockwaveStrength);
    setActivePad(pad.id);
    setTimeout(() => {
      setActivePad((curr) => (curr === pad.id ? null : curr));
    }, 180);
  }, []);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Spacebar = Quantum Core Disruption
      if (e.code === "Space") {
        e.preventDefault();
        playQuantumDisrupt();
        triggerUniverseDisrupt();
        return;
      }

      const matched = pads.find((p) => p.keys.includes(key));
      if (matched) {
        triggerPad(matched);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pads, triggerPad]);

  // Demo loop sequence
  const stopDemo = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsPlayingDemo(false);
    demoStepRef.current = 0;
  }, []);

  const toggleDemo = () => {
    if (isPlayingDemo) {
      stopDemo();
      return;
    }

    if (!isSfxEnabled()) {
      setSfxEnabled(true);
    }

    setIsPlayingDemo(true);
    const pattern = [
      ["kick", "hihat"],
      ["hihat"],
      ["clap", "cowbell"],
      ["hihat"],
      ["kick", "808"],
      ["hihat"],
      ["clap", "laser"],
      ["hihat", "cowbell"],
    ];

    demoStepRef.current = 0;
    demoIntervalRef.current = setInterval(() => {
      const stepPads = pattern[demoStepRef.current % pattern.length];
      stepPads.forEach((id) => {
        const found = pads.find((p) => p.id === id);
        if (found) {
          found.trigger();
          triggerUniverseShockwave(found.shockwaveStrength);
          setActivePad(id);
          setTimeout(() => setActivePad((c) => (c === id ? null : c)), 130);
        }
      });
      demoStepRef.current++;
    }, 190); // ~158 BPM Phonk/Trap Groove
  };

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative rounded-3xl border border-[#B46BFF]/30 bg-[#090611]/80 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-[0_0_80px_rgba(135,55,255,0.18)] overflow-hidden">
      {/* Background cyber grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(135,55,255,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#8737FF]/10 blur-3xl pointer-events-none" />

      {/* Top Deck Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#B46BFF] animate-pulse" />
            <span className="font-sans text-xs uppercase tracking-wider font-semibold text-[#B46BFF]">
              ЗВУКОВОЙ ДВИЖОК CXRNER
            </span>
          </div>
          <h3 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white">
            Интерактивная бит-станция
          </h3>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/80 font-sans">
            Кликайте по пэдам или используйте клавиши <span className="text-[#B46BFF] font-semibold">1–6 / Q-W-E-A-S-D</span> на клавиатуре.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDemo}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.16em] transition duration-200 border ${
              isPlayingDemo
                ? "border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-[0_0_20px_rgba(255,46,147,0.4)]"
                : "border-[#B46BFF]/40 bg-[#8737FF]/15 text-[#D9D9E2] hover:bg-[#8737FF]/25 hover:border-[#B46BFF]"
            }`}
          >
            {isPlayingDemo ? (
              <>
                <Square className="w-3 h-3 text-[#FF2E93] fill-current" />
                <span>Стоп демо</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#B46BFF] fill-current" />
                <span>Демо-бит</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/40 font-mono text-[10px] text-[#D9D9E2]/60 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-[#B46BFF]" />
            <span>SPACE: ВЗРЫВ ЯДРА</span>
          </div>
        </div>
      </div>

      {/* 6 Tactile Drum Pads */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-6">
        {pads.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => triggerPad(pad)}
              className={`relative group flex flex-col justify-between items-center text-center p-4 sm:p-5 rounded-2xl border transition-all duration-150 select-none overflow-hidden h-[120px] sm:h-[135px] cursor-pointer ${
                pad.borderColor
              } ${
                isActive
                  ? `bg-gradient-to-b ${pad.color} scale-[0.96] ${pad.accentShadow} border-white`
                  : "bg-[#050407]/70 hover:bg-[#160B28]/50 hover:border-white/40"
              }`}
            >
              {/* Corner status light */}
              <div className="w-full flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                  {pad.keyLabel}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                    isActive
                      ? "bg-white shadow-[0_0_8px_#ffffff]"
                      : "bg-white/20 group-hover:bg-[#B46BFF]"
                  }`}
                />
              </div>

              {/* Pad Title */}
              <div className="my-auto space-y-1">
                <p className="font-heavy text-base sm:text-lg uppercase tracking-tight text-white">
                  {pad.name}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#D9D9E2]/60">
                  WEB AUDIO
                </p>
              </div>

              {/* Bottom activity line */}
              <div
                className={`w-full h-1 rounded-full transition-all duration-150 ${
                  isActive ? "bg-white shadow-[0_0_12px_#ffffff]" : "bg-white/10"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Live Waveform Visualizer & Telemetry Ticker */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#D9D9E2]/60">
        <div className="flex items-center gap-3">
          <Volume2 className="w-3.5 h-3.5 text-[#B46BFF]" />
          <span>СИНТЕЗ В РЕАЛЬНОМ ВРЕМЕНИ (32-BIT FLOAT // 0ms ЗАДЕРЖКА)</span>
        </div>
        <div className="flex items-center gap-4 text-[#B46BFF]">
          <span>3D REACTION: ON</span>
          <span className="text-white/25">•</span>
          <span>BPM: 158</span>
          <span className="text-white/25">•</span>
          <span>LATENCY: &lt;1.2MS</span>
        </div>
      </div>
    </div>
  );
}
