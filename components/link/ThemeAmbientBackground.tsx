"use client";

import React from "react";
import { SmartLinkThemeSpec } from "@/lib/smartLinkThemes";

const PARTICLES = [
  { left: "6%", delay: "0s", duration: "13s", size: 12, drift: "24px", opacity: 0.55 },
  { left: "14%", delay: "-4s", duration: "16s", size: 9, drift: "-18px", opacity: 0.4 },
  { left: "23%", delay: "-8s", duration: "14s", size: 14, drift: "30px", opacity: 0.5 },
  { left: "34%", delay: "-2s", duration: "18s", size: 10, drift: "-26px", opacity: 0.45 },
  { left: "46%", delay: "-11s", duration: "15s", size: 13, drift: "20px", opacity: 0.5 },
  { left: "58%", delay: "-6s", duration: "17s", size: 8, drift: "-22px", opacity: 0.35 },
  { left: "69%", delay: "-9s", duration: "13.5s", size: 14, drift: "28px", opacity: 0.52 },
  { left: "78%", delay: "-3s", duration: "16.5s", size: 10, drift: "-20px", opacity: 0.42 },
  { left: "87%", delay: "-12s", duration: "14.5s", size: 12, drift: "18px", opacity: 0.48 },
  { left: "94%", delay: "-5s", duration: "19s", size: 9, drift: "-24px", opacity: 0.38 },
];

const DUST_MOTES = [
  { left: "12%", top: "22%", delay: "0s", duration: "7s", size: 3 },
  { left: "28%", top: "68%", delay: "-2s", duration: "9s", size: 4 },
  { left: "44%", top: "35%", delay: "-4s", duration: "8s", size: 2.5 },
  { left: "62%", top: "78%", delay: "-1s", duration: "10s", size: 3.5 },
  { left: "76%", top: "28%", delay: "-5s", duration: "7.5s", size: 3 },
  { left: "88%", top: "58%", delay: "-3s", duration: "8.5s", size: 4 },
];

