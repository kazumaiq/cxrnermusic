"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type ZipStagePhase = "idle" | "charging" | "ripping" | "bloom" | "revealed";

interface ZipPacket3DViewerProps {
  caseId?: string;
  themeColor?: string;
  imageUrl?: string;
  labelCode?: string;
  specimenName?: string;
  stagePhase?: ZipStagePhase;
  compact?: boolean;
  heightClass?: string;
}

function buildSpecimenEnv(renderer: THREE.WebGLRenderer, accentHex: string): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x141222);

  // Large frontal studio softbox so silver/chrome front face always reflects rich highlights
  const frontSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.2, 2.25, 2.5),
      side: THREE.DoubleSide,
    })
  );
  frontSoftbox.position.set(0, 1.5, 8);
  frontSoftbox.lookAt(0, 0, 0);
  envScene.add(frontSoftbox);

  // Overhead studio diffuser strip
  const overhead = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 6),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.8, 2.8, 3.0),
      side: THREE.DoubleSide,
    })
  );
  overhead.position.set(0, 7.5, 2);
  overhead.rotation.x = Math.PI / 2;
  envScene.add(overhead);

  // Colored left rim panel
  const accentColor = new THREE.Color(accentHex);
  const sideA = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 14),
    new THREE.MeshBasicMaterial({
      color: accentColor.clone().multiplyScalar(2.6),
      side: THREE.DoubleSide,
    })
  );
  sideA.position.set(-7.5, 0.5, 2);
  sideA.rotation.y = Math.PI / 2;
  envScene.add(sideA);

  // Cool silver/cyan right rim panel
  const sideB = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 14),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.9, 2.35, 2.7),
      side: THREE.DoubleSide,
    })
  );
  sideB.position.set(7.5, 0.5, 2);
  sideB.rotation.y = -Math.PI / 2;
  envScene.add(sideB);

  // Back fill panel so 360 rotation also stays bright on reverse face
  const backSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.7, 1.65, 2.1),
      side: THREE.DoubleSide,
    })
  );
  backSoftbox.position.set(0, 1, -8);
  envScene.add(backSoftbox);

  const rt = pmrem.fromScene(envScene, 0.035);
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

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFrontPouchTexture(
  canvas: HTMLCanvasElement,
  accentHex: string,
  labelCode: string,
  titleText: string,
  loadedImg?: HTMLImageElement | null
) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Brushed dark chrome metallic foil background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#1c182b");
  bg.addColorStop(0.35, "#0e0c18");
  bg.addColorStop(0.7, "#1a1728");
  bg.addColorStop(1, "#090710");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Diagonal foil specular reflection sheen
  const sheen = ctx.createLinearGradient(0, h * 0.1, w, h * 0.75);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.09)");
  sheen.addColorStop(0.52, "rgba(255,255,255,0.22)");
  sheen.addColorStop(0.6, "rgba(255,255,255,0.05)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Subtle ambient glow core
  const rad = ctx.createRadialGradient(w / 2, h * 0.48, 12, w / 2, h * 0.48, w * 0.48);
  rad.addColorStop(0, `${accentHex}55`);
  rad.addColorStop(0.6, `${accentHex}18`);
  rad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);

  if (loadedImg && loadedImg.naturalWidth > 0) {
    // Draw uploaded specimen image cleanly centered with balanced margins inside pouch window
    const padX = 24;
    const padY = 24;
    const targetW = w - padX * 2;
    const targetH = h - padY * 2;
    const scale = Math.min(targetW / loadedImg.naturalWidth, targetH / loadedImg.naturalHeight);
    const drawW = loadedImg.naturalWidth * scale;
    const drawH = loadedImg.naturalHeight * scale;
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;

    ctx.save();
    roundedRectPath(ctx, 16, 16, w - 32, h - 32, 24);
    ctx.clip();
    ctx.drawImage(loadedImg, dx, dy, drawW, drawH);
    ctx.restore();
  } else {
    // Crisp fallback industrial foil graphic visible immediately at frame 0
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    ctx.fillStyle = `${accentHex}33`;
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2;
    roundedRectPath(ctx, 42, 42, w - 84, 42, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CXRNER // SEALED ARCHIVE", w / 2, 70);

    // Center holographic ring emblem
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.47, 130, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.47, 94, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 32px sans-serif";
    ctx.fillText("CXRNER", w / 2, h * 0.47 + 11);

    ctx.font = "bold 24px sans-serif";
    ctx.fillText((titleText || "SPECIMEN").slice(0, 24).toUpperCase(), w / 2, h * 0.78);

    ctx.fillStyle = accentHex;
    ctx.font = "bold 18px monospace";
    ctx.fillText((labelCode || "SPECIMEN // 3D").slice(0, 28), w / 2, h * 0.84);
  }

  // Subtle metallic highlight border inside art window
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, 14, 14, w - 28, h - 28, 22);
  ctx.stroke();
}

