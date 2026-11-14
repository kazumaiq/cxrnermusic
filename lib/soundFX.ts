// Cinematic Web Audio API Synthesizer for UI sound design (zero external audio asset dependencies)

let audioCtx: AudioContext | null = null;
let sfxEnabled: boolean | null = null;
const listeners = new Set<(enabled: boolean) => void>();
let cachedNoiseBuffer: AudioBuffer | null = null;
let cachedNoiseCtx: AudioContext | null = null;
const activeOpeningStoppers = new Set<() => void>();

function initAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseCtx === ctx) {
    return cachedNoiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 2.0);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // Slight pink tilt for richer Mylar / air hiss texture without harshness
    last = (last + 0.08 * white) / 1.08;
    data[i] = white * 0.65 + last * 1.6;
  }
  cachedNoiseBuffer = buffer;
  cachedNoiseCtx = ctx;
  return buffer;
}

function registerOpeningStopper(stopFn: () => void) {
  activeOpeningStoppers.add(stopFn);
}

/** Smoothly mute & cancel any active case-opening audio sequences */
export function stopOpeningAudio() {
  activeOpeningStoppers.forEach((stopFn) => {
    try {
      stopFn();
    } catch {}
  });
  activeOpeningStoppers.clear();
}

export function isSfxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (sfxEnabled === null) {
    const stored = window.localStorage.getItem("cxrner_sfx");
    sfxEnabled = stored === null ? true : stored === "true";
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

/** Case Opening: Telemetry Step Ping during Scanning */
export function playScannerTickSound(stepIndex = 0) {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const baseFreq = 920 + Math.min(stepIndex, 6) * 140;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.32, now + 0.032);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.055, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {}
}

/** Case Opening: Laminated Mylar Zip-Bag Tear + Metallic Teeth Pull + Cryo Vacuum Decompression */
export function playZipTearSound() {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const noiseBuf = getNoiseBuffer(ctx);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.9, now);
    master.connect(ctx.destination);

    const sources: Array<{ stop: (when?: number) => void }> = [];

    // 1. Laser Notch Foil Snap (t = 0.00s)
    const snapBurst = ctx.createBufferSource();
    snapBurst.buffer = noiseBuf;
    const snapBp = ctx.createBiquadFilter();
    snapBp.type = "bandpass";
    snapBp.frequency.setValueAtTime(3400, now);
    snapBp.Q.setValueAtTime(1.8, now);
    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.001, now);
    snapGain.gain.linearRampToValueAtTime(0.28, now + 0.004);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    snapBurst.connect(snapBp);
    snapBp.connect(snapGain);
    snapGain.connect(master);
    snapBurst.start(now);
    snapBurst.stop(now + 0.065);
    sources.push(snapBurst);

    // 2. Continuous Mylar Foil Shear Bed (t = 0.02s -> 0.58s)
    const foil = ctx.createBufferSource();
    foil.buffer = noiseBuf;
    const foilHp = ctx.createBiquadFilter();
    foilHp.type = "highpass";
    foilHp.frequency.setValueAtTime(1900, now + 0.02);
    foilHp.frequency.exponentialRampToValueAtTime(4800, now + 0.56);
    const foilGain = ctx.createGain();
    foilGain.gain.setValueAtTime(0.001, now + 0.02);
    foilGain.gain.linearRampToValueAtTime(0.11, now + 0.09);
    foilGain.gain.setValueAtTime(0.13, now + 0.44);
    foilGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    foil.connect(foilHp);
    foilHp.connect(foilGain);
    foilGain.connect(master);
    foil.start(now + 0.02);
    foil.stop(now + 0.6);
    sources.push(foil);

    // 3. 34 Discrete Metallic Zipper-Teeth Micro-Clicks (accelerating pull leftwards)
    const teethCount = 34;
    for (let i = 0; i < teethCount; i++) {
      const progress = i / (teethCount - 1);
      const t = now + 0.035 + Math.pow(progress, 0.88) * 0.51;

      const tooth = ctx.createOscillator();
      tooth.type = "triangle";
      const toothFreq = 2100 + Math.sin(i * 1.7) * 420 + progress * 2400;
      tooth.frequency.setValueAtTime(toothFreq, t);
      tooth.frequency.exponentialRampToValueAtTime(toothFreq * 0.65, t + 0.014);

      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.001, t);
      tg.gain.linearRampToValueAtTime(0.065 + progress * 0.04, t + 0.002);
      tg.gain.exponentialRampToValueAtTime(0.0005, t + 0.016);

      tooth.connect(tg);
      tg.connect(master);
      tooth.start(t);
      tooth.stop(t + 0.02);
      sources.push(tooth);
    }

    // 4. Pressurized Cryo Vacuum Seal Break ("PSSSSSH" Hiss + Airlock Thump at t = 0.50s)
    const hissStart = now + 0.5;
    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuf;
    const hissBp = ctx.createBiquadFilter();
    hissBp.type = "bandpass";
    hissBp.frequency.setValueAtTime(1600, hissStart);
    hissBp.frequency.exponentialRampToValueAtTime(4600, hissStart + 0.14);
    hissBp.frequency.exponentialRampToValueAtTime(2100, hissStart + 0.58);
    hissBp.Q.setValueAtTime(0.85, hissStart);

    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.001, hissStart);
    hissGain.gain.linearRampToValueAtTime(0.24, hissStart + 0.035);
    hissGain.gain.exponentialRampToValueAtTime(0.0008, hissStart + 0.62);

    hiss.connect(hissBp);
    hissBp.connect(hissGain);
    hissGain.connect(master);
    hiss.start(hissStart);
    hiss.stop(hissStart + 0.65);
    sources.push(hiss);

    // Subtle chest vacuum thud as bag pops open
    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(118, hissStart);
    thump.frequency.exponentialRampToValueAtTime(38, hissStart + 0.18);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.24, hissStart);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, hissStart + 0.22);
    thump.connect(thumpGain);
    thumpGain.connect(master);
    thump.start(hissStart);
    thump.stop(hissStart + 0.24);
    sources.push(thump);

    registerOpeningStopper(() => {
      const stopT = ctx.currentTime;
      master.gain.cancelScheduledValues(stopT);
      master.gain.setTargetAtTime(0.0001, stopT, 0.025);
      sources.forEach((s) => {
        try {
          s.stop(stopT + 0.08);
        } catch {}
      });
    });
  } catch {}
}

