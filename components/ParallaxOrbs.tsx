"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxOrbs() {
  const { scrollY } = useScroll();
  const ySlow = useTransform(scrollY, [0, 1200], [0, -200]);
  const yMid = useTransform(scrollY, [0, 1200], [0, 140]);
  const yFast = useTransform(scrollY, [0, 1200], [0, 260]);
  const xSlow = useTransform(scrollY, [0, 1200], [0, -140]);
  const xFast = useTransform(scrollY, [0, 1200], [0, 180]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y: ySlow, x: xSlow }}
        className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-neon/35 blur-3xl"
      />
      <motion.div
        style={{ y: yFast, x: xFast }}
        className="absolute top-24 right-0 h-96 w-96 rounded-full bg-aqua/25 blur-3xl"
      />
      <motion.div
        style={{ y: yMid }}
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-magenta/25 blur-3xl"
      />
      <motion.div
        style={{ y: ySlow, x: xFast }}
        className="absolute top-1/3 left-1/4 h-56 w-96 rotate-12 rounded-full bg-neon/15 blur-3xl"
      />
    </div>
  );
}
