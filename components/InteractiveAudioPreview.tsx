"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, ExternalLink, Music } from "lucide-react";

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synthetic waveform bars
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  useEffect(() => {
    const bars: number[] = [];
    const seed = track.title.length + track.artist.length;
    for (let i = 0; i < 34; i++) {
      const height = Math.sin(i * 0.45 + seed) * 0.35 + Math.cos(i * 0.8) * 0.25 + 0.5;
      bars.push(Math.max(0.18, Math.min(0.95, height)));
    }
    setWaveformBars(bars);
  }, [track.title, track.artist]);

  const togglePlayback = () => {
    if (!isPlaying) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.frequency.setValueAtTime(146.83, ctx.currentTime);
        osc.type = "sawtooth";

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        setIsPlaying(true);

        intervalRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(intervalRef.current!);
              setIsPlaying(false);
              return 0;
            }
            return prev + 1.4;
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
    <div className="w-full rounded-2xl p-4 sm:p-5 border border-purple-500/25 hover:border-purple-500/40 transition duration-300 bg-[#0c0c12]/90 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayback}
          className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-105 active:scale-95 transition"
          aria-label={isPlaying ? "Пауза" : "Воспроизвести превью"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white ml-0.5" />}
        </button>

        {/* Track Metadata & Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400 block mb-0.5">
                // ПОСЛЕДНИЙ РЕЛИЗ ЛЕЙБЛА
              </span>
              <h4 className="font-gothic font-bold text-white text-sm sm:text-base truncate flex items-center gap-2">
                {track.title}
                {isPlaying && (
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                )}
              </h4>
              <p className="font-mono text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
            </div>

            <a
              href="https://music.yandex.ru/label/5978511"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[11px] uppercase tracking-wider transition"
            >
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Слушать на Яндекс Музыке</span>
              <span className="sm:hidden">Яндекс</span>
              <ExternalLink className="w-3 h-3 text-purple-400" />
            </a>
          </div>

          {/* Interactive Waveform Visualizer */}
          <div
            className="mt-3 flex items-center gap-1 h-7 cursor-pointer"
            onClick={() => setProgress(Math.random() * 80)}
            title="Перемотать"
          >
            {waveformBars.map((height, i) => {
              const active = (i / waveformBars.length) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    active
                      ? "bg-gradient-to-t from-purple-500 to-indigo-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      : "bg-white/10 hover:bg-white/20"
                  } ${isPlaying ? "hover:scale-y-125" : ""}`}
                  style={{
                    height: `${isPlaying ? Math.max(18, height * 100 * (0.8 + Math.random() * 0.4)) : height * 100}%`,
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
