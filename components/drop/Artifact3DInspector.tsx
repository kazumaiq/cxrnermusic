"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, ZoomIn, ZoomOut, Sparkles, Box, Layers, Sun } from "lucide-react";
import type { DropRarity } from "@/lib/ecosystemTypes";
import { playClickSound } from "@/lib/soundFX";

export interface Artifact3DInspectorProps {
  itemId: string;
  itemName: string;
  specimenCode?: string;
  rarity: DropRarity;
  imageUrl?: string;
  serialNumber?: number;
  collectionName?: string;
  themeColor?: string;
  heightClass?: string;
}

type InspectorSubMode = "sculpture" | "capsule";
type LightingPreset = "cyber" | "chrome" | "void";

function buildStudioEnvMap(
  renderer: THREE.WebGLRenderer,
  accentHex: string,
  preset: LightingPreset
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(
    preset === "chrome" ? 0x181824 : preset === "void" ? 0x080510 : 0x0e0b1a
  );

  const accent = new THREE.Color(accentHex);

  // Main overhead studio softbox
  const topBox = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 10),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(preset === "chrome" ? 3.4 : 2.8, 2.9, 3.2),
      side: THREE.DoubleSide,
    })
  );
  topBox.position.set(0, 8, 1);
  topBox.rotation.x = Math.PI / 2;
  envScene.add(topBox);

  // Angled upper-front key reflection strip (offset so it never washes out flat front faces)
  const frontStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 4.5),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.9, 2.0, 2.3),
      side: THREE.DoubleSide,
    })
  );
  frontStrip.position.set(3.5, 3.8, 7.5);
  frontStrip.lookAt(0, 0, 0);
  envScene.add(frontStrip);

  // Left accent neon panel
  const leftPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 14),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(preset === "void" ? 3.6 : 2.8),
      side: THREE.DoubleSide,
    })
  );
  leftPanel.position.set(-8, 0.5, 2);
  leftPanel.rotation.y = Math.PI / 2;
  envScene.add(leftPanel);

  // Right cyan/silver rim panel
  const rightPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 14),
    new THREE.MeshBasicMaterial({
      color:
        preset === "chrome"
          ? new THREE.Color(2.8, 2.9, 3.1)
          : new THREE.Color(0.6, 2.4, 2.9),
      side: THREE.DoubleSide,
    })
  );
  rightPanel.position.set(8, 0.5, 2);
  rightPanel.rotation.y = -Math.PI / 2;
  envScene.add(rightPanel);

  // Lower bounce floor ring
  const floorPanel = new THREE.Mesh(
    new THREE.RingGeometry(2, 9, 48),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(1.5),
      side: THREE.DoubleSide,
    })
  );
  floorPanel.position.set(0, -6, 0);
  floorPanel.rotation.x = Math.PI / 2;
  envScene.add(floorPanel);

  const rt = pmrem.fromScene(envScene, 0.03);
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

