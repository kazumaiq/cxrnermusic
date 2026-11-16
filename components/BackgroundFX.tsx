"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const CxrnerUniverseCanvas = dynamic(
  () => import("./3d/CxrnerUniverseCanvas"),
  { ssr: false }
);

export default function BackgroundFX() {
  const pathname = usePathname() || "";

  // Dedicated focused workspaces render their own domain-specific visual environments
  const hideUniverse =
    pathname.startsWith("/link") ||
    pathname.startsWith("/miniapp") ||
    pathname.startsWith("/admin");

  if (hideUniverse) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0B0718]"
      aria-hidden="true"
    >
      {/* 1. Vivid Cosmic Universe Layer */}
      <CxrnerUniverseCanvas />

      {/* 2. Subtle Velvet Violet Ambient Mesh */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 50% at 50% -6%, rgba(139, 92, 246, 0.24) 0%, transparent 62%), radial-gradient(circle at 85% 22%, rgba(34, 211, 238, 0.1) 0%, transparent 45%), radial-gradient(circle at 15% 82%, rgba(168, 85, 247, 0.14) 0%, transparent 48%), linear-gradient(180deg, rgba(11,7,24,0.28) 0%, rgba(11,7,24,0.12) 45%, rgba(11,7,24,0.72) 100%)",
        }}
      />

      {/* 3. Crisp Low-Noise Surface Grid */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(230, 225, 250, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(230, 225, 250, 0.05) 1px, transparent 1px)",
          backgroundSize: "76px 76px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 100%)",
        }}
      />
    </div>
  );
}
