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

    // Check WebGL availability safely
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
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.6);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Append canvas
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Group
    const vinylGroup = new THREE.Group();
    vinylGroup.rotation.x = 0.35;
    vinylGroup.rotation.y = -0.18;
    scene.add(vinylGroup);

    // Procedural Monochromatic Grooved Texture
    const textureSize = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Deep obsidian vinyl base
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, textureSize, textureSize);

      const cx = textureSize / 2;
      const cy = textureSize / 2;

      // Concentric sound grooves (fine silver-white specular rings)
      for (let r = 180; r < 485; r += 2) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const alpha = (Math.sin(r * 0.45) * 0.5 + 0.5) * 0.14 + 0.02;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Run-out dead wax groove
      for (let r = 150; r < 180; r += 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Outer rim reflection line
      ctx.beginPath();
      ctx.arc(cx, cy, 498, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    const vinylTexture = new THREE.CanvasTexture(canvas);

    // Disc Mesh
    const discGeometry = new THREE.CylinderGeometry(2.1, 2.1, 0.04, 64);
    const discMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c0c,
      roughness: 0.22,
      metalness: 0.88,
      map: vinylTexture,
      bumpMap: vinylTexture,
      bumpScale: 0.015,
    });
    const discMesh = new THREE.Mesh(discGeometry, discMaterial);
    discMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(discMesh);

    // Matte Center Label
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const lCtx = labelCanvas.getContext("2d");
    if (lCtx) {
      // Matte charcoal label
      lCtx.fillStyle = "#121212";
      lCtx.fillRect(0, 0, 512, 512);

      // Fine technical border rings
      lCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      lCtx.lineWidth = 2;
      lCtx.beginPath();
      lCtx.arc(256, 256, 240, 0, Math.PI * 2);
      lCtx.stroke();

      lCtx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      lCtx.beginPath();
      lCtx.arc(256, 256, 220, 0, Math.PI * 2);
      lCtx.stroke();

      // Minimalist Label Typography
      lCtx.fillStyle = "#FFFFFF";
      lCtx.font = "bold 26px sans-serif";
      lCtx.textAlign = "center";
      lCtx.fillText("C X R N E R", 256, 170);

      lCtx.fillStyle = "#A1A1A1";
      lCtx.font = "600 16px sans-serif";
      lCtx.fillText(featuredTitle.toUpperCase(), 256, 215);

      lCtx.fillStyle = "#666666";
      lCtx.font = "14px monospace";
      lCtx.fillText(featuredArtist.toUpperCase(), 256, 245);

      lCtx.fillStyle = "#888888";
      lCtx.font = "12px monospace";
      lCtx.fillText("CAT# CXR-002 · 33⅓ RPM · STEREO", 256, 325);

      // Center Spindle Hole
      lCtx.fillStyle = "#050505";
      lCtx.beginPath();
      lCtx.arc(256, 256, 22, 0, Math.PI * 2);
      lCtx.fill();
      lCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      lCtx.lineWidth = 2;
      lCtx.stroke();
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelGeometry = new THREE.CylinderGeometry(0.82, 0.82, 0.043, 48);
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.5,
      metalness: 0.2,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(labelMesh);

    // Subtle Monochromatic Ambient Dust (Fine white specks, NO rainbow colors)
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.15;
      const radius = 2.25 + Math.random() * 0.35;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.sin(angle) * radius;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xcccccc,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    vinylGroup.add(particleSystem);

    // Museum-Grade Lighting (Monochromatic White / Silver)
    const ambientLight = new THREE.AmbientLight(0x1a1a1a, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
    keyLight.position.set(-3.5, 3.5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x888888, 2.2);
    rimLight.position.set(3.5, -2, 3);
    scene.add(rimLight);

    const cursorSpot = new THREE.PointLight(0xffffff, 2.5, 10);
    cursorSpot.position.set(0, 2, 3);
    scene.add(cursorSpot);

    // Mouse / Touch Interaction
    let targetRotationX = 0.35;
    let targetRotationY = -0.18;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();

      const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const my = -(((clientY - rect.top) / rect.height) * 2 - 1);

      targetRotationY = -0.18 + mx * 0.35;
      targetRotationX = 0.35 - my * 0.25;

      cursorSpot.position.x = mx * 3;
      cursorSpot.position.y = my * 3 + 1;
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("touchmove", onPointerMove, { passive: true });

    const handleResize = () => {
      if (!container || !renderer) return;
      const nw = container.clientWidth || 320;
      const nh = container.clientHeight || 320;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener("resize", handleResize);

    setWebGlLoaded(true);

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const speed = rpm === 45 ? 2.2 : 1.6;

      if (isPlaying) {
        discMesh.rotation.y += delta * speed;
        labelMesh.rotation.y += delta * speed;
        particleSystem.rotation.z += delta * 0.2;
      }

      vinylGroup.rotation.x += (targetRotationX - vinylGroup.rotation.x) * 0.05;
      vinylGroup.rotation.y += (targetRotationY - vinylGroup.rotation.y) * 0.05;
      vinylGroup.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("touchmove", onPointerMove);
      if (renderer) {
        renderer.dispose();
      }
      discGeometry.dispose();
      discMaterial.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying, rpm, featuredTitle, featuredArtist]);

  // Audio synthesizer preview (dark atmospheric sub-bass chord)
  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Dark underground sub-bass drone
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.09, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const freqs = [65.41, 98.0, 130.81]; // C2, G2, C3 dark industrial bass
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(350 + idx * 100, ctx.currentTime);

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(filter);
          filter.connect(masterGain);
          osc.start();
        });

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

  return (
    <div className="relative w-full aspect-square max-w-[480px] mx-auto flex items-center justify-center select-none">
      {/* 3D Three.js Mounting Container (Always visible, clean background) */}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          webGlLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-500`}
      />

      {/* Immediate CSS Fallback (Rendered immediately so mobile screen is NEVER blank!) */}
      {!webGlLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#0d0d0d] border border-white/20 shadow-2xl flex items-center justify-center animate-spin-slow">
            {/* Concentric rings */}
            <div className="absolute inset-4 rounded-full border border-white/5" />
            <div className="absolute inset-10 rounded-full border border-white/5" />
            <div className="absolute inset-16 rounded-full border border-white/10" />
            <div className="absolute inset-24 rounded-full border border-white/10" />

            {/* Center label */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#141414] border border-white/30 flex flex-col items-center justify-center text-center p-2">
              <span className="font-mono text-[10px] tracking-widest text-white/40">CXRNER</span>
              <span className="font-bold text-xs text-white uppercase mt-1 truncate max-w-[90px]">
                {featuredTitle}
              </span>
              <span className="w-3 h-3 rounded-full bg-black border border-white/30 mt-2" />
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Industrial Controls */}
      <div className="absolute -bottom-3 sm:bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0c0c0c] border border-[#262626] shadow-xl z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono tracking-wider transition ${
            isPlaying ? "bg-white text-black font-bold" : "text-[#888888] hover:text-white"
          }`}
          title={isPlaying ? "Пауза" : "Воспроизвести"}
        >
          <Disc3 className={`w-3 h-3 ${isPlaying ? "animate-spin" : ""}`} />
          <span>{isPlaying ? "33 RPM" : "PAUSE"}</span>
        </button>

        <button
          type="button"
          onClick={() => setRpm(rpm === 33 ? 45 : 33)}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[#888888] hover:text-white transition"
          title="Скорость"
        >
          <RotateCw className="w-2.5 h-2.5 text-white/50" />
          <span>{rpm}</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono transition ${
            soundEnabled ? "text-white bg-white/15" : "text-[#666666] hover:text-white"
          }`}
          title="Синтезатор"
        >
          {soundEnabled ? <Volume2 className="w-3 h-3 text-white" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{soundEnabled ? "AUDIO ON" : "PREVIEW"}</span>
        </button>
      </div>

      {/* Technical Corner Stamp */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 pointer-events-none">
        <span className="tech-badge">
          OBJ::VINYL_02
        </span>
      </div>
    </div>
  );
}
