"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { getUniverseState, triggerUniverseDisrupt } from "../../lib/universeBridge";
import { playQuantumDisrupt } from "../../lib/soundFX";

/**
 * CXRNER MUSIC — COSMIC ARCHITECTURE 3D ENGINE
 *
 * Complete WebGL replacement featuring futuristic deep-space metallic architecture
 * synchronized with scroll progress, pointer/touch parallax, and audio reactivity:
 *  - Procedural PMREM Studio Reflection Environment (dark titanium, chrome & violet rim)
 *  - Volumetric Light Beams (artifact-free Fresnel-faded GLSL shader)
 *  - Central Chrome & Obsidian Architectural Citadel (faceted core + 6 kinetic wings)
 *  - Massive Orbital Gantry Rings & Structural Braces (foreground/midground depth)
 *  - Deep Architectural Corridor (InstancedMesh chrome-obsidian monolith pylons)
 *  - Spatial Showcase Frames & Distribution Constellation Nodes + Energy Filaments
 *  - Multi-layer Cosmic Dust & Deep-Space Particles (custom GLSL Points shader)
 */

const BEAM_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const BEAM_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    // Soft edge fade using view-normal alignment (prevents hard cone edges)
    float edgeFade = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 1.8);
    // Smooth fade along beam height (top & bottom)
    float lengthFade = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.08, vUv.y);
    float shimmer = 0.85 + 0.15 * sin(uTime * 1.4 + vUv.y * 6.0);
    float alpha = edgeFade * lengthFade * uIntensity * shimmer * 0.28;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const DUST_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uEnergy;
  uniform float uScroll;
  attribute float aSize;
  attribute float aSeed;
  varying float vAlpha;
  varying float vColorMix;

  void main() {
    vec3 pos = position;
    // Gentle orbital & longitudinal drift with scroll
    float drift = uTime * (0.08 + aSeed * 0.12);
    pos.x += sin(drift + aSeed * 6.28) * 0.45;
    pos.y += cos(drift * 0.8 + aSeed * 4.13) * 0.35;
    pos.z = mod(pos.z + uScroll * 28.0 + uTime * 0.45 + 56.0, 62.0) - 52.0;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = max(-mvPos.z, 0.5);

    gl_PointSize = aSize * uPixelRatio * (1.0 + uEnergy * 0.45) * (150.0 / dist);
    gl_PointSize = clamp(gl_PointSize, 1.0, 14.0);

    float depthFade = smoothstep(54.0, 12.0, dist) * smoothstep(0.8, 3.2, dist);
    float twinkle = 0.55 + 0.45 * sin(uTime * 2.2 + aSeed * 19.0);
    vAlpha = depthFade * twinkle * (0.45 + uEnergy * 0.35);
    vColorMix = fract(aSeed * 3.71);

    gl_Position = projectionMatrix * mvPos;
  }
`;

const DUST_FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;
  varying float vColorMix;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    float core = exp(-r * r * 5.0);
    vec3 silver = vec3(0.88, 0.90, 0.98);
    vec3 violet = vec3(0.60, 0.28, 1.0);
    vec3 cyan = vec3(0.15, 0.88, 1.0);
    vec3 col = mix(silver, violet, smoothstep(0.25, 0.75, vColorMix));
    if (vColorMix > 0.86) col = mix(col, cyan, 0.75);

    gl_FragColor = vec4(col, core * vAlpha);
  }
`;

/** Build a procedural studio reflection map (no external HDRI required, zero CORS/loading delay) */
function createArchitecturalEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x040308);

  // Soft silver overhead studio strip
  const topStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.45, 2.7), side: THREE.DoubleSide })
  );
  topStrip.position.set(0, 9, 2);
  topStrip.rotation.x = Math.PI / 2;
  envScene.add(topStrip);

  // Electric violet left architectural rim
  const leftStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.45, 3.2), side: THREE.DoubleSide })
  );
  leftStrip.position.set(-10, 1, -2);
  leftStrip.rotation.y = Math.PI / 2;
  envScene.add(leftStrip);

  // Cool cyan/ice right rim
  const rightStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.65, 2.2), side: THREE.DoubleSide })
  );
  rightStrip.position.set(10, 0, -1);
  rightStrip.rotation.y = -Math.PI / 2;
  envScene.add(rightStrip);

  // Warm-violet under-bounce
  const floorStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 0.08, 0.42), side: THREE.DoubleSide })
  );
  floorStrip.position.set(0, -10, 0);
  floorStrip.rotation.x = -Math.PI / 2;
  envScene.add(floorStrip);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();

  // Cleanup temp env geometries/materials
  topStrip.geometry.dispose();
  (topStrip.material as THREE.Material).dispose();
  leftStrip.geometry.dispose();
  (leftStrip.material as THREE.Material).dispose();
  rightStrip.geometry.dispose();
  (rightStrip.material as THREE.Material).dispose();
  floorStrip.geometry.dispose();
  (floorStrip.material as THREE.Material).dispose();

  return rt.texture;
}

