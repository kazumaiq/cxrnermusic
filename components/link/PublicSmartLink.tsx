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
  presaves_count?: number;
  social_links?: Array<{ platform: string; url: string }>;
  design_config?: SmartLinkDesignConfig;
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

  // Audio Preview Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
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
            </div>
          </div>

          {/* Release Metadata */}
          <div className="space-y-1.5 px-2">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-mono uppercase tracking-[0.16em] text-white/80">
              <span>{link.artist}</span>
              {link.is_verified_artist && (
                <CheckCircle2
                  className="w-4 h-4 shrink-0"
                  style={{ color: accentColor }}
                />
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

            {link.description && (
              <p className="text-xs text-[#D9D9E2]/75 max-w-sm mx-auto pt-1 leading-relaxed">
                {link.description}
              </p>
            )}
          </div>
        </div>

        {/* Optional Audio Snippet Player */}
        {showAudio && link.preview_audio_url && (
          <div
            className={`p-3.5 bg-white/[0.06] border border-white/15 backdrop-blur-xl flex items-center justify-between gap-3 ${radiusCls}`}
          >
            <audio
              ref={audioRef}
              src={link.preview_audio_url}
              onEnded={() => setIsPlaying(false)}
              preload="metadata"
            />
            <button
              type="button"
              onClick={toggleAudio}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#050407] shrink-0 transition hover:scale-105 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/85 truncate">
                {isPlaying ? "ВОСПРОИЗВЕДЕНИЕ ПРЕВЬЮ" : "АУДИО-ФРАГМЕНТ РЕЛИЗА"}
              </div>
              <div className="flex items-end gap-1 h-3.5 mt-1">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: `${isPlaying ? 35 + ((i * 29) % 65) : 25 + ((i * 17) % 45)}%`,
                      backgroundColor: i % 3 === 0 ? accentColor : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
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
