"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Disc3, Volume2, VolumeX, RotateCw, Pause, Play } from "lucide-react";

interface VinylCanvasProps {
  featuredTitle?: string;
  featuredArtist?: string;
  featuredCover?: string;
}

export default function VinylCanvas({
  featuredTitle = "BREAKTHROUGH",
  featuredArtist = "UNXPLXYA",
  featuredCover,
}: VinylCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rpm, setRpm] = useState<33 | 45>(33);
  const [webGlLoaded, setWebGlLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // References to pass state into render loop without re-instantiating WebGL
  const targetSpeedRef = useRef<number>((33 / 60) * Math.PI * 2);
  const currentSpeedRef = useRef<number>((33 / 60) * Math.PI * 2);

  useEffect(() => {
    if (!isPlaying) {
      targetSpeedRef.current = 0;
    } else {
      targetSpeedRef.current = (rpm / 60) * Math.PI * 2;
    }
  }, [isPlaying, rpm]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebGlLoaded(false);
      return;
    }

    let animationFrameId: number;
    const scene = new THREE.Scene();

    // Perspective Camera with dynamic responsive distance calculation
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    const initialWidth = container.clientWidth || 500;
    const initialHeight = container.clientHeight || 500;
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // Clear previous canvas
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Master Group for 3D Vinyl
    const vinylGroup = new THREE.Group();
    // Dramatic isometric studio angle: reveals surface grooves AND 180g edge profile
    const baseRotX = 0.52;
    const baseRotY = -0.24;
    vinylGroup.rotation.x = baseRotX;
    vinylGroup.rotation.y = baseRotY;
    vinylGroup.scale.set(0.9, 0.9, 0.9); // Initial scale for smooth load entrance
    scene.add(vinylGroup);

    // ==============================================================
    // 1. PROCEDURAL 2048x2048 ANISOTROPIC VINYL GROOVES & BUMP TEXTURE
    // ==============================================================
    const texSize = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Deep lustrous black obsidian base
      ctx.fillStyle = "#070707";
      ctx.fillRect(0, 0, texSize, texSize);

      const cx = texSize / 2;
      const cy = texSize / 2;

      // Draw two dual-lobe anisotropic specular sheen gradients
      // This replicates the light reflecting off micro-grooves at 45-degree angles
      for (let angle = 0; angle < Math.PI * 2; angle += 0.008) {
        // High intensity at ~45° and ~225° angles, and ~135° / 315°
        const intensity1 = Math.pow(Math.cos(angle * 2 - 0.4), 6);
        const intensity2 = Math.pow(Math.cos(angle * 2 + 1.2), 8) * 0.5;
        const sheen = Math.max(0, intensity1 + intensity2);

        if (sheen > 0.05) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, 980, angle - 0.005, angle + 0.005);
          ctx.closePath();
          ctx.fillStyle = `rgba(220, 230, 245, ${sheen * 0.16})`;
          ctx.fill();
        }
      }

      // Three distinct song tracks with inter-track gap bands (like a real LP)
      const trackBands = [
        { start: 360, end: 540 },
        { start: 565, end: 750 },
        { start: 775, end: 960 },
      ];

      // Ultra-dense micro-grooves inside each track band
      trackBands.forEach((band) => {
        for (let r = band.start; r < band.end; r += 2.2) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          const grooveSheen = (Math.sin(r * 0.4) * 0.5 + 0.5) * 0.22 + 0.04;
          ctx.strokeStyle = `rgba(255, 255, 255, ${grooveSheen})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Inter-track silent gap rings (quieter, darker mirror sheen)
      [552, 762].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Run-out groove (dead wax zone)
      for (let r = 270; r < 350; r += 6) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Spiral lead-out groove cutting toward the center label
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.05) {
        const spiralR = 340 - a * 16;
        const sx = cx + Math.cos(a) * spiralR;
        const sy = cy + Math.sin(a) * spiralR;
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Hand-etched matrix / runout inscriptions
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.95);
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CXR-2026-A1  STEREO  //  MASTERDISK  NYC  //  [180G]", 0, -305);
      ctx.restore();

      // Outer lead-in guard edge groove
      ctx.beginPath();
      ctx.arc(cx, cy, 975, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    const vinylTexture = new THREE.CanvasTexture(canvas);
    vinylTexture.wrapS = THREE.ClampToEdgeWrapping;
    vinylTexture.wrapT = THREE.ClampToEdgeWrapping;

    // ==============================================================
    // 2. MULTI-MATERIAL 3D CYLINDER: SEPARATE PROFILE RIM & BEVEL
    // ==============================================================
    const discRadius = 1.5;
    const discThickness = 0.085; // Solid 180g audiophile pressing thickness

    const discGeometry = new THREE.CylinderGeometry(
      discRadius,
      discRadius,
      discThickness,
      128,
      4,
      false
    );

    // Material 0: Side rim (catching razor-sharp side reflections to show depth)
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.18,
      metalness: 0.92,
    });

    // Material 1 & 2: Top & bottom grooved faces
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: 0x090909,
      roughness: 0.22,
      metalness: 0.88,
      map: vinylTexture,
      bumpMap: vinylTexture,
      bumpScale: 0.015,
    });

    // Apply materials: [side, top, bottom]
    const discMaterials = [sideMaterial, faceMaterial, faceMaterial];
    const discMesh = new THREE.Mesh(discGeometry, discMaterials);
    discMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(discMesh);

    // Beveled outer rim (Torus lip) to catch bright silver grazing rim light
    const outerBevelGeom = new THREE.TorusGeometry(discRadius - 0.005, 0.018, 20, 128);
    const outerBevelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.15,
      metalness: 0.95,
    });
    const outerBevelMesh = new THREE.Mesh(outerBevelGeom, outerBevelMat);
    vinylGroup.add(outerBevelMesh);

    // ==============================================================
    // 3. CONTACT SHADOW & AMBIENT DEPTH BACKPLANE
    // ==============================================================
    // Placed slightly behind the disc (Z = -0.25) to cast depth onto background
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext("2d");
    if (sCtx) {
      const sGrad = sCtx.createRadialGradient(256, 256, 120, 256, 256, 250);
      sGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
      sGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.4)");
      sGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.06)"); // subtle silver edge aura
      sGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, 512, 512);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.position.z = -0.22;
    vinylGroup.add(shadowMesh);

    // ==============================================================
    // 4. MATTE CENTER LABEL & CHROME SPINDLE BUSHING
    // ==============================================================
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 1024;
    labelCanvas.height = 1024;
    const lCtx = labelCanvas.getContext("2d");
    if (lCtx) {
      // Matte charcoal paper finish
      lCtx.fillStyle = "#111111";
      lCtx.fillRect(0, 0, 1024, 1024);

      // Fine concentric silver rings
      lCtx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      lCtx.lineWidth = 4;
      lCtx.beginPath();
      lCtx.arc(512, 512, 475, 0, Math.PI * 2);
      lCtx.stroke();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      lCtx.lineWidth = 2;
      lCtx.beginPath();
      lCtx.arc(512, 512, 440, 0, Math.PI * 2);
      lCtx.stroke();

      // Outer track speed & format text
      lCtx.fillStyle = "rgba(255, 255, 255, 0.5)";
      lCtx.font = "bold 20px monospace";
      lCtx.textAlign = "center";
      lCtx.fillText("★ 180G AUDIOPHILE PRESSING • 33⅓ RPM STEREO ★", 512, 190);

      // CXRNER MUSIC Monogram & Main Title
      lCtx.fillStyle = "#FFFFFF";
      lCtx.font = "900 68px sans-serif";
      lCtx.letterSpacing = "6px";
      lCtx.fillText("C X R N E R", 512, 360);

      lCtx.fillStyle = "#A3A3A3";
      lCtx.font = "bold 22px monospace";
      lCtx.fillText("M U S I C   L A B E L", 512, 410);

      // Divider line
      lCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      lCtx.lineWidth = 2;
      lCtx.beginPath();
      lCtx.moveTo(312, 440);
      lCtx.lineTo(712, 440);
      lCtx.stroke();

      // Featured Track & Artist
      lCtx.fillStyle = "#FFFFFF";
      lCtx.font = "bold 34px sans-serif";
      lCtx.fillText(featuredTitle.toUpperCase(), 512, 610);

      lCtx.fillStyle = "#737373";
      lCtx.font = "bold 24px monospace";
      lCtx.fillText(`ARTIST: ${featuredArtist.toUpperCase()}`, 512, 660);

      // Catalog & Matrix specification
      lCtx.fillStyle = "#525252";
      lCtx.font = "bold 18px monospace";
      lCtx.fillText("[CAT::CXR-002A // SIDE A // STEREO]", 512, 820);

      // Center Spindle Hole & Bushing ring
      lCtx.fillStyle = "#000000";
      lCtx.beginPath();
      lCtx.arc(512, 512, 48, 0, Math.PI * 2);
      lCtx.fill();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      lCtx.lineWidth = 4;
      lCtx.stroke();
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelRadius = 0.52;
    // Slightly elevated cylinder for the label
    const labelGeometry = new THREE.CylinderGeometry(
      labelRadius,
      labelRadius,
      discThickness + 0.006,
      64
    );
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.5,
      metalness: 0.15,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(labelMesh);

    // 3D Metal Chrome Spindle Bushing
    const spindleGeometry = new THREE.CylinderGeometry(
      0.068,
      0.068,
      discThickness + 0.06,
      32
    );
    const spindleMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.08,
      metalness: 0.98,
    });
    const spindleMesh = new THREE.Mesh(spindleGeometry, spindleMaterial);
    spindleMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(spindleMesh);

    // ==============================================================
    // 5. CONTROLLED STUDIO LIGHTING: GRAZING RIM & HIGHLIGHTS
    // ==============================================================
    // Ambient fill keeps darks rich without washing out
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Key Light: Soft studio diffuse white illuminating the face
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
    keyLight.position.set(-5, 6, 6);
    scene.add(keyLight);

    // Rim Grazing Light: Razor-sharp silver light hitting the edge & outer bevel
    const rimLight = new THREE.DirectionalLight(0xffffff, 5.0);
    rimLight.position.set(5.5, -3.5, 3.2);
    scene.add(rimLight);

    // Counter Rim Light: Back bottom-left to outline silhouette
    const backRimLight = new THREE.DirectionalLight(0xd4d4d4, 3.2);
    backRimLight.position.set(-4, -6, 2.5);
    scene.add(backRimLight);

    // Dynamic pointer light catching the sound grooves interactively
    const cursorLight = new THREE.PointLight(0xffffff, 2.8, 14);
    cursorLight.position.set(0, 1.5, 4);
    scene.add(cursorLight);

    // ==============================================================
    // 6. RESPONSIVE CAMERA & ZERO-CLIPPING FRUSTUM GUARANTEE
    // ==============================================================
    // Bounding radius including disc, outer bevel, and margin
    const boundingSphereRadius = discRadius + 0.06; // ~1.56

    const updateCameraFrustum = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const aspect = width / height;
      camera.aspect = aspect;

      // 1.25 margin factor: record is visually dominant (large!),
      // while ensuring a comfortable 20-25% breathing room around all edges.
      const marginFactor = 1.22;
      const fovY = (camera.fov * Math.PI) / 180;

      const distVertical = (boundingSphereRadius * marginFactor) / Math.tan(fovY / 2);
      const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect);
      const distHorizontal = (boundingSphereRadius * marginFactor) / Math.tan(fovX / 2);

      const finalDist = Math.max(distVertical, distHorizontal, 4.9);
      camera.position.set(0, 0, finalDist);
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
    };

    updateCameraFrustum();

    const resizeObserver = new ResizeObserver(() => {
      updateCameraFrustum();
    });
    resizeObserver.observe(container);

    // ==============================================================
    // 7. INTERACTIVE PHYSICS, CURSOR TILT & SCROLL PARALLAX
    // ==============================================================
    let targetRotX = baseRotX;
    let targetRotY = baseRotY;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let scrollParallaxY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      lastPointerX = clientX;
      lastPointerY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();

      const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const my = -(((clientY - rect.top) / rect.height) * 2 - 1);

      cursorLight.position.x = mx * 3.2;
      cursorLight.position.y = my * 3.2 + 1;

      if (isDragging) {
        const dx = clientX - lastPointerX;
        const dy = clientY - lastPointerY;
        targetRotY += dx * 0.007;
        targetRotX += dy * 0.007;
        lastPointerX = clientX;
        lastPointerY = clientY;
      } else {
        targetRotY = baseRotY + mx * 0.32;
        targetRotX = baseRotX - my * 0.25;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onScroll = () => {
      const scroll = window.scrollY;
      // Gentle parallax tilt and lift as page scrolls down
      scrollParallaxY = Math.min(scroll * 0.0008, 0.3);
    };

    container.addEventListener("mousedown", onPointerDown);
    container.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    container.addEventListener("touchstart", onPointerDown, { passive: true });
    container.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);
    window.addEventListener("scroll", onScroll, { passive: true });

    // ==============================================================
    // 8. RENDER LOOP WITH RPM INERTIA & ENTRANCE ANIMATION
    // ==============================================================
    let rotationAngle = 0;
    let lastTime = performance.now();
    let entranceProgress = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Smooth RPM acceleration / deceleration with inertia
      currentSpeedRef.current = THREE.MathUtils.lerp(
        currentSpeedRef.current,
        targetSpeedRef.current,
        0.05
      );
      rotationAngle += currentSpeedRef.current * delta;

      // Spin disc around its Z axis
      discMesh.rotation.z = rotationAngle;
      labelMesh.rotation.z = rotationAngle;

      // Smooth camera tilt lerp
      vinylGroup.rotation.x +=
        (targetRotX + scrollParallaxY - vinylGroup.rotation.x) * 0.08;
      vinylGroup.rotation.y += (targetRotY - vinylGroup.rotation.y) * 0.08;

      // Smooth load entrance zoom
      if (entranceProgress < 1) {
        entranceProgress += delta * 1.5;
        const scaleVal = THREE.MathUtils.lerp(0.88, 1.0, Math.min(entranceProgress, 1));
        vinylGroup.scale.set(scaleVal, scaleVal, scaleVal);
      }

      // Delicate floating bob
      const wobble = Math.sin(currentTime * 0.0018) * 0.025;
      vinylGroup.position.y = wobble;

      renderer?.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);
    setWebGlLoaded(true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousedown", onPointerDown);
      container.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("touchstart", onPointerDown);
      container.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      window.removeEventListener("scroll", onScroll);

      discGeometry.dispose();
      sideMaterial.dispose();
      faceMaterial.dispose();
      outerBevelGeom.dispose();
      outerBevelMat.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();
      spindleGeometry.dispose();
      spindleMaterial.dispose();
      shadowGeom.dispose();
      shadowMat.dispose();
      vinylTexture.dispose();
      labelTexture.dispose();
      shadowTexture.dispose();
      renderer?.dispose();
    };
  }, [featuredTitle, featuredArtist]);

  // Ambient synth generator
  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.frequency.setValueAtTime(130.81, ctx.currentTime);
        osc.type = "sine";

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setSoundEnabled(true);
      } catch {
        setSoundEnabled(false);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setSoundEnabled(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[580px] lg:max-w-[640px] mx-auto flex items-center justify-center select-none overflow-visible">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          webGlLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-500 overflow-visible`}
      />

      {/* Instant CSS Fallback */}
      {!webGlLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div className="relative w-full aspect-square max-w-[420px] rounded-full bg-[#080808] border-2 border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.12)] flex items-center justify-center animate-spin-slow">
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-10 rounded-full border border-white/10" />
            <div className="absolute inset-16 rounded-full border border-white/15" />
            <div className="absolute inset-24 rounded-full border border-white/15" />
            <div className="absolute inset-32 rounded-full border border-white/20" />
            <div className="w-36 h-36 rounded-full bg-[#111111] border-2 border-white/40 flex flex-col items-center justify-center text-center p-3">
              <span className="font-mono text-[9px] font-bold tracking-widest text-neutral-400">CXRNER</span>
              <span className="font-heavy text-xs text-white uppercase mt-1 tracking-wider truncate max-w-[120px]">
                {featuredTitle}
              </span>
              <span className="w-3 h-3 rounded-full bg-white border border-neutral-400 mt-2 shadow-[0_0_8px_white]" />
            </div>
          </div>
        </div>
      )}

      {/* Industrial Playback / RPM Controls Bar */}
      <div className="absolute -bottom-4 sm:bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/90 border border-white/20 shadow-2xl backdrop-blur-md z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono tracking-wider transition rounded-full ${
            isPlaying ? "bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]" : "text-neutral-400 hover:text-white"
          }`}
          title={isPlaying ? "Остановить вращение" : "Запустить пластинку"}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isPlaying ? "SPINNING" : "STOP"}</span>
        </button>

        <button
          type="button"
          onClick={() => setRpm(rpm === 33 ? 45 : 33)}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono transition rounded-full ${
            rpm === 45 ? "text-white font-bold bg-white/15" : "text-neutral-400 hover:text-white"
          }`}
          title="Переключить скорость (33⅓ / 45 RPM)"
        >
          <RotateCw className="w-3 h-3 text-neutral-400" />
          <span>{rpm === 33 ? "33⅓" : "45"} RPM</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono transition rounded-full ${
            soundEnabled ? "text-black bg-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]" : "text-neutral-400 hover:text-white"
          }`}
          title="Аналоговый фоновый генератор"
        >
          {soundEnabled ? <Volume2 className="w-3 h-3 text-black" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{soundEnabled ? "AUDIO ON" : "AUDIO"}</span>
        </button>
      </div>

      {/* Technical Object Coordinates Marker */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 pointer-events-none">
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 bg-black/85 px-2.5 py-1 border border-white/15 rounded-md shadow-lg">
          [OBJ::12INCH_AUDIOPHILE_180G]
        </span>
      </div>
    </div>
  );
}
