"use client";

import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";
import { stats } from "../../data/site";
import type { FeaturedRelease } from "../../lib/featured";
import type { ReleaseItem, ReleaseLink } from "../../lib/releases";
import type { ArtistItem, ArtistLink } from "../../lib/artists";
import {
  ShieldCheck,
  Disc,
  Users,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Barcode,
  Send,
  RefreshCw,
  Key,
  LogOut,
  Sliders,
  Radio,
  FileText,
  Lock,
  ArrowRight,
  Eye,
  Trash2,
  Headphones,
  Check,
} from "lucide-react";

type Tab = "moderation" | "users" | "featured" | "releases" | "artists" | "system";
type NoticeType = "success" | "error" | "info";
type Notice = { type: NoticeType; text: string } | null;

interface ModerationForm {
  id: string;
  telegram_id: string;
  artist_name: string | null;
  track_name: string | null;
  genre: string | null;
  release_type: string | null;
  status: string | null;
  reject_reason: string | null;
  upc: string | null;
  submission_key: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
  form_payload?: any;
}

interface CabinetUser {
  user_id: string;
  artist_name: string;
  email: string | null;
  telegram_id: string | null;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_linked_at: string | null;
  is_linked: boolean;
  releases_count: number;
  updated_at: string;
}

const emptyFeatured: FeaturedRelease = { title: "", artist: "", cover: "" };
const emptyRelease: ReleaseItem = { title: "", artist: "", cover: "", links: [] };
const emptyArtist: ArtistItem = { id: "", name: "", listeners: "", avatar: "", bio: "", genres: [], links: [] };

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-500/70 focus:bg-black/60 font-sans";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("moderation");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);

  // Moderation state
  const [moderationForms, setModerationForms] = useState<ModerationForm[]>([]);
  const [moderationStats, setModerationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    uploaded: 0,
    fix_required: 0,
    rejected: 0,
  });
  const [modFilter, setModFilter] = useState("all");
  const [modSearch, setModSearch] = useState("");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState("");
  const [actionType, setActionType] = useState<"upc" | "reject" | "fix" | null>(null);

  // Users state
  const [cabinetUsers, setCabinetUsers] = useState<CabinetUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Showcase state
  const [featured, setFeatured] = useState<FeaturedRelease>(emptyFeatured);
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const show = (type: NoticeType, text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4000);
  };

  // Check admin authorization on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      if (data.ok && data.isAdmin) {
        setIsAdmin(true);
        loadAdminData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    } catch {
      setIsAdmin(false);
      setLoading(false);
    }
  }

  async function handleKeyLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKeyInput.trim()) return;
    setKeyError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsAdmin(true);
        setAdminKeyInput("");
        show("success", "Доступ администратора подтверждён!");
        loadAdminData();
      } else {
        setKeyError(data.error || "Неверный ключ доступа");
      }
    } catch (err: any) {
      setKeyError(err.message || "Ошибка соединения");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAdmin(false);
    show("info", "Сессия администратора завершена");
  }

  async function loadAdminData() {
    setLoading(true);
    try {
      const [modRes, usersRes, featRes, relRes, artRes] = await Promise.all([
        fetch("/api/admin/moderation").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/users").then((r) => r.json()).catch(() => ({})),
        fetch("/api/featured").then((r) => r.json()).catch(() => ({})),
        fetch("/api/releases").then((r) => r.json()).catch(() => ({})),
        fetch("/api/artists").then((r) => r.json()).catch(() => ({})),
      ]);

      if (modRes.ok) {
        setModerationForms(modRes.forms || []);
        if (modRes.stats) setModerationStats(modRes.stats);
      }
      if (usersRes.ok) {
        setCabinetUsers(usersRes.users || []);
      }
      setFeatured(featRes?.title ? featRes : emptyFeatured);
      setReleases(relRes?.items ?? []);
      setArtists(artRes?.items ?? []);
    } catch (err: any) {
      show("error", "Ошибка загрузки данных админ-панели");
    } finally {
      setLoading(false);
    }
  }

  // Moderation status update
  async function updateFormStatus(
    id: string,
    newStatus: string,
    extra: { upc?: string; reject_reason?: string } = {}
  ) {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, ...extra }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Ошибка обновления");

      show("success", `Статус релиза обновлён: ${newStatus.toUpperCase()}`);
      setActiveActionId(null);
      setActionInput("");
      setActionType(null);

      // Refresh list
      const updatedList = moderationForms.map((item) =>
        item.id === id ? { ...item, status: newStatus, ...extra } : item
      );
      setModerationForms(updatedList);
    } catch (err: any) {
      show("error", err.message || "Не удалось обновить статус");
    }
  }

  async function deleteSubmission(id: string) {
    if (!confirm("Вы уверены, что хотите удалить эту заявку?")) return;
    try {
      const res = await fetch(`/api/admin/moderation?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Ошибка удаления");
      show("success", "Заявка успешно удалена");
      setModerationForms(moderationForms.filter((f) => f.id !== id));
    } catch (err: any) {
      show("error", err.message || "Ошибка удаления");
    }
  }

  // Showcase file upload & save
  async function uploadImage(file: File, folder: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Ошибка загрузки");
    return data.url as string;
  }

  async function handleUpload(file: File | undefined, folder: string, onDone: (url: string) => void) {
    if (!file) return;
    setUploading(folder);
    try {
      onDone(await uploadImage(file, folder));
      show("success", "Файл загружен. Не забудьте нажать «Сохранить».");
    } catch (error: any) {
      show("error", error.message || "Ошибка загрузки");
    } finally {
      setUploading(null);
    }
  }

  async function saveShowcase(url: string, body: unknown, successText: string) {
    setSaveState("saving");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Ошибка сохранения");
      setSaveState("saved");
      show("success", successText);
    } catch (error: any) {
      setSaveState("error");
      show("error", error.message || "Не удалось сохранить");
    }
  }

  // Filtered Moderation Forms
  const filteredModerationForms = useMemo(() => {
    return moderationForms.filter((f) => {
      const matchesFilter =
        modFilter === "all" ||
        (modFilter === "pending" &&
          (f.status === "pending" ||
            f.status === "moderation" ||
            f.status === "on_moderation" ||
            f.status === "on_upload")) ||
        (modFilter === "approved" && f.status === "approved") ||
        (modFilter === "uploaded" && (f.status === "uploaded" || f.status === "released")) ||
        (modFilter === "fix_required" &&
          (f.status === "fix_required" || f.status === "needfix")) ||
        (modFilter === "rejected" && f.status === "rejected");

      if (!matchesFilter) return false;

      if (!modSearch.trim()) return true;
      const q = modSearch.toLowerCase();
      const combined = [
        f.artist_name,
        f.track_name,
        f.genre,
        f.upc,
        f.telegram_id,
        f.form_payload?.nick,
        f.form_payload?.fio,
        f.form_payload?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return combined.includes(q);
    });
  }, [moderationForms, modFilter, modSearch]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return cabinetUsers;
    const q = userSearch.toLowerCase();
    return cabinetUsers.filter((u) => {
      const text = [
        u.artist_name,
        u.email,
        u.telegram_username,
        u.telegram_id,
        u.user_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [cabinetUsers, userSearch]);

  // If not authorized yet, show Cyberpunk Admin Access Portal
  if (isAdmin === false) {
    return (
      <main className="section-padding pt-28 md:pt-40 min-h-screen flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto glass-panel p-8 sm:p-10 rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-black/80 border border-purple-500/40 p-2 mx-auto mb-6 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                <Image
                  src="/logo.png"
                  alt="CXRNER MUSIC"
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-400 font-semibold">
                  // CXRNER CONTROL CENTER
                </p>
              </div>

              <h1 className="font-gothic text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Вход в админ-панель
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-neutral-400 font-sans">
                Доступ ограничен для команды CXRNER MUSIC. Введите мастер-ключ администратора или авторизуйтесь через email.
              </p>

              {keyError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{keyError}</span>
                </div>
              )}

              <form onSubmit={handleKeyLogin} className="mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Мастер-ключ администратора
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminKeyInput}
                      onChange={(e) => setAdminKeyInput(e.target.value)}
                      placeholder="Введите ключ (по умолчанию: cxrner2026)"
                      className={fieldClass}
                      autoFocus
                    />
                    <Key className="w-4 h-4 text-neutral-500 absolute right-3.5 top-5 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-void-primary py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Открыть панель</span>
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-xs text-neutral-400 flex flex-col gap-2">
                <p>
                  Также доступен вход через авторизацию аккаунта с почтой из переменной{" "}
                  <code className="text-purple-300 bg-white/5 px-1.5 py-0.5 rounded">ADMIN_EMAILS</code>.
                </p>
                <Link
                  href="/auth/login"
                  className="text-purple-400 hover:text-white transition inline-flex items-center justify-center gap-1 mt-1 font-mono text-[11px]"
                >
                  <span>Войти через Google / Email</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="section-padding pt-24 md:pt-32 pb-20 min-h-screen">
      <Container>
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-black/80 border border-purple-500/40 p-1.5 shadow-[0_0_25px_rgba(168,85,247,0.3)] flex-shrink-0">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={56}
                height={56}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-400 font-semibold">
                  // CXRNER CONTROL CENTER · V2.4 PRO
                </p>
              </div>
              <h1 className="font-gothic text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Панель управления лейблом
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-400 font-sans">
                Модерация заявок, назначение кодов UPC, управление артистами и витриной сайта.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="btn-void-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 font-mono text-xs uppercase tracking-wider text-neutral-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
              <span>Обновить</span>
            </button>
            <a
              href="https://t.me/moder_cxrner_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-void-ghost inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-purple-500/30 text-purple-300 font-mono text-xs uppercase tracking-wider hover:border-purple-400 transition"
            >
              <Send className="w-3.5 h-3.5 text-purple-400" />
              <span>Бот модерации</span>
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs uppercase tracking-wider hover:bg-red-500/20 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {/* Global Stats Overview */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Всего заявок</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              {moderationStats.total}
            </p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-yellow-300">На модерации</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-yellow-400 mt-1">
              {moderationStats.pending}
            </p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">Одобрено</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
              {moderationStats.approved}
            </p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-purple-300">В релизе / UPC</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-purple-400 mt-1">
              {moderationStats.uploaded}
            </p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Артистов в базе</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              {cabinetUsers.length}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 flex flex-wrap gap-1.5">
          {[
            { id: "moderation", label: "Модерация треков", badge: moderationStats.pending, icon: Headphones },
            { id: "users", label: "Артисты и Telegram", badge: cabinetUsers.length, icon: Users },
            { id: "featured", label: "Главная новинка", icon: Sparkles },
            { id: "releases", label: "Каталог релизов", icon: Disc },
            { id: "artists", label: "Ростер артистов", icon: Radio },
            { id: "system", label: "Система и ссылки", icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition ${
                  active
                    ? "bg-purple-600 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? "bg-white text-purple-900" : "bg-white/10 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: MODERATION QUEUE */}
        {tab === "moderation" && (
          <div className="mt-8 space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "Все" },
                  { id: "pending", label: "На модерации", count: moderationStats.pending },
                  { id: "approved", label: "Одобрено", count: moderationStats.approved },
                  { id: "uploaded", label: "В релизе (UPC)", count: moderationStats.uploaded },
                  { id: "fix_required", label: "Требует правок", count: moderationStats.fix_required },
                  { id: "rejected", label: "Отклонено", count: moderationStats.rejected },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setModFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 ${
                      modFilter === f.id
                        ? "bg-white text-black font-bold"
                        : "bg-black/40 text-neutral-400 hover:text-white border border-white/10"
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && f.count > 0 && (
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          modFilter === f.id ? "bg-black text-white" : "bg-white/15 text-white"
                        }`}
                      >
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Поиск по артисту, треку, UPC..."
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-purple-500/60"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Submissions List */}
            {filteredModerationForms.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center">
                <Headphones className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-white font-medium">Заявок в этой категории не найдено</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Новые отправленные релизы с сайта и из бота автоматически появятся здесь.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredModerationForms.map((form) => {
                  const p = form.form_payload || {};
                  const artist = form.artist_name || p.nick || p.artist_name || p.fio || "Артист";
                  const track = form.track_name || p.name || "Без названия";
                  const genre = form.genre || p.genre || "Не указан";
                  const cover = p.cover_url || p.cover || null;
                  const audioLink = p.link || form.submission_key || null;
                  const tgContact = p.tg || p.telegram_contact || form.telegram_id;
                  const upc = form.upc || p.upc || null;
                  const isPending =
                    form.status === "pending" ||
                    form.status === "moderation" ||
                    form.status === "on_moderation";

                  return (
                    <article
                      key={form.id}
                      className={`glass-panel p-5 rounded-2xl border transition duration-200 ${
                        isPending
                          ? "border-yellow-500/40 bg-yellow-500/[0.03]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Artwork & Info */}
                        <div className="flex items-start gap-4">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0">
                            {cover ? (
                              <img
                                src={cover}
                                alt={track}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                                <Disc className="w-6 h-6 mb-1" />
                                <span className="text-[9px] uppercase font-mono">No cover</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                                  form.status === "approved"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : form.status === "uploaded" || form.status === "released"
                                    ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                    : form.status === "fix_required"
                                    ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                                    : form.status === "rejected"
                                    ? "bg-red-500/15 text-red-300 border-red-500/30"
                                    : "bg-yellow-500/15 text-yellow-300 border-yellow-500/30 animate-pulse"
                                }`}
                              >
                                {form.status || "pending"}
                              </span>

                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-neutral-300">
                                {form.source || "web"}
                              </span>

                              {upc && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                                  <Barcode className="w-3 h-3" />
                                  <span>UPC: {upc}</span>
                                </span>
                              )}
                            </div>

                            <h3 className="font-gothic text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
                              {artist} — {track}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 font-sans">
                              <span>
                                Жанр: <strong className="text-white">{genre}</strong>
                              </span>
                              {p.version && <span>Версия: {p.version}</span>}
                              {p.mat && <span>Мат: {p.mat}</span>}
                              <span>
                                Дата: {new Date(form.created_at).toLocaleDateString("ru-RU")}
                              </span>
                            </div>

                            {/* Rejection / Note */}
                            {form.reject_reason && (
                              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg mt-1">
                                Причина: {form.reject_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons & Links */}
                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                          {audioLink && (
                            <a
                              href={audioLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-void-ghost px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-purple-300 border border-purple-500/30 hover:border-purple-400 inline-flex items-center gap-1.5 transition"
                            >
                              <Headphones className="w-3.5 h-3.5" />
                              <span>Файлы трека</span>
                              <ExternalLink className="w-3 h-3 text-purple-400" />
                            </a>
                          )}

                          {tgContact && (
                            <a
                              href={
                                tgContact.startsWith("@")
                                  ? `https://t.me/${tgContact.slice(1)}`
                                  : `https://t.me/${tgContact}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-void-ghost px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-neutral-300 border border-white/10 hover:border-white/30 inline-flex items-center gap-1.5 transition"
                            >
                              <Send className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{tgContact}</span>
                            </a>
                          )}

                          {/* Quick Moderation Dropdown / Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateFormStatus(form.id, "approved")}
                              title="Одобрить релиз"
                              className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold hover:bg-emerald-500/25 transition active:scale-95"
                            >
                              ✓ Одобрить
                            </button>

                            <button
                              onClick={() => {
                                setActiveActionId(form.id);
                                setActionType("upc");
                                setActionInput(form.upc || "");
                              }}
                              title="Присвоить официальный UPC"
                              className="px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-mono text-xs font-semibold hover:bg-purple-500/25 transition active:scale-95"
                            >
                              📦 UPC
                            </button>

                            <button
                              onClick={() => {
                                setActiveActionId(form.id);
                                setActionType("fix");
                                setActionInput("");
                              }}
                              title="Отправить на доработку"
                              className="px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-300 font-mono text-xs font-semibold hover:bg-orange-500/25 transition active:scale-95"
                            >
                              ✏️ Правки
                            </button>

                            <button
                              onClick={() => {
                                setActiveActionId(form.id);
                                setActionType("reject");
                                setActionInput("");
                              }}
                              title="Отклонить релиз"
                              className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-xs font-semibold hover:bg-red-500/25 transition active:scale-95"
                            >
                              ✕ Отклонить
                            </button>

                            <button
                              onClick={() => deleteSubmission(form.id)}
                              title="Удалить заявку"
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline Action Prompt (UPC or Reason) */}
                      {activeActionId === form.id && actionType && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            value={actionInput}
                            onChange={(e) => setActionInput(e.target.value)}
                            placeholder={
                              actionType === "upc"
                                ? "Введите код UPC (например: 4600000000000)..."
                                : actionType === "fix"
                                ? "Укажите причину отправки на доработку..."
                                : "Укажите причину отклонения..."
                            }
                            className="flex-1 rounded-xl border border-purple-500/40 bg-black/80 px-3.5 py-2 text-xs text-white outline-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => {
                                if (actionType === "upc") {
                                  updateFormStatus(form.id, "uploaded", { upc: actionInput.trim() });
                                } else if (actionType === "fix") {
                                  updateFormStatus(form.id, "fix_required", {
                                    reject_reason: actionInput.trim(),
                                  });
                                } else if (actionType === "reject") {
                                  updateFormStatus(form.id, "rejected", {
                                    reject_reason: actionInput.trim(),
                                  });
                                }
                              }}
                              className="btn-void-primary px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold"
                            >
                              Применить
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionId(null);
                                setActionType(null);
                              }}
                              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-400 hover:text-white"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: USERS & TELEGRAM SYNC */}
        {tab === "users" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-tight font-gothic">
                  Артисты и синхронизация с Telegram
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Список всех зарегистрированных в личном кабинете пользователей и статус связки с ботом.
                </p>
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Поиск по артисту, email, Telegram..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-purple-500/60"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 glass-panel">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-neutral-400 bg-white/[0.02]">
                    <th className="p-4">Артист / ID</th>
                    <th className="p-4">Связка с Telegram</th>
                    <th className="p-4">Релизов</th>
                    <th className="p-4">Дата обновления</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-neutral-500">
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.user_id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{u.artist_name}</p>
                          <p className="font-mono text-[10px] text-neutral-500">{u.user_id}</p>
                        </td>
                        <td className="p-4">
                          {u.is_linked ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <div>
                                <a
                                  href={`https://t.me/${u.telegram_username || u.telegram_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-300 font-mono hover:underline inline-flex items-center gap-1 font-semibold"
                                >
                                  <span>@{u.telegram_username || u.telegram_id}</span>
                                  <ExternalLink className="w-3 h-3 text-purple-400" />
                                </a>
                                <p className="text-[10px] text-neutral-500 font-mono">
                                  ID: {u.telegram_id}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-neutral-400">
                              Не привязан к боту
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-purple-300">
                          {u.releases_count} трек(ов)
                        </td>
                        <td className="p-4 text-neutral-400 font-mono text-[11px]">
                          {u.updated_at ? new Date(u.updated_at).toLocaleDateString("ru-RU") : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: FEATURED RELEASE (Hero Block) */}
        {tab === "featured" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <p className="font-mono text-xs uppercase tracking-wider text-purple-400 font-semibold">
                // Первый экран сайта
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white font-gothic uppercase">
                Главная новинка
              </h2>
              <p className="mt-1 text-xs text-neutral-400 font-sans">
                Этот трек отображается в hero-блоке на первом экране сайта и интегрирован в 3D виниловый проигрыватель.
              </p>

              <div className="mt-6 space-y-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Название релиза
                  <input
                    className={fieldClass}
                    value={featured.title}
                    onChange={(e) => setFeatured({ ...featured, title: e.target.value })}
                    placeholder="Название трека"
                  />
                </label>

                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Артист
                  <input
                    className={fieldClass}
                    value={featured.artist}
                    onChange={(e) => setFeatured({ ...featured, artist: e.target.value })}
                    placeholder="Имя артиста"
                  />
                </label>

                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                  URL обложки
                  <input
                    className={fieldClass}
                    value={featured.cover}
                    onChange={(e) => setFeatured({ ...featured, cover: e.target.value })}
                    placeholder="https://... или /images/..."
                  />
                </label>

                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Загрузить новую обложку
                  <input
                    className="mt-2 block w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    type="file"
                    accept="image/*"
                    disabled={uploading === "featured"}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleUpload(e.target.files?.[0], "featured", (url) =>
                        setFeatured({ ...featured, cover: url })
                      )
                    }
                  />
                </label>
              </div>

              <div className="mt-7">
                <GlowButton
                  onClick={() => saveShowcase("/api/featured", featured, "Главная новинка сохранена!")}
                >
                  Сохранить новинку
                </GlowButton>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                Предпросмотр на первом экране
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl">
                <div className="relative aspect-square w-full">
                  {featured.cover ? (
                    <img
                      src={featured.cover}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-500 font-mono">
                      Добавьте обложку
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-white/10">
                  <p className="text-lg font-bold text-white uppercase font-gothic">
                    {featured.title || "Название релиза"}
                  </p>
                  <p className="text-xs text-purple-400 font-mono mt-0.5">
                    {featured.artist || "Имя артиста"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: RELEASES CATALOG */}
        {tab === "releases" && (
          <section className="mt-8 glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-purple-400 font-semibold">
                  // Каталог сайта
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white font-gothic uppercase">
                  Релизы лейбла
                </h2>
                <p className="text-xs text-neutral-400">
                  Редактируйте обложки, названия, артистов и ссылки на мировые стриминговые сервисы.
                </p>
              </div>
              <button
                className="btn-void-primary px-4 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold"
                onClick={() => setReleases([...releases, { ...emptyRelease, links: [] }])}
              >
                + Добавить релиз
              </button>
            </div>

            <div className="space-y-4">
              {releases.map((rel, index) => (
                <article
                  key={`${rel.title}-${index}`}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-purple-400 font-bold uppercase">
                      Релиз #{String(index + 1).padStart(2, "0")}
                    </span>
                    <button
                      className="text-xs font-mono text-red-400 hover:text-red-300"
                      onClick={() => setReleases(releases.filter((_, i) => i !== index))}
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="text-xs font-mono uppercase text-neutral-400">
                      Название трека
                      <input
                        className={fieldClass}
                        value={rel.title}
                        onChange={(e) =>
                          setReleases(
                            releases.map((item, i) => (i === index ? { ...item, title: e.target.value } : item))
                          )
                        }
                      />
                    </label>

                    <label className="text-xs font-mono uppercase text-neutral-400">
                      Артист
                      <input
                        className={fieldClass}
                        value={rel.artist}
                        onChange={(e) =>
                          setReleases(
                            releases.map((item, i) => (i === index ? { ...item, artist: e.target.value } : item))
                          )
                        }
                      />
                    </label>

                    <label className="text-xs font-mono uppercase text-neutral-400">
                      URL обложки
                      <input
                        className={fieldClass}
                        value={rel.cover}
                        onChange={(e) =>
                          setReleases(
                            releases.map((item, i) => (i === index ? { ...item, cover: e.target.value } : item))
                          )
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <GlowButton
                onClick={() => saveShowcase("/api/releases", { items: releases }, "Каталог релизов сохранён!")}
              >
                Сохранить все релизы
              </GlowButton>
            </div>
          </section>
        )}

        {/* Tab 5: ARTISTS ROSTER */}
        {tab === "artists" && (
          <section className="mt-8 glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-purple-400 font-semibold">
                  // Команда и артисты
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white font-gothic uppercase">
                  Ростер артистов
                </h2>
                <p className="text-xs text-neutral-400">
                  Управление профилями артистов лейбла: фото, описание, жанры и ссылки.
                </p>
              </div>
              <button
                className="btn-void-primary px-4 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold"
                onClick={() =>
                  setArtists([
                    ...artists,
                    { ...emptyArtist, id: `artist-${Date.now()}` },
                  ])
                }
              >
                + Добавить артиста
              </button>
            </div>

            <div className="space-y-4">
              {artists.map((artist, index) => (
                <article
                  key={`${artist.id}-${index}`}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-purple-400 font-bold uppercase">
                      /{artist.id}
                    </span>
                    <button
                      className="text-xs font-mono text-red-400 hover:text-red-300"
                      onClick={() => setArtists(artists.filter((_, i) => i !== index))}
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="text-xs font-mono uppercase text-neutral-400">
                      Псевдоним
                      <input
                        className={fieldClass}
                        value={artist.name}
                        onChange={(e) =>
                          setArtists(
                            artists.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                          )
                        }
                      />
                    </label>

                    <label className="text-xs font-mono uppercase text-neutral-400">
                      Slug страницы
                      <input
                        className={fieldClass}
                        value={artist.id}
                        onChange={(e) =>
                          setArtists(
                            artists.map((item, i) =>
                              i === index
                                ? { ...item, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }
                                : item
                            )
                          )
                        }
                      />
                    </label>

                    <label className="text-xs font-mono uppercase text-neutral-400">
                      URL фото
                      <input
                        className={fieldClass}
                        value={artist.avatar}
                        onChange={(e) =>
                          setArtists(
                            artists.map((item, i) => (i === index ? { ...item, avatar: e.target.value } : item))
                          )
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <GlowButton
                onClick={() => saveShowcase("/api/artists", { items: artists }, "Ростер артистов сохранён!")}
              >
                Сохранить всех артистов
              </GlowButton>
            </div>
          </section>
        )}

        {/* Tab 6: SYSTEM & LOGS */}
        {tab === "system" && (
          <section className="mt-8 glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-purple-400 font-semibold">
                // Системный статус
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white font-gothic uppercase">
                Инфраструктура CXRNER MUSIC
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="font-mono text-xs uppercase text-neutral-400">База данных</p>
                <p className="text-emerald-400 font-mono font-bold mt-1">● Supabase подключена</p>
                <p className="text-[11px] text-neutral-500 mt-1">Таблицы: cxrner_forms, cxrner_cabinet_users</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="font-mono text-xs uppercase text-neutral-400">Синхронизация Telegram</p>
                <p className="text-purple-400 font-mono font-bold mt-1">● Активна (Бот + Mini App)</p>
                <p className="text-[11px] text-neutral-500 mt-1">Привязка по токену и коду CX-XXXXXX</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="font-mono text-xs uppercase text-neutral-400">Яндекс Музыка Лейбл</p>
                <a
                  href="https://music.yandex.ru/label/5978511"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-purple-300 font-mono text-xs inline-flex items-center gap-1 mt-1 font-semibold"
                >
                  <span>music.yandex.ru/label/5978511</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="font-mono text-xs uppercase text-neutral-400">Telegram Бот Модерации</p>
                <a
                  href="https://t.me/moder_cxrner_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-purple-300 font-mono text-xs inline-flex items-center gap-1 mt-1 font-semibold"
                >
                  <span>@moder_cxrner_bot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>
        )}
      </Container>

      {/* Floating Status Notification */}
      {notice && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border px-4 py-3 text-xs sm:text-sm shadow-2xl backdrop-blur-xl font-sans ${
            notice.type === "error"
              ? "border-red-400/30 bg-red-500/15 text-red-200"
              : notice.type === "info"
              ? "border-purple-400/30 bg-purple-500/15 text-purple-200"
              : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
          }`}
        >
          {notice.text}
        </div>
      )}
    </main>
  );
}
