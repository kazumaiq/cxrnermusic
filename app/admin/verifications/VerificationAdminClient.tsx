"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Clock,
  KeyRound,
  User,
  Send,
  Globe,
  Music2,
  Sparkles,
  Search,
  RefreshCw,
  Copy,
  FileText,
  ShieldAlert,
} from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import type { CxrnerArtistVerification } from "@/lib/ecosystemTypes";

interface VerificationAdminClientProps {
  embedded?: boolean;
  onStatsChange?: (stats: {
    total: number;
    pending: number;
    needs_info: number;
    verified: number;
    rejected: number;
  }) => void;
}

export default function VerificationAdminClient({
  embedded = false,
  onStatsChange,
}: VerificationAdminClientProps) {
  const [applications, setApplications] = useState<CxrnerArtistVerification[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    needs_info: 0,
    verified: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state for review decision
  const [selectedApp, setSelectedApp] = useState<CxrnerArtistVerification | null>(null);
  const [decision, setDecision] = useState<
    "verified" | "rejected" | "needs_info" | "not_verified"
  >("verified");
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${statusFilter}`);
      const data = await res.json();
      if (data.ok) {
        setApplications(data.applications || []);
        if (data.stats) {
          setStats(data.stats);
          onStatsChange?.(data.stats);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, onStatsChange]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleQuickApprove = async (app: CxrnerArtistVerification) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: app.id,
          targetUserId: app.user_id,
          decision: "verified",
          notes: "Данные артиста проверены и подтверждены администратором CXRNER.",
          rejectReason: "",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchVerifications();
      } else {
        alert(data.error || "Ошибка подтверждения");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: selectedApp.id,
          targetUserId: selectedApp.user_id,
          decision,
          notes,
          rejectReason: decision === "rejected" ? rejectReason : "",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedApp(null);
        setNotes("");
        setRejectReason("");
        await fetchVerifications();
      } else {
        alert(data.error || "Ошибка сохранения решения");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const acc = app.account_summary;
    return (
      (app.stage_name || "").toLowerCase().includes(q) ||
      (acc?.display_name || "").toLowerCase().includes(q) ||
      (acc?.username || "").toLowerCase().includes(q) ||
      (acc?.email || "").toLowerCase().includes(q) ||
      (acc?.telegram_username || "").toLowerCase().includes(q) ||
      (app.verification_code || "").toLowerCase().includes(q) ||
      (app.user_id || "").toLowerCase().includes(q)
    );
  });

  const content = (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#00F0FF] mb-1">
            // ARTIST VERIFICATION & IDENTITY DOSSIER
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Верификация и анкеты артистов
          </h1>
          <p className="text-xs text-[#D9D9E2]/65 mt-1">
            Все данные, ссылки на площадки, соцсети и проверочные коды, указанные артистами. Только администратор может верифицировать аккаунт.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchVerifications}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B46BFF]" : ""}`} />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#090611] border border-white/10">
          <div className="text-[10px] font-mono uppercase text-[#D9D9E2]/55">Всего анкет</div>
          <div className="font-display font-black text-2xl text-white mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/30">
          <div className="text-[10px] font-mono uppercase text-amber-300">Ожидают проверки</div>
          <div className="font-display font-black text-2xl text-amber-300 mt-1">{stats.pending}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#00F0FF]/[0.06] border border-[#00F0FF]/30">
          <div className="text-[10px] font-mono uppercase text-[#00F0FF]">Запрошены данные</div>
          <div className="font-display font-black text-2xl text-[#00F0FF] mt-1">
            {stats.needs_info}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/30">
          <div className="text-[10px] font-mono uppercase text-emerald-300">Верифицировано</div>
          <div className="font-display font-black text-2xl text-emerald-400 mt-1">
            {stats.verified}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/30">
          <div className="text-[10px] font-mono uppercase text-red-300">Отклонено</div>
          <div className="font-display font-black text-2xl text-red-400 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#090611] border border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Все артисты", count: stats.total },
            { id: "pending", label: "Ожидают проверки", count: stats.pending },
            { id: "needs_info", label: "Нужны данные", count: stats.needs_info },
            { id: "verified", label: "Верифицированы", count: stats.verified },
            { id: "rejected", label: "Отклонены", count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-mono text-xs transition flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-[#8737FF] text-white font-bold shadow-[0_0_20px_rgba(135,55,255,0.4)]"
                  : "bg-white/5 text-[#D9D9E2]/60 hover:text-white border border-white/10"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id ? "bg-white text-[#8737FF]" : "bg-white/10 text-white"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative min-w-[250px]">
          <Search className="w-3.5 h-3.5 text-[#D9D9E2]/40 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по артисту, @username, Telegram, коду..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#050407] border border-white/10 text-xs text-white placeholder-[#D9D9E2]/40 focus:outline-none focus:border-[#8737FF]"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-[#D9D9E2]/50 font-mono text-xs">
            Загрузка заявок и данных артистов...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#090611] border border-white/10 text-center text-[#D9D9E2]/40 font-mono text-xs">
            Заявок в выбранной категории не найдено
          </div>
        ) : (
          filteredApps.map((app) => {
            const acc = app.account_summary;
            const art = app.artist_profile;
            const tgHandle = (app.contact_telegram || acc?.telegram_username || "").replace(
              /^@/,
              ""
            );

            // Combine all unique links (evidence + artist profile + cxrner_id profile)
            const allLinks: Array<{ title: string; url: string; source: string }> = [];
            const addLink = (title: string, url?: string | null, source = "Заявка") => {
              if (!url || !url.trim()) return;
              const clean = url.trim();
              if (!allLinks.some((l) => l.url === clean)) {
                allLinks.push({ title, url: clean, source });
              }
            };

            app.evidence_links?.forEach((l) => addLink(l.title || "Ссылка", l.url, "Заявка"));
            addLink("Яндекс Музыка", art?.yandex_music_url, "Карточка артиста");
            addLink("Spotify", art?.spotify_url, "Карточка артиста");
            addLink("Apple Music", art?.apple_music_url, "Карточка артиста");
            addLink("VK Музыка", art?.vk_music_url, "Карточка артиста");
            addLink("Telegram-канал", art?.telegram_url, "Карточка артиста");
            acc?.music_links?.forEach((m) =>
              addLink(m.platform || "Площадка", m.url, "Профиль CXRNER ID")
            );
            acc?.social_links?.forEach((s) =>
              addLink(s.platform || "Соцсеть", s.url, "Профиль CXRNER ID")
            );

            const genres =
              app.genres?.length
                ? app.genres
                : art?.genres?.length
                ? art.genres
                : acc?.genres || [];

            return (
              <div
                key={app.id || app.user_id}
                className={`p-6 rounded-3xl bg-[#090611] border transition space-y-5 ${
                  app.status === "pending"
                    ? "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.08)]"
                    : app.status === "verified"
                    ? "border-emerald-500/30"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Top Row: Artist Identity + Status Badge + Admin Actions */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8737FF]/30 to-[#00F0FF]/20 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                      {acc?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={acc.avatar_url}
                          alt={app.stage_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-6 h-6 text-[#B46BFF]" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-black text-xl text-white tracking-tight">
                          {app.stage_name}
                        </h3>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                            app.status === "verified"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : app.status === "rejected"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : app.status === "needs_info"
                              ? "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30"
                              : app.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-white/10 text-[#D9D9E2]/70 border border-white/15"
                          }`}
                        >
                          {app.status === "verified"
                            ? "✓ ВЕРИФИЦИРОВАН"
                            : app.status === "pending"
                            ? "⏳ ОЖИДАЕТ ПРОВЕРКИ АДМИНОМ"
                            : app.status === "needs_info"
                            ? "? ЗАПРОШЕНЫ ДАННЫЕ"
                            : app.status === "rejected"
                            ? "✕ ОТКЛОНЕНО"
                            : "БЕЗ ЗАЯВКИ / ПРОФИЛЬ"}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#D9D9E2]/70 uppercase">
                          {app.method === "code" ? "Код в био" : "Ручная анкета"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#D9D9E2]/60">
                        {acc?.username && (
                          <span>
                            Профиль: <strong className="text-white">@{acc.username}</strong>
                          </span>
                        )}
                        {acc?.email && (
                          <span>
                            Email: <strong className="text-white">{acc.email}</strong>
                          </span>
                        )}
                        <span>
                          User ID: <span className="text-[#D9D9E2]/80">{app.user_id}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Admin Verification Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {app.status !== "verified" && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleQuickApprove(app)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-extrabold flex items-center gap-1.5 transition shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Верифицировать артиста</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApp(app);
                        setDecision(app.status === "verified" ? "not_verified" : "verified");
                        setNotes(app.reviewer_notes || "");
                        setRejectReason(app.reject_reason || "");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#8737FF]/20 hover:bg-[#8737FF]/30 border border-[#8737FF]/40 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#B46BFF]" />
                      <span>Решение / Комментарий</span>
                    </button>

                    <Link
                      href={`/admin/users/${app.user_id}`}
                      className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#D9D9E2] flex items-center gap-1.5 transition"
                    >
                      <User className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>Досье</span>
                    </Link>
                  </div>
                </div>

                {/* Middle Grid: Submitted Artist Data + Verification Code + Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Column 1: Verification Code & Method */}
                  <div className="p-4 rounded-2xl bg-[#050407] border border-white/10 space-y-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-[#00F0FF] font-bold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Данные верификации</span>
                    </div>

                    {app.verification_code ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                        <div>
                          <div className="text-[10px] text-[#D9D9E2]/60">Проверочный код:</div>
                          <div className="text-sm font-black text-[#00F0FF] tracking-wider">
                            {app.verification_code}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(app.verification_code || "");
                            setCopiedCodeId(app.id);
                            setTimeout(() => setCopiedCodeId(null), 1500);
                          }}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                          title="Скопировать код"
                        >
                          {copiedCodeId === app.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[#D9D9E2]/50">
                        Код не генерировался (ручная проверка ссылок)
                      </div>
                    )}

                    <div className="space-y-1 pt-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#D9D9E2]/50">Дата подачи:</span>
                        <span className="text-white">
                          {new Date(app.updated_at || app.created_at).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      {app.release_links && (
                        <div className="pt-1 border-t border-white/5">
                          <span className="text-[#D9D9E2]/50 block">Релизы / UPC:</span>
                          <span className="text-white break-all">{app.release_links}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Artist Questionnaire Details */}
                  <div className="p-4 rounded-2xl bg-[#050407] border border-white/10 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#B46BFF] font-bold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Анкета артиста</span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#D9D9E2]/50">Формат:</span>
                        <span className="text-white uppercase font-bold">
                          {app.project_type || art?.project_type || "solo"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#D9D9E2]/50">Локация:</span>
                        <span className="text-white">
                          {app.country || acc?.country || "RU"}
                          {app.city || acc?.city ? `, ${app.city || acc?.city}` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#D9D9E2]/50">Заполненность ID:</span>
                        <span className="text-emerald-400 font-bold">
                          {acc?.completion_percentage || 0}%
                        </span>
                      </div>
                    </div>

                    {genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {genres.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 rounded-md bg-[#8737FF]/20 text-[#B46BFF] text-[10px]"
                          >
                            #{g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Contacts & Bio */}
                  <div className="p-4 rounded-2xl bg-[#050407] border border-white/10 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      <span>Связь с артистом и био</span>
                    </div>

                    {tgHandle ? (
                      <a
                        href={`https://t.me/${tgHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8737FF]/15 border border-[#8737FF]/35 text-[#B46BFF] hover:text-white transition text-xs font-bold"
                      >
                        <Send className="w-3 h-3" />
                        <span>@{tgHandle}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <div className="text-[#D9D9E2]/40 text-[11px]">Telegram не указан</div>
                    )}

                    {(app.bio || acc?.bio) && (
                      <p className="text-[11px] font-sans text-[#D9D9E2]/80 leading-relaxed line-clamp-3 pt-1">
                        {app.bio || acc?.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Artist Comment / Evidence Notes */}
                {app.evidence_notes && (
                  <div className="p-4 rounded-2xl bg-[#8737FF]/[0.06] border border-[#8737FF]/25 text-xs space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#B46BFF] font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Комментарий артиста к заявке:</span>
                    </div>
                    <p className="text-white/90 leading-relaxed">{app.evidence_notes}</p>
                  </div>
                )}

                {/* All Links for Verification */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#D9D9E2]/50">
                    Ссылки на карточки артиста и соцсети для проверки ({allLinks.length}):
                  </div>
                  {allLinks.length === 0 ? (
                    <div className="text-xs font-mono text-[#D9D9E2]/40">
                      Ссылки ещё не прикреплены артистом
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {allLinks.map((l, idx) => (
                        <a
                          key={idx}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-2 text-xs font-mono transition group"
                        >
                          <div className="truncate">
                            <span className="text-white font-bold mr-1.5">{l.title}:</span>
                            <span className="text-[#00F0FF] group-hover:underline">{l.url}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviewer History if any */}
                {(app.reviewed_at || app.reviewer_notes || app.reject_reason) && (
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#D9D9E2]/60">
                    <div>
                      Проверено:{" "}
                      <span className="text-white">{app.reviewed_by || "Администратор"}</span>{" "}
                      {app.reviewed_at
                        ? `(${new Date(app.reviewed_at).toLocaleString("ru-RU")})`
                        : ""}
                    </div>
                    {(app.reject_reason || app.reviewer_notes) && (
                      <div className="text-amber-300">
                        Примечание модератора: {app.reject_reason || app.reviewer_notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0C0814] border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                  // VERIFICATION DECISION
                </div>
                <h3 className="font-display font-bold text-xl text-white mt-0.5">
                  Решение по артисту «{selectedApp.stage_name}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-xs font-mono text-[#D9D9E2]/50 hover:text-white"
              >
                ✕ Закрыть
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecision("verified")}
                  className={`p-3 rounded-2xl border font-mono text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    decision === "verified"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Верифицировать (+100 CXP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("needs_info")}
                  className={`p-3 rounded-2xl border font-mono text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    decision === "needs_info"
                      ? "bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Запросить данные</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("rejected")}
                  className={`p-3 rounded-2xl border font-mono text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    decision === "rejected"
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  <span>Отклонить заявку</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("not_verified")}
                  className={`p-3 rounded-2xl border font-mono text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    decision === "not_verified"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-white/5 border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Снять верификацию</span>
                </button>
              </div>

              {decision === "rejected" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-red-300">
                    Причина отказа (отобразится артисту в кабинете) *
                  </label>
                  <input
                    type="text"
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Например: Проверочный код не найден в описании карточки артиста"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-red-500/30 text-white text-xs focus:outline-none focus:border-red-400"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#D9D9E2]/60">
                  Комментарий администратора для артиста
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Уточнения по заявке или комментарий модератора..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#050407] border border-white/10 text-white text-xs focus:outline-none focus:border-[#8737FF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-xs font-mono text-[#D9D9E2]/70 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#8737FF] text-white font-mono text-xs font-bold hover:bg-[#7225e8] transition disabled:opacity-50"
                >
                  {submitting ? "Сохранение..." : "Подтвердить решение"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pb-24">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">{content}</div>
    </div>
  );
}
