"use client";

import { useEffect, useRef, useState } from "react";
import { setUniverseHover } from "../../lib/universeBridge";

/**
 * Precision Cosmic Cursor (Desktop fine-pointer only).
 * Automatically disables itself on touch / coarse-pointer devices and reduced-motion.
 */
export default function CosmicCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    setEnabled(true);
    document.documentElement.classList.add("cxr-cursor-active");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let dotX = mouseX;
    let dotY = mouseY;
    let prevX = mouseX;
    let prevY = mouseY;
    let speed = 0;
    let angle = 0;
    let isHovered = false;
    let isPressed = false;
    let currentLabel = "";
    let rafId = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseX = e.clientX;
      mouseY = e.clientY;

      const target = e.target as HTMLElement | null;
      const interactive = target?.closest("a, button, [data-cursor]");
      if (interactive) {
        isHovered = true;
        currentLabel = interactive.getAttribute("data-cursor") || "";
        setUniverseHover(1, currentLabel || null);
      } else {
        isHovered = false;
        currentLabel = "";
        setUniverseHover(0, null);
      }
    };

    const onDown = () => {
      isPressed = true;
    };

    const onUp = () => {
      isPressed = false;
    };

    const onLeave = () => {
      if (outerRef.current) outerRef.current.style.opacity = "0";
      if (innerRef.current) innerRef.current.style.opacity = "0";
    };

    const onEnter = () => {
      if (outerRef.current) outerRef.current.style.opacity = "1";
      if (innerRef.current) innerRef.current.style.opacity = "1";
    };

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      const dx = mouseX - curX;
      const dy = mouseY - curY;
      curX += dx * 0.18;
      curY += dy * 0.18;
      dotX += (mouseX - dotX) * 0.58;
      dotY += (mouseY - dotY) * 0.58;

      // Dynamic velocity & direction for liquid lens distortion
      const vx = mouseX - prevX;
      const vy = mouseY - prevY;
      prevX = mouseX;
      prevY = mouseY;
      const curSpeed = Math.sqrt(vx * vx + vy * vy);
      speed += (curSpeed - speed) * 0.2;
      if (curSpeed > 1.2) {
        angle = Math.atan2(vy, vx);
      }

      const outer = outerRef.current;
      const inner = innerRef.current;
      const lbl = labelRef.current;

      if (outer) {
        const baseScale = isPressed ? 0.78 : isHovered ? (currentLabel ? 2.1 : 1.55) : 1;
        const stretch = 1 + Math.min(speed * 0.012, 0.42);
        const squeeze = 1 / Math.sqrt(stretch);

        outer.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%) rotate(${angle}rad) scale(${baseScale * stretch}, ${baseScale * squeeze}) rotate(${-angle}rad)`;
        outer.style.borderColor = isHovered
          ? "rgba(180, 107, 255, 0.95)"
          : speed > 8
          ? "rgba(255, 255, 255, 0.65)"
          : "rgba(217, 217, 226, 0.45)";
        outer.style.backgroundColor = isHovered
          ? "rgba(135, 55, 255, 0.16)"
          : speed > 10
          ? "rgba(180, 107, 255, 0.08)"
          : "transparent";
      }

      if (inner) {
        const dotScale = isPressed ? 1.4 : isHovered ? 0.45 : 1;
        inner.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) scale(${dotScale})`;
      }

      if (lbl) {
        lbl.textContent = currentLabel;
        lbl.style.opacity = isHovered && currentLabel ? "1" : "0";
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("cxr-cursor-active");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden="true">
      {/* Outer Chromatic Reticle */}
      <div
        ref={outerRef}
        className="fixed top-0 left-0 w-9 h-9 rounded-full border border-[#D9D9E2]/40 transition-[border-color,background-color] duration-200 flex items-center justify-center will-change-transform"
        style={{
          boxShadow: "0 0 18px rgba(135, 55, 255, 0.25)",
        }}
      >
        <span
          ref={labelRef}
          className="font-mono text-[6.5px] uppercase tracking-[0.2em] text-white font-bold transition-opacity duration-150 opacity-0 select-none"
        />
      </div>

      {/* Inner Precision Core */}
      <div
        ref={innerRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white will-change-transform"
        style={{
          boxShadow: "0 0 10px rgba(180, 107, 255, 0.9)",
        }}
      />
    </div>
  );
}
