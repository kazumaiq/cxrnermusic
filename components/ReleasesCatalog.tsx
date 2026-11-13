"use client";

import { useState, useMemo, useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import { Search, Disc3, ExternalLink, Music, ArrowUpRight, Sparkles } from "lucide-react";
import type { ReleaseItem } from "../lib/releases";
import { setUniverseAtmosphere } from "../lib/universeBridge";
import { playReleaseChime } from "../lib/soundFX";

// Unique atmospheric ionization hue for releases
const RELEASE_ATMOSPHERE: Record<string, [number, number, number]> = {
  "The Sadness of Reality": [0.529, 0.216, 1.0], // Electric Violet
  "GET BACK": [0.88, 0.18, 0.32],              // Cyber Crimson
  "Stream Of Dreams": [0.18, 0.65, 0.95],      // Stellar Cyan
  "DEMURE": [0.78, 0.22, 0.88],                // Neon Magenta
  "Celebrate": [0.94, 0.62, 0.18],             // Solar Gold
  "TERANUM": [0.45, 0.22, 0.88],               // Deep Violet
  "Paranoia is everywhere": [0.18, 0.72, 0.75],// Emerald Ion
  "HALLUCINATIONN": [0.65, 0.18, 0.85],        // Amethyst
};

const DEFAULT_RELEASES: ReleaseItem[] = [
  {
    title: "The Sadness of Reality",
    artist: "Neimeks",
    cover: "/covers/the-sadness-of-reality.jpg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/44422385" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "GET BACK",
    artist: "UNXPLXYA",
    cover: "https://avatars.yandex.net/get-music-content/21049049/e0e681e4.a.44088019-1/m1000x1000",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/44088019" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "VK Музыка", href: "https://vk.com/music" },
    ],
  },
  {
    title: "Stream Of Dreams",
    artist: "KXLLVURX",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/24/01/f2/2401f286-9807-d327-3273-fce7233a8289/2_001_KXLLVURX_KNXPKA-Distorted_Memories.jpg/600x600bb.jpg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/44037417" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "DEMURE",
    artist: "ViRxSdz",
    cover: "https://avatars.yandex.net/get-music-content/20712233/85bc40f9.a.43225634-1/m1000x1000",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43225634" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "Celebrate",
    artist: "UNXPLXYA, ETERNXL SXNNER",
    cover: "https://avatars.yandex.net/get-music-content/17649213/f6dc67e6.a.43863222-1/m1000x1000",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43863222" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "VK Музыка", href: "https://vk.com/music" },
    ],
  },
  {
    title: "TERANUM",
    artist: "Zarl1t ft, evxlshvdow邪惡",
    cover: "https://avatars.yandex.net/get-music-content/20305588/7cee7546.a.43724370-1/m1000x1000",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43724370" },
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
    ],
  },
  {
    title: "Paranoia is everywhere",
    artist: "Neimeks",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bd/b1/c2/bdb1c2e0-263a-3833-1a94-df98db8486e1/7683312191180.jpg/600x600bb.jpg",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43844944" },
      { label: "Spotify", href: "https://open.spotify.com" },
    ],
  },
  {
    title: "HALLUCINATIONN",
    artist: "DrXer28",
    cover: "https://avatars.yandex.net/get-music-content/20031403/ce257fa8.a.43586186-1/m1000x1000",
    links: [
      { label: "Яндекс Музыка", href: "https://music.yandex.ru/album/43586186" },
      { label: "Spotify", href: "https://open.spotify.com" },
    ],
  },
];

