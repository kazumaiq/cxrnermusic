"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number; // 0 (far) to 1 (near)
  size: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface PulseFlare {
  x: number;
  y: number;
  size: number;
  maxSize: number;
  alpha: number;
  speed: number;
  points: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Low performance detection
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const starCount = isMobile ? 120 : 320;
    const stars: Star[] = [];
    const flares: PulseFlare[] = [];

    let width = 0;
    let height = 0;
    let animationFrameId: number;
    let scrollY = window.scrollY;
    let targetScrollY = window.scrollY;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let lastTime = performance.now();

    // Initialize stars across 3 distinct depth layers
    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        const z = Math.random(); // 0 = far, 1 = near
        // Near stars are larger, brighter, faster
        const size = z > 0.85 ? Math.random() * 1.8 + 1.2 : Math.random() * 1.2 + 0.5;
        const baseAlpha = z > 0.85 ? Math.random() * 0.4 + 0.5 : Math.random() * 0.3 + 0.15;
        
        // Colors: pure white, ice silver, subtle cold metallic
        let color = "#ffffff";
        if (z < 0.3) {
          color = "#999999";
        } else if (Math.random() > 0.8) {
          color = "#e2e8f0"; // silver
        } else if (Math.random() > 0.95) {
          color = "#f8fafc"; // bright white
        }

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          size,
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: Math.random() * 0.003 + 0.001,
          twinkleOffset: Math.random() * Math.PI * 2,
          color,
        });
      }
    };

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initStars();
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    // Scroll listener for parallax
    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Subtle cursor float
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 40;
      targetMouseY = (e.clientY / height - 0.5) * 40;
    };
    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    // Occasional starburst flares
    const spawnFlare = () => {
      if (flares.length >= 3 || isMobile) return;
      flares.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0,
        maxSize: Math.random() * 30 + 20,
        alpha: 0,
        speed: Math.random() * 0.015 + 0.01,
        points: Math.random() > 0.5 ? 4 : 8,
      });
    };

    let flareInterval: any;
    if (!isMobile) {
      flareInterval = setInterval(spawnFlare, 6000);
    }

    // Main render loop
    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Smooth scroll parallax lerp
      scrollY += (targetScrollY - scrollY) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle monochromatic nebulae / cosmic cloud drifts
      const g1 = ctx.createRadialGradient(
        width * 0.25 + mouseX * 0.3,
        height * 0.3 + mouseY * 0.3,
        10,
        width * 0.25,
        height * 0.3,
        width * 0.5
      );
      g1.addColorStop(0, "rgba(255, 255, 255, 0.018)");
      g1.addColorStop(0.5, "rgba(180, 190, 205, 0.008)");
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(
        width * 0.8 - mouseX * 0.2,
        height * 0.7 - mouseY * 0.2,
        20,
        width * 0.8,
        height * 0.7,
        width * 0.45
      );
      g2.addColorStop(0, "rgba(255, 255, 255, 0.014)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Stars with multi-layer depth & parallax
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Idle floating speed based on depth
        if (!prefersReducedMotion) {
          star.y -= (star.z * 10 + 2) * delta;
          if (star.y < 0) {
            star.y = height;
            star.x = Math.random() * width;
          }
        }

        // Parallax offset: near stars move more with scroll & mouse
        const parallaxScroll = (scrollY * star.z * 0.25) % height;
        let drawY = star.y - parallaxScroll;
        if (drawY < 0) drawY += height;
        if (drawY > height) drawY -= height;

        const drawX = star.x - mouseX * star.z;

        // Twinkle
        const twinkle = Math.sin(now * star.twinkleSpeed + star.twinkleOffset);
        const currentAlpha = Math.max(
          0.05,
          star.baseAlpha + twinkle * (star.z > 0.8 ? 0.35 : 0.15)
        );

        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;

        // Draw star
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra subtle glow for brightest near stars
        if (star.z > 0.9 && !isMobile) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.size * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.fill();
        }
      }

      // 3. Render rare animated diffraction starburst flares
      for (let j = flares.length - 1; j >= 0; j--) {
        const flare = flares[j];
        flare.size += flare.speed * 25;
        if (flare.size < flare.maxSize * 0.5) {
          flare.alpha = Math.min(1, flare.alpha + 0.05);
        } else {
          flare.alpha -= 0.03;
        }

        if (flare.alpha <= 0) {
          flares.splice(j, 1);
          continue;
        }

        ctx.save();
        ctx.translate(flare.x, flare.y);
        ctx.globalAlpha = flare.alpha * 0.7;

        // Central white core
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Cross rays
        const rayLen = flare.size;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 1;

        // 4 main rays
        ctx.beginPath();
        ctx.moveTo(-rayLen, 0);
        ctx.lineTo(rayLen, 0);
        ctx.moveTo(0, -rayLen);
        ctx.lineTo(0, rayLen);
        ctx.stroke();

        // 4 diagonal rays if 8 points
        if (flare.points === 8) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          const diagLen = rayLen * 0.55;
          ctx.beginPath();
          ctx.moveTo(-diagLen, -diagLen);
          ctx.lineTo(diagLen, diagLen);
          ctx.moveTo(-diagLen, diagLen);
          ctx.lineTo(diagLen, -diagLen);
          ctx.stroke();
        }

        ctx.restore();
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
        clearInterval(flareInterval);
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
