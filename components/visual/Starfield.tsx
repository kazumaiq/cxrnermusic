"use client";

import { useEffect, useRef } from "react";

interface Star3D {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  color: string;
  twinkle: number;
  twinkleSpeed: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const starCount = isMobile ? 300 : 550;
    const stars: Star3D[] = [];

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let animationFrameId: number;

    let scrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollImpulse = 0;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let lastTime = performance.now();

    const maxDepth = 1000;
    const baseSpeed = prefersReducedMotion ? 0 : 0.9;

    // High-visibility luminous palette: bright white, electric violet, neon purple, bright silver, cyan-white
    const starColors = [
      "#ffffff",
      "#ffffff",
      "#fdf4ff",
      "#f3e8ff",
      "#e9d5ff",
      "#d8b4fe",
      "#c084fc",
      "#a855f7",
      "#a5b4fc",
      "#e0e7ff",
    ];

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        const z = Math.random() * maxDepth + 1;
        stars.push({
          x: (Math.random() - 0.5) * width * 3.0,
          y: (Math.random() - 0.5) * height * 3.0,
          z,
          prevZ: z,
          size: Math.random() * 2.2 + 1.2, // Crisp, easily visible star size
          color: starColors[Math.floor(Math.random() * starColors.length)],
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.05 + 0.02,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initStars();
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    let lastScrollTimestamp = performance.now();
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const now = performance.now();
      const dt = Math.max((now - lastScrollTimestamp) / 1000, 0.016);
      lastScrollTimestamp = now;

      const deltaY = currentScrollY - scrollY;
      scrollY = currentScrollY;

      // Add immediate scroll impulse
      scrollImpulse = deltaY / dt * 0.003;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - cx) * 0.08;
      targetMouseY = (e.clientY - cy) * 0.08;
    };
    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    // 60FPS Render Loop
    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth decay of scroll velocity and impulse
      scrollVelocity += (scrollImpulse - scrollVelocity) * 0.2;
      scrollImpulse *= 0.88;

      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // 1. Glowing Violet & Indigo Space Nebulae
      const g1 = ctx.createRadialGradient(
        width * 0.25 + mouseX * 0.3,
        height * 0.35 + mouseY * 0.3,
        40,
        width * 0.25,
        height * 0.35,
        width * 0.65
      );
      g1.addColorStop(0, "rgba(147, 51, 234, 0.18)"); // Vivid purple bloom
      g1.addColorStop(0.5, "rgba(99, 102, 241, 0.08)");
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(
        width * 0.8 - mouseX * 0.3,
        height * 0.65 - mouseY * 0.3,
        50,
        width * 0.8,
        height * 0.65,
        width * 0.6
      );
      g2.addColorStop(0, "rgba(168, 85, 247, 0.15)");
      g2.addColorStop(0.6, "rgba(124, 58, 237, 0.06)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Stars Flight Simulation with Scroll Reaction
      // User scrolls down -> stars rush toward the viewer with light streaks
      // User scrolls up -> stars reverse through the void
      const absVelocity = Math.abs(scrollVelocity);
      const warpSpeed = Math.min(absVelocity * 3.5, 25);
      const speed = (baseSpeed + warpSpeed) * 60 * delta;
      const fov = 340;
      const isWarping = warpSpeed > 0.15;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.prevZ = star.z;
        // Direction follows scroll: forward flight with acceleration
        star.z -= speed * 4.0;

        // Reset star if it passes the camera or goes beyond bounds
        if (star.z <= 2) {
          star.z = maxDepth;
          star.prevZ = maxDepth;
          star.x = (Math.random() - 0.5) * width * 3.0;
          star.y = (Math.random() - 0.5) * height * 3.0;
        } else if (star.z > maxDepth) {
          star.z = 2;
          star.prevZ = 2;
        }

        // 3D perspective projection
        const k = fov / star.z;
        const px = star.x * k + cx - mouseX * (1 - star.z / maxDepth);
        const py = star.y * k + cy - mouseY * (1 - star.z / maxDepth);

        // Previous point for light streak effect
        const prevK = fov / star.prevZ;
        const prevPx = star.x * prevK + cx - mouseX * (1 - star.prevZ / maxDepth);
        const prevPy = star.y * prevK + cy - mouseY * (1 - star.prevZ / maxDepth);

        if (px < -50 || px > width + 50 || py < -50 || py > height + 50) {
          continue;
        }

        // Visibility & Brightness calculation
        const depthRatio = 1 - star.z / maxDepth;
        const depthAlpha = Math.max(0.25, depthRatio);
        star.twinkle += star.twinkleSpeed;
        const twinkleAlpha = Math.sin(star.twinkle) * 0.2 + 0.8;
        const alpha = Math.min(1, depthAlpha * twinkleAlpha);

        const currentSize = Math.max(1.2, depthRatio * star.size * 2.2);

        ctx.strokeStyle = star.color;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;

        // When scrolling/warping, draw distinct 3D motion streaks
        if (isWarping && Math.hypot(px - prevPx, py - prevPy) > 1.2) {
          ctx.lineWidth = Math.max(1.4, currentSize * 1.1);
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.stroke();
        } else {
          // Idle floating star with crisp core
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fill();

          // Luminous aura for closer stars
          if (star.z < 450) {
            ctx.beginPath();
            ctx.arc(px, py, currentSize * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(192, 132, 252, 0.28)";
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (!isMobile) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none w-full h-full select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
