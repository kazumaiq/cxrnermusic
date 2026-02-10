"use client";

import { useEffect, useState } from "react";
import Container from "../../components/Container";
import Reveal from "../../components/Reveal";
import GlowButton from "../../components/GlowButton";
import type { FeaturedRelease } from "../../lib/featured";
import { stats } from "../../data/site";

const emptyFeatured: FeaturedRelease = {
  title: "",
  artist: "",
  cover: "",
};

type StatusType = "" | "success" | "error";

export default function AdminPage() {
  const [featured, setFeatured] = useState<FeaturedRelease>(emptyFeatured);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/featured", { cache: "no-store" });
        const data = (await res.json()) as FeaturedRelease;
        setFeatured(data);
      } catch {
        setFeatured(emptyFeatured);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (key: keyof FeaturedRelease, value: string) => {
    setFeatured((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setStatus("Сохраняем...");
    setStatusType("");
    try {
      const res = await fetch("/api/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featured),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error("Save failed");
      setStatus("Сохранено");
      setStatusType("success");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Ошибка сохранения. Проверь Supabase ключи в Vercel.");
      setStatusType("error");
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
            Управляйте ключевой статистикой и блоком «Новинка» на главной странице.
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
              <GlowButton variant="primary" onClick={handleSave}>
                Сохранить
              </GlowButton>
              {status ? (
                <span className={`text-sm ${statusType === "error" ? "text-red-300" : "text-white/70"}`}>
                  {status}
                </span>
              ) : null}
            </div>
          </div>

          <div className="glass rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-white">Предпросмотр</h3>
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
      </Container>
    </section>
  );
}
