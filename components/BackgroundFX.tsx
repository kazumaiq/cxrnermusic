"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function BackgroundFX() {
  const { scrollY } = useScroll();
  const ySlow = useTransform(scrollY, [0, 1600], [0, -180]);
  const yMid = useTransform(scrollY, [0, 1600], [0, 120]);
  const yFast = useTransform(scrollY, [0, 1600], [0, 220]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-night" />

      <motion.div
        style={{ y: ySlow }}
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-neon/30 blur-3xl will-change-transform"
      />
      <motion.div
        style={{ y: yFast }}
        className="absolute top-10 right-[-140px] h-[620px] w-[620px] rounded-full bg-aqua/22 blur-3xl will-change-transform"
      />
      <motion.div
        style={{ y: yMid }}
        className="absolute bottom-[-220px] left-1/4 h-[560px] w-[560px] rounded-full bg-magenta/22 blur-3xl will-change-transform"
      />

      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(180,75,255,0.16),transparent_60%),radial-gradient(1000px_circle_at_80%_20%,rgba(83,246,255,0.12),transparent_60%),radial-gradient(1200px_circle_at_50%_80%,rgba(255,75,214,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-grid opacity-15 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-night/60 via-night to-night" />
    </div>
  );
}
