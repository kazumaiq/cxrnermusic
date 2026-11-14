"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Music2,
  KeyRound,
  FileText,
  Sparkles,
  Send,
  Globe,
  UserCheck,
  Edit3,
} from "lucide-react";
import type {
  CxrnerArtistProfile,
  CxrnerArtistVerification,
  CxrnerProfile,
} from "@/lib/ecosystemTypes";

interface VerificationClientProps {
  profile: CxrnerProfile | null;
  artistProfile: CxrnerArtistProfile | null;
  initialVerification: CxrnerArtistVerification | null;
}

export default function VerificationClient({
  profile,
  artistProfile,
  initialVerification,
}: VerificationClientProps) {
  const [verification, setVerification] = useState<CxrnerArtistVerification | null>(
    initialVerification
  );
  const [currentArtistProfile, setCurrentArtistProfile] = useState<CxrnerArtistProfile | null>(
    artistProfile
  );

  const existingLinks = initialVerification?.evidence_links || [];
  const defaultDsp1 =
    existingLinks[0]?.url ||
    artistProfile?.yandex_music_url ||
    artistProfile?.spotify_url ||
    profile?.music_links?.[0]?.url ||
    "";
  const defaultDsp2 =
    existingLinks[1]?.url ||
    artistProfile?.spotify_url ||
    artistProfile?.apple_music_url ||
    artistProfile?.vk_music_url ||
    profile?.music_links?.[1]?.url ||
    "";
  const defaultSocial =
    existingLinks[2]?.url ||
    artistProfile?.telegram_url ||
    artistProfile?.instagram_url ||
    profile?.social_links?.[0]?.url ||
    "";

  const [stageName, setStageName] = useState(
    initialVerification?.stage_name && initialVerification.stage_name !== "Artist"
      ? initialVerification.stage_name
      : artistProfile?.stage_name || profile?.display_name || ""
  );
  const [projectType, setProjectType] = useState<"solo" | "duo" | "band" | "collective">(
    initialVerification?.project_type || artistProfile?.project_type || "solo"
  );
  const [genresText, setGenresText] = useState(
    (
      initialVerification?.genres?.length
        ? initialVerification.genres
        : artistProfile?.genres?.length
        ? artistProfile.genres
        : profile?.genres || []
    ).join(", ")
  );
  const [country, setCountry] = useState(
    initialVerification?.country || artistProfile?.country || profile?.country || "RU"
  );
  const [city, setCity] = useState(
    initialVerification?.city || artistProfile?.city || profile?.city || ""
  );
  const [contactTelegram, setContactTelegram] = useState(
    initialVerification?.contact_telegram ||
      (profile?.telegram_username ? `@${profile.telegram_username.replace(/^@/, "")}` : "")
  );
  const [bio, setBio] = useState(
    initialVerification?.bio || artistProfile?.bio || profile?.bio || ""
  );
  const [releaseLinks, setReleaseLinks] = useState(initialVerification?.release_links || "");

  const [method, setMethod] = useState<"code" | "manual">(
    initialVerification?.method === "manual" ? "manual" : "code"
  );
  const [verCode, setVerCode] = useState(initialVerification?.verification_code || "");
  const [generatingCode, setGeneratingCode] = useState(false);

  const [dspUrl1, setDspUrl1] = useState(defaultDsp1);
  const [dspUrl2, setDspUrl2] = useState(defaultDsp2);
  const [socialUrl, setSocialUrl] = useState(defaultSocial);
  const [notes, setNotes] = useState(initialVerification?.evidence_notes || "");

  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingPending, setIsEditingPending] = useState(false);

  const status = profile?.is_artist_verified
    ? "verified"
    : verification?.status || artistProfile?.verification_status || "not_verified";

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/cabinet/verification?action=generate_code");
      const data = await res.json();
      if (data.ok && data.code) {
        setVerCode(data.code);
      } else {
        setErrorMsg(data.error || "Ошибка генерации кода");
      }
    } catch {
      setErrorMsg("Сбой соединения с сервером");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (!verCode) return;
    navigator.clipboard.writeText(verCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!stageName.trim()) {
      setErrorMsg("Укажите сценическое имя артиста");
      return;
    }

    const links: Array<{ title: string; url: string }> = [];
    if (dspUrl1.trim()) links.push({ title: "Основная площадка (DSP #1)", url: dspUrl1.trim() });
    if (dspUrl2.trim()) links.push({ title: "Доп. площадка (DSP #2)", url: dspUrl2.trim() });
    if (socialUrl.trim()) links.push({ title: "Официальная соцсеть / канал", url: socialUrl.trim() });

    if (links.length === 0) {
      setErrorMsg("Укажите хотя бы одну ссылку на карточку артиста или официальное сообщество");
      return;
    }

    const parsedGenres = genresText
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const res = await fetch("/api/cabinet/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName: stageName.trim(),
          method,
          verificationCode: verCode || null,
          evidenceLinks: links,
          evidenceNotes: notes.trim(),
          projectType,
          genres: parsedGenres,
          country: country.trim() || "RU",
          city: city.trim(),
          contactTelegram: contactTelegram.trim(),
          bio: bio.trim(),
          releaseLinks: releaseLinks.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setVerification(data.application);
        if (data.artistProfile) {
          setCurrentArtistProfile(data.artistProfile);
        }
        setIsEditingPending(false);
        setSuccessMsg(
          "Заявка и анкета артиста отправлены в Админ-панель CXRNER! После ручной проверки всех данных администратором ваш аккаунт получит статус CXRNER VERIFIED."
        );
      } else {
        setErrorMsg(data.error || "Ошибка отправки заявки");
      }
    } catch {
      setErrorMsg("Ошибка отправки заявки");
    } finally {
      setSubmitting(false);
    }
  };

  const showForm =
    status !== "verified" && (status !== "pending" || isEditingPending);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0F0A1C] via-[#090611] to-[#050407] border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#8737FF]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8737FF]/15 border border-[#8737FF]/35 text-[#B46BFF] font-mono text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VERIFIED ARTIST IDENTITY // РУЧНАЯ МОДЕРАЦИЯ</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Верификация артиста CXRNER
            </h1>
            <p className="text-sm text-[#D9D9E2]/70 leading-relaxed">
              Заполните анкету артиста и прикрепите ссылки на площадки. Все указанные вами данные
              поступают напрямую в закрытую панель администратора лейбла. Статус{" "}
              <span className="text-white font-semibold">CXRNER VERIFIED</span> и награда{" "}
              <span className="text-[#00F0FF] font-mono font-bold">+100 CXP</span> присваиваются
              после личной проверки администратором.
            </p>
          </div>

          {/* Current Status Pill */}
          <div className="shrink-0">
            {status === "verified" && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Статус аккаунта
                  </div>
                  <div className="font-display font-bold text-sm">ВЕРИФИЦИРОВАН</div>
                </div>
              </div>
            )}
            {status === "pending" && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <Clock className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Статус заявки
                  </div>
                  <div className="font-display font-bold text-sm">НА ПРОВЕРКЕ У АДМИНА</div>
                </div>
              </div>
            )}
            {status === "needs_info" && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Статус заявки
                  </div>
                  <div className="font-display font-bold text-sm">НУЖНЫ УТОЧНЕНИЯ</div>
                </div>
              </div>
            )}
            {status === "rejected" && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Статус заявки
                  </div>
                  <div className="font-display font-bold text-sm">ОТКЛОНЕНО</div>
                </div>
              </div>
            )}
            {(status === "not_verified" || status === "draft") && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#D9D9E2]/70">
                <Music2 className="w-6 h-6 text-[#B46BFF] shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Статус аккаунта
                  </div>
                  <div className="font-display font-bold text-sm text-white">НЕ ПОДТВЕРЖДЁН</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer Feedback Alert if rejected or needs_info */}
      {(status === "rejected" || status === "needs_info") &&
        (verification?.reject_reason || verification?.reviewer_notes) && (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3.5 text-sm text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white">Комментарий администратора CXRNER:</div>
              <p className="text-xs leading-relaxed">
                {verification.reject_reason || verification.reviewer_notes}
              </p>
            </div>
          </div>
        )}

      {/* Submitted Application Summary Card (when pending or verified) */}
      {verification && status !== "not_verified" && status !== "draft" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#090611]/90 border border-white/10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#8737FF]/15 border border-[#8737FF]/35 flex items-center justify-center text-[#B46BFF]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                  // АНКЕТА АРТИСТА В БАЗЕ МОДЕРАЦИИ
                </div>
                <h2 className="font-display font-bold text-lg text-white">
                  {verification.stage_name || currentArtistProfile?.stage_name}
                </h2>
              </div>
            </div>

            {status === "pending" && !isEditingPending && (
              <button
                type="button"
                onClick={() => setIsEditingPending(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#B46BFF]" />
                <span>Дополнить / изменить данные</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-[#D9D9E2]/50 text-[10px] uppercase">Способ подтверждения</div>
              <div className="text-white font-bold mt-1">
                {verification.method === "code" ? "Проверочный код в описании" : "Ручная анкета + ссылки"}
              </div>
            </div>
            {verification.verification_code && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="text-[#D9D9E2]/50 text-[10px] uppercase">Проверочный код</div>
                <div className="text-[#00F0FF] font-bold mt-1">{verification.verification_code}</div>
              </div>
            )}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-[#D9D9E2]/50 text-[10px] uppercase">Формат и локация</div>
              <div className="text-white font-bold mt-1 uppercase">
                {verification.project_type || currentArtistProfile?.project_type || "solo"} ·{" "}
                {verification.country || currentArtistProfile?.country || "RU"}
                {verification.city || currentArtistProfile?.city
                  ? `, ${verification.city || currentArtistProfile?.city}`
                  : ""}
              </div>
            </div>
            {(verification.contact_telegram || profile?.telegram_username) && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="text-[#D9D9E2]/50 text-[10px] uppercase">Контактный Telegram</div>
                <div className="text-[#B46BFF] font-bold mt-1">
                  @{String(verification.contact_telegram || profile?.telegram_username).replace(/^@/, "")}
                </div>
              </div>
            )}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-[#D9D9E2]/50 text-[10px] uppercase">Дата подачи</div>
              <div className="text-white font-bold mt-1">
                {new Date(verification.updated_at || verification.created_at).toLocaleString("ru-RU")}
              </div>
            </div>
          </div>

          {verification.evidence_links?.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#D9D9E2]/50">
                Переданные ссылки для проверки администратором:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {verification.evidence_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-2 text-xs font-mono transition"
                  >
                    <div className="truncate">
                      <span className="text-[#D9D9E2]/50 mr-2">{link.title}:</span>
                      <span className="text-[#00F0FF]">{link.url}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {status === "verified" && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Награда +100 CXP и бейдж CXRNER VERIFIED активированы администратором</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Application Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-[#090611]/90 border border-white/10 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                {status === "pending"
                  ? "Редактирование заявки на верификацию"
                  : "Подача заявки на верификацию артиста"}
              </h2>
              <p className="text-xs text-[#D9D9E2]/60 mt-1">
                Все поля ниже передаются в панель администратора CXRNER для ручной сверки и подтверждения.
              </p>
            </div>
            {isEditingPending && (
              <button
                type="button"
                onClick={() => setIsEditingPending(false)}
                className="text-xs font-mono text-[#D9D9E2]/60 hover:text-white"
              >
                Отменить редактирование
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Block 1: Core Artist Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
                Сценическое имя артиста (никнейм на площадках) *
              </label>
              <input
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="Например: KAZUMA"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#050407] border border-white/10 text-white text-sm focus:outline-none focus:border-[#8737FF]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
                Формат проекта
              </label>
              <select
                value={projectType}
                onChange={(e) =>
                  setProjectType(e.target.value as "solo" | "duo" | "band" | "collective")
                }
                className="w-full px-4 py-3 rounded-2xl bg-[#050407] border border-white/10 text-white text-sm focus:outline-none focus:border-[#8737FF]"
              >
                <option value="solo">Сольный артист (Solo)</option>
                <option value="duo">Дуэт (Duo)</option>
                <option value="band">Группа (Band)</option>
                <option value="collective">Творческое объединение / Лейбл</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
                Основные жанры (через запятую)
              </label>
              <input
                type="text"
                value={genresText}
                onChange={(e) => setGenresText(e.target.value)}
                placeholder="Phonk, Trap, Electronic, Hyperpop"
                className="w-full px-4 py-3 rounded-2xl bg-[#050407] border border-white/10 text-white text-sm focus:outline-none focus:border-[#8737FF]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
                Ваш Telegram для связи с администратором *
              </label>
              <div className="relative">
                <Send className="w-4 h-4 text-[#B46BFF] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={contactTelegram}
                  onChange={(e) => setContactTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#050407] border border-white/10 text-white text-sm focus:outline-none focus:border-[#8737FF]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
                Страна
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#D9D9E2]/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="RU / KZ / BY / EU"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#050407] border border-white/10 text-white text-sm focus:outline-none focus:border-[#8737FF]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
                Город
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Москва / Санкт-Петербург / Алматы"
                className="w-full px-4 py-3 rounded-2xl bg-[#050407] border border-white/10 text-white text-sm focus:outline-none focus:border-[#8737FF]"
              />
            </div>
          </div>

          {/* Method Selector (Both go to manual Admin verification) */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#D9D9E2]/60">
              Способ подтверждения владения карточкой артиста
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("code")}
                className={`p-4 rounded-2xl border text-left transition ${
                  method === "code"
                    ? "bg-[#8737FF]/15 border-[#8737FF] text-white"
                    : "bg-[#050407] border-white/10 text-[#D9D9E2]/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00F0FF] mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>СПОСОБ 1: Проверочный код</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-80">
                  Разместите уникальный код CXRNER в описании карточки артиста или соцсети для быстрой проверки администратором.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMethod("manual")}
                className={`p-4 rounded-2xl border text-left transition ${
                  method === "manual"
                    ? "bg-[#8737FF]/15 border-[#8737FF] text-white"
                    : "bg-[#050407] border-white/10 text-[#D9D9E2]/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#B46BFF] mb-1">
                  <FileText className="w-4 h-4" />
                  <span>СПОСОБ 2: Полная ручная сверка</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-80">
                  Предоставьте ссылки на стриминговые площадки, официальные сообщества и релизы для сверки администратором.
                </p>
              </button>
            </div>
          </div>

          {/* Code Block for Method "code" */}
          {method === "code" && (
            <div className="p-5 rounded-2xl bg-[#050407] border border-[#00F0FF]/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#00F0FF] uppercase font-bold">
                    Ваш уникальный проверочный код:
                  </div>
                  <p className="text-xs text-[#D9D9E2]/65">
                    Временно добавьте этот код в описание профиля артиста (Яндекс Музыка, Spotify for Artists, VK или Telegram-канал). Администратор проверит его наличие.
                  </p>
                </div>

                {verCode ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 font-mono font-bold text-base text-white tracking-wider">
                      {verCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2.5 rounded-xl bg-[#8737FF] text-white hover:bg-[#7225e8] transition"
                      title="Скопировать код"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      disabled={generatingCode}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#D9D9E2]/70 hover:text-white transition"
                      title="Обновить код"
                    >
                      <RefreshCw className={`w-4 h-4 ${generatingCode ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    className="px-4 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs font-bold hover:bg-[#00F0FF]/25 transition flex items-center gap-2 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingCode ? "animate-spin" : ""}`} />
                    <span>Сгенерировать код</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Evidence Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#D9D9E2]/60">
                Карточка в Яндекс Музыке / Spotify *
              </label>
              <input
                type="url"
                value={dspUrl1}
                onChange={(e) => setDspUrl1(e.target.value)}
                placeholder="https://music.yandex.ru/artist/..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#8737FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#D9D9E2]/60">
                Вторая площадка (Spotify / Apple Music / VK Музыка)
              </label>
              <input
                type="url"
                value={dspUrl2}
                onChange={(e) => setDspUrl2(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#8737FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#D9D9E2]/60">
                Официальный паблик VK / Telegram-канал / Instagram *
              </label>
              <input
                type="url"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder="https://t.me/... или https://vk.com/..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#8737FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#D9D9E2]/60">
                Ссылки на релизы / UPC / SmartLink (необязательно)
              </label>
              <input
                type="text"
                value={releaseLinks}
                onChange={(e) => setReleaseLinks(e.target.value)}
                placeholder="UPC-код или ссылка на последний релиз"
                className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#8737FF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#D9D9E2]/60">
              Краткая информация об артисте / биография (отображается в профиле и у администратора)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о проекте, релизах и достижениях..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs focus:outline-none focus:border-[#8737FF] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#D9D9E2]/60">
              Комментарий для администратора (где размещён код, скриншоты личного кабинета и т.д.)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: Проверочный код размещён в описании Telegram-канала и в паблике VK. Дистрибьютор через CXRNER..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs focus:outline-none focus:border-[#8737FF] resize-none"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[11px] font-mono text-[#D9D9E2]/50">
              🔒 Подтверждение статуса артиста производится исключительно администратором лейбла после проверки анкеты.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#8737FF] to-[#5E17EB] text-white font-display font-bold text-sm hover:opacity-95 transition shadow-[0_0_25px_rgba(135,55,255,0.4)] disabled:opacity-50 shrink-0"
            >
              {submitting ? "Отправка анкеты..." : "Отправить на проверку администратору"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
