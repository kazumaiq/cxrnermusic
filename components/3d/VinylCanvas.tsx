"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Disc3, Volume2, VolumeX, RotateCw } from "lucide-react";

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
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    // Initial setup
    const initialWidth = container.clientWidth || 400;
    const initialHeight = container.clientHeight || 400;
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Clear previous elements
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Master Group for 3D Vinyl
    const vinylGroup = new THREE.Group();
    // Dramatic 3D isometric perspective: distinct elevation so thickness and bevels are obvious
    const baseRotX = 0.58;
    const baseRotY = -0.28;
    vinylGroup.rotation.x = baseRotX;
    vinylGroup.rotation.y = baseRotY;
    scene.add(vinylGroup);

    // ==========================================
    // 1. PROCEDURAL ULTRA-DETAILED GROOVE TEXTURE
    // ==========================================
    const textureSize = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, textureSize, textureSize);

      const cx = textureSize / 2;
      const cy = textureSize / 2;

      // Concentric sound grooves (fine silver micro-lines)
      for (let r = 165; r < 480; r += 1.8) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        // Varying groove intensity gives the optical iridescent sheen
        const alpha = (Math.sin(r * 0.35) * 0.5 + 0.5) * 0.18 + 0.03;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Run-out dead wax area with engraved catalog number markings
      for (let r = 135; r < 165; r += 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Etched matrix numbers in dead wax
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.8);
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CXR-002-A1 // STEREO // MASTERED BY CXRNER", 0, -148);
      ctx.restore();

      // Outer lead-in lip groove
      ctx.beginPath();
      ctx.arc(cx, cy, 492, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    const vinylTexture = new THREE.CanvasTexture(canvas);
    vinylTexture.wrapS = THREE.ClampToEdgeWrapping;
    vinylTexture.wrapT = THREE.ClampToEdgeWrapping;

    // ==========================================
    // 2. REAL PHYSICAL 3D VINYL DISC GEOMETRY
    // ==========================================
    // Standard 12" vinyl scaled to unit radius 1.5 with physical 180g thickness 0.07
    const discRadius = 1.5;
    const discThickness = 0.07;
    const discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 96, 4, false);

    const discMaterial = new THREE.MeshStandardMaterial({
      color: 0x090909,
      roughness: 0.2,
      metalness: 0.85,
      map: vinylTexture,
      bumpMap: vinylTexture,
      bumpScale: 0.012,
    });

    const discMesh = new THREE.Mesh(discGeometry, discMaterial);
    // Cylinder is along Y; rotate 90 deg so face is flat in XY plane
    discMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(discMesh);

    // Raised outer bevel rim (catching bright edge grazing light)
    const rimGeometry = new THREE.TorusGeometry(discRadius - 0.005, 0.012, 16, 96);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.25,
      metalness: 0.9,
    });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    vinylGroup.add(rimMesh);

    // ==========================================
    // 3. CENTER LABEL & CHROME SPINDLE PIN
    // ==========================================
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const lCtx = labelCanvas.getContext("2d");
    if (lCtx) {
      // Matte charcoal center label
      lCtx.fillStyle = "#0e0e0e";
      lCtx.fillRect(0, 0, 512, 512);

      // Outer rings
      lCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      lCtx.lineWidth = 3;
      lCtx.beginPath();
      lCtx.arc(256, 256, 238, 0, Math.PI * 2);
      lCtx.stroke();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      lCtx.lineWidth = 1.5;
      lCtx.beginPath();
      lCtx.arc(256, 256, 220, 0, Math.PI * 2);
      lCtx.stroke();

      // Technical branding
      lCtx.fillStyle = "#FFFFFF";
      lCtx.font = "900 32px sans-serif";
      lCtx.textAlign = "center";
      lCtx.fillText("C X R N E R", 256, 175);

      lCtx.fillStyle = "#D4D4D4";
      lCtx.font = "bold 18px monospace";
      lCtx.fillText(featuredTitle.toUpperCase(), 256, 220);

      lCtx.fillStyle = "#888888";
      lCtx.font = "14px monospace";
      lCtx.fillText(featuredArtist.toUpperCase(), 256, 250);

      lCtx.fillStyle = "#555555";
      lCtx.font = "bold 11px monospace";
      lCtx.fillText("[SIDE A // 33⅓ RPM // STEREO]", 256, 335);

      // Center Spindle Hole
      lCtx.fillStyle = "#000000";
      lCtx.beginPath();
      lCtx.arc(256, 256, 25, 0, Math.PI * 2);
      lCtx.fill();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      lCtx.lineWidth = 2.5;
      lCtx.stroke();
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelRadius = 0.58;
    const labelGeometry = new THREE.CylinderGeometry(labelRadius, labelRadius, discThickness + 0.004, 64);
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.45,
      metalness: 0.2,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(labelMesh);

    // 3D Metal Chrome Spindle Bushing
    const spindleGeometry = new THREE.CylinderGeometry(0.065, 0.065, discThickness + 0.04, 32);
    const spindleMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.1,
      metalness: 0.98,
    });
    const spindleMesh = new THREE.Mesh(spindleGeometry, spindleMaterial);
    spindleMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(spindleMesh);

    // ==========================================
    // 4. STUDIO LIGHTING: GRAZING HIGHLIGHTS
    // ==========================================
    // Ambient light to ensure deep blacks don't crush to total darkness
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Sharp white directional key light catching the face
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(-4, 5, 5);
    scene.add(keyLight);

    // Razor-sharp silver rim light from behind for silhouette edge
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.6);
    rimLight.position.set(4, -3, 3.5);
    scene.add(rimLight);

    // Secondary grazing light creating edge contrast
    const edgeLight = new THREE.DirectionalLight(0xaaaaaa, 2.8);
    edgeLight.position.set(0, -6, 2);
    scene.add(edgeLight);

    // Interactive point light tracking pointer
    const cursorLight = new THREE.PointLight(0xffffff, 2.5, 12);
    cursorLight.position.set(0, 1.5, 4);
    scene.add(cursorLight);

    // ==========================================
    // 5. RESPONSIVE FRUSTUM CALCULATION (NO CLIPPING GUARANTEE)
    // ==========================================
    // Total bounding sphere radius including disc, rim and tilt
    const boundingSphereRadius = discRadius + 0.05; // 1.55 units

    const updateCameraFrustum = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const aspect = width / height;
      camera.aspect = aspect;

      // Safe margin factor: 1.35 guarantees 25-35% free space around the disc
      const marginFactor = 1.35;
      const fovY = (camera.fov * Math.PI) / 180;

      // Distance required to fit vertically:
      const distVertical = (boundingSphereRadius * marginFactor) / Math.tan(fovY / 2);
      // Distance required to fit horizontally:
      const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect);
      const distHorizontal = (boundingSphereRadius * marginFactor) / Math.tan(fovX / 2);

      // Choose distance that ensures BOTH vertical & horizontal fit, minimum 5.4
      const finalDist = Math.max(distVertical, distHorizontal, 5.4);
      camera.position.set(0, 0, finalDist);
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
    };

    updateCameraFrustum();

    const resizeObserver = new ResizeObserver(() => {
      updateCameraFrustum();
    });
    resizeObserver.observe(container);

    // ==========================================
    // 6. INTERACTION & ROTATION INERTIA
    // ==========================================
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

      // Normalize coordinates [-1, 1]
      const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const my = -(((clientY - rect.top) / rect.height) * 2 - 1);

      cursorLight.position.x = mx * 3;
      cursorLight.position.y = my * 3 + 1;

      if (isDragging) {
        const dx = clientX - lastPointerX;
        const dy = clientY - lastPointerY;
        targetRotY += dx * 0.008;
        targetRotX += dy * 0.008;
        lastPointerX = clientX;
        lastPointerY = clientY;
      } else {
        targetRotY = baseRotY + mx * 0.35;
        targetRotX = baseRotX - my * 0.28;
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

    // ==========================================
    // 7. RENDER LOOP
    // ==========================================
    let rotationAngle = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // RPM rotation speed
      if (isPlaying) {
        const revPerSec = (rpm / 60) * Math.PI * 2;
        rotationAngle += revPerSec * delta;
      }

      // Spin the disc meshes around their Z axis (their flat facing axis)
      discMesh.rotation.z = rotationAngle;
      labelMesh.rotation.z = rotationAngle;

      // Smooth camera/object tilt interpolation (lerp)
      vinylGroup.rotation.x += (targetRotX - vinylGroup.rotation.x) * 0.08;
      vinylGroup.rotation.y += (targetRotY - vinylGroup.rotation.y) * 0.08;

      // Subtle atmospheric hover wobble
      const wobble = Math.sin(currentTime * 0.0015) * 0.02;
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

      discGeometry.dispose();
      discMaterial.dispose();
      rimGeometry.dispose();
      rimMaterial.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();
      spindleGeometry.dispose();
      spindleMaterial.dispose();
      vinylTexture.dispose();
      labelTexture.dispose();
      renderer?.dispose();
    };
  }, [featuredTitle, featuredArtist, isPlaying, rpm]);

  // Ambient synth audio
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
    <div className="relative w-full aspect-square max-w-[560px] mx-auto flex items-center justify-center select-none overflow-visible">
      {/* 3D WebGL Canvas Container with guaranteed safe padding */}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          webGlLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300 overflow-visible`}
      />

      {/* Instant CSS Fallback (Clean Industrial Vinyl) */}
      {!webGlLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
          <div className="relative w-full aspect-square max-w-[400px] rounded-full bg-[#0a0a0a] border-2 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center animate-spin-slow">
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-10 rounded-full border border-white/10" />
            <div className="absolute inset-16 rounded-full border border-white/15" />
            <div className="absolute inset-24 rounded-full border border-white/15" />
            <div className="absolute inset-32 rounded-full border border-white/20" />
            <div className="w-32 h-32 rounded-full bg-[#121212] border-2 border-white/40 flex flex-col items-center justify-center text-center p-3">
              <span className="font-mono text-[9px] font-bold tracking-widest text-neutral-400">CXRNER</span>
              <span className="font-heavy text-xs text-white uppercase mt-1 tracking-wider truncate max-w-[100px]">
                {featuredTitle}
              </span>
              <span className="w-3 h-3 rounded-full bg-white border border-neutral-400 mt-2 shadow-[0_0_8px_white]" />
            </div>
          </div>
        </div>
      )}

      {/* Industrial Playback / RPM Controls Bar */}
      <div className="absolute -bottom-4 sm:bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded bg-black/90 border border-white/20 shadow-2xl backdrop-blur-md z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider transition rounded ${
            isPlaying ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
          }`}
          title={isPlaying ? "Пауза" : "Воспроизвести"}
        >
          <Disc3 className={`w-3 h-3 ${isPlaying ? "animate-spin" : ""}`} />
          <span>{isPlaying ? "33⅓ RPM" : "PAUSE"}</span>
        </button>

        <button
          type="button"
          onClick={() => setRpm(rpm === 33 ? 45 : 33)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-neutral-400 hover:text-white transition rounded"
          title="Скорость"
        >
          <RotateCw className="w-2.5 h-2.5 text-neutral-400" />
          <span>{rpm}</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono transition rounded ${
            soundEnabled ? "text-black bg-white font-bold" : "text-neutral-400 hover:text-white"
          }`}
          title="Синтезатор"
        >
          {soundEnabled ? <Volume2 className="w-3 h-3 text-black" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{soundEnabled ? "SOUND ON" : "AUDIO"}</span>
        </button>
      </div>

      {/* Technical Object Marker */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 pointer-events-none">
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 bg-black/80 px-2 py-0.5 border border-white/10 rounded">
          [OBJ::12INCH_VINYL]
        </span>
      </div>
    </div>
  );
}
