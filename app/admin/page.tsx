"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";
import { stats } from "../../data/site";
import type { FeaturedRelease } from "../../lib/featured";
import type { ReleaseItem, ReleaseLink } from "../../lib/releases";
import type { ArtistItem, ArtistLink } from "../../lib/artists";

type Tab = "featured" | "releases" | "artists";
type NoticeType = "success" | "error";
type Notice = { type: NoticeType; text: string } | null;

const emptyFeatured: FeaturedRelease = { title: "", artist: "", cover: "" };
const emptyRelease: ReleaseItem = { title: "", artist: "", cover: "", links: [] };
const emptyArtist: ArtistItem = { id: "", name: "", listeners: "", avatar: "", bio: "", genres: [], links: [] };
const fieldClass = "mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-neon/70 focus:bg-black/35";

function Notice({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${notice.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>{notice.text}</div>;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("featured");
  const [featured, setFeatured] = useState<FeaturedRelease>(emptyFeatured);
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/featured", { cache: "no-store" }), fetch("/api/releases", { cache: "no-store" }), fetch("/api/artists", { cache: "no-store" })])
      .then(async ([featuredRes, releasesRes, artistsRes]) => {
        const featuredData = await featuredRes.json();
        const releasesData = await releasesRes.json();
        const artistsData = await artistsRes.json();
        setFeatured(featuredData?.title ? featuredData : emptyFeatured);
        setReleases(releasesData?.items ?? []);
        setArtists(artistsData?.items ?? []);
      })
      .catch(() => setNotice({ type: "error", text: "Не удалось загрузить данные. Проверьте Supabase и ADMIN_EMAILS." }))
      .finally(() => setLoading(false));
  }, []);

  const show = (type: NoticeType, text: string) => { setNotice({ type, text }); window.setTimeout(() => setNotice(null), 3500); };

  async function uploadImage(file: File, folder: string) {
    const form = new FormData(); form.append("file", file); form.append("folder", folder);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Ошибка загрузки");
    return data.url as string;
  }

  async function handleUpload(file: File | undefined, folder: string, onDone: (url: string) => void) {
    if (!file) return;
    setUploading(folder);
    try { onDone(await uploadImage(file, folder)); show("success", "Изображение загружено. Теперь сохраните изменения."); }
    catch (error) { show("error", error instanceof Error ? error.message : "Не удалось загрузить изображение"); }
    finally { setUploading(null); }
  }

  async function save(url: string, body: unknown, success: string) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Ошибка сохранения");
      show("success", success);
    } catch (error) { show("error", error instanceof Error ? error.message : "Не удалось сохранить изменения"); }
  }

  const updateRelease = (index: number, key: keyof ReleaseItem, value: string) => setReleases((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const updateReleaseLink = (releaseIndex: number, linkIndex: number, key: keyof ReleaseLink, value: string) => setReleases((items) => items.map((item, i) => i === releaseIndex ? { ...item, links: item.links.map((link, j) => j === linkIndex ? { ...link, [key]: value } : link) } : item));
  const updateArtist = (index: number, key: keyof ArtistItem, value: string | string[] | ArtistLink[]) => setArtists((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const updateArtistLink = (artistIndex: number, linkIndex: number, key: keyof ArtistLink, value: string) => setArtists((items) => items.map((item, i) => i === artistIndex ? { ...item, links: item.links.map((link, j) => j === linkIndex ? { ...link, [key]: value } : link) } : item));

  return <main className="section-padding pt-28 md:pt-36"><Container>
    <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow">CXRNER MUSIC · ADMIN</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">Панель управления</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">Все изменения сохраняются в Supabase и автоматически появляются на сайте. Выберите раздел, внесите изменения и нажмите «Сохранить».</p></div><div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">● Данные подключены к Supabase</div></div>
    <div className="mt-8 grid gap-3 sm:grid-cols-3">{stats.map((item) => <div key={item.label} className="stat-card text-left"><p className="font-display text-2xl font-semibold text-white">{item.display ?? `${item.value}${item.suffix ?? ""}`}</p><p className="mt-1 text-xs uppercase tracking-[.16em] text-white/40">{item.label}</p></div>)}</div>
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.035] p-2"><div className="grid gap-2 sm:grid-cols-3">{([["featured", "Новинка", "Главный блок на первом экране"], ["releases", "Релизы", "Карточки и ссылки на DSP"], ["artists", "Артисты", "Фото, био и профили артистов"]] as const).map(([value, label, hint]) => <button key={value} onClick={() => setTab(value)} className={`rounded-xl px-4 py-3 text-left transition ${tab === value ? "bg-neon text-night shadow-glow" : "text-white/60 hover:bg-white/[.06] hover:text-white"}`}><span className="block text-sm font-semibold">{label}</span><span className={`mt-1 block text-xs ${tab === value ? "text-night/65" : "text-white/35"}`}>{hint}</span></button>)}</div></div>
    {loading ? <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.04] p-8 text-sm text-white/55">Загружаем данные…</div> : null}

    {!loading && tab === "featured" ? <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.7fr]"><div className="panel-card"><p className="eyebrow">Первый экран</p><h2 className="mt-3 text-2xl font-semibold text-white">Управление новинкой</h2><p className="mt-2 text-sm leading-6 text-white/50">Этот релиз показывается в hero-блоке главной страницы.</p><div className="mt-7 grid gap-5"><label className="admin-label">Название релиза<input className={fieldClass} value={featured.title} onChange={(e) => setFeatured({ ...featured, title: e.target.value })} placeholder="Название трека" /></label><label className="admin-label">Артист<input className={fieldClass} value={featured.artist} onChange={(e) => setFeatured({ ...featured, artist: e.target.value })} placeholder="Имя артиста" /></label><label className="admin-label">URL обложки<input className={fieldClass} value={featured.cover} onChange={(e) => setFeatured({ ...featured, cover: e.target.value })} placeholder="https://… или /images/…" /></label><label className="admin-label">Загрузить новую обложку<input className="file-input" type="file" accept="image/*" disabled={uploading === "featured"} onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpload(e.target.files?.[0], "featured", (url) => setFeatured({ ...featured, cover: url }))} /></label></div><div className="mt-7"><GlowButton onClick={() => save("/api/featured", featured, "Новинка сохранена")}>Сохранить новинку</GlowButton></div></div><div className="panel-card"><p className="eyebrow">Предпросмотр</p><div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/30"><div className="relative aspect-square">{featured.cover ? <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-white/30">Добавьте обложку</div>}</div><div className="p-5"><p className="text-xl font-semibold text-white">{featured.title || "Название релиза"}</p><p className="mt-1 text-sm text-white/50">{featured.artist || "Имя артиста"}</p></div></div></div></section> : null}

    {!loading && tab === "releases" ? <section className="mt-8 panel-card"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Витрина</p><h2 className="mt-3 text-2xl font-semibold text-white">Релизы</h2><p className="mt-2 text-sm text-white/50">Редактируйте обложки, названия, артистов и ссылки на площадки.</p></div><button className="secondary-button" onClick={() => setReleases([...releases, { ...emptyRelease, links: [] }])}>+ Добавить релиз</button></div><div className="mt-8 space-y-5">{releases.map((release, index) => <article key={`${release.title}-${index}`} className="admin-item"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-white">Релиз {String(index + 1).padStart(2, "0")}</p><button className="danger-button" onClick={() => setReleases(releases.filter((_, i) => i !== index))}>Удалить</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="admin-label">Название<input className={fieldClass} value={release.title} onChange={(e) => updateRelease(index, "title", e.target.value)} /></label><label className="admin-label">Артист<input className={fieldClass} value={release.artist} onChange={(e) => updateRelease(index, "artist", e.target.value)} /></label><label className="admin-label">URL обложки<input className={fieldClass} value={release.cover} onChange={(e) => updateRelease(index, "cover", e.target.value)} /></label><label className="admin-label">Загрузить обложку<input className="file-input" type="file" accept="image/*" disabled={uploading === `release-${index}`} onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpload(e.target.files?.[0], `release-${index}`, (url) => updateRelease(index, "cover", url))} /></label></div><div className="mt-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/45">Ссылки на площадки</p><button className="text-xs text-neonSoft" onClick={() => updateRelease(index, "links", [...release.links, { label: "", href: "" }] as never)}>+ Добавить ссылку</button></div><div className="mt-3 space-y-3">{release.links.map((link, linkIndex) => <div key={`${link.label}-${linkIndex}`} className="grid gap-3 md:grid-cols-[.7fr_1.5fr_auto]"><input className={fieldClass.replace("mt-2", "")} value={link.label} placeholder="Spotify" onChange={(e) => updateReleaseLink(index, linkIndex, "label", e.target.value)} /><input className={fieldClass.replace("mt-2", "")} value={link.href} placeholder="https://…" onChange={(e) => updateReleaseLink(index, linkIndex, "href", e.target.value)} /><button className="danger-button" onClick={() => updateRelease(index, "links", release.links.filter((_, i) => i !== linkIndex) as never)}>Удалить</button></div>)}</div></div></article>)}</div><div className="mt-7"><GlowButton onClick={() => save("/api/releases", { items: releases }, "Релизы сохранены")}>Сохранить релизы</GlowButton></div></section> : null}

    {!loading && tab === "artists" ? <section className="mt-8 panel-card"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Команда и рост</p><h2 className="mt-3 text-2xl font-semibold text-white">Артисты</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Добавляйте будущих артистов: фото, описание, жанры, слушателей и ссылки. Для каждого артиста автоматически создаётся отдельная страница.</p></div><button className="secondary-button" onClick={() => setArtists([...artists, { ...emptyArtist, id: `artist-${Date.now()}` }])}>+ Добавить артиста</button></div><div className="mt-8 space-y-6">{artists.map((artist, index) => <article key={`${artist.id}-${index}`} className="admin-item"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black/30">{artist.avatar ? <img src={artist.avatar} alt="" className="h-full w-full object-cover" /> : null}</div><div><p className="font-semibold text-white">{artist.name || "Новый артист"}</p><p className="text-xs text-white/35">/{artist.id}</p></div></div><button className="danger-button" onClick={() => setArtists(artists.filter((_, i) => i !== index))}>Удалить</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="admin-label">Имя / псевдоним<input className={fieldClass} value={artist.name} onChange={(e) => updateArtist(index, "name", e.target.value)} placeholder="Имя артиста" /></label><label className="admin-label">Slug страницы<input className={fieldClass} value={artist.id} onChange={(e) => updateArtist(index, "id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="artist-name" /></label><label className="admin-label">Слушателей в месяц<input className={fieldClass} value={artist.listeners} onChange={(e) => updateArtist(index, "listeners", e.target.value)} placeholder="25 000" /></label><label className="admin-label">URL фото<input className={fieldClass} value={artist.avatar} onChange={(e) => updateArtist(index, "avatar", e.target.value)} placeholder="https://… или /artist/…" /></label><label className="admin-label">Загрузить фото<input className="file-input" type="file" accept="image/*" disabled={uploading === `artist-${index}`} onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpload(e.target.files?.[0], `artist-${index}`, (url) => updateArtist(index, "avatar", url))} /></label><label className="admin-label">Жанры через запятую<input className={fieldClass} value={artist.genres.join(", ")} onChange={(e) => updateArtist(index, "genres", e.target.value.split(",").map((genre) => genre.trim()).filter(Boolean))} placeholder="Phonk, Trap" /></label><label className="admin-label md:col-span-2">Биография<textarea className={`${fieldClass} min-h-28 resize-y`} value={artist.bio} onChange={(e) => updateArtist(index, "bio", e.target.value)} placeholder="Коротко расскажите об артисте и его звучании." /></label></div><div className="mt-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/45">Ссылки</p><button className="text-xs text-neonSoft" onClick={() => updateArtist(index, "links", [...artist.links, { label: "", href: "" }] as never)}>+ Добавить ссылку</button></div><div className="mt-3 space-y-3">{artist.links.map((link, linkIndex) => <div key={`${link.label}-${linkIndex}`} className="grid gap-3 md:grid-cols-[.7fr_1.5fr_auto]"><input className={fieldClass.replace("mt-2", "")} value={link.label} placeholder="Spotify" onChange={(e) => updateArtistLink(index, linkIndex, "label", e.target.value)} /><input className={fieldClass.replace("mt-2", "")} value={link.href} placeholder="https://…" onChange={(e) => updateArtistLink(index, linkIndex, "href", e.target.value)} /><button className="danger-button" onClick={() => updateArtist(index, "links", artist.links.filter((_, i) => i !== linkIndex) as never)}>Удалить</button></div>)}</div></div></article>)}</div><div className="mt-7"><GlowButton onClick={() => save("/api/artists", { items: artists }, "Артисты сохранены")}>Сохранить артистов</GlowButton></div></section> : null}
  </Container><Notice notice={notice} /></main>;
}
