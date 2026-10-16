"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Disc3, Volume2, VolumeX, Sparkles, RotateCw } from "lucide-react";

interface VinylCanvasProps {
  featuredTitle?: string;
  featuredArtist?: string;
  featuredCover?: string;
}

export default function VinylCanvas({
  featuredTitle = "NEON DRIFT",
  featuredArtist = "KAZUMAI",
  featuredCover = "/images/album-01.svg",
}: VinylCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [rpm, setRpm] = useState<33 | 45>(33);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Audio preview synthesis ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isAudioActiveRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Vinyl Group
    const vinylGroup = new THREE.Group();
    // Tilt slightly forward to look like an angled display
    vinylGroup.rotation.x = 0.38;
    vinylGroup.rotation.y = -0.22;
    scene.add(vinylGroup);

    // 3. Create Grooved Vinyl Texture
    const textureSize = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Base dark vinyl
      ctx.fillStyle = "#0c0a13";
      ctx.fillRect(0, 0, textureSize, textureSize);

      const centerX = textureSize / 2;
      const centerY = textureSize / 2;

      // Draw realistic sound grooves
      for (let r = 180; r < 480; r += 2) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        const opacity = (Math.sin(r * 0.4) * 0.5 + 0.5) * 0.18 + 0.04;
        ctx.strokeStyle = `rgba(210, 139, 255, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Run-out groove (dead wax area)
      for (let r = 150; r < 180; r += 4) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(100, 60, 150, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Outer rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, 495, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180, 75, 255, 0.4)";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    const vinylTexture = new THREE.CanvasTexture(canvas);
    vinylTexture.wrapS = THREE.RepeatWrapping;
    vinylTexture.wrapT = THREE.RepeatWrapping;

    // Disc Geometry: Cylinder with bevel
    const discGeometry = new THREE.CylinderGeometry(2.1, 2.1, 0.04, 64);
    const discMaterial = new THREE.MeshStandardMaterial({
      color: 0x120e1e,
      roughness: 0.28,
      metalness: 0.85,
      map: vinylTexture,
      bumpMap: vinylTexture,
      bumpScale: 0.02,
    });
    const discMesh = new THREE.Mesh(discGeometry, discMaterial);
    discMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(discMesh);

    // 4. Center Label Geometry
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const lCtx = labelCanvas.getContext("2d");
    if (lCtx) {
      // Label background: deep purple holographic gradient
      const grad = lCtx.createRadialGradient(256, 256, 10, 256, 256, 256);
      grad.addColorStop(0, "#ff4bd6");
      grad.addColorStop(0.45, "#b44bff");
      grad.addColorStop(0.85, "#16072b");
      grad.addColorStop(1, "#090314");
      lCtx.fillStyle = grad;
      lCtx.fillRect(0, 0, 512, 512);

      // Label border
      lCtx.strokeStyle = "rgba(83, 246, 255, 0.8)";
      lCtx.lineWidth = 6;
      lCtx.beginPath();
      lCtx.arc(256, 256, 240, 0, Math.PI * 2);
      lCtx.stroke();

      // CXRNER MUSIC typography on label
      lCtx.fillStyle = "#ffffff";
      lCtx.font = "bold 32px sans-serif";
      lCtx.textAlign = "center";
      lCtx.fillText("CXRNER MUSIC", 256, 175);

      lCtx.fillStyle = "#53f6ff";
      lCtx.font = "600 22px sans-serif";
      lCtx.fillText(featuredTitle.toUpperCase(), 256, 220);

      lCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
      lCtx.font = "500 18px sans-serif";
      lCtx.fillText(featuredArtist.toUpperCase(), 256, 255);

      lCtx.fillStyle = "#d28bff";
      lCtx.font = "14px monospace";
      lCtx.fillText("33⅓ RPM · STEREO · CXR-02", 256, 320);

      // Spindle hole
      lCtx.fillStyle = "#08040f";
      lCtx.beginPath();
      lCtx.arc(256, 256, 24, 0, Math.PI * 2);
      lCtx.fill();
      lCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      lCtx.lineWidth = 3;
      lCtx.stroke();
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelGeometry = new THREE.CylinderGeometry(0.82, 0.82, 0.043, 48);
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.35,
      metalness: 0.4,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.rotation.x = Math.PI / 2;
    vinylGroup.add(labelMesh);

    // 5. Holographic Ambient Particle Ring
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorA = new THREE.Color(0xb44bff);
    const colorB = new THREE.Color(0x53f6ff);
    const colorC = new THREE.Color(0xff4bd6);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 2.2 + Math.random() * 0.4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.4;

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      const mixedColor = i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : colorC;
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    vinylGroup.add(particleSystem);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0x22133b, 1.8);
    scene.add(ambientLight);

    const purpleLight = new THREE.DirectionalLight(0xb44bff, 3.2);
    purpleLight.position.set(-4, 3, 4);
    scene.add(purpleLight);

    const cyanLight = new THREE.DirectionalLight(0x53f6ff, 2.8);
    cyanLight.position.set(4, -2, 3);
    scene.add(cyanLight);

    const magentaSpot = new THREE.PointLight(0xff4bd6, 4.5, 12);
    magentaSpot.position.set(0, 3, 3);
    scene.add(magentaSpot);

    // Interactive mouse / touch coordinates
    let targetRotationX = 0.38;
    let targetRotationY = -0.22;
    let mouseX = 0;
    let mouseY = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();

      mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      targetRotationY = -0.22 + mouseX * 0.45;
      targetRotationX = 0.38 - mouseY * 0.35;

      // Move dynamic light with mouse
      magentaSpot.position.x = mouseX * 3.5;
      magentaSpot.position.y = mouseY * 3.5 + 2;
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("touchmove", onPointerMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    // Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const currentRpmSpeed = rpm === 45 ? 2.4 : 1.7;

      if (isPlaying) {
        discMesh.rotation.y += delta * currentRpmSpeed;
        labelMesh.rotation.y += delta * currentRpmSpeed;
        particleSystem.rotation.z += delta * 0.4;
      }

      // Smooth camera / rotation interpolation (damping)
      vinylGroup.rotation.x += (targetRotationX - vinylGroup.rotation.x) * 0.06;
      vinylGroup.rotation.y += (targetRotationY - vinylGroup.rotation.y) * 0.06;

      // Slight floating motion
      vinylGroup.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("touchmove", onPointerMove);
      renderer.dispose();
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

  // Audio synthesizer for audio preview
  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Create an ambient cyberpunk synth chord
        const notes = [130.81, 196.0, 233.08, 261.63]; // C3, G3, Bb3, C4 phonk/dark synth chord
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
        masterGain.connect(ctx.destination);

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(800 + idx * 250, ctx.currentTime);

          osc.type = idx === 0 ? "sawtooth" : "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(filter);
          filter.connect(masterGain);
          osc.start();
        });

        isAudioActiveRef.current = true;
        setSoundEnabled(true);
      } catch {
        setSoundEnabled(false);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      isAudioActiveRef.current = false;
      setSoundEnabled(false);
    }
  };

  return (
    <div
      className="relative w-full aspect-square max-w-[540px] mx-auto flex items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Three.js Container */}
      {webGlSupported ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Fallback CSS 3D Vinyl */
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-[#110c1c] border-4 border-neon/40 shadow-glowStrong flex items-center justify-center animate-spin-slow">
          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-magenta via-neon to-aqua flex items-center justify-center text-center p-2 text-xs font-bold text-white shadow-inner">
            {featuredTitle}
          </div>
        </div>
      )}

      {/* Interactive Controls Overlay */}
      <div className="absolute -bottom-4 sm:bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-white/15 shadow-2xl backdrop-blur-2xl z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
            isPlaying ? "bg-neon text-night font-bold shadow-glow" : "bg-white/10 text-white/70 hover:text-white"
          }`}
          title={isPlaying ? "Остановить вращение" : "Запустить пластинку"}
        >
          <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? "animate-spin" : ""}`} />
          <span>{isPlaying ? "33⅓ RPM" : "PAUSED"}</span>
        </button>

        <button
          type="button"
          onClick={() => setRpm(rpm === 33 ? 45 : 33)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 hover:bg-white/15 text-white/80 transition"
          title="Сменить скорость воспроизведения"
        >
          <RotateCw className="w-3 h-3 text-aqua" />
          <span>{rpm}</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
            soundEnabled ? "bg-aqua/20 text-aqua border border-aqua/40" : "bg-white/5 text-white/70 hover:text-white"
          }`}
          title="Звуковой превью синтезатора"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-aqua animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{soundEnabled ? "АУДИО ВКЛ" : "ПРЕВЬЮ"}</span>
        </button>
      </div>

      {/* Floating Holographic Badge */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-badge text-[10px] font-semibold tracking-widest uppercase text-aqua shadow-glowAqua border-aqua/30">
          <Sparkles className="w-3 h-3 text-aqua animate-spin-slow" />
          3D VINYL
        </span>
      </div>
    </div>
  );
}
