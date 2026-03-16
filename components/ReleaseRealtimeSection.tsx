"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";

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
    return <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/60">Неизвестно</span>;
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

type ReleaseRealtimeSectionProps = {
  formId: string;
  initialStatus: string | null;
  initialRejectReason: string | null;
  initialUpc: string | null;
};

export default function ReleaseRealtimeSection({
  formId,
  initialStatus,
  initialRejectReason,
  initialUpc,
}: ReleaseRealtimeSectionProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [rejectReason, setRejectReason] = useState<string | null>(initialRejectReason);
  const [upc, setUpc] = useState<string | null>(initialUpc);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`cxrner_forms_release_${formId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cxrner_forms",
          filter: `id=eq.${formId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const next = payload.new as
            | { status?: string | null; reject_reason?: string | null; upc?: string | null }
            | null
            | undefined;
          if (!next) return;
          if ("status" in next) setStatus(next.status ?? null);
          if ("reject_reason" in next) setRejectReason(next.reject_reason ?? null);
          if ("upc" in next) setUpc(next.upc ?? null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formId]);

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/50">Статус модерации</p>
      <div className="mt-4 space-y-3 text-sm text-white/80">
        <div>{getStatusBadge(status)}</div>
        {status === "rejected" && rejectReason && (
          <div className="rounded-2xl bg-red-500/5 p-3 text-sm text-red-200">
            <p className="text-xs uppercase tracking-[0.2em] text-red-300/80">Причина отклонения</p>
            <p className="mt-1 whitespace-pre-line">{rejectReason}</p>
          </div>
        )}
        {upc ? (
          <div className="rounded-2xl bg-emerald-500/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">UPC</p>
            <p className="mt-1 text-lg font-semibold text-emerald-200">{upc}</p>
            <p className="mt-1 text-xs text-emerald-200/70">
              Этот код присваивается модерацией после одобрения релиза.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">UPC ещё не присвоен</p>
            <p className="mt-1 text-xs text-white/50">
              Как только модерация присвоит UPC в Telegram, он автоматически появится здесь.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

