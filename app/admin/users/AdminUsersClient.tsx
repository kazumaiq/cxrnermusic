"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Boxes,
  Disc,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function AdminUsersClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = encodeURIComponent(search);
      const res = await fetch(`/api/admin/users?q=${q}&filter=${filter}&page=${page}&limit=25`);
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <Users className="w-4 h-4 text-[#00F0FF]" />
            <span>ADMIN CMS // БАЗА ПОЛЬЗОВАТЕЛЕЙ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Все Пользователи ({totalCount})
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Единый реестр всех зарегистрированных аккаунтов, профилей CXRNER ID, балансов и статусов.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white transition self-start sm:self-auto"
          title="Обновить список"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#D9D9E2]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email, username, User ID, имени..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-xs font-mono outline-none transition"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "Все" },
            { id: "verified", label: "Верифицированные" },
            { id: "unverified", label: "Без верификации" },
            { id: "completed", label: "Профиль 80%+" },
            { id: "incomplete", label: "Профиль <80%" },
            { id: "telegram", label: "С Telegram" },
            { id: "banned", label: "Заблокированные" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition ${
                filter === tab.id
                  ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
                  : "bg-white/5 text-[#D9D9E2]/60 hover:text-white border border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-[#090611] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#D9D9E2]/50 uppercase tracking-wider bg-white/[0.02]">
                <th className="py-3.5 px-4">Пользователь / Имя</th>
                <th className="py-3.5 px-4">Email / Telegram</th>
                <th className="py-3.5 px-4">Верификация</th>
                <th className="py-3.5 px-4">Профиль %</th>
                <th className="py-3.5 px-4">Баланс CXP</th>
                <th className="py-3.5 px-4">Предметы</th>
                <th className="py-3.5 px-4">Релизы</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#D9D9E2]/40">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B46BFF]" />
                    <span>Загрузка пользователей...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#D9D9E2]/40">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-white/[0.03] transition group">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/users/${u.user_id}`}
                        className="flex items-center gap-2.5 group-hover:text-[#B46BFF] transition"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/15">
                          <img
                            src={u.avatar_url || "/logo.png"}
                            alt={u.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-display font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{u.display_name}</span>
                            {u.is_artist_verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
                            )}
                          </div>
                          <div className="text-[10px] text-[#D9D9E2]/50">@{u.username}</div>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white text-[11px] truncate max-w-[160px]">
                        {u.email || "—"}
                      </div>
                      <div className="text-[10px] text-[#00F0FF]">
                        {u.telegram_username ? `@${u.telegram_username}` : u.telegram_id ? `ID: ${u.telegram_id}` : "Не привязан"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                          u.is_artist_verified
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : u.verification_status === "pending"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : "bg-white/5 text-[#D9D9E2]/50 border-white/10"
                        }`}
                      >
                        {u.is_artist_verified ? "VERIFIED" : u.verification_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8737FF] to-[#00F0FF]"
                            style={{ width: `${u.profile_completion}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white/80">{u.profile_completion}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#B46BFF]">
                      {u.cxp_balance} CXP
                    </td>

                    <td className="py-3.5 px-4 text-white/80">
                      {u.items_count}
                    </td>

                    <td className="py-3.5 px-4 text-white/80">
                      {u.releases_count}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/users/${u.user_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-white text-[11px] transition"
                      >
                        <span>Досье</span>
                        <ArrowRight className="w-3 h-3 text-[#B46BFF]" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-[#D9D9E2]/50">
              Страница {page} из {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 text-white"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 text-white"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
