"use client";

import { useEffect, useState } from "react";
import Container from "../../components/Container";
import Reveal from "../../components/Reveal";
import GlowButton from "../../components/GlowButton";
import type { FeaturedRelease } from "../../lib/featured";
import type { ReleaseItem, ReleaseLink } from "../../lib/releases";
import { stats } from "../../data/site";

const emptyFeatured: FeaturedRelease = {
  title: "",
  artist: "",
  cover: "",
};

const emptyRelease: ReleaseItem = {
  title: "",
  artist: "",
  cover: "",
  links: [],
};

type StatusType = "" | "success" | "error";

export default function AdminPage() {
  const [featured, setFeatured] = useState<FeaturedRelease>(emptyFeatured);
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [releasesStatus, setReleasesStatus] = useState<string>("");
  const [releasesStatusType, setReleasesStatusType] = useState<StatusType>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredRes, releasesRes] = await Promise.all([
          fetch("/api/featured", { cache: "no-store" }),
          fetch("/api/releases", { cache: "no-store" }),
        ]);
        const featuredData = (await featuredRes.json()) as FeaturedRelease;
        const releasesPayload = (await releasesRes.json()) as { ok: boolean; items: ReleaseItem[] };
        setFeatured(featuredData);
        setReleases(releasesPayload?.items ?? []);
      } catch {
        setFeatured(emptyFeatured);
        setReleases([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (key: keyof FeaturedRelease, value: string) => {
    setFeatured((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveFeatured = async () => {
    setStatus("Сохраняем новинку...");
    setStatusType("");
    try {
      const res = await fetch("/api/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featured),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error("Save failed");
      setStatus("Новинка сохранена");
      setStatusType("success");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Ошибка сохранения. Проверь Supabase ключи в Vercel.");
      setStatusType("error");
    }
  };

  const handleReleaseChange = (index: number, key: keyof ReleaseItem, value: string) => {
    setReleases((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
  };

  const handleLinkChange = (releaseIndex: number, linkIndex: number, key: keyof ReleaseLink, value: string) => {
    setReleases((prev) =>
      prev.map((item, idx) => {
        if (idx !== releaseIndex) return item;
        const links = item.links.map((link, ldx) => (ldx === linkIndex ? { ...link, [key]: value } : link));
        return { ...item, links };
      })
    );
  };

  const addRelease = () => {
    setReleases((prev) => [...prev, { ...emptyRelease }]);
  };

  const removeRelease = (index: number) => {
    setReleases((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addLink = (index: number) => {
    setReleases((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, links: [...item.links, { label: "", href: "" }] } : item
      )
    );
  };

  const removeLink = (releaseIndex: number, linkIndex: number) => {
    setReleases((prev) =>
      prev.map((item, idx) => {
        if (idx !== releaseIndex) return item;
        return { ...item, links: item.links.filter((_, ldx) => ldx !== linkIndex) };
      })
    );
  };

  const handleSaveReleases = async () => {
    setReleasesStatus("Сохраняем релизы...");
    setReleasesStatusType("");
    try {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: releases }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error("Save failed");
      setReleasesStatus("Релизы сохранены");
      setReleasesStatusType("success");
      setTimeout(() => setReleasesStatus(""), 2000);
    } catch {
      setReleasesStatus("Ошибка сохранения релизов. Проверь Supabase ключи в Vercel.");
      setReleasesStatusType("error");
    }
  };

  return (
    <section className="section-padding">
      <Container>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Admin</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl font-display">
            Панель управления
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-base text-white/70">
            Управляйте ключевой статистикой, новинкой и витриной свежих релизов.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="glass rounded-2xl px-6 py-5 text-center">
              <p className="text-2xl font-semibold text-white">
                {item.display ? item.display : `${item.value}${item.suffix ?? ""}`}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-3xl p-8">
            <h2 className="text-2xl font-semibold text-white font-display">Редактировать «Новинку»</h2>
            <p className="mt-2 text-sm text-white/60">
              Укажите обложку (URL или путь в /public), название и ник артиста.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="text-sm text-white/70">
                Обложка
                <input
                  type="text"
                  value={featured.cover}
                  onChange={(event) => handleChange("cover", event.target.value)}
                  placeholder="/images/album-01.svg или https://..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                  disabled={loading}
                />
              </label>
              <label className="text-sm text-white/70">
                Название трека
                <input
                  type="text"
                  value={featured.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  placeholder="Название"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                  disabled={loading}
                />
              </label>
              <label className="text-sm text-white/70">
                Ник артиста
                <input
                  type="text"
                  value={featured.artist}
                  onChange={(event) => handleChange("artist", event.target.value)}
                  placeholder="Ник"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                  disabled={loading}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <GlowButton variant="primary" onClick={handleSaveFeatured}>
                Сохранить новинку
              </GlowButton>
              {status ? (
                <span className={`text-sm ${statusType === "error" ? "text-red-300" : "text-white/70"}`}>
                  {status}
                </span>
              ) : null}
            </div>
          </div>

          <div className="glass rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">Предпросмотр новинки</h3>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10">
                {featured.cover ? (
                  <img
                    src={featured.cover}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/40">
                    Нет обложки
                  </div>
                )}
              </div>
              <p className="mt-4 text-lg font-semibold text-white">
                {featured.title || "Название трека"}
              </p>
              <p className="text-sm text-white/60">{featured.artist || "Ник артиста"}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 glass rounded-3xl p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white font-display">Свежие релизы</h2>
              <p className="mt-2 text-sm text-white/60">
                Добавляйте карточки релизов: обложка, название, артист и DSP-ссылки.
              </p>
            </div>
            <GlowButton variant="ghost" onClick={addRelease}>
              Добавить релиз
            </GlowButton>
          </div>

          <div className="mt-8 space-y-6">
            {releases.map((release, index) => (
              <div key={`${release.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-white">Релиз #{index + 1}</p>
                  <GlowButton variant="ghost" onClick={() => removeRelease(index)}>
                    Удалить
                  </GlowButton>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm text-white/70">
                    Обложка
                    <input
                      type="text"
                      value={release.cover}
                      onChange={(event) => handleReleaseChange(index, "cover", event.target.value)}
                      placeholder="/images/album-01.svg или https://..."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                    />
                  </label>
                  <label className="text-sm text-white/70">
                    Название
                    <input
                      type="text"
                      value={release.title}
                      onChange={(event) => handleReleaseChange(index, "title", event.target.value)}
                      placeholder="Название"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                    />
                  </label>
                  <label className="text-sm text-white/70">
                    Артист
                    <input
                      type="text"
                      value={release.artist}
                      onChange={(event) => handleReleaseChange(index, "artist", event.target.value)}
                      placeholder="Артист"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">DSP ссылки</p>
                    <button
                      type="button"
                      className="text-xs text-neonSoft"
                      onClick={() => addLink(index)}
                    >
                      + добавить ссылку
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {release.links.map((link, linkIndex) => (
                      <div key={`${link.label}-${linkIndex}`} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(event) => handleLinkChange(index, linkIndex, "label", event.target.value)}
                          placeholder="Spotify"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(event) => handleLinkChange(index, linkIndex, "href", event.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-neon"
                        />
                        <button
                          type="button"
                          className="rounded-2xl border border-white/10 px-4 py-3 text-xs text-white/70 hover:border-neon"
                          onClick={() => removeLink(index, linkIndex)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    {release.links.length === 0 ? (
                      <p className="text-xs text-white/40">Ссылок пока нет.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <GlowButton variant="primary" onClick={handleSaveReleases}>
              Сохранить релизы
            </GlowButton>
            {releasesStatus ? (
              <span className={`text-sm ${releasesStatusType === "error" ? "text-red-300" : "text-white/70"}`}>
                {releasesStatus}
              </span>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
