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
  varying vec3 vWorldNormal;
  varying vec3 vViewPos;
  varying float vElevation;

  // Smooth analytical multi-wave sound resonance displacement (artifact-free C∞ surface)
  float waveField(vec3 p, float t, float amp) {
    float w1 = sin(p.x * 2.8 + t * 1.1) * cos(p.y * 2.6 - t * 0.85) * sin(p.z * 2.4 + t * 0.6);
    float w2 = sin(p.y * 4.4 - t * 1.4 + p.x * 2.1) * cos(p.z * 4.1 + t * 0.9);
    float w3 = cos((p.x + p.y + p.z) * 3.2 - t * 1.25);
    return (w1 * 0.55 + w2 * 0.30 + w3 * 0.15) * amp;
  }

  vec3 displacePos(vec3 p, vec3 n, float t, float amp) {
    return p + n * waveField(p, t, amp);
  }

  void main() {
    float amp = 0.085 + uAudioBass * 0.16 + uHover * 0.045;
    float t = uTime * 0.85;
    vec3 n = normalize(normal);

    float d = waveField(position, t, amp);
    vElevation = d / max(amp, 0.001);
    vec3 displaced = position + n * d;

    // Finite-difference tangent normal recomputation so specular reflections stay silky smooth
    vec3 up = abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, n));
    vec3 bitangent = normalize(cross(n, tangent));
    float eps = 0.025;

    vec3 pT = displacePos(position + tangent * eps, normalize(position + tangent * eps), t, amp);
    vec3 pB = displacePos(position + bitangent * eps, normalize(position + bitangent * eps), t, amp);
    vec3 computedNormal = normalize(cross(pT - displaced, pB - displaced));
    if (dot(computedNormal, n) < 0.0) computedNormal = -computedNormal;

    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewPos = -mvPos.xyz;
    vWorldNormal = normalize(normalMatrix * computedNormal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PLASMA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform float uHover;
  varying vec3 vWorldNormal;
  varying vec3 vViewPos;
  varying float vElevation;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewPos);
    vec3 R = reflect(-V, N);

    float NdotV = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - NdotV, 3.0);

    // Studio directional lights in view space
    vec3 L1 = normalize(vec3(-0.55, 0.72, 0.65)); // Cool silver key softbox
    vec3 L2 = normalize(vec3(0.75, -0.35, 0.45)); // Electric violet rim
    vec3 L3 = normalize(vec3(0.0, -0.8, 0.5));   // Subtle under-fill

    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);

    float specKey = pow(max(dot(N, H1), 0.0), 42.0);
    float specRim = pow(max(dot(N, H2), 0.0), 22.0);
    float diffKey = max(dot(N, L1), 0.0);
    float diffRim = max(dot(N, L2), 0.0);
    float crest = smoothstep(-0.2, 0.9, vElevation);

    // Studio softbox reflection band on liquid chrome/obsidian
    float studioHorizon = smoothstep(0.08, 0.55, R.y) * smoothstep(0.95, 0.35, R.y);
    float violetSweep = smoothstep(-0.3, 0.6, R.x) * (1.0 - abs(R.y));

    vec3 deepObsidian = vec3(0.024, 0.016, 0.048);
    vec3 liquidTitanium = vec3(0.14, 0.12, 0.22);
    vec3 chromeSilver = vec3(0.88, 0.89, 0.95);
    vec3 electricPurple = vec3(0.529, 0.216, 1.0);
    vec3 neonViolet = vec3(0.72, 0.44, 1.0);

    vec3 col = mix(deepObsidian, liquidTitanium, diffKey * 0.55 + crest * 0.35);
    col += chromeSilver * studioHorizon * 0.42;
    col += electricPurple * (diffRim * 0.45 + violetSweep * 0.32 + crest * (0.28 + uAudioBass * 0.45));
    col += neonViolet * fresnel * (0.9 + uAudioMid * 0.55 + uHover * 0.25);
    col += chromeSilver * specKey * 0.95;
    col += neonViolet * specRim * (0.8 + uAudioBass * 0.6);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const AURA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAudioEnergy;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float glowInner = exp(-r * r * 5.2);
    float glowOuter = exp(-r * r * 1.9);

    vec3 deepViolet = vec3(0.32, 0.11, 0.65);
    vec3 electricPurple = vec3(0.56, 0.24, 1.0);

    float pulse = 0.88 + 0.12 * sin(uTime * 1.6) + uAudioEnergy * 0.35;
    vec3 col = mix(deepViolet, electricPurple, glowInner) * pulse;
    float alpha = (glowOuter * 0.38 + glowInner * 0.34) * smoothstep(1.0, 0.35, r);
    gl_FragColor = vec4(col, alpha);
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
    float drift = uTime * 0.14 + aPhase * 6.2831;
    pos.x += sin(drift * 0.6) * 0.18;
    pos.y += cos(drift * 0.5) * 0.18;
    pos.z += sin(drift * 0.35) * 0.14 - uScrollVelocity * 1.1;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = max(-mvPos.z, 0.1);

    // Natural twinkling
    float twinkle = 0.68 + 0.32 * sin(uTime * 1.8 + aPhase * 12.56);

    // Camera proximity fade: never let any particle block the lens or text (< 2.5 units)
    float nearFade = smoothstep(2.2, 4.2, dist);
    float farFade = smoothstep(85.0, 10.0, dist);
    vAlpha = twinkle * nearFade * farFade;

    // Crisp point size calculation: capped at max 6.0px (retina) so they look like pin-sharp stars, NOT huge blurry meatballs
    float size = aScale * uPixelRatio * (1.0 + uAudioEnergy * 0.25) * (46.0 / max(dist, 1.8));
    gl_PointSize = clamp(size, 1.0, 6.0);
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

    // Razor-sharp stellar core with smooth inverse-distance optical bloom
    float core = smoothstep(0.18, 0.0, d);
    float halo = exp(-d * 6.4) * 0.52;
    float intensity = core * 1.15 + halo;

    gl_FragColor = vec4(vColor, intensity * vAlpha);
  }
