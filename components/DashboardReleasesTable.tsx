"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import {
  Disc,
  ExternalLink,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Barcode,
  Calendar,
} from "lucide-react";

type FormRow = {
  id: string;
  artist_name: string | null;
  track_name: string | null;
  genre: string | null;
  status: string | null;
  upc: string | null;
  created_at: string;
  source: string | null;
};

const statusConfig: Record<string, { label: string; classes: string; icon: any }> = {
  pending: {
    label: "На модерации",
    classes: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-glow",
    icon: Clock,
  },
  moderation: {
    label: "В обработке A&R",
    classes: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
    icon: Clock,
  },
  approved: {
    label: "Одобрено",
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-glow",
    icon: CheckCircle2,
  },
  uploaded: {
    label: "Отгружено на DSP",
    classes: "bg-neon/15 text-neonSoft border-neon/40 shadow-glow",
    icon: Disc,
  },
  released: {
    label: "В релизе (Live)",
    classes: "bg-aqua/15 text-aqua border-aqua/40 shadow-glowAqua",
    icon: CheckCircle2,
  },
  fix_required: {
    label: "Требует правок",
    classes: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    icon: AlertCircle,
  },
  rejected: {
    label: "Отклонено",
    classes: "bg-red-500/15 text-red-300 border-red-500/40",
    icon: AlertCircle,
  },
};

function StatusBadge({ status }: { status: string | null }) {
  const cfg = (status && statusConfig[status]) || {
    label: status || "Неизвестно",
    classes: "bg-white/5 text-white/70 border-white/10",
    icon: Clock,
  };
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

type DashboardReleasesTableProps = {
  initialForms: FormRow[];
  profileArtistName?: string | null;
  userId: string;
};

export default function DashboardReleasesTable({
  initialForms,
  profileArtistName,
  userId,
}: DashboardReleasesTableProps) {
  const [forms, setForms] = useState<FormRow[]>(initialForms);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();

      const channel = supabase
        .channel(`cxrner_forms_user_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cxrner_forms",
            filter: `telegram_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<FormRow>) => {
            setForms((current) => {
              if (payload.eventType === "INSERT") {
                const newRow = payload.new as FormRow;
                return [newRow, ...current];
              }
              if (payload.eventType === "UPDATE") {
                const updated = payload.new as FormRow;
                return current.map((row) => (row.id === updated.id ? { ...row, ...updated } : row));
              }
              if (payload.eventType === "DELETE") {
                const oldRow = payload.old as FormRow;
                return current.filter((row) => row.id !== oldRow.id);
              }
              return current;
            });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Supabase credentials not set or browser offline; continue with initialForms safely
    }
  }, [userId]);

  const filteredForms = useMemo(() => {
    return forms.filter((item) => {
      const matchesSearch =
        (item.track_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (item.artist_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (item.upc || "").includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && (item.status === "pending" || item.status === "moderation")) ||
        (statusFilter === "released" && (item.status === "released" || item.status === "uploaded")) ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [forms, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-panel rounded-2xl p-4 border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, артисту или UPC..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-neon focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Все" },
            { id: "pending", label: "Модерация" },
            { id: "released", label: "В релизе" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? "bg-neon text-night font-bold shadow-glow"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredForms.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <Disc className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Релизы не найдены</h3>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-sm mx-auto">
            {forms.length === 0
              ? "У вас пока нет отправленных релизов. Отправьте первый трек для дистрибуции!"
              : "Нет релизов, соответствующих критериям поиска."}
          </p>
          {forms.length === 0 && (
            <Link
              href="/submit-release"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon to-aqua text-night font-bold text-xs uppercase tracking-wider shadow-glow hover:scale-105 transition"
            >
              Отправить релиз
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View (hidden on lg screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {filteredForms.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <StatusBadge status={item.status} />
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white truncate mt-2">
                    {item.track_name || "Без названия"}
                  </h3>
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {item.artist_name || profileArtistName || "Артист"}
                  </p>
                  {item.genre && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-white/60">
                      {item.genre}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  {item.upc ? (
                    <span className="font-mono text-xs text-aqua flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5" />
                      {item.upc}
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/40 italic">UPC присваивается</span>
                  )}

                  <Link
                    href={`/dashboard/release/${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neon/15 hover:bg-neon/25 text-neonSoft text-xs font-semibold transition border border-neon/30"
                  >
                    Подробнее <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden on mobile/tablet) */}
          <div className="hidden lg:block glass-panel rounded-3xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                  <tr>
                    <th className="py-4 px-6">Трек / Релиз</th>
                    <th className="py-4 px-6">Артист</th>
                    <th className="py-4 px-6">Жанр</th>
                    <th className="py-4 px-6">Статус</th>
                    <th className="py-4 px-6">UPC</th>
                    <th className="py-4 px-6">Дата подачи</th>
                    <th className="py-4 px-6 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredForms.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition duration-150"
                    >
                      <td className="py-4 px-6 font-semibold text-white">
                        {item.track_name || "Без названия"}
                      </td>
                      <td className="py-4 px-6 text-white/70">
                        {item.artist_name || profileArtistName || "—"}
                      </td>
                      <td className="py-4 px-6 text-white/60">
                        <span className="px-2 py-0.5 rounded text-xs bg-white/5">
                          {item.genre || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-aqua">
                        {item.upc || <span className="text-white/30 italic">В процессе</span>}
                      </td>
                      <td className="py-4 px-6 text-xs text-white/50">
                        {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/dashboard/release/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-neon/15 hover:border-neon/40 border border-white/10 text-xs font-semibold text-white transition"
                        >
                          Детали <ArrowRight className="w-3 h-3 text-neon" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
