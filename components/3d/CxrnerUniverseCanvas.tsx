"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { getUniverseState } from "@/lib/universeBridge";

/**
 * Generates a procedural studio HDR-like environment cube map using PMREMGenerator
 * so metallic obsidian and liquid-chrome geometries reflect crisp studio softboxes
 * without any external HDR network dependency.
 */
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x040307);

  // Overhead cool silver softbox
  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.25, 2.45), side: THREE.DoubleSide })
  );
  topLight.position.set(0, 9, -2);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  // Left Electric Violet studio strip
  const violetStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.72, 3.2), side: THREE.DoubleSide })
  );
  violetStrip.position.set(-9, 1, 2);
  violetStrip.rotation.y = Math.PI / 2;
  envScene.add(violetStrip);

  // Right Neon Cyan rim strip
  const cyanStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.35, 2.75), side: THREE.DoubleSide })
  );
  cyanStrip.position.set(9, -1, 1);
  cyanStrip.rotation.y = -Math.PI / 2;
  envScene.add(cyanStrip);

  // Warm crisp rim light behind sculpture
  const rimStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 2.5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.5, 2.8), side: THREE.DoubleSide })
  );
  rimStrip.position.set(0, 2, -10);
  envScene.add(rimStrip);

  const rt = pmrem.fromScene(envScene, 0.04);
  // Dispose temporary env geometries/materials immediately
  envScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
  pmrem.dispose();
  return rt.texture;
}

