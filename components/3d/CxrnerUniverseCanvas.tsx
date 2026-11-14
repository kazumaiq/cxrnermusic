"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { getUniverseState } from "@/lib/universeBridge";

/**
 * Procedural HDR studio softbox environment so titanium & platinum rings reflect
 * crisp architectural studio light strips with zero external network assets.
 */
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x030208);

  const panels: Array<{
    size: [number, number];
    color: [number, number, number];
    pos: [number, number, number];
    rot?: [number, number, number];
  }> = [
    // Overhead cool silver diffuser
    { size: [20, 8], color: [2.4, 2.45, 2.75], pos: [0, 9.5, -1], rot: [Math.PI / 2, 0, 0] },
    // Left electric violet vertical softbox
    { size: [5, 18], color: [2.1, 0.85, 3.6], pos: [-9.5, 1.5, 3], rot: [0, Math.PI / 2, 0] },
    // Right ice cyan studio accent strip
    { size: [4, 16], color: [0.25, 2.6, 3.1], pos: [9.5, -1, 2], rot: [0, -Math.PI / 2, 0] },
    // Frontal subtle fill card for smooth mobile specular roll-off
    { size: [14, 6], color: [1.1, 1.15, 1.45], pos: [0, 2, 11], rot: [0, Math.PI, 0] },
    // Rear rim strip
    { size: [16, 3.5], color: [2.8, 2.6, 3.2], pos: [0, 2.5, -10] },
  ];

  for (const p of panels) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(p.size[0], p.size[1]),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(p.color[0], p.color[1], p.color[2]),
        side: THREE.DoubleSide,
      })
    );
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    if (p.rot) mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
    envScene.add(mesh);
  }

  const rt = pmrem.fromScene(envScene, 0.045);
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

/**
 * Generates a silky Gaussian bokeh orb texture so WebGL particles never look
 * like harsh 1px squares.
 */
function createSoftBokehTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.22, "rgba(255, 255, 255, 0.72)");
    grad.addColorStop(0.55, "rgba(220, 210, 255, 0.2)");
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Custom seamless 3D harmonic ferrofluid displacement + analytical tangent-frame normal shader.
// Operating purely on 3D object coordinates avoids UV pole pinching and seam artifacts completely.
const CORE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollMorph;
  uniform float uScrollVel;
  uniform float uAudio;
  uniform float uShockwave;
  uniform float uDisruption;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vCrest;

  float harmonicField(vec3 dir, float t, float scrollMorph, float vel, float audio, float shock, float disrupt) {
    float freqA = mix(2.2, 3.6, scrollMorph) + vel * 0.6;
    float freqB = mix(3.4, 5.2, scrollMorph);

    float w1 = sin(dir.x * freqA + t * 0.85) * cos(dir.y * freqA - t * 0.62) * sin(dir.z * (freqA * 0.85) + t * 0.55);
    float w2 = sin((dir.y * 1.15 - dir.x * 0.8) * freqB - t * 1.1 + scrollMorph * 4.2) * 0.52;
    float w3 = cos((dir.z * 1.3 + dir.x * 0.65) * 4.8 + t * 0.9) * 0.24;

    float acoustic = (w1 * 0.58 + w2 * 0.34 + w3 * 0.22);
    float amp = 0.085 + 0.045 * scrollMorph + 0.085 * vel + 0.11 * audio + 0.14 * shock;
    float burst = sin(dir.y * 12.0 - t * 8.0) * 0.09 * disrupt;

    return acoustic * amp + burst;
  }

  vec3 displacePoint(vec3 dir) {
    float d = harmonicField(dir, uTime, uScrollMorph, uScrollVel, uAudio, uShockwave, uDisruption);
    return dir * (2.0 + d);
  }

  void main() {
    vec3 dir = normalize(position);
    vec3 p0 = displacePoint(dir);

    // Orthonormal tangent basis for crisp, artifact-free analytic surface normals
    vec3 upHint = abs(dir.y) < 0.92 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(upHint, dir));
    vec3 bitangent = normalize(cross(dir, tangent));

    float eps = 0.015;
    vec3 pT = displacePoint(normalize(dir + tangent * eps));
    vec3 pB = displacePoint(normalize(dir + bitangent * eps));

    vec3 localNormal = normalize(cross(pT - p0, pB - p0));
    if (dot(localNormal, dir) < 0.0) {
      localNormal = -localNormal;
    }

    vCrest = length(p0) - 2.0;

    vec4 worldPos = modelMatrix * vec4(p0, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * localNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const CORE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uAccentColor;
  uniform float uScrollMorph;
  uniform float uAudio;
  uniform float uShockwave;
  uniform float uTime;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vCrest;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 R = reflect(-V, N);

    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.8);
    float crispRim = pow(1.0 - ndotv, 5.2);

    // Deep studio smoked-obsidian interior keeps overlaid Hero copy readable
    vec3 obsidianBase = vec3(0.014, 0.011, 0.028);

    // Virtual studio softbox reflections (smooth band-limited highlights, no harsh aliasing)
    vec3 keyDir = normalize(vec3(0.55, 0.85, 0.65));
    float specKey = pow(max(dot(R, keyDir), 0.0), 22.0);
    float softKey = smoothstep(0.38, 0.95, dot(R, keyDir)) * 0.42;

    vec3 violetRimDir = normalize(vec3(-0.9, 0.25, 0.35));
    float specViolet = smoothstep(0.18, 0.92, dot(R, violetRimDir));

    vec3 cyanRimDir = normalize(vec3(0.92, -0.32, 0.28));
    float specCyan = smoothstep(0.28, 0.96, dot(R, cyanRimDir));

    // Thin-film iridescent phase modulated smoothly across surface crest & view angle
    float phase = ndotv * 3.1 + vCrest * 9.5 + uScrollMorph * 1.4 + uTime * 0.12;
    vec3 iridViolet = mix(vec3(0.54, 0.22, 1.0), uAccentColor, 0.45);
    vec3 iridCyan = vec3(0.0, 0.94, 1.0);
    vec3 iridChrome = vec3(0.88, 0.90, 0.99);

    vec3 thinFilm = mix(iridViolet, iridCyan, 0.5 + 0.5 * sin(phase));
    thinFilm = mix(thinFilm, iridChrome, 0.48 * fresnel);

    // Horizon reflection split (dark ground vs illuminated studio dome)
    float horizon = smoothstep(-0.35, 0.65, R.y);
    vec3 chromeRefl = mix(vec3(0.025, 0.02, 0.055), vec3(0.68, 0.72, 0.86), horizon * 0.48);

    vec3 color = obsidianBase;
    color += chromeRefl * (0.28 + 0.72 * fresnel);
    color += iridViolet * specViolet * (0.48 + 0.55 * fresnel);
    color += iridCyan * specCyan * (0.34 + 0.65 * fresnel);
    color += iridChrome * (specKey * 1.15 + softKey * 0.45);
    color += thinFilm * crispRim * (0.9 + 0.35 * uAudio + 0.45 * uShockwave);

    // Subtle energy luminescence on elevated liquid-metal crests
    float crestGlow = smoothstep(0.015, 0.16, vCrest);
    color += mix(iridViolet, iridCyan, 0.4) * crestGlow * (0.16 + 0.25 * uAudio + 0.3 * uShockwave);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Soft additive studio aura backdrop behind the core (zero color-banding radial falloff)
const HALO_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    float r = length(vUv);
    if (r > 1.0) discard;

    float inner = exp(-r * r * 5.2);
    float outer = exp(-r * r * 2.15) * (1.0 - smoothstep(0.65, 1.0, r));
    vec3 tint = mix(uSecondary, uPrimary, clamp(r * 1.1, 0.0, 1.0));

    float alpha = (inner * 0.28 + outer * 0.26) * uIntensity;
    gl_FragColor = vec4(tint * alpha, alpha);
  }