export default function CxrnerUniverseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();
  const isHomeRef = useRef<boolean>(pathname === "/");
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  useEffect(() => {
    isHomeRef.current = pathname === "/";
  }, [pathname]);

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040308);
    scene.fog = new THREE.FogExp2(0x040308, 0.024);

    const envTexture = createArchitecturalEnvMap(renderer);
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(
      isMobileInit ? 52 : 44,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      120
    );
    camera.position.set(0, 0, 10.5);

    // =========================================================================
    // 1. STUDIO & ARCHITECTURAL LIGHTING
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0x1b1230, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xeef2ff, 2.2);
    keyLight.position.set(-5, 8, 9);
    scene.add(keyLight);

    const violetRimLight = new THREE.PointLight(0x8737ff, 18, 36, 1.6);
    violetRimLight.position.set(6, 3, 2);
    scene.add(violetRimLight);

    const cyanAccentLight = new THREE.PointLight(0x00f0ff, 10, 32, 1.6);
    cyanAccentLight.position.set(-6, -3, -6);
    scene.add(cyanAccentLight);

    const pointerLight = new THREE.PointLight(0xb46bff, 8, 22, 1.8);
    pointerLight.position.set(0, 0, 5);
    scene.add(pointerLight);

    // =========================================================================
    // 2. SHARED PBR ARCHITECTURAL MATERIALS (Artifact-free, opaque metals)
    // =========================================================================
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d8e8,
      metalness: 0.96,
      roughness: 0.14,
      envMapIntensity: 1.5,
    });

    const darkTitaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x161224,
      metalness: 0.88,
      roughness: 0.24,
      envMapIntensity: 1.3,
    });

    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x07050c,
      metalness: 0.65,
      roughness: 0.32,
      envMapIntensity: 1.1,
    });

    const purpleEnergyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8737ff,
      emissive: new THREE.Color(0x8737ff),
      emissiveIntensity: 1.8,
      metalness: 0.2,
      roughness: 0.2,
    });

    const cyanEnergyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: new THREE.Color(0x00f0ff),
      emissiveIntensity: 1.4,
      metalness: 0.2,
      roughness: 0.2,
    });

    // =========================================================================
    // 3. OBJECT 1: CENTRAL CHROME ARCHITECTURAL CITADEL (Replaces old sphere)
    // =========================================================================
    const citadelGroup = new THREE.Group();
    scene.add(citadelGroup);

    // Inner glowing energy prism (octahedral crystal core inside the citadel)
    const corePrismGeo = new THREE.OctahedronGeometry(0.85, 0);
    const corePrismMesh = new THREE.Mesh(corePrismGeo, purpleEnergyMaterial);
    corePrismMesh.scale.set(0.85, 1.65, 0.85);
    citadelGroup.add(corePrismMesh);

    // Outer architectural obsidian spire frame
    const spireGeo = new THREE.CylinderGeometry(0.22, 0.48, 3.6, 6, 1);
    const spireTop = new THREE.Mesh(spireGeo, darkTitaniumMaterial);
    spireTop.position.set(0, 1.35, 0);
    const spireBottom = new THREE.Mesh(spireGeo, darkTitaniumMaterial);
    spireBottom.rotation.z = Math.PI;
    spireBottom.position.set(0, -1.35, 0);
    citadelGroup.add(spireTop, spireBottom);

    // 6 Kinetic Chrome Buttress Wings around the core (4 on mobile)
    const wingCount = isMobileInit ? 4 : 6;
    const wingGeo = new THREE.BoxGeometry(0.28, 3.2, 0.72);
    const wingAccentGeo = new THREE.BoxGeometry(0.06, 2.7, 0.06);
    const wings: Array<{ group: THREE.Group; baseAngle: number }> = [];

    for (let i = 0; i < wingCount; i++) {
      const angle = (i / wingCount) * Math.PI * 2;
      const wingPivot = new THREE.Group();
      wingPivot.rotation.y = angle;

      const wingHolder = new THREE.Group();
      wingHolder.position.set(1.35, 0, 0);
      wingHolder.rotation.z = -0.14;

      const wingBody = new THREE.Mesh(wingGeo, chromeMaterial);
      const wingEdge = new THREE.Mesh(
        wingAccentGeo,
        i % 2 === 0 ? purpleEnergyMaterial : cyanEnergyMaterial
      );
      wingEdge.position.set(-0.16, 0, 0.36);

      wingHolder.add(wingBody, wingEdge);
      wingPivot.add(wingHolder);
      citadelGroup.add(wingPivot);
      wings.push({ group: wingHolder, baseAngle: angle });
    }

    // =========================================================================
    // 4. OBJECT 2: MASSIVE ORBITAL GANTRY RINGS (Offset spatial framing)
    // =========================================================================
    const gantryGroup = new THREE.Group();
    scene.add(gantryGroup);

    // Angular faceted architectural rings (low tubularSegments / high-contrast bevel feel)
    const ring1Geo = new THREE.TorusGeometry(2.65, 0.085, 6, 64);
    const ring1 = new THREE.Mesh(ring1Geo, chromeMaterial);
    ring1.rotation.set(Math.PI * 0.38, Math.PI * 0.14, 0);
    gantryGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.45, 0.055, 6, 72);
    const ring2 = new THREE.Mesh(ring2Geo, darkTitaniumMaterial);
    ring2.rotation.set(-Math.PI * 0.25, Math.PI * 0.35, 0.2);
    gantryGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(4.35, 0.028, 4, 80);
    const ring3 = new THREE.Mesh(ring3Geo, purpleEnergyMaterial);
    ring3.rotation.set(Math.PI * 0.48, -Math.PI * 0.2, 0.4);
    gantryGroup.add(ring3);

    // =========================================================================
    // 5. OBJECT 3: DEEP ARCHITECTURAL CORRIDOR (InstancedMesh Pylons & Arches)
    // =========================================================================
    const pylonCount = isMobileInit ? 16 : 28;
    const pylonGeo = new THREE.BoxGeometry(0.65, 9.5, 0.95);
    const pylonInstanced = new THREE.InstancedMesh(pylonGeo, obsidianMaterial, pylonCount);
    pylonInstanced.frustumCulled = false;
    scene.add(pylonInstanced);

    const pylonTrimGeo = new THREE.BoxGeometry(0.08, 9.2, 0.08);
    const pylonTrimInstanced = new THREE.InstancedMesh(
      pylonTrimGeo,
      purpleEnergyMaterial,
      pylonCount
    );
    pylonTrimInstanced.frustumCulled = false;
    scene.add(pylonTrimInstanced);

    const pylonSpecs = Array.from({ length: pylonCount }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const pairIndex = Math.floor(i / 2);
      const z = -4.5 - pairIndex * 3.4;
      const x = side * (4.4 + (pairIndex % 3) * 1.15);
      const y = ((pairIndex % 2 === 0 ? 1 : -1) * 0.8) + Math.sin(pairIndex) * 0.6;
      const tilt = side * (0.12 + (pairIndex % 3) * 0.06);
      return { x, y, z, side, tilt };
    });

    // =========================================================================
    // 6. OBJECT 4: SPATIAL FRAMES & DISTRIBUTION CONSTELLATION NODES
    // =========================================================================
    const frameCount = isMobileInit ? 6 : 12;
    const frameGeo = new THREE.RingGeometry(1.15, 1.24, 4); // Diamond architectural frames
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xb46bff,
      emissive: new THREE.Color(0x5218b8),
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.25,
      side: THREE.FrontSide,
    });
    const frameInstanced = new THREE.InstancedMesh(frameGeo, frameMat, frameCount);
    frameInstanced.frustumCulled = false;
    scene.add(frameInstanced);

    const frameSpecs = Array.from({ length: frameCount }, (_, i) => ({
      x: (i % 2 === 0 ? -1 : 1) * (3.2 + (i % 3) * 1.4),
      y: ((i % 4) - 1.5) * 1.6,
      z: -10 - i * 3.1,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.15 + (i % 3) * 0.08),
    }));

    // Distribution Network Nodes + Energy Filaments
    const nodeCount = isMobileInit ? 18 : 34;
    const nodeGeo = new THREE.OctahedronGeometry(0.14, 0);
    const nodeInstanced = new THREE.InstancedMesh(nodeGeo, cyanEnergyMaterial, nodeCount);
    nodeInstanced.frustumCulled = false;
    scene.add(nodeInstanced);

    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const t = i / nodeCount;
      const angle = t * Math.PI * 6;
      const radius = 3.2 + (i % 4) * 1.35;
      nodePositions.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle * 0.7) * 2.8,
          -14 - t * 28
        )
      );
    }

    // Energy Line Segments connecting nodes
    const linePoints: number[] = [];
    for (let i = 0; i < nodeCount - 1; i++) {
      const a = nodePositions[i];
      const b = nodePositions[i + 1];
      linePoints.push(a.x, a.y, a.z, b.x, b.y, b.z);
      if (i + 3 < nodeCount) {
        const c = nodePositions[i + 3];
        linePoints.push(a.x, a.y, a.z, c.x, c.y, c.z);
      }
    }
    const netLineGeo = new THREE.BufferGeometry();
    netLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePoints, 3));
    const netLineMat = new THREE.LineBasicMaterial({
      color: 0x8737ff,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const netLines = new THREE.LineSegments(netLineGeo, netLineMat);
    scene.add(netLines);

    // =========================================================================
    // 7. OBJECT 5: VOLUMETRIC LIGHT BEAMS (Soft GLSL cones, zero hard edges)
    // =========================================================================
    const beamUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColor: { value: new THREE.Color(0x8737ff) },
    };
    const beamGeo = new THREE.CylinderGeometry(0.35, 3.6, 26, 24, 1, true);
    const beamMat = new THREE.ShaderMaterial({
      vertexShader: BEAM_VERTEX_SHADER,
      fragmentShader: BEAM_FRAGMENT_SHADER,
      uniforms: beamUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const beamLeft = new THREE.Mesh(beamGeo, beamMat);
    beamLeft.position.set(-5.5, 4, -14);
    beamLeft.rotation.set(0.25, 0, -0.35);

    const beamRight = new THREE.Mesh(beamGeo, beamMat);
    beamRight.position.set(5.5, 4, -20);
    beamRight.rotation.set(0.25, 0, 0.35);

    scene.add(beamLeft, beamRight);

    // =========================================================================
    // 8. OBJECT 6: FINAL PORTAL ARCH (Section 08 CTA backdrop)
    // =========================================================================
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -44);
    scene.add(portalGroup);

    const portalArchGeo = new THREE.TorusGeometry(4.2, 0.14, 6, 48);
    const portalArch = new THREE.Mesh(portalArchGeo, chromeMaterial);
    const portalGlowRingGeo = new THREE.TorusGeometry(3.85, 0.04, 4, 48);
    const portalGlowRing = new THREE.Mesh(portalGlowRingGeo, cyanEnergyMaterial);
    portalGroup.add(portalArch, portalGlowRing);

    // =========================================================================
    // 9. OBJECT 7: DEEP SPACE COSMIC DUST (GPU Points)
    // =========================================================================
    const dustCount = isMobileInit ? 380 : 1100;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    const dustSeeds = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 34;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      dustPositions[i * 3 + 2] = -Math.random() * 56 + 6;
      dustSizes[i] = 1.2 + Math.random() * 2.6;
      dustSeeds[i] = Math.random();
    }

    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dustSizes, 1));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeeds, 1));

    const dustUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uEnergy: { value: 0 },
      uScroll: { value: 0 },
    };

    const dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERTEX_SHADER,
      fragmentShader: DUST_FRAGMENT_SHADER,
      uniforms: dustUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    dustPoints.frustumCulled = false;
    scene.add(dustPoints);

    // =========================================================================
    // 10. SCROLL, POINTER & RESIZE HANDLERS
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
      if (e.code === "Space" && isHomeRef.current && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
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
      dustUniforms.uPixelRatio.value = pr;
      camera.fov = isMobile ? 52 : 44;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    // =========================================================================
    // 11. ANIMATION LOOP (Single RAF, smooth scroll choreography)
    // =========================================================================
    const dummy = new THREE.Object3D();
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

      // Decay interactive triggers smoothly
      uState.shockwave = Math.max(0, uState.shockwave - dt * 1.4);
      uState.disruption = Math.max(0, uState.disruption - dt * 0.85);
      uState.dragDeltaX *= 0.92;
      uState.dragDeltaY *= 0.92;

      smoothScroll = THREE.MathUtils.lerp(smoothScroll, isHomeRef.current ? scrollTarget : 0.05, 0.075);
      smoothPointerX = THREE.MathUtils.lerp(smoothPointerX, pointerX, 0.06);
      smoothPointerY = THREE.MathUtils.lerp(smoothPointerY, pointerY, 0.06);

      const s = smoothScroll;
      const energy = Math.min(1, uState.audioEnergy + uState.shockwave * 0.65);

      // ---- CAMERA FLIGHT THROUGH COSMIC ARCHITECTURE ----
      // Hero (s=0): right-offset on desktop so title reads clearly, centered high on mobile
      const heroOffsetX = isMobile ? 0 : 2.35;
      const heroOffsetY = isMobile ? 0.9 : 0.15;

      // Camera flies along -Z from z=10.5 down to z=-35 across page scroll
      const camZ = THREE.MathUtils.lerp(10.5, -35.5, s);
      const camX =
        Math.sin(s * Math.PI * 1.6) * (isMobile ? 0.65 : 1.55) +
        smoothPointerX * (isMobile ? 0.25 : 0.65);
      const camY =
        Math.cos(s * Math.PI * 1.2) * (isMobile ? 0.25 : 0.45) +
        smoothPointerY * (isMobile ? 0.2 : 0.45);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(
        smoothPointerX * 0.35,
        smoothPointerY * 0.25,
        camZ - 11.0
      );

      // ---- CENTRAL CITADEL POSITION & KINETIC WINGS ----
      citadelGroup.position.set(
        THREE.MathUtils.lerp(heroOffsetX, 0, Math.min(1, s * 3.5)),
        THREE.MathUtils.lerp(heroOffsetY, 0, Math.min(1, s * 3.5)),
        0
      );
      citadelGroup.rotation.y = elapsed * 0.18 + s * Math.PI * 1.4 + smoothPointerX * 0.28 + uState.dragDeltaX;
      citadelGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.08 + smoothPointerY * 0.18 + uState.dragDeltaY;

      corePrismMesh.rotation.y = -elapsed * 0.5;
      const coreScale = 1.0 + energy * 0.25 + Math.sin(elapsed * 2.2) * 0.04;
      corePrismMesh.scale.set(0.85 * coreScale, 1.65 * coreScale, 0.85 * coreScale);
      purpleEnergyMaterial.emissiveIntensity = 1.6 + energy * 1.8 + uState.disruption * 2.2;

      // Wings open outward during About scroll (s ~ 0.15..0.35) and on disruption
      const wingSpread =
        1.35 +
        Math.sin(Math.min(1, s * 3.2) * Math.PI) * 0.85 +
        uState.disruption * 1.4 +
        energy * 0.25;
      for (const w of wings) {
        w.group.position.x = wingSpread;
        w.group.rotation.z = -0.14 - uState.disruption * 0.35 - Math.sin(elapsed * 1.1 + w.baseAngle) * 0.04;
      }

      // ---- ORBITAL GANTRY RINGS ----
      gantryGroup.position.copy(citadelGroup.position);
      ring1.rotation.z = elapsed * 0.22 + s * 2.0;
      ring2.rotation.y = -elapsed * 0.16 - s * 1.6;
      ring3.rotation.x = Math.PI * 0.48 + elapsed * 0.12 + s * 1.2;
      const gantryScale = 1.0 + energy * 0.06 + uState.disruption * 0.18;
      gantryGroup.scale.setScalar(gantryScale);

      // ---- DEEP CORRIDOR PYLONS ----
      for (let i = 0; i < pylonCount; i++) {
        const ps = pylonSpecs[i];
        const pulseY = Math.sin(elapsed * 0.6 + i * 0.7) * 0.25;
        dummy.position.set(ps.x, ps.y + pulseY, ps.z);
        dummy.rotation.set(0, ps.side * 0.18, ps.tilt);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pylonInstanced.setMatrixAt(i, dummy.matrix);

        dummy.position.set(ps.x - ps.side * 0.34, ps.y + pulseY, ps.z + 0.45);
        dummy.updateMatrix();
        pylonTrimInstanced.setMatrixAt(i, dummy.matrix);
      }
      pylonInstanced.instanceMatrix.needsUpdate = true;
      pylonTrimInstanced.instanceMatrix.needsUpdate = true;

      // ---- SPATIAL FRAMES (Releases / Artists) ----
      for (let i = 0; i < frameCount; i++) {
        const fs = frameSpecs[i];
        dummy.position.set(fs.x, fs.y + Math.sin(elapsed * 0.7 + i) * 0.3, fs.z);
        dummy.rotation.set(0, Math.sin(elapsed * 0.3 + i) * 0.35, elapsed * fs.rotSpeed + s * 2.0);
        const fScale = 0.85 + energy * 0.2;
        dummy.scale.setScalar(fScale);
        dummy.updateMatrix();
        frameInstanced.setMatrixAt(i, dummy.matrix);
      }
      frameInstanced.instanceMatrix.needsUpdate = true;

      // ---- DISTRIBUTION CONSTELLATION NODES ----
      for (let i = 0; i < nodeCount; i++) {
        const np = nodePositions[i];
        dummy.position.set(
          np.x + Math.sin(elapsed * 0.9 + i) * 0.12,
          np.y + Math.cos(elapsed * 0.8 + i) * 0.12,
          np.z
        );
        dummy.rotation.set(elapsed * 0.8, elapsed * 0.6, 0);
        const nScale = 0.9 + energy * 0.55;
        dummy.scale.setScalar(nScale);
        dummy.updateMatrix();
        nodeInstanced.setMatrixAt(i, dummy.matrix);
      }
      nodeInstanced.instanceMatrix.needsUpdate = true;
      netLineMat.opacity = 0.28 + Math.max(0, Math.sin(s * Math.PI)) * 0.35 + energy * 0.25;

      // ---- VOLUMETRIC BEAMS & LIGHTS ----
      beamUniforms.uTime.value = elapsed;
      beamUniforms.uIntensity.value = 0.85 + energy * 0.6 + Math.sin(s * Math.PI) * 0.35;
      pointerLight.position.set(smoothPointerX * 5.0, smoothPointerY * 3.5, camZ - 5.0);
      violetRimLight.position.z = camZ - 8.0;
      cyanAccentLight.position.z = camZ - 14.0;

      // ---- PORTAL ARCH ----
      portalArch.rotation.z = elapsed * 0.15;
      portalGlowRing.rotation.z = -elapsed * 0.28;

      // ---- COSMIC DUST ----
      dustUniforms.uTime.value = elapsed;
      dustUniforms.uEnergy.value = energy;
      dustUniforms.uScroll.value = s;

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
    // 12. COMPLETE GPU RESOURCE DISPOSAL
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

      envTexture.dispose();

      corePrismGeo.dispose();
      spireGeo.dispose();
      wingGeo.dispose();
      wingAccentGeo.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();

      pylonGeo.dispose();
      pylonInstanced.dispose();
      pylonTrimGeo.dispose();
      pylonTrimInstanced.dispose();

      frameGeo.dispose();
      frameMat.dispose();
      frameInstanced.dispose();

      nodeGeo.dispose();
      nodeInstanced.dispose();
      netLineGeo.dispose();
      netLineMat.dispose();

      beamGeo.dispose();
      beamMat.dispose();

      portalArchGeo.dispose();
      portalGlowRingGeo.dispose();

      dustGeo.dispose();
      dustMat.dispose();

      chromeMaterial.dispose();
      darkTitaniumMaterial.dispose();
      obsidianMaterial.dispose();
      purpleEnergyMaterial.dispose();
      cyanEnergyMaterial.dispose();

      ambientLight.dispose();
      keyLight.dispose();
      violetRimLight.dispose();
      cyanAccentLight.dispose();
      pointerLight.dispose();

      renderer.dispose();
    };
  }, []);

  if (webglUnsupported) {
    return (
      <div className="absolute inset-0 bg-[#040308] overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-[460px] h-[460px] rounded-full bg-[#8737FF]/18 blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-[#00F0FF]/10 blur-[160px]" />
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