/** Case Opening: Atmospheric CXRNER Chamber Analog Charge-Up (warm sub + filtered dark pad + cryo air riser) */
export function playChargeUpSound(durationSec = 2.45) {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;
  stopOpeningAudio();

  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, now);
    master.gain.linearRampToValueAtTime(0.9, now + 0.25);
    master.gain.setValueAtTime(0.9, now + durationSec - 0.12);
    master.gain.exponentialRampToValueAtTime(0.0005, now + durationSec + 0.15);
    master.connect(ctx.destination);

    // Warm low-pass filter sweep on harmonic bed so it swells cleanly without harsh sawtooth screech
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + durationSec);
    filter.Q.setValueAtTime(2.6, now);
    filter.connect(master);

    const stoppables: Array<{ stop: (when?: number) => void }> = [];

    // 1. Sub chamber anchor (A1 55Hz -> 110Hz octave rise)
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(55, now);
    sub.frequency.exponentialRampToValueAtTime(82.41, now + durationSec * 0.72);
    sub.frequency.exponentialRampToValueAtTime(110, now + durationSec);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.16, now);
    subGain.gain.linearRampToValueAtTime(0.24, now + durationSec * 0.85);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start(now);
    sub.stop(now + durationSec + 0.16);
    stoppables.push(sub);

    // 2. Dark futuristic CXRNER A-minor pad chord (A2, E3, C4) with slight detune
    const chordFreqs = [110, 164.81, 261.63];
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(idx === 1 ? -9 : idx === 2 ? 11 : 0, now);
      // Slight pitch tension at final 25% of charge
      osc.detune.linearRampToValueAtTime(idx * 18 + 35, now + durationSec);

      const g = ctx.createGain();
      g.gain.setValueAtTime(idx === 0 ? 0.09 : 0.045, now);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.14 : 0.085, now + durationSec * 0.9);

      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      osc.stop(now + durationSec + 0.16);
      stoppables.push(osc);
    });

    // 3. Cryo vacuum turbine riser noise sweeping into zipper break
    const air = ctx.createBufferSource();
    air.buffer = getNoiseBuffer(ctx);
    air.loop = true;
    const airBp = ctx.createBiquadFilter();
    airBp.type = "bandpass";
    airBp.frequency.setValueAtTime(320, now);
    airBp.frequency.exponentialRampToValueAtTime(3100, now + durationSec);
    airBp.Q.setValueAtTime(2.8, now);
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.005, now);
    airGain.gain.exponentialRampToValueAtTime(0.11, now + durationSec * 0.94);
    air.connect(airBp);
    airBp.connect(airGain);
    airGain.connect(master);
    air.start(now);
    air.stop(now + durationSec + 0.12);
    stoppables.push(air);

    registerOpeningStopper(() => {
      const stopT = ctx.currentTime;
      master.gain.cancelScheduledValues(stopT);
      master.gain.setTargetAtTime(0.0001, stopT, 0.03);
      stoppables.forEach((node) => {
        try {
          node.stop(stopT + 0.1);
        } catch {}
      });
    });
  } catch {}
}

