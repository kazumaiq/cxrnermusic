"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Flame, Pause, Play, Sparkles, Trophy } from "lucide-react";

interface RadarItem {
  id: string;
  slug: string;
  title: string;
  artist: string;
  collab_artist?: string | null;
  cover_url: string;
  genre?: string | null;
  hype_count: number;
  views_count: number;
  clicks_count: number;
  is_verified_artist?: boolean;
  preview_audio_url?: string | null;
}

const FALLBACK_RADAR_RELEASES: RadarItem[] = [
  {
    id: "demo-sadness",
    slug: "the-sadness-of-reality",
    title: "The Sadness of Reality",
    artist: "NEIMEKS",
    cover_url: "/covers/the-sadness-of-reality.jpg",
    genre: "Electronic",
    hype_count: 142,
    views_count: 980,
    clicks_count: 410,
    is_verified_artist: true,
  },
  {
    id: "demo-void",
    slug: "chrome-echoes",
    title: "CHROME ECHOES",
    artist: "KAZUMA",
    collab_artist: "@arier",
    cover_url: "/logo.png",
    genre: "Phonk / Trap",
    hype_count: 98,
    views_count: 640,
    clicks_count: 275,
    is_verified_artist: true,
  },
  {
    id: "demo-night",
    slug: "obsidian-drift",
    title: "OBSIDIAN DRIFT",
    artist: "CXRNER ARCHIVE",
    cover_url: "/logo.png",
    genre: "Hyperpop",
    hype_count: 74,
    views_count: 490,
    clicks_count: 195,
    is_verified_artist: true,
  },
];

