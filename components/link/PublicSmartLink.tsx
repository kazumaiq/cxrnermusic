"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Share2,
  QrCode,
  Play,
  Pause,
  Check,
  X,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Copy,
  Mail,
  Bell,
} from "lucide-react";
import { getSmartLinkTheme } from "@/lib/smartLinkThemes";
import { getSmartLinkUrl } from "@/lib/slug";
import { ThemeAmbientBackground } from "./ThemeAmbientBackground";
import { PlatformLogo, getPlatformVisualMeta } from "./PlatformLogo";

export interface PlatformItem {
  id?: string;
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
  is_enabled: boolean;
}

export interface SmartLinkDesignConfig {
  accent_color?: string;
  cover_blur?: number;
  button_radius?: "none" | "lg" | "full" | string;
  button_style?: string;
  font_family?: "sans" | "mono" | string;
  show_countdown?: boolean;
  show_audio_preview?: boolean;
  show_socials?: boolean;
  background_type?: string;
  background_color?: string;
}

export interface SmartLinkData {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  slug: string;
  upc?: string | null;
  release_date?: string | null;
  release_type?: string;
  genre?: string;
  label_name?: string;
  description?: string | null;
  is_out_now: boolean;
  is_verified_artist?: boolean;
  template: string;
  preview_audio_url?: string | null;
  lyrics_snippet?: string | null;
  collab_artist?: string | null;
  fan_gate_target?: number | null;
  fan_gate_title?: string | null;
  fan_gate_content?: string | null;
  hype_count?: number;
  presaves_count?: number;
  social_links?: Array<{ platform: string; url: string }>;
  design_config?: SmartLinkDesignConfig;
  owner_profile?: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    is_artist_verified?: boolean;
    featured_artifact?: {
      item_id?: string;
      item_name?: string;
      specimen_key?: string;
      name?: string;
      rarity: string;
      specimen_code?: string;
      serial?: number;
      image_url?: string;
    } | null;
  } | null;
}

interface PublicSmartLinkProps {
  link: SmartLinkData;
  platforms: PlatformItem[];
  isPreview?: boolean;
}

