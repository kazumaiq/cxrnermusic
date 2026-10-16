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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 dark-panel rounded-2xl p-3 sm:p-4 border border-white/10 bg-[#090909]/90">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию трека или артисту..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs sm:text-sm font-mono text-white placeholder:text-neutral-600 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition"
          />
        </div>

        {/* Quick Stats Indicator */}
        <div className="flex items-center gap-2 px-3 font-mono text-xs text-neutral-500 whitespace-nowrap">
          <Disc className="w-3.5 h-3.5 text-neutral-400" />
          <span>Найдено: <strong className="text-white">{filteredReleases.length}</strong> релизов</span>
        </div>
      </div>

      {/* Grid of Releases */}
      {filteredReleases.length === 0 ? (
        <div className="dark-panel rounded-2xl p-12 text-center border border-white/10 bg-[#090909]">
          <Disc className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="font-gothic text-lg font-bold text-white uppercase tracking-wider">Релизы не найдены</p>
          <p className="font-mono text-xs text-neutral-500 mt-1">Попробуйте изменить поисковый запрос</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 px-4 py-2 rounded-full tech-badge font-mono text-xs uppercase tracking-wider text-white hover:border-white transition"
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
                className="group dark-panel rounded-2xl p-4 border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between bg-[#0a0a0a]"
              >
                <div>
                  {/* Album Cover with Overlay Effect */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/60 border border-white/5">
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

                    {/* Subtle Dark Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition" />

                    {/* Floating Label Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[9px] uppercase tracking-widest bg-black/80 border border-white/15 text-neutral-300">
                        [CXR::RELEASE]
                      </span>
                    </div>

                    {/* Play Button Overlay */}
                    <button
                      type="button"
                      onClick={() => setPlayingTrack(isCurrentPlaying ? null : release.title)}
                      className={`absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrentPlaying
                          ? "bg-white text-black scale-100 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                          : "bg-black/80 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black hover:scale-105"
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
                    <h3 className="font-gothic text-base sm:text-lg font-bold text-white group-hover:text-neutral-200 transition truncate">
                      {release.title}
                    </h3>
                    <p className="font-mono text-xs text-neutral-500 font-medium truncate mt-0.5">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 hover:border-white/30 border border-white/10 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white transition"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
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
