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
        antialias: !isMobile,
        powerPreference: "high-performance",
      });
    } catch {
      setFallbackMode(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

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
    camera.position.set(0, 0.08, 6.15);

    const pouchRoot = new THREE.Group();
    scene.add(pouchRoot);

    // 1. Metallic Titanium/Silver Vacuum Body (halfZ = 0.08 + bulge 0.08 => peak Z = +-0.16)
    const bodyGeo = new THREE.BoxGeometry(2.38, 3.12, 0.16, 18, 22, 2);
    const bodyPos = bodyGeo.attributes.position;
    for (let i = 0; i < bodyPos.count; i++) {
      const x = bodyPos.getX(i);
      const y = bodyPos.getY(i);
      const z = bodyPos.getZ(i);
      const nx = x / 1.19;
      const ny = y / 1.56;
      const bulge = Math.max(0, 1 - (nx * nx * 0.72 + ny * ny * 0.62));
      const crimp = Math.abs(nx) > 0.88 || Math.abs(ny) > 0.9 ? 0.35 : 1;
      bodyPos.setZ(i, z * crimp + Math.sign(z || 1) * bulge * 0.08);
    }
    bodyGeo.computeVertexNormals();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3b384c,
      metalness: 0.76,
      roughness: 0.24,
      envMapIntensity: 2.1,
    });
    const pouchBody = new THREE.Mesh(bodyGeo, bodyMat);
    pouchRoot.add(pouchBody);

    // 2. Chrome Perimeter Heat-Seal Trim Bars (Crisp metallic framing around silhouette)
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe6ebf8,
      metalness: 0.95,
      roughness: 0.14,
      envMapIntensity: 2.4,
    });

    const leftSeamGeo = new THREE.BoxGeometry(0.08, 3.12, 0.07);
    const leftSeam = new THREE.Mesh(leftSeamGeo, chromeMat);
    leftSeam.position.set(-1.17, 0, 0);
    pouchRoot.add(leftSeam);

    const rightSeam = new THREE.Mesh(leftSeamGeo, chromeMat);
    rightSeam.position.set(1.17, 0, 0);
    pouchRoot.add(rightSeam);

    const bottomSeamGeo = new THREE.BoxGeometry(2.42, 0.09, 0.075);
    const bottomSeam = new THREE.Mesh(bottomSeamGeo, chromeMat);
    bottomSeam.position.set(0, -1.53, 0);
    pouchRoot.add(bottomSeam);

    // 3. Curved Front & Back High-Res Artwork Planes (Always sit cleanly OUTSIDE body bulge!)
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
      const geo = new THREE.PlaneGeometry(2.08, 2.74, 16, 20);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const nx = x / 1.04;
        const ny = y / 1.37;
        const bulge = Math.max(0, 1 - (nx * nx * 0.72 + ny * ny * 0.62));
        pos.setZ(i, zOffset + bulgeSign * bulge * 0.082);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const frontGeo = createCurvedLabelGeo(0.116, 1);
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.22,
      metalness: 0.14,
      envMapIntensity: 1.4,
    });
    const frontPlane = new THREE.Mesh(frontGeo, frontMat);
    frontPlane.position.set(0, -0.05, 0);
    pouchRoot.add(frontPlane);

    const backGeo = createCurvedLabelGeo(0.116, 1);
    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.28,
      metalness: 0.28,
      envMapIntensity: 1.5,
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
    topStripGroup.position.set(0, 1.58, 0);
    pouchRoot.add(topStripGroup);

    const sealStripGeo = new THREE.BoxGeometry(2.42, 0.26, 0.085);
    const sealStripMesh = new THREE.Mesh(sealStripGeo, chromeMat);
    topStripGroup.add(sealStripMesh);

    const holeGeo = new THREE.BoxGeometry(0.42, 0.09, 0.1);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050408 });
    const hangSlot = new THREE.Mesh(holeGeo, holeMat);
    hangSlot.position.set(0, 0.02, 0);
    topStripGroup.add(hangSlot);

    // 5. Interlocking Neon-Chrome Zipper Rail + Protruding Metal Slider
    const accentColor = new THREE.Color(themeColor);
    const zipperGeo = new THREE.BoxGeometry(2.26, 0.06, 0.18);
    const zipperMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.65,
      metalness: 0.85,
      roughness: 0.18,
    });
    const zipperBar = new THREE.Mesh(zipperGeo, zipperMat);
    zipperBar.position.set(0, 1.38, 0);
    pouchRoot.add(zipperBar);

    const sliderGeo = new THREE.BoxGeometry(0.16, 0.13, 0.22);
    const sliderTab = new THREE.Mesh(sliderGeo, chromeMat);
    sliderTab.position.set(0.84, 1.38, 0.02);
    pouchRoot.add(sliderTab);

    // 6. Laboratory Orbital Pedestal Ring
    const haloGeo = new THREE.TorusGeometry(1.58, 0.022, 12, 96);
    const haloMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.65,
    });
    const haloRing = new THREE.Mesh(haloGeo, haloMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.set(0, -1.86, 0);
    scene.add(haloRing);

    // Subtle Star/Spark Dust
    const moteCount = isMobile ? 36 : 80;
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 4.6;
      motePos[i * 3 + 1] = (Math.random() - 0.5) * 4.4;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: accentColor,
      size: 0.038,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    // Full 3-Point Studio Lights + Hemisphere Fill
    const hemi = new THREE.HemisphereLight(0xf6f6ff, 0x1a122c, 1.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3.5, 4.5, 7);
    scene.add(keyLight);

    const rimA = new THREE.PointLight(accentColor, 12, 16);
    rimA.position.set(-3.4, 1.2, 3.8);
    scene.add(rimA);

    const rimB = new THREE.PointLight(0x00f0ff, 7, 14);
    rimB.position.set(3.6, -1.2, 3.2);
    scene.add(rimB);

    // Interactive Drag Controls
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let targetRotY = -0.26;
    let targetRotX = 0.04;
    let curRotY = -0.26;
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
      targetRotY += dx * 0.013;
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

    const tick = () => {
      if (activeDisposed || !renderer) return;
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden) return;

      const t = clock.getElapsedTime();
      const phase = phaseRef.current;

      const liveAccent = new THREE.Color(accentRef.current);
      zipperMat.color.lerp(liveAccent, 0.12);
      zipperMat.emissive.lerp(liveAccent, 0.12);
      haloMat.color.lerp(liveAccent, 0.12);
      rimA.color.lerp(liveAccent, 0.12);
      moteMat.color.lerp(liveAccent, 0.12);

      if (!isDragging && (phase === "idle" || phase === "revealed")) {
        targetRotY += 0.0042;
      }

      let targetCamZ = 6.15;
      let targetStripY = 1.58;
      let targetStripRotZ = 0;
      let targetStripOpacity = 1;
      let shakeX = 0;
      let shakeY = 0;

      if (phase === "charging") {
        targetCamZ = 5.4;
        shakeX = Math.sin(t * 48) * 0.03;
        shakeY = Math.cos(t * 54) * 0.025;
        zipperMat.emissiveIntensity = 1.4 + Math.sin(t * 16) * 0.6;
        targetRotY += 0.015;
      } else if (phase === "ripping") {
        targetCamZ = 4.95;
        targetStripY = 2.45;
        targetStripRotZ = 0.28;
        zipperMat.emissiveIntensity = 2.2;
        shakeX = Math.sin(t * 68) * 0.045;
        targetRotY += 0.028;
      } else if (phase === "bloom" || phase === "revealed") {
        targetCamZ = 5.45;
        targetStripY = 3.5;
        targetStripOpacity = 0;
        zipperMat.emissiveIntensity = 1.4;
      } else {
        zipperMat.emissiveIntensity = 0.65 + Math.sin(t * 2.2) * 0.2;
      }

      curRotY += (targetRotY - curRotY) * 0.1;
      curRotX += (targetRotX - curRotX) * 0.1;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;

      topStripGroup.position.y += (targetStripY - topStripGroup.position.y) * 0.14;
      topStripGroup.rotation.z += (targetStripRotZ - topStripGroup.rotation.z) * 0.14;
      topStripGroup.visible = targetStripOpacity > 0.05;

      pouchRoot.rotation.y = curRotY;
      pouchRoot.rotation.x = curRotX;
      pouchRoot.position.x = shakeX;
      pouchRoot.position.y = Math.sin(t * 1.6) * 0.075 + shakeY;

      haloRing.rotation.z = t * 0.45;
      haloRing.scale.setScalar(
        phase === "charging" || phase === "ripping" ? 1.08 + Math.sin(t * 12) * 0.06 : 1.0
      );

      motes.rotation.y = t * 0.12;
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
      sliderGeo.dispose();
      haloGeo.dispose();
      haloMat.dispose();
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