`;

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
  uniform float uAudioEnergy;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform vec3 uAtmosphereColor;
  uniform float uShockwave;
  varying vec2 vUv;

  // Compact pseudo-random hash
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Smooth bilinear noise
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

  // 5-octave rotated Fractional Brownian Motion
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise2(p);
      p = rot * p * 2.05 + vec2(1.4, 3.1);
      a *= 0.49;
    }
    return v;
  }

  // Crisp procedural star generation in fragment shader (pinpoint sharpness, zero vertex cost)
  float starLayer(vec2 p, float scale, float density, float twinkleRate, float t) {
    vec2 gridId = floor(p * scale);
    vec2 gridUv = fract(p * scale) - 0.5;

    float h = hash21(gridId);
    if (h < density) return 0.0;

    // Small random offset within cell
    vec2 offset = vec2(hash21(gridId + 3.1), hash21(gridId + 17.7)) * 0.7 - 0.35;
    float d = length(gridUv - offset);

    // Natural twinkling
    float twinkle = 0.65 + 0.35 * sin(t * twinkleRate + h * 62.83);

    // Razor-sharp pinpoint star core
    float core = smoothstep(0.065, 0.0, d);
    float halo = exp(-d * 14.0) * 0.38;

    // Subtle 4-point optical diffraction spike for top 1.8% brightest stars (Hubble / James Webb style)
    float spike = 0.0;
    if (h > 0.982) {
      vec2 delta = abs(gridUv - offset);
      spike = (exp(-delta.x * 24.0) * exp(-delta.y * 2.8) +
               exp(-delta.y * 24.0) * exp(-delta.x * 2.8)) * 0.42;
    }

    return (core * 1.25 + halo + spike) * twinkle;
  }

  void main() {
    // Aspect ratio correction so cosmic structures don't stretch on mobile or ultrawide
    vec2 p = vUv - 0.5;
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    // Natural cosmic inclination angle (~20 deg)
    float rotAngle = 0.35;
    mat2 cosmicRot = mat2(cos(rotAngle), sin(rotAngle), -sin(rotAngle), cos(rotAngle));
    vec2 cPos = cosmicRot * (p + vec2(uPointer.x * 0.02, -uScroll * 0.28 + uPointer.y * 0.015));

    // Dynamic beat shockwave ring distortion
    float distOrigin = length(cPos);
    float waveDist = uShockwave * 2.4;
    float shock = exp(-pow((distOrigin - waveDist) * 7.5, 2.0)) * max(0.0, 1.0 - uShockwave);
    cPos += (distOrigin > 0.001 ? normalize(cPos) : vec2(0.0)) * shock * 0.085;

    // --- 1. DEEP SPACE NEBULA (Domain-warped fluid gas filaments) ---
    float t = uTime * 0.012;
    vec2 q = vec2(
      fbm(cPos * 1.5 + vec2(t * 0.3, -t * 0.15)),
      fbm(cPos * 1.5 + vec2(4.2 + t * 0.2, 2.8 - t * 0.18))
    );

    vec2 r = vec2(
      fbm(cPos * 2.2 + 2.8 * q + vec2(1.7, 9.2) - t * 0.4),
      fbm(cPos * 2.2 + 2.8 * q + vec2(8.3, 2.8) + t * 0.3)
    );

    float gasField = fbm(cPos * 1.2 + 3.4 * r);
    float gasWisps = fbm(cPos * 3.4 + q * 1.6);
    float darkRift = smoothstep(0.32, 0.72, fbm(cPos * 2.4 + r * 1.4));

    // Deep organic cosmic color grading
    vec3 voidBlack     = vec3(0.012, 0.009, 0.018); // Pure deep cosmic black #030205
    vec3 midnightAbyss = vec3(0.026, 0.016, 0.048); // Deep interstellar space
    vec3 nebulaIndigo  = vec3(0.075, 0.035, 0.145); // Diffuse molecular cloud #130925
    vec3 starlightCyan = vec3(0.240, 0.520, 0.820); // Delicate cool stellar reflection mist #3d85d1

    // Reactive atmosphere tint
    vec3 activeGas = mix(vec3(0.380, 0.140, 0.760), uAtmosphereColor, 0.72);
    vec3 activePeak = mix(vec3(0.680, 0.320, 1.000), normalize(uAtmosphereColor + vec3(0.25, 0.25, 0.35)), 0.65);

    // Layer the atmospheric gas
    vec3 col = mix(voidBlack, midnightAbyss, smoothstep(0.12, 0.85, gasField));
    col = mix(col, nebulaIndigo, smoothstep(0.30, 0.90, gasWisps) * 0.65);

    // Luminous emission gas, carved organically by interstellar dark dust rifts
    float emission = smoothstep(0.40, 0.86, gasField) * (1.0 - darkRift * 0.58);
    col += activeGas * emission * (0.36 + uAudioEnergy * 0.22);
    col += activePeak * pow(emission, 2.2) * 0.32;
    col += starlightCyan * smoothstep(0.65, 0.95, gasWisps) * 0.16;
    col += uAtmosphereColor * shock * 0.55; // Shockwave luminous ripple

    // --- 2. PROCEDURAL DISTANT STELLAR FIELD (Per-Pixel Sharp Stars) ---
    // Background micro-pinpoints (thousands of tiny distant stars)
    float starsFar = starLayer(cPos + vec2(0.12, 0.34), 110.0, 0.86, 1.2, uTime);
    // Midground stars (crisper, twinkling)
    float starsMid = starLayer(cPos * 1.1 + vec2(0.45, 0.78), 52.0, 0.94, 2.1, uTime);
    // Bright landmark stars with diffraction spikes
    float starsNear = starLayer(cPos * 1.2 + vec2(0.89, 0.12), 22.0, 0.985, 2.8, uTime);

    vec3 starColorFar = vec3(0.85, 0.88, 1.0);
    vec3 starColorMid = mix(vec3(0.9, 0.93, 1.0), vec3(1.0, 0.92, 0.80), hash21(floor(cPos * 52.0)));
    vec3 starColorNear = mix(vec3(0.95, 0.96, 1.0), uAtmosphereColor * 0.5 + vec3(0.5, 0.5, 0.5), hash21(floor(cPos * 22.0)));

    col += starColorFar * starsFar * 0.65;
    col += starColorMid * starsMid * 0.95;
    col += starColorNear * starsNear * 1.25;

    // --- 3. SUBTLE CINEMATIC VIGNETTE & EDGES ---
    float distFromCenter = length(vUv - 0.5);
    float vignette = smoothstep(0.98, 0.28, distFromCenter);
    col *= mix(0.72, 1.0, vignette);

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

    // 1. RENDERER (Crisp MSAA antialiasing on all devices so curves have zero pixel jaggedness)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const baseDpr = isMobile
      ? Math.min(window.devicePixelRatio || 1, 1.75)
      : Math.min(window.devicePixelRatio || 1, 2.0);
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
      uResolution: { value: new THREE.Vector2(width, height) },
      uAtmosphereColor: { value: new THREE.Vector3(0.529, 0.216, 1.0) },
      uShockwave: { value: 0 },
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

    // 6. SHARED METALLIC & OBSIDIAN MATERIALS (Studio Clearcoat Chrome)
    const chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe6e6f0,
      metalness: 0.96,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 2.2,
    });

    const darkChromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x29223c,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.9,
    });

    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b0816,
      metalness: 0.88,
      roughness: 0.2,
      envMapIntensity: 1.5,
    });

    // =========================================================================
    // 7. CENTRAL HERO SYMBOL — SCULPTURAL LIQUID-OBSIDIAN RESONANCE CORE
    // =========================================================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(isMobile ? 0 : 1.8, isMobile ? 1.72 : 0.22, 0);
    scene.add(coreGroup);

    // 7a. Soft Volumetric Radial Halo Behind Core
    const auraGeo = new THREE.PlaneGeometry(5.6, 5.6);
    const auraUniforms = {
      uTime: { value: 0 },
      uAudioEnergy: { value: 0 },
    };
    const auraMat = new THREE.ShaderMaterial({
      vertexShader: AURA_VERTEX_SHADER,
      fragmentShader: AURA_FRAGMENT_SHADER,
      uniforms: auraUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const auraPlane = new THREE.Mesh(auraGeo, auraMat);
    auraPlane.position.z = -1.2;
    coreGroup.add(auraPlane);

    // 7b. High-Res Sculptural Liquid-Chrome / Obsidian Core (Analytical Normal Displacement)
    const plasmaGeo = new THREE.SphereGeometry(1.06, isMobile ? 64 : 96, isMobile ? 64 : 96);
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
    });
    const plasmaCore = new THREE.Mesh(plasmaGeo, plasmaMat);
    coreGroup.add(plasmaCore);

    // 7c. 3 Precision-Machined Orbital Rings (Smooth High-Segment Geometry, No Wireframe Soup)
    const gyroRing1Geo = new THREE.TorusGeometry(1.52, 0.036, 28, isMobile ? 128 : 180);
    const gyroRing1 = new THREE.Mesh(gyroRing1Geo, chromeMaterial);
    gyroRing1.rotation.x = 1.05;
    gyroRing1.rotation.y = 0.25;
    coreGroup.add(gyroRing1);

    const gyroRing2Geo = new THREE.TorusGeometry(1.78, 0.018, 22, isMobile ? 120 : 160);
    const gyroRing2 = new THREE.Mesh(gyroRing2Geo, darkChromeMaterial);
    gyroRing2.rotation.x = -0.82;
    gyroRing2.rotation.z = 0.42;
    coreGroup.add(gyroRing2);

    const gyroRing3Geo = new THREE.TorusGeometry(1.98, 0.01, 16, isMobile ? 112 : 160);
    const gyroRing3Mat = new THREE.MeshStandardMaterial({
      color: 0xb46bff,
      emissive: 0x8737ff,
      emissiveIntensity: 1.6,
      metalness: 0.4,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const gyroRing3 = new THREE.Mesh(gyroRing3Geo, gyroRing3Mat);
    gyroRing3.rotation.y = 0.9;
    gyroRing3.rotation.x = 0.35;
    coreGroup.add(gyroRing3);

    // 7d. Polished Micro-Spheres Orbiting Along the Rings (Smooth Spheres Instead of Jagged Shards)
    const shardCount = isMobile ? 12 : 24;
    const shardGeo = new THREE.SphereGeometry(0.034, 14, 14);
    const shardInstanced = new THREE.InstancedMesh(shardGeo, chromeMaterial, shardCount);
    const shardData = Array.from({ length: shardCount }, (_, i) => ({
      radius: 1.64 + (i % 3) * 0.24,
      speed: 0.24 + (i % 5) * 0.06,
      angle: (i / shardCount) * Math.PI * 2,
      tilt: ((i % 4) - 1.5) * 0.35,
      scale: 0.65 + (i % 3) * 0.35,
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

    // Interactive targeting beam & glowing data packet for hovered DSP node
    const packetGeo = new THREE.SphereGeometry(0.11, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    const packetMesh = new THREE.Mesh(packetGeo, packetMat);
    networkGroup.add(packetMesh);

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
    const particleCount = isMobile ? 320 : 850;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pScales = new Float32Array(particleCount);
    const pPhases = new Float32Array(particleCount);

    // Natural stellar spectral colors
    const colDiamond = new THREE.Color(0xffffff); // Pure white A-type
    const colCoolIce = new THREE.Color(0xbfdbfe); // O/B-type blue star
    const colWarmGold = new THREE.Color(0xfef08a); // F/G-type stellar warm
    const colVioletLum = new THREE.Color(0xd8b4fe); // Ionized violet accent
    const colSilver = new THREE.Color(0xd9d9e2);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 32;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      // Push stars into deep 3D volume (z <= -2) to prevent any particle from flying into camera lens
      pPositions[i * 3 + 2] = -Math.random() * 38 - 2.5;

      // Delicate micro-scale for pin-sharp diamond starlight
      pScales[i] = 0.42 + Math.random() * 0.72;
      pPhases[i] = Math.random();

      const r = Math.random();
      const chosen =
        r < 0.42
          ? colDiamond
          : r < 0.68
          ? colSilver
          : r < 0.84
          ? colCoolIce
          : r < 0.94
          ? colVioletLum
          : colWarmGold;
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
        ? Math.min(window.devicePixelRatio || 1, 1.75)
        : Math.min(window.devicePixelRatio || 1, 2.0);
      renderer.setPixelRatio(nextDpr);
      particleUniforms.uPixelRatio.value = nextDpr;
      renderer.setSize(width, height, false);
      nebulaUniforms.uResolution.value.set(width, height);
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

      // Atmosphere color smooth transition
      const targetR = uState.atmosphereColor[0];
      const targetG = uState.atmosphereColor[1];
      const targetB = uState.atmosphereColor[2];
      const curAtmos = nebulaUniforms.uAtmosphereColor.value;
      curAtmos.x += (targetR - curAtmos.x) * damp * 0.45;
      curAtmos.y += (targetG - curAtmos.y) * damp * 0.45;
      curAtmos.z += (targetB - curAtmos.z) * damp * 0.45;
      violetRimLight.color.setRGB(curAtmos.x, curAtmos.y, curAtmos.z);

      // Beat shockwave decay & propagation
      if (uState.shockwave > 0.001) {
        nebulaUniforms.uShockwave.value = 1.0 - uState.shockwave;
        uState.shockwave = Math.max(0, uState.shockwave - delta * 1.5);
      } else {
        nebulaUniforms.uShockwave.value = 0;
      }

      auraUniforms.uTime.value = elapsed;
      auraUniforms.uAudioEnergy.value = audioEnergy;

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
        const heroX = mobileNow ? 0 : 1.8;
        const heroY = mobileNow ? 1.72 : 0.22;
        const heroScale = mobileNow ? 0.56 : 1.02;
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
      coreGroup.rotation.y = smoothPointerX * 0.3 + elapsed * 0.09;
      coreGroup.rotation.x = -smoothPointerY * 0.2 + s * Math.PI * 1.1;

      // Keep radial aura billboard facing camera cleanly inside coreGroup
      auraPlane.quaternion.copy(coreGroup.quaternion).invert();

      gyroRing1.rotation.z += delta * 0.42 * spinBoost;
      gyroRing1.rotation.x = 1.05 + Math.sin(elapsed * 0.4) * 0.16;

      gyroRing2.rotation.y -= delta * 0.52 * spinBoost;
      gyroRing2.rotation.z = 0.42 + Math.cos(elapsed * 0.35) * 0.14;

      gyroRing3.rotation.x += delta * 0.28;
      gyroRing3.rotation.y += delta * 0.36;

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

        const targetNode =
          uState.targetNodeIndex >= 0 && uState.targetNodeIndex < nodeCount
            ? uState.targetNodeIndex
            : -1;

        for (let i = 0; i < nodeCount; i++) {
          const p = nodePositions[i];
          dummy.position.copy(p);
          const isTarget = targetNode === i;
          const nodePulse =
            (isTarget ? 2.4 : 0.75 + 0.35 * Math.sin(elapsed * 3.0 + i * 0.7)) +
            audioMid * 0.5;
          dummy.scale.setScalar(nodePulse);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          networkNodes.setMatrixAt(i, dummy.matrix);
        }
        networkNodes.instanceMatrix.needsUpdate = true;

        if (targetNode >= 0) {
          const tp = nodePositions[targetNode];
          const packetT = (elapsed * 2.4) % 1.0;
          packetMesh.position.set(tp.x * packetT, tp.y * packetT, tp.z * packetT);
          packetMat.opacity = netAlpha * 0.95;
        } else {
          packetMat.opacity = 0;
        }
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
      auraGeo.dispose();
      auraMat.dispose();

      gyroRing1Geo.dispose();
      gyroRing2Geo.dispose();
      gyroRing3Geo.dispose();
      gyroRing3Mat.dispose();

      shardGeo.dispose();
      shardInstanced.dispose();

      megaRingGeo.dispose();
      megaRingGlowGeo.dispose();
      megaRingGlowMat.dispose();

      nodeGeo.dispose();
      nodeMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
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
