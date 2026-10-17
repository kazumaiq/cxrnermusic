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
  featuredTitle = "The Sadness of Reality",
  featuredArtist = "Neimeks",
  featuredCover,
}: VinylCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rpm, setRpm] = useState<33 | 45>(33);
  const [webGlLoaded, setWebGlLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const initialWidth = container.clientWidth || 500;
    const initialHeight = container.clientHeight || 500;
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(isMobile ? 1.2 : Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Master Group for 1 Single 3D Vinyl
    const vinylGroup = new THREE.Group();
    // Balanced isometric tilt: shows circular silhouette and edge thickness simultaneously
    const baseRotX = 0.48;
    const baseRotY = -0.22;
    vinylGroup.rotation.x = baseRotX;
    vinylGroup.rotation.y = baseRotY;
    scene.add(vinylGroup);

    // ==============================================================
    // 1. PROCEDURAL ULTRA-REALISTIC VINYL GROOVE TEXTURE (1024x1024 or 512x512 on mobile)
    // ==============================================================
    const texSize = isMobile ? 512 : 1024;
    const canvas = document.createElement("canvas");
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Obsidian black vinyl base
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, texSize, texSize);

      const cx = texSize / 2;
      const cy = texSize / 2;

      // Anisotropic specular sheen lobes with subtle violet/silver reflection
      for (let angle = 0; angle < Math.PI * 2; angle += 0.012) {
        const sheen1 = Math.pow(Math.cos(angle * 2 - 0.35), 6);
        const sheen2 = Math.pow(Math.cos(angle * 2 + 1.2), 6) * 0.6;
        const totalSheen = Math.max(0, sheen1 + sheen2);

        if (totalSheen > 0.04) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, 490, angle - 0.008, angle + 0.008);
          ctx.closePath();
          // Cold silver + subtle purple iridescence
          ctx.fillStyle = `rgba(180, 160, 240, ${totalSheen * 0.18})`;
          ctx.fill();
        }
      }

      // Three album tracks with fine concentric micro-grooves
      const tracks = [
        { start: 175, end: 265 },
        { start: 275, end: 375 },
        { start: 385, end: 480 },
      ];

      tracks.forEach((track) => {
        for (let r = track.start; r < track.end; r += 2.2) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          const grooveAlpha = (Math.sin(r * 0.45) * 0.5 + 0.5) * 0.22 + 0.05;
          ctx.strokeStyle = `rgba(255, 255, 255, ${grooveAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Inter-track bands
      [270, 380].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // Run-out dead wax
      for (let r = 135; r < 170; r += 5) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Dead wax matrix stamping
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.9);
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CXRNER-2026 // MASTERDISK // 180G VINYL", 0, -150);
      ctx.restore();

      // Outer rim edge groove
      ctx.beginPath();
      ctx.arc(cx, cy, 488, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const vinylTexture = new THREE.CanvasTexture(canvas);

    // ==============================================================
    // 2. ONE SINGLE SOLID 3D VINYL DISC (NO FLOATING EXTRA DISCS)
    // ==============================================================
    const discRadius = 1.5;
    const discThickness = 0.075;

    const discSegments = isMobile ? 64 : 128;
    const discGeometry = new THREE.CylinderGeometry(
      discRadius,
      discRadius,
      discThickness,
      discSegments,
      2,
      false
    );

    // Side rim material: polished edge reflecting light
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x16161a,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Face material: obsidian black with groove texture
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.24,
      metalness: 0.85,
      map: vinylTexture,
      bumpMap: vinylTexture,
      bumpScale: 0.012,
    });

    // Material array: [side, top, bottom]
    const discMesh = new THREE.Mesh(discGeometry, [sideMaterial, faceMaterial, faceMaterial]);
    discMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(discMesh);

    // ==============================================================
    // 3. FLUSH CENTER LABEL (ATTACHED DIRECTLY TO THE DISC)
    // ==============================================================
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const lCtx = labelCanvas.getContext("2d");

    if (lCtx) {
      // Matte dark purple / charcoal background
      const grad = lCtx.createRadialGradient(256, 256, 20, 256, 256, 256);
      grad.addColorStop(0, "#1e1333");
      grad.addColorStop(0.7, "#120d1c");
      grad.addColorStop(1, "#0a0710");
      lCtx.fillStyle = grad;
      lCtx.fillRect(0, 0, 512, 512);

      // Silver & purple accent concentric rings
      lCtx.strokeStyle = "rgba(168, 85, 247, 0.7)";
      lCtx.lineWidth = 3;
      lCtx.beginPath();
      lCtx.arc(256, 256, 242, 0, Math.PI * 2);
      lCtx.stroke();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      lCtx.lineWidth = 1.5;
      lCtx.beginPath();
      lCtx.arc(256, 256, 225, 0, Math.PI * 2);
      lCtx.stroke();

      // Draw Actual Album Cover in center if provided
      if (typeof window !== "undefined" && featuredCover) {
        const coverImg = new window.Image();
        coverImg.crossOrigin = "anonymous";
        coverImg.src = featuredCover;
        coverImg.onload = () => {
          lCtx.save();
          lCtx.beginPath();
          lCtx.arc(256, 256, 230, 0, Math.PI * 2);
          lCtx.clip();
          lCtx.globalAlpha = 0.42;
          lCtx.drawImage(coverImg, 256 - 230, 256 - 230, 460, 460);
          lCtx.restore();
          labelTexture.needsUpdate = true;
        };
      }

      // CXRNER MUSIC Brand Header with Official Logo
      if (typeof window !== "undefined") {
        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = "/logo.png";
        logoImg.onload = () => {
          lCtx.drawImage(logoImg, 256 - 42, 75, 84, 52);
          labelTexture.needsUpdate = true;
        };
      }

      lCtx.fillStyle = "#A855F7";
      lCtx.font = "bold 12px monospace";
      lCtx.textAlign = "center";
      lCtx.fillText("★ CXRNER MUSIC ★", 256, 155);

      // Track Title
      lCtx.fillStyle = "#FFFFFF";
      lCtx.font = "900 24px sans-serif";
      const displayTitle = featuredTitle.length > 22 ? featuredTitle.slice(0, 20) + "..." : featuredTitle;
      lCtx.fillText(displayTitle.toUpperCase(), 256, 210);

      // Artist Name
      lCtx.fillStyle = "#D8B4FE";
      lCtx.font = "bold 16px monospace";
      lCtx.fillText(featuredArtist.toUpperCase(), 256, 245);

      // Divider line
      lCtx.strokeStyle = "rgba(168, 85, 247, 0.5)";
      lCtx.lineWidth = 2;
      lCtx.beginPath();
      lCtx.moveTo(156, 265);
      lCtx.lineTo(356, 265);
      lCtx.stroke();

      // Specification
      lCtx.fillStyle = "#9CA3AF";
      lCtx.font = "bold 12px monospace";
      lCtx.fillText("33⅓ RPM • STEREO • 180G", 256, 320);

      lCtx.fillStyle = "#6B7280";
      lCtx.font = "10px monospace";
      lCtx.fillText("CAT::CXR-001 // YANDEX MUSIC", 256, 345);

      // Center Spindle Hole
      lCtx.fillStyle = "#000000";
      lCtx.beginPath();
      lCtx.arc(256, 256, 28, 0, Math.PI * 2);
      lCtx.fill();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      lCtx.lineWidth = 2.5;
      lCtx.stroke();
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelRadius = 0.54;
    // Raised just 0.002 above disc surface to prevent Z-fighting, fully flush
    const labelGeometry = new THREE.CylinderGeometry(
      labelRadius,
      labelRadius,
      discThickness + 0.002,
      64
    );
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.45,
      metalness: 0.1,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(labelMesh);

    // Chrome Center Spindle Bushing
    const spindleGeometry = new THREE.CylinderGeometry(
      0.065,
      0.065,
      discThickness + 0.04,
      32
    );
    const spindleMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      roughness: 0.08,
      metalness: 0.98,
    });
    const spindleMesh = new THREE.Mesh(spindleGeometry, spindleMaterial);
    spindleMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(spindleMesh);

    // ==============================================================
    // 4. STUDIO LIGHTING: CONTROLLED VIOLET & SILVER HIGHLIGHTS
    // ==============================================================
    // Ambient light so darks remain deep without crushing
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Studio Key Light (soft white key)
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(-4, 5, 5);
    scene.add(keyLight);

    // Purple Rim Grazing Light (gives edge character and ties to label branding)
    const purpleRimLight = new THREE.DirectionalLight(0xa855f7, 4.8);
    purpleRimLight.position.set(5, -3, 3);
    scene.add(purpleRimLight);

    // Silver Kick Light
    const silverKickLight = new THREE.DirectionalLight(0xe0e7ff, 2.5);
    silverKickLight.position.set(-3, -5, 2);
    scene.add(silverKickLight);

    // Interactive pointer light
    const cursorLight = new THREE.PointLight(0xd8b4fe, 2.2, 10);
    cursorLight.position.set(0, 1, 4);
    scene.add(cursorLight);

    // ==============================================================
    // 5. CAMERA & ZERO-CLIPPING RESPONSIVE CALCULATION
    // ==============================================================
    const boundingSphereRadius = discRadius + 0.05;

    const updateCameraFrustum = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const aspect = width / height;
      camera.aspect = aspect;

      // 1.25 safety margin: disc is large & impactful, 25% clear breathing room
      const marginFactor = 1.25;
      const fovY = (camera.fov * Math.PI) / 180;

      const distVertical = (boundingSphereRadius * marginFactor) / Math.tan(fovY / 2);
      const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect);
      const distHorizontal = (boundingSphereRadius * marginFactor) / Math.tan(fovX / 2);

      const finalDist = Math.max(distVertical, distHorizontal, 4.8);
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
    // 6. INTERACTION & ROTATION INERTIA
    // ==============================================================
    let targetRotX = baseRotX;
    let targetRotY = baseRotY;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

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

      cursorLight.position.x = mx * 3;
      cursorLight.position.y = my * 3 + 1;

      if (isDragging) {
        const dx = clientX - lastPointerX;
        const dy = clientY - lastPointerY;
        targetRotY += dx * 0.007;
        targetRotX += dy * 0.007;
        lastPointerX = clientX;
        lastPointerY = clientY;
      } else {
        targetRotY = baseRotY + mx * 0.28;
        targetRotX = baseRotX - my * 0.22;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onPointerDown);
    container.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    container.addEventListener("touchstart", onPointerDown, { passive: true });
    container.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // ==============================================================
    // 7. RENDER LOOP
    // ==============================================================
    let rotationAngle = 0;
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.05 }
    );
    visibilityObserver.observe(container);

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Smooth RPM acceleration / deceleration
      currentSpeedRef.current = THREE.MathUtils.lerp(
        currentSpeedRef.current,
        targetSpeedRef.current,
        0.05
      );
      rotationAngle += currentSpeedRef.current * delta;

      // Spin single disc & flush label around Z
      discMesh.rotation.z = rotationAngle;
      labelMesh.rotation.z = rotationAngle;

      // Smooth tilt lerp
      vinylGroup.rotation.x += (targetRotX - vinylGroup.rotation.x) * 0.08;
      vinylGroup.rotation.y += (targetRotY - vinylGroup.rotation.y) * 0.08;

      // Gentle floating bob
      const wobble = Math.sin(currentTime * 0.0016) * 0.02;
      vinylGroup.position.y = wobble;

      renderer?.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);
    setWebGlLoaded(true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("mousedown", onPointerDown);
      container.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("touchstart", onPointerDown);
      container.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      discGeometry.dispose();
      sideMaterial.dispose();
      faceMaterial.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();
      spindleGeometry.dispose();
      spindleMaterial.dispose();
      vinylTexture.dispose();
      labelTexture.dispose();
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
    <div className="relative w-full aspect-square max-w-[520px] lg:max-w-[580px] mx-auto flex items-center justify-center select-none overflow-visible">
      {/* Soft Purple Ambient Backlight */}
      <div className="absolute inset-4 rounded-full bg-purple-600/15 blur-3xl pointer-events-none -z-10" />

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
          <div className="relative w-full aspect-square max-w-[400px] rounded-full bg-[#0a0a0c] border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] flex items-center justify-center animate-spin-slow">
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-10 rounded-full border border-white/10" />
            <div className="absolute inset-18 rounded-full border border-purple-500/20" />
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#1a102a] to-[#0a0712] border-2 border-purple-400/50 flex flex-col items-center justify-center text-center p-3 shadow-inner">
              <span className="font-mono text-[9px] font-bold tracking-widest text-purple-400">CXRNER</span>
              <span className="font-gothic text-xs text-white uppercase mt-1 tracking-wider truncate max-w-[120px]">
                {featuredTitle}
              </span>
              <span className="w-3 h-3 rounded-full bg-purple-400 mt-2 shadow-[0_0_8px_#c084fc]" />
            </div>
          </div>
        </div>
      )}

      {/* Playback / RPM Controls Bar */}
      <div className="absolute -bottom-4 sm:bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#09090e]/95 border border-purple-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono tracking-wider transition rounded-full ${
            isPlaying
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]"
              : "text-neutral-400 hover:text-white"
          }`}
          title={isPlaying ? "Остановить пластинку" : "Запустить вращение"}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isPlaying ? "ВРАЩАЕТСЯ" : "ПАУЗА"}</span>
        </button>

        <button
          type="button"
          onClick={() => setRpm(rpm === 33 ? 45 : 33)}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono transition rounded-full ${
            rpm === 45 ? "text-purple-300 font-bold bg-purple-500/20" : "text-neutral-400 hover:text-white"
          }`}
          title="Переключить скорость (33⅓ / 45 RPM)"
        >
          <RotateCw className="w-3 h-3 text-purple-400" />
          <span>{rpm === 33 ? "33⅓" : "45"} RPM</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono transition rounded-full ${
            soundEnabled ? "text-white bg-purple-600 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]" : "text-neutral-400 hover:text-white"
          }`}
          title="Фоновый звук студии"
        >
          {soundEnabled ? <Volume2 className="w-3 h-3 text-white" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{soundEnabled ? "ЗВУК ВКЛ" : "ЗВУК"}</span>
        </button>
      </div>
    </div>
  );
}
