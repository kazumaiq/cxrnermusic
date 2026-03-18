"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";

const genres = ["Phonk", "Hip-Hop", "Electronic", "Pop", "Rock", "Other"];
const releaseTypes = ["single", "album"];

export default function SubmitReleasePage() {
  const router = useRouter();
  const [releaseType, setReleaseType] = useState<"single" | "album">("single");
  const [trackName, setTrackName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hasWords, setHasWords] = useState<"yes" | "no">("yes");
  const [artistName, setArtistName] = useState("");
  const [artistFullName, setArtistFullName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [version, setVersion] = useState("Оригинал");
  const [genre, setGenre] = useState("");
  const [filesLink, setFilesLink] = useState("");
  const [yandexCardLink, setYandexCardLink] = useState("");
  const [hasExplicit, setHasExplicit] = useState<"yes" | "no">("no");
  const [promoText, setPromoText] = useState("");
  const [comment, setComment] = useState("");
  const [contactTelegram, setContactTelegram] = useState("");
  const [links, setLinks] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRelease() {
    setError(null);
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
          // Бот спрашивает "Ссылка на файлы" одним URL на Диск/папку.
          // В текущей схеме удобнее передать это как `audio_link`, чтобы Telegram-бот не остался без данных.
          audio_link: filesLink || null,
          files_link: filesLink || null,
          links: links || null,
          promo_text: promoText || null,
          subtitle: subtitle || null,
          has_words: hasWords === "yes",
          artist_full_name: artistFullName || null,
          version: version || null,
          yandex_card_link: yandexCardLink || null,
          has_explicit: hasExplicit === "yes",
          comment: comment || null,
          contact_telegram: contactTelegram || null,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok || !json.id) {
        throw new Error(json.error || "Не удалось отправить релиз");
      }

      setConfirmOpen(false);
      router.push(`/dashboard/release/${json.id}`);
    } catch (err: any) {
      setError(err.message ?? "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!artistName.trim() || !trackName.trim() || !genre.trim()) {
      setError("Заполните минимум артист, название и жанр.");
      return;
    }

    setConfirmOpen(true);
  }

  return (
    <Container className="section-padding">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Отправка релиза</p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl font-display">
            Отправить релиз через сайт
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Заполните форму — релиз попадёт в Telegram-модерацию, а статус будет синхронизироваться в вашем кабинете.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 mb-2">
              Тип релиза
            </p>
            <div className="inline-flex overflow-hidden rounded-full border border-white/15 bg-black/40 p-1">
              {releaseTypes.map((t) => {
                const isActive = releaseType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReleaseType(t as "single" | "album")}
                    className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      isActive
                        ? "bg-neon text-black shadow-[0_0_30px_rgba(190,106,255,0.6)]"
                        : "bg-transparent text-white/60 hover:text-white"
                    }`}
                  >
                    {t === "single" ? "Сингл" : "Альбом"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Название релиза
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Саб-название (если нет — точка ".")
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Например: Night Drive Remix или '.'"
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                Саб-название ℹ️ Саб-название - это дополнительная подпись к названию релиза. Пример: Remix, Slowed, Instrumental, Extended Mix.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50 mb-2">
                Есть слова в релизе?
              </label>
              <div className="inline-flex overflow-hidden rounded-full border border-white/15 bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => setHasWords("yes")}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    hasWords === "yes"
                      ? "bg-neon text-black shadow-[0_0_30px_rgba(190,106,255,0.6)]"
                      : "bg-transparent text-white/60 hover:text-white"
                  }`}
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setHasWords("no")}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    hasWords === "no"
                      ? "bg-neon text-black shadow-[0_0_30px_rgba(190,106,255,0.6)]"
                      : "bg-transparent text-white/60 hover:text-white"
                  }`}
                >
                  Нет, инструментал
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Ник исполнителя
              </label>
              <input
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Никнейм в релизе"
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                Ник исполнителя ℹ️ Это сценическое имя артиста, которое будет отображаться на стриминговых сервисах.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                ФИО исполнителя
              </label>
              <input
                type="text"
                value={artistFullName}
                onChange={(e) => setArtistFullName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Фамилия Имя Отчество"
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                ФИО исполнителя ℹ️ Укажите настоящее имя исполнителя. Это требуется для документов и авторских прав.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Дата релиза (ДД.ММ.ГГГГ)
              </label>
              <input
                type="text"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="23.03.2026"
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                Дата релиза ℹ️ Укажите дату выхода релиза на площадках минимум за 4 дня.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Версия релиза (или «Оригинал»)
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Оригинал, Remix, Radio Edit и т.п."
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                Версия релиза ℹ️ Если это обычная версия трека - напишите "-". Если другая версия: Remix, Slowed, Sped Up, Instrumental.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Жанр
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {genres.map((g) => {
                  const isActive = genre === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                        isActive
                          ? "bg-neon text-black shadow-[0_0_25px_rgba(190,106,255,0.6)]"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-white/60">
                Жанр ℹ️ Укажите основной жанр трека. Примеры: Phonk, Brazilian Funk, Hip-Hop, Trap, EDM.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Ссылка на файлы (http/https)
              </label>
              <input
                type="url"
                value={filesLink}
                onChange={(e) => setFilesLink(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="Google Drive, Dropbox и т.п."
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                Ссылка на файлы ℹ️ В ссылке на Яндекс/Google Диск должна быть папка со следующими файлами: 1. Обложка релиза в формате JPG 3000x3000 2. Трек в формате WAV (44100Hz, 16 или 24 bit) 3. Скриншот(ы) проекта как доказательство авторства.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Ссылка на карточку в Яндекс Музыке
              </label>
              <input
                type="url"
                value={yandexCardLink}
                onChange={(e) => setYandexCardLink(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
                placeholder="URL или '.' если нет карточки"
              />
              <p className="mt-1 text-[11px] leading-snug text-white/60">
                Карточка Яндекс Музыки ℹ️ Отправьте ссылку на существующую карточку артиста. Если карточки нет - нажмите кнопку "Создать новую карточку".
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50 mb-2">
                Есть ненормативная лексика?
              </label>
              <div className="inline-flex overflow-hidden rounded-full border border-white/15 bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => setHasExplicit("yes")}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    hasExplicit === "yes"
                      ? "bg-neon text-black shadow-[0_0_30px_rgba(190,106,255,0.6)]"
                      : "bg-transparent text-white/60 hover:text-white"
                  }`}
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setHasExplicit("no")}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    hasExplicit === "no"
                      ? "bg-neon text-black shadow-[0_0_30px_rgba(190,106,255,0.6)]"
                      : "bg-transparent text-white/60 hover:text-white"
                  }`}
                >
                  Нет
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-white/60">
                Ненормативная лексика ℹ️ Выберите "Да", если в тексте трека присутствует мат. Если трек чистый - выберите "Нет".
              </p>
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
              Промо-текст (или точка ".")
            </label>
            <textarea
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="Кратко опишите трек, контекст, референсы, важные детали для модерации."
            />
            <p className="mt-1 text-[11px] leading-snug text-white/60">
              Промо-текст ℹ️ Это описание релиза для редакторов стриминговых сервисов. Кратко опишите стиль трека, атмосферу и для каких плейлистов он подходит.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Комментарий (или точка ".")
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="Любые дополнительные детали для команды CXRNER."
            />
            <p className="mt-1 text-[11px] leading-snug text-white/60">
              Комментарий ℹ️ Дополнительная информация для модераторов. Можно оставить пустым.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Контакт Telegram для связи (@username)
            </label>
            <input
              type="text"
              value={contactTelegram}
              onChange={(e) => setContactTelegram(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="@nickname"
            />
            <p className="mt-1 text-[11px] leading-snug text-white/60">
              Контакт Telegram ℹ️ Укажите ваш Telegram username для связи с менеджером.
            </p>
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
            <GlowButton type="submit" disabled={loading}>
              {loading ? "Отправка..." : "Отправить релиз"}
            </GlowButton>
          </div>
        </form>

        {confirmOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
            <div className="glass w-full max-w-2xl rounded-3xl p-6">
              <p className="text-sm font-semibold text-white">
                ⚠️ Перед отправкой релиза внимательно проверьте анкету.
              </p>

              <div className="mt-3 max-h-[70vh] overflow-y-auto text-sm leading-relaxed text-white/70">
                <p>
                  Отправляя релиз в модерацию, вы подтверждаете, что:
                </p>
                <ul className="mt-2 list-disc pl-5">
                  <li>все данные указаны корректно</li>
                  <li>файлы соответствуют требованиям</li>
                  <li>обложка соответствует правилам площадок</li>
                  <li>у вас есть права на использование всех материалов релиза</li>
                </ul>

                <p className="mt-3">
                  Если данные указаны неверно или файлы не соответствуют требованиям:
                </p>
                <ul className="mt-2 list-disc pl-5">
                  <li>релиз может быть отклонён модерацией</li>
                  <li>релиз может быть снят с отгрузки</li>
                  <li>релиз может не выйти в указанную дату</li>
                  <li>релиз может быть удалён до исправления ошибок</li>
                </ul>

                <p className="mt-3">
                  Команда CXRNER MUSIC не несёт ответственности за задержку выхода релиза, если анкета заполнена неверно или файлы не соответствуют требованиям.
                  Отправляя релиз, вы подтверждаете согласие с правилами загрузки и пользовательским соглашением.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  disabled={loading}
                >
                  ❌ Отмена
                </button>
                <GlowButton
                  type="button"
                  onClick={submitRelease}
                  disabled={loading}
                >
                  ✅ Подтвердить и отправить
                </GlowButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

