"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function BackgroundFX() {
  const { scrollY } = useScroll();
  const ySlow = useTransform(scrollY, [0, 2400], [0, -120]);
  const yFast = useTransform(scrollY, [0, 2400], [0, 180]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Base Deep Night Canvas */}
      <div className="absolute inset-0 bg-[#08040f]" />

      {/* Atmospheric Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(1300px_circle_at_15%_12%,rgba(180,75,255,0.22),transparent_65%),radial-gradient(1200px_circle_at_85%_18%,rgba(83,246,255,0.18),transparent_62%),radial-gradient(1400px_circle_at_50%_80%,rgba(255,75,214,0.14),transparent_68%)]" />

      {/* Floating Volumetric Orbs */}
      <motion.div
        style={{ y: ySlow }}
        className="hero-glow-blob -top-40 -left-40 h-[580px] w-[580px] bg-neon/20 blur-[130px]"
      />
      <motion.div
        style={{ y: yFast }}
        className="hero-glow-blob top-1/4 -right-48 h-[650px] w-[650px] bg-aqua/18 blur-[150px]"
      />
      <div className="hero-glow-blob bottom-[-200px] left-1/3 h-[700px] w-[700px] bg-magenta/15 blur-[160px]" />

      {/* Subtle Digital Grid Texture */}
      <div className="absolute inset-0 bg-grid opacity-[0.06] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)]" />

      {/* Fine Noise Texture */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40" />

      {/* Top to Bottom Fade Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-night/40 to-night pointer-events-none" />
    </div>
  );
}
