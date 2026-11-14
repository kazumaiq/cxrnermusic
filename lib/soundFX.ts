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

/** Explosive quantum disruption blast when 3D core shatters or Spacebar is pressed */
export function playQuantumDisrupt() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Sub-bass detonation drop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);

    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    // High-energy particle crackle / noise burst
    const bufferSize = ctx.sampleRate * 0.18;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.18);
    filter.Q.value = 3.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 0.2);
  } catch {}
}

/** Deep 808 Sub-Bass Waveform (38Hz -> 32Hz with harmonic saturation) */
export function play808Bass() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.55);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.62);
  } catch {}
}

/** Hard Punchy Electronic Kick (160Hz -> 42Hz) */
export function playHardKick() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {}
}

/** Authentic Phonk 808 Cowbell (Dual Square wave at 840Hz & 560Hz with resonant bandpass) */
export function playPhonkCowbell() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "square";
    osc2.type = "square";
    osc1.frequency.setValueAtTime(840, now);
    osc2.frequency.setValueAtTime(560, now);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.Q.value = 6.0;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.34);
    osc2.stop(now + 0.34);
  } catch {}
}

/** Crisp Trap Studio Clap (Triple Transient Noise Burst) */
export function playTrapClap() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.12;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    [0, 0.012, 0.024].forEach((offset, idx) => {
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1100;
      filter.Q.value = 2.0;

      const gain = ctx.createGain();
      const vol = idx === 2 ? 0.22 : 0.08;
      gain.gain.setValueAtTime(vol, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + (idx === 2 ? 0.1 : 0.02));

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(now + offset);
      source.stop(now + offset + 0.12);
    });
  } catch {}
}

/** Metallic Trap Hi-Hat (9.5kHz High-Pass Crisp Tick) */
export function playHiHat() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.05;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 9200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(now);
    source.stop(now + 0.05);
  } catch {}
}

/** Futuristic Cyber Glitch / Laser Sweep */
export function playGlitchLaser() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {}
}

/** Realistic DJ Vinyl Scratch Sound */
export function playVinylScratch() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(890, now + 0.04);
    osc.frequency.linearRampToValueAtTime(210, now + 0.09);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  } catch {}
}

/** Case Opening: Physical Zip-Tear Sound */
export function playZipTearSound() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Noise with periodic micro-clicks like zipper teeth
      const click = Math.sin(i / 14) > 0.85 ? 0.6 : 0;
      data[i] = (Math.random() * 2 - 1) * 0.4 + click * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3800, ctx.currentTime + 0.45);

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  } catch {}
}

/** Case Opening: Sci-Fi Harmonic Build-up Riser */
export function playChargeUpSound() {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(740, now + 3.8);

    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(1480, now + 3.8);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 3.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.0);
    osc2.stop(now + 4.0);
  } catch {}
}

/** Case Opening: Rarity Reveal Impact & Fanfare */
export function playRevealSound(rarity: string) {
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (rarity === "special_reward") {
      // Golden Triumphal Fanfare with shimmering chord
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.setValueAtTime(0.12, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
        osc.connect(g);
        g.connect(gain);
        osc.start(now + idx * 0.08);
        osc.stop(now + 2.6);
      });
    } else if (rarity === "mythic") {
      // Dark Cosmic Boom & Sub Drop
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(160, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 1.8);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      sub.connect(subGain);
      subGain.connect(gain);
      sub.start(now);
      sub.stop(now + 2.3);

      const chime = ctx.createOscillator();
      chime.type = "triangle";
      chime.frequency.setValueAtTime(880, now + 0.1);
      chime.frequency.exponentialRampToValueAtTime(1760, now + 0.9);
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0.2, now + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      chime.connect(chimeGain);
      chimeGain.connect(gain);
      chime.start(now + 0.1);
      chime.stop(now + 1.6);
    } else if (rarity === "legendary") {
      // Heavy Gold Shockwave + Resonant Ring
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 1.2);
      const subG = ctx.createGain();
      subG.gain.setValueAtTime(0.3, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      sub.connect(subG);
      subG.connect(gain);
      sub.start(now);
      sub.stop(now + 1.5);
    } else if (rarity === "epic") {
      // Violet Ethereal Chord
      [440, 554.37, 659.25].forEach((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc.connect(g);
        g.connect(gain);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } else if (rarity === "rare") {
      // Cyan Bright Sparkle
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g);
      g.connect(gain);
      osc.start(now);
      osc.stop(now + 0.55);
    } else {
      // Common subtle soft click/chime
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(g);
      g.connect(gain);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch {}
}
