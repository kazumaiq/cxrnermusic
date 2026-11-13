"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Disc3, Headphones } from "lucide-react";
import type { ArtistItem } from "../lib/artists";

interface ArtistsShowcaseProps {
  artists: ArtistItem[];
}

export default function ArtistsShowcase({ artists }: ArtistsShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(artists[0]?.id ?? null);
  const activeArtist = artists.find((a) => a.id === hoveredId) || artists[0];

  return (
    <div className="space-y-10">
      {/* Featured Active Artist Telemetry Banner (Desktop/Tablet) */}
      {activeArtist && (
        <div className="hidden md:grid grid-cols-12 gap-8 items-center rounded-3xl border border-white/10 bg-[#090611]/70 backdrop-blur-xl p-6 lg:p-8 transition-all duration-500">
          <div className="col-span-4 lg:col-span-3">
            <div
              data-reveal="clip-photo"
              className="relative aspect-square rounded-2xl overflow-hidden border border-[#B46BFF]/40 shadow-[0_0_40px_rgba(135,55,255,0.28)]"
            >
              <Image
                src={encodeURI(activeArtist.avatar)}
                alt={activeArtist.name}
                fill
                sizes="300px"
                className="object-cover transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050407]/85 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white">
                <span>RESIDENT</span>
                <span className="text-[#B46BFF]">{activeArtist.listeners} / MO</span>
              </div>
            </div>
          </div>

          <div className="col-span-8 lg:col-span-9 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {activeArtist.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full bg-[#8737FF]/15 border border-[#B46BFF]/35 font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]"
                >
                  {g}
                </span>
              ))}
            </div>

            <h3 className="font-display font-black text-3xl lg:text-5xl text-white uppercase tracking-tight leading-none">
              {activeArtist.name}
            </h3>

            <p className="text-sm lg:text-base text-[#D9D9E2]/80 max-w-2xl leading-relaxed">
              {activeArtist.bio}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/artists/${activeArtist.id}`}
                data-cursor="PROFILE"
                className="btn-void-primary px-6 py-2.5 text-[11px]"
              >
                <span>Профиль и дискография</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              {activeArtist.links?.[0] && (
                <a
                  href={activeArtist.links[0].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="MUSIC"
                  className="btn-void-ghost px-5 py-2.5 text-[11px]"
                >
                  <Headphones className="w-3.5 h-3.5 text-[#B46BFF]" />
                  <span>{activeArtist.links[0].label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editorial Roster Grid */}
      <div
        data-reveal="stagger-group"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {artists.map((artist, idx) => {
          const isSelected = activeArtist?.id === artist.id;
          const indexStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

          return (
            <div
              key={artist.id}
              data-stagger-item
              onMouseEnter={() => setHoveredId(artist.id)}
              onFocus={() => setHoveredId(artist.id)}
              className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between p-4 ${
                isSelected
                  ? "border-[#B46BFF]/60 bg-[#160B28]/55 shadow-[0_0_35px_rgba(135,55,255,0.22)]"
                  : "border-white/10 bg-[#090611]/70 hover:border-[#B46BFF]/40"
              }`}
            >
              <div>
                {/* Portrait with clip-path reveal */}
                <Link
                  href={`/artists/${artist.id}`}
                  data-cursor="ARTIST"
                  className="block relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#050407] mb-4"
                >
                  <Image
                    src={encodeURI(artist.avatar)}
                    alt={artist.name}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 24vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050407] via-[#050407]/20 to-transparent opacity-80" />

                  <div className="absolute top-2.5 left-2.5 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/75 border border-white/15 text-[#D9D9E2]">
                    {indexStr}
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <span className="font-sans text-[11px] text-[#B46BFF] font-semibold">
                      {artist.listeners} слушателей
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>
                </Link>

                <Link href={`/artists/${artist.id}`} className="block">
                  <h4 className="font-display font-bold text-xl text-white group-hover:text-[#B46BFF] transition uppercase tracking-tight truncate">
                    {artist.name}
                  </h4>
                </Link>

                <p className="mt-1.5 text-xs text-[#D9D9E2]/65 line-clamp-2 leading-relaxed">
                  {artist.bio}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {artist.genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-[#D9D9E2]/70"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {artist.links?.[0] ? (
                  <a
                    href={artist.links[0].href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#B46BFF] hover:text-white transition whitespace-nowrap"
                  >
                    <Disc3 className="w-3 h-3" />
                    <span>Музыка</span>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
