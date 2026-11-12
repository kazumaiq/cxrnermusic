"use client";

import { useState } from "react";
import Link from "next/link";
import { getSmartLinkUrl, getSmartLinkDisplayPrefix } from "@/lib/slug";
import {
  Plus,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Paintbrush,
  BarChart2,
  CopyPlus,
  Archive,
  Trash2,
  Clock,
  Sparkles,
  MoreVertical,
  Radio,
  Search,
} from "lucide-react";

interface SmartLinkItem {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  slug: string;
  status: string;
  is_out_now: boolean;
  views_count: number;
  clicks_count: number;
  presaves_count: number;
  created_at: string;
}

interface DashboardLinksClientProps {
  initialLinks: SmartLinkItem[];
}

export default function DashboardLinksClient({ initialLinks }: DashboardLinksClientProps) {
  const [links, setLinks] = useState<SmartLinkItem[]>(initialLinks);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Compute metrics
  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.status === "published").length;
  const totalViews = links.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks_count || 0), 0);
  const totalPresaves = links.reduce((sum, l) => sum + (l.presaves_count || 0), 0);

  const handleCopy = (slug: string) => {
    const url = getSmartLinkUrl(slug);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const handleDuplicate = async (id: string) => {
    setLoadingAction(`dup-${id}`);
    try {
      const res = await fetch(`/api/link/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.link) {
        setLinks((prev) => [data.link, ...prev]);
      }
    } catch {
      alert("Не удалось дублировать ссылку");
    } finally {
      setLoadingAction(null);
      setActiveMenuId(null);
    }
  };

  const handleArchive = async (id: string) => {
    setLoadingAction(`arc-${id}`);
    try {
      const res = await fetch(`/api/link/${id}/archive`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: data.status } : l))
        );
      }
    } catch {
      alert("Не удалось изменить статус архива");
    } finally {
      setLoadingAction(null);
      setActiveMenuId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Вы действительно хотите удалить смарт-ссылку «${title}»? Публичная страница перестанет открываться.`)) {
      return;
    }

    setLoadingAction(`del-${id}`);
    try {
      const res = await fetch(`/api/link/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      alert("Ошибка удаления");
    } finally {
      setLoadingAction(null);
      setActiveMenuId(null);
    }
  };

  const filteredLinks = links.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.artist.toLowerCase().includes(q) ||
      l.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60 mb-1">
            Всего ссылок
          </p>
          <p className="font-heavy text-2xl sm:text-3xl text-white">{totalLinks}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#00F0FF] mb-1">
            Активных
          </p>
          <p className="font-heavy text-2xl sm:text-3xl text-[#00F0FF]">{activeLinks}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#B46BFF] mb-1">
            Просмотров
          </p>
          <p className="font-heavy text-2xl sm:text-3xl text-white">{totalViews.toLocaleString("ru-RU")}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#8737FF] mb-1">
            Переходов
          </p>
          <p className="font-heavy text-2xl sm:text-3xl text-[#B46BFF]">{totalClicks.toLocaleString("ru-RU")}</p>
        </div>

        <div className="col-span-2 md:col-span-1 p-4 sm:p-5 rounded-2xl border border-[#B46BFF]/30 bg-[#8737FF]/15 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2] mb-1">
            Pre-save заявок
          </p>
          <p className="font-heavy text-2xl sm:text-3xl text-white">{totalPresaves.toLocaleString("ru-RU")}</p>
        </div>
      </div>

      {/* 2. Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Поиск по названию или slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090611]/80 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
          />
        </div>

        <Link
          href="/dashboard/links/new"
          className="btn-energy px-6 py-3 rounded-full font-mono text-xs uppercase tracking-[0.18em] font-bold inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(135,55,255,0.3)] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Создать Smart Link</span>
        </Link>
      </div>

      {/* 3. Links Table / Cards */}
      {filteredLinks.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#090611]/60 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF] mx-auto">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-heavy text-xl uppercase tracking-tight text-white">
            {searchQuery ? "Ничего не найдено" : "У вас ещё нет Smart Links"}
          </h3>
          <p className="text-xs text-[#D9D9E2]/70 max-w-sm mx-auto">
            {searchQuery
              ? "Попробуйте изменить поисковый запрос"
              : "Создайте свою первую страницу релиза за 60 секунд с автопоиском по UPC"}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/links/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8737FF] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#B46BFF] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Создать первую ссылку</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredLinks.map((link) => {
            const isMenuOpen = activeMenuId === link.id;

            return (
              <div
                key={link.id}
                className="relative rounded-2xl border border-white/10 bg-[#090611]/80 hover:border-white/20 transition p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
              >
                {/* Release Visual Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/15 flex-shrink-0 relative">
                    <img
                      src={link.cover_url}
                      alt={link.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heavy text-base text-white uppercase truncate">
                        {link.title}
                      </h4>
                      {link.status === "archived" ? (
                        <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">
                          В архиве
                        </span>
                      ) : link.is_out_now ? (
                        <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">
                          OUT NOW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#B46BFF]/15 border border-[#B46BFF]/40 font-mono text-[9px] uppercase tracking-wider text-[#B46BFF]">
                          PRE-SAVE
                        </span>
                      )}
                    </div>

                    <p className="font-mono text-xs text-[#D9D9E2]/70 truncate mt-0.5">
                      {link.artist}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-[#B46BFF]">
                      <span className="truncate">{getSmartLinkDisplayPrefix()}{link.slug}</span>
                      <button
                        onClick={() => handleCopy(link.slug)}
                        title="Скопировать"
                        className="hover:text-white transition"
                      >
                        {copiedSlug === link.slug ? (
                          <Check className="w-3 h-3 text-[#00F0FF]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-6 font-mono text-center border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
                  <div>
                    <p className="text-sm font-heavy text-white">
                      {(link.views_count || 0).toLocaleString("ru-RU")}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-[#D9D9E2]/50">
                      Просмотры
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-heavy text-[#B46BFF]">
                      {(link.clicks_count || 0).toLocaleString("ru-RU")}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-[#D9D9E2]/50">
                      Клики
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-heavy text-[#00F0FF]">
                      {(link.presaves_count || 0).toLocaleString("ru-RU")}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-[#D9D9E2]/50">
                      Pre-save
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
                  <a
                    href={`/link/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Открыть страницу"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#D9D9E2] hover:text-white transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <Link
                    href={`/dashboard/links/${link.id}/analytics`}
                    title="Аналитика"
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#8737FF]/20 text-[#D9D9E2] hover:text-[#B46BFF] transition"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/dashboard/links/${link.id}/design`}
                    title="Дизайн / Page Builder"
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#00F0FF]/20 text-[#D9D9E2] hover:text-[#00F0FF] transition"
                  >
                    <Paintbrush className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/dashboard/links/${link.id}/edit`}
                    title="Редактировать метаданные"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#D9D9E2] hover:text-white transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  {/* Dropdown Menu for secondary actions */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(isMenuOpen ? null : link.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#D9D9E2] transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-10 w-44 rounded-2xl border border-white/15 bg-[#090611] p-1.5 shadow-2xl z-30 font-mono text-xs space-y-1">
                        <button
                          onClick={() => handleDuplicate(link.id)}
                          disabled={loadingAction === `dup-${link.id}`}
                          className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-[#D9D9E2]"
                        >
                          <CopyPlus className="w-3.5 h-3.5 text-[#B46BFF]" />
                          <span>Дублировать</span>
                        </button>

                        <button
                          onClick={() => handleArchive(link.id)}
                          disabled={loadingAction === `arc-${link.id}`}
                          className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-[#D9D9E2]"
                        >
                          <Archive className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span>{link.status === "archived" ? "Опубликовать" : "В архив"}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(link.id, link.title)}
                          disabled={loadingAction === `del-${link.id}`}
                          className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#FF2E93]/20 flex items-center gap-2 text-[#FF2E93]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Удалить</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
