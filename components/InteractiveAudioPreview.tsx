"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  ExternalLink,
  Music,
  Volume2,
  VolumeX,
  Disc,
  Sparkles,
} from "lucide-react";

interface Track {
  title: string;
  artist: string;
  cover: string;
  audioSrc?: string;
  genre?: string;
  duration?: string;
  yandexUrl?: string;
  artistUrl?: string;
  links?: { label: string; href: string }[];
}

interface AudioPreviewProps {
  track: Track;
}

export default function InteractiveAudioPreview({ track }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(36).fill(0.2));

  const audioSrc = track.audioSrc || "/audio/the-sadness-of-reality.mp3";
  const yandexAlbumUrl =
    track.yandexUrl ||
    "https://music.yandex.ru/album/44422385?utm_source=web&utm_medium=copy_link";
  const yandexArtistUrl =
    track.artistUrl || "https://music.yandex.ru/artist/25572730";

  // Initialize Audio Element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 253);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Web Audio API Analyzer setup
  const setupAudioContext = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      if (audioRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
      }

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    } catch {
      // Browser autoplay policy or already connected
    }
  };

  // Real-time animation loop for waveform
  useEffect(() => {
    const updateSpectrum = () => {
      if (analyserRef.current && dataArrayRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        const data = dataArrayRef.current;
        const barsCount = 36;
        const step = Math.floor(data.length / barsCount) || 1;
        const newBars: number[] = [];

        for (let i = 0; i < barsCount; i++) {
          const val = data[i * step] || 0;
          const normalized = Math.max(0.12, Math.min(1.0, val / 255));
          newBars.push(normalized);
        }
        setFrequencyData(newBars);
      } else if (!isPlaying) {
        // Fallback subtle idle wave
        setFrequencyData((prev) =>
          prev.map((val, i) => {
            const idle = Math.sin(Date.now() * 0.002 + i * 0.35) * 0.12 + 0.22;
            return Math.max(0.1, idle);
          })
        );
      }
      animationFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    animationFrameRef.current = requestAnimationFrame(updateSpectrum);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setupAudioContext();
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Playback error:", err);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * (duration || 1);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full rounded-3xl p-4 sm:p-5 border border-purple-500/30 hover:border-purple-500/50 transition duration-300 bg-[#0c0c16]/95 backdrop-blur-2xl shadow-[0_0_40px_rgba(168,85,247,0.18)]">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        playsInline
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Play Button & Cover Thumbnail */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={togglePlayback}
            className="relative flex-shrink-0 w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:scale-105 active:scale-95 transition cursor-pointer p-3.5 group"
            aria-label={isPlaying ? "Пауза" : "Воспроизвести трек"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white text-white" />
            ) : (
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            )}
            {isPlaying && (
              <span className="absolute -inset-1 rounded-2xl border border-purple-400 animate-ping opacity-30 pointer-events-none" />
            )}
          </button>

          {/* Mini Album Cover */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-purple-500/30 flex-shrink-0 shadow-md">
            <img
              src={track.cover || "/covers/the-sadness-of-reality.jpg"}
              alt={track.title}
              className={`w-full h-full object-cover transition duration-500 ${
                isPlaying ? "scale-105" : ""
              }`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-purple-500/20 backdrop-blur-[1px] flex items-center justify-center">
                <Disc className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Track Titles */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400 font-bold">
                // АКТУАЛЬНЫЙ РЕЛИЗ
              </span>
            </div>
            <h4 className="font-gothic font-black text-white text-sm sm:text-base tracking-tight uppercase truncate">
              {track.title}
            </h4>
            <a
              href={yandexArtistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-purple-300 hover:text-white transition truncate block"
            >
              {track.artist}
            </a>
          </div>
        </div>

        {/* Right CTA Links & Volume */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition"
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Direct Yandex Music Album Link */}
          <a
            href={yandexAlbumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/35 font-mono text-xs uppercase tracking-wider transition shadow-sm"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Яндекс Музыка</span>
            <ExternalLink className="w-3 h-3 text-purple-400" />
          </a>
        </div>
      </div>

      {/* Waveform & Scrubber Section */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div
          className="relative h-8 flex items-center gap-1 cursor-pointer group"
          onClick={handleSeek}
          title="Перемотать трек"
        >
          {frequencyData.map((val, idx) => {
            const barPct = (idx / frequencyData.length) * 100;
            const isPassed = barPct <= progressPct;

            return (
              <div
                key={idx}
                className="flex-1 h-full flex items-center justify-center pointer-events-none"
              >
                <div
                  className={`w-full rounded-full transition-all duration-100 ${
                    isPassed
                      ? "bg-gradient-to-t from-purple-600 via-purple-400 to-indigo-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      : "bg-white/15 group-hover:bg-white/25"
                  }`}
                  style={{
                    height: `${Math.max(16, val * 100)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-1">
          <span className="text-purple-300 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-neutral-500">{formatTime(duration || 253)}</span>
        </div>
      </div>
    </div>
  );
}