export function ThemeAmbientBackground({
  theme,
  coverUrl,
  compact = false,
}: {
  theme: SmartLinkThemeSpec;
  coverUrl?: string;
  compact?: boolean;
}) {
  const particleScale = compact ? 0.65 : 1;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#050407]">
      {/* 100% Solid base backdrop layer ensures zero background bleedthrough */}
      <div className="absolute inset-0 bg-[#050407]" />
      {/* Inline Keyframes for smooth 60fps ambient animations */}
      <style jsx>{`
        @keyframes cxrnerFall {
          0% {
            transform: translate3d(0, -10%, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: var(--p-opacity, 0.5);
          }
          85% {
            opacity: var(--p-opacity, 0.5);
          }
          100% {
            transform: translate3d(var(--p-drift, 24px), 112vh, 0) rotate(320deg);
            opacity: 0;
          }
        }
        @keyframes cxrnerSnow {
          0% {
            transform: translate3d(0, -8%, 0);
            opacity: 0;
          }
          15% {
            opacity: var(--p-opacity, 0.55);
          }
          85% {
            opacity: var(--p-opacity, 0.55);
          }
          100% {
            transform: translate3d(var(--p-drift, 18px), 112vh, 0);
            opacity: 0;
          }
        }
        @keyframes cxrnerFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.25;
          }
          50% {
            transform: translate3d(10px, -18px, 0) scale(1.25);
            opacity: 0.7;
          }
        }
        @keyframes cxrnerBreathe {
          0%,
          100% {
            transform: scale(1.22);
          }
          50% {
            transform: scale(1.3);
          }
        }
        @keyframes cxrnerOrb {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(24px, -18px, 0) scale(1.1);
          }
        }
        @keyframes cxrnerScan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          20% {
            opacity: 0.35;
          }
          80% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>

      {/* Base Cover Blur */}
      {coverUrl && (
        <div
          className={`absolute inset-0 bg-cover bg-center filter blur-[76px] transition-all duration-1000 ${theme.backdropBlurOpacity}`}
          style={{
            backgroundImage: `url(${coverUrl})`,
            animation:
              theme.id === "CINEMATIC"
                ? "cxrnerBreathe 14s ease-in-out infinite"
                : undefined,
            transform: theme.id === "CINEMATIC" ? undefined : "scale(1.25)",
          }}
        />
      )}

      {/* Theme Gradient Overlay */}
      <div className={`absolute inset-0 ${theme.backdropOverlayClass}`} />

      {/* 1. CYBER: Neon Aurora Orbs + Subtle Cyber Grid */}
      {theme.id === "CYBER" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(135,55,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.35) 1px, transparent 1px)",
              backgroundSize: compact ? "24px 24px" : "44px 44px",
            }}
          />
          <div
            className="absolute -top-20 -left-16 w-72 h-72 rounded-full blur-[90px] opacity-35"
            style={{
              background: "radial-gradient(circle, #8737FF, transparent 70%)",
              animation: "cxrnerOrb 11s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-0 -right-16 w-72 h-72 rounded-full blur-[90px] opacity-25"
            style={{
              background: "radial-gradient(circle, #00F0FF, transparent 70%)",
              animation: "cxrnerOrb 14s ease-in-out infinite reverse",
            }}
          />
        </>
      )}

      {/* 2. CINEMATIC: Warm/Violet Ambient Dust Motes */}
      {theme.id === "CINEMATIC" && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(192,132,252,0.18),transparent_70%)]" />
          {DUST_MOTES.map((m, idx) => (
            <span
              key={idx}
              className="absolute rounded-full bg-purple-200/80 blur-[0.5px]"
              style={{
                left: m.left,
                top: m.top,
                width: `${m.size * particleScale}px`,
                height: `${m.size * particleScale}px`,
                animation: `cxrnerFloat ${m.duration} ease-in-out ${m.delay} infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* 3. AUTUMN: Warm Amber Glow + Gentle Falling Maple Leaves */}
      {theme.id === "AUTUMN" && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.22),transparent_68%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(234,88,12,0.16),transparent_60%)]" />
          {PARTICLES.map((p, idx) => (
            <div
              key={idx}
              className="absolute -top-6 text-amber-400/80"
              style={
                {
                  left: p.left,
                  width: `${p.size * particleScale}px`,
                  height: `${p.size * particleScale}px`,
                  "--p-drift": p.drift,
                  "--p-opacity": p.opacity,
                  animation: `cxrnerFall ${p.duration} linear ${p.delay} infinite`,
                } as React.CSSProperties
              }
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
                <path d="M12 2c1.5 3.5 4.5 5 7 5.5-1.5 2-1.5 4.5-.5 6.5-2.5-.5-4.5.5-5.5 2.5V22h-2v-5.5c-1-2-3-3-5.5-2.5 1-2 1-4.5-.5-6.5 2.5-.5 5.5-2 7-5.5Z" />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* 4. WINTER: Arctic Aurora + Gentle Snowfall */}
      {theme.id === "WINTER" && (
        <>
          <div
            className="absolute -top-24 left-1/4 w-96 h-64 rounded-full blur-[95px] opacity-30"
            style={{
              background: "radial-gradient(circle, #38BDF8, transparent 70%)",
              animation: "cxrnerOrb 13s ease-in-out infinite",
            }}
          />
          {PARTICLES.map((p, idx) => (
            <div
              key={idx}
              className="absolute -top-4 rounded-full bg-sky-100"
              style={
                {
                  left: p.left,
                  width: `${Math.max(3, p.size * 0.45 * particleScale)}px`,
                  height: `${Math.max(3, p.size * 0.45 * particleScale)}px`,
                  boxShadow: "0 0 8px rgba(186, 230, 253, 0.8)",
                  "--p-drift": p.drift,
                  "--p-opacity": p.opacity + 0.15,
                  animation: `cxrnerSnow ${p.duration} linear ${p.delay} infinite`,
                } as React.CSSProperties
              }
            />
          ))}
        </>
      )}

      {/* 5. MINIMAL: Swiss Architectural Grid + Subtle Light Scan */}
      {theme.id === "MINIMAL" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: compact ? "20px 20px" : "48px 48px",
            }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ animation: "cxrnerScan 9s linear infinite" }}
          />
        </>
      )}

      {/* 6. SAKURA: Tokyo Night Dusk + Floating Cherry Petals */}
      {theme.id === "SAKURA" && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.22),transparent_68%)]" />
          {PARTICLES.map((p, idx) => (
            <div
              key={idx}
              className="absolute -top-5 text-pink-300/80"
              style={
                {
                  left: p.left,
                  width: `${p.size * 0.85 * particleScale}px`,
                  height: `${p.size * 0.85 * particleScale}px`,
                  "--p-drift": p.drift,
                  "--p-opacity": p.opacity,
                  animation: `cxrnerFall ${p.duration} linear ${p.delay} infinite`,
                } as React.CSSProperties
              }
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_5px_rgba(244,114,182,0.45)]">
                <path d="M12 2C9 6 6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-3-8-6-12Z" />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* 7. BRUTAL: Industrial Stripes + Cyan Pulse */}
      {theme.id === "BRUTAL" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #00F0FF 0, #00F0FF 1px, transparent 1px, transparent 16px)",
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-[90px] opacity-25"
            style={{
              background: "#00F0FF",
              animation: "cxrnerOrb 8s ease-in-out infinite",
            }}
          />
        </>
      )}
    </div>
  );
}
