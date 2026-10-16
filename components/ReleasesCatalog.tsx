"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Disc, ExternalLink, Play, Pause, Sparkles, Filter } from "lucide-react";
import type { ReleaseItem } from "../lib/releases";

interface ReleasesCatalogProps {
  initialReleases: ReleaseItem[];
}

export default function ReleasesCatalog({ initialReleases }: ReleasesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  // Extract unique genres or set common presets
  const genres = ["all", "Phonk", "Hip-Hop", "Electronic", "Trap"];

  const filteredReleases = useMemo(() => {
    return initialReleases.filter((release) => {
      const matchesSearch =
        release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.artist.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [initialReleases, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-panel rounded-2xl p-3 sm:p-4 border border-white/10">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию трека или артисту..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon transition"
          />
        </div>

        {/* Quick Stats Indicator */}
        <div className="flex items-center gap-2 px-3 text-xs text-white/50 whitespace-nowrap">
          <Disc className="w-3.5 h-3.5 text-aqua" />
          <span>Найдено: <strong className="text-white">{filteredReleases.length}</strong> релизов</span>
        </div>
      </div>

      {/* Grid of Releases */}
      {filteredReleases.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <Disc className="w-12 h-12 text-white/20 mx-auto mb-3 animate-pulse" />
          <p className="text-lg font-semibold text-white">Релизы не найдены</p>
          <p className="text-sm text-white/50 mt-1">Попробуйте изменить поисковый запрос</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 px-4 py-2 rounded-full glass-badge text-xs font-semibold text-neon hover:text-white transition"
          >
            Сбросить поиск
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReleases.map((release, index) => {
            const isRemote = release.cover.startsWith("http");
            const isCurrentPlaying = playingTrack === release.title;

            return (
              <article
                key={`${release.title}-${index}`}
                className="group glass-panel rounded-3xl p-4 border border-white/10 hover:border-neon/40 hover:shadow-glow transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Album Cover with Overlay Effect */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/40">
                    {isRemote ? (
                      <img
                        src={release.cover}
                        alt={`${release.title} — ${release.artist}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <Image
                        src={release.cover}
                        alt={`${release.title} — ${release.artist}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}

                    {/* Gradient Fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition" />

                    {/* Floating Label Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-semibold tracking-wider uppercase text-white/80">
                        <Sparkles className="w-2.5 h-2.5 text-neon" />
                        CXRNER RELEASE
                      </span>
                    </div>

                    {/* Play Button Overlay */}
                    <button
                      type="button"
                      onClick={() => setPlayingTrack(isCurrentPlaying ? null : release.title)}
                      className={`absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrentPlaying
                          ? "bg-neon text-night scale-100 shadow-glowStrong"
                          : "bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-neon hover:text-night hover:scale-105"
                      }`}
                      aria-label={`Воспроизвести ${release.title}`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-neonSoft transition truncate">
                      {release.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 font-medium truncate mt-0.5">
                      {release.artist}
                    </p>
                  </div>
                </div>

                {/* DSP Streaming Platform Links */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
                  {release.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-neon/15 hover:border-neon/40 border border-white/10 text-[11px] font-medium text-white/70 hover:text-white transition"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-white/40" />
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
