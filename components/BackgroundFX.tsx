"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function BackgroundFX() {
  const { scrollY } = useScroll();
  const ySlow = useTransform(scrollY, [0, 2000], [0, -140]);
  const yMid = useTransform(scrollY, [0, 2000], [0, 120]);
  const yFast = useTransform(scrollY, [0, 2000], [0, 200]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-night" />

      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_15%,rgba(180,75,255,0.22),transparent_60%),radial-gradient(1100px_circle_at_85%_10%,rgba(83,246,255,0.18),transparent_62%),radial-gradient(1200px_circle_at_50%_75%,rgba(255,75,214,0.16),transparent_65%)]" />

      <motion.div
        style={{ y: ySlow }}
        className="absolute -top-48 -left-48 h-[560px] w-[560px] rounded-full bg-neon/28 blur-[140px] will-change-transform"
      />
      <motion.div
        style={{ y: yFast }}
        className="absolute top-10 right-[-200px] h-[680px] w-[680px] rounded-full bg-aqua/22 blur-[160px] will-change-transform"
      />
      <motion.div
        style={{ y: yMid }}
        className="absolute bottom-[-260px] left-[10%] h-[640px] w-[640px] rounded-full bg-magenta/22 blur-[170px] will-change-transform"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,20,0.0)_0%,rgba(10,6,20,0.55)_55%,rgba(10,6,20,0.9)_100%)]" />
      <div className="absolute inset-0 bg-grid opacity-10 [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_75%)]" />
    </div>
  );
}
