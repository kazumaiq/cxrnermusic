"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, ZoomIn, ZoomOut, Eye, Sparkles } from "lucide-react";

interface CollectionItem3DViewerProps {
  itemName: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  modelColor?: string;
  shape?: "cylinder" | "box" | "torus" | "octahedron" | "dodecahedron" | "icosahedron";
  serialNumber?: number;
}

export default function CollectionItem3DViewer({
  itemName,
  rarity,
  modelColor = "#8737FF",
  shape = "cylinder",
  serialNumber = 135,
}: CollectionItem3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

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
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    cameraRef.current = camera;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(new THREE.Color(modelColor), 2.5);
    keyLight.position.set(5, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    rimLight.position.set(-5, -3, -3);
    scene.add(rimLight);

    // Create Main 3D Mesh based on shape
    let geometry: THREE.BufferGeometry;
    switch (shape) {
      case "box":
        geometry = new THREE.BoxGeometry(1.6, 1.1, 0.25, 4, 4, 4);
        break;
      case "torus":
        geometry = new THREE.TorusGeometry(1.1, 0.35, 24, 48);
        break;
      case "octahedron":
        geometry = new THREE.OctahedronGeometry(1.2, 0);
        break;
      case "dodecahedron":
        geometry = new THREE.DodecahedronGeometry(1.2, 0);
        break;
      case "icosahedron":
        geometry = new THREE.IcosahedronGeometry(1.2, 1);
        break;
      case "cylinder":
      default:
        geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 48);
        break;
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(modelColor),
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      wireframe: wireframeMode,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Floating Halo Ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(modelColor),
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.5;
    scene.add(ringMesh);

    // Holographic particle field
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: new THREE.Color(modelColor),
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Pointer Interaction (Rotate 360°)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      targetRotationY += deltaX * 0.009;
      targetRotationX += deltaY * 0.009;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    dom.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        mesh.rotation.y += 0.012;
        mesh.rotation.x = Math.sin(elapsedTime * 0.8) * 0.2;
      } else {
        mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.1;
        mesh.rotation.x += (targetRotationX - mesh.rotation.x) * 0.1;
      }

      ringMesh.rotation.z = elapsedTime * 0.15;
      particles.rotation.y = elapsedTime * 0.05;

      renderer?.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      dom.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      geometry.dispose();
      material.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer?.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, [shape, modelColor, wireframeMode, autoRotate]);

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.min(Math.max(cameraRef.current.position.z + delta, 2.5), 6.5);
  };

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#090611] via-[#050407] to-black border border-white/10 overflow-hidden group select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Rarity & Serial Overlay Header */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold border backdrop-blur-md ${
              rarity === "mythic"
                ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                : rarity === "legendary"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                : rarity === "epic"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                : rarity === "rare"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                : "bg-white/10 text-white/70 border-white/20"
            }`}
          >
            {rarity.toUpperCase()}
          </span>
          <span className="font-mono text-[11px] text-[#D9D9E2]/60">#{String(serialNumber).padStart(4, "0")}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D9D9E2]/60 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
          <Sparkles className="w-3 h-3 text-[#B46BFF]" />
          <span>360° SPECIMEN</span>
        </div>
      </div>

      {/* Floating Interactive Controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-xl pointer-events-auto">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-full text-xs transition ${
            autoRotate ? "bg-[#8737FF] text-white shadow-[0_0_10px_#8737FF]" : "text-[#D9D9E2]/60 hover:text-white"
          }`}
          title="Авто-вращение"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setWireframeMode(!wireframeMode)}
          className={`p-2 rounded-full text-xs transition ${
            wireframeMode ? "bg-[#00F0FF] text-black shadow-[0_0_10px_#00F0FF]" : "text-[#D9D9E2]/60 hover:text-white"
          }`}
          title="Сетка / Каркас"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          className="p-2 rounded-full text-xs text-[#D9D9E2]/60 hover:text-white transition"
          title="Приблизить"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          className="p-2 rounded-full text-xs text-[#D9D9E2]/60 hover:text-white transition"
          title="Отдалить"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fallback if WebGL fails */}
      {!webGlSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#B46BFF] flex items-center justify-center animate-spin">
            <Sparkles className="w-8 h-8 text-[#B46BFF]" />
          </div>
          <p className="mt-4 font-display text-sm font-bold text-white">{itemName}</p>
          <p className="text-xs text-[#D9D9E2]/60 mt-1">3D-просмотр недоступен на этом устройстве</p>
        </div>
      )}
    </div>
  );
}
