"use client";

import { useEffect, useRef } from "react";

interface Star3D {
  x: number;
  y: number;
  z: number; // Depth distance [100 .. 1500]
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

    const starCount = isMobile ? 140 : 380;
    const stars: Star3D[] = [];

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let animationFrameId: number;

    let scrollY = window.scrollY;
    let targetScrollY = window.scrollY;
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let lastTime = performance.now();

    const maxDepth = 1200;
    const baseSpeed = prefersReducedMotion ? 0 : 0.85;

    // Palette: crisp white, bright silver, soft violet, neon purple
    const starColors = [
      "#ffffff",
      "#f3e8ff", // soft purple-white
      "#e9d5ff", // light purple
      "#d8b4fe", // violet
      "#c084fc", // neon purple
      "#e2e8f0", // silver
    ];

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        const z = Math.random() * maxDepth + 1;
        stars.push({
          x: (Math.random() - 0.5) * width * 2.2,
          y: (Math.random() - 0.5) * height * 2.2,
          z,
          prevZ: z,
          size: Math.random() * 1.5 + 0.8,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
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

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - cx) * 0.08;
      targetMouseY = (e.clientY - cy) * 0.08;
    };
    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    // Render loop
    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Scroll speed calculation for interactive boost
      const scrollDiff = targetScrollY - scrollY;
      scrollY += scrollDiff * 0.1;
      scrollVelocity = (scrollY - lastScrollY) * 0.4;
      lastScrollY = scrollY;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Glowing Purple & Violet Nebulae
      // Top-left violet cosmic light
      const g1 = ctx.createRadialGradient(
        width * 0.2 + mouseX * 0.5,
        height * 0.25 + mouseY * 0.5,
        20,
        width * 0.2,
        height * 0.25,
        width * 0.65
      );
      g1.addColorStop(0, "rgba(147, 51, 234, 0.09)"); // Purple glow
      g1.addColorStop(0.5, "rgba(99, 102, 241, 0.04)"); // Indigo
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Bottom-right deep amethyst nebula
      const g2 = ctx.createRadialGradient(
        width * 0.8 - mouseX * 0.4,
        height * 0.7 - mouseY * 0.4,
        30,
        width * 0.8,
        height * 0.7,
        width * 0.55
      );
      g2.addColorStop(0, "rgba(168, 85, 247, 0.07)");
      g2.addColorStop(0.6, "rgba(79, 70, 229, 0.03)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Stars Flight Simulation with Scroll Reaction
      const effectiveSpeed = (baseSpeed + Math.abs(scrollVelocity) * 0.06) * 60 * delta;
      const fov = 340;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.prevZ = star.z;
        star.z -= effectiveSpeed * 3.5;

        // Reset if passed camera
        if (star.z <= 1) {
          star.z = maxDepth;
          star.prevZ = maxDepth;
          star.x = (Math.random() - 0.5) * width * 2.2;
          star.y = (Math.random() - 0.5) * height * 2.2;
        }

        // 3D perspective projection
        const k = fov / star.z;
        const px = star.x * k + cx - mouseX * (1 - star.z / maxDepth);
        const py = star.y * k + cy - mouseY * (1 - star.z / maxDepth);

        // Previous position for smooth speed streaks during fast scroll
        const prevK = fov / star.prevZ;
        const prevPx = star.x * prevK + cx - mouseX * (1 - star.prevZ / maxDepth);
        const prevPy = star.y * prevK + cy - mouseY * (1 - star.prevZ / maxDepth);

        // Offscreen check
        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        // Alpha based on depth: closer is brighter
        const depthAlpha = Math.max(0.1, 1 - star.z / maxDepth);
        star.twinkle += star.twinkleSpeed;
        const twinkleAlpha = Math.sin(star.twinkle) * 0.2 + 0.8;
        const alpha = Math.min(1, depthAlpha * twinkleAlpha);

        const currentSize = Math.max(0.6, (1 - star.z / maxDepth) * star.size * 2.2);

        ctx.strokeStyle = star.color;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;

        // If scrolling fast, draw light streak line for 3D warp feel
        if (Math.abs(scrollVelocity) > 2) {
          ctx.lineWidth = currentSize;
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fill();

          // Delicate purple glow around bright near stars
          if (star.z < 280 && !isMobile) {
            ctx.beginPath();
            ctx.arc(px, py, currentSize * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(192, 132, 252, 0.2)";
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
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full select-none"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  );
}