function drawBackPouchTexture(
  canvas: HTMLCanvasElement,
  accentHex: string,
  labelCode: string,
  titleText: string
) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#1c192b");
  bg.addColorStop(0.5, "#110f1b");
  bg.addColorStop(1, "#0a0812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Tech grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Outer perimeter chrome trim
  ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
  ctx.lineWidth = 3;
  roundedRectPath(ctx, 22, 22, w - 44, h - 44, 24);
  ctx.stroke();

  // Top laboratory seal band
  ctx.fillStyle = `${accentHex}28`;
  ctx.fillRect(40, 48, w - 80, 56);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 48, w - 80, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CXRNER MUSIC // SPECIMEN LAB", w / 2, 83);

  // Center holographic octagon mark
  ctx.save();
  ctx.translate(w / 2, h * 0.43);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const rx = Math.cos(a) * 110;
    const ry = Math.sin(a) * 110;
    if (i === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = accentHex;
  ctx.font = "900 30px sans-serif";
  ctx.fillText("CXRNER", 0, -6);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 16px monospace";
  ctx.fillText("SEALED FOIL ARCHIVE", 0, 26);
  ctx.restore();

  // Bottom White Industrial Sticker
  ctx.fillStyle = "#f1f5f9";
  roundedRectPath(ctx, 44, h - 220, w - 88, 168, 16);
  ctx.fill();

  ctx.fillStyle = "#090710";
  ctx.fillRect(60, h - 204, w - 120, 34);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "left";
  ctx.fillText("PRESERVED DIGITAL SPECIMEN", 74, h - 181);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 19px sans-serif";
  ctx.fillText((titleText || "CXRNER ARCHIVE").slice(0, 26).toUpperCase(), 62, h - 140);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 15px monospace";
  ctx.fillText(`REF: ${(labelCode || "SPEC-2026").slice(0, 28)}`, 62, h - 114);

  // Barcode strips at bottom of sticker
  let bx = 62;
  const widths = [5, 2, 8, 3, 2, 6, 4, 2, 9, 3, 2, 5, 3, 7, 2, 4, 8, 2, 5, 3, 6, 2, 4, 7, 3, 5];
  ctx.fillStyle = "#090710";
  for (let i = 0; i < widths.length && bx < w - 70; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(bx, h - 98, widths[i], 32);
    }
    bx += widths[i] + 4;
  }
}

