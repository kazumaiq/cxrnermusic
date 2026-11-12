// Lightweight zero-rerender bridge between audio playback, scroll choreography, and the 3D WebGL scene.

export interface UniverseState {
  audioPlaying: boolean;
  audioBass: number; // 0..1
  audioMid: number; // 0..1
  audioEnergy: number; // 0..1
  introCompleted: boolean;
  hoverIntensity: number; // 0..1 when hovering interactive 3D-linked UI
  cursorLabel: string | null;
}

const initialState: UniverseState = {
  audioPlaying: false,
  audioBass: 0,
  audioMid: 0,
  audioEnergy: 0,
  introCompleted: false,
  hoverIntensity: 0,
  cursorLabel: null,
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

export function setUniverseHover(intensity: number, label: string | null = null) {
  const st = getUniverseState();
  st.hoverIntensity = intensity;
  st.cursorLabel = label;
}

export function setUniverseIntroCompleted(done: boolean) {
  const st = getUniverseState();
  st.introCompleted = done;
}
