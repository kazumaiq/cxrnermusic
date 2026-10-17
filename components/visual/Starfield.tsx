"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive Fullscreen 3D Starfield in Cyber-Dark / Sci-Fi aesthetic (dynexmusic.com style).
 * 
 * Features:
 * 1. Fixed fullscreen canvas (position: fixed, inset: 0, pointer-events: none, z-index: -1).
 * 2. Scene clear color: deep cosmic void black #020204.
 * 3. PerspectiveCamera: FOV 45 (desktop) / 58 (mobile), near: 0.5, far: 8000.
 * 4. Adaptive DPR: Math.min(devicePixelRatio, 1.5) desktop, 1.1 mobile.
 * 5. Page Visibility API: halts animation loop when tab is hidden.
 * 6. 4-Layer Starfield Depth:
 *    - Layer 1: Deep Stars (1100 desktop / 180 mobile, box 4500x3000x8000, 1.2px, opacity 0.5, monochrome)
 *    - Layer 2: Mid Stars (600 desktop / 100 mobile, box 3000x2000x7500, 1.8px, opacity 0.7, 3% Red, 3.5% Purple)
 *    - Layer 3: Near Stars (200 desktop / 40 mobile, box 1600x1200x7000, 2.5px, opacity 0.85, 4% Red, 4% Purple)
 *    - Layer 4: Foreground Micro-Sparks (50 desktop / 15 mobile, box 750x600x6000, 3.5px, opacity 0.95, 6% Red, 6% Purple)
 * 7. BufferGeometry with Float32Array positions and colors.
 * 8. Mouse parallax with smooth lerp & subtle camera tilt (desktop only).
 * 9. Scroll Z-travel moving camera through tunnel (Z = 0 down to Z = -5500) via Cosine S-curve.
 * 10. Atmospheric lighting: ambientLight (#D8D8D5, 0.45), directionalLight (#F2F2EE, 0.85),
 *     and two moving point lights (Red #E61924, Purple #8B5CF6) following camera.
 * 11. Complete disposal of geometries, materials, textures, and renderer on unmount.
 */
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect environment & device type
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();

    // 2. CAMERA SETUP
    const fov = isMobile ? 58 : 45;
    const camera = new THREE.PerspectiveCamera(
      fov,
      width / Math.max(height, 1),
      0.5,
      8000
    );
    camera.position.set(0, 0, 0);

    // 3. RENDERER SETUP
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x020204, 1.0);
    const dpr = isMobile ? 1.1 : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);

    // 4. ATMOSPHERIC LIGHTING
    const ambientLight = new THREE.AmbientLight(0xd8d8d5, 0.45);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xf2f2ee, 0.85);
    directionalLight.position.set(0, 1000, 1000);
    scene.add(directionalLight);

    // Dynamic point lights that follow the camera
    const redLight = new THREE.PointLight(0xe61924, 1.2, 180);
    const purpleLight = new THREE.PointLight(0x8b5cf6, 0.65, 240);
    scene.add(redLight);
    scene.add(purpleLight);

    // Helper: generate soft circular glow particle texture in memory
    const createCircleTexture = () => {
      const texCanvas = document.createElement("canvas");
      texCanvas.width = 64;
      texCanvas.height = 64;
      const ctx = texCanvas.getContext("2d");
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
      grad.addColorStop(0.55, "rgba(255, 255, 255, 0.35)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.needsUpdate = true;
      return texture;
    };

    const particleTexture = createCircleTexture();

    // 5. 4-LAYER STARFIELD GENERATION
    interface LayerConfig {
      count: number;
      boxX: number;
      boxY: number;
      boxZ: number;
      size: number;
      opacity: number;
      colorGenerator: (index: number, count: number) => [number, number, number];
      rotSpeed: number;
    }

    const signalRed = new THREE.Color("#EB1A26");
    const cyberPurple = new THREE.Color("#A661FA");
    const nearRed = new THREE.Color("#F21F2E");
    const nearPurple = new THREE.Color("#B36CFF");
    const neonRed = new THREE.Color("#FF1E27");
    const brightPurple = new THREE.Color("#BF55EC");
    const pureWhite = new THREE.Color(1, 1, 1);

    const layerConfigs: LayerConfig[] = [
      // Layer 1: Deep Stars (far cosmic background)
      {
        count: isMobile ? 180 : 1100,
        boxX: 4500,
        boxY: 3000,
        boxZ: 8000,
        size: 1.2,
        opacity: 0.5,
        colorGenerator: () => {
          // Monochrome brightness from 0.25 to 0.60
          const b = 0.25 + Math.random() * 0.35;
          return [b, b, b];
        },
        rotSpeed: 0.002,
      },
      // Layer 2: Mid Stars (main volume)
      {
        count: isMobile ? 100 : 600,
        boxX: 3000,
        boxY: 2000,
        boxZ: 7500,
        size: 1.8,
        opacity: 0.7,
        colorGenerator: () => {
          const rand = Math.random();
          if (rand < 0.03) {
            return [signalRed.r, signalRed.g, signalRed.b];
          } else if (rand < 0.065) {
            return [cyberPurple.r, cyberPurple.g, cyberPurple.b];
          }
          // Neutral silver-white
          const w = 0.82 + Math.random() * 0.18;
          return [w, w, Math.min(1, w + 0.05)];
        },
        rotSpeed: 0.005,
      },
      // Layer 3: Near Stars (closer presence)
      {
        count: isMobile ? 40 : 200,
        boxX: 1600,
        boxY: 1200,
        boxZ: 7000,
        size: 2.5,
        opacity: 0.85,
        colorGenerator: () => {
          const rand = Math.random();
          if (rand < 0.04) {
            return [nearRed.r, nearRed.g, nearRed.b];
          } else if (rand < 0.08) {
            return [nearPurple.r, nearPurple.g, nearPurple.b];
          }
          return [pureWhite.r, pureWhite.g, pureWhite.b];
        },
        rotSpeed: 0.008,
      },
      // Layer 4: Foreground Micro-Sparks (floating close)
      {
        count: isMobile ? 15 : 50,
        boxX: 750,
        boxY: 600,
        boxZ: 6000,
        size: 3.5,
        opacity: 0.95,
        colorGenerator: () => {
          const rand = Math.random();
          if (rand < 0.06) {
            return [neonRed.r, neonRed.g, neonRed.b];
          } else if (rand < 0.12) {
            return [brightPurple.r, brightPurple.g, brightPurple.b];
          }
          return [1, 1, 1];
        },
        rotSpeed: 0.015,
      },
    ];

    const starMeshes: {
      points: THREE.Points;
      geometry: THREE.BufferGeometry;
      material: THREE.PointsMaterial;
      rotSpeed: number;
    }[] = [];

    layerConfigs.forEach((cfg) => {
      const positions = new Float32Array(cfg.count * 3);
      const colors = new Float32Array(cfg.count * 3);

      for (let i = 0; i < cfg.count; i++) {
        // Distribute within box bounds along the camera travel tunnel
        // Camera travels from Z = 0 to Z = -5500
        positions[i * 3] = (Math.random() - 0.5) * cfg.boxX;
        positions[i * 3 + 1] = (Math.random() - 0.5) * cfg.boxY;
        positions[i * 3 + 2] = (Math.random() - 0.5) * cfg.boxZ - 2500;

        const [r, g, b] = cfg.colorGenerator(i, cfg.count);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: cfg.size,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: cfg.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: particleTexture || undefined,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      starMeshes.push({
        points,
        geometry,
        material,
        rotSpeed: cfg.rotSpeed,
      });
    });

    // 6. CAMERA RIG, MOUSE PARALLAX & SCROLL INTERACTION
    let pointerX = 0;
    let pointerY = 0;
    let targetCameraX = 0;
    let targetCameraY = 0;
    let targetCameraZ = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    const onPointerMove = (e: MouseEvent) => {
      // Normalized pointer coordinates [-1, 1]
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = (e.clientY / window.innerHeight) * 2 - 1;

      // Parallax target positions
      targetCameraX = pointerX * 80;
      targetCameraY = -pointerY * 60;

      // Subtle tilt in the direction of cursor
      targetTiltY = -pointerX * 0.025;
      targetTiltX = pointerY * 0.018;
    };

    if (!isMobile) {
      window.addEventListener("mousemove", onPointerMove, { passive: true });
    }

    // Scroll tracking
    const updateScrollProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      // Smooth Cosine S-curve from Z = 0 into Z = -5200
      const sCurve = (1 - Math.cos(progress * Math.PI)) / 2;
      targetCameraZ = -sCurve * 5200;
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    // Handle Window Resize
    const onResize = () => {
      if (!canvas || !renderer) return;
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      camera.aspect = newW / Math.max(newH, 1);
      camera.fov = isMobile ? 58 : 45;
      camera.updateProjectionMatrix();

      const newDpr = isMobile ? 1.1 : Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(newDpr);
      renderer.setSize(newW, newH);
      updateScrollProgress();
    };

    window.addEventListener("resize", onResize, { passive: true });

    // 7. PAGE VISIBILITY API & RENDER LOOP
    let animationFrameId = 0;
    let lastTime = performance.now();
    let isRendering = true;

    const render = (time: number) => {
      if (!isRendering) return;
      animationFrameId = requestAnimationFrame(render);

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Rotate star layers independently
      const timeSec = time * 0.001;
      for (let i = 0; i < starMeshes.length; i++) {
        const item = starMeshes[i];
        item.points.rotation.y = timeSec * item.rotSpeed;
      }

      // Camera Rig physics
      const lerpSpeed = Math.min(delta * 3.0, 0.25);

      if (!isMobile) {
        camera.position.x += (targetCameraX - camera.position.x) * lerpSpeed;
        camera.position.y += (targetCameraY - camera.position.y) * lerpSpeed;
        camera.rotation.y += (targetTiltY - camera.rotation.y) * lerpSpeed;
        camera.rotation.x += (targetTiltX - camera.rotation.x) * lerpSpeed;
      }

      // Scroll Z-travel interpolation
      camera.position.z += (targetCameraZ - camera.position.z) * lerpSpeed;

      // Move Point Lights along with Camera
      redLight.position.set(
        camera.position.x - 35,
        camera.position.y + 20,
        camera.position.z - 30
      );
      purpleLight.position.set(
        camera.position.x + 35,
        camera.position.y - 20,
        camera.position.z - 40
      );

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        isRendering = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      } else {
        isRendering = true;
        lastTime = performance.now();
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    // 8. DISPOSAL AND CLEANUP
    return () => {
      isRendering = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateScrollProgress);
      if (!isMobile) {
        window.removeEventListener("mousemove", onPointerMove);
      }

      // Dispose lights
      scene.remove(ambientLight);
      ambientLight.dispose();
      scene.remove(directionalLight);
      directionalLight.dispose();
      scene.remove(redLight);
      redLight.dispose();
      scene.remove(purpleLight);
      purpleLight.dispose();

      // Dispose Starfield layers
      starMeshes.forEach((item) => {
        scene.remove(item.points);
        item.geometry.dispose();
        item.material.dispose();
      });

      if (particleTexture) {
        particleTexture.dispose();
      }

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none select-none w-full h-full"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: -1,
      }}
      aria-hidden="true"
    />
  );
}
