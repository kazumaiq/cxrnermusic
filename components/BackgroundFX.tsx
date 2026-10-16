"use client";

import Starfield from "./visual/Starfield";

export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Absolute Void Base */}
      <div className="absolute inset-0 bg-[#030303]" />

      {/* Living Multi-layered Parallax Starfield & Space Nebulae */}
      <Starfield />

      {/* Subtle Monochrome Vignette & Depth Falloff */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent_80%)]" />

      {/* Architectural Gothic Cross-grid with radial mask */}
      <div className="gothic-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_50%,transparent_100%)]" />

      {/* Analog Film Grain Texture */}
      <div className="film-grain absolute inset-0 opacity-40 mix-blend-screen" />

      {/* Bottom Darkness Falloff to ground footer */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#030303] via-[#030303]/70 to-transparent pointer-events-none" />
    </div>
  );
}
