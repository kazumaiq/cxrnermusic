"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Sparkles, ExternalLink, Disc } from "lucide-react";

interface Track {
  title: string;
  artist: string;
  cover: string;
  genre?: string;
  duration?: string;
  links?: { label: string; href: string }[];
}

interface AudioPreviewProps {
  track: Track;
}

export default function InteractiveAudioPreview({ track }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate synthetic waveform bars
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  useEffect(() => {
    // Deterministic procedural waveform based on track title
    const bars: number[] = [];
    const seed = track.title.length + track.artist.length;
    for (let i = 0; i < 36; i++) {
      const height = Math.sin(i * 0.4 + seed) * 0.35 + Math.cos(i * 0.8) * 0.25 + 0.5;
      bars.push(Math.max(0.15, Math.min(0.95, height)));
    }
    setWaveformBars(bars);
  }, [track.title, track.artist]);

  const togglePlayback = () => {
    if (!isPlaying) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Create warm synth ambient bass
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(isMuted ? 0 : 0.08, ctx.currentTime);
        osc.frequency.setValueAtTime(146.83, ctx.currentTime); // D3 phonk note
        osc.type = "sawtooth";

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        setIsPlaying(true);

        // Progress bar simulation
        intervalRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(intervalRef.current!);
              setIsPlaying(false);
              return 0;
            }
            return prev + 1.2;
          });
        }, 200);
      } catch {
        setIsPlaying(false);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full dark-panel rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition duration-300 bg-[#090909]/90">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayback}
          className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition"
          aria-label={isPlaying ? "Пауза" : "Воспроизвести превью"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
        </button>

        {/* Track Metadata & Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <h4 className="font-gothic font-bold text-white text-sm sm:text-base truncate flex items-center gap-2">
                {track.title}
                {isPlaying && (
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
                )}
              </h4>
              <p className="font-mono text-xs text-neutral-400 truncate">{track.artist}</p>
            </div>
            {track.genre && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest text-neutral-400 border border-white/10 bg-white/5">
                {track.genre}
              </span>
            )}
          </div>

          {/* Interactive Waveform Visualizer */}
          <div className="mt-3 flex items-center gap-1 h-7 cursor-pointer" onClick={() => setProgress(Math.random() * 80)}>
            {waveformBars.map((height, i) => {
              const active = (i / waveformBars.length) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-150 ${
                    active ? "bg-white" : "bg-white/15"
                  } ${isPlaying ? "hover:scale-y-125" : ""}`}
                  style={{
                    height: `${isPlaying ? Math.max(15, height * 100 * (0.8 + Math.random() * 0.4)) : height * 100}%`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
