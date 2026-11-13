"use client";

import { useEffect, useState } from "react";
import { setUniverseIntroCompleted } from "../../lib/universeBridge";
import { playWhooshSound } from "../../lib/soundFX";

/**
 * Short, skippable (~1.35s) cinematic intro overlay synced with the 3D WebGL camera fly-in.
 * Automatically skipped if already played this session or if prefers-reduced-motion is enabled.
 */
export default function IntroSequence() {
  const [phase, setPhase] = useState<"visible" | "exiting" | "done">("done");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const alreadySeen = sessionStorage.getItem("cxr_intro_seen") === "1";

    if (reducedMotion || alreadySeen) {
      setUniverseIntroCompleted(true);
      setPhase("done");
      return;
    }

    setPhase("visible");
    sessionStorage.setItem("cxr_intro_seen", "1");

    const exitTimer = window.setTimeout(() => {
      setPhase("exiting");
      playWhooshSound();
    }, 1050);

    const doneTimer = window.setTimeout(() => {
      setUniverseIntroCompleted(true);
      setPhase("done");
    }, 1500);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        skip();
      }
    };

    const skip = () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      setUniverseIntroCompleted(true);
      setPhase("done");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (phase === "done") return null;

  const dismiss = () => {
    setUniverseIntroCompleted(true);
    setPhase("done");
  };

  return (
    <div
      className={`fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-[#050407] transition-all duration-500 ease-out ${
        phase === "exiting" ? "opacity-0 scale-105 pointer-events-none" : "opacity-100"
      }`}
      aria-label="CXRNER MUSIC Intro"
    >
      {/* Subtle radial violet core glow */}
      <div className="absolute w-[340px] h-[340px] rounded-full bg-[#8737FF]/25 blur-[110px] pointer-events-none animate-pulse" />

      <div className="relative z-10 text-center px-6">
        <p className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold text-[#B46BFF] mb-4 animate-fadeIn">
          CXRNER MUSIC UNIVERSE
        </p>

        <h2 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight uppercase text-white leading-none select-none">
          <span className="inline-block animate-fadeIn">CXRNER</span>{" "}
          <span className="inline-block text-violet-energy animate-fadeIn">MUSIC</span>
        </h2>

        <div className="mt-6 w-48 h-[1px] mx-auto bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-[#8737FF] to-white animate-[marquee_1.1s_ease-out_forwards]" />
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="absolute bottom-8 right-8 px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 font-mono text-[10px] uppercase tracking-[0.25em] text-[#D9D9E2] hover:text-white transition"
      >
        Пропустить [ESC]
      </button>
    </div>
  );
}