`;

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
        antialias: true, // Always crisp silhouettes & rings on desktop + mobile Retina
        powerPreference: "high-performance",
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.85 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const envTexture = createStudioEnvironment(renderer);
    const bokehTexture = createSoftBokehTexture();

    const scene = new THREE.Scene();
    scene.environment = envTexture;
    scene.fog = new THREE.FogExp2(0x040307, 0.02);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 48 : 40,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );
    camera.position.set(0, 0.15, 16.5);

    const cluster = new THREE.Group();
    scene.add(cluster);

    // 1. Volumetric Soft Halo Aura (sits gracefully behind the liquid core)
    const haloGeo = new THREE.PlaneGeometry(10.5, 10.5);
    const haloUniforms = {
      uPrimary: { value: new THREE.Color(0x8737ff) },
      uSecondary: { value: new THREE.Color(0x00f0ff) },
      uIntensity: { value: isMobile ? 0.55 : 0.72 },
    };
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: HALO_VERTEX_SHADER,
      fragmentShader: HALO_FRAGMENT_SHADER,
      uniforms: haloUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 2. Central High-Resolution Iridescent Liquid-Obsidian Resonant Core
    const sphereSegs = isMobile ? 76 : 112;
    const coreGeo = new THREE.SphereGeometry(2.0, sphereSegs, sphereSegs);
    const coreUniforms = {
      uTime: { value: 0 },
      uScrollMorph: { value: 0 },
      uScrollVel: { value: 0 },
      uAudio: { value: 0 },
      uShockwave: { value: 0 },
      uDisruption: { value: 0 },
      uAccentColor: { value: new THREE.Color(0x8737ff) },
    };
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERTEX_SHADER,
      fragmentShader: CORE_FRAGMENT_SHADER,
      uniforms: coreUniforms,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    cluster.add(coreMesh);

    // 3. Three Razor-Clean Architectural Titanium & Chromatic Orbit Rings (220 radial segments = zero facets)
    const ringMatChrome = new THREE.MeshStandardMaterial({
      color: 0xeaf0ff,
      metalness: 1.0,
      roughness: 0.08,
      envMapIntensity: 2.1,
    });

    const ringMatViolet = new THREE.MeshStandardMaterial({
      color: 0xa266ff,
      metalness: 0.94,
      roughness: 0.14,
      emissive: 0x3b1280,
      emissiveIntensity: 0.42,
      envMapIntensity: 1.85,
    });

    const ringMatCyan = new THREE.MeshStandardMaterial({
      color: 0x7ef7ff,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0x005e70,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.58,
      envMapIntensity: 1.7,
    });

    const outerRingGeo = new THREE.TorusGeometry(3.38, 0.017, 24, 220);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMatChrome);
    outerRing.rotation.set(Math.PI * 0.38, Math.PI * 0.12, 0.18);
    cluster.add(outerRing);

    const midRingGeo = new THREE.TorusGeometry(2.84, 0.013, 20, 200);
    const midRing = new THREE.Mesh(midRingGeo, ringMatViolet);
    midRing.rotation.set(-Math.PI * 0.31, Math.PI * 0.28, -0.2);
    cluster.add(midRing);

    const fineRingGeo = new THREE.TorusGeometry(4.02, 0.0085, 16, 220);
    const fineRing = new THREE.Mesh(fineRingGeo, ringMatCyan);
    fineRing.rotation.set(Math.PI * 0.44, -Math.PI * 0.16, 0.35);
    cluster.add(fineRing);

    // 4. Precision Polished Chrome Orbital Nodes (riding smoothly along ring planes — replaces blocky rectangular sticks)
    const nodeGeo = new THREE.SphereGeometry(0.068, 24, 24);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.05,
      envMapIntensity: 2.6,
    });
    const nodes: Array<{ mesh: THREE.Mesh; ring: THREE.Mesh; radius: number; speed: number; offset: number }> = [
      { mesh: new THREE.Mesh(nodeGeo, nodeMat), ring: outerRing, radius: 3.38, speed: 0.36, offset: 0 },
      { mesh: new THREE.Mesh(nodeGeo, nodeMat), ring: midRing, radius: 2.84, speed: -0.48, offset: 2.1 },
      { mesh: new THREE.Mesh(nodeGeo, ringMatCyan), ring: fineRing, radius: 4.02, speed: 0.24, offset: 4.2 },
    ];
    for (const n of nodes) {
      n.ring.add(n.mesh);
    }

    // 5. Soft Gaussian Lens-Bokeh Stardust Field (smooth depth parallax with scroll)
    const particleCount = isMobile ? 150 : 320;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const cChrome = new THREE.Color(0xeef2ff);
    const cViolet = new THREE.Color(0xa970ff);
    const cCyan = new THREE.Color(0x38f3ff);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 34;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 28 - 4;

      const pick = Math.random();
      const c = pick > 0.86 ? cCyan : pick > 0.54 ? cViolet : cChrome;
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: isMobile ? 0.22 : 0.18,
      map: bokehTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Subtle key & accent lights for rings and orbital spheres
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(7, 11, 9);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x8737ff, 11, 36, 1.5);
    rimLight.position.set(-7, -2, 7);
    scene.add(rimLight);

    const cyanFill = new THREE.PointLight(0x00f0ff, 6, 30, 1.5);
    cyanFill.position.set(7, -4, 4);
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

    let smoothScroll = 0;
    let prevScrollNorm = 0;
    let smoothScrollVel = 0;

    const handlePointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        // On touch devices, avoid spinning the sculpture while user is simply scrolling vertically
        if (e.pointerType !== "touch" || Math.abs(dx) > Math.abs(dy) * 1.15) {
          manualRotY += dx * 0.0045;
          manualRotX = Math.max(-0.55, Math.min(0.55, manualRotX + dy * 0.003));
        }
        lastDragX = e.clientX;
        lastDragY = e.clientY;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
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
      const mobileNow = w < 768;
      camera.aspect = w / h;
      camera.fov = mobileNow ? 48 : 40;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileNow ? 1.85 : 2));
      renderer.setSize(w, h, false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("resize", handleResize);

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

      mouseX += (targetMouseX - mouseX) * 0.055;
      mouseY += (targetMouseY - mouseY) * 0.055;

      if (bridge.dragDeltaX !== 0 || bridge.dragDeltaY !== 0) {
        manualRotY += bridge.dragDeltaX * 0.01;
        manualRotX = Math.max(-0.6, Math.min(0.6, manualRotX + bridge.dragDeltaY * 0.008));
        bridge.dragDeltaX = 0;
        bridge.dragDeltaY = 0;
      }

      // Smooth damped document scroll progress [0..1] + elastic velocity response
      const scrollMax = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const rawScrollNorm = Math.min(1, Math.max(0, window.scrollY / scrollMax));
      smoothScroll += (rawScrollNorm - smoothScroll) * Math.min(1, dt * 7.5);

      const frameDelta = Math.abs(smoothScroll - prevScrollNorm);
      prevScrollNorm = smoothScroll;
      const velTarget = Math.min(1.0, frameDelta * 55);
      smoothScrollVel += (velTarget - smoothScrollVel) * Math.min(1, dt * 10);

      // Decay burst signals smoothly
      if (bridge.shockwave > 0.002) bridge.shockwave *= Math.pow(0.06, dt);
      else bridge.shockwave = 0;

      if (bridge.disruption > 0.002) bridge.disruption *= Math.pow(0.08, dt);
      else bridge.disruption = 0;

      const audioPulse = bridge.audioPlaying ? bridge.audioEnergy : 0;
      const atmos = bridge.atmosphereColor;
      if (atmos) {
        const r = 0.42 + atmos[0] * 0.58;
        const g = 0.22 + atmos[1] * 0.58;
        const b = 0.65 + atmos[2] * 0.35;
        rimLight.color.setRGB(r, g, b);
        coreUniforms.uAccentColor.value.setRGB(r, g, b);
      }

      const w = window.innerWidth;
      const isDesktop = w >= 1024;
      const motionFactor = reducedMotion ? 0.15 : 1.0;

      // Choreographed Depth, Position & Scale across scroll sections:
      // - Hero (0.0): Sits gracefully framed on the right (desktop) or soft top-back (mobile) so copy & CTAs stay crisp
      // - Mid-page (0.25..0.75): Glides gently along a subtle S-curve with deeper parallax breathing
      // - Lower Showcase / Footer (0.8..1.0): Opens up prominently as a luminous sculptural anchor
      let targetX = 0;
      let targetY = 0;
      let targetZ = -3.0;
      let targetScale = isDesktop ? 1.0 : 0.82;

      if (isHomeRef.current) {
        if (isDesktop) {
          const heroRightX = 3.55;
          targetX =
            heroRightX * Math.cos(smoothScroll * Math.PI * 1.45) + mouseX * 0.65;
          targetY = Math.sin(smoothScroll * Math.PI * 1.3) * 0.85 + mouseY * 0.45;
          targetZ =
            -1.4 -
            Math.sin(smoothScroll * Math.PI * 0.9) * 3.4 +
            audioPulse * 0.55;
          targetScale = 1.04 - Math.sin(smoothScroll * Math.PI) * 0.12 + smoothScrollVel * 0.05;
        } else {
          // Mobile: slightly inset & softly framed behind upper hero, gliding into clear sightlines on scroll
          targetX = Math.sin(smoothScroll * Math.PI * 1.5) * 0.65 + mouseX * 0.25;
          targetY = 0.9 - smoothScroll * 1.35 + mouseY * 0.2;
          targetZ = -4.3 + Math.sin(smoothScroll * Math.PI) * 1.45;
          targetScale = 0.78 + Math.sin(smoothScroll * Math.PI * 0.85) * 0.14;
        }
      } else if (isDropRef.current) {
        // Subtle perimeter backdrop so /drop 3D sealed specimen viewer owns the stage
        targetX = mouseX * 0.35;
        targetY = 0.8 + mouseY * 0.25;
        targetZ = -7.5;
        targetScale = 0.85;
      } else {
        targetX = (isDesktop ? 2.4 : 0) + mouseX * 0.4;
        targetY = -smoothScroll * 0.7 + mouseY * 0.3;
        targetZ = -4.8;
        targetScale = isDesktop ? 0.92 : 0.75;
      }

      const posLerp = Math.min(1, dt * 5.5);
      cluster.position.x += (targetX - cluster.position.x) * posLerp;
      cluster.position.y += (targetY - cluster.position.y) * posLerp;
      cluster.position.z += (targetZ - cluster.position.z) * posLerp;
      const nextScale = cluster.scale.x + (targetScale - cluster.scale.x) * posLerp;
      cluster.scale.setScalar(nextScale);

      // Update Liquid-Chrome Resonant Shader Uniforms
      coreUniforms.uTime.value = elapsed * motionFactor;
      coreUniforms.uScrollMorph.value = smoothScroll;
      coreUniforms.uScrollVel.value = smoothScrollVel;
      coreUniforms.uAudio.value = audioPulse;
      coreUniforms.uShockwave.value = bridge.shockwave;
      coreUniforms.uDisruption.value = bridge.disruption;

      // Halo billboard sits behind the core and always faces camera cleanly with zero clipping
      haloMesh.position.set(cluster.position.x, cluster.position.y, cluster.position.z - 1.6);
      haloMesh.scale.setScalar(nextScale);
      haloMesh.quaternion.copy(camera.quaternion);
      haloUniforms.uIntensity.value =
        (isDesktop ? 0.74 : 0.52) +
        smoothScrollVel * 0.22 +
        audioPulse * 0.25 +
        bridge.shockwave * 0.3;

      // Sculptural Rotation & Architectural Ring Opening tied seamlessly to Scroll
      cluster.rotation.y =
        elapsed * 0.08 * motionFactor +
        smoothScroll * Math.PI * 1.75 +
        manualRotY +
        mouseX * 0.22;
      cluster.rotation.x =
        Math.sin(elapsed * 0.22) * 0.08 * motionFactor +
        smoothScroll * 0.28 +
        manualRotX +
        mouseY * 0.14;

      const spinBoost = 1 + smoothScrollVel * 2.2 + audioPulse * 1.4 + bridge.shockwave * 2.0;
      outerRing.rotation.z += dt * 0.16 * spinBoost * motionFactor;
      outerRing.rotation.x = Math.PI * 0.38 + Math.sin(smoothScroll * Math.PI) * 0.36;

      midRing.rotation.z -= dt * 0.22 * spinBoost * motionFactor;
      midRing.rotation.y = Math.PI * 0.28 + smoothScroll * Math.PI * 0.9;

      fineRing.rotation.z += dt * 0.12 * spinBoost * motionFactor;
      fineRing.rotation.x = Math.PI * 0.44 - Math.cos(smoothScroll * Math.PI) * 0.32;

      // Ride polished chrome spheres cleanly along ring orbits
      for (const n of nodes) {
        const theta = elapsed * n.speed * motionFactor + n.offset + smoothScroll * 2.4;
        n.mesh.position.set(Math.cos(theta) * n.radius, Math.sin(theta) * n.radius, 0);
      }

      // Cosmic parallax drift of bokeh particles tied subtly to vertical scroll
      particleSystem.rotation.y =
        elapsed * 0.014 * motionFactor + mouseX * 0.045 + smoothScroll * 0.35;
      particleSystem.rotation.x = mouseY * 0.035;
      particleSystem.position.y = (smoothScroll - 0.5) * 3.2;

      // Subtle camera gaze offset
      camera.position.x += (mouseX * 0.45 - camera.position.x) * Math.min(1, dt * 4);
      camera.position.y += (0.15 + mouseY * 0.3 - camera.position.y) * Math.min(1, dt * 4);
      camera.lookAt(cluster.position.x * 0.2, cluster.position.y * 0.2, -1.5);

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

      haloGeo.dispose();
      haloMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      outerRingGeo.dispose();
      midRingGeo.dispose();
      fineRingGeo.dispose();
      ringMatChrome.dispose();
      ringMatViolet.dispose();
      ringMatCyan.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      bokehTexture.dispose();
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