/** Case Opening: Curated CXRNER Studio Reveal Impact & Rarity Chord/Fanfare */
export function playRevealSound(rarity: string) {
  if (!isSfxEnabled()) return;
  const ctx = initAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Gentle compressor + limiter prevents any multi-voice peaking
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-12, now);
    limiter.ratio.setValueAtTime(6, now);
    limiter.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.88, now);
    master.connect(limiter);

    const triggerVoice = (
      freq: number,
      delay: number,
      dur: number,
      peak: number,
      type: OscillatorType = "triangle",
      cutoffStart = 2800
    ) => {
      const t = now + delay;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(cutoffStart, t);
      filt.frequency.exponentialRampToValueAtTime(650, t + dur);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0003, t + dur);

      osc.connect(filt);
      filt.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.04);
    };

    const triggerSubDrop = (startFreq: number, endFreq: number, dur: number, peak: number) => {
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(startFreq, now);
      sub.frequency.exponentialRampToValueAtTime(endFreq, now + Math.min(dur * 0.7, 0.55));
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(peak, now);
      sg.gain.exponentialRampToValueAtTime(0.0005, now + dur);
      sub.connect(sg);
      sg.connect(master);
      sub.start(now);
      sub.stop(now + dur + 0.04);
    };

    if (rarity === "special_reward") {
      // Sovereign Golden Vault Fanfare + Wide Major9 Sustain
      triggerSubDrop(155, 36, 1.3, 0.36);
      const fanfare = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
      fanfare.forEach((f, idx) => {
        triggerVoice(f, idx * 0.065, 2.2 - idx * 0.12, 0.12, "triangle", 5200);
        triggerVoice(f * 0.5, idx * 0.065, 1.9, 0.07, "sine", 2400);
      });
    } else if (rarity === "mythic") {
      // Obsidian Crimson Titan Drop: massive sub + moody power fifths + high laser shimmer
      triggerSubDrop(175, 29, 1.5, 0.42);
      [146.83, 220, 293.66, 349.23, 440, 659.25].forEach((f, idx) => {
        triggerVoice(f, idx * 0.04, 1.85, idx < 2 ? 0.13 : 0.085, idx < 2 ? "sawtooth" : "triangle", 3800);
      });
      triggerVoice(1760, 0.12, 1.1, 0.055, "sine", 6000);
    } else if (rarity === "legendary") {
      // Festival Gold Impact + Warm Brass/Synth Chord (Fmaj9)
      triggerSubDrop(145, 38, 1.15, 0.34);
      [174.61, 261.63, 392.0, 440.0, 523.25, 783.99].forEach((f, idx) => {
        triggerVoice(f, idx * 0.035, 1.45, 0.095, idx < 2 ? "sawtooth" : "triangle", 3600);
      });
    } else if (rarity === "epic") {
      // Ultraviolet Dark Label Minor9 Swell
      triggerSubDrop(120, 44, 0.8, 0.25);
      [220, 329.63, 392.0, 493.88, 523.25].forEach((f, idx) => {
        triggerVoice(f, idx * 0.03, 1.15, 0.085, "triangle", 3200);
      });
    } else if (rarity === "rare") {
      // Neon Cyan Holographic Bloom
      triggerSubDrop(105, 48, 0.45, 0.18);
      [440, 523.25, 659.25, 783.99].forEach((f, idx) => {
        triggerVoice(f, idx * 0.04, 0.72, 0.08, "triangle", 3800);
      });
    } else {
      // Common Sleek Carbon Lock Confirm
      triggerSubDrop(95, 52, 0.28, 0.14);
      [440, 523.25, 659.25].forEach((f, idx) => {
        triggerVoice(f, idx * 0.035, 0.42, 0.07, "sine", 2600);
      });
    }
  } catch {}
}