export default function RadarReleaseChart() {
  const [items, setItems] = useState<RadarItem[]>(FALLBACK_RADAR_RELEASES);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [cxpToast, setCxpToast] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/link/radar")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const dbItems: RadarItem[] = Array.isArray(data?.links) ? data.links : [];
        if (dbItems.length > 0) {
          const existingSlugs = new Set(dbItems.map((i) => i.slug));
          const merged = [
            ...dbItems,
            ...FALLBACK_RADAR_RELEASES.filter((f) => !existingSlugs.has(f.slug)),
          ].slice(0, 20);
          setItems(merged);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleTogglePlay = async (item: RadarItem) => {
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    let url = item.preview_audio_url || "";
    if (!url) {
      try {
        const q = encodeURIComponent(`${item.artist} ${item.title}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
        const json = await res.json();
        url = json?.results?.[0]?.previewUrl || "";
      } catch {}
    }

    if (!url) return;

    const audio = new Audio(url);
    audio.volume = 0.75;
    audioRef.current = audio;
    setPlayingId(item.id);
    audio.play().catch(() => setPlayingId(null));
    setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        setPlayingId(null);
      }
    }, 15000);
    audio.onended = () => setPlayingId(null);
  };

  const handleVote = async (item: RadarItem) => {
    if (votingId) return;
    setVotingId(item.id);

    setItems((prev) =>
      prev
        .map((x) => (x.id === item.id ? { ...x, hype_count: (x.hype_count || 0) + 1 } : x))
        .sort((a, b) => (b.hype_count || 0) - (a.hype_count || 0))
    );
    setVotedIds((prev) => ({ ...prev, [item.id]: true }));

    try {
      const res = await fetch("/api/link/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: item.id }),
      });
      const data = await res.json();
      if (data?.cxpAwarded > 0) {
        setCxpToast(`+${data.cxpAwarded} CXP начислено за поддержку релиза!`);
        setTimeout(() => setCxpToast(null), 3200);
      }
    } catch {
    } finally {
      setVotingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-[#8737FF]/35 bg-gradient-to-b from-[#0C0818]/95 via-[#07050E]/95 to-[#050409] p-5 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.8)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/40 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF73B5]">
            <Flame className="w-3.5 h-3.5 text-[#FF2E93]" />
            <span>CXRNER RADAR // LIVE TOP 20 CHART</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-white">
            ЧАРТ РЕЛИЗОВ <span className="text-chrome-gradient">CXRNER RADAR</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/70 max-w-2xl">
            Голосуйте 🔥 за лучшие треки резидентов и получайте{" "}
            <span className="text-[#00F0FF] font-bold">+5 CXP</span> на баланс CXRNER DROP за поддержку артистов.
          </p>
        </div>

        <Link
          href="/dashboard/links/new"
          className="px-5 py-3 rounded-2xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Добавить свой релиз в чарт</span>
        </Link>
      </div>

      {cxpToast && (
        <div className="p-3.5 rounded-2xl border border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#00F0FF] font-mono text-xs font-bold flex items-center justify-between animate-pulse">
          <span>⚡ {cxpToast}</span>
          <Link href="/drop" className="underline text-white ml-3">
            Открыть кейсы →
          </Link>
        </div>
      )}

      <div className="space-y-2.5">
        {items.slice(0, 10).map((item, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const isVoted = Boolean(votedIds[item.id]);
          const isPlaying = playingId === item.id;

          return (
            <div
              key={item.id}
              className={`group flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition ${
                rank === 1
                  ? "border-[#F59E0B]/45 bg-gradient-to-r from-[#F59E0B]/12 via-white/[0.03] to-transparent"
                  : rank === 2
                  ? "border-[#00F0FF]/35 bg-gradient-to-r from-[#00F0FF]/10 via-white/[0.02] to-transparent"
                  : rank === 3
                  ? "border-[#B46BFF]/35 bg-gradient-to-r from-[#8737FF]/12 via-white/[0.02] to-transparent"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-black flex items-center justify-center shrink-0 border ${
                    rank === 1
                      ? "bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#FBBF24]"
                      : rank === 2
                      ? "bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]"
                      : rank === 3
                      ? "bg-[#8737FF]/20 border-[#B46BFF]/45 text-[#D8B4FE]"
                      : "bg-black/40 border-white/10 text-white/55"
                  }`}
                >
                  {rank === 1 ? <Trophy className="w-4 h-4 text-[#FBBF24]" /> : `#${String(rank).padStart(2, "0")}`}
                </div>

                {/* Cover + 15s Preview Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePlay(item)}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-black border border-white/15 shrink-0 cursor-pointer group/cover"
                  title="Слушать 15-сек сниппет"
                >
                  <img
                    src={item.cover_url || "/logo.png"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition">
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-[#00F0FF]" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </div>
                </button>

                {/* Title & Artist */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/link/${item.slug}`}
                      className="font-display font-bold text-sm sm:text-base text-white hover:text-[#00F0FF] truncate transition"
                    >
                      {item.title}
                    </Link>
                    {isTop3 && (
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-white/10 font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">
                        HOT
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-white/65 truncate">
                    <span>{item.artist}</span>
                    {item.collab_artist && (
                      <>
                        <span className="text-[#00F0FF]">×</span>
                        <span className="text-[#00F0FF]">{item.collab_artist}</span>
                      </>
                    )}
                    {item.is_verified_artist && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                    )}
                    {item.genre && (
                      <span className="text-white/40 hidden sm:inline">· {item.genre}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Vote (+5 CXP) & Open Smart Link */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleVote(item)}
                  disabled={votingId === item.id}
                  className={`px-3 sm:px-4 py-2 rounded-xl border font-mono text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    isVoted
                      ? "border-[#FF2E93]/60 bg-[#FF2E93]/20 text-white shadow-[0_0_20px_rgba(255,46,147,0.35)]"
                      : "border-white/15 bg-white/[0.05] hover:bg-[#FF2E93]/15 hover:border-[#FF2E93]/45 text-white"
                  }`}
                >
                  <span>🔥</span>
                  <span className="tabular-nums">{item.hype_count || 0}</span>
                  <span className="hidden md:inline text-[10px] text-[#00F0FF] ml-1">+5 CXP</span>
                </button>

                <Link
                  href={`/link/${item.slug}`}
                  className="p-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.12] text-white/80 hover:text-white transition"
                  title="Открыть смарт-ссылку релиза"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center font-mono text-xs text-white/45 py-2">
          Синхронизация живого чарта CXRNER RADAR...
        </div>
      )}
    </section>
  );
}
