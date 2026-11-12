"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { getUniverseState } from "../../lib/universeBridge";

/**
 * CXRNER MUSIC — Unified 3D Cosmic Universe Engine
 *
 * Single continuous WebGL scene synchronized with scroll progress, mouse/touch parallax,
 * and real-time audio frequencies:
 *  - Procedural PMREM Studio Reflection Environment (dark chrome & violet edge highlights)
 *  - Atmospheric Volumetric Nebula Shader Backdrop
 *  - Central CXRNER Cosmic Core (GLSL plasma energy sphere + metallic geodesic cage +
 *    3 counter-rotating chrome gyroscopic rings + grooved vinyl halo + instanced orbital shards)
 *  - Sweeping Chrome Megaring (passes across composition during About / Releases scroll)
 *  - Digital Distribution Constellation Network (InstancedMesh DSP satellites + animated pulse filaments)
 *  - Architectural Monolith Prisms (InstancedMesh chrome-obsidian towers)
 *  - Volumetric Energy Portal (GLSL swirling vortex + dual chrome rings for Section 07)
 *  - Multi-layer Cosmic Dust & Volumetric Micro-Particles (custom GLSL Points shader)
 */

const PLASMA_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uHover;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;
  varying float vNoise;

  // Compact 3D pseudo-simplex turbulence
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise3D(p);
      p = p * 2.05 + vec3(1.7, 9.2, 4.3);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vLocalPos = position;
    float t = uTime * 0.65;
    float n = fbm(position * 2.1 + vec3(t, -t * 0.7, t * 0.4));
    vNoise = n;

    float disp = (n - 0.5) * (0.14 + uAudioBass * 0.24 + uHover * 0.08);
    vec3 displaced = position + normal * disp;

    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewPos = -mvPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PLASMA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform float uHover;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;
  varying float vNoise;

  void main() {
    vec3 viewDir = normalize(vViewPos);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.4);

    vec3 deepObsidian = vec3(0.035, 0.02, 0.07);
    vec3 electricPurple = vec3(0.529, 0.216, 1.0); // #8737FF
    vec3 neonViolet = vec3(0.706, 0.420, 1.0);     // #B46BFF
    vec3 chromeWhite = vec3(0.95, 0.95, 1.0);

    float vein = smoothstep(0.46, 0.74, vNoise + sin(vLocalPos.y * 5.0 - uTime * 2.2) * 0.08);
    float pulse = 0.75 + 0.25 * sin(uTime * 2.5) + uAudioBass * 0.7;

    vec3 col = mix(deepObsidian, electricPurple, vein * 0.9);
    col = mix(col, neonViolet, fresnel * 0.95);
    col += chromeWhite * pow(fresnel, 4.0) * (0.65 + uAudioMid * 0.65 + uHover * 0.35);
    col *= pulse;

    gl_FragColor = vec4(col, 0.96);
  }
