"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { getUniverseState, triggerUniverseDisrupt } from "../../lib/universeBridge";
import { playQuantumDisrupt } from "../../lib/soundFX";

/**
 * CXRNER MUSIC — Deep Space Cosmic Engine
 *
 * Clean, artifact-free deep space environment:
 *  - Volumetric deep-space Nebula backdrop shader (dark obsidian, subtle violet & indigo clouds)
 *  - Multi-layer 3D Starfield (far, mid, near stars) with scroll warp & smooth pointer parallax
 *  - Subtle distant orbital horizon rings (low-contrast dark chrome, never competing with UI text)
 *  - Zero overlapping bright geometry, zero z-fighting, stable 60 FPS on desktop & iOS Safari
 */

const NEBULA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uEnergy;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(1.0, uResolution.y), 1.0);
    vec2 p = (vUv - 0.5) * aspect;
    p += uPointer * 0.04;

    float t = uTime * 0.035;
    float n1 = fbm(p * 1.45 + vec2(t, -t * 0.6 + uScroll * 0.9));
    float n2 = fbm(p * 2.3 - vec2(t * 0.8, uScroll * 1.4) + n1 * 0.65);

    float nebula = smoothstep(0.32, 0.88, n1 * 0.55 + n2 * 0.45);
    float coreGlow = exp(-length(p - vec2(0.15, 0.05)) * 2.1);

    vec3 spaceVoid = vec3(0.016, 0.012, 0.028);
    vec3 deepIndigo = vec3(0.06, 0.03, 0.14);
    vec3 cosmicViolet = vec3(0.28, 0.10, 0.55);
    vec3 subtleCyan = vec3(0.03, 0.22, 0.34);

    vec3 col = spaceVoid;
    col = mix(col, deepIndigo, nebula * 0.85);
    col += cosmicViolet * (nebula * n2 * (0.38 + uEnergy * 0.25));
    col += cosmicViolet * coreGlow * (0.18 + uEnergy * 0.15);
    col += subtleCyan * smoothstep(0.55, 0.95, n2) * 0.14;

    // Subtle vignette so edges stay deep and clean
    float vig = smoothstep(1.35, 0.25, length(vUv - 0.5));
    col *= mix(0.65, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const STAR_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uEnergy;
  uniform float uWarp;
  attribute float aSize;
  attribute float aSeed;
  attribute float aLayer;
  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 pos = position;

    // Continuous deep-space drift + scroll flight along Z
    float speed = (0.35 + aLayer * 0.55) * (1.0 + uWarp * 3.5);
    float zSpan = 110.0;
    pos.z = mod(pos.z + uScroll * (26.0 + aLayer * 18.0) + uTime * speed + 95.0, zSpan) - 95.0;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = max(-mvPos.z, 0.5);

    gl_PointSize = aSize * uPixelRatio * (1.0 + uEnergy * 0.3) * (85.0 / dist);
    gl_PointSize = clamp(gl_PointSize, 1.0, 9.0);

    float nearFade = smoothstep(1.2, 6.0, dist);
    float farFade = smoothstep(98.0, 28.0, dist);
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.2 + aSeed * 2.4) + aSeed * 31.4);

    vAlpha = nearFade * farFade * twinkle * (0.55 + aLayer * 0.25);
    vTint = fract(aSeed * 7.13);

    gl_Position = projectionMatrix * mvPos;
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;
  varying float vTint;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    // Crisp star core + soft halo
    float core = exp(-r * r * 9.0);
    float halo = exp(-r * r * 2.6) * 0.35;

    vec3 pureWhite = vec3(0.95, 0.96, 1.0);
    vec3 softViolet = vec3(0.75, 0.55, 1.0);
    vec3 iceBlue = vec3(0.55, 0.85, 1.0);

    vec3 col = pureWhite;
    if (vTint > 0.72) col = mix(pureWhite, softViolet, 0.7);
    else if (vTint > 0.48) col = mix(pureWhite, iceBlue, 0.55);

    gl_FragColor = vec4(col, (core + halo) * vAlpha);
  }
