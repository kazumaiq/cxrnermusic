"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxOrbs() {
  const { scrollY } = useScroll();
  const ySlow = useTransform(scrollY, [0, 800], [0, -120]);
  const yFast = useTransform(scrollY, [0, 800], [0, 160]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y: ySlow }}
        className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-neon/30 blur-3xl"
      />
      <motion.div
        style={{ y: yFast }}
        className="absolute top-24 right-0 h-80 w-80 rounded-full bg-aqua/20 blur-3xl"
      />
      <motion.div
        style={{ y: ySlow }}
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-magenta/20 blur-3xl"
      />
    </div>
  );
}