`;

const PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScrollVelocity;
  uniform float uAudioEnergy;
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // Gentle orbital drift
    float drift = uTime * 0.22 + aPhase;
    pos.x += sin(drift * 0.9) * 0.35;
    pos.y += cos(drift * 0.7) * 0.35;
    pos.z += sin(drift * 0.5) * 0.25 - uScrollVelocity * 1.6;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = max(-mvPos.z, 1.0);

    float twinkle = 0.62 + 0.38 * sin(uTime * 1.8 + aPhase * 6.28);
    vAlpha = twinkle * smoothstep(95.0, 6.0, dist);

    float size = aScale * uPixelRatio * (1.0 + uAudioEnergy * 0.45) * (92.0 / dist);
    gl_PointSize = clamp(size, 1.2, 22.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.2);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

const NEBULA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uAudioEnergy;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm2(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise2(p);
      p = p * 2.02 + vec2(3.1, 7.4);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 centered = uv - 0.5;

    // Subtle pointer & scroll drift
    vec2 flow = vec2(uTime * 0.015 + uPointer.x * 0.03, -uScroll * 0.35 + uPointer.y * 0.02);
    float n1 = fbm2(uv * 2.6 + flow);
    float n2 = fbm2(uv * 4.2 - flow * 0.6 + vec2(n1 * 0.7));

    // Volumetric diagonal light shaft
    float beam = exp(-pow((centered.x * 0.8 + centered.y * 0.45 + 0.05), 2.0) * 6.5);
    float radial = exp(-dot(centered, centered) * 3.4);

    vec3 deepBlack = vec3(0.020, 0.016, 0.027);   // #050407
    vec3 cosmicBlack = vec3(0.035, 0.024, 0.067); // #090611
    vec3 darkViolet = vec3(0.086, 0.043, 0.157);  // #160B28
    vec3 electricPurple = vec3(0.529, 0.216, 1.0);

    vec3 col = mix(deepBlack, cosmicBlack, smoothstep(0.2, 0.85, n1));
    col = mix(col, darkViolet, smoothstep(0.45, 0.92, n2) * (0.48 + radial * 0.35));

    // Restrained volumetric glow
    float energyMask = beam * n2 * (0.14 + uAudioEnergy * 0.12 + smoothstep(0.65, 1.0, uScroll) * 0.12);
    col += electricPurple * energyMask;

    // Subtle chromatic edge vignette
    float vignette = smoothstep(0.95, 0.22, length(centered));
    col *= mix(0.62, 1.0, vignette);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const PORTAL_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PORTAL_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float a = atan(p.y, p.x);

    float ring = exp(-pow((r - 0.62) * 5.2, 2.0));
    float innerVortex = smoothstep(0.7, 0.05, r) * (0.5 + 0.5 * sin(a * 6.0 - uTime * 3.0 + r * 10.0));
    float swirl = sin(a * 4.0 + uTime * 2.4 - r * 12.0) * 0.5 + 0.5;

    vec3 electric = vec3(0.529, 0.216, 1.0);
    vec3 neon = vec3(0.706, 0.420, 1.0);
    vec3 chrome = vec3(0.92, 0.93, 0.98);

    vec3 col = mix(electric, neon, swirl) * (ring * 1.4 + innerVortex * 0.45);
    col += chrome * pow(ring, 3.0) * 0.85;

    float alpha = clamp((ring + innerVortex * 0.45) * uIntensity, 0.0, 0.92);
    if (r > 0.98) alpha = 0.0;

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function CxrnerUniverseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isHomeRef = useRef(isHome);
  isHomeRef.current = isHome;

  const [webglUnsupported, setWebglUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. RENDERER
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: !isMobile,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const baseDpr = isMobile
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(baseDpr);
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // 2. SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 54 : 44,
      width / Math.max(height, 1),
      0.1,
      200
    );
    const baseCamZ = isMobile ? 7.6 : 6.2;
    camera.position.set(0, 0, isHomeRef.current && !prefersReducedMotion ? 11.2 : baseCamZ);

    // 3. PROCEDURAL COSMIC STUDIO ENVIRONMENT (for crisp realistic chrome reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x050407);

    const envStripMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const envStripMat2 = new THREE.MeshBasicMaterial({ color: 0x8737ff });
    const envStripMat3 = new THREE.MeshBasicMaterial({ color: 0xd9d9e2 });
    const envStripGeo = new THREE.PlaneGeometry(14, 1.4);

    const envStrip1 = new THREE.Mesh(envStripGeo, envStripMat1);
    envStrip1.position.set(0, 7, 4);
    envStrip1.lookAt(0, 0, 0);
    envScene.add(envStrip1);

    const envStrip2 = new THREE.Mesh(envStripGeo, envStripMat2);
    envStrip2.position.set(8, -2, 3);
    envStrip2.lookAt(0, 0, 0);
    envScene.add(envStrip2);

    const envStrip3 = new THREE.Mesh(envStripGeo, envStripMat3);
    envStrip3.position.set(-8, 2, -4);
    envStrip3.lookAt(0, 0, 0);
    envScene.add(envStrip3);

    const envRT = pmremGenerator.fromScene(envScene, 0.03);
    scene.environment = envRT.texture;
    envStripGeo.dispose();
    envStripMat1.dispose();
    envStripMat2.dispose();
    envStripMat3.dispose();
    pmremGenerator.dispose();

    // 4. VOLUMETRIC NEBULA BACKDROP PLANE
    const nebulaGeo = new THREE.PlaneGeometry(2, 2);
    const nebulaUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAudioEnergy: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    };
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

    // 5. LIGHTING
    const ambientLight = new THREE.AmbientLight(0x160b28, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-4, 6, 7);
    scene.add(keyLight);

    const violetRimLight = new THREE.DirectionalLight(0x8737ff, 4.2);
    violetRimLight.position.set(6, -3, 3);
    scene.add(violetRimLight);

    const silverKickLight = new THREE.DirectionalLight(0xd9d9e2, 2.2);
    silverKickLight.position.set(-5, -5, 2);
    scene.add(silverKickLight);

    const pointerLight = new THREE.PointLight(0xb46bff, 3.6, 18);
    pointerLight.position.set(0, 0, 4.5);
    scene.add(pointerLight);

    // 6. SHARED METALLIC & OBSIDIAN MATERIALS
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9d9e2,
      metalness: 0.96,
      roughness: 0.12,
      envMapIntensity: 1.6,
    });

    const darkChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b1628,
      metalness: 0.92,
      roughness: 0.18,
      envMapIntensity: 1.4,
    });

    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x090611,
      metalness: 0.85,
      roughness: 0.24,
      envMapIntensity: 1.2,
    });

    const violetWireMaterial = new THREE.MeshBasicMaterial({
      color: 0x8737ff,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    });

    // =========================================================================
    // 7. CENTRAL HERO SYMBOL — CXRNER COSMIC CORE
    // =========================================================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(isMobile ? 0 : 1.75, isMobile ? 0.45 : 0.05, 0);
    scene.add(coreGroup);

    // 7a. Inner Plasma Energy Core (Custom GLSL Shader)
    const plasmaGeo = new THREE.IcosahedronGeometry(0.95, isMobile ? 3 : 5);
    const plasmaUniforms = {
      uTime: { value: 0 },
      uAudioBass: { value: 0 },
      uAudioMid: { value: 0 },
      uHover: { value: 0 },
    };
    const plasmaMat = new THREE.ShaderMaterial({
      vertexShader: PLASMA_VERTEX_SHADER,
      fragmentShader: PLASMA_FRAGMENT_SHADER,
      uniforms: plasmaUniforms,
      transparent: true,
    });
    const plasmaCore = new THREE.Mesh(plasmaGeo, plasmaMat);
    coreGroup.add(plasmaCore);

    // 7b. Outer Geodesic Metallic Cage (Edges + Subtle Violet Energy Frame)
    const cageGeo = new THREE.IcosahedronGeometry(1.36, 1);
    const cageEdgesGeo = new THREE.EdgesGeometry(cageGeo);
    const cageLineMat = new THREE.LineBasicMaterial({
      color: 0xd9d9e2,
      transparent: true,
      opacity: 0.72,
    });
    const cageLines = new THREE.LineSegments(cageEdgesGeo, cageLineMat);
    coreGroup.add(cageLines);

    const innerCageMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.22, 1),
      violetWireMaterial
    );
    coreGroup.add(innerCageMesh);

    // 7c. 3 Counter-Rotating Chrome Gyroscopic Rings
    const gyroRing1Geo = new THREE.TorusGeometry(1.62, 0.028, 16, isMobile ? 64 : 112);
    const gyroRing1 = new THREE.Mesh(gyroRing1Geo, chromeMaterial);
    gyroRing1.rotation.x = 0.65;
    gyroRing1.rotation.y = 0.35;
    coreGroup.add(gyroRing1);

    const gyroRing2Geo = new THREE.TorusGeometry(1.92, 0.018, 14, isMobile ? 64 : 112);
    const gyroRing2 = new THREE.Mesh(gyroRing2Geo, darkChromeMaterial);
    gyroRing2.rotation.x = -0.78;
    gyroRing2.rotation.z = 0.52;
    coreGroup.add(gyroRing2);

    const gyroRing3Geo = new THREE.TorusGeometry(2.22, 0.012, 12, isMobile ? 64 : 96);
    const gyroRing3Mat = new THREE.MeshBasicMaterial({
      color: 0xb46bff,
      transparent: true,
      opacity: 0.55,
    });
    const gyroRing3 = new THREE.Mesh(gyroRing3Geo, gyroRing3Mat);
    gyroRing3.rotation.y = 0.95;
    coreGroup.add(gyroRing3);

    // 7d. Grooved Obsidian Vinyl Orbital Halo (Music Label Identity Bridge)
    const vinylHaloGeo = new THREE.RingGeometry(1.42, 1.56, isMobile ? 48 : 96);
    const vinylHaloMat = new THREE.MeshStandardMaterial({
      color: 0x090611,
      metalness: 0.94,
      roughness: 0.16,
      side: THREE.DoubleSide,
      envMapIntensity: 1.5,
    });
    const vinylHalo = new THREE.Mesh(vinylHaloGeo, vinylHaloMat);
    vinylHalo.rotation.x = Math.PI * 0.35;
    coreGroup.add(vinylHalo);

    // 7e. Instanced Orbital Crystalline Shards (InstancedMesh)
    const shardCount = isMobile ? 16 : 36;
    const shardGeo = new THREE.OctahedronGeometry(0.065, 0);
    const shardInstanced = new THREE.InstancedMesh(shardGeo, chromeMaterial, shardCount);
    const shardData = Array.from({ length: shardCount }, (_, i) => ({
      radius: 1.75 + (i % 5) * 0.24,
      speed: 0.32 + (i % 7) * 0.08,
      angle: (i / shardCount) * Math.PI * 2,
      tilt: ((i % 4) - 1.5) * 0.45,
      scale: 0.65 + (i % 3) * 0.45,
    }));
    coreGroup.add(shardInstanced);

    // =========================================================================
    // 8. SWEEPING CHROME MEGARING (Scroll Foreground/Midground Transition)
    // =========================================================================
    const megaRingGroup = new THREE.Group();
    const megaRingGeo = new THREE.TorusGeometry(4.2, 0.055, 20, isMobile ? 64 : 120);
    const megaRing = new THREE.Mesh(megaRingGeo, chromeMaterial);
    megaRingGroup.add(megaRing);

    const megaRingGlowGeo = new THREE.TorusGeometry(4.2, 0.015, 10, isMobile ? 64 : 96);
    const megaRingGlowMat = new THREE.MeshBasicMaterial({
      color: 0x8737ff,
      transparent: true,
      opacity: 0.5,
    });
    const megaRingGlow = new THREE.Mesh(megaRingGlowGeo, megaRingGlowMat);
    megaRingGroup.add(megaRingGlow);

    megaRingGroup.position.set(-4.5, -1.5, -3.5);
    megaRingGroup.rotation.set(1.1, 0.4, 0.2);
    scene.add(megaRingGroup);

    // =========================================================================
    // 9. DISTRIBUTION DIGITAL NETWORK CONSTELLATION (Section 05)
    // =========================================================================
    const networkGroup = new THREE.Group();
    const nodeCount = isMobile ? 24 : 48;
    const nodeGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0xd9d9e2,
      transparent: true,
      opacity: 0.85,
    });
    const networkNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);

    const nodePositions: THREE.Vector3[] = [];
    const linePoints: number[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const netRadius = 3.1;

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / Math.max(1, nodeCount - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * r * netRadius;
      const z = Math.sin(theta) * r * netRadius;
      const py = y * netRadius;
      nodePositions.push(new THREE.Vector3(x, py, z));

      // Radial beam from core
      linePoints.push(0, 0, 0, x, py, z);
      // Link to neighbor
      if (i > 0) {
        const prev = nodePositions[i - 1];
        linePoints.push(prev.x, prev.y, prev.z, x, py, z);
      }
    }

    const netLineGeo = new THREE.BufferGeometry();
    netLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePoints, 3));
    const netLineMat = new THREE.LineBasicMaterial({
      color: 0x8737ff,
      transparent: true,
      opacity: 0.0,
    });
    const netLines = new THREE.LineSegments(netLineGeo, netLineMat);
    networkGroup.add(netLines);
    networkGroup.add(networkNodes);
    networkGroup.scale.setScalar(0.01);
    scene.add(networkGroup);

    // =========================================================================
    // 10. ARCHITECTURAL MONOLITH PRISMS (Section 06)
    // =========================================================================
    const monolithGroup = new THREE.Group();
    const monolithCount = isMobile ? 8 : 16;
    const monolithGeo = new THREE.BoxGeometry(0.11, 2.4, 0.11);
    const monolithInstanced = new THREE.InstancedMesh(
      monolithGeo,
      obsidianMaterial,
      monolithCount
    );
    const monolithSeeds = Array.from({ length: monolithCount }, (_, i) => ({
      angle: (i / monolithCount) * Math.PI * 2,
      radius: 5.8 + (i % 3) * 0.9,
      yOffset: ((i % 4) - 1.5) * 0.9,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * 0.15,
    }));
    monolithGroup.add(monolithInstanced);
    monolithGroup.visible = false;
    scene.add(monolithGroup);

    // =========================================================================
    // 11. VOLUMETRIC ENERGY PORTAL (Section 07 — Send Your Release)
    // =========================================================================
    const portalGroup = new THREE.Group();
    const portalGeo = new THREE.PlaneGeometry(5.6, 5.6);
    const portalUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    };
    const portalMat = new THREE.ShaderMaterial({
      vertexShader: PORTAL_VERTEX_SHADER,
      fragmentShader: PORTAL_FRAGMENT_SHADER,
      uniforms: portalUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const portalPlane = new THREE.Mesh(portalGeo, portalMat);
    portalGroup.add(portalPlane);

    const portalChromeGeo = new THREE.TorusGeometry(1.75, 0.032, 16, isMobile ? 48 : 96);
    const portalChromeRing = new THREE.Mesh(portalChromeGeo, chromeMaterial);
    portalGroup.add(portalChromeRing);

    portalGroup.position.set(0, 0, -2.5);
    portalGroup.scale.setScalar(0.01);
    portalGroup.visible = false;
    scene.add(portalGroup);

    // =========================================================================
    // 12. MULTI-LAYER COSMIC DUST & VOLUMETRIC PARTICLES
    // =========================================================================
    const particleCount = isMobile ? 260 : 900;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pScales = new Float32Array(particleCount);
    const pPhases = new Float32Array(particleCount);

    const colWhite = new THREE.Color(0xffffff);
    const colSilver = new THREE.Color(0xd9d9e2);
    const colPurple = new THREE.Color(0x8737ff);
    const colViolet = new THREE.Color(0xb46bff);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 26;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 32 - 4;

      pScales[i] = 0.55 + Math.random() * 1.9;
      pPhases[i] = Math.random();

      const r = Math.random();
      const chosen =
        r < 0.14
          ? colPurple
          : r < 0.28
          ? colViolet
          : r < 0.65
          ? colSilver
          : colWhite;
      pColors[i * 3] = chosen.r;
      pColors[i * 3 + 1] = chosen.g;
      pColors[i * 3 + 2] = chosen.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute("aColor", new THREE.BufferAttribute(pColors, 3));
    particleGeo.setAttribute("aScale", new THREE.BufferAttribute(pScales, 1));
    particleGeo.setAttribute("aPhase", new THREE.BufferAttribute(pPhases, 1));

    const particleUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: baseDpr },
      uScrollVelocity: { value: 0 },
      uAudioEnergy: { value: 0 },
    };
    const particleMat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      uniforms: particleUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // =========================================================================
    // 13. INTERACTION, SCROLL & INTRO CHOREOGRAPHY
    // =========================================================================
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;

    let scrollProgress = 0;
    let smoothScroll = 0;
    let prevScrollY = window.scrollY || 0;
    let scrollVelocity = 0;

    const updateScroll = () => {
      const currentY = window.scrollY || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      scrollProgress = Math.min(Math.max(currentY / maxScroll, 0), 1);
      scrollVelocity = THREE.MathUtils.clamp((currentY - prevScrollY) * 0.015, -2.5, 2.5);
      prevScrollY = currentY;
    };
    updateScroll();

    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerY = -((e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointerX = (e.touches[0].clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
        pointerY = -((e.touches[0].clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
      }
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const nowMobile = width < 768;
      camera.aspect = width / Math.max(height, 1);
      camera.fov = nowMobile ? 54 : 44;
      camera.updateProjectionMatrix();

      const nextDpr = nowMobile
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setPixelRatio(nextDpr);
      particleUniforms.uPixelRatio.value = nextDpr;
      renderer.setSize(width, height, false);
      updateScroll();
    };
    window.addEventListener("resize", onResize, { passive: true });

    // =========================================================================
    // 14. ANIMATION LOOP + ADAPTIVE FPS GUARD + VISIBILITY PAUSE
    // =========================================================================
    const dummy = new THREE.Object3D();
    let rafId = 0;
    let isVisible = true;
    let lastTime = performance.now();
    let elapsed = 0;
    let introTimer = isHomeRef.current && !prefersReducedMotion ? 0 : 2.0;

    // Rolling FPS monitor for automatic quality scaling
    let lowFpsAccum = 0;
    let qualityReduced = false;

    const renderFrame = (now: number) => {
      if (!isVisible) return;
      rafId = requestAnimationFrame(renderFrame);

      const rawDelta = (now - lastTime) / 1000;
      const delta = Math.min(Math.max(rawDelta, 0.001), 0.08);
      lastTime = now;
      elapsed += prefersReducedMotion ? delta * 0.25 : delta;
      introTimer += delta;

      // Auto-downgrade DPR if device struggles (< 36fps sustained)
      if (!qualityReduced && rawDelta > 0.028) {
        lowFpsAccum += rawDelta;
        if (lowFpsAccum > 1.8) {
          qualityReduced = true;
          renderer.setPixelRatio(1);
          particleUniforms.uPixelRatio.value = 1;
        }
      } else {
        lowFpsAccum = Math.max(0, lowFpsAccum - delta * 0.5);
      }

      const uState = getUniverseState();
      const audioBass = uState.audioPlaying ? uState.audioBass : 0;
      const audioMid = uState.audioPlaying ? uState.audioMid : 0;
      const audioEnergy = uState.audioPlaying ? uState.audioEnergy : 0;

      // Smooth interpolations
      const damp = 1 - Math.exp(-delta * 6.0);
      smoothPointerX += (pointerX - smoothPointerX) * damp;
      smoothPointerY += (pointerY - smoothPointerY) * damp;
      smoothScroll += (scrollProgress - smoothScroll) * damp;
      scrollVelocity *= Math.exp(-delta * 7.0);

      // Update shader uniforms
      nebulaUniforms.uTime.value = elapsed;
      nebulaUniforms.uScroll.value = smoothScroll;
      nebulaUniforms.uAudioEnergy.value = audioEnergy;
      nebulaUniforms.uPointer.value.set(smoothPointerX, smoothPointerY);

      plasmaUniforms.uTime.value = elapsed;
      plasmaUniforms.uAudioBass.value += (audioBass - plasmaUniforms.uAudioBass.value) * damp;
      plasmaUniforms.uAudioMid.value += (audioMid - plasmaUniforms.uAudioMid.value) * damp;
      plasmaUniforms.uHover.value += (uState.hoverIntensity - plasmaUniforms.uHover.value) * damp;

      particleUniforms.uTime.value = elapsed;
      particleUniforms.uScrollVelocity.value = scrollVelocity;
      particleUniforms.uAudioEnergy.value = audioEnergy;

      // Intro fly-in ease (1.35s)
      const introProgress = Math.min(introTimer / 1.35, 1);
      const introEase = 1 - Math.pow(1 - introProgress, 3);

      const s = isHomeRef.current ? smoothScroll : 0.12;
      const mobileNow = width < 768;

      // ---- CAMERA CHOREOGRAPHY ----
      const targetCamZ =
        (isHomeRef.current ? THREE.MathUtils.lerp(11.2, baseCamZ, introEase) : baseCamZ + 1.8) -
        Math.sin(s * Math.PI) * 0.85;
      const parallaxStrength = mobileNow ? 0.25 : 0.55;
      camera.position.x += (smoothPointerX * parallaxStrength - camera.position.x) * damp;
      camera.position.y += (smoothPointerY * parallaxStrength * 0.7 - camera.position.y) * damp;
      camera.position.z += (targetCamZ - camera.position.z) * damp;
      camera.lookAt(
        smoothPointerX * 0.18,
        smoothPointerY * 0.12,
        0
      );

      // Interactive pointer light
      pointerLight.position.set(
        smoothPointerX * 4.5,
        smoothPointerY * 3.2,
        4.2
      );

      // ---- SECTION-BY-SECTION 3D CORE JOURNEY ----
      if (isHomeRef.current) {
        // Core travels dynamically across sections:
        // 0.0 (Hero): Right side (or top center on mobile)
        // 0.2 (About): Sweeps across to Left
        // 0.45 (Releases): Recedes slightly into center-back
        // 0.65 (Distribution): Centers as network transmitter
        // 0.88+ (Send Release): Shrinks into the Energy Portal singularity
        const heroX = mobileNow ? 0 : 1.75;
        const heroY = mobileNow ? 1.45 : 0.05;
        const heroScale = mobileNow ? 0.66 : 1.0;
        const aboutX = mobileNow ? -0.4 : -2.1;
        const midX = 0;

        let targetCoreX = heroX;
        let targetCoreY = heroY;
        let targetCoreZ = 0;
        let targetCoreScale = heroScale;

        if (s < 0.25) {
          const t = s / 0.25;
          const e = t * t * (3 - 2 * t);
          targetCoreX = THREE.MathUtils.lerp(heroX, aboutX, e);
          targetCoreY = THREE.MathUtils.lerp(heroY, 0.15, e);
          targetCoreZ = THREE.MathUtils.lerp(0, -0.8, e);
        } else if (s < 0.55) {
          const t = (s - 0.25) / 0.3;
          const e = t * t * (3 - 2 * t);
          targetCoreX = THREE.MathUtils.lerp(aboutX, midX, e);
          targetCoreY = THREE.MathUtils.lerp(0.15, 0.35, e);
          targetCoreZ = THREE.MathUtils.lerp(-0.8, -2.4, e);
          targetCoreScale = THREE.MathUtils.lerp(heroScale, 0.72, e);
        } else if (s < 0.82) {
          const t = (s - 0.55) / 0.27;
          const e = t * t * (3 - 2 * t);
          targetCoreX = THREE.MathUtils.lerp(midX, 0, e);
          targetCoreY = THREE.MathUtils.lerp(0.35, 0, e);
          targetCoreZ = THREE.MathUtils.lerp(-2.4, -1.0, e);
          targetCoreScale = THREE.MathUtils.lerp(0.72, 0.88, e);
        } else {
          const t = (s - 0.82) / 0.18;
          targetCoreX = 0;
          targetCoreY = 0;
          targetCoreZ = THREE.MathUtils.lerp(-1.0, -3.2, t);
          targetCoreScale = THREE.MathUtils.lerp(0.88, 0.58, t);
        }

        coreGroup.position.x += (targetCoreX - coreGroup.position.x) * damp;
        coreGroup.position.y += (targetCoreY - coreGroup.position.y) * damp;
        coreGroup.position.z += (targetCoreZ - coreGroup.position.z) * damp;
        const currScale = coreGroup.scale.x;
        const nextScale = currScale + (targetCoreScale - currScale) * damp;
        coreGroup.scale.setScalar(nextScale);
      } else {
        // Subpages: calm ambient floating core in background
        coreGroup.position.set(mobileNow ? 0 : 2.8, 0.4, -3.5);
        coreGroup.scale.setScalar(0.65);
      }

      // Core internal rotations + pointer tilt + audio energy boost
      const spinBoost = 1 + Math.abs(scrollVelocity) * 1.4 + audioEnergy * 0.9;
      coreGroup.rotation.y = smoothPointerX * 0.32 + elapsed * 0.12;
      coreGroup.rotation.x = -smoothPointerY * 0.24 + s * Math.PI * 1.4;

      cageLines.rotation.y -= delta * 0.22 * spinBoost;
      cageLines.rotation.z += delta * 0.14;
      innerCageMesh.rotation.x += delta * 0.18;

      gyroRing1.rotation.z += delta * 0.48 * spinBoost;
      gyroRing1.rotation.x = 0.65 + Math.sin(elapsed * 0.45) * 0.22;

      gyroRing2.rotation.y -= delta * 0.58 * spinBoost;
      gyroRing2.rotation.z = 0.52 + Math.cos(elapsed * 0.38) * 0.2;

      gyroRing3.rotation.x += delta * 0.35;
      gyroRing3.rotation.y += delta * 0.42;

      vinylHalo.rotation.z -= delta * 0.75 * (uState.audioPlaying ? 1.8 : 1.0);

      // Update Instanced Orbital Shards
      for (let i = 0; i < shardCount; i++) {
        const sd = shardData[i];
        const a = sd.angle + elapsed * sd.speed * spinBoost;
        dummy.position.set(
          Math.cos(a) * sd.radius,
          Math.sin(a * 0.7) * 0.55 + Math.sin(a) * sd.tilt,
          Math.sin(a) * sd.radius
        );
        dummy.rotation.set(a * 1.3, a * 0.8, sd.tilt);
        const pulseScale = sd.scale * (1 + audioBass * 0.35);
        dummy.scale.setScalar(pulseScale);
        dummy.updateMatrix();
        shardInstanced.setMatrixAt(i, dummy.matrix);
      }
      shardInstanced.instanceMatrix.needsUpdate = true;

      // ---- SWEEPING CHROME MEGARING (Passes across About -> Releases) ----
      const ringProgress = THREE.MathUtils.clamp((s - 0.06) / 0.42, 0, 1);
      megaRingGroup.visible = isHomeRef.current && ringProgress > 0.01 && ringProgress < 0.99;
      if (megaRingGroup.visible) {
        megaRingGroup.position.x = THREE.MathUtils.lerp(-5.8, 5.2, ringProgress);
        megaRingGroup.position.y = THREE.MathUtils.lerp(-2.0, 2.4, ringProgress);
        megaRingGroup.position.z = THREE.MathUtils.lerp(-3.5, 2.2, Math.sin(ringProgress * Math.PI));
        megaRingGroup.rotation.x = 1.05 + ringProgress * 0.85;
        megaRingGroup.rotation.y = 0.45 + elapsed * 0.18;
      }

      // ---- DISTRIBUTION NETWORK CONSTELLATION (Section 05: s ~ 0.45..0.82) ----
      const netAlpha = isHomeRef.current
        ? Math.sin(THREE.MathUtils.clamp((s - 0.42) / 0.4, 0, 1) * Math.PI)
        : 0;
      networkGroup.visible = netAlpha > 0.02;
      if (networkGroup.visible) {
        networkGroup.position.copy(coreGroup.position);
        networkGroup.scale.setScalar(THREE.MathUtils.lerp(0.25, 1.15, netAlpha));
        networkGroup.rotation.y = elapsed * 0.16 + smoothPointerX * 0.25;
        networkGroup.rotation.x = smoothPointerY * 0.18;
        netLineMat.opacity = netAlpha * 0.42;
        nodeMat.opacity = netAlpha * 0.9;

        for (let i = 0; i < nodeCount; i++) {
          const p = nodePositions[i];
          dummy.position.copy(p);
          const nodePulse = 0.75 + 0.35 * Math.sin(elapsed * 3.0 + i * 0.7) + audioMid * 0.5;
          dummy.scale.setScalar(nodePulse);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          networkNodes.setMatrixAt(i, dummy.matrix);
        }
        networkNodes.instanceMatrix.needsUpdate = true;
      }

      // ---- ARCHITECTURAL MONOLITH PRISMS (Section 06: s ~ 0.60..0.90) ----
      const monoAlpha = isHomeRef.current
        ? Math.sin(THREE.MathUtils.clamp((s - 0.58) / 0.34, 0, 1) * Math.PI)
        : 0;
      monolithGroup.visible = monoAlpha > 0.03;
      if (monolithGroup.visible) {
        monolithGroup.rotation.y = elapsed * 0.08 + smoothPointerX * 0.12;
        for (let i = 0; i < monolithCount; i++) {
          const ms = monolithSeeds[i];
          const a = ms.angle + elapsed * 0.05;
          dummy.position.set(
            Math.cos(a) * ms.radius,
            ms.yOffset + Math.sin(elapsed * 0.8 + i) * 0.25,
            Math.sin(a) * ms.radius - 4.2
          );
          dummy.rotation.set(0, a + elapsed * ms.rotSpeed, 0);
          dummy.scale.set(1, monoAlpha, 1);
          dummy.updateMatrix();
          monolithInstanced.setMatrixAt(i, dummy.matrix);
        }
        monolithInstanced.instanceMatrix.needsUpdate = true;
      }

      // ---- VOLUMETRIC ENERGY PORTAL (Section 07: s > 0.74) ----
      const portalAmt = isHomeRef.current
        ? THREE.MathUtils.clamp((s - 0.72) / 0.24, 0, 1)
        : 0;
      portalGroup.visible = portalAmt > 0.02;
      if (portalGroup.visible) {
        portalUniforms.uTime.value = elapsed;
        portalUniforms.uIntensity.value = portalAmt;
        portalGroup.scale.setScalar(THREE.MathUtils.lerp(0.25, mobileNow ? 0.9 : 1.25, portalAmt));
        portalGroup.position.z = THREE.MathUtils.lerp(-4.5, -1.6, portalAmt);
        portalChromeRing.rotation.z = elapsed * 0.45;
        portalChromeRing.rotation.x = Math.sin(elapsed * 0.4) * 0.25;
      }

      // ---- COSMIC DUST DRIFT ----
      particleSystem.rotation.y = elapsed * 0.015 + smoothPointerX * 0.04;
      particleSystem.position.z = s * 10.0;

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
    // 15. FULL GPU RESOURCE DISPOSAL
    // =========================================================================
    return () => {
      isVisible = false;
      if (rafId) cancelAnimationFrame(rafId);

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);

      envRT.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();

      plasmaGeo.dispose();
      plasmaMat.dispose();
      cageGeo.dispose();
      cageEdgesGeo.dispose();
      cageLineMat.dispose();
      innerCageMesh.geometry.dispose();
      violetWireMaterial.dispose();

      gyroRing1Geo.dispose();
      gyroRing2Geo.dispose();
      gyroRing3Geo.dispose();
      gyroRing3Mat.dispose();
      vinylHaloGeo.dispose();
      vinylHaloMat.dispose();

      shardGeo.dispose();
      shardInstanced.dispose();

      megaRingGeo.dispose();
      megaRingGlowGeo.dispose();
      megaRingGlowMat.dispose();

      nodeGeo.dispose();
      nodeMat.dispose();
      netLineGeo.dispose();
      netLineMat.dispose();
      networkNodes.dispose();

      monolithGeo.dispose();
      monolithInstanced.dispose();

      portalGeo.dispose();
      portalMat.dispose();
      portalChromeGeo.dispose();

      particleGeo.dispose();
      particleMat.dispose();

      chromeMaterial.dispose();
      darkChromeMaterial.dispose();
      obsidianMaterial.dispose();

      ambientLight.dispose();
      keyLight.dispose();
      violetRimLight.dispose();
      silverKickLight.dispose();
      pointerLight.dispose();

      renderer.dispose();
    };
  }, []);

  if (webglUnsupported) {
    return (
      <div
        className="absolute inset-0 bg-[#050407] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 right-1/4 w-[460px] h-[460px] rounded-full bg-[#8737FF]/20 blur-[140px] animate-pulse-subtle" />
        <div className="absolute bottom-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-[#160B28]/70 blur-[160px]" />
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <div className="w-[380px] h-[380px] rounded-full border border-[#D9D9E2]/30 animate-spin-slow" />
        </div>
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
