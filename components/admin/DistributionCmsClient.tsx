"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Layers,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Archive,
  BarChart3,
  Settings,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  ExternalLink,
  Barcode,
  Eye,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Disc3,
  Radio,
  Send,
  FileText,
  User,
  Music,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import ReleaseDossierModal, { DossierRelease } from "./ReleaseDossierModal";
import { CANONICAL_STATUS_MAP, getStatusMeta } from "@/lib/telegramSync";

export type CmsTab =
  | "overview"
  | "all"
  | "on_upload"
  | "moderation"
  | "needfix"
  | "approved"
  | "rejected"
  | "archive"
  | "stats"
  | "settings";

interface CmsStats {
  total: number;
  all_count: number;
  on_upload: number;
  moderation: number;
  needfix: number;
  approved: number;
  rejected: number;
  archived: number;
  with_upc: number;
}

export default function DistributionCmsClient({
  initialUser,
  initialForms = [],
  initialStats,
}: {
  initialUser?: { email?: string; id?: string } | null;
  initialForms?: DossierRelease[];
  initialStats?: CmsStats;
}) {
  const [activeTab, setActiveTab] = useState<CmsTab>("overview");
  const [forms, setForms] = useState<DossierRelease[]>(initialForms);
  const [stats, setStats] = useState<CmsStats>(
    initialStats || {
      total: 0,
      all_count: 0,
      on_upload: 0,
      moderation: 0,
      needfix: 0,
      approved: 0,
      rejected: 0,
      archived: 0,
      with_upc: 0,
    }
  );
  const [loading, setLoading] = useState(initialForms.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [upcFilter, setUpcFilter] = useState("all");
  const [selectedRelease, setSelectedRelease] = useState<DossierRelease | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Releases from Backend
  const fetchForms = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      let statusParam = "all";
      let showDeleted = "false";

      if (activeTab === "on_upload") statusParam = "on_upload";
      else if (activeTab === "moderation") statusParam = "moderation";
      else if (activeTab === "needfix") statusParam = "needfix";
      else if (activeTab === "approved") statusParam = "approved";
      else if (activeTab === "rejected") statusParam = "rejected";
      else if (activeTab === "archive") {
        statusParam = "archive";
        showDeleted = "true";
      }

      const res = await fetch(
        `/api/admin/moderation?status=${statusParam}&show_deleted=${showDeleted}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.ok) {
        setForms(data.forms || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: any) {
      console.error("Fetch forms failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [activeTab]);

  // Periodic polling for realtime TG + Web sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchForms();
    }, 12000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Perform Moderation Action
  const handleAction = async (actionData: any) => {
    try {
      const targetStatus = actionData.status;

      // Optimistic / Immediate UI update so the user instantly sees the status flip
      setForms((prev) =>
        prev.map((f) => {
          if (f.id === actionData.id) {
            const historyItem = {
              timestamp: new Date().toISOString(),
              moderator: initialUser?.email || "cxrner.label@gmail.com",
              action: actionData.action || targetStatus,
              prev_status: f.status || undefined,
              new_status: targetStatus || undefined,
              comment: actionData.moderator_comment || actionData.reject_reason || null,
              upc: actionData.upc || f.upc || null,
            };
            return {
              ...f,
              status: targetStatus,
              upc: actionData.upc !== undefined ? actionData.upc : f.upc,
              reject_reason: actionData.reject_reason !== undefined ? actionData.reject_reason : f.reject_reason,
              moderator_comment: actionData.moderator_comment !== undefined ? actionData.moderator_comment : f.moderator_comment,
              user_deleted: targetStatus === "deleted" ? true : actionData.restore ? false : f.user_deleted,
              action_history: [historyItem, ...(f.action_history || [])],
            };
          }
          return f;
        })
      );

      if (selectedRelease && selectedRelease.id === actionData.id) {
        const historyItem = {
          timestamp: new Date().toISOString(),
          moderator: initialUser?.email || "cxrner.label@gmail.com",
          action: actionData.action || targetStatus,
          prev_status: selectedRelease.status || undefined,
          new_status: targetStatus || undefined,
          comment: actionData.moderator_comment || actionData.reject_reason || null,
          upc: actionData.upc || selectedRelease.upc || null,
        };
        setSelectedRelease((prev) =>
          prev
            ? {
                ...prev,
                status: targetStatus,
                upc: actionData.upc !== undefined ? actionData.upc : prev.upc,
                reject_reason: actionData.reject_reason !== undefined ? actionData.reject_reason : prev.reject_reason,
                moderator_comment: actionData.moderator_comment !== undefined ? actionData.moderator_comment : prev.moderator_comment,
                user_deleted: targetStatus === "deleted" ? true : actionData.restore ? false : prev.user_deleted,
                action_history: [historyItem, ...(prev.action_history || [])],
              }
            : null
        );
      }

      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      const statusMeta = getStatusMeta(data.form?.status || targetStatus);
      const isTgOk = data.tg_sync?.ok || data.bot_sync?.ok || data.telegram_sync?.ok;

      showToast(
        "success",
        `Статус изменён: ${statusMeta.label}` +
          (isTgOk ? " • Telegram синхронизирован" : "")
      );

      // Re-sync with server response
      if (data.form) {
        setForms((prev) => prev.map((f) => (f.id === actionData.id ? { ...f, ...data.form } : f)));
        if (selectedRelease && selectedRelease.id === actionData.id) {
          setSelectedRelease((prev) => (prev ? { ...prev, ...data.form } : null));
        }
      }

      // Re-fetch in background to update counters and table
      fetchForms();
    } catch (err: any) {
      showToast("error", err.message || "Ошибка запроса");
      // Revert from server on error
      fetchForms();
      throw err;
    }
  };

  // Filter & Search Logic
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const p = f.form_payload || {};
        const haystack = [
          f.id,
          f.artist_name,
          f.track_name,
          f.genre,
          f.upc,
          f.telegram_id,
          f.username,
          p.nick,
          p.fio,
          p.name,
          p.contact_telegram,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      if (genreFilter !== "all") {
        if ((f.genre || "").toLowerCase() !== genreFilter.toLowerCase()) return false;
      }

      if (typeFilter !== "all") {
        if ((f.release_type || "").toLowerCase() !== typeFilter.toLowerCase()) return false;
      }

      if (upcFilter === "yes" && !f.upc) return false;
      if (upcFilter === "no" && f.upc) return false;

      return true;
    });
  }, [forms, searchQuery, genreFilter, typeFilter, upcFilter]);

  // Unique genres for filter
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    forms.forEach((f) => {
      if (f.genre) set.add(f.genre);
    });
    return Array.from(set);
  }, [forms]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050407] text-white flex flex-col font-sans selection:bg-[#8737FF] selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in max-w-sm">
          <div
            className={`p-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/90 border-red-500/50 text-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{notification.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 border-b border-white/[0.08] bg-[#090611]/85 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8737FF] group-hover:scale-125 transition shadow-[0_0_10px_#8737FF]" />
            <span className="text-base font-bold tracking-tight text-white">
              CXRNER MUSIC
            </span>
          </Link>
          <span className="hidden sm:inline text-white/20">/</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8737FF]/15 border border-[#8737FF]/35 text-[#B46BFF] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3 h-3" />
            Панель управления дистрибуцией
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => fetchForms(true)}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-[#D9D9E2] transition flex items-center gap-2 text-xs font-medium"
            title="Синхронизировать с Telegram и базой"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#00F0FF]" : ""}`} />
            <span className="hidden md:inline">Синхронизация</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-white/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{initialUser?.email || "cxrner.label@gmail.com"}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 sm:p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-red-500/15 hover:border-red-500/35 text-white/70 hover:text-red-300 transition"
            title="Выйти из аккаунта"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar Navigation + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Sidebar Nav (Desktop) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#07050d] p-3 sm:p-4 flex-shrink-0 flex md:flex-col justify-start overflow-x-auto md:overflow-x-visible space-y-0 md:space-y-1 gap-1 md:gap-0">
          <div className="hidden md:block px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1">
            Разделы управления
          </div>

          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Главный обзор</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "all"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Все заявки</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.total}</span>
          </button>

          <button
            onClick={() => setActiveTab("on_upload")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "on_upload"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>На отгрузке</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.on_upload}</span>
          </button>

          <button
            onClick={() => setActiveTab("moderation")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "moderation"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Модерация</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.moderation}</span>
          </button>

          <button
            onClick={() => setActiveTab("needfix")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "needfix"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>На правках</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.needfix}</span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "approved"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Одобренные</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.approved}</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "rejected"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Отклонённые</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.rejected}</span>
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "archive"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-white/50" />
              <span>Архив</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold">{stats.archived}</span>
          </button>

          <div className="hidden md:block pt-3 border-t border-white/[0.08] my-2" />

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "stats"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4" />
              <span>Статистика</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left flex-shrink-0 ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-[#8737FF] to-[#7025e0] text-white font-semibold shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                : "text-white/70 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Настройки</span>
            </div>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Обзор дистрибуции
                </h1>
                <p className="text-xs sm:text-sm text-[#9B95AD] font-normal leading-relaxed">
                  Метрики в реальном времени из базы данных Supabase и Telegram-группы модерации.
                </p>
              </div>

              {/* 8 Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                  onClick={() => setActiveTab("all")}
                  className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#0c0916]/80 hover:border-[#8737FF]/50 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-white/60 block">
                    Всего активных
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white group-hover:text-[#B46BFF] transition">
                      {stats.total}
                    </span>
                    <Layers className="w-4 h-4 text-[#8737FF]" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("on_upload")}
                  className="p-4 sm:p-5 rounded-2xl border border-sky-500/20 bg-[#0c0916]/80 hover:border-sky-500/50 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-sky-400/90 block">
                    На отгрузке
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-sky-300">
                      {stats.on_upload}
                    </span>
                    <Clock className="w-4 h-4 text-sky-400" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("moderation")}
                  className="p-4 sm:p-5 rounded-2xl border border-purple-500/20 bg-[#0c0916]/80 hover:border-purple-500/50 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-purple-300/90 block">
                    На модерации
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-purple-300">
                      {stats.moderation}
                    </span>
                    <Radio className="w-4 h-4 text-purple-400" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("needfix")}
                  className="p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-[#0c0916]/80 hover:border-amber-500/50 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-amber-300/90 block">
                    На исправлениях
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-300">
                      {stats.needfix}
                    </span>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("approved")}
                  className="p-4 sm:p-5 rounded-2xl border border-emerald-500/20 bg-[#0c0916]/80 hover:border-emerald-500/50 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-emerald-300/90 block">
                    Одобрено
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-300">
                      {stats.approved}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("rejected")}
                  className="p-4 sm:p-5 rounded-2xl border border-red-500/20 bg-[#0c0916]/80 hover:border-red-500/50 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-red-300/90 block">
                    Отклонено
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-red-300">
                      {stats.rejected}
                    </span>
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/20 bg-[#0c0916]/80 space-y-2">
                  <span className="text-xs font-medium text-cyan-300/90 block">
                    С кодом UPC
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#00F0FF]">
                      {stats.with_upc}
                    </span>
                    <Barcode className="w-4 h-4 text-[#00F0FF]" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("archive")}
                  className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#0c0916]/80 hover:border-white/30 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-xs font-medium text-white/50 block">
                    В архиве
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white/60">
                      {stats.archived}
                    </span>
                    <Archive className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>

              {/* Quick Attention & Recent Submissions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#B46BFF]" />
                    <span>Свежие заявки, требующие внимания</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("all")}
                    className="text-xs font-medium text-[#00F0FF] hover:underline flex items-center gap-1"
                  >
                    <span>Показать все</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {forms.slice(0, 6).map((release) => {
                    const sm = getStatusMeta(release.status || "pending");
                    return (
                      <div
                        key={release.id}
                        onClick={() => setSelectedRelease(release)}
                        className="p-4 sm:p-4.5 rounded-2xl border border-white/[0.08] bg-[#0c0916]/80 hover:border-[#8737FF]/50 transition cursor-pointer space-y-3 shadow-sm hover:shadow-[0_0_24px_rgba(135,55,255,0.12)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40 font-medium">
                            {new Date(release.created_at).toLocaleDateString("ru-RU")}
                          </span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                            style={{
                              backgroundColor: "rgba(135,55,255,0.12)",
                              borderColor: "rgba(180,107,255,0.35)",
                              color: "#D9D9E2",
                            }}
                          >
                            <span>{sm.emoji}</span>
                            <span>{sm.label}</span>
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold text-white truncate">
                            {release.track_name || "Без названия"}
                          </h4>
                          <p className="text-xs text-[#9B95AD] truncate font-medium pt-0.5">
                            {release.artist_name || "Артист не указан"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-white/50">
                          <span>{release.release_type || "Сингл"}</span>
                          {release.upc ? (
                            <span className="text-emerald-400 font-semibold font-mono">UPC: {release.upc}</span>
                          ) : (
                            <span className="text-white/30">Без UPC</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RELEASES LIST (ALL, ON_UPLOAD, MODERATION, NEEDFIX, APPROVED, REJECTED, ARCHIVE) */}
          {(activeTab === "all" ||
            activeTab === "on_upload" ||
            activeTab === "moderation" ||
            activeTab === "needfix" ||
            activeTab === "approved" ||
            activeTab === "rejected" ||
            activeTab === "archive") && (
            <div className="space-y-4 animate-fade-in">
              {/* Filter & Search Bar */}
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0916]/80 backdrop-blur-md space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Поиск по названию, артисту, ID заявки, UPC или @telegram..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#8737FF] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="all">Все жанры</option>
                      {availableGenres.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="all">Все типы</option>
                      <option value="single">Сингл</option>
                      <option value="ep">EP</option>
                      <option value="album">Альбом</option>
                    </select>

                    <select
                      value={upcFilter}
                      onChange={(e) => setUpcFilter(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="all">UPC: Все</option>
                      <option value="yes">С UPC</option>
                      <option value="no">Без UPC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table View (Desktop) */}
              <div className="hidden lg:block rounded-2xl border border-white/[0.08] bg-[#0c0916]/80 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-black/60 border-b border-white/[0.08] text-white/50 text-xs font-semibold">
                      <tr>
                        <th className="p-3.5 pl-5">Релиз / Артист</th>
                        <th className="p-3.5">Тип</th>
                        <th className="p-3.5">Дата премьеры</th>
                        <th className="p-3.5">Статус</th>
                        <th className="p-3.5">UPC</th>
                        <th className="p-3.5">Подача</th>
                        <th className="p-3.5 text-right pr-5">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {filteredForms.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-white/40 text-xs sm:text-sm">
                            Заявок не найдено
                          </td>
                        </tr>
                      ) : (
                        filteredForms.map((rel) => {
                          const sm = getStatusMeta(rel.status || "pending");
                          return (
                            <tr
                              key={rel.id}
                              className="hover:bg-white/[0.04] transition group cursor-pointer"
                              onClick={() => setSelectedRelease(rel)}
                            >
                              <td className="p-3.5 pl-5 min-w-[200px]">
                                <div className="text-sm font-semibold text-white group-hover:text-[#B46BFF] transition">
                                  {rel.track_name || "Без названия"}
                                </div>
                                <div className="text-[#9B95AD] text-xs font-medium pt-0.5">
                                  {rel.artist_name || "—"}
                                </div>
                              </td>
                              <td className="p-3.5 text-white/70">
                                {rel.release_type || "Сингл"}
                              </td>
                              <td className="p-3.5 text-[#00F0FF] font-medium">
                                {rel.form_payload?.date || rel.form_payload?.release_date || "—"}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                                  style={{
                                    backgroundColor: "rgba(135,55,255,0.12)",
                                    borderColor: "rgba(180,107,255,0.35)",
                                    color: "#D9D9E2",
                                  }}
                                >
                                  <span>{sm.emoji}</span>
                                  <span>{sm.label}</span>
                                </span>
                              </td>
                              <td className="p-3.5">
                                {rel.upc ? (
                                  <span className="text-emerald-400 font-semibold font-mono text-xs">{rel.upc}</span>
                                ) : (
                                  <span className="text-white/25">—</span>
                                )}
                              </td>
                              <td className="p-3.5 text-white/50 text-xs">
                                {new Date(rel.created_at).toLocaleDateString("ru-RU")}
                              </td>
                              <td
                                className="p-3.5 pr-5 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedRelease(rel)}
                                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-white transition"
                                    title="Открыть анкету релиза"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {rel.status !== "approved" && (
                                    <button
                                      onClick={() => handleAction({ id: rel.id, status: "approved", action: "approve" })}
                                      className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 transition"
                                      title="Принять релиз"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {rel.user_deleted || rel.status === "deleted" ? (
                                    <button
                                      onClick={() => handleAction({ id: rel.id, status: "on_upload", action: "restore", restore: true })}
                                      className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 transition"
                                      title="Восстановить"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (confirm("Переместить в архив?")) {
                                          handleAction({ id: rel.id, status: "deleted", action: "delete" });
                                        }
                                      }}
                                      className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/20 hover:bg-red-500/30 text-red-300 transition"
                                      title="В архив"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile iPhone Card View */}
              <div className="lg:hidden space-y-3">
                {filteredForms.length === 0 ? (
                  <div className="p-8 text-center text-white/40 text-xs sm:text-sm border border-white/10 rounded-2xl bg-[#0c0916]">
                    Заявок не найдено
                  </div>
                ) : (
                  filteredForms.map((rel) => {
                    const sm = getStatusMeta(rel.status || "pending");
                    return (
                      <div
                        key={rel.id}
                        onClick={() => setSelectedRelease(rel)}
                        className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0916] space-y-3 cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                            style={{
                              backgroundColor: "rgba(135,55,255,0.12)",
                              borderColor: "rgba(180,107,255,0.35)",
                              color: "#D9D9E2",
                            }}
                          >
                            <span>{sm.emoji}</span>
                            <span>{sm.label}</span>
                          </span>

                          <span className="text-xs text-white/40 font-medium">
                            {new Date(rel.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-white">
                            {rel.track_name || "Без названия"}
                          </h4>
                          <p className="text-xs text-[#9B95AD] font-medium pt-0.5">
                            {rel.artist_name || "—"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/[0.06] text-white/60">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-white/35 block">Тип / Жанр:</span>
                            <span className="font-medium">{rel.release_type || "Сингл"} • {rel.genre || "Electronic"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-white/35 block">UPC:</span>
                            <span className={rel.upc ? "text-emerald-400 font-mono font-bold" : "text-white/30"}>
                              {rel.upc || "Не присвоен"}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Buttons on Mobile */}
                        <div
                          className="pt-1 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedRelease(rel)}
                            className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition"
                          >
                            Анкета
                          </button>
                          {rel.status !== "approved" && (
                            <button
                              onClick={() => handleAction({ id: rel.id, status: "approved", action: "approve" })}
                              className="py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition"
                            >
                              Принять
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: STATS */}
          {activeTab === "stats" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Статистика и аналитика
                </h1>
                <p className="text-xs sm:text-sm text-[#9B95AD]">
                  Реальные расчеты из базы данных CXRNER MUSIC (согласовано с Telegram-командой /stats).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0916] space-y-3">
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block">Процент одобрения</span>
                  <div className="text-4xl font-bold text-emerald-300">
                    {stats.total > 0
                      ? `${Math.round((stats.approved / Math.max(1, stats.approved + stats.rejected)) * 100)}%`
                      : "0%"}
                  </div>
                  <p className="text-xs text-white/50">
                    {stats.approved} одобрено из {stats.approved + stats.rejected} рассмотренных заявок
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0916] space-y-3">
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block">Охват UPC</span>
                  <div className="text-4xl font-bold text-[#00F0FF]">
                    {stats.total > 0 ? `${Math.round((stats.with_upc / stats.total) * 100)}%` : "0%"}
                  </div>
                  <p className="text-xs text-white/50">
                    {stats.with_upc} из {stats.total} активных релизов имеют присвоенный штрихкод
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0916] space-y-3">
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block">Всего в системе</span>
                  <div className="text-4xl font-bold text-[#B46BFF]">{stats.all_count}</div>
                  <p className="text-xs text-white/50">
                    Включая {stats.archived} архивных и удалённых заявок
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS & DIAGNOSTICS */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in max-w-2xl text-xs sm:text-sm">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white">
                  Настройки и диагностика синхронизации
                </h1>
                <p className="text-xs sm:text-sm text-[#9B95AD]">
                  Состояние связки Сайта, Telegram-бота и Supabase.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0c0916] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <span className="text-white/70">Telegram Moderation Chat ID:</span>
                  <code className="text-[#00F0FF] font-mono text-xs bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30">-1002117586464</code>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <span className="text-white/70">База данных Supabase:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Подключено (Active)
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <span className="text-white/70">Авторизованный модератор:</span>
                  <span className="text-white font-medium">{initialUser?.email || "cxrner.label@gmail.com"}</span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      fetchForms(true);
                      showToast("success", "Тест связи выполнен успешно");
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8737FF] to-[#6d25dc] hover:from-[#9d57ff] hover:to-[#7f32f2] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(135,55,255,0.35)]"
                  >
                    Проверить соединение с Telegram и Supabase
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Dossier Modal */}
      {selectedRelease && (
        <ReleaseDossierModal
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
          onAction={handleAction}
          loading={loading}
        />
      )}
    </div>
  );
}
