"use client";

import Starfield from "./visual/Starfield";

export default function BackgroundFX() {
  return (
    <>
      {/* 3D Sci-Fi Interactive Starfield (dynexmusic.com style) */}
      <Starfield />

      {/* Atmospheric Overlays & Soft Luminous Blooms */}
      <div className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden select-none">
        {/* Top Ambient Purple Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

        {/* Center Subtle Violet Bloom */}
        <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Subtle Micro-Grid with radial mask */}
        <div className="gothic-grid absolute inset-0 opacity-10 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_40%,transparent_100%)] pointer-events-none" />

        {/* Film Grain */}
        <div className="film-grain absolute inset-0 opacity-15 mix-blend-screen pointer-events-none" />
      </div>
    </>
  );
}
