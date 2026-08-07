import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "../../../components/Container";
import Reveal from "../../../components/Reveal";
import { getArtist } from "../../../lib/artists";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtist((await params).slug);
  if (!artist) return { title: "Артист — CXRNER MUSIC" };
  return { title: `${artist.name} — артист CXRNER MUSIC`, description: artist.bio };
}

export default async function ArtistPage({ params }: Props) {
  const artist = await getArtist((await params).slug);
  if (!artist) notFound();

  return <main className="section-padding pt-32"><Container><Link href="/#artists" className="text-sm text-white/55 transition hover:text-white">← Все артисты</Link><div className="mt-10 grid gap-10 lg:grid-cols-[.55fr_1fr] lg:items-center"><Reveal><div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] p-3 shadow-2xl shadow-neon/10"><Image src={encodeURI(artist.avatar)} alt={artist.name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover p-3" priority /></div></Reveal><div><Reveal><p className="eyebrow">Артист CXRNER MUSIC</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-white md:text-7xl">{artist.name}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">{artist.bio}</p></Reveal><Reveal delay={.08}><div className="mt-7 flex flex-wrap gap-2">{artist.genres.map((genre) => <span key={genre} className="rounded-full border border-neon/25 bg-neon/10 px-4 py-2 text-sm text-neonSoft">{genre}</span>)}</div><p className="mt-7 text-sm text-white/50">{artist.listeners} слушателей в месяц</p><div className="mt-7 flex flex-wrap gap-3">{artist.links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/75 transition hover:border-neon hover:text-white">{link.label} ↗</a>)}</div></Reveal></div></div></Container></main>;
}
