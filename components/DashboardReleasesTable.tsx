"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import Container from "./Container";
import GlowButton from "./GlowButton";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";

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

const statusLabels: Record<string, string> = {
  pending: "На модерации",
  moderation: "Модерация",
  approved: "Принято",
  rejected: "Отклонено",
  uploaded: "Отгружено",
  released: "В релизе",
  fix_required: "На исправление",
  deleted: "Удалено",
};

function getStatusBadge(status: string | null) {
  if (!status) {
    return <span className="rounded-full bg.white/5 px-2 py-1 text-xs text-white/60">Неизвестно</span>;
  }

  const label = statusLabels[status] ?? status;

  let colorClasses = "bg-white/5 text-white/80 border-white/10";
  if (status === "pending" || status === "moderation") {
    colorClasses = "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
  } else if (status === "approved" || status === "uploaded" || status === "released") {
    colorClasses = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  } else if (status === "rejected") {
    colorClasses = "bg-red-500/10 text-red-300 border-red-500/30";
  } else if (status === "fix_required") {
    colorClasses = "bg-orange-500/10 text-orange-300 border-orange-500/30";
  } else if (status === "deleted") {
    colorClasses = "bg-white/5 text-white/50 border-white/10";
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${colorClasses}`}>
      {label}
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

  useEffect(() => {
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
  }, [userId]);

  const total = forms.length;
  const pendingCount = forms.filter((f) => f.status === "pending" || f.status === "moderation").length;
  const withUpc = forms.filter((f) => f.upc && f.upc.trim() !== "").length;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">Всего релизов</p>
          <p className="mt-2 text-2xl font-semibold text-white">{total}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">На модерации</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-300">{pendingCount}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">С UPC</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{withUpc}</p>
        </div>
      </div>

      <div className="mt-10 glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/5 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Релизы
          </p>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-white/50">
              <tr>
                <th className="px-6 py-3 text-left">Трек</th>
                <th className="px-6 py-3 text-left">Артист</th>
                <th className="px-6 py-3 text-left">Жанр</th>
                <th className="px-6 py-3 text-left">Статус</th>
                <th className="px-6 py-3 text-left">UPC</th>
                <th className="px-6 py-3 text-left">Дата</th>
                <th className="px-6 py-3 text-left">Источник</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {forms && forms.length > 0 ? (
                forms.map((form) => (
                  <tr
                    key={form.id}
                    className="cursor-pointer bg-black/20 transition hover:bg-white/5"
                    onClick={() => {
                      window.location.href = `/dashboard/release/${form.id}`;
                    }}
                  >
                    <td className="px-6 py-3 text-white">
                      {form.track_name || <span className="text-white/50">Без названия</span>}
                    </td>
                    <td className="px-6 py-3 text-white/80">
                      {form.artist_name || profileArtistName || "-"}
                    </td>
                    <td className="px-6 py-3 text-white/60">{form.genre || "-"}</td>
                    <td className="px-6 py-3">{getStatusBadge(form.status)}</td>
                    <td className="px-6 py-3 text-white/80">
                      {form.upc && form.upc.trim() !== "" ? form.upc : <span className="text-white/40">—</span>}
                    </td>
                    <td className="px-6 py-3 text-white/60">
                      {new Date(form.created_at).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {form.source === "web" ? (
                        <span className="rounded-full bg-aqua/10 px-2 py-1 text-aqua-200">Сайт</span>
                      ) : (
                        <span className="rounded-full bg-white/5 px-2 py-1 text-white/60">Telegram</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-white/60" colSpan={7}>
                    У вас пока нет отправленных релизов. Нажмите «Отправить релиз», чтобы создать первый.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

