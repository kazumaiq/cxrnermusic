"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Disc, ExternalLink, Play, Pause, Music, Sparkles } from "lucide-react";
import type { ReleaseItem } from "../lib/releases";

const DEFAULT_RELEASES: ReleaseItem[] = [
  {
    title: "The Sadness of Reality",
    artist: "Neimeks",
    cover: "/images/album-01.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/44422385" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "GET BACK",
    artist: "UNXPLXYA",
    cover: "/images/album-02.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/44088019" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "VK Музыка", href: "https://vk.com/music" },
    ],
  },
  {
    title: "Stream Of Dreams",
    artist: "KXLLVURX",
    cover: "/images/album-03.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/44037417" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "DEMURE",
    artist: "ViRxSdz",
    cover: "/images/album-04.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43225634" },
      { label: "Spotify", "href": "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "Celebrate",
    artist: "UNXPLXYA, ETERNXL SXNNER",
    cover: "/images/album-05.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43863222" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "VK Музыка", href: "https://vk.com/music" },
    ],
  },
  {
    title: "TERANUM",
    artist: "Zarl1t ft, evxlshvdow邪惡",
    cover: "/images/album-06.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43724370" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "Paranoia is everywhere",
    artist: "Neimeks",
    cover: "/images/album-01.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43844944" },
      { label: "Spotify", href: "https://open.spotify.com" },
    ],
  },
  {
    title: "HALLUCINATIONN",
    artist: "DrXer28",
    cover: "/images/album-02.svg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43586186" },
      { label: "Spotify", href: "https://open.spotify.com" },
    ],
  },
];

interface ReleasesCatalogProps {
  initialReleases: ReleaseItem[];
}

export default function ReleasesCatalog({ initialReleases }: ReleasesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const releasesToDisplay =
    initialReleases && initialReleases.length > 0 ? initialReleases : DEFAULT_RELEASES;

  const filteredReleases = useMemo(() => {
    return releasesToDisplay.filter((release) => {
      const matchesSearch =
        release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.artist.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [releasesToDisplay, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl p-4 sm:p-5 border border-purple-500/20 bg-[#0c0c14]/90 backdrop-blur-xl shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию трека или артисту..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs sm:text-sm font-mono text-white placeholder:text-neutral-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
          />
        </div>

        {/* Quick Stats Indicator & Direct Label Link */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-400 whitespace-nowrap">
            <Disc className="w-3.5 h-3.5 text-purple-400" />
            <span>Найдено: <strong className="text-white">{filteredReleases.length}</strong></span>
          </div>

          <a
            href="https://music.yandex.ru/label/5978511"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-xs transition"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Яндекс Музыка</span>
            <ExternalLink className="w-3 h-3 text-purple-400" />
          </a>
        </div>
      </div>

      {/* Grid of Releases */}
      {filteredReleases.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-purple-500/20 bg-[#0c0c14]">
          <Disc className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
          <p className="font-gothic text-lg font-bold text-white uppercase tracking-wider">Релизы не найдены</p>
          <p className="font-mono text-xs text-neutral-400 mt-1">Попробуйте изменить поисковый запрос</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-mono text-xs uppercase tracking-wider text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition"
          >
            Сбросить поиск
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredReleases.map((release, index) => {
            const isRemote = release.cover.startsWith("http");
            const isCurrentPlaying = playingTrack === release.title;

            return (
              <article
                key={`${release.title}-${index}`}
                className="group rounded-2xl p-4 border border-purple-500/15 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between bg-[#0b0b12]/90 backdrop-blur-md hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1"
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
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-30 transition" />

                    {/* Floating Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider bg-black/80 border border-purple-500/30 text-purple-300">
                        CXRNER
                      </span>
                    </div>

                    {/* Play Button Overlay */}
                    <button
                      type="button"
                      onClick={() => setPlayingTrack(isCurrentPlaying ? null : release.title)}
                      className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrentPlaying
                          ? "bg-purple-500 text-white scale-100 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                          : "bg-black/80 backdrop-blur-md text-white border border-white/20 hover:bg-purple-600 hover:text-white hover:scale-105"
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
                  <div className="mt-3.5">
                    <h3 className="font-gothic text-base font-bold text-white group-hover:text-purple-300 transition truncate">
                      {release.title}
                    </h3>
                    <p className="font-mono text-xs text-neutral-400 font-medium truncate mt-0.5">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/40 border border-white/10 font-mono text-[10px] uppercase tracking-wider text-neutral-300 hover:text-purple-200 transition"
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
