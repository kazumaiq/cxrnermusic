"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";
import { useSupabaseSession } from "../providers";

const genres = ["Phonk", "Hip-Hop", "Electronic", "Pop", "Rock", "Other"];
const releaseTypes = ["single", "ep", "album"];

export default function SubmitReleasePage() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [artistName, setArtistName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseType, setReleaseType] = useState("single");
  const [releaseDate, setReleaseDate] = useState("");
  const [coverLink, setCoverLink] = useState("");
  const [audioLink, setAudioLink] = useState("");
  const [links, setLinks] = useState("");
  const [promoText, setPromoText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (!artistName.trim() || !trackName.trim() || !genre.trim()) {
      setError("Заполните минимум артист, трек и жанр.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artist_name: artistName.trim(),
          track_name: trackName.trim(),
          genre: genre.trim(),
          release_type: releaseType,
          release_date: releaseDate || null,
          cover_link: coverLink || null,
          audio_link: audioLink || null,
          links: links || null,
          promo_text: promoText || null,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok || !json.id) {
        throw new Error(json.error || "Не удалось отправить релиз");
      }

      router.push(`/dashboard/release/${json.id}`);
    } catch (err: any) {
      setError(err.message ?? "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="section-padding">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Отправка релиза</p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl font-display">
            Отправить релиз через сайт
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Заполните форму — релиз попадёт в Telegram-модерацию, а статус будет синхронизироваться в вашем кабинете.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Артист
              </label>
              <input
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Имя артиста"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Название трека
              </label>
              <input
                type="text"
                required
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="HELLBORN"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Жанр
              </label>
              <select
                required
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-neon"
              >
                <option value="">Выберите жанр</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Тип релиза
              </label>
              <select
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-neon"
              >
                {releaseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Желаемая дата релиза
              </label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-neon"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Ссылка на обложку
              </label>
              <input
                type="url"
                value={coverLink}
                onChange={(e) => setCoverLink(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Ссылка на аудио
              </label>
              <input
                type="url"
                value={audioLink}
                onChange={(e) => setAudioLink(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Google Drive, Dropbox и т.п."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Дополнительные ссылки
            </label>
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="Каждую ссылку с новой строки"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Промо-текст / комментарии
            </label>
            <textarea
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text.white/40 focus:border-neon"
              placeholder="Кратко опишите трек, контекст, референсы, важные детали для модерации."
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-white/50">
              Отправляя форму, вы соглашаетесь с{" "}
              <a href="/offer" className="underline underline-offset-2 hover:text-white">
                офертой
              </a>
              .
            </p>
            <GlowButton as="button" type="submit" disabled={loading}>
              {loading ? "Отправка..." : "Отправить релиз"}
            </GlowButton>
          </div>
        </form>
      </div>
    </Container>
  );
}

