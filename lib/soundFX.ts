// Cinematic Web Audio API Synthesizer for UI sound design (zero external audio asset dependencies)

let audioCtx: AudioContext | null = null;
let sfxEnabled = false;
const listeners = new Set<(enabled: boolean) => void>();

function initAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSfxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (sfxEnabled === undefined || sfxEnabled === false) {
    sfxEnabled = window.localStorage.getItem("cxrner_sfx") === "true";
  }
  return sfxEnabled;
}

export function setSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("cxrner_sfx", enabled ? "true" : "false");
  }
  if (enabled) {
    initAudio();
    playClickSound(); // Confirm with soft audio ping
  }
  listeners.forEach((fn) => fn(enabled));
}

export function subscribeSfx(callback: (enabled: boolean) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** Subtle high-tech micro click on button hover */
export function playHoverSound() {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.028);

    gain.gain.setValueAtTime(0.028, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // AudioContext blocked or not supported
  }
}

/** Soft crystal acoustic ping on button click / tab switch */
export function playClickSound() {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(920, now);
    osc1.frequency.exponentialRampToValueAtTime(1840, now + 0.05);

    osc2.frequency.setValueAtTime(1380, now);
    osc2.frequency.exponentialRampToValueAtTime(690, now + 0.06);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.08);
    osc2.stop(now + 0.08);
  } catch {}
}

/** Deep cinematic sub-bass whoosh on section transitions or release change */
export function playWhooshSound() {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.22);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {}
}

/** Celestial harmonic chord when selecting a new release in catalog */
export function playReleaseChime() {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [587.33, 739.99, 880.0, 1174.66]; // D-major triad shimmer

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = i * 0.025;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.025, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.18);
    });
  } catch {}
}
