"use client";

import Starfield from "./visual/Starfield";

export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Deep Obsidian Cosmic Base */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* 3D Animated Flying Stars & Glowing Nebulae */}
      <Starfield />

      {/* Top Ambient Purple Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Center Subtle Violet Bloom */}
      <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Micro-Grid with radial mask */}
      <div className="gothic-grid absolute inset-0 opacity-15 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_40%,transparent_100%)]" />

      {/* Film Grain */}
      <div className="film-grain absolute inset-0 opacity-20 mix-blend-screen" />
    </div>
  );
}

