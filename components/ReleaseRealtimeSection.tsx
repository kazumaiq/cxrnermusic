"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Disc,
  Barcode,
  Sparkles,
  Send,
  Radio,
} from "lucide-react";

const statusConfig: Record<string, { label: string; classes: string; icon: any }> = {
  pending: {
    label: "На рассмотрении",
    classes: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-glow",
    icon: Clock,
  },
  moderation: {
    label: "A&R Модерация",
    classes: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
    icon: Clock,
  },
  approved: {
    label: "Одобрено модератором",
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-glow",
    icon: CheckCircle2,
  },
  uploaded: {
    label: "Отгружено на площадки",
    classes: "bg-neon/15 text-neonSoft border-neon/40 shadow-glow",
    icon: Disc,
  },
  released: {
    label: "В релизе (Live)",
    classes: "bg-aqua/15 text-aqua border-aqua/40 shadow-glowAqua",
    icon: CheckCircle2,
  },
  fix_required: {
    label: "Требует исправлений",
    classes: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    icon: AlertCircle,
  },
  rejected: {
    label: "Отклонено",
    classes: "bg-red-500/15 text-red-300 border-red-500/40",
    icon: AlertCircle,
  },
};

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
    try {
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
    } catch {
      // Safe fallback when Supabase client is offline
    }
  }, [formId]);

  const cfg = (status && statusConfig[status]) || {
    label: status || "Неизвестно",
    classes: "bg-white/5 text-white/70 border-white/10",
    icon: Clock,
  };
  const StatusIcon = cfg.icon;

  // Lifecycle steps calculation
  const steps = [
    { id: "submitted", label: "Заявка принята", done: true },
    {
      id: "moderation",
      label: "Модерация A&R",
      done: status === "approved" || status === "uploaded" || status === "released",
      active: status === "pending" || status === "moderation",
    },
    {
      id: "upc",
      label: "Код UPC",
      done: Boolean(upc) || status === "uploaded" || status === "released",
      active: status === "approved" && !upc,
    },
    {
      id: "distribution",
      label: "Отгрузка на DSP",
      done: status === "released",
      active: status === "uploaded",
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
      {/* Current Status Pill */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/40 mb-1">
            Текущий статус
          </p>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${cfg.classes}`}
          >
            <StatusIcon className="w-4 h-4 flex-shrink-0" />
            <span>{cfg.label}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/40 mb-1">
            Realtime Синхронизация
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Подключено
          </span>
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3">
          Этапы релиза:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((st) => (
            <div
              key={st.id}
              className={`p-3 rounded-xl border text-xs transition ${
                st.done
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : st.active
                  ? "bg-neon/15 border-neon/50 text-white font-bold shadow-glow"
                  : "bg-white/5 border-white/5 text-white/40"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {st.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : st.active ? (
                  <Clock className="w-3.5 h-3.5 text-neon animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block" />
                )}
                <span className="font-semibold">{st.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejection / Fix Warning */}
      {status === "rejected" && rejectReason && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs sm:text-sm text-red-200 space-y-1">
          <p className="font-bold text-red-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Причина отклонения модератором
          </p>
          <p className="whitespace-pre-line leading-relaxed text-red-100">{rejectReason}</p>
        </div>
      )}

      {/* UPC Barcode Display */}
      {upc ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
          <p className="text-xs uppercase tracking-wider text-emerald-300/80 font-bold flex items-center gap-1.5">
            <Barcode className="w-4 h-4" />
            Присвоен официальный UPC
          </p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white tracking-widest">
            {upc}
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/70">
            Релиз успешно зарегистрирован в глобальной базе дистрибуции.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/60 flex items-center gap-3">
          <Barcode className="w-5 h-5 text-white/30 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white/80">UPC присваивается модератором</p>
            <p className="text-white/50 text-[11px] mt-0.5">
              После успешной проверки трек получает уникальный штрих-код для отгрузки.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
