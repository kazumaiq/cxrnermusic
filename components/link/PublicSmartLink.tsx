"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Share2,
  QrCode,
  Check,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
  Mail,
  Disc3,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
} from "lucide-react";
import { getSmartLinkTheme } from "@/lib/smartLinkThemes";
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
  template: "MINIMAL" | "CYBER" | "CINEMATIC" | "BRUTAL" | string;
  design_config?: any;
  social_links?: Array<{ platform: string; url: string }>;
  extra_content?: { audio_preview_url?: string; bio_text?: string; video_embed_url?: string };
  is_verified_artist?: boolean;
}

interface PublicSmartLinkProps {
  link: SmartLinkData;
  platforms: PlatformItem[];
}

export default function PublicSmartLink({ link, platforms }: PublicSmartLinkProps) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPresaveModal, setShowPresaveModal] = useState(false);
  const [presaveEmail, setPresaveEmail] = useState("");
  const [presaveSuccess, setPresaveSuccess] = useState(false);
  const [presaveLoading, setPresaveLoading] = useState(false);
  const [presaveError, setPresaveError] = useState("");

  // Audio Preview State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Record Page View on Mount
  useEffect(() => {
    fetch("/api/link/analytics-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smart_link_id: link.id,
        event_type: "view",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    }).catch(() => {});
  }, [link.id]);

  // 2. Countdown Timer
  useEffect(() => {
    if (link.is_out_now || !link.release_date) return;

    const targetDate = new Date(link.release_date).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [link.is_out_now, link.release_date]);

  // 3. Track Platform Clicks
  const handlePlatformClick = (platform: PlatformItem) => {
    fetch("/api/link/analytics-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smart_link_id: link.id,
        event_type: "click",
        platform_key: platform.platform_key,
      }),
    }).catch(() => {});
  };

  // 4. Copy Link to Clipboard
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 5. Pre-save Submission
  const handlePresaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presaveEmail) return;

    setPresaveLoading(true);
    setPresaveError("");

    try {
      const res = await fetch("/api/link/presave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smart_link_id: link.id,
          email: presaveEmail,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setPresaveError(data.error || "Ошибка сохранения");
      } else {
        setPresaveSuccess(true);
      }
    } catch {
      setPresaveError("Сбой сети. Попробуйте снова.");
    } finally {
      setPresaveLoading(false);
    }
  };

  // 6. Draw QR Code on Canvas
  useEffect(() => {
    if (!showQrModal || !qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Procedural Stylized QR Mock with center CXRNER logo
    ctx.fillStyle = "#090611";
    const size = 10;
    const grid = 24;
    const pad = (width - grid * size) / 2;

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        // Draw position markers at corners
        const isCorner1 = r < 7 && c < 7;
        const isCorner2 = r < 7 && c >= grid - 7;
        const isCorner3 = r >= grid - 7 && c < 7;
        const isCenter = r >= 10 && r <= 13 && c >= 10 && c <= 13;

        if (isCorner1 || isCorner2 || isCorner3) {
          const border = r === 0 || r === 6 || c === 0 || c === 6 ||
                         (r === 0 && c >= grid - 7) || (r === 6 && c >= grid - 7) || (c === grid - 1) || (c === grid - 7) ||
                         (r >= grid - 7 && (c === 0 || c === 6 || r === grid - 1 || r === grid - 7));
          const inner = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                        (r >= 2 && r <= 4 && c >= grid - 5 && c <= grid - 3) ||
                        (r >= grid - 5 && r <= grid - 3 && c >= 2 && c <= 4);
          if (border || inner) {
            ctx.fillRect(pad + c * size, pad + r * size, size, size);
          }
        } else if (!isCenter) {
          // Semi-random data points derived from slug characters
          const hash = (r * 37 + c * 59 + link.slug.charCodeAt((r + c) % link.slug.length)) % 10;
          if (hash > 4) {
            ctx.fillRect(pad + c * size, pad + r * size, size, size);
          }
        }
      }
    }

    // Draw violet center badge
    ctx.fillStyle = "#8737FF";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CXR", width / 2, height / 2);
  }, [showQrModal, link.slug]);

  // Visual Theme Specs
  const theme = getSmartLinkTheme(link.template);
  const enabledPlatforms = platforms.filter((p) => p.is_enabled !== false);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center pt-8 pb-16 sm:py-14 px-4 overflow-x-clip selection:bg-[#8737FF] selection:text-white">
      {/* 1. Immersive Animated Theme Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050407]">
        <ThemeAmbientBackground theme={theme} coverUrl={link.cover_url} />
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-md flex items-center justify-between pb-5">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-[#D9D9E2]/70 hover:text-white transition"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8737FF] group-hover:scale-125 transition shadow-[0_0_8px_#8737FF]" />
          <span>CXRNER LINK</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            title="Показать QR-код"
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#D9D9E2] transition"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopyLink}
            title="Скопировать ссылку"
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#D9D9E2] transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00F0FF]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* 3. Main Smart Link Card Container */}
      <main className={`relative z-10 w-full max-w-md rounded-3xl p-4 sm:p-8 ${theme.cardClass} space-y-5 sm:space-y-6`}>
        {/* Cover Art Presentation */}
        <div className={`relative group/cover w-full aspect-square overflow-hidden bg-black/40 select-none ${theme.coverFrameClass}`}>
          <img
            src={link.cover_url}
            alt={`${link.artist} — ${link.title}`}
            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Out Now or Pre-save Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {link.is_out_now ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border font-mono text-[10px] font-bold uppercase tracking-widest shadow-lg"
                style={{ borderColor: `${theme.accentHex}70`, color: theme.secondaryHex }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: theme.secondaryHex }}
                />
                OUT NOW
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border font-mono text-[10px] font-bold uppercase tracking-widest shadow-lg"
                style={{ borderColor: `${theme.accentHex}70`, color: theme.accentHex }}
              >
                <Clock className="w-3 h-3" style={{ color: theme.accentHex }} />
                PRE-SAVE
              </span>
            )}
          </div>

          {/* Audio Preview Pill (if audio exists) */}
          {link.extra_content?.audio_preview_url && (
            <button
              onClick={() => {
                if (!audioRef.current) return;
                if (isPlayingAudio) {
                  audioRef.current.pause();
                  setIsPlayingAudio(false);
                } else {
                  audioRef.current.play();
                  setIsPlayingAudio(true);
                }
              }}
              className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] uppercase tracking-wider hover:bg-[#8737FF] transition shadow-lg"
            >
              {isPlayingAudio ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
              <span>{isPlayingAudio ? "Пауза" : "Превью"}</span>
              <audio
                ref={audioRef}
                src={link.extra_content.audio_preview_url}
                onEnded={() => setIsPlayingAudio(false)}
              />
            </button>
          )}
        </div>

        {/* Release Metadata */}
        <div className="text-center space-y-1.5 pt-1">
          <h1 className={`text-2xl sm:text-3xl leading-tight ${theme.titleClass}`}>
            {link.title}
          </h1>

          <div className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm ${theme.artistClass}`}>
            <span>{link.artist}</span>
            {link.is_verified_artist && (
              <span title="Verified Artist" className="inline-flex items-center">
                <ShieldCheck className="w-4 h-4" style={{ color: theme.accentHex }} />
              </span>
            )}
          </div>

          {link.label_name && (
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D9D9E2]/50 pt-0.5">
              {link.label_name}
            </p>
          )}

          {link.description && (
            <p className="text-xs text-[#D9D9E2]/75 pt-2 leading-relaxed max-w-sm mx-auto font-sans">
              {link.description}
            </p>
          )}
        </div>

        {/* Pre-save Live Countdown (if not out now) */}
        {!link.is_out_now && timeLeft && (
          <div className={`p-3.5 rounded-2xl border backdrop-blur-md text-center space-y-2 ${theme.countdownCardClass}`}>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] block" style={{ color: theme.accentHex }}>
              // ДО РЕЛИЗА ОСТАЛОСЬ
            </span>
            <div className="grid grid-cols-4 gap-2 font-mono text-center">
              <div className="p-1.5 rounded-xl bg-black/40 border border-white/10">
                <p className="font-heavy text-xl text-white leading-tight">{timeLeft.days}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">Дней</p>
              </div>
              <div className="p-1.5 rounded-xl bg-black/40 border border-white/10">
                <p className="font-heavy text-xl text-white leading-tight">{timeLeft.hours}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">Часов</p>
              </div>
              <div className="p-1.5 rounded-xl bg-black/40 border border-white/10">
                <p className="font-heavy text-xl text-white leading-tight">{timeLeft.minutes}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">Мин</p>
              </div>
              <div className="p-1.5 rounded-xl bg-black/40 border border-white/10">
                <p className="font-heavy text-xl text-white leading-tight">{timeLeft.seconds}</p>
                <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">Сек</p>
              </div>
            </div>

            <button
              onClick={() => setShowPresaveModal(true)}
              className={`w-full mt-2 py-2.5 px-4 rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 ${theme.presaveBtnClass}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Оформить Pre-save</span>
            </button>
          </div>
        )}

        {/* Music Platforms Streaming List */}
        <div className="space-y-2.5 pt-1">
          {enabledPlatforms.length === 0 ? (
            <div className="p-6 text-center border border-white/10 rounded-2xl bg-white/5 font-mono text-xs text-[#D9D9E2]/60">
              Ссылки на стриминги появятся в день выхода релиза
            </div>
          ) : (
            enabledPlatforms.map((platform) => {
              const meta = getPlatformVisualMeta(platform.platform_key);
              const actionLabel = platform.button_text || (link.is_out_now ? "Слушать" : "Pre-save");

              return (
                <a
                  key={platform.platform_key}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePlatformClick(platform)}
                  className={`group flex items-center justify-between gap-2 p-2.5 sm:p-3.5 transition-all duration-200 select-none cursor-pointer ${theme.buttonClass}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: meta.bgGradient,
                        color: meta.fgColor,
                        boxShadow: `0 4px 18px ${meta.glowColor}`,
                      }}
                    >
                      <PlatformLogo platformKey={platform.platform_key} className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                    </div>
                    <span className="font-sans text-xs sm:text-sm tracking-tight text-white font-semibold truncate">
                      {meta.name}
                    </span>
                  </div>

                  <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-sm flex-shrink-0 ${theme.actionPillClass}`}>
                    <span>{actionLabel}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Social Media Links Row */}
        {link.social_links && link.social_links.length > 0 && (
          <div className="pt-2 flex items-center justify-center gap-3">
            {link.social_links.map((s, idx) => (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 flex items-center justify-center text-[#D9D9E2] hover:text-white transition"
              >
                <span className="font-mono text-[10px] uppercase font-bold">{s.platform.slice(0, 2)}</span>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* 4. Footer Branding */}
      <footer className="relative z-10 w-full max-w-md pt-6 text-center space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-[#D9D9E2]/50 hover:text-white transition"
        >
          <span>POWERED BY</span>
          <span className="text-[#B46BFF] font-bold">CXRNER MUSIC</span>
        </Link>
      </footer>

      {/* Pre-save Modal */}
      {showPresaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#B46BFF]/40 bg-[#090611] p-6 sm:p-7 space-y-4 shadow-2xl">
            <button
              onClick={() => {
                setShowPresaveModal(false);
                setPresaveSuccess(false);
                setPresaveError("");
              }}
              className="absolute top-4 right-4 text-[#D9D9E2]/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B46BFF]">
                [PRE-SAVE NOTIFICATION]
              </span>
              <h3 className="font-heavy text-xl uppercase tracking-tight text-white">
                Не пропустите релиз
              </h3>
              <p className="text-xs text-[#D9D9E2]/70">
                Мы пришлём ссылку на прослушивание сразу после полуночи в день премьеры.
              </p>
            </div>

            {presaveSuccess ? (
              <div className="p-4 rounded-2xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-[#00F0FF] mx-auto animate-bounce" />
                <p className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                  Pre-save подтверждён!
                </p>
                <p className="text-[11px] text-[#D9D9E2]/80">
                  Вы первыми услышите трек «{link.title}».
                </p>
              </div>
            ) : (
              <form onSubmit={handlePresaveSubmit} className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60 block mb-1">
                    Ваш Email:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      required
                      placeholder="artist@fan.com"
                      value={presaveEmail}
                      onChange={(e) => setPresaveEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
                    />
                  </div>
                </div>

                {presaveError && (
                  <p className="font-mono text-[10px] text-[#FF2E93]">{presaveError}</p>
                )}

                <button
                  type="submit"
                  disabled={presaveLoading}
                  className="w-full py-3 rounded-xl bg-[#8737FF] hover:bg-[#B46BFF] text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-50"
                >
                  {presaveLoading ? "Сохранение..." : "Подтвердить Pre-save"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xs rounded-3xl border border-white/20 bg-[#090611] p-6 text-center space-y-4 shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-[#D9D9E2]/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B46BFF]">
                [SCAN TO LISTEN]
              </span>
              <h3 className="font-heavy text-lg uppercase tracking-tight text-white">
                {link.title}
              </h3>
            </div>

            <div className="p-3 bg-white rounded-2xl mx-auto inline-block shadow-xl">
              <canvas ref={qrCanvasRef} width={220} height={220} className="rounded-lg" />
            </div>

            <p className="font-mono text-[10px] text-[#D9D9E2]/60">
              Наведите камеру смартфона для быстрого перехода
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
