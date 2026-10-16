"use client";

import React from "react";

/**
 * Procedural Vector Chrome Organic Spine & Starburst Art
 * Captures the underground industrial aesthetic:
 * - Sharp organic metallic thorns / spinal arches
 * - Intense chrome reflections with sharp white-to-black gradient transitions
 * - Multi-point diffraction starbursts
 */

export function ChromeStarburst({
  className = "",
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
    >
      <defs>
        <radialGradient
          id="starGlow"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#CCCCCC" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Central Flare Glow */}
      <circle cx="24" cy="24" r="16" fill="url(#starGlow)" />
      {/* Vertical Long Needle Spike */}
      <path
        d="M24 0 Q24 21 21 24 Q24 27 24 48 Q24 27 27 24 Q24 21 24 0 Z"
        fill="#FFFFFF"
      />
      {/* Horizontal Long Needle Spike */}
      <path
        d="M0 24 Q21 24 24 21 Q27 24 48 24 Q27 24 24 27 Q21 24 0 24 Z"
        fill="#FFFFFF"
      />
      {/* Diagonal Shorter Needle Spikes */}
      <path
        d="M7 7 Q22 22 24 21 Q22 22 41 41 Q26 26 24 27 Q26 26 7 7 Z"
        fill="rgba(255,255,255,0.7)"
      />
      <path
        d="M41 7 Q26 22 24 21 Q26 22 7 41 Q22 26 24 27 Q22 26 41 7 Z"
        fill="rgba(255,255,255,0.7)"
      />
      {/* Diamond Core */}
      <circle cx="24" cy="24" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

export function ChromeOrganicSpine({ className = "" }: { className?: string }) {
  return (
    <div className={`relative pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-60"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Chrome Metal Linear Gradients with high-contrast reflective bands */}
          <linearGradient id="chrome1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a0a0a" />
            <stop offset="18%" stopColor="#ffffff" />
            <stop offset="28%" stopColor="#222222" />
            <stop offset="42%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#080808" />
            <stop offset="70%" stopColor="#eaeaea" />
            <stop offset="85%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient id="chrome2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#1a1a1a" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#0a0a0a" />
            <stop offset="80%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#333333" />
          </linearGradient>

          <linearGradient id="chromeLine" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>

        {/* Master Spinal Rib Arch 1 */}
        <path
          d="M 50,450 C 180,280 320,120 540,80 C 680,60 760,180 720,320 C 690,420 580,480 460,450 C 360,420 320,320 380,240 C 430,170 540,180 580,260"
          stroke="url(#chrome1)"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Counter Thorn Spines */}
        <path
          d="M 540,80 Q 610,30 680,10 Q 630,70 580,110 Z"
          fill="url(#chrome2)"
          opacity="0.85"
        />
        <path
          d="M 720,320 Q 790,340 820,380 Q 750,380 700,350 Z"
          fill="url(#chrome1)"
          opacity="0.85"
        />
        <path
          d="M 460,450 Q 480,540 500,590 Q 440,520 420,460 Z"
          fill="url(#chrome2)"
          opacity="0.85"
        />
        <path
          d="M 380,240 Q 280,200 210,170 Q 290,240 340,260 Z"
          fill="url(#chrome1)"
          opacity="0.85"
        />

        {/* Secondary Delicate Razor Lines (Underground wireframe accents) */}
        <path
          d="M 80,430 C 200,290 340,150 530,100"
          stroke="url(#chromeLine)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <path
          d="M 520,110 C 660,90 730,190 700,310"
          stroke="url(#chromeLine)"
          strokeWidth="1.2"
        />
        <path
          d="M 680,330 C 650,420 550,470 450,440"
          stroke="url(#chromeLine)"
          strokeWidth="0.8"
          strokeDasharray="8 4"
        />

        {/* Sharp Barbed Spurs */}
        <polygon points="320,140 335,115 340,145" fill="#FFFFFF" opacity="0.9" />
        <polygon points="440,95 460,70 462,102" fill="#FFFFFF" opacity="0.9" />
        <polygon points="630,95 660,65 650,110" fill="#FFFFFF" opacity="0.9" />
        <polygon points="730,230 765,220 740,250" fill="#FFFFFF" opacity="0.9" />
        <polygon points="710,380 745,410 705,400" fill="#FFFFFF" opacity="0.9" />
        <polygon points="560,470 580,515 545,485" fill="#FFFFFF" opacity="0.9" />
        <polygon points="260,330 220,345 255,360" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </div>
  );
}

export function TechnicalCrosshair({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 font-mono text-[9px] text-neutral-500 select-none ${className}`}>
      <span>[</span>
      <span className="text-white">+</span>
      <span>]</span>
    </div>
  );
}
