"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue } from "framer-motion";

type CounterProps = {
  to: number;
  suffix?: string;
  duration?: number;
};

export default function Counter({ to, suffix = "", duration = 1.6 }: CounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      setValue(Math.floor(latest));
    });

    return () => unsubscribe();
  }, [motionValue]);

  useEffect(() => {
    if (!inView) return;

    setStarted(true);

    const controls = animate(motionValue, to, {
      duration,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [inView, motionValue, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {started ? value : to}
      {suffix}
    </span>
  );
}