export default function CxrnerUniverseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname() || "";
  const isHomeRef = useRef<boolean>(pathname === "/");
  const isDropRef = useRef<boolean>(pathname.startsWith("/drop"));
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    isHomeRef.current = pathname === "/";
    isDropRef.current = pathname.startsWith("/drop");
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: "high-performance",
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.45 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const envTexture = createStudioEnvironment(renderer);
    const scene = new THREE.Scene();
    scene.environment = envTexture;
    scene.fog = new THREE.FogExp2(0x040307, 0.022);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 54 : 44,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );
    camera.position.set(0, 0.2, 16);

    // Architectural Cluster Group (Choreographed by scroll & cursor)
    const cluster = new THREE.Group();
    scene.add(cluster);

    // 1. Central Obsidian Core Faceted Crystal
    const coreGeo = new THREE.IcosahedronGeometry(2.15, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0b0912,
      metalness: 0.94,
      roughness: 0.12,
      envMapIntensity: 1.85,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    cluster.add(coreMesh);

    // Precision Wireframe Over-lattice on Obsidian Core
    const latticeGeo = new THREE.IcosahedronGeometry(2.22, 1);
    const latticeMat = new THREE.MeshBasicMaterial({
      color: 0xb46bff,
      wireframe: true,
      transparent: true,
      opacity: 0.24,
    });
    const latticeMesh = new THREE.Mesh(latticeGeo, latticeMat);
    cluster.add(latticeMesh);

    // 2. Sculptural Chrome Gyroscope Rings
    const ringMatChrome = new THREE.MeshStandardMaterial({
      color: 0xe4e4ee,
      metalness: 1.0,
      roughness: 0.08,
      envMapIntensity: 2.2,
    });

    const outerRingGeo = new THREE.TorusGeometry(3.85, 0.045, 20, 128);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMatChrome);
    outerRing.rotation.set(Math.PI * 0.34, Math.PI * 0.14, 0);
    cluster.add(outerRing);

    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x8737ff,
      metalness: 0.88,
      roughness: 0.16,
      emissive: 0x3b1280,
      emissiveIntensity: 0.55,
    });
    const innerRingGeo = new THREE.TorusGeometry(2.95, 0.032, 16, 108);
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.set(-Math.PI * 0.28, Math.PI * 0.36, 0);
    cluster.add(innerRing);

    const cyanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.32,
    });
    const cyanRingGeo = new THREE.TorusGeometry(4.55, 0.015, 8, 128);
    const cyanRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
    cyanRing.rotation.set(Math.PI * 0.45, -Math.PI * 0.1, 0.3);
    cluster.add(cyanRing);

    // 3. Instanced Chrome Architectural Monolith Shards
    const shardCount = isMobile ? 16 : 28;
    const shardGeo = new THREE.BoxGeometry(0.18, 1.35, 0.24);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xd9d9e2,
      metalness: 0.96,
      roughness: 0.14,
      envMapIntensity: 1.9,
    });
    const shardsMesh = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);

    interface ShardData {
      radius: number;
      angle: number;
      height: number;
      speed: number;
      rotSpeed: number;
      scaleY: number;
      phase: number;
    }

    const shardData: ShardData[] = [];
    for (let i = 0; i < shardCount; i++) {
      const t = i / shardCount;
      shardData.push({
        radius: 4.8 + (i % 4) * 1.15,
        angle: t * Math.PI * 2,
        height: ((i % 7) - 3) * 0.72,
        speed: (0.08 + (i % 5) * 0.025) * (i % 2 === 0 ? 1 : -1),
        rotSpeed: 0.25 + (i % 3) * 0.18,
        scaleY: 0.55 + (i % 4) * 0.38,
        phase: i * 1.17,
      });
    }
    cluster.add(shardsMesh);

    // 4. Deep Spatial Ambient Metallic Dust & Ion Particles
    const particleCount = isMobile ? 220 : 520;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);

    const cChrome = new THREE.Color(0xe6e6f0);
    const cViolet = new THREE.Color(0x9b51ff);
    const cCyan = new THREE.Color(0x00f0ff);

    for (let i = 0; i < particleCount; i++) {
      const spreadX = 36;
      const spreadY = 24;
      const spreadZ = 34;
      pPositions[i * 3] = (Math.random() - 0.5) * spreadX;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ - 4;

      const pick = Math.random();
      const c = pick > 0.88 ? cCyan : pick > 0.52 ? cViolet : cChrome;
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;

      pSizes[i] = Math.random() * 2.2 + 0.6;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: isMobile ? 0.085 : 0.068,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Direct studio lights reinforcing reflections & subtle atmosphere shift
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x8737ff, 14, 38, 1.5);
    rimLight.position.set(-7, -3, 7);
    scene.add(rimLight);

    const cyanFill = new THREE.PointLight(0x00f0ff, 7, 32, 1.5);
    cyanFill.position.set(8, -5, 4);
    scene.add(cyanFill);

    // Input & Scroll Choreography State
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let isDragging = false;
    let lastDragX = 0;
    let lastDragY = 0;
    let manualRotY = 0;
    let manualRotX = 0;

    const handlePointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        manualRotY += dx * 0.0055;
        manualRotX += dy * 0.004;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Allow dragging background without stealing button clicks
      const target = e.target as HTMLElement;
      if (target && (target.closest("button") || target.closest("a") || target.closest("input"))) {
        return;
      }
      isDragging = true;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleResize = () => {
      if (!renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.fov = w < 768 ? 54 : 44;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("resize", handleResize);

    const dummy = new THREE.Object3D();
    const clock = new THREE.Clock();
    let rafId = 0;
    let isDisposed = false;
    let isDocumentHidden = document.hidden;

    const onVisibilityChange = () => {
      isDocumentHidden = document.hidden;
      if (!isDocumentHidden) {
        clock.getDelta();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const renderFrame = () => {
      if (isDisposed || !renderer) return;
      rafId = window.requestAnimationFrame(renderFrame);
      if (isDocumentHidden) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const bridge = getUniverseState();

      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      // Consume queued bridge drag impulses
      if (bridge.dragDeltaX !== 0 || bridge.dragDeltaY !== 0) {
        manualRotY += bridge.dragDeltaX * 0.01;
        manualRotX += bridge.dragDeltaY * 0.01;
        bridge.dragDeltaX = 0;
        bridge.dragDeltaY = 0;
      }

      // Compute document scroll progress [0..1]
      const scrollMax = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollNorm = Math.min(1, Math.max(0, window.scrollY / scrollMax));

      // Decay burst shockwave & disruption
      if (bridge.shockwave > 0.002) {
        bridge.shockwave *= Math.pow(0.06, dt);
      } else {
        bridge.shockwave = 0;
      }

      if (bridge.disruption > 0.002) {
        bridge.disruption *= Math.pow(0.08, dt);
      } else {
        bridge.disruption = 0;
      }

      const audioPulse = bridge.audioPlaying ? bridge.audioEnergy : 0;
      const atmos = bridge.atmosphereColor;
      if (atmos) {
        rimLight.color.setRGB(
          0.45 + atmos[0] * 0.55,
          0.25 + atmos[1] * 0.55,
          0.55 + atmos[2] * 0.45
        );
      }

      // Section-responsive 3D Composition Choreography:
      // Hero (0.0): Monument sits to the right on desktop so title typography breathes on left
      // Middle Sections (0.35 - 0.7): Glides smoothly across center-back with atmospheric zoom
      // Lower Sections / /drop: Pulls gently left/center with deep sculptural presence
      const desktopRightBias = window.innerWidth >= 1024 ? 3.55 : 0;
      let targetX = 0;
      let targetY = 0;
      let targetZ = -1.5;

      if (isHomeRef.current) {
        const waveX = Math.cos(scrollNorm * Math.PI * 2.2) * desktopRightBias;
        targetX = waveX + mouseX * 0.85;
        targetY = Math.sin(scrollNorm * Math.PI * 1.5) * 1.15 + mouseY * 0.55;
        targetZ = -1.2 - Math.sin(scrollNorm * Math.PI) * 3.8 + audioPulse * 0.75;
      } else if (isDropRef.current) {
        // Subtle atmospheric perimeter so /drop local 3D specimen canvas takes center stage
        targetX = mouseX * 0.5;
        targetY = 0.6 + mouseY * 0.4;
        targetZ = -6.5;
      } else {
        targetX = mouseX * 0.6;
        targetY = mouseY * 0.4;
        targetZ = -3.8;
      }

      cluster.position.x += (targetX - cluster.position.x) * 0.055;
      cluster.position.y += (targetY - cluster.position.y) * 0.055;
      cluster.position.z += (targetZ - cluster.position.z) * 0.055;

      const motionFactor = reducedMotion ? 0.15 : 1.0;

      // Smooth architectural sculpture rotation
      cluster.rotation.y =
        elapsed * 0.11 * motionFactor +
        scrollNorm * Math.PI * 1.8 +
        manualRotY +
        mouseX * 0.28;
      cluster.rotation.x =
        Math.sin(elapsed * 0.25) * 0.14 * motionFactor +
        manualRotX +
        mouseY * 0.18;

      const scalePulse =
        1 +
        audioPulse * 0.14 +
        bridge.shockwave * 0.22 -
        bridge.disruption * 0.08;
      coreMesh.scale.setScalar(scalePulse);
      latticeMesh.scale.setScalar(
        scalePulse * (1.03 + bridge.disruption * 0.35 + audioPulse * 0.08)
      );
      latticeMat.opacity = Math.min(0.85, 0.2 + bridge.disruption * 0.55 + audioPulse * 0.3);

      coreMesh.rotation.y += dt * (0.28 + audioPulse * 1.2) * motionFactor;
      coreMesh.rotation.z += dt * 0.14 * motionFactor;

      outerRing.rotation.z += dt * (0.18 + bridge.shockwave * 1.5) * motionFactor;
      innerRing.rotation.x -= dt * (0.24 + audioPulse * 0.8) * motionFactor;
      cyanRing.rotation.y += dt * 0.15 * motionFactor;

      // Update Instanced Chrome Architectural Blades
      const spreadBoost = 1 + bridge.disruption * 0.72 + bridge.shockwave * 0.4;
      for (let i = 0; i < shardCount; i++) {
        const s = shardData[i];
        const angle = s.angle + elapsed * s.speed * motionFactor;
        const r = s.radius * spreadBoost + (bridge.targetNodeIndex === i ? 0.9 : 0);
        dummy.position.set(
          Math.cos(angle) * r,
          s.height + Math.sin(elapsed * 0.7 + s.phase) * 0.45 * motionFactor,
          Math.sin(angle) * r
        );
        dummy.lookAt(0, dummy.position.y, 0);
        dummy.rotateX(elapsed * s.rotSpeed * motionFactor);
        dummy.scale.set(
          1 + bridge.hoverIntensity * 0.2,
          s.scaleY + audioPulse * 0.45,
          1
        );
        dummy.updateMatrix();
        shardsMesh.setMatrixAt(i, dummy.matrix);
      }
      shardsMesh.instanceMatrix.needsUpdate = true;

      // Gentle cosmic drift of particle field
      particleSystem.rotation.y = elapsed * 0.018 * motionFactor + mouseX * 0.05;
      particleSystem.rotation.x = mouseY * 0.04;

      // Subtle Camera Breathing & Scroll FOV Shift
      camera.position.x += (mouseX * 0.65 - camera.position.x) * 0.04;
      camera.position.y += (0.2 + mouseY * 0.45 - camera.position.y) * 0.04;
      camera.lookAt(cluster.position.x * 0.28, cluster.position.y * 0.25, -1);

      renderer.render(scene, camera);
    };

    renderFrame();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);

      coreGeo.dispose();
      coreMat.dispose();
      latticeGeo.dispose();
      latticeMat.dispose();
      outerRingGeo.dispose();
      innerRingGeo.dispose();
      cyanRingGeo.dispose();
      ringMatChrome.dispose();
      innerRingMat.dispose();
      cyanRingMat.dispose();
      shardGeo.dispose();
      shardMat.dispose();
      shardsMesh.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      envTexture.dispose();

      renderer?.dispose();
    };
  }, []);

  if (fallbackActive) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 75% 28%, rgba(180,107,255,0.16) 0%, transparent 45%), radial-gradient(circle at 25% 75%, rgba(0,240,255,0.1) 0%, transparent 40%)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
