"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  ExternalLink,
  Music,
  Volume2,
  VolumeX,
  Disc3,
} from "lucide-react";
import { setUniverseAudio, triggerUniverseShockwave } from "../lib/universeBridge";
import { playClickSound } from "../lib/soundFX";

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
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [frequencyData, setFrequencyData] = useState<number[]>(() =>
    Array.from({ length: 32 }, (_, i) => 0.16 + Math.sin(i * 0.45) * 0.12 + 0.08)
  );

  const audioSrc = track.audioSrc || "/audio/the-sadness-of-reality.mp3";
  const yandexAlbumUrl =
    track.yandexUrl ||
    "https://music.yandex.ru/album/44422385?utm_source=web&utm_medium=copy_link";
  const yandexArtistUrl =
    track.artistUrl || "https://music.yandex.ru/artist/25572730";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 253);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setUniverseAudio(false, 0, 0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      setUniverseAudio(false, 0, 0);
    };
  }, []);

  const setupAudioContext = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      analyserRef.current = analyser;

      if (audioRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
      }

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    } catch {
      // Autoplay or already connected
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setUniverseAudio(false, 0, 0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastUpdate = 0;
    const updateSpectrum = (time: number) => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        const data = dataArrayRef.current;

        // Compute smooth bass & mid energy for 3D Core every frame
        let bassSum = 0;
        for (let b = 0; b < 6; b++) bassSum += data[b] || 0;
        const bass = Math.min(1, bassSum / (6 * 255));

        let midSum = 0;
        for (let m = 6; m < 22; m++) midSum += data[m] || 0;
        const mid = Math.min(1, midSum / (16 * 255));

        setUniverseAudio(true, bass, mid);

        // Send beat shockwave across cosmic universe on kick/bass transient
        if (bass > 0.68) {
          triggerUniverseShockwave(bass);
        }

        // Update React bars at ~30fps
        if (time - lastUpdate > 33) {
          lastUpdate = time;
          const barsCount = 32;
          const step = Math.floor(data.length / barsCount) || 1;
          const newBars: number[] = [];
          for (let i = 0; i < barsCount; i++) {
            const val = data[i * step] || 0;
            newBars.push(Math.max(0.14, Math.min(1.0, val / 255)));
          }
          setFrequencyData(newBars);
        }
      } else {
        // Fallback gentle pulse if WebAudio analyser unavailable
        const pulse = 0.35 + Math.sin(time * 0.008) * 0.2;
        setUniverseAudio(true, pulse, pulse * 0.7);
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
    const newTime = pct * (duration || 253);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full rounded-2xl p-3.5 sm:p-4 border border-[#D9D9E2]/12 hover:border-[#B46BFF]/45 transition-all duration-300 bg-[#090611]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(5,4,7,0.85)]">
      <audio ref={audioRef} src={audioSrc} preload="none" playsInline />

      <div className="flex items-center justify-between gap-3">
        {/* Play Trigger + Artwork + Metadata */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={togglePlayback}
            data-cursor={isPlaying ? "PAUSE" : "LISTEN"}
            className={`relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isPlaying
                ? "bg-[#8737FF] text-white shadow-[0_0_24px_rgba(135,55,255,0.65)]"
                : "bg-white text-[#050407] hover:bg-[#D9D9E2]"
            }`}
            aria-label={isPlaying ? "Пауза" : "Воспроизвести трек"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* 3D Vinyl Sleeve with sliding grooved record */}
          <div className="relative group/sleeve flex items-center flex-shrink-0 pr-3">
            {/* The Vinyl Record */}
            <div
              className={`absolute left-0 w-11 h-11 rounded-full bg-[#08060d] border border-white/25 transition-all duration-700 ease-out shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex items-center justify-center ${
                isPlaying ? "translate-x-5 rotate-180" : "group-hover/sleeve:translate-x-3.5 rotate-45"
              }`}
              style={{
                backgroundImage: `
                  radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.08) 32%, transparent 34%),
                  radial-gradient(circle at center, transparent 46%, rgba(255,255,255,0.06) 48%, transparent 50%),
                  radial-gradient(circle at center, transparent 62%, rgba(255,255,255,0.05) 64%, transparent 66%),
                  radial-gradient(circle at center, transparent 78%, rgba(255,255,255,0.05) 80%, transparent 82%),
                  conic-gradient(from 0deg, rgba(255,255,255,0.18), transparent 60deg, rgba(255,255,255,0.14) 120deg, transparent 180deg, rgba(255,255,255,0.18) 240deg, transparent 300deg, rgba(255,255,255,0.14))
                `,
              }}
            >
              {/* Center vinyl label */}
              <div
                className={`w-4 h-4 rounded-full overflow-hidden border border-[#B46BFF]/60 bg-[#8737FF] ${
                  isPlaying ? "animate-spin" : ""
                }`}
              >
                <img
                  src={track.cover || "/covers/the-sadness-of-reality.jpg"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Front Cover Sleeve */}
            <div className="relative z-10 w-11 h-11 rounded-xl overflow-hidden bg-[#050407] border border-white/20 shadow-lg flex-shrink-0">
              <img
                src={track.cover || "/covers/the-sadness-of-reality.jpg"}
                alt={track.title}
                className={`w-full h-full object-cover transition duration-500 ${
                  isPlaying ? "scale-105 brightness-90" : ""
                }`}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? "bg-[#B46BFF] animate-ping" : "bg-[#8737FF]"
                }`}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#D9D9E2]/70">
                {isPlaying ? "LIVE AUDIO -> 3D CORE" : "FEATURED RELEASE"}
              </span>
            </div>
            <h4 className="font-heavy text-sm sm:text-base tracking-wide text-white uppercase truncate leading-tight mt-0.5">
              {track.title}
            </h4>
            <a
              href={yandexArtistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-[#B46BFF] hover:text-white transition truncate block"
            >
              {track.artist}
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-lg text-[#D9D9E2]/60 hover:text-white hover:bg-white/5 transition"
            title={isMuted ? "Включить звук" : "Выключить звук"}
            aria-label={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <a
            href={yandexAlbumUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="OPEN"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-[#8737FF]/20 border border-white/10 hover:border-[#B46BFF]/50 font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2] hover:text-white transition"
          >
            <Music className="w-3.5 h-3.5 text-[#B46BFF]" />
            <span className="hidden sm:inline">Слушать</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Spectrum Scrubber */}
      <div className="mt-3 pt-2.5 border-t border-white/10">
        <div
          className="relative h-7 flex items-center gap-[3px] cursor-pointer group"
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
                  className={`w-full rounded-full transition-all duration-75 ${
                    isPassed
                      ? "bg-gradient-to-t from-[#8737FF] via-[#B46BFF] to-white shadow-[0_0_8px_rgba(180,107,255,0.6)]"
                      : "bg-[#D9D9E2]/20 group-hover:bg-[#D9D9E2]/35"
                  }`}
                  style={{
                    height: `${Math.max(18, val * 100)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] text-[#D9D9E2]/50 mt-1">
          <span className="text-[#B46BFF]">{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 253)}</span>
        </div>
      </div>
    </div>
  );
}