export default function PublicSmartLink({
  link,
  platforms,
  isPreview = false,
}: PublicSmartLinkProps) {
  const theme = getSmartLinkTheme(link.template);
  const cfg = link.design_config || {};

  const accentColor = cfg.accent_color || theme.accentHex || "#00F0FF";
  const coverBlur = typeof cfg.cover_blur === "number" ? cfg.cover_blur : 64;
  const radiusCls =
    cfg.button_radius === "none"
      ? "rounded-none"
      : cfg.button_radius === "full"
      ? "rounded-full"
      : "rounded-2xl";
  const fontCls = cfg.font_family === "mono" ? "font-mono" : "font-sans";
  const showCountdown = cfg.show_countdown !== false;
  const showAudio = cfg.show_audio_preview !== false;
  const showSocials = cfg.show_socials !== false;

  const enabledPlatforms = (platforms || []).filter(
    (p) => p && p.is_enabled !== false && p.url && p.url.trim().length > 0
  );

  // Audio Preview Player State (15-second snippet + auto-lookup + WebAudio synth fallback)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(
    link.preview_audio_url || null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0..15 seconds
  const [spectrumBars, setSpectrumBars] = useState<number[]>(
    Array.from({ length: 20 }, (_, i) => 24 + ((i * 19) % 45))
  );

  // Hype Reaction & Lyrics State
  const [hypeCount, setHypeCount] = useState<number>(Number(link.hype_count || 0));
  const [hypeBurst, setHypeBurst] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  // Live Release Countdown
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Modals: Share / QR & Pre-Save
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showPresaveModal, setShowPresaveModal] = useState(false);
  const [presaveEmail, setPresaveEmail] = useState("");
  const [presaveStatus, setPresaveStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [presaveError, setPresaveError] = useState("");
  const [presaveCount, setPresaveCount] = useState(link.presaves_count || 0);

  // Track Page View once per mount on real public pages
  useEffect(() => {
    if (isPreview || !link.id || link.id.startsWith("preview")) return;
    fetch("/api/link/analytics-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smart_link_id: link.id,
        event_type: "view",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    }).catch(() => {});
  }, [link.id, isPreview]);

  // Countdown tick if pre-release date is in future
  useEffect(() => {
    if (link.is_out_now || !link.release_date || !showCountdown) {
      setCountdown(null);
      return;
    }

    const target = new Date(link.release_date).getTime();
    if (Number.isNaN(target)) return;

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [link.is_out_now, link.release_date, showCountdown]);

  const handlePlatformClick = (plat: PlatformItem) => {
    if (!isPreview && link.id && !link.id.startsWith("preview")) {
      try {
        fetch("/api/link/analytics-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            smart_link_id: link.id,
            event_type: "click",
            platform_key: plat.platform_key,
          }),
        }).catch(() => {});
      } catch {}
    }
  };

  const stopAudioPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (synthCtxRef.current) {
      try {
        synthCtxRef.current.close();
      } catch {}
      synthCtxRef.current = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
  };

  // Auto-resolve iTunes 30s preview URL if no explicit preview_audio_url was saved
  useEffect(() => {
    if (link.preview_audio_url) {
      setResolvedAudioUrl(link.preview_audio_url);
      return;
    }
    if (!link.artist || !link.title) return;
    let cancelled = false;
    const term = `${link.artist} ${link.title}`;
    fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`
    )
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.results?.[0]?.previewUrl) {
          setResolvedAudioUrl(d.results[0].previewUrl);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [link.preview_audio_url, link.artist, link.title]);

  // Animate 20-bar neon spectrum while playing
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setSpectrumBars((prev) =>
        prev.map((_, idx) => {
          const wave = Math.sin(Date.now() * 0.012 + idx * 0.65) * 28;
          const jitter = ((idx * 37 + Math.floor(Date.now() / 90)) % 35);
          return Math.max(18, Math.min(100, Math.round(45 + wave + jitter * 0.5)));
        })
      );
    }, 85);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  const startWebAudioSynthPreview = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      synthCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.14, ctx.currentTime);
      master.connect(ctx.destination);

      // Deep sub-bass + atmospheric minor chord arpeggio for 15 seconds
      const notes = [110, 130.81, 164.81, 196.0, 220.0, 261.63];
      const start = ctx.currentTime;
      for (let step = 0; step < 30; step++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = step % 2 === 0 ? "sawtooth" : "triangle";
        const freq = notes[step % notes.length] * (step % 4 === 0 ? 0.5 : 1);
        osc.frequency.setValueAtTime(freq, start + step * 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(920 + (step % 5) * 240, start + step * 0.5);

        gain.gain.setValueAtTime(0.001, start + step * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.22, start + step * 0.5 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, start + step * 0.5 + 0.48);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        osc.start(start + step * 0.5);
        osc.stop(start + step * 0.5 + 0.49);
      }

      setIsPlaying(true);
      const startedAt = Date.now();
      synthTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        if (elapsed >= 15) {
          stopAudioPreview();
        } else {
          setAudioProgress(elapsed);
        }
      }, 100);
    } catch {
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudioPreview();
      return;
    }
    const audio = audioRef.current;
    if (audio && resolvedAudioUrl) {
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          if (synthTimerRef.current) window.clearInterval(synthTimerRef.current);
          synthTimerRef.current = window.setInterval(() => {
            if (!audioRef.current) return;
            const cur = audioRef.current.currentTime;
            if (cur >= 15) {
              stopAudioPreview();
            } else {
              setAudioProgress(cur);
            }
          }, 100);
        })
        .catch(() => {
          startWebAudioSynthPreview();
        });
    } else {
      startWebAudioSynthPreview();
    }
  };

  const handleHypeReaction = () => {
    setHypeCount((c) => c + 1);
    setHypeBurst(true);
    window.setTimeout(() => setHypeBurst(false), 650);

    if (!isPreview && link.id && !link.id.startsWith("preview")) {
      fetch("/api/link/analytics-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smart_link_id: link.id,
          event_type: "hype",
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (typeof d?.hypeCount === "number") {
            setHypeCount(d.hypeCount);
          }
        })
        .catch(() => {});
    }
  };

  const publicUrl =
    typeof window !== "undefined"
      ? window.location.href
      : getSmartLinkUrl(link.slug);

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(publicUrl);
    setCopiedUrl(true);
    window.setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePresaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presaveEmail.trim() || !presaveEmail.includes("@")) {
      setPresaveError("Введите корректный e-mail");
      return;
    }
    setPresaveStatus("loading");
    setPresaveError("");
    try {
      const res = await fetch("/api/link/presave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smart_link_id: link.id,
          email: presaveEmail.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setPresaveStatus("error");
        setPresaveError(json.error || "Ошибка сохранения Pre-save");
        return;
      }
      setPresaveStatus("done");
      setPresaveCount((c) => c + 1);
    } catch {
      setPresaveStatus("error");
      setPresaveError("Сбой сети. Попробуйте снова.");
    }
  };

  return (
    <div
      className={`relative min-h-[100svh] w-full bg-[#040307] text-white overflow-x-hidden flex flex-col items-center justify-between py-8 sm:py-12 px-4 ${fontCls}`}
      style={{
        backgroundColor: cfg.background_color || "#040307",
      }}
    >
      {/* Subtle Template Particles / FX Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90">
        <ThemeAmbientBackground
          theme={theme}
          coverUrl={cfg.background_type === "solid" ? undefined : link.cover_url}
        />
      </div>

      {/* Full-bleed Atmospheric Cover Backdrop controlled by design_config.cover_blur */}
      {link.cover_url && cfg.background_type !== "solid" && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <img
            src={link.cover_url}
            alt=""
            className="w-full h-full object-cover scale-125 opacity-35 transition-all duration-700"
            style={{
              filter: `blur(${Math.max(8, coverBlur)}px) saturate(1.35)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 22%, ${accentColor}26 0%, rgba(4,3,7,0.78) 55%, rgba(4,3,7,0.96) 100%)`,
            }}
          />
        </div>
      )}

      {/* Top Subtle Action Header */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between gap-2 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 border border-white/15 backdrop-blur-md font-mono text-[9px] uppercase tracking-[0.2em] text-white/75">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <span>{link.is_out_now ? "OUT NOW" : "PRE-SAVE MODE"}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 backdrop-blur-md text-white/80 hover:text-white transition cursor-pointer"
            title="QR-код и ссылка"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 backdrop-blur-md font-mono text-[10px] uppercase tracking-wider text-white/85 transition cursor-pointer"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скопировано</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Поделиться</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Central Music Release Card */}
      <main className="relative z-10 w-full max-w-md my-auto space-y-6">
        {/* Artwork Frame (Uncropped 1:1 with Studio Lighting Rim) */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl blur-2xl opacity-45 group-hover:opacity-65 transition-opacity duration-500"
              style={{ backgroundColor: accentColor }}
            />
            <div
              className={`relative w-56 h-56 sm:w-64 sm:h-64 overflow-hidden border border-white/25 bg-[#08060D] shadow-[0_28px_70px_rgba(0,0,0,0.85)] ${
                cfg.button_radius === "none" ? "rounded-none" : "rounded-2xl"
              }`}
            >
              <img
                src={link.cover_url || "/logo.png"}
                alt={`${link.artist} — ${link.title}`}
                className="w-full h-full object-contain bg-black"
              />

              {/* Live 15s Audio Play Button & Spectrum Overlay on Cover */}
              {showAudio && (
                <>
                  <button
                    type="button"
                    onClick={toggleAudio}
                    title={isPlaying ? "Остановить 15-сек сниппет" : "Слушать 15-сек сниппет"}
                    className="absolute bottom-3 right-3 z-20 w-11 h-11 rounded-full flex items-center justify-center text-[#050407] shadow-[0_0_25px_rgba(0,0,0,0.85)] transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  {isPlaying && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center gap-1 px-4 pb-3">
                      {spectrumBars.slice(0, 14).map((val, i) => (
                        <span
                          key={i}
                          className="w-1.5 rounded-full transition-all duration-100"
                          style={{
                            height: `${Math.max(18, Math.round(val * 0.45))}px`,
                            backgroundColor: i % 2 === 0 ? accentColor : "#B46BFF",
                            boxShadow: `0 0 8px ${accentColor}`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Release Metadata */}
          <div className="space-y-2 px-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm font-mono uppercase tracking-[0.16em] text-white/85">
              <span>{link.artist}</span>
              {link.collab_artist && (
                <>
                  <span className="text-[#00F0FF] font-bold">×</span>
                  <Link
                    href={
                      link.collab_artist.startsWith("@")
                        ? `/profile/${link.collab_artist.slice(1)}`
                        : `/auth/register?collab=${encodeURIComponent(link.collab_artist)}`
                    }
                    className="text-[#00F0FF] hover:underline inline-flex items-center gap-1"
                    title="Совместный релиз (Collab Link)"
                  >
                    <span>{link.collab_artist}</span>
                  </Link>
                </>
              )}
              {(link.is_verified_artist || link.owner_profile?.is_artist_verified) && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border"
                  style={{
                    borderColor: `${accentColor}66`,
                    backgroundColor: `${accentColor}1A`,
                    color: accentColor,
                  }}
                  title="Верифицированный артист экосистемы CXRNER MUSIC"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>VERIFIED</span>
                </span>
              )}
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-tight">
              {link.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
              <span>{link.release_type || "SINGLE"}</span>
              {link.genre && (
                <>
                  <span>·</span>
                  <span>{link.genre}</span>
                </>
              )}
              {link.label_name && (
                <>
                  <span>·</span>
                  <span>{link.label_name}</span>
                </>
              )}
            </div>

            {/* CXRNER ID Public Profile & Pinned CXRNER DROP Artifact Showcase */}
            {(link.owner_profile?.username || link.owner_profile?.featured_artifact) && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {link.owner_profile?.username && (
                  <Link
                    href={`/profile/${link.owner_profile.username}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-mono text-[10px] text-white/85 transition"
                  >
                    <Sparkles className="w-3 h-3" style={{ color: accentColor }} />
                    <span>CXRNER ID: @{link.owner_profile.username}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </Link>
                )}

                {link.owner_profile?.featured_artifact && (
                  <Link
                    href="/drop"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8737FF]/15 hover:bg-[#8737FF]/25 border border-[#B46BFF]/40 font-mono text-[10px] text-[#E3C8FF] transition"
                    title="Выбитый артефакт артиста в CXRNER DROP"
                  >
                    <span>
                      🏆{" "}
                      {link.owner_profile.featured_artifact.item_name ||
                        link.owner_profile.featured_artifact.name ||
                        "SPECIMEN"}
                    </span>
                    <span className="text-[#00F0FF] font-bold">
                      {link.owner_profile.featured_artifact.specimen_code ||
                        `#${String(link.owner_profile.featured_artifact.serial || 1).padStart(4, "0")}`}
                    </span>
                  </Link>
                )}
              </div>
            )}

            {link.description && (
              <p className="text-xs text-[#D9D9E2]/75 max-w-sm mx-auto pt-1 leading-relaxed">
                {link.description}
              </p>
            )}

            {/* Interactive Fan Hype Reaction + Lyrics Toggle Row */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleHypeReaction}
                className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer select-none ${
                  hypeBurst
                    ? "scale-110 border-[#FF2E93] bg-[#FF2E93]/25 text-white shadow-[0_0_25px_rgba(255,46,147,0.55)]"
                    : "border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white/90"
                }`}
              >
                <span className={hypeBurst ? "animate-bounce" : ""}>🔥</span>
                <span>ОГОНЬ РЕЛИЗУ</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] bg-black/50 border border-white/10 tabular-nums"
                  style={{ color: accentColor }}
                >
                  {hypeCount}
                </span>
              </button>

              {link.lyrics_snippet && (
                <button
                  type="button"
                  onClick={() => setShowLyrics((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] font-mono text-[11px] uppercase tracking-wider text-white/85 transition cursor-pointer"
                >
                  <span>{showLyrics ? "Скрыть текст" : "Текст // Lyrics"}</span>
                </button>
              )}
            </div>

            {/* Viral Fan-Unlock Goal Progress Card */}
            {Boolean(link.fan_gate_target && Number(link.fan_gate_target) > 0) && (
              <div className="w-full max-w-sm mx-auto mt-3 p-3.5 rounded-2xl border border-[#F59E0B]/35 bg-gradient-to-br from-[#F59E0B]/12 via-[#090612]/90 to-[#8737FF]/12 text-left space-y-2.5 shadow-[0_12px_35px_rgba(0,0,0,0.65)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FBBF24] font-bold">
                    {hypeCount >= Number(link.fan_gate_target)
                      ? "🔓 БОНУС РАЗБЛОКИРОВАН ФАНАТАМИ!"
                      : "🔒 FAN-UNLOCK // ЦЕЛЬ СООБЩЕСТВА"}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-white tabular-nums px-2 py-0.5 rounded-full bg-black/50 border border-white/10">
                    🔥 {hypeCount} / {link.fan_gate_target}
                  </span>
                </div>

                <p className="text-xs font-bold text-white leading-snug">
                  {link.fan_gate_title || "Секретный эксклюзив от артиста"}
                </p>

                <div className="h-2 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FF2E93] to-[#00F0FF] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((hypeCount / Math.max(1, Number(link.fan_gate_target))) * 100)
                      )}%`,
                    }}
                  />
                </div>

                {hypeCount >= Number(link.fan_gate_target) ? (
                  <div className="p-2.5 rounded-xl bg-black/65 border border-[#00F0FF]/40 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#00F0FF] font-bold truncate select-all">
                      {link.fan_gate_content || "CXRNER-SECRET-UNLOCKED"}
                    </span>
                    {link.fan_gate_content?.startsWith("http") ? (
                      <a
                        href={link.fan_gate_content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-[#00F0FF] text-[#050407] font-mono text-[10px] font-bold uppercase tracking-wider shrink-0"
                      >
                        Открыть
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(link.fan_gate_content || "");
                        }}
                        className="px-3 py-1 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                      >
                        Копировать
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="font-mono text-[10px] text-white/60">
                    Жми «🔥 ОГОНЬ РЕЛИЗУ» и делись ссылкой с друзьями — осталось{" "}
                    <span className="text-[#FBBF24] font-bold">
                      {Math.max(0, Number(link.fan_gate_target) - hypeCount)} 🔥
                    </span>{" "}
                    до открытия!
                  </p>
                )}
              </div>
            )}

            {/* Expandable Lyrics / Punchline Card */}
            {link.lyrics_snippet && showLyrics && (
              <div className="mt-3 p-4 rounded-2xl border border-white/15 bg-black/65 backdrop-blur-xl text-left space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold"
                    style={{ color: accentColor }}
                  >
                    LYRICS // ФРАГМЕНТ ТЕКСТА
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `«${link.lyrics_snippet}» — ${link.artist} (${link.title})`
                      );
                      setCopiedLyrics(true);
                      window.setTimeout(() => setCopiedLyrics(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-white/65 hover:text-white transition cursor-pointer"
                  >
                    {copiedLyrics ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Цитировать</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-sans text-xs sm:text-sm text-white/90 whitespace-pre-line leading-relaxed italic">
                  {link.lyrics_snippet}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 15-Second Audio Snippet Player with Live Neon Spectrum Visualizer */}
        {showAudio && (
          <div
            className={`p-3.5 bg-white/[0.06] border border-white/15 backdrop-blur-xl flex items-center justify-between gap-3 ${radiusCls}`}
          >
            {resolvedAudioUrl && (
              <audio
                ref={audioRef}
                src={resolvedAudioUrl}
                onEnded={() => stopAudioPreview()}
                preload="metadata"
              />
            )}
            <button
              type="button"
              onClick={toggleAudio}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#050407] shrink-0 transition hover:scale-105 cursor-pointer shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-white/85">
                <span className="truncate">
                  {isPlaying ? "⚡ СНИППЕТ ИГРАЕТ (15 СЕК)" : "СЛУШАТЬ 15-СЕК ПРЕВЬЮ ТРЕКА"}
                </span>
                <span className="tabular-nums text-white/60 shrink-0">
                  0:{String(Math.min(15, Math.floor(audioProgress))).padStart(2, "0")} / 0:15
                </span>
              </div>
              <div className="flex items-end gap-1 h-4 mt-1.5">
                {spectrumBars.map((barHeight, i) => {
                  const pct = (audioProgress / 15) * spectrumBars.length;
                  const isPassed = isPlaying && i <= pct;
                  return (
                    <span
                      key={i}
                      className="flex-1 rounded-full transition-all duration-100"
                      style={{
                        height: `${isPlaying ? barHeight : 25 + ((i * 17) % 45)}%`,
                        backgroundColor:
                          isPassed || i % 3 === 0 ? accentColor : "rgba(255,255,255,0.3)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pre-save Countdown Engine */}
        {countdown && (
          <div className="cxr-panel rounded-2xl p-4 space-y-3 text-center">
            <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/65">
              <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>ДО ПРЕМЬЕРЫ РЕЛИЗА</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: countdown.days, label: "ДНЕЙ" },
                { val: countdown.hours, label: "ЧАС" },
                { val: countdown.minutes, label: "МИН" },
                { val: countdown.seconds, label: "СЕК" },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="py-2 rounded-xl bg-white/[0.04] border border-white/10"
                >
                  <div className="font-display font-black text-xl text-white tabular-nums">
                    {String(cell.val).padStart(2, "0")}
                  </div>
                  <div className="font-mono text-[8px] tracking-widest text-white/50">
                    {cell.label}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPresaveModal(true)}
              className={`w-full py-3 px-5 font-mono text-xs font-extrabold uppercase tracking-wider text-[#050407] flex items-center justify-center gap-2 transition hover:brightness-110 cursor-pointer ${radiusCls}`}
              style={{ backgroundColor: accentColor }}
            >
              <Bell className="w-4 h-4" />
              <span>Сделать Pre-save ({presaveCount})</span>
            </button>
          </div>
        )}

        {/* Streaming Platforms Stack */}
        <div className="space-y-2.5">
          {enabledPlatforms.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white/[0.04] border border-white/10 font-mono text-xs text-white/60">
              Ссылки на стриминговые площадки готовятся к публикации.
            </div>
          ) : (
            enabledPlatforms.map((plat) => {
              const meta = getPlatformVisualMeta(plat.platform_key);
              return (
                <a
                  key={plat.platform_key + plat.platform_name}
                  href={plat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePlatformClick(plat)}
                  className={`group flex items-center justify-between gap-3 p-3.5 sm:p-4 border transition-all duration-200 backdrop-blur-xl hover:-translate-y-0.5 ${radiusCls} ${
                    cfg.button_style === "outline"
                      ? "bg-black/40 border-white/25 hover:border-white/60"
                      : "bg-[#0C0915]/82 border-white/14 hover:bg-[#151123]/95 hover:border-white/35 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        background: meta.bgGradient,
                        color: meta.fgColor,
                      }}
                    >
                      <PlatformLogo platformKey={plat.platform_key} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm text-white truncate">
                        {plat.platform_name || meta.name}
                      </div>
                      <div className="font-mono text-[10px] text-white/45 uppercase">
                        OFFICIAL DSP
                      </div>
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 transition"
                    style={{
                      backgroundColor: `${accentColor}22`,
                      color: accentColor,
                      border: `1px solid ${accentColor}55`,
                    }}
                  >
                    <span>{plat.button_text || (link.is_out_now ? "Слушать" : "Pre-save")}</span>
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </a>
              );
            })
          )}
        </div>

        {/* Social Links Row */}
        {showSocials && link.social_links && link.social_links.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {link.social_links.map((s, idx) => (
              <a
                key={`${s.platform}-${idx}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/12 font-mono text-[10px] uppercase tracking-wider text-white/80 hover:text-white transition"
              >
                <span>{s.platform}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Footer Attribution */}
      <footer className="relative z-10 pt-10 pb-2 text-center">
        <Link
          href="/link"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 border border-white/10 hover:border-white/25 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white transition"
        >
          <Sparkles className="w-3 h-3" style={{ color: accentColor }} />
          <span>POWERED BY CXRNER LINK</span>
        </Link>
      </footer>

      {/* QR & Share Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm cxr-panel-chrome rounded-3xl p-6 text-center space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-white/75">
                QR-КОД РЕЛИЗА
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  publicUrl
                )}`}
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[11px] text-white/70 truncate px-2">
                {publicUrl}
              </p>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full btn-void-primary py-3 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUrl ? "Ссылка скопирована" : "Скопировать ссылку"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-save Email Capture Modal */}
      {showPresaveModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowPresaveModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm cxr-panel-chrome rounded-3xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-white/75">
                PRE-SAVE // УВЕДОМЛЕНИЕ
              </span>
              <button
                type="button"
                onClick={() => setShowPresaveModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {presaveStatus === "done" ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-display font-bold text-lg text-white">Pre-save оформлен!</h3>
                <p className="text-xs text-[#D9D9E2]/70">
                  Вы получите моментальное уведомление в момент выхода релиза.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePresaveSubmit} className="space-y-4">
                <p className="text-xs text-[#D9D9E2]/75 leading-relaxed">
                  Оставьте свой email, чтобы не пропустить премьеру «{link.title}» от {link.artist}.
                </p>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={presaveEmail}
                    onChange={(e) => setPresaveEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 focus:border-[#00F0FF] text-white text-xs font-mono outline-none"
                  />
                </div>
                {presaveError && (
                  <p className="text-xs text-rose-400 font-mono">{presaveError}</p>
                )}
                <button
                  type="submit"
                  disabled={presaveStatus === "loading"}
                  className="w-full py-3 rounded-full bg-white text-[#050407] font-mono text-xs font-extrabold uppercase tracking-wider hover:brightness-95 transition disabled:opacity-50"
                >
                  {presaveStatus === "loading" ? "Сохранение..." : "Подтвердить Pre-save"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