function TiltCoverFrame({
  cover,
  alt,
  active,
  indexLabel,
}: {
  cover: string;
  alt: string;
  active?: boolean;
  indexLabel: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const isRemote = cover.startsWith("http");

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleLeave = () => {
    const el = frameRef.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
  };

  return (
    <div className="relative group/vinyl overflow-visible">
      {/* 3D Vinyl Record sliding out from behind the sleeve */}
      <div
        className={`absolute right-0 top-1/2 -translate-y-1/2 w-[92%] h-[92%] rounded-full bg-[#08060d] border border-white/25 transition-all duration-700 ease-out shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-center -z-10 ${
          active
            ? "translate-x-10 sm:translate-x-14 rotate-180"
            : "group-hover:translate-x-8 group-hover:rotate-90"
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle at center, transparent 28%, rgba(255,255,255,0.08) 30%, transparent 32%),
            radial-gradient(circle at center, transparent 44%, rgba(255,255,255,0.06) 46%, transparent 48%),
            radial-gradient(circle at center, transparent 60%, rgba(255,255,255,0.05) 62%, transparent 64%),
            radial-gradient(circle at center, transparent 76%, rgba(255,255,255,0.05) 78%, transparent 80%),
            radial-gradient(circle at center, transparent 88%, rgba(255,255,255,0.05) 90%, transparent 92%),
            conic-gradient(from 0deg, rgba(255,255,255,0.18), transparent 60deg, rgba(255,255,255,0.14) 120deg, transparent 180deg, rgba(255,255,255,0.18) 240deg, transparent 300deg, rgba(255,255,255,0.14))
          `,
        }}
      >
        {/* Center vinyl label */}
        <div className="w-[30%] h-[30%] rounded-full overflow-hidden border border-[#B46BFF]/70 shadow-md">
          {isRemote ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image src={cover} alt="" fill className="object-cover" />
          )}
        </div>
      </div>

      <div
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-[#090611] transition-transform duration-300 ease-out will-change-transform ${
          active
            ? "ring-2 ring-[#B46BFF] shadow-[0_0_45px_rgba(135,55,255,0.42)]"
            : "ring-1 ring-white/10 group-hover:ring-[#B46BFF]/60 group-hover:shadow-[0_24px_60px_rgba(135,55,255,0.28)]"
        }`}
      >
        {isRemote ? (
          <img
            src={cover}
            alt={alt}
            loading="lazy"
            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <Image
            src={cover}
            alt={alt}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        )}

        {/* Volumetric Chrome Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050407]/85 via-transparent to-[#B46BFF]/15 opacity-70 group-hover:opacity-45 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#050407]/80 backdrop-blur-md border border-white/15 font-mono text-[9px] uppercase tracking-[0.22em] text-[#D9D9E2]">
            {indexLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ReleasesCatalogProps {
  initialReleases: ReleaseItem[];
}

export default function ReleasesCatalog({ initialReleases }: ReleasesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveCovers, setLiveCovers] = useState<Record<string, string>>({});

  const releasesToDisplay = useMemo(() => {
    const list =
      initialReleases && initialReleases.length > 0 ? initialReleases : DEFAULT_RELEASES;
    return list.map((item) => {
      const key = `${item.artist}-${item.title}`;
      if (liveCovers[key]) {
        return { ...item, cover: liveCovers[key] };
      }
      return item;
    });
  }, [initialReleases, liveCovers]);

  useEffect(() => {
    releasesToDisplay.forEach(async (rel) => {
      const key = `${rel.artist}-${rel.title}`;
      if (rel.cover.endsWith(".svg") && !liveCovers[key]) {
        try {
          const res = await fetch(
            `/api/cover-lookup?artist=${encodeURIComponent(rel.artist)}&title=${encodeURIComponent(
              rel.title
            )}`
          );
          const data = await res.json();
          if (data.cover) {
            setLiveCovers((prev) => ({ ...prev, [key]: data.cover }));
          }
        } catch {}
      }
    });
  }, [releasesToDisplay, liveCovers]);

  const filteredReleases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return releasesToDisplay;
    return releasesToDisplay.filter(
      (release) =>
        release.title.toLowerCase().includes(q) ||
        release.artist.toLowerCase().includes(q)
    );
  }, [releasesToDisplay, searchQuery]);

  const spotlight =
    filteredReleases[activeIndex] || filteredReleases[0] || releasesToDisplay[0];

  // Dynamic ambient lighting transition to match spotlight release artwork
  useEffect(() => {
    if (spotlight) {
      const hue = RELEASE_ATMOSPHERE[spotlight.title] || [0.529, 0.216, 1.0];
      setUniverseAtmosphere(hue);
    }
  }, [spotlight]);

  return (
    <div className="space-y-12">
      {/* Interactive 3D Spotlight Stage */}
      {spotlight && (
        <div
          data-reveal="clip-photo"
          className="relative rounded-3xl border border-[#D9D9E2]/12 bg-[#090611]/75 backdrop-blur-2xl p-5 sm:p-8 lg:p-10 overflow-hidden shadow-[0_30px_90px_rgba(5,4,7,0.9)]"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#8737FF]/20 rounded-full blur-[130px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Large 3D Tilt Artwork */}
            <div className="lg:col-span-5 max-w-[420px] w-full mx-auto lg:mx-0">
              <div className="group" data-cursor="3D ART">
                <TiltCoverFrame
                  cover={spotlight.cover}
                  alt={`${spotlight.title} — ${spotlight.artist}`}
                  active
                  indexLabel="SPOTLIGHT"
                />
              </div>
            </div>

            {/* Editorial Metadata & Streaming Links */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/35 bg-[#8737FF]/10 font-mono text-[10px] uppercase tracking-[0.25em] text-[#B46BFF] mb-4">
                  <Sparkles className="w-3 h-3" />
                  <span>SELECTED RELEASE // CXRNER CATALOG</span>
                </div>

                <h3 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight leading-[0.95] transition-all duration-300">
                  {spotlight.title}
                </h3>

                <p className="mt-2 font-sans text-base sm:text-lg font-semibold text-[#00F0FF]">
                  {spotlight.artist}
                </p>
              </div>

              <div className="cosmic-hairline" />

              {/* DSP Platform Action Pills */}
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D9D9E2]/50">
                  ДОСТУПНО НА ПЛОЩАДКАХ:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {spotlight.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="STREAM"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-[#8737FF] border border-white/15 hover:border-[#B46BFF] font-mono text-xs uppercase tracking-wider text-white transition-all duration-300 shadow-sm hover:shadow-[0_0_24px_rgba(135,55,255,0.5)]"
                    >
                      <Music className="w-3.5 h-3.5 text-[#B46BFF] group-hover:text-white" />
                      <span>{link.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-65" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Switcher Dots */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#D9D9E2]/45">
                  НАЖМИТЕ НА ЛЮБОЙ РЕЛИЗ НИЖЕ ДЛЯ ПРОСМОТРА
                </span>
                <span className="font-mono text-xs text-[#B46BFF]">
                  0{Math.min(activeIndex + 1, filteredReleases.length)} / 0{filteredReleases.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Telemetry Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-y border-white/10 py-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B46BFF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Поиск трека или артиста..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#090611]/90 border border-white/12 text-xs sm:text-sm font-mono text-white placeholder:text-[#D9D9E2]/35 focus:border-[#8737FF] focus:outline-none transition"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#D9D9E2]/60">
            В КАТАЛОГЕ: <strong className="text-white">{filteredReleases.length}</strong>
          </span>

          <a
            href="https://music.yandex.ru/label/5978511"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="LABEL"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#B46BFF]/35 bg-[#8737FF]/12 hover:bg-[#8737FF]/25 font-mono text-[11px] uppercase tracking-wider text-white transition"
          >
            <span>Яндекс Музыка</span>
            <ExternalLink className="w-3 h-3 text-[#B46BFF]" />
          </a>
        </div>
      </div>

      {/* Responsive Editorial Release Matrix */}
      {filteredReleases.length === 0 ? (
        <div className="rounded-3xl p-12 text-center border border-white/10 bg-[#090611]/80">
          <Disc3 className="w-10 h-10 text-[#B46BFF]/50 mx-auto mb-3" />
          <p className="font-heavy text-2xl text-white uppercase tracking-wide">
            Релизы не найдены
          </p>
          <p className="font-mono text-xs text-[#D9D9E2]/55 mt-1">
            Попробуйте изменить поисковый запрос
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-5 btn-energy px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest"
          >
            Сбросить поиск
          </button>
        </div>
      ) : (
        <div
          data-reveal="stagger-group"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {filteredReleases.map((release, index) => {
            const isActive = spotlight?.title === release.title && spotlight?.artist === release.artist;
            const num = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

            return (
              <article
                key={`${release.title}-${index}`}
                data-stagger-item
                onClick={() => {
                  setActiveIndex(index);
                  playReleaseChime();
                }}
                data-cursor="SELECT"
                className="group cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <TiltCoverFrame
                    cover={release.cover}
                    alt={`${release.title} — ${release.artist}`}
                    active={isActive}
                    indexLabel={num}
                  />

                  <div className="mt-3 px-0.5">
                    <h4 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-[#B46BFF] transition uppercase tracking-tight truncate">
                      {release.title}
                    </h4>
                    <p className="font-sans text-xs text-[#D9D9E2]/75 truncate mt-0.5">
                      {release.artist}
                    </p>
                  </div>
                </div>

                {/* Compact Platform Links */}
                <div
                  className="flex flex-wrap gap-1.5 px-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {release.links.slice(0, 3).map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#8737FF]/25 border border-white/10 hover:border-[#B46BFF]/50 font-mono text-[9px] uppercase tracking-wider text-[#D9D9E2]/80 hover:text-white transition"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
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
