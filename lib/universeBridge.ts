// Lightweight zero-rerender bridge between audio playback, scroll choreography, and the 3D WebGL scene.

export interface UniverseState {
  audioPlaying: boolean;
  audioBass: number; // 0..1
  audioMid: number; // 0..1
  audioEnergy: number; // 0..1
  introCompleted: boolean;
  hoverIntensity: number; // 0..1 when hovering interactive 3D-linked UI
  cursorLabel: string | null;
  atmosphereColor: [number, number, number]; // [r, g, b] 0..1
  shockwave: number; // 0..1 triggered on beat drops
  targetNodeIndex: number; // Active DSP node in distribution network (-1 if none)
}

const initialState: UniverseState = {
  audioPlaying: false,
  audioBass: 0,
  audioMid: 0,
  audioEnergy: 0,
  introCompleted: false,
  hoverIntensity: 0,
  cursorLabel: null,
  atmosphereColor: [0.529, 0.216, 1.0], // Electric Purple #8737FF default
  shockwave: 0,
  targetNodeIndex: -1,
};

declare global {
  interface Window {
    __cxrnerUniverse?: UniverseState;
  }
}

export function getUniverseState(): UniverseState {
  if (typeof window === "undefined") return initialState;
  if (!window.__cxrnerUniverse) {
    window.__cxrnerUniverse = { ...initialState };
  }
  return window.__cxrnerUniverse;
}

export function setUniverseAudio(playing: boolean, bass = 0, mid = 0) {
  const st = getUniverseState();
  st.audioPlaying = playing;
  st.audioBass = bass;
  st.audioMid = mid;
  st.audioEnergy = Math.min(1, bass * 0.65 + mid * 0.35);
}

export function triggerUniverseShockwave(strength = 1.0) {
  const st = getUniverseState();
  st.shockwave = Math.max(st.shockwave, Math.min(strength, 1.0));
}

export function setUniverseAtmosphere(rgb: [number, number, number]) {
  const st = getUniverseState();
  st.atmosphereColor = rgb;
}

export function setUniverseTargetNode(index: number) {
  const st = getUniverseState();
  st.targetNodeIndex = index;
}

export function setUniverseHover(intensity: number, label: string | null = null) {
  const st = getUniverseState();
  st.hoverIntensity = intensity;
  st.cursorLabel = label;
}

export function setUniverseIntroCompleted(done: boolean) {
  const st = getUniverseState();
  st.introCompleted = done;
}