`;

export default function CxrnerUniverseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname() || "";
  const isHomeRef = useRef<boolean>(pathname === "/");
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  useEffect(() => {
    isHomeRef.current = pathname === "/";
  }, [pathname]);

  if (pathname.startsWith("/link") || pathname.startsWith("/admin") || pathname.startsWith("/miniapp")) {
    return null;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const isMobileInit = window.innerWidth < 768;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobileInit,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const dprCap = isMobileInit ? 1.5 : 2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040308);

    const camera = new THREE.PerspectiveCamera(
      isMobileInit ? 56 : 48,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      140
    );
    camera.position.set(0, 0, 8);

    // =========================================================================
    // 1. FULLSCREEN NEBULA BACKDROP (Always behind everything, zero depth write)
    // =========================================================================
    const nebulaUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uEnergy: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const nebulaGeo = new THREE.PlaneGeometry(2, 2);
    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      uniforms: nebulaUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.frustumCulled = false;
    nebulaMesh.renderOrder = -10;
    scene.add(nebulaMesh);

    // =========================================================================
    // 2. MULTI-LAYER DEEP STARFIELD
    // =========================================================================
    const starCount = isMobileInit ? 650 : 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starSeeds = new Float32Array(starCount);
    const starLayers = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const layer = i % 3; // 0 = far, 1 = mid, 2 = near
      const spreadX = 48 + layer * 14;
      const spreadY = 34 + layer * 10;

      starPositions[i * 3] = (Math.random() - 0.5) * spreadX;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
      starPositions[i * 3 + 2] = -Math.random() * 105 + 5;

      starSizes[i] = layer === 0 ? 0.9 + Math.random() * 0.9 : layer === 1 ? 1.3 + Math.random() * 1.3 : 1.8 + Math.random() * 1.8;
      starSeeds[i] = Math.random();
      starLayers[i] = layer * 0.5;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute("aSeed", new THREE.BufferAttribute(starSeeds, 1));
    starGeo.setAttribute("aLayer", new THREE.BufferAttribute(starLayers, 1));

    const starUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uEnergy: { value: 0 },
      uWarp: { value: 0 },
    };

    const starMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      uniforms: starUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeo, starMat);
    starField.frustumCulled = false;
    scene.add(starField);

    // =========================================================================
    // 3. DISTANT SUBTLE ORBITAL HORIZON RINGS (Low-contrast, far behind UI)
    // =========================================================================
    const horizonGroup = new THREE.Group();
    horizonGroup.position.set(isMobileInit ? 0 : 3.2, 0.2, -18);
    scene.add(horizonGroup);

    const ringGeo1 = new THREE.TorusGeometry(6.8, 0.018, 8, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x8737ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const horizonRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    horizonRing1.rotation.set(Math.PI * 0.36, 0.25, 0);

    const ringGeo2 = new THREE.TorusGeometry(9.4, 0.012, 8, 140);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xa5b4fc,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const horizonRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    horizonRing2.rotation.set(-Math.PI * 0.28, -0.35, 0.2);

    horizonGroup.add(horizonRing1, horizonRing2);

    // =========================================================================
    // 4. SCROLL, POINTER & RESIZE HANDLERS
    // =========================================================================
    let scrollTarget = 0;
    let smoothScroll = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    let isMobile = isMobileInit;

    const updateScroll = () => {
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollTarget = THREE.MathUtils.clamp(window.scrollY / docHeight, 0, 1);
    };
    updateScroll();

    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerY = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      pointerX = (t.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerY = -(t.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        isHomeRef.current &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        triggerUniverseDisrupt();
        playQuantumDisrupt();
      }
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      isMobile = w < 768;
      const pr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      starUniforms.uPixelRatio.value = pr;
      nebulaUniforms.uResolution.value.set(w, h);
      camera.fov = isMobile ? 56 : 48;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    // =========================================================================
    // 5. ANIMATION LOOP
    // =========================================================================
    let rafId = 0;
    let isVisible = true;
    let elapsed = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      if (!isVisible) return;
      rafId = requestAnimationFrame(renderFrame);

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      const uState = getUniverseState();
      uState.shockwave = Math.max(0, uState.shockwave - dt * 1.4);
      uState.disruption = Math.max(0, uState.disruption - dt * 0.9);
      uState.dragDeltaX *= 0.92;
      uState.dragDeltaY *= 0.92;

      smoothScroll = THREE.MathUtils.lerp(smoothScroll, isHomeRef.current ? scrollTarget : 0.05, 0.08);
      smoothPointerX = THREE.MathUtils.lerp(smoothPointerX, pointerX, 0.05);
      smoothPointerY = THREE.MathUtils.lerp(smoothPointerY, pointerY, 0.05);

      const s = smoothScroll;
      const energy = Math.min(1, uState.audioEnergy + uState.shockwave * 0.65);

      // Smooth camera parallax
      camera.position.x = smoothPointerX * (isMobile ? 0.3 : 0.75) + Math.sin(s * Math.PI) * 0.6;
      camera.position.y = smoothPointerY * (isMobile ? 0.25 : 0.55) + Math.cos(s * Math.PI * 0.8) * 0.35;
      camera.lookAt(smoothPointerX * 0.15, smoothPointerY * 0.15, -24);

      // Update Nebula
      nebulaUniforms.uTime.value = elapsed;
      nebulaUniforms.uScroll.value = s;
      nebulaUniforms.uEnergy.value = energy;
      nebulaUniforms.uPointer.value.set(smoothPointerX, smoothPointerY);

      // Update Starfield
      starUniforms.uTime.value = elapsed;
      starUniforms.uScroll.value = s;
      starUniforms.uEnergy.value = energy;
      starUniforms.uWarp.value = uState.disruption;
      starField.rotation.z = elapsed * 0.008 + s * 0.18 + uState.dragDeltaX * 0.2;

      // Subtle distant orbital rings
      horizonGroup.position.x = THREE.MathUtils.lerp(isMobile ? 0 : 3.2, isMobile ? 0 : -2.4, s);
      horizonGroup.rotation.y = elapsed * 0.04 + smoothPointerX * 0.12 + s * 0.8;
      horizonGroup.rotation.x = smoothPointerY * 0.08;
      horizonRing1.rotation.z = elapsed * 0.05;
      horizonRing2.rotation.z = -elapsed * 0.035;
      ringMat1.opacity = 0.18 + energy * 0.18;

      renderer.render(scene, camera);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else {
        isVisible = true;
        lastTime = performance.now();
        if (!rafId) {
          rafId = requestAnimationFrame(renderFrame);
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    rafId = requestAnimationFrame(renderFrame);

    // =========================================================================
    // 6. FULL GPU RESOURCE DISPOSAL
    // =========================================================================
    return () => {
      isVisible = false;
      if (rafId) cancelAnimationFrame(rafId);

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      nebulaGeo.dispose();
      nebulaMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();

      renderer.dispose();
    };
  }, []);

  if (webglUnsupported) {
    return (
      <div className="absolute inset-0 bg-[#040308] overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-[460px] h-[460px] rounded-full bg-[#8737FF]/15 blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-[#00F0FF]/8 blur-[160px]" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
