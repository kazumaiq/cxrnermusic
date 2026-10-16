"use client";

import Starfield from "./visual/Starfield";

export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Deep Obsidian Black Base */}
      <div className="absolute inset-0 bg-[#060609]" />

      {/* 3D Animated Flying Stars & Glowing Nebulae */}
      <Starfield />

      {/* Top Ambient Purple Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-purple-600/15 via-indigo-600/05 to-transparent blur-3xl pointer-events-none" />

      {/* Subtle Micro-Grid with radial mask */}
      <div className="gothic-grid absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_50%,transparent_100%)]" />

      {/* Film Grain */}
      <div className="film-grain absolute inset-0 opacity-30 mix-blend-screen" />

      {/* Bottom Darkness Falloff */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#060609] via-[#060609]/80 to-transparent pointer-events-none" />
    </div>
  );
}
