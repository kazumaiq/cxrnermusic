import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "../../../components/Container";
import { getArtist, getArtists } from "../../../lib/artists";
import { getReleases } from "../../../lib/releases";
import {
  ArrowLeft,
  CheckCircle2,
  Headphones,
  Sparkles,
  ExternalLink,
  Disc,
  Radio,
} from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) return { title: "Артист — CXRNER MUSIC" };
  return {
    title: `${artist.name} — Резидент CXRNER MUSIC`,
    description: `${artist.name}: ${artist.bio}. Слушайте релизы на Spotify, Apple Music и Яндекс Музыке.`,
  };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const [artist, allReleases] = await Promise.all([getArtist(slug), getReleases()]);

  if (!artist) notFound();

  // Find tracks associated with this artist
  const artistReleases = allReleases.filter(
    (r) =>
      r.artist.toLowerCase().includes(artist.name.toLowerCase()) ||
      artist.name.toLowerCase().includes(r.artist.toLowerCase()),
  );

  return (
    <div className="section-padding pt-28 sm:pt-36">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/#artists"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Все артисты лейбла
          </Link>
        </div>

        {/* Hero Artist Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-16 border-b border-white/10">
          {/* Avatar Cover Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[380px] aspect-square rounded-3xl overflow-hidden glass-panel p-3 border border-white/15 shadow-glow">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src={encodeURI(artist.avatar)}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Holographic Border Badge */}
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-neon">
                  <Sparkles className="w-3 h-3 text-neon" />
                  CXRNER RESIDENT
                </span>
              </div>
            </div>
          </div>

          {/* Artist Biography & Metrics */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-aqua">
                <CheckCircle2 className="w-4 h-4 text-aqua" />
                <span>Верифицированный артист лейбла</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white">
                {artist.name}
              </h1>
            </div>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed font-body max-w-2xl">
              {artist.bio}
            </p>

            {/* Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <Headphones className="w-5 h-5 text-neon" />
                <div>
                  <span className="font-display font-bold text-lg text-white block">
                    {artist.listeners}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/40">
                    Слушателей в месяц
                  </span>
                </div>
              </div>

              <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <Disc className="w-5 h-5 text-aqua" />
                <div>
                  <span className="font-display font-bold text-lg text-white block">
                    70/30
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/40">
                    Модель роялти
                  </span>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 pt-1">
              {artist.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-neon/10 text-neonSoft border border-neon/30"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* External Links */}
            {artist.links && artist.links.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-3">
                {artist.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-badge border border-white/15 text-xs font-semibold text-white/80 hover:text-white hover:border-aqua transition"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 text-white/40" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Artist Discography */}
        <div className="mt-16">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-aqua">Дискография</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              Релизы на лейбле
            </h2>
          </div>

          {artistReleases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artistReleases.map((release) => {
                const isRemote = release.cover.startsWith("http");
                return (
                  <div
                    key={release.title}
                    className="glass-panel rounded-3xl p-4 border border-white/10 hover:border-neon/40 transition group"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 mb-4">
                      {isRemote ? (
                        <img
                          src={release.cover}
                          alt={release.title}
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={release.cover}
                          alt={release.title}
                          fill
                          sizes="300px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>

                    <h3 className="font-bold text-white text-base truncate">{release.title}</h3>
                    <p className="text-xs text-white/50 mt-0.5">{release.artist}</p>

                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                      {release.links.map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-neon/15 border border-white/10 text-[11px] text-white/70 hover:text-white transition"
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 text-white/50 text-xs sm:text-sm">
              <Disc className="w-8 h-8 text-white/20 mx-auto mb-2" />
              Новые релизы артиста готовятся к отгрузке.
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
