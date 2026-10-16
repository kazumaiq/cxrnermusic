"use client";

export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Pure Void Black Base */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Subtle Monochrome Vignette & Light Falloff */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent_70%)]" />

      {/* Industrial Grid Lines */}
      <div className="gothic-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]" />

      {/* Subtle Analog Film Grain */}
      <div className="film-grain absolute inset-0 opacity-60" />

      {/* Bottom Darkness Falloff */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/40 to-[#050505] pointer-events-none" />
    </div>
  );
}
