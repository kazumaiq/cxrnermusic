"use client";

import CxrnerUniverseCanvas from "./3d/CxrnerUniverseCanvas";
import CosmicCursor from "./visual/CosmicCursor";

export default function BackgroundFX() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden select-none bg-[#050407]"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {/* Unified Continuous 3D Cosmic Universe */}
        <CxrnerUniverseCanvas />

        {/* Subtle Architectural Grid & Film Grain Texture */}
        <div className="gothic-grid absolute inset-0 opacity-[0.07] [mask-image:radial-gradient(ellipse_85%_75%_at_50%_45%,#000_35%,transparent_100%)] pointer-events-none" />
        <div className="film-grain absolute inset-0 opacity-20 mix-blend-screen pointer-events-none" />
      </div>

      {/* Desktop-only precision reticle cursor */}
      <CosmicCursor />
    </>
  );
}