export default function ZipPacket3DViewer({
  caseId = "case_001_archive",
  themeColor = "#8737FF",
  imageUrl,
  labelCode,
  specimenName,
  stagePhase = "idle",
  compact = false,
  heightClass,
}: ZipPacket3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<ZipStagePhase>(stagePhase);
  const accentRef = useRef<string>(themeColor);
  const [fallbackMode, setFallbackMode] = useState(false);

  const resolvedCover =
    imageUrl ||
    (caseId === "case_002_black_specimen"
      ? "/drop/cases/case_002_black_specimen.svg"
      : caseId === "case_003_chrome_age"
      ? "/drop/cases/case_003_chrome_age.svg"
      : "/drop/cases/case_001_archive.svg");

  const resolvedTitle =
    specimenName ||
    (caseId === "case_002_black_specimen"
      ? "BLACK SPECIMEN"
      : caseId === "case_003_chrome_age"
      ? "CHROME AGE"
      : "ARCHIVE 001");

  useEffect(() => {
    phaseRef.current = stagePhase;
  }, [stagePhase]);

  useEffect(() => {
    accentRef.current = themeColor;
  }, [themeColor]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const width = Math.max(220, host.clientWidth || 340);
    const height = Math.max(240, host.clientHeight || 340);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFallbackMode(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.85 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;

    host.innerHTML = "";
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y";

    const scene = new THREE.Scene();
    const envTex = buildSpecimenEnv(renderer, themeColor);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 40);
    camera.position.set(0, -0.02, 6.85);

    const pouchRoot = new THREE.Group();
    scene.add(pouchRoot);

    // 1. Plump Metallic Vacuum Cushion Body (halfZ = 0.12 + bulge 0.125 => lush pillow volume even at 3/4 angles)
    const bodyGeo = new THREE.BoxGeometry(2.38, 3.06, 0.24, 20, 26, 2);
    const bodyPos = bodyGeo.attributes.position;
    for (let i = 0; i < bodyPos.count; i++) {
      const x = bodyPos.getX(i);
      const y = bodyPos.getY(i);
      const z = bodyPos.getZ(i);
      const nx = x / 1.19;
      const ny = y / 1.53;
      const bulge = Math.max(0, 1 - (nx * nx * 0.68 + ny * ny * 0.58));
      const crimp = Math.abs(nx) > 0.88 || Math.abs(ny) > 0.9 ? 0.3 : 1;
      bodyPos.setZ(i, z * crimp + Math.sign(z || 1) * bulge * 0.125);
    }
    bodyGeo.computeVertexNormals();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3b384c,
      metalness: 0.78,
      roughness: 0.22,
      envMapIntensity: 2.25,
    });
    const pouchBody = new THREE.Mesh(bodyGeo, bodyMat);
    pouchRoot.add(pouchBody);

    // 2. Chrome Perimeter Heat-Seal Trim Bars (Crisp metallic framing around silhouette)
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xeaf0ff,
      metalness: 0.95,
      roughness: 0.14,
      envMapIntensity: 2.5,
    });

    const leftSeamGeo = new THREE.BoxGeometry(0.085, 3.06, 0.08);
    const leftSeam = new THREE.Mesh(leftSeamGeo, chromeMat);
    leftSeam.position.set(-1.17, 0, 0);
    pouchRoot.add(leftSeam);

    const rightSeam = new THREE.Mesh(leftSeamGeo, chromeMat);
    rightSeam.position.set(1.17, 0, 0);
    pouchRoot.add(rightSeam);

    const bottomSeamGeo = new THREE.BoxGeometry(2.42, 0.095, 0.085);
    const bottomSeam = new THREE.Mesh(bottomSeamGeo, chromeMat);
    bottomSeam.position.set(0, -1.5, 0);
    pouchRoot.add(bottomSeam);

    // 3. Curved Front & Back High-Res Artwork Planes (Always sit cleanly OUTSIDE plump body bulge!)
    const frontCanvas = document.createElement("canvas");
    frontCanvas.width = 600;
    frontCanvas.height = 840;
    drawFrontPouchTexture(
      frontCanvas,
      themeColor,
      labelCode || resolvedTitle,
      resolvedTitle,
      null
    );
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.anisotropy = 4;

    const backCanvas = document.createElement("canvas");
    backCanvas.width = 600;
    backCanvas.height = 840;
    drawBackPouchTexture(backCanvas, themeColor, labelCode || resolvedTitle, resolvedTitle);
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;
    backTex.anisotropy = 4;

    const createCurvedLabelGeo = (zOffset: number, bulgeSign: number) => {
      const geo = new THREE.PlaneGeometry(2.08, 2.7, 18, 22);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const nx = x / 1.04;
        const ny = y / 1.35;
        const bulge = Math.max(0, 1 - (nx * nx * 0.68 + ny * ny * 0.58));
        pos.setZ(i, zOffset + bulgeSign * bulge * 0.128);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const frontGeo = createCurvedLabelGeo(0.145, 1);
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.22,
      metalness: 0.14,
      envMapIntensity: 1.45,
    });
    const frontPlane = new THREE.Mesh(frontGeo, frontMat);
    frontPlane.position.set(0, -0.05, 0);
    pouchRoot.add(frontPlane);

    const backGeo = createCurvedLabelGeo(0.145, 1);
    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.28,
      metalness: 0.28,
      envMapIntensity: 1.55,
    });
    const backPlane = new THREE.Mesh(backGeo, backMat);
    backPlane.rotation.y = Math.PI;
    backPlane.position.set(0, -0.05, 0);
    pouchRoot.add(backPlane);

    // Load actual JPG / SVG via Image -> Canvas rasterization (bulletproof on iPhone WebGL!)
    let activeDisposed = false;
    const imgLoader = new Image();
    imgLoader.crossOrigin = "anonymous";
    imgLoader.onload = () => {
      if (activeDisposed) return;
      drawFrontPouchTexture(
        frontCanvas,
        accentRef.current,
        labelCode || resolvedTitle,
        resolvedTitle,
        imgLoader
      );
      frontTex.needsUpdate = true;
    };
    imgLoader.src = resolvedCover;

    // 4. Detachable Brushed Chrome Heat-Seal Tear Strip & Hang-Hole
    const topStripGroup = new THREE.Group();
    topStripGroup.position.set(0, 1.55, 0);
    pouchRoot.add(topStripGroup);

    const sealStripGeo = new THREE.BoxGeometry(2.42, 0.26, 0.09);
    const sealStripMesh = new THREE.Mesh(sealStripGeo, chromeMat);
    topStripGroup.add(sealStripMesh);

    const holeGeo = new THREE.BoxGeometry(0.42, 0.085, 0.11);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050408 });
    const hangSlot = new THREE.Mesh(holeGeo, holeMat);
    hangSlot.position.set(0, 0.02, 0);
    topStripGroup.add(hangSlot);

    // 5. Interlocking Neon-Chrome Zipper Rail + Protruding Hinged Pull-Tab + Internal Vacuum Slit Glow
    const accentColor = new THREE.Color(themeColor);
    const zipperGeo = new THREE.BoxGeometry(2.28, 0.062, 0.21);
    const zipperMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.7,
      metalness: 0.85,
      roughness: 0.16,
    });
    const zipperBar = new THREE.Mesh(zipperGeo, zipperMat);
    zipperBar.position.set(0, 1.36, 0);
    pouchRoot.add(zipperBar);

    const seamGlowGeo = new THREE.BoxGeometry(2.14, 0.08, 0.235);
    const seamGlowMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const seamGlowBar = new THREE.Mesh(seamGlowGeo, seamGlowMat);
    seamGlowBar.position.set(0, 1.4, 0);
    pouchRoot.add(seamGlowBar);

    const sliderGroup = new THREE.Group();
    sliderGroup.position.set(0.95, 1.36, 0.02);
    pouchRoot.add(sliderGroup);

    const sliderGeo = new THREE.BoxGeometry(0.18, 0.135, 0.24);
    const sliderTab = new THREE.Mesh(sliderGeo, chromeMat);
    sliderGroup.add(sliderTab);

    const pullLoopGeo = new THREE.BoxGeometry(0.1, 0.18, 0.04);
    const pullLoop = new THREE.Mesh(pullLoopGeo, chromeMat);
    pullLoop.position.set(0, -0.1, 0.13);
    pullLoop.rotation.x = -0.35;
    sliderGroup.add(pullLoop);

    // 6. Laboratory Orbital Pedestal Ring
    const haloGeo = new THREE.TorusGeometry(1.56, 0.022, 12, 96);
    const haloMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.65,
    });
    const haloRing = new THREE.Mesh(haloGeo, haloMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.set(0, -1.82, 0);
    scene.add(haloRing);

    // Subtle Soft Radial Bokeh Dust & Cryo Sparks
    const sparkCanvas = document.createElement("canvas");
    sparkCanvas.width = 32;
    sparkCanvas.height = 32;
    const sCtx = sparkCanvas.getContext("2d");
    if (sCtx) {
      const sGrad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      sGrad.addColorStop(0, "rgba(255,255,255,1)");
      sGrad.addColorStop(0.45, "rgba(255,255,255,0.65)");
      sGrad.addColorStop(1, "rgba(255,255,255,0)");
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, 32, 32);
    }
    const sparkTex = new THREE.CanvasTexture(sparkCanvas);

    const moteCount = isMobile ? 42 : 84;
    const motePos = new Float32Array(moteCount * 3);
    const moteBaseY = new Float32Array(moteCount);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 4.6;
      const yVal = (Math.random() - 0.5) * 4.4;
      motePos[i * 3 + 1] = yVal;
      moteBaseY[i] = yVal;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: accentColor,
      map: sparkTex,
      size: 0.085,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    // Full 3-Point Studio Lights + Hemisphere Fill
    const hemi = new THREE.HemisphereLight(0xf6f6ff, 0x1a122c, 1.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.55);
    keyLight.position.set(3.5, 4.5, 7);
    scene.add(keyLight);

    const rimA = new THREE.PointLight(accentColor, 12, 16);
    rimA.position.set(-3.4, 1.2, 3.8);
    scene.add(rimA);

    const rimB = new THREE.PointLight(0x00f0ff, 7, 14);
    rimB.position.set(3.6, -1.2, 3.2);
    scene.add(rimB);

    // Interactive Drag Controls (preserves full 360 user drag, zero unintended edge-on spinning!)
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragRotY = 0;
    let targetRotX = 0.04;
    let curRotY = -0.22;
    let curRotX = 0.04;

    const canvasEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      dragRotY += dx * 0.013;
      if (e.pointerType !== "touch" || Math.abs(dx) > Math.abs(dy)) {
        targetRotX = Math.max(-0.42, Math.min(0.42, targetRotX + dy * 0.008));
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    canvasEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!renderer || entries.length === 0) return;
      const rect = entries[0].contentRect;
      if (rect.width > 10 && rect.height > 10) {
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
      }
    });
    resizeObserver.observe(host);

    const clock = new THREE.Clock();
    let rafId = 0;
    let prevPhase: ZipStagePhase = phaseRef.current;
    let phaseStartElapsed = 0;

    const tick = () => {
      if (activeDisposed || !renderer) return;
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden) return;

      const t = clock.getElapsedTime();
      const phase = phaseRef.current;
      if (phase !== prevPhase) {
        prevPhase = phase;
        phaseStartElapsed = t;
      }
      const pElapsed = t - phaseStartElapsed;

      const liveAccent = new THREE.Color(accentRef.current);
      zipperMat.color.lerp(liveAccent, 0.14);
      zipperMat.emissive.lerp(liveAccent, 0.14);
      seamGlowMat.color.lerp(liveAccent, 0.16);
      haloMat.color.lerp(liveAccent, 0.14);
      rimA.color.lerp(liveAccent, 0.14);
      moteMat.color.lerp(liveAccent, 0.14);

      // Keep hero 3/4 showcase sweep unless user manually drags around 360 deg
      const heroOsc = -0.22 + Math.sin(t * 0.85) * 0.24;
      let desiredRotY = dragRotY + heroOsc;

      let targetCamZ = 6.85;
      let targetSliderX = 0.95;
      let targetStripX = 0;
      let targetStripY = 1.55;
      let targetStripZ = 0;
      let targetStripRotZ = 0;
      let targetStripRotX = 0;
      let targetStripVisible = true;
      let targetSeamGlow = 0;
      let shakeX = 0;
      let shakeY = 0;

      if (phase === "charging") {
        // Snap smoothly to front 3/4 lock angle so user watches laser + zipper rail
        dragRotY += (Math.round(dragRotY / (Math.PI * 2)) * Math.PI * 2 - dragRotY) * 0.09;
        desiredRotY = dragRotY - 0.14 + Math.sin(t * 14) * 0.035;
        targetRotX += (0.04 - targetRotX) * 0.08;
        targetCamZ = 6.38;
        const vib = Math.min(1, pElapsed / 1.8) * 0.022;
        shakeX = Math.sin(t * 54) * vib;
        shakeY = Math.cos(t * 62) * vib;
        zipperMat.emissiveIntensity = 1.2 + Math.sin(t * 18) * 0.65;
        targetSeamGlow = 0.18 + Math.sin(t * 20) * 0.12;
        pullLoop.rotation.x = -0.35 - Math.sin(t * 24) * 0.14;
      } else if (phase === "ripping") {
        // Physical zipper pull from right (+0.95) -> left (-0.98) + diagonal top seal peel!
        dragRotY += (Math.round(dragRotY / (Math.PI * 2)) * Math.PI * 2 - dragRotY) * 0.14;
        const ripP = Math.min(1, pElapsed / 0.68);
        const eased = 1 - Math.pow(1 - ripP, 2.4);

        desiredRotY = dragRotY + THREE.MathUtils.lerp(-0.14, 0.22, eased);
        targetRotX += (0.08 - targetRotX) * 0.12;
        targetCamZ = 6.22;

        targetSliderX = THREE.MathUtils.lerp(0.95, -0.98, eased);
        pullLoop.rotation.x = -0.85;

        targetStripX = -0.58 * eased;
        targetStripY = 1.55 + 0.68 * eased;
        targetStripZ = 0.34 * eased;
        targetStripRotZ = 0.44 * eased;
        targetStripRotX = -0.58 * eased;

        zipperMat.emissiveIntensity = 2.6;
        targetSeamGlow = 0.45 + eased * 0.55;
        shakeX = Math.sin(t * 72) * 0.032 * (1 - ripP * 0.4);
        shakeY = Math.cos(t * 64) * 0.024 * (1 - ripP * 0.4);
      } else if (phase === "bloom" || phase === "revealed") {
        dragRotY += (Math.round(dragRotY / (Math.PI * 2)) * Math.PI * 2 - dragRotY) * 0.1;
        desiredRotY = dragRotY + Math.sin(t * 0.85) * 0.22;
        targetCamZ = 6.55;
        targetSliderX = -0.98;
        pullLoop.rotation.x = -0.5;
        targetStripX = -1.1;
        targetStripY = 2.85;
        targetStripZ = 0.55;
        targetStripRotZ = 0.62;
        targetStripRotX = -0.75;
        targetStripVisible = pElapsed < 0.25 && phase === "bloom";
        zipperMat.emissiveIntensity = phase === "bloom" ? 2.4 : 1.1;
        targetSeamGlow = phase === "bloom" ? 0.95 : 0.22 + Math.sin(t * 3) * 0.08;
      } else {
        pullLoop.rotation.x = -0.35;
        zipperMat.emissiveIntensity = 0.72 + Math.sin(t * 2.2) * 0.22;
      }

      curRotY += (desiredRotY - curRotY) * (isDragging ? 0.24 : 0.1);
      curRotX += (targetRotX - curRotX) * 0.1;
      camera.position.z += (targetCamZ - camera.position.z) * 0.09;

      sliderGroup.position.x += (targetSliderX - sliderGroup.position.x) * 0.22;
      topStripGroup.position.x += (targetStripX - topStripGroup.position.x) * 0.18;
      topStripGroup.position.y += (targetStripY - topStripGroup.position.y) * 0.18;
      topStripGroup.position.z += (targetStripZ - topStripGroup.position.z) * 0.18;
      topStripGroup.rotation.z += (targetStripRotZ - topStripGroup.rotation.z) * 0.18;
      topStripGroup.rotation.x += (targetStripRotX - topStripGroup.rotation.x) * 0.18;
      topStripGroup.visible = targetStripVisible;

      seamGlowMat.opacity += (targetSeamGlow - seamGlowMat.opacity) * 0.22;

      pouchRoot.rotation.y = curRotY;
      pouchRoot.rotation.x = curRotX;
      pouchRoot.position.x = shakeX;
      pouchRoot.position.y = Math.sin(t * 1.6) * 0.065 + shakeY;

      haloRing.rotation.z = t * (phase === "charging" || phase === "ripping" ? 1.6 : 0.45);
      haloRing.scale.setScalar(
        phase === "charging" || phase === "ripping" ? 1.07 + Math.sin(t * 14) * 0.055 : 1.0
      );

      // Rising cryo spark fountain during ripping/bloom
      const mAttr = moteGeo.attributes.position as THREE.BufferAttribute;
      const venting = phase === "ripping" || phase === "bloom";
      for (let i = 0; i < moteCount; i++) {
        if (venting) {
          let py = mAttr.getY(i) + 0.045;
          if (py > 2.3) py = -2.1;
          mAttr.setY(i, py);
        } else {
          const curY = mAttr.getY(i);
          const targetY = moteBaseY[i] + Math.sin(t * 1.1 + i) * 0.12;
          mAttr.setY(i, curY + (targetY - curY) * 0.04);
        }
      }
      mAttr.needsUpdate = true;
      motes.rotation.y = t * (venting ? 0.35 : 0.12);
      renderer.render(scene, camera);
    };

    tick();

    return () => {
      activeDisposed = true;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      bodyGeo.dispose();
      bodyMat.dispose();
      leftSeamGeo.dispose();
      bottomSeamGeo.dispose();
      sealStripGeo.dispose();
      holeGeo.dispose();
      holeMat.dispose();
      chromeMat.dispose();
      frontGeo.dispose();
      frontMat.dispose();
      frontTex.dispose();
      backGeo.dispose();
      backMat.dispose();
      backTex.dispose();
      zipperGeo.dispose();
      zipperMat.dispose();
      seamGlowGeo.dispose();
      seamGlowMat.dispose();
      sliderGeo.dispose();
      pullLoopGeo.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      sparkTex.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      envTex.dispose();
      renderer?.dispose();
    };
  }, [resolvedCover, resolvedTitle, labelCode]);

  const sizeCls =
    heightClass ||
    (compact ? "h-[240px] sm:h-[280px]" : "h-[280px] sm:h-[360px]");

  return (
    <div className={`relative w-full ${sizeCls} rounded-2xl overflow-hidden select-none`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-35 transition-colors duration-500"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${themeColor}55 0%, transparent 68%)`,
        }}
      />

      {fallbackMode ? (
        <div className="w-full h-full flex items-center justify-center p-6">
          <img
            src={resolvedCover}
            alt={labelCode || resolvedTitle}
            className="w-44 sm:w-52 h-auto rounded-xl object-contain animate-specimen-float drop-shadow-[0_24px_40px_rgba(0,0,0,0.85)]"
          />
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      )}

      <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-white/55">
        <span className="truncate max-w-[55%]">{labelCode || "DRAG 3D TO INSPECT"}</span>
        <span style={{ color: themeColor }}>VACUUM SEAL // 3D</span>
      </div>
    </div>
  );
}
