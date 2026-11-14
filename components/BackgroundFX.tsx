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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#040307]"
      aria-hidden="true"
    >
      {/* 1. Monumental Chrome & Obsidian 3D Spatial Universe */}
      <CxrnerUniverseCanvas />

      {/* 2. Ultra-subtle Architectural Studio Grid */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(217, 217, 226, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(217, 217, 226, 0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 100%)",
        }}
      />

      {/* 3. Studio Top Vignette for Typography Legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 70% 25%, rgba(135, 55, 255, 0.09) 0%, transparent 48%), radial-gradient(circle at 20% 80%, rgba(0, 240, 255, 0.05) 0%, transparent 45%), linear-gradient(180deg, rgba(4,3,7,0.45) 0%, rgba(4,3,7,0.08) 40%, rgba(4,3,7,0.82) 100%)",
        }}
      />

      {/* 4. Subtle Film Grain */}
      <div className="film-grain opacity-[0.22]" />
    </div>
  );
}
