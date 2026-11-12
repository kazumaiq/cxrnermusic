"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  Edit3,
  Archive,
  Trash2,
  Check,
  Radio,
  Filter,
} from "lucide-react";

interface AdminLinkRow {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  cover_url: string;
  slug: string;
  status: string;
  is_out_now: boolean;
  is_verified_artist: boolean;
  views_count: number;
  clicks_count: number;
  presaves_count: number;
  created_at: string;
}

export default function AdminLinksClient({ initialLinks }: { initialLinks: AdminLinkRow[] }) {
  const [links, setLinks] = useState<AdminLinkRow[]>(initialLinks);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "archived">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleVerified = async (id: string, current: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/link/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified_artist: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, is_verified_artist: !current } : l))
        );
      }
    } catch {
      alert("Ошибка изменения статуса верификации");
    } finally {
      setLoadingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/link/${id}/archive`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: data.status } : l))
        );
      }
    } catch {
      alert("Ошибка архивации");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`[ADMIN] Безвозвратно удалить смарт-ссылку «${title}»?`)) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/link/${id}?hard=true`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      alert("Ошибка удаления");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = links.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.artist.toLowerCase().includes(search.toLowerCase()) ||
      l.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Поиск по артисту, релизу, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#090611]/80 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
          {[
            { id: "all", label: "Все" },
            { id: "published", label: "Опубликованные" },
            { id: "draft", label: "Черновики" },
            { id: "archived", label: "В архиве" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id as any)}
              className={`px-3 py-1.5 rounded-xl uppercase tracking-wider transition ${
                filterStatus === item.id ? "bg-[#8737FF] text-white font-bold" : "text-[#D9D9E2]/60 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Links Table */}
      <div className="rounded-2xl border border-white/10 bg-[#090611]/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-[#D9D9E2]/60 text-[10px]">
              <tr>
                <th className="p-4">Релиз / Артист</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Статус</th>
                <th className="p-4">Верификация</th>
                <th className="p-4">Просмотры</th>
                <th className="p-4">Клики</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((link) => (
                <tr key={link.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={link.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-black" />
                      <div>
                        <p className="font-heavy text-white text-xs uppercase truncate max-w-[160px]">{link.title}</p>
                        <p className="text-[11px] text-[#D9D9E2]/60 truncate max-w-[160px]">{link.artist}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <a
                      href={`/link/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B46BFF] hover:underline flex items-center gap-1"
                    >
                      <span>/{link.slug}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                        link.status === "published"
                          ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                          : link.status === "draft"
                          ? "bg-white/10 text-white/60"
                          : "bg-[#FF2E93]/15 text-[#FF2E93]"
                      }`}
                    >
                      {link.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => toggleVerified(link.id, link.is_verified_artist)}
                      disabled={loadingId === link.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold transition ${
                        link.is_verified_artist
                          ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
                          : "bg-white/5 text-white/40 hover:text-white"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{link.is_verified_artist ? "Verified" : "Обычный"}</span>
                    </button>
                  </td>

                  <td className="p-4 text-white">{(link.views_count || 0).toLocaleString("ru-RU")}</td>

                  <td className="p-4 text-[#B46BFF]">{(link.clicks_count || 0).toLocaleString("ru-RU")}</td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/dashboard/links/${link.id}/edit`}
                        title="Редактировать"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#D9D9E2] transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleArchive(link.id)}
                        disabled={loadingId === link.id}
                        title={link.status === "archived" ? "Разархивировать" : "В архив"}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#D9D9E2] transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(link.id, link.title)}
                        disabled={loadingId === link.id}
                        title="Удалить"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF2E93]/20 text-[#FF2E93] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
