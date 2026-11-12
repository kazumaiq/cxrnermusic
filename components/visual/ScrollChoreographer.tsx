"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SECTIONS = [
  { id: "hero", code: "01", label: "CORE" },
  { id: "about", code: "02", label: "ABOUT" },
  { id: "releases", code: "03", label: "RELEASES" },
  { id: "artists", code: "04", label: "ARTISTS" },
  { id: "distribution", code: "05", label: "NETWORK" },
  { id: "why-cxrner", code: "06", label: "ADVANTAGES" },
  { id: "send-release", code: "07", label: "PORTAL" },
];

/**
 * GSAP + ScrollTrigger narrative choreography for the home universe,
 * paired with a subtle desktop section telemetry rail.
 */
export default function ScrollChoreographer() {
  const [activeId, setActiveId] = useState("hero");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // 1. Masked Headline Reveals
        gsap.utils.toArray<HTMLElement>("[data-reveal='mask-line']").forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: 105, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.95,
              ease: "power4.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
            }
          );
        });

        // 2. Clip-path Photo / Cover Reveals
        gsap.utils.toArray<HTMLElement>("[data-reveal='clip-photo']").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(14% 8% 14% 8% round 20px)", opacity: 0.35, scale: 0.96 },
            {
              clipPath: "inset(0% 0% 0% 0% round 20px)",
              opacity: 1,
              scale: 1,
              duration: 1.05,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 86%",
                once: true,
              },
            }
          );
        });

        // 3. Staggered Architectural Blocks
        gsap.utils.toArray<HTMLElement>("[data-reveal='stagger-group']").forEach((group) => {
          const items = group.querySelectorAll("[data-stagger-item]");
          if (!items.length) return;
          gsap.fromTo(
            items,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: group,
                start: "top 84%",
                once: true,
              },
            }
          );
        });

        // 4. Scrubbed Horizontal Massive Typography Drift
        gsap.utils.toArray<HTMLElement>("[data-scrub-x]").forEach((el) => {
          const dir = Number(el.getAttribute("data-scrub-x") || "1");
          gsap.fromTo(
            el,
            { xPercent: -8 * dir },
            {
              xPercent: 8 * dir,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.1,
              },
            }
          );
        });

        // 5. Scrubbed Vertical Depth Parallax
        gsap.utils.toArray<HTMLElement>("[data-parallax-y]").forEach((el) => {
          const amt = Number(el.getAttribute("data-parallax-y") || "40");
          gsap.fromTo(
            el,
            { y: amt },
            {
              y: -amt,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            }
          );
        });
      }

      // Section telemetry active tracker
      SECTIONS.forEach((sec) => {
        const el = document.getElementById(sec.id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 45%",
          end: "bottom 45%",
          onEnter: () => setActiveId(sec.id),
          onEnterBack: () => setActiveId(sec.id),
        });
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <aside
      aria-label="Навигация по секциям"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-3 pointer-events-auto"
    >
      {SECTIONS.map((sec) => {
        const active = activeId === sec.id;
        return (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            data-cursor={sec.code}
            className="group flex items-center gap-2.5 py-0.5"
          >
            <span
              className={`font-mono text-[9px] uppercase tracking-[0.24em] transition-all duration-300 ${
                active
                  ? "text-white opacity-100 translate-x-0"
                  : "text-[#D9D9E2]/45 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
              }`}
            >
              {sec.label}
            </span>
            <span
              className={`h-[2px] transition-all duration-300 rounded-full ${
                active
                  ? "w-7 bg-[#B46BFF] shadow-[0_0_12px_rgba(180,107,255,0.85)]"
                  : "w-3 bg-white/25 group-hover:w-5 group-hover:bg-white/65"
              }`}
            />
          </a>
        );
      })}
    </aside>
  );
}
