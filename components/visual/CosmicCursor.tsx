"use client";

import { useEffect, useRef, useState } from "react";
import { setUniverseHover } from "../../lib/universeBridge";

/**
 * Ambient Cosmic Reticle Halo (Desktop only).
 *
 * Designed for 0ms input lag:
 * - Native OS hardware cursor remains 100% active and instantaneous everywhere.
 * - Ambient cosmic ring gracefully floats around the native cursor as an aesthetic aura.
 * - Hover detection uses delegated pointerover/pointerout events (0% CPU cost on mousemove).
 * - Automatically disabled on touch / coarse-pointer devices and reduced-motion mode.
 */
export default function CosmicCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    setEnabled(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let isHovered = false;
    let isPressed = false;
    let currentLabel = "";
    let isVisible = false;
    let rafId = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        curX = mouseX;
        curY = mouseY;
        if (outerRef.current) outerRef.current.style.opacity = "1";
      }
    };

    const onPointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest?.("a, button, [data-cursor]");
      if (interactive) {
        isHovered = true;
        currentLabel = interactive.getAttribute("data-cursor") || "";
        setUniverseHover(1, currentLabel || null);
      }
    };

    const onPointerOut = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest?.("a, button, [data-cursor]");
      if (interactive) {
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
      isVisible = false;
      if (outerRef.current) outerRef.current.style.opacity = "0";
    };

    const onEnter = () => {
      isVisible = true;
      if (outerRef.current) outerRef.current.style.opacity = "1";
    };

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      if (!isVisible) return;

      // Snappy and responsive damping (0.35 factor) - stays tight to the cursor
      curX += (mouseX - curX) * 0.35;
      curY += (mouseY - curY) * 0.35;

      const outer = outerRef.current;
      const lbl = labelRef.current;

      if (outer) {
        const baseScale = isPressed ? 0.75 : isHovered ? (currentLabel ? 1.7 : 1.35) : 1;
        outer.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%) scale(${baseScale})`;
        outer.style.borderColor = isHovered
          ? "rgba(180, 107, 255, 0.85)"
          : "rgba(217, 217, 226, 0.35)";
        outer.style.backgroundColor = isHovered
          ? "rgba(135, 55, 255, 0.12)"
          : "rgba(180, 107, 255, 0.03)";
      }

      if (lbl) {
        if (isHovered && currentLabel) {
          lbl.textContent = currentLabel;
          lbl.style.opacity = "1";
        } else {
          lbl.style.opacity = "0";
        }
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden="true">
      {/* Ambient Luminous Follower Ring */}
      <div
        ref={outerRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#D9D9E2]/35 transition-[border-color,background-color] duration-150 flex items-center justify-center will-change-transform opacity-0 pointer-events-none"
        style={{
          boxShadow: "0 0 14px rgba(135, 55, 255, 0.2)",
        }}
      >
        <span
          ref={labelRef}
          className="font-mono text-[7px] uppercase tracking-[0.2em] text-white font-bold transition-opacity duration-150 opacity-0 select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
