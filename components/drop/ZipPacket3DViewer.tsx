"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ZipPacket3DViewerProps {
  caseId?: string;
  themeColor?: string;
  isOpening?: boolean;
  className?: string;
  showParticles?: boolean;
}

export default function ZipPacket3DViewer({
  caseId = "case_001_archive",
  themeColor = "#8737FF",
  isOpening = false,
  className = "w-full h-72 sm:h-96",
  showParticles = true,
}: ZipPacket3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

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

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.8);

    // Group holding the packet
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(new THREE.Color(themeColor), 3.5);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 2.2);
    dirLight2.position.set(-4, -3, -3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // 2. Sealed Pouch Geometry (Rounded flat packet with zipper rib)
    const pouchGeom = new THREE.BoxGeometry(2.0, 2.8, 0.22, 16, 16, 4);
    // Deform pouch slightly to look soft and filled like a real sealed baggie
    const pos = pouchGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (Math.abs(z) > 0.05) {
        const factor = (1 - (x / 1.0) ** 2) * (1 - (y / 1.4) ** 2);
        pos.setZ(i, z + (z > 0 ? 1 : -1) * factor * 0.12);
      }
    }
    pouchGeom.computeVertexNormals();

    const pouchMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0c0916"),
      metalness: 0.9,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 1.0,
      iridescence: 0.85,
      iridescenceIOR: 1.35,
    });
    const pouchMesh = new THREE.Mesh(pouchGeom, pouchMat);
    mainGroup.add(pouchMesh);

    // 3. Top Heat Seal Strip
    const sealGeom = new THREE.BoxGeometry(2.06, 0.35, 0.12);
    const sealMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e2e8f0"),
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 1.0,
    });
    const sealMesh = new THREE.Mesh(sealGeom, sealMat);
    sealMesh.position.set(0, 1.25, 0);
    mainGroup.add(sealMesh);

    // 4. Zipper Rib
    const zipGeom = new THREE.BoxGeometry(1.95, 0.08, 0.26);
    const zipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeColor),
      metalness: 0.6,
      roughness: 0.3,
    });
    const zipMesh = new THREE.Mesh(zipGeom, zipMat);
    zipMesh.position.set(0, 0.95, 0);
    mainGroup.add(zipMesh);

    // 5. Central Holographic Ring Emblem
    const ringGeom = new THREE.TorusGeometry(0.55, 0.06, 16, 48);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(themeColor),
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.set(0, -0.1, 0.12);
    mainGroup.add(ringMesh);

    // 6. Floating Specimen Particles
    let particlePoints: THREE.Points | null = null;
    if (showParticles) {
      const particleCount = 45;
      const partGeom = new THREE.BufferGeometry();
      const partPos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        partPos[i] = (Math.random() - 0.5) * 4.5;
        partPos[i + 1] = (Math.random() - 0.5) * 4.5;
        partPos[i + 2] = (Math.random() - 0.5) * 3.0;
      }
      partGeom.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
      const partMat = new THREE.PointsMaterial({
        color: new THREE.Color(themeColor),
        size: 0.045,
        transparent: true,
        opacity: 0.7,
      });
      particlePoints = new THREE.Points(partGeom, partMat);
      scene.add(particlePoints);
    }

    // Interactive Drag Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotationY += deltaX * 0.012;
      targetRotationX += deltaY * 0.012;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (isOpening) {
        // High-energy vibration and rapid spin when unsealing
        const jitter = (Math.random() - 0.5) * 0.08;
        mainGroup.position.x = jitter;
        mainGroup.position.y = jitter;
        targetRotationY += 0.035;
        ringMesh.rotation.z += 0.06;
        dirLight1.intensity = 3.5 + Math.sin(elapsed * 15) * 1.8;
      } else if (!isDragging) {
        // Subtle floating breathing & auto-spin
        targetRotationY += 0.008;
        targetRotationX = Math.sin(elapsed * 1.5) * 0.08;
        mainGroup.position.y = Math.sin(elapsed * 2.0) * 0.07;
        mainGroup.position.x = 0;
        dirLight1.intensity = 3.5;
      }

      // Smooth damping interpolation
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.08;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.08;

      // Pulse ring
      ringMesh.rotation.z += 0.015;

      if (particlePoints) {
        particlePoints.rotation.y = elapsed * (isOpening ? 0.15 : 0.04);
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      renderer?.dispose();
      pouchGeom.dispose();
      pouchMat.dispose();
      sealGeom.dispose();
      sealMat.dispose();
      zipGeom.dispose();
      zipMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [caseId, themeColor, isOpening, showParticles]);

  if (!webGlSupported) {
    return (
      <div className={`flex items-center justify-center rounded-3xl bg-black/40 border border-white/10 ${className}`}>
        <img
          src={`/drop/cases/${caseId}.svg`}
          alt="Case"
          className="max-h-72 object-contain filter drop-shadow-[0_0_30px_rgba(135,55,255,0.4)]"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className} select-none`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md font-mono text-[9px] uppercase tracking-widest text-[#D9D9E2]/60 whitespace-nowrap">
        3D PREVIEW • DRAG / TOUCH TO ROTATE
      </div>
    </div>
  );
}
