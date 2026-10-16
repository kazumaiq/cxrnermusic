"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "../../components/Container";
import confetti from "canvas-confetti";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  User,
  Radio,
  Calendar,
  Send,
  HelpCircle,
  Disc,
  UploadCloud,
  Check,
} from "lucide-react";

const genres = [
  "Phonk",
  "Drift Phonk",
  "Memphis Phonk",
  "Hip-Hop",
  "Trap",
  "Electronic",
  "Synthwave",
  "Dark Wave",
  "Rock",
  "Pop",
  "Другой",
];

const releaseTypes = [
  { id: "single", label: "Сингл (1 трек)" },
  { id: "album", label: "Альбом / EP (2+ треков)" },
];

const DRAFT_KEY = "cxrner_release_draft_v2";

export default function SubmitReleasePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [releaseType, setReleaseType] = useState<"single" | "album">("single");
  const [artistName, setArtistName] = useState("");
  const [artistFullName, setArtistFullName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [version, setVersion] = useState("Оригинал");
  const [genre, setGenre] = useState("");

  const [filesLink, setFilesLink] = useState("");
  const [coverLink, setCoverLink] = useState("");
  const [yandexCardLink, setYandexCardLink] = useState("");

  const [hasWords, setHasWords] = useState<"yes" | "no">("yes");
  const [hasExplicit, setHasExplicit] = useState<"yes" | "no">("no");
  const [releaseDate, setReleaseDate] = useState("");
  const [promoText, setPromoText] = useState("");
  const [comment, setComment] = useState("");

  const [contactTelegram, setContactTelegram] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.artistName) setArtistName(parsed.artistName);
        if (parsed.artistFullName) setArtistFullName(parsed.artistFullName);
        if (parsed.trackName) setTrackName(parsed.trackName);
        if (parsed.subtitle) setSubtitle(parsed.subtitle);
        if (parsed.version) setVersion(parsed.version);
        if (parsed.genre) setGenre(parsed.genre);
        if (parsed.releaseType) setReleaseType(parsed.releaseType);
        if (parsed.filesLink) setFilesLink(parsed.filesLink);
        if (parsed.coverLink) setCoverLink(parsed.coverLink);
        if (parsed.yandexCardLink) setYandexCardLink(parsed.yandexCardLink);
        if (parsed.hasWords) setHasWords(parsed.hasWords);
        if (parsed.hasExplicit) setHasExplicit(parsed.hasExplicit);
        if (parsed.releaseDate) setReleaseDate(parsed.releaseDate);
        if (parsed.promoText) setPromoText(parsed.promoText);
        if (parsed.comment) setComment(parsed.comment);
        if (parsed.contactTelegram) setContactTelegram(parsed.contactTelegram);
      }
    } catch {}
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    try {
      const draft = {
        artistName,
        artistFullName,
        trackName,
        subtitle,
        version,
        genre,
        releaseType,
        filesLink,
        coverLink,
        yandexCardLink,
        hasWords,
        hasExplicit,
        releaseDate,
        promoText,
        comment,
        contactTelegram,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    } catch {}
  }, [
    artistName,
    artistFullName,
    trackName,
    subtitle,
    version,
    genre,
    releaseType,
    filesLink,
    coverLink,
    yandexCardLink,
    hasWords,
    hasExplicit,
    releaseDate,
    promoText,
    comment,
    contactTelegram,
  ]);

  // Validation per step
  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!artistName.trim()) {
        setError("Пожалуйста, укажите псевдоним артиста.");
        return false;
      }
      if (!trackName.trim()) {
        setError("Пожалуйста, укажите название трека или альбома.");
        return false;
      }
      if (!genre.trim()) {
        setError("Пожалуйста, выберите жанр музыки.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!filesLink.trim()) {
        setError("Укажите ссылку на аудиофайлы (Яндекс Диск, Google Drive, Облако Mail).");
        return false;
      }
      return true;
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      if (!contactTelegram.trim()) {
        setError("Укажите Telegram для связи с модерацией (например, @artist_tg).");
        return false;
      }
      if (!agreementChecked) {
        setError("Необходимо согласие с условиями оферты лейбла.");
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as any);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1) as any);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setError(null);
    setWarning(null);
    setLoading(true);

    try {
      const formattedTg = contactTelegram.trim().startsWith("@")
        ? contactTelegram.trim()
        : `@${contactTelegram.trim()}`;

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
          audio_link: filesLink.trim(),
          files_link: filesLink.trim(),
          cover_link: coverLink.trim() || null,
          links: null,
          promo_text: promoText.trim() || null,
          subtitle: subtitle.trim() || null,
          has_words: hasWords === "yes",
          artist_full_name: artistFullName.trim() || null,
          version: version.trim() || "Оригинал",
          yandex_card_link: yandexCardLink.trim() || null,
          has_explicit: hasExplicit === "yes",
          comment: comment.trim() || null,
          contact_telegram: formattedTg,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (json.needsAuth) {
          setError("Вы не авторизованы. Войдите в личный кабинет, чтобы отправить релиз.");
          setTimeout(() => router.push("/auth/login"), 2000);
          return;
        }
        throw new Error(json.error || "Не удалось отправить заявку. Попробуйте еще раз.");
      }

      // Success! Clear draft
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}

      setSubmittedId(json.id);
      if (json.warning) {
        setWarning(json.warning);
      }

      // Trigger Confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#b44bff", "#53f6ff", "#ff4bd6", "#ffffff"],
      });
    } catch (err: any) {
      setError(err.message || "Ошибка отправки заявки.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-padding pt-28 sm:pt-36">
      <Container className="max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge text-[11px] font-bold uppercase tracking-widest text-neon mb-3 shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-neon" />
            Цифровая дистрибуция
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            Отправить релиз
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-lg mx-auto">
            Заполните анкету трека для модерации и мировой отгрузки на стриминговые площадки.
          </p>

          {draftSaved && (
            <p className="mt-2 text-xs text-aqua/80 animate-pulse">
              ✓ Черновик сохранен локально
            </p>
          )}
        </div>

        {/* Success Modal / Card */}
        {submittedId ? (
          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-neon/50 text-center shadow-glowStrong space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-neon via-magenta to-aqua p-0.5 mx-auto shadow-glow flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-night flex items-center justify-center">
                <Check className="w-8 h-8 text-aqua" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Релиз принят на модерацию!
              </h2>
              <p className="mt-2 text-sm text-white/70 max-w-md mx-auto">
                Ваша анкета на трек <strong className="text-white">«{trackName}»</strong> успешно зарегистрирована в системе CXRNER MUSIC.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Номер заявки:</span>
                <span className="font-mono text-neon font-semibold truncate max-w-[200px]">{submittedId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Статус:</span>
                <span className="text-yellow-400 font-semibold">На модерации (pending)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Сроки проверки:</span>
                <span className="text-white/80">1–3 рабочих дня</span>
              </div>
            </div>

            {warning && (
              <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs text-left">
                {warning}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/dashboard/release/${submittedId}`}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-neon to-aqua text-night font-bold text-xs sm:text-sm uppercase tracking-wider shadow-glow text-center transition hover:scale-102"
              >
                Открыть статус в кабинете
              </Link>
              <Link
                href="/dashboard"
                className="py-3.5 px-6 rounded-xl glass-badge border border-white/15 text-white text-xs sm:text-sm font-semibold text-center hover:bg-white/10 transition"
              >
                Все мои релизы
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-step Form Container */
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            {/* Step Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[
                  { num: 1, label: "Трек" },
                  { num: 2, label: "Файлы" },
                  { num: 3, label: "Детали" },
                  { num: 4, label: "Контакты" },
                ].map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < currentStep) setCurrentStep(s.num as any);
                    }}
                    className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                      currentStep === s.num
                        ? "text-neon font-bold"
                        : currentStep > s.num
                        ? "text-aqua cursor-pointer"
                        : "text-white/30 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        currentStep === s.num
                          ? "bg-neon text-night font-bold shadow-glow"
                          : currentStep > s.num
                          ? "bg-aqua/20 text-aqua border border-aqua/40"
                          : "bg-white/5 text-white/40"
                      }`}
                    >
                      {currentStep > s.num ? "✓" : s.num}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Progress Line */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon via-magenta to-aqua transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ================= STEP 1: ОСНОВНАЯ ИНФОРМАЦИЯ ================= */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Тип релиза
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {releaseTypes.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setReleaseType(t.id as any)}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition text-left flex items-center gap-2.5 ${
                            releaseType === t.id
                              ? "border-neon bg-neon/15 text-white shadow-glow"
                              : "border-white/10 bg-black/30 text-white/60 hover:border-white/25"
                          }`}
                        >
                          <Disc className={`w-4 h-4 ${releaseType === t.id ? "text-neon" : "text-white/40"}`} />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Псевдоним артиста *
                      </label>
                      <input
                        type="text"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Например: KAZUMAI"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        ФИО артиста (по паспорту)
                      </label>
                      <input
                        type="text"
                        value={artistFullName}
                        onChange={(e) => setArtistFullName(e.target.value)}
                        placeholder="Иванов Иван Иванович"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Название трека / альбома *
                      </label>
                      <input
                        type="text"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        placeholder="Например: Neon Drift"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Подзаголовок / фит (необязательно)
                      </label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="feat. ARTIST NAME"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Жанр музыки *
                      </label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      >
                        <option value="">Выберите жанр...</option>
                        {genres.map((g) => (
                          <option key={g} value={g} className="bg-night text-white">
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Версия трека
                      </label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="Оригинал, Slowed, Sped Up..."
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: ФАЙЛЫ И ССЫЛКИ ================= */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="p-4 rounded-2xl bg-neon/10 border border-neon/30 text-xs leading-relaxed text-white/80">
                    <p className="font-semibold text-neonSoft mb-1">Требования к аудиоматериалам:</p>
                    <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Формат аудио: <strong>WAV 16/24 bit, 44.1/48 kHz</strong> (или FLAC).</li>
                      <li>Скриншот открытого проекта в DAW (FL Studio, Ableton, Logic и др.) подтверждает ваше авторство.</li>
                      <li>Загрузите файлы на Яндекс Диск или Google Drive и откройте общий доступ по ссылке.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Ссылка на файлы (Аудио WAV + скриншот DAW) *
                    </label>
                    <input
                      type="url"
                      value={filesLink}
                      onChange={(e) => setFilesLink(e.target.value)}
                      placeholder="https://disk.yandex.ru/d/... или Google Drive"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Ссылка на обложку (3000x3000px, JPG/PNG)
                    </label>
                    <input
                      type="url"
                      value={coverLink}
                      onChange={(e) => setCoverLink(e.target.value)}
                      placeholder="Ссылка на файл обложки (или приложите в общую папку)"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Ссылка на карточку Яндекс Музыки (если уже есть)
                    </label>
                    <input
                      type="url"
                      value={yandexCardLink}
                      onChange={(e) => setYandexCardLink(e.target.value)}
                      placeholder="https://music.yandex.ru/artist/..."
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* ================= STEP 3: ДЕТАЛИ И МОДЕРАЦИЯ ================= */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Наличие текста в треке
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setHasWords("yes")}
                          className={`py-3 rounded-xl text-xs font-semibold border transition ${
                            hasWords === "yes"
                              ? "border-neon bg-neon/15 text-white shadow-glow"
                              : "border-white/10 bg-black/30 text-white/60"
                          }`}
                        >
                          Да, есть вокал
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasWords("no")}
                          className={`py-3 rounded-xl text-xs font-semibold border transition ${
                            hasWords === "no"
                              ? "border-neon bg-neon/15 text-white shadow-glow"
                              : "border-white/10 bg-black/30 text-white/60"
                          }`}
                        >
                          Инструментал
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                        Ненормативная лексика (Explicit)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setHasExplicit("no")}
                          className={`py-3 rounded-xl text-xs font-semibold border transition ${
                            hasExplicit === "no"
                              ? "border-aqua bg-aqua/15 text-white shadow-glowAqua"
                              : "border-white/10 bg-black/30 text-white/60"
                          }`}
                        >
                          Нет (Clean)
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasExplicit("yes")}
                          className={`py-3 rounded-xl text-xs font-semibold border transition ${
                            hasExplicit === "yes"
                              ? "border-magenta bg-magenta/15 text-white shadow-glowMagenta"
                              : "border-white/10 bg-black/30 text-white/60"
                          }`}
                        >
                          Да (Explicit 18+)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Желаемая дата релиза (рекомендуем за 2-3 недели для промо)
                    </label>
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Промо-описание для редакторов стримингов
                    </label>
                    <textarea
                      rows={3}
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      placeholder="О чем этот трек, какое настроение, история создания, где планируется продвижение..."
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Комментарий для команды лейбла
                    </label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Особые пожелания или примечания"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* ================= STEP 4: КОНТАКТЫ И ПРОВЕРКА ================= */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Ваш контактный Telegram *
                    </label>
                    <div className="relative">
                      <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={contactTelegram}
                        onChange={(e) => setContactTelegram(e.target.value)}
                        placeholder="@username"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-neon focus:outline-none transition"
                      />
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      Модератор свяжется с вами по этому никнейму при необходимости правок.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
                    <p className="font-bold uppercase tracking-wider text-neon mb-2">Итоговая проверка анкеты:</p>
                    <div className="grid grid-cols-2 gap-2 text-white/70">
                      <div>Артист: <strong className="text-white">{artistName}</strong></div>
                      <div>Название: <strong className="text-white">{trackName}</strong></div>
                      <div>Тип: <strong className="text-white">{releaseType === "single" ? "Сингл" : "Альбом"}</strong></div>
                      <div>Жанр: <strong className="text-white">{genre}</strong></div>
                      <div>Дата релиза: <strong className="text-white">{releaseDate || "Как можно скорее"}</strong></div>
                      <div>Explicit: <strong className="text-white">{hasExplicit === "yes" ? "Да" : "Нет"}</strong></div>
                    </div>
                  </div>

                  {/* Agreement Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={agreementChecked}
                      onChange={(e) => setAgreementChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-black text-neon focus:ring-neon"
                    />
                    <span className="text-xs text-white/65 leading-relaxed">
                      Я подтверждаю, что обладаю полными авторскими правами на аудиоматериал, и согласен с условиями{" "}
                      <Link href="/offer" target="_blank" className="text-aqua underline hover:text-white">
                        Публичной оферты лейбла 70/30
                      </Link>.
                    </span>
                  </label>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full glass-badge border border-white/15 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Назад
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-1.5 px-7 py-3 rounded-full bg-gradient-to-r from-neon to-aqua text-night font-bold text-xs uppercase tracking-wider shadow-glow hover:scale-105 active:scale-95 transition"
                  >
                    Продолжить
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-neon via-magenta to-aqua text-night font-bold text-xs sm:text-sm uppercase tracking-wider shadow-glow hover:shadow-glowStrong hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-night border-t-transparent rounded-full animate-spin" />
                        Отправка заявки...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-night" />
                        Отправить релиз на модерацию
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </Container>
    </div>
  );
}