function createCdIridescentTexture(accentHex: string, code: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const cx = 512;
  const cy = 512;

  // Base metallic mirror silver
  const rad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 500);
  rad.addColorStop(0, "#0b0914");
  rad.addColorStop(0.18, "#cbd5e1");
  rad.addColorStop(0.24, "#f8fafc");
  rad.addColorStop(0.55, "#94a3b8");
  rad.addColorStop(0.85, "#e2e8f0");
  rad.addColorStop(1, "#475569");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Conic rainbow diffraction wedges
  const wedges = [
    { angle: 0.3, color: "rgba(0, 240, 255, 0.42)" },
    { angle: 0.65, color: "rgba(180, 107, 255, 0.45)" },
    { angle: 1.0, color: "rgba(244, 63, 94, 0.32)" },
    { angle: 1.9, color: "rgba(56, 189, 248, 0.38)" },
    { angle: 3.4, color: "rgba(0, 240, 255, 0.42)" },
    { angle: 3.8, color: "rgba(168, 85, 247, 0.45)" },
    { angle: 4.2, color: "rgba(250, 204, 21, 0.28)" },
  ];

  wedges.forEach((w) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(w.angle);
    const grad = ctx.createLinearGradient(0, -180, 0, 180);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, w.color);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 495, -0.32, 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // Micro optical data tracks
  for (let r = 155; r < 485; r += 3.5) {
    ctx.strokeStyle =
      r % 28 < 4 ? `${accentHex}55` : "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Inner clamping ring & serial telemetry
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 142, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`CXRNER // ${code || "CD-001"}`, cx, cy - 155);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createVinylTexture(accentHex: string, code: string, title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const cx = 512;
  const cy = 512;

  ctx.fillStyle = "#07050c";
  ctx.fillRect(0, 0, 1024, 1024);

  // Anisotropic vinyl sheen
  for (let r = 175; r < 495; r += 2.2) {
    const highlight = Math.sin(r * 0.15) * 0.5 + 0.5;
    ctx.strokeStyle =
      r % 42 < 3
        ? `${accentHex}66`
        : `rgba(200, 190, 230, ${0.04 + highlight * 0.08})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center vinyl label
  const labelGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 168);
  labelGrad.addColorStop(0, "#1e1035");
  labelGrad.addColorStop(0.7, accentHex);
  labelGrad.addColorStop(1, "#090514");
  ctx.fillStyle = labelGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 168, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 152, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CXRNER", cx, cy - 58);

  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#00F0FF";
  ctx.fillText(code || "VN-001", cx, cy + 78);

  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText((title || "GENESIS").slice(0, 18), cx, cy + 106);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildSculpturalArtifact(
  itemId: string,
  specimenCode: string,
  itemName: string,
  rarity: DropRarity,
  accentHex: string
): {
  group: THREE.Group;
  update: (t: number) => void;
  dispose: () => void;
} {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(obj: T): T => {
    disposables.push(obj);
    return obj;
  };

  const vibrantHex =
    rarity === "common" || accentHex.toLowerCase() === "#a1a1aa"
      ? "#00F0FF"
      : accentHex;
  const accentColor = new THREE.Color(vibrantHex);
  const idLower = `${itemId} ${specimenCode} ${itemName}`.toLowerCase();

  // Shared High-Grade PBR Materials
  const mirrorChromeMat = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xf1f5f9),
      metalness: 0.96,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      iridescence: 0.35,
      iridescenceIOR: 1.4,
      envMapIntensity: 2.6,
    })
  );

  const darkObsidianMat = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x161224),
      metalness: 0.85,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.2,
    })
  );

  const neonAccentMat = track(
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.4,
      metalness: 0.5,
      roughness: 0.2,
    })
  );

  let customUpdate: (t: number) => void = () => {};

  // =========================================================================
  // 1. CHROME DISC (CD-001) — Iridescent Optical Disc + Gothic Chrome Spikes
  // =========================================================================
  if (idLower.includes("disc") || idLower.includes("cd-001")) {
    const cdTex = track(createCdIridescentTexture(accentHex, specimenCode || "CD-001"));
    const discMat = track(
      new THREE.MeshPhysicalMaterial({
        map: cdTex,
        color: 0xffffff,
        metalness: 0.92,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        iridescence: 0.95,
        iridescenceIOR: 1.6,
        envMapIntensity: 2.8,
      })
    );

    // Outer optical platter with central hole simulated by layered rings
    const platterGeo = track(new THREE.CylinderGeometry(1.38, 1.38, 0.055, 72));
    const platter = new THREE.Mesh(platterGeo, discMat);
    platter.rotation.x = Math.PI / 2;
    root.add(platter);

    // Clear polycarbonate inner clamping hub
    const hubGeo = track(new THREE.TorusGeometry(0.32, 0.045, 20, 64));
    const glassMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        metalness: 0.15,
        roughness: 0.08,
        transparent: true,
        opacity: 0.72,
        clearcoat: 1.0,
      })
    );
    const hub = new THREE.Mesh(hubGeo, glassMat);
    hub.position.z = 0.01;
    root.add(hub);

    // Center spindle hole dark core + glowing cyan rim
    const holeGeo = track(new THREE.CylinderGeometry(0.22, 0.22, 0.065, 48));
    const holeMat = track(new THREE.MeshBasicMaterial({ color: 0x050408 }));
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.rotation.x = Math.PI / 2;
    root.add(holeMesh);

    const innerNeonGeo = track(new THREE.TorusGeometry(0.23, 0.016, 16, 64));
    const innerNeon = new THREE.Mesh(innerNeonGeo, neonAccentMat);
    innerNeon.position.z = 0.032;
    root.add(innerNeon);

    // Gothic Liquid-Chrome Spike Armor gripping the disc perimeter
    const spikeRingGroup = new THREE.Group();
    root.add(spikeRingGroup);

    const spikeCount = 10;
    const spikeGeo = track(new THREE.ConeGeometry(0.11, 0.62, 16));
    const clawGeo = track(new THREE.TorusGeometry(0.24, 0.038, 12, 32, Math.PI * 1.15));

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const holder = new THREE.Group();
      holder.rotation.z = angle;

      // Radial outward gothic spike
      const spike = new THREE.Mesh(spikeGeo, mirrorChromeMat);
      const lenScale = i % 2 === 0 ? 1.15 : 0.78;
      spike.scale.set(1, lenScale, 0.65);
      spike.position.set(0, 1.48 + (lenScale - 1) * 0.15, 0);
      holder.add(spike);

      // Curved gothic chrome claw gripping across the CD face
      const claw = new THREE.Mesh(clawGeo, mirrorChromeMat);
      claw.position.set(0, 1.18, 0.02);
      claw.rotation.z = Math.PI * 0.42;
      holder.add(claw);

      spikeRingGroup.add(holder);
    }

    // Outer orbital laser halo
    const orbitalGeo = track(new THREE.TorusGeometry(1.68, 0.014, 16, 96));
    const orbitalRing = new THREE.Mesh(orbitalGeo, neonAccentMat);
    root.add(orbitalRing);

    customUpdate = (t) => {
      orbitalRing.rotation.x = Math.sin(t * 1.4) * 0.35;
      orbitalRing.rotation.y = Math.cos(t * 1.1) * 0.35;
    };
  }
  // =========================================================================
  // 2. CYBER VINYL GENESIS (VN-001)
  // =========================================================================
  else if (idLower.includes("vinyl") || idLower.includes("vn-001")) {
    const vTex = track(createVinylTexture(accentHex, specimenCode || "VN-001", itemName));
    const vinylMat = track(
      new THREE.MeshPhysicalMaterial({
        map: vTex,
        color: 0xffffff,
        metalness: 0.65,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMapIntensity: 2.3,
      })
    );

    const lpGeo = track(new THREE.CylinderGeometry(1.48, 1.48, 0.05, 80));
    const lp = new THREE.Mesh(lpGeo, vinylMat);
    lp.rotation.x = Math.PI / 2;
    root.add(lp);

    // Glowing neon outer rim
    const rimGeo = track(new THREE.TorusGeometry(1.49, 0.026, 20, 96));
    const rim = new THREE.Mesh(rimGeo, neonAccentMat);
    root.add(rim);

    // Raised metallic center spindle stabilizer
    const spindleGeo = track(new THREE.CylinderGeometry(0.18, 0.24, 0.14, 32));
    const spindle = new THREE.Mesh(spindleGeo, mirrorChromeMat);
    spindle.rotation.x = Math.PI / 2;
    root.add(spindle);

    // Floating holographic soundwave rings in front & back
    const wave1Geo = track(new THREE.TorusGeometry(1.1, 0.012, 12, 80));
    const wave1 = new THREE.Mesh(wave1Geo, neonAccentMat);
    wave1.position.z = 0.14;
    root.add(wave1);

    const wave2 = new THREE.Mesh(wave1Geo, neonAccentMat);
    wave2.position.z = -0.14;
    root.add(wave2);

    customUpdate = (t) => {
      lp.rotation.y = t * 0.45;
      wave1.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
      wave2.scale.setScalar(1 + Math.cos(t * 3) * 0.04);
    };
  }
  // =========================================================================
  // 3. ARCHIVE CASSETTE (CA-037)
  // =========================================================================
  else if (idLower.includes("cassette") || idLower.includes("ca-037")) {
    // Main smoked-chrome cassette shell
    const shellGeo = track(new THREE.BoxGeometry(2.35, 1.48, 0.28));
    const shell = new THREE.Mesh(shellGeo, darkObsidianMat);
    root.add(shell);

    // Chrome perimeter frame trim
    const frameTopGeo = track(new THREE.BoxGeometry(2.4, 0.08, 0.31));
    const topBar = new THREE.Mesh(frameTopGeo, mirrorChromeMat);
    topBar.position.y = 0.72;
    root.add(topBar);

    // Bottom magnetic head trapezoid shield
    const headBlockGeo = track(new THREE.BoxGeometry(1.55, 0.26, 0.34));
    const headBlock = new THREE.Mesh(headBlockGeo, mirrorChromeMat);
    headBlock.position.set(0, -0.64, 0);
    root.add(headBlock);

    // Center transparent window
    const winGeo = track(new THREE.BoxGeometry(1.5, 0.56, 0.31));
    const winMat = track(
      new THREE.MeshPhysicalMaterial({
        color: accentColor,
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1.0,
      })
    );
    const winMesh = new THREE.Mesh(winGeo, winMat);
    winMesh.position.set(0, 0.05, 0);
    root.add(winMesh);

    // Two rotating tape reels with gear teeth
    const reelGeo = track(new THREE.CylinderGeometry(0.26, 0.26, 0.33, 24));
    const reelHubGeo = track(new THREE.TorusGeometry(0.16, 0.035, 12, 6));

    const leftReel = new THREE.Group();
    leftReel.position.set(-0.48, 0.05, 0);
    const lrCyl = new THREE.Mesh(reelGeo, mirrorChromeMat);
    lrCyl.rotation.x = Math.PI / 2;
    leftReel.add(lrCyl);
    const lrGear = new THREE.Mesh(reelHubGeo, neonAccentMat);
    lrGear.position.z = 0.17;
    leftReel.add(lrGear);
    root.add(leftReel);

    const rightReel = new THREE.Group();
    rightReel.position.set(0.48, 0.05, 0);
    const rrCyl = new THREE.Mesh(reelGeo, mirrorChromeMat);
    rrCyl.rotation.x = Math.PI / 2;
    rightReel.add(rrCyl);
    const rrGear = new THREE.Mesh(reelHubGeo, neonAccentMat);
    rrGear.position.z = 0.17;
    rightReel.add(rrGear);
    root.add(rightReel);

    // Neon top label stripe
    const stripeGeo = track(new THREE.BoxGeometry(2.05, 0.18, 0.3));
    const stripe = new THREE.Mesh(stripeGeo, neonAccentMat);
    stripe.position.set(0, 0.48, 0);
    root.add(stripe);

    customUpdate = (t) => {
      leftReel.rotation.z = -t * 1.8;
      rightReel.rotation.z = -t * 1.8;
    };
  }
  // =========================================================================
  // 4. CHROME SPIKE (CR-017)
  // =========================================================================
  else if (idLower.includes("spike") || idLower.includes("cr-017")) {
    const coreGeo = track(new THREE.IcosahedronGeometry(0.58, 2));
    const core = new THREE.Mesh(coreGeo, mirrorChromeMat);
    root.add(core);

    const longSpikeGeo = track(new THREE.ConeGeometry(0.16, 1.55, 24));
    const shortSpikeGeo = track(new THREE.ConeGeometry(0.11, 1.05, 18));

    // 14 radial directions in 3D
    const dirs = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(1, 1, 1).normalize(),
      new THREE.Vector3(-1, 1, 1).normalize(),
      new THREE.Vector3(1, -1, 1).normalize(),
      new THREE.Vector3(-1, -1, 1).normalize(),
      new THREE.Vector3(1, 1, -1).normalize(),
      new THREE.Vector3(-1, 1, -1).normalize(),
      new THREE.Vector3(1, -1, -1).normalize(),
      new THREE.Vector3(-1, -1, -1).normalize(),
    ];

    const up = new THREE.Vector3(0, 1, 0);
    dirs.forEach((d, idx) => {
      const isPrimary = idx < 6;
      const mesh = new THREE.Mesh(isPrimary ? longSpikeGeo : shortSpikeGeo, mirrorChromeMat);
      const dist = isPrimary ? 0.88 : 0.68;
      mesh.position.copy(d).multiplyScalar(dist);
      mesh.quaternion.setFromUnitVectors(up, d);
      root.add(mesh);
    });

    const ringGeo = track(new THREE.TorusGeometry(1.45, 0.02, 16, 96));
    const ring = new THREE.Mesh(ringGeo, neonAccentMat);
    root.add(ring);

    customUpdate = (t) => {
      ring.rotation.x = t * 0.9;
      ring.rotation.y = t * 0.6;
    };
  }
  // =========================================================================
  // 5. VIOLET VISOR (VG-005)
  // =========================================================================
  else if (idLower.includes("visor") || idLower.includes("vg-005")) {
    // Curved wrap-around visor shield
    const shieldGeo = track(
      new THREE.CylinderGeometry(1.25, 1.15, 0.72, 48, 1, true, -Math.PI * 0.42, Math.PI * 0.84)
    );
    const shieldMat = track(
      new THREE.MeshPhysicalMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.45,
        metalness: 0.35,
        roughness: 0.08,
        clearcoat: 1.0,
        iridescence: 0.85,
        side: THREE.DoubleSide,
      })
    );
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    root.add(shield);

    // Top & bottom sculpted titanium brow arches
    const browGeo = track(new THREE.TorusGeometry(1.24, 0.075, 16, 64, Math.PI * 0.86));
    const topBrow = new THREE.Mesh(browGeo, mirrorChromeMat);
    topBrow.rotation.x = Math.PI / 2;
    topBrow.rotation.z = -Math.PI * 0.43 + Math.PI / 2;
    topBrow.position.y = 0.37;
    root.add(topBrow);

    const botBrow = new THREE.Mesh(browGeo, mirrorChromeMat);
    botBrow.rotation.x = Math.PI / 2;
    botBrow.rotation.z = -Math.PI * 0.43 + Math.PI / 2;
    botBrow.position.y = -0.35;
    botBrow.scale.setScalar(0.93);
    root.add(botBrow);

    // Side acoustic temple pods
    const podGeo = track(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24));
    const leftPod = new THREE.Mesh(podGeo, mirrorChromeMat);
    leftPod.rotation.z = Math.PI / 2;
    leftPod.position.set(-1.18, 0, 0.25);
    root.add(leftPod);

    const rightPod = new THREE.Mesh(podGeo, mirrorChromeMat);
    rightPod.rotation.z = Math.PI / 2;
    rightPod.position.set(1.18, 0, 0.25);
    root.add(rightPod);

    // Glowing HUD scan bar across visor
    const hudGeo = track(new THREE.TorusGeometry(1.27, 0.015, 12, 64, Math.PI * 0.76));
    const hudLine = new THREE.Mesh(hudGeo, neonAccentMat);
    hudLine.rotation.x = Math.PI / 2;
    hudLine.rotation.z = -Math.PI * 0.38 + Math.PI / 2;
    root.add(hudLine);

    customUpdate = (t) => {
      hudLine.position.y = Math.sin(t * 2.4) * 0.22;
    };
  }
  // =========================================================================
  // 6. BLACK HEART (HR-009) — Spiked Biomechanical Sub-Bass Heart
  // =========================================================================
  else if (idLower.includes("heart") || idLower.includes("hr-009")) {
    const heartGroup = new THREE.Group();
    root.add(heartGroup);

    // Left & right anatomical ventricles sculpted from overlapping spheres + tapered apex
    const lobeGeo = track(new THREE.SphereGeometry(0.68, 36, 36));
    const leftLobe = new THREE.Mesh(lobeGeo, darkObsidianMat);
    leftLobe.position.set(-0.36, 0.28, 0);
    leftLobe.scale.set(0.95, 1.12, 0.88);
    heartGroup.add(leftLobe);

    const rightLobe = new THREE.Mesh(lobeGeo, darkObsidianMat);
    rightLobe.position.set(0.36, 0.22, 0.04);
    rightLobe.scale.set(0.9, 1.05, 0.85);
    heartGroup.add(rightLobe);

    const apexGeo = track(new THREE.ConeGeometry(0.86, 1.38, 36));
    const apex = new THREE.Mesh(apexGeo, darkObsidianMat);
    apex.rotation.z = Math.PI;
    apex.position.set(0, -0.46, 0);
    apex.scale.set(1, 1, 0.78);
    heartGroup.add(apex);

    // Chrome arterial vessels at top
    const aortaGeo = track(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 24));
    const aorta1 = new THREE.Mesh(aortaGeo, mirrorChromeMat);
    aorta1.position.set(-0.22, 0.92, 0);
    aorta1.rotation.z = 0.24;
    heartGroup.add(aorta1);

    const aorta2 = new THREE.Mesh(aortaGeo, mirrorChromeMat);
    aorta2.position.set(0.24, 0.88, 0.05);
    aorta2.rotation.z = -0.32;
    heartGroup.add(aorta2);

    // Chrome exoskeletal ribs & spikes around the heart
    const ribGeo = track(new THREE.TorusGeometry(0.88, 0.045, 16, 48));
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(ribGeo, mirrorChromeMat);
      rib.position.y = 0.25 - i * 0.28;
      rib.scale.setScalar(1 - i * 0.16);
      rib.rotation.x = Math.PI / 2 + 0.2;
      heartGroup.add(rib);
    }

    const thornGeo = track(new THREE.ConeGeometry(0.08, 0.48, 14));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const thorn = new THREE.Mesh(thornGeo, mirrorChromeMat);
      thorn.position.set(Math.cos(a) * 0.88, Math.sin(a) * 0.45, 0.35);
      thorn.rotation.z = a - Math.PI / 2;
      heartGroup.add(thorn);
    }

    // Sub-bass pulsing core ring
    const pulseGeo = track(new THREE.TorusGeometry(1.38, 0.02, 16, 80));
    const pulseRing = new THREE.Mesh(pulseGeo, neonAccentMat);
    root.add(pulseRing);

    customUpdate = (t) => {
      // Rhythmic double heartbeat thump
      const beat = Math.pow(Math.max(0, Math.sin(t * 3.6)), 6) * 0.075;
      heartGroup.scale.setScalar(1 + beat);
      pulseRing.scale.setScalar(1 + beat * 1.4);
    };
  }
  // =========================================================================
  // 7. WATCHER EYE (EY-004) — Biomechanical All-Seeing Eye in Chrome Spike Halo
  // =========================================================================
  else if (idLower.includes("eye") || idLower.includes("ey-004")) {
    const eyeGroup = new THREE.Group();
    root.add(eyeGroup);

    // Sclera chrome-obsidian orb
    const orbGeo = track(new THREE.SphereGeometry(0.78, 48, 48));
    const orb = new THREE.Mesh(orbGeo, mirrorChromeMat);
    eyeGroup.add(orb);

    // Glowing golden/cyber iris ring on front
    const irisGeo = track(new THREE.TorusGeometry(0.34, 0.09, 24, 64));
    const iris = new THREE.Mesh(irisGeo, neonAccentMat);
    iris.position.z = 0.7;
    eyeGroup.add(iris);

    // Deep void pupil core
    const pupilGeo = track(new THREE.SphereGeometry(0.25, 32, 32));
    const pupil = new THREE.Mesh(pupilGeo, darkObsidianMat);
    pupil.position.z = 0.62;
    eyeGroup.add(pupil);

    // Outer gyroscope halo with 12 sharp golden/chrome spikes
    const haloGroup = new THREE.Group();
    root.add(haloGroup);

    const outerRingGeo = track(new THREE.TorusGeometry(1.22, 0.06, 20, 72));
    const outerRing = new THREE.Mesh(outerRingGeo, mirrorChromeMat);
    haloGroup.add(outerRing);

    const rayGeo = track(new THREE.ConeGeometry(0.095, 0.56, 16));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const ray = new THREE.Mesh(rayGeo, i % 2 === 0 ? mirrorChromeMat : neonAccentMat);
      ray.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0);
      ray.rotation.z = a - Math.PI / 2;
      haloGroup.add(ray);
    }

    customUpdate = (t) => {
      eyeGroup.rotation.y = Math.sin(t * 1.5) * 0.28;
      eyeGroup.rotation.x = Math.cos(t * 1.1) * 0.16;
      haloGroup.rotation.z = t * 0.35;
    };
  }
  // =========================================================================
  // 8. VOID CROWN (CR-003) — Gothic Liquid-Chrome Crown
  // =========================================================================
  else if (idLower.includes("crown") || idLower.includes("cr-003")) {
    // Base royal circlet band
    const bandGeo = track(new THREE.CylinderGeometry(1.18, 1.05, 0.42, 48, 1, true));
    const bandMat = mirrorChromeMat.clone();
    bandMat.side = THREE.DoubleSide;
    track(bandMat);
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = -0.32;
    root.add(band);

    const lowerRimGeo = track(new THREE.TorusGeometry(1.06, 0.065, 20, 64));
    const lowerRim = new THREE.Mesh(lowerRimGeo, mirrorChromeMat);
    lowerRim.rotation.x = Math.PI / 2;
    lowerRim.position.y = -0.52;
    root.add(lowerRim);

    const upperRimGeo = track(new THREE.TorusGeometry(1.16, 0.055, 20, 64));
    const upperRim = new THREE.Mesh(upperRimGeo, neonAccentMat);
    upperRim.rotation.x = Math.PI / 2;
    upperRim.position.y = -0.12;
    root.add(upperRim);

    // 8 tall gothic crown spires alternating height
    const spireCount = 8;
    const tallSpireGeo = track(new THREE.ConeGeometry(0.16, 1.32, 16));
    const shortSpireGeo = track(new THREE.ConeGeometry(0.12, 0.85, 16));

    for (let i = 0; i < spireCount; i++) {
      const a = (i / spireCount) * Math.PI * 2;
      const isTall = i % 2 === 0;
      const spire = new THREE.Mesh(isTall ? tallSpireGeo : shortSpireGeo, mirrorChromeMat);
      const radius = 1.14;
      spire.position.set(
        Math.cos(a) * radius,
        isTall ? 0.52 : 0.28,
        Math.sin(a) * radius
      );
      // Slight outward regal flare
      spire.rotation.z = -Math.cos(a) * 0.14;
      spire.rotation.x = Math.sin(a) * 0.14;
      root.add(spire);
    }

    // Levitating diamond core inside the crown
    const gemGeo = track(new THREE.OctahedronGeometry(0.36, 0));
    const gem = new THREE.Mesh(gemGeo, neonAccentMat);
    gem.position.y = 0.25;
    root.add(gem);

    customUpdate = (t) => {
      gem.rotation.y = t * 1.6;
      gem.position.y = 0.25 + Math.sin(t * 2.5) * 0.1;
    };
  }
  // =========================================================================
  // 9. FANG ARTIFACTS: CHROME FANG BLACK / WHITE FANG / CHROMATIC FANG (GLITCH-01)
  // =========================================================================
  else if (idLower.includes("fang") || idLower.includes("glitch") || idLower.includes("c1/s")) {
    const isWhite = idLower.includes("white") || idLower.includes("c1/s-w");
    const isGlitch = idLower.includes("chromatic") || idLower.includes("glitch");

    const jawMat = track(
      new THREE.MeshPhysicalMaterial({
        color: isWhite
          ? new THREE.Color(0xf8fafc)
          : isGlitch
          ? new THREE.Color(0xe2e8f0)
          : new THREE.Color(0x1e1b2e),
        metalness: isWhite ? 0.35 : 0.94,
        roughness: isWhite ? 0.22 : 0.09,
        clearcoat: 1.0,
        iridescence: isGlitch ? 1.0 : 0.4,
        iridescenceIOR: isGlitch ? 1.8 : 1.4,
        envMapIntensity: 2.8,
      })
    );

    const upperJaw = new THREE.Group();
    const lowerJaw = new THREE.Group();
    root.add(upperJaw);
    root.add(lowerJaw);

    // Sculpted mandible arch
    const archGeo = track(new THREE.TorusGeometry(1.05, 0.19, 24, 48, Math.PI));
    const upArch = new THREE.Mesh(archGeo, jawMat);
    upArch.rotation.x = Math.PI * 0.35;
    upArch.position.y = 0.28;
    upperJaw.add(upArch);

    const lowArch = new THREE.Mesh(archGeo, jawMat);
    lowArch.rotation.x = -Math.PI * 0.35;
    lowArch.rotation.z = Math.PI;
    lowArch.position.y = -0.28;
    lowerJaw.add(lowArch);

    // Predator canines & incisors
    const canineGeo = track(new THREE.ConeGeometry(0.14, 0.82, 20));
    const toothGeo = track(new THREE.ConeGeometry(0.095, 0.48, 16));

    const angles = [-0.78, -0.48, -0.2, 0.2, 0.48, 0.78];
    angles.forEach((ang, idx) => {
      const isCanine = idx === 1 || idx === 4;
      const tUp = new THREE.Mesh(isCanine ? canineGeo : toothGeo, mirrorChromeMat);
      tUp.position.set(
        Math.sin(ang) * 1.02,
        isCanine ? -0.12 : 0.02,
        Math.cos(ang) * 0.86
      );
      tUp.rotation.x = Math.PI;
      upperJaw.add(tUp);

      const tLow = new THREE.Mesh(isCanine ? canineGeo : toothGeo, mirrorChromeMat);
      tLow.position.set(
        Math.sin(ang) * 0.96,
        isCanine ? 0.08 : -0.04,
        Math.cos(ang) * 0.82
      );
      lowerJaw.add(tLow);
    });

    // Energy core between jaws
    const coreOrbGeo = track(new THREE.OctahedronGeometry(0.32, 1));
    const coreOrb = new THREE.Mesh(coreOrbGeo, neonAccentMat);
    coreOrb.position.set(0, 0, 0.35);
    root.add(coreOrb);

    customUpdate = (t) => {
      const bite = Math.sin(t * 2.2) * 0.08;
      upperJaw.rotation.x = -bite;
      lowerJaw.rotation.x = bite;
      coreOrb.rotation.y = t * 2;
      coreOrb.rotation.z = t * 1.3;
    };
  }
  // =========================================================================
  // 10. CXRNER COVER VOUCHER (CV-2026) — 24K Gold & Obsidian Master Slab
  // =========================================================================
  else if (idLower.includes("voucher") || idLower.includes("cv-2026") || rarity === "special_reward") {
    const goldMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xfacc15),
        metalness: 0.96,
        roughness: 0.1,
        clearcoat: 1.0,
        envMapIntensity: 2.8,
      })
    );

    const slabGeo = track(new THREE.BoxGeometry(1.9, 2.55, 0.18));
    const slab = new THREE.Mesh(slabGeo, goldMat);
    root.add(slab);

    const innerPlateGeo = track(new THREE.BoxGeometry(1.62, 2.25, 0.21));
    const innerPlate = new THREE.Mesh(innerPlateGeo, darkObsidianMat);
    root.add(innerPlate);

    const starGeo = track(new THREE.OctahedronGeometry(0.48, 0));
    const star = new THREE.Mesh(starGeo, goldMat);
    star.position.z = 0.18;
    root.add(star);

    const haloGeo = track(new THREE.TorusGeometry(0.72, 0.03, 16, 64));
    const halo = new THREE.Mesh(haloGeo, neonAccentMat);
    halo.position.z = 0.15;
    root.add(halo);

    customUpdate = (t) => {
      star.rotation.y = t * 1.5;
      halo.rotation.z = -t * 1.2;
    };
  }
  // =========================================================================
  // 11. DATA KEY (DK-003) — Machined Cryptographic Cyber-Key & Neural Blade
  // =========================================================================
  else if (idLower.includes("data_key") || idLower.includes("data key") || idLower.includes("dk-003")) {
    const keyGroup = new THREE.Group();
    keyGroup.rotation.z = -Math.PI / 6; // Dynamic 30-degree diagonal presentation
    root.add(keyGroup);

    // Upper Armored Hexagonal Key Bow (Grip Ring)
    const bowOuterGeo = track(new THREE.TorusGeometry(0.68, 0.14, 20, 6));
    const bowOuter = new THREE.Mesh(bowOuterGeo, mirrorChromeMat);
    bowOuter.position.y = 0.92;
    bowOuter.rotation.z = Math.PI / 6;
    keyGroup.add(bowOuter);

    const bowInnerGeo = track(new THREE.CylinderGeometry(0.52, 0.52, 0.16, 6));
    const bowInner = new THREE.Mesh(bowInnerGeo, darkObsidianMat);
    bowInner.rotation.x = Math.PI / 2;
    bowInner.position.y = 0.92;
    keyGroup.add(bowInner);

    // Spinning encrypted holographic core inside the key bow
    const coreCrystalGeo = track(new THREE.OctahedronGeometry(0.26, 0));
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, neonAccentMat);
    coreCrystal.position.set(0, 0.92, 0);
    keyGroup.add(coreCrystal);

    // Collar junction between bow and blade
    const collarGeo = track(new THREE.CylinderGeometry(0.28, 0.22, 0.28, 24));
    const collar = new THREE.Mesh(collarGeo, mirrorChromeMat);
    collar.position.y = 0.22;
    keyGroup.add(collar);

    // Main Milled Key Blade Shaft
    const shaftGeo = track(new THREE.BoxGeometry(0.26, 1.75, 0.14));
    const shaft = new THREE.Mesh(shaftGeo, mirrorChromeMat);
    shaft.position.y = -0.68;
    keyGroup.add(shaft);

    // Dark obsidian recessed data channel along the shaft
    const grooveGeo = track(new THREE.BoxGeometry(0.1, 1.55, 0.16));
    const groove = new THREE.Mesh(grooveGeo, darkObsidianMat);
    groove.position.y = -0.68;
    keyGroup.add(groove);

    // Glowing neon data-bus trace inside the shaft
    const busGeo = track(new THREE.BoxGeometry(0.04, 1.45, 0.175));
    const bus = new THREE.Mesh(busGeo, neonAccentMat);
    bus.position.y = -0.68;
    keyGroup.add(bus);

    // Precision Laser-Cut Bit Teeth on the Key Blade
    const teethSpecs = [
      { y: -0.52, w: 0.34, h: 0.14 },
      { y: -0.78, w: 0.48, h: 0.18 },
      { y: -1.06, w: 0.28, h: 0.14 },
      { y: -1.32, w: 0.52, h: 0.2 },
    ];
    teethSpecs.forEach((t, idx) => {
      const toothGeo = track(new THREE.BoxGeometry(t.w, t.h, 0.13));
      const tooth = new THREE.Mesh(toothGeo, mirrorChromeMat);
      tooth.position.set(0.13 + t.w / 2 - 0.04, t.y, 0);
      keyGroup.add(tooth);

      const tipGeo = track(new THREE.BoxGeometry(0.08, t.h * 0.6, 0.15));
      const tip = new THREE.Mesh(tipGeo, idx % 2 === 0 ? neonAccentMat : darkObsidianMat);
      tip.position.set(0.13 + t.w - 0.06, t.y, 0);
      keyGroup.add(tip);
    });

    // Dual Orbiting Security Halo Rings around the shaft
    const ringGeo = track(new THREE.TorusGeometry(0.62, 0.022, 16, 64));
    const ring1 = new THREE.Mesh(ringGeo, neonAccentMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = -0.55;
    keyGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, mirrorChromeMat);
    ring2.rotation.x = Math.PI / 2.3;
    ring2.position.y = -0.95;
    keyGroup.add(ring2);

    customUpdate = (t) => {
      coreCrystal.rotation.y = t * 2.4;
      coreCrystal.rotation.z = t * 1.6;
      ring1.rotation.z = t * 1.8;
      ring2.rotation.z = -t * 1.4;
    };
  }
  // =========================================================================
  // 12. ARCHIVE PASS (AP-002) — Armored Titanium & Obsidian VIP Security Badge
  // =========================================================================
  else if (idLower.includes("archive_pass") || idLower.includes("archive pass") || idLower.includes("ap-002")) {
    // Outer beveled chrome frame
    const frameGeo = track(new THREE.BoxGeometry(1.78, 2.52, 0.14));
    const frame = new THREE.Mesh(frameGeo, mirrorChromeMat);
    root.add(frame);

    // Recessed dark obsidian carbon face
    const plateGeo = track(new THREE.BoxGeometry(1.56, 2.28, 0.165));
    const plate = new THREE.Mesh(plateGeo, darkObsidianMat);
    root.add(plate);

    // Top metallic lanyard clasp shackle
    const shackleGeo = track(new THREE.TorusGeometry(0.24, 0.05, 16, 48));
    const shackle = new THREE.Mesh(shackleGeo, mirrorChromeMat);
    shackle.position.set(0, 1.38, 0);
    root.add(shackle);

    // Raised gold/neon cryptographic smart-chip
    const chipGeo = track(new THREE.BoxGeometry(0.42, 0.34, 0.19));
    const chip = new THREE.Mesh(chipGeo, neonAccentMat);
    chip.position.set(-0.42, 0.35, 0);
    root.add(chip);

    // Center holographic CXRNER hexagon crest
    const crestGeo = track(new THREE.CylinderGeometry(0.46, 0.46, 0.19, 6));
    const crest = new THREE.Mesh(crestGeo, mirrorChromeMat);
    crest.rotation.x = Math.PI / 2;
    crest.position.set(0.18, -0.15, 0);
    root.add(crest);

    // Scanning laser strip across badge
    const laserGeo = track(new THREE.BoxGeometry(1.48, 0.045, 0.2));
    const laser = new THREE.Mesh(laserGeo, neonAccentMat);
    root.add(laser);

    customUpdate = (t) => {
      laser.position.y = Math.sin(t * 2.2) * 0.92;
      crest.rotation.z = t * 0.8;
    };
  }
  // =========================================================================
  // 13. CHROME TAG (CT-012) — Twin Mirror-Chrome Military Dog-Tags
  // =========================================================================
  else if (idLower.includes("chrome_tag") || idLower.includes("chrome tag") || idLower.includes("ct-012")) {
    const buildDogTag = () => {
      const g = new THREE.Group();
      const rimGeo = track(new THREE.BoxGeometry(1.28, 2.05, 0.1));
      const rim = new THREE.Mesh(rimGeo, darkObsidianMat);
      g.add(rim);

      const metalGeo = track(new THREE.BoxGeometry(1.14, 1.9, 0.12));
      const metal = new THREE.Mesh(metalGeo, mirrorChromeMat);
      g.add(metal);

      const stripeGeo = track(new THREE.BoxGeometry(0.88, 0.12, 0.14));
      const stripe = new THREE.Mesh(stripeGeo, neonAccentMat);
      stripe.position.y = 0.28;
      g.add(stripe);

      const barGeo = track(new THREE.BoxGeometry(0.88, 0.06, 0.135));
      const bar = new THREE.Mesh(barGeo, darkObsidianMat);
      bar.position.y = -0.25;
      g.add(bar);
      return g;
    };

    const tagFront = buildDogTag();
    tagFront.position.set(-0.22, -0.08, 0.18);
    tagFront.rotation.z = 0.12;
    tagFront.rotation.y = 0.18;
    root.add(tagFront);

    const tagBack = buildDogTag();
    tagBack.position.set(0.28, 0.06, -0.16);
    tagBack.rotation.z = -0.16;
    tagBack.rotation.y = -0.22;
    root.add(tagBack);

    // Upper chrome ball-chain loop
    const chainLoopGeo = track(new THREE.TorusGeometry(0.65, 0.045, 16, 48));
    const chainLoop = new THREE.Mesh(chainLoopGeo, mirrorChromeMat);
    chainLoop.position.set(0, 1.05, 0);
    chainLoop.rotation.x = 0.35;
    root.add(chainLoop);

    customUpdate = (t) => {
      tagFront.position.y = -0.08 + Math.sin(t * 2) * 0.05;
      tagBack.position.y = 0.06 - Math.sin(t * 2) * 0.05;
    };
  }
  // =========================================================================
  // 14. BASIC SPECIMEN (BS-001) & DEFAULT — Cryo-Containment Ferrofluid Reactor
  // =========================================================================
  else {
    // Smoked dark-violet containment cylinder
    const capsuleGeo = track(new THREE.CylinderGeometry(0.72, 0.72, 1.95, 40));
    const glassMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x140d26),
        metalness: 0.2,
        roughness: 0.06,
        transparent: true,
        opacity: 0.42,
        clearcoat: 1.0,
      })
    );
    const capsule = new THREE.Mesh(capsuleGeo, glassMat);
    root.add(capsule);

    // Heavy Machined Chrome End-Caps + Neon Seal Gaskets
    const capGeo = track(new THREE.CylinderGeometry(0.84, 0.84, 0.24, 36));
    const gasketGeo = track(new THREE.TorusGeometry(0.76, 0.035, 16, 64));

    const topCap = new THREE.Mesh(capGeo, mirrorChromeMat);
    topCap.position.y = 1.02;
    root.add(topCap);

    const topGasket = new THREE.Mesh(gasketGeo, neonAccentMat);
    topGasket.rotation.x = Math.PI / 2;
    topGasket.position.y = 0.88;
    root.add(topGasket);

    const botCap = new THREE.Mesh(capGeo, mirrorChromeMat);
    botCap.position.y = -1.02;
    root.add(botCap);

    const botGasket = new THREE.Mesh(gasketGeo, neonAccentMat);
    botGasket.rotation.x = Math.PI / 2;
    botGasket.position.y = -0.88;
    root.add(botGasket);

    // 4 Exterior Titanium Guard Rods around the chamber
    const rodGeo = track(new THREE.CylinderGeometry(0.045, 0.045, 2.05, 16));
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const rod = new THREE.Mesh(rodGeo, mirrorChromeMat);
      rod.position.set(Math.cos(a) * 0.78, 0, Math.sin(a) * 0.78);
      root.add(rod);
    }

    // Inner Levitating Ferrofluid Chrome Cluster + Glowing Core
    const ferroGroup = new THREE.Group();
    root.add(ferroGroup);

    const coreGeo = track(new THREE.IcosahedronGeometry(0.42, 1));
    const coreMesh = new THREE.Mesh(coreGeo, mirrorChromeMat);
    ferroGroup.add(coreMesh);

    const innerGlowGeo = track(new THREE.OctahedronGeometry(0.5, 0));
    const innerGlow = new THREE.Mesh(innerGlowGeo, neonAccentMat);
    ferroGroup.add(innerGlow);

    // Dual Orbiting Plasma Rings
    const ringGeo = track(new THREE.TorusGeometry(1.08, 0.032, 16, 72));
    const ring1 = new THREE.Mesh(ringGeo, mirrorChromeMat);
    ring1.rotation.x = Math.PI / 3;
    root.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, neonAccentMat);
    ring2.rotation.x = -Math.PI / 3;
    root.add(ring2);

    customUpdate = (t) => {
      ferroGroup.rotation.y = t * 1.8;
      ferroGroup.rotation.x = Math.sin(t * 1.4) * 0.4;
      ferroGroup.position.y = Math.sin(t * 2.4) * 0.14;
      ring1.rotation.y = t * 1.1;
      ring2.rotation.z = t * 1.3;
    };
  }

  return {
    group: root,
    update: customUpdate,
    dispose: () => {
      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch {}
      });
    },
  };
}

function drawFullBleedCapsuleTexture(
  canvas: HTMLCanvasElement,
  accentHex: string,
  code: string,
  title: string,
  loadedImg?: HTMLImageElement | null
) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Deep metallic foil base
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#141122");
  bg.addColorStop(0.5, "#090710");
  bg.addColorStop(1, "#181429");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (loadedImg && loadedImg.naturalWidth > 0) {
    // Cover-fill the square/rectangular window cleanly with zero awkward purple bars!
    const scale = Math.max(w / loadedImg.naturalWidth, h / loadedImg.naturalHeight);
    const drawW = loadedImg.naturalWidth * scale;
    const drawH = loadedImg.naturalHeight * scale;
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;
    ctx.drawImage(loadedImg, dx, dy, drawW, drawH);
  } else {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 160, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText((title || "SPECIMEN").slice(0, 18), w / 2, h / 2);
  }

  // Subtle holographic foil specular sweep across the entire capsule
  const sheen = ctx.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.46, "rgba(255,255,255,0.06)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.18)");
  sheen.addColorStop(0.54, "rgba(0,240,255,0.08)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Precision metallic border frame
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);
}

export default function Artifact3DInspector({
  itemId,
  itemName,
  specimenCode,
  rarity,
  imageUrl,
  serialNumber,
  collectionName,
  themeColor = "#00F0FF",
  heightClass = "h-[310px] sm:h-[380px]",
}: Artifact3DInspectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [subMode, setSubMode] = useState<InspectorSubMode>("sculpture");
  const [lightPreset, setLightPreset] = useState<LightingPreset>("cyber");
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const zoomRef = useRef(1);
  const autoRotateRef = useRef(true);
  const resetTriggerRef = useRef(0);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const width = Math.max(240, host.clientWidth || 360);
    const height = Math.max(260, host.clientHeight || 340);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.85 : 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lightPreset === "chrome" ? 1.48 : 1.32;

    host.innerHTML = "";
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    const envTex = buildStudioEnvMap(renderer, themeColor, lightPreset);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.12, 5.8);

    const accentColor = new THREE.Color(themeColor);
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Build either the Bespoke 3D Sculptural Artifact OR the Seamless Curved Vacuum Capsule
    let activeArtifact: {
      group: THREE.Group;
      update: (t: number) => void;
      dispose: () => void;
    } | null = null;

    const capsuleDisposables: Array<{ dispose: () => void }> = [];

    if (subMode === "sculpture") {
      activeArtifact = buildSculpturalArtifact(
        itemId,
        specimenCode || "",
        itemName,
        rarity,
        themeColor
      );
      stageGroup.add(activeArtifact.group);
    } else {
      // Seamless Square-Proportioned Vacuum Foil Capsule (matches 1:1 specimen artwork without purple margins!)
      const capsuleGroup = new THREE.Group();
      stageGroup.add(capsuleGroup);

      const frontCanvas = document.createElement("canvas");
      frontCanvas.width = 768;
      frontCanvas.height = 768;
      drawFullBleedCapsuleTexture(
        frontCanvas,
        themeColor,
        specimenCode || "SPEC-01",
        itemName,
        null
      );
      const frontTex = new THREE.CanvasTexture(frontCanvas);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.anisotropy = 4;
      capsuleDisposables.push(frontTex);

      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          drawFullBleedCapsuleTexture(
            frontCanvas,
            themeColor,
            specimenCode || "SPEC-01",
            itemName,
            img
          );
          frontTex.needsUpdate = true;
        };
        img.src = imageUrl;
      }

      // Smooth pillow-bulged square Mylar foil cushion
      const cushionGeo = new THREE.BoxGeometry(2.55, 2.55, 0.22, 28, 28, 4);
      const pos = cushionGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const nx = x / 1.275;
        const ny = y / 1.275;
        const distSq = nx * nx + ny * ny;
        const pillow = Math.max(0, 1 - distSq * 0.65);
        const edgeCrimp = Math.abs(nx) > 0.9 || Math.abs(ny) > 0.9 ? 0.25 : 1.0;
        pos.setZ(i, z * edgeCrimp + Math.sign(z || 1) * pillow * 0.14);
      }
      cushionGeo.computeVertexNormals();
      capsuleDisposables.push(cushionGeo);

      const sideChromeMat = new THREE.MeshPhysicalMaterial({
        color: 0x161224,
        metalness: 0.92,
        roughness: 0.14,
        clearcoat: 1.0,
        iridescence: 0.45,
        envMapIntensity: 2.1,
      });
      const faceMat = new THREE.MeshPhysicalMaterial({
        map: frontTex,
        color: 0xffffff,
        metalness: 0.08,
        roughness: 0.24,
        clearcoat: 0.65,
        clearcoatRoughness: 0.12,
        iridescence: 0.22,
        envMapIntensity: 0.72,
      });
      capsuleDisposables.push(sideChromeMat, faceMat);

      const cushionMesh = new THREE.Mesh(cushionGeo, [
        sideChromeMat,
        sideChromeMat,
        sideChromeMat,
        sideChromeMat,
        faceMat,
        faceMat,
      ]);
      capsuleGroup.add(cushionMesh);

      // Top Chrome Heat-Seal Header Strip + Hang Hole + Neon Zipper Rail on Capsule
      const headerGeo = new THREE.BoxGeometry(2.58, 0.26, 0.12);
      const headerMat = new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.96,
        roughness: 0.09,
        clearcoat: 1.0,
        envMapIntensity: 2.5,
      });
      const headerMesh = new THREE.Mesh(headerGeo, headerMat);
      headerMesh.position.set(0, 1.38, 0);
      capsuleGroup.add(headerMesh);

      const zipRailGeo = new THREE.BoxGeometry(2.52, 0.045, 0.16);
      const zipRailMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.4,
      });
      const zipRail = new THREE.Mesh(zipRailGeo, zipRailMat);
      zipRail.position.set(0, 1.22, 0);
      capsuleGroup.add(zipRail);
      capsuleDisposables.push(headerGeo, headerMat, zipRailGeo, zipRailMat);
    }

    // Holographic Cryo-Levitation Pedestal Below Object (Positioned at y = -1.95 so it NEVER clips!)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.85, 0);
    scene.add(pedestalGroup);

    const outerRingGeo = new THREE.TorusGeometry(1.45, 0.018, 16, 96);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.65,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    pedestalGroup.add(outerRing);

    const innerRingGeo = new THREE.TorusGeometry(0.95, 0.012, 12, 72);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    pedestalGroup.add(innerRing);

    // Floating holographic dust particles
    const pCount = isMobile ? 45 : 80;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 4.5;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 3.8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: accentColor,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Studio 3-Point Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x151026, 1.8);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight1 = new THREE.PointLight(accentColor, 14, 16);
    rimLight1.position.set(-3.8, 1.8, 3.5);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(
      lightPreset === "chrome" ? 0xffffff : 0x00f0ff,
      10,
      16
    );
    rimLight2.position.set(3.8, -1.5, 3.5);
    scene.add(rimLight2);

    // Interactive 360° Drag + Wheel Zoom
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let targetRotY = -0.3;
    let targetRotX = 0.12;
    let curRotY = -0.3;
    let curRotX = 0.12;
    let lastResetCount = resetTriggerRef.current;

    const domEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      targetRotY += dx * 0.014;
      targetRotX = Math.max(-1.05, Math.min(1.05, targetRotX + dy * 0.011));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.max(0.75, Math.min(1.65, zoomRef.current - e.deltaY * 0.001));
      zoomRef.current = next;
      setZoomLevel(Number(next.toFixed(2)));
    };

    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    domEl.addEventListener("wheel", onWheel, { passive: false });

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
    let disposed = false;

    const animate = () => {
      if (disposed || !renderer) return;
      rafId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (resetTriggerRef.current !== lastResetCount) {
        lastResetCount = resetTriggerRef.current;
        targetRotY = -0.3;
        targetRotX = 0.12;
      }

      if (!isDragging && autoRotateRef.current) {
        targetRotY += 0.0075;
      }

      curRotY += (targetRotY - curRotY) * 0.12;
      curRotX += (targetRotX - curRotX) * 0.12;

      stageGroup.rotation.y = curRotY;
      stageGroup.rotation.x = curRotX;
      stageGroup.position.y = Math.sin(t * 1.8) * 0.08;

      const targetCamZ = 5.8 / zoomRef.current;
      camera.position.z += (targetCamZ - camera.position.z) * 0.12;

      activeArtifact?.update(t);

      outerRing.rotation.z = t * 0.4;
      innerRing.rotation.z = -t * 0.65;
      particles.rotation.y = t * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      domEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domEl.removeEventListener("wheel", onWheel);

      activeArtifact?.dispose();
      capsuleDisposables.forEach((d) => d.dispose());
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      envTex.dispose();
      renderer?.dispose();
    };
  }, [itemId, itemName, specimenCode, rarity, imageUrl, themeColor, subMode, lightPreset]);

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl border border-white/15 bg-gradient-to-b from-[#0B0816] via-[#05040A] to-[#030206] overflow-hidden select-none shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]`}
    >
      {/* Ambient Rarity Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${themeColor}55 0%, transparent 68%)`,
        }}
      />

      {/* Top HUD Telemetry Bar + Mode Switcher (Single-Row Compact on Mobile) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/15 backdrop-blur-md font-mono text-[9px] uppercase tracking-wider text-white/90 truncate">
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
          <span className="hidden sm:inline">360° STUDIO</span>
          <span className="sm:hidden">360°</span>
          {specimenCode && <span className="text-[#00F0FF] font-bold">· {specimenCode}</span>}
        </div>

        {/* Sub-mode switcher: 3D Sculpture vs 3D Capsule */}
        <div className="pointer-events-auto inline-flex p-0.5 rounded-full bg-black/80 border border-white/15 backdrop-blur-md font-mono text-[9px] uppercase shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setSubMode("sculpture");
            }}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer ${
              subMode === "sculpture"
                ? "bg-white text-black font-bold"
                : "text-white/65 hover:text-white"
            }`}
          >
            <Box className="w-2.5 h-2.5" />
            <span>3D Модель</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setSubMode("capsule");
            }}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer ${
              subMode === "capsule"
                ? "bg-white text-black font-bold"
                : "text-white/65 hover:text-white"
            }`}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>Капсула</span>
          </button>
        </div>
      </div>

      {/* WebGL Canvas Host */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Interactive Studio Controls HUD */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-full bg-black/65 border border-white/10 backdrop-blur-md font-mono text-[9px] uppercase tracking-wider text-white/75 truncate">
          {serialNumber !== undefined ? (
            <>
              <span>№{String(serialNumber).padStart(6, "0")}</span>
              <span className="hidden sm:inline"> · ВРАЩАЙ 360°</span>
            </>
          ) : (
            collectionName || "360° VIEW"
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1 bg-black/75 border border-white/15 rounded-full p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setZoomLevel((z) => Math.min(1.6, Number((z + 0.2).toFixed(2))));
            }}
            className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Приблизить"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(2))));
            }}
            className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Отдалить"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setLightPreset((p) =>
                p === "cyber" ? "chrome" : p === "chrome" ? "void" : "cyber"
              );
            }}
            className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Сменить студийный свет"
          >
            <Sun className="w-3.5 h-3.5" style={{ color: themeColor }} />
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setZoomLevel(1);
              setAutoRotate(true);
              resetTriggerRef.current += 1;
            }}
            className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Сбросить ракурс"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
