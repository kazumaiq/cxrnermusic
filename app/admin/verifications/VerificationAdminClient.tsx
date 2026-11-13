"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  X,
} from "lucide-react";

export default function VerificationAdminClient() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeApp, setActiveApp] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "needs_info" | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${statusFilter}`);
      const data = await res.json();
      if (data.ok) {
        setApplications(data.applications || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp || !actionType) return;
    setSubmitting(true);

    try {
      const decision =
        actionType === "approve"
          ? "verified"
          : actionType === "reject"
          ? "rejected"
          : "needs_info";

      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: activeApp.id,
          targetUserId: activeApp.user_id,
          decision,
          rejectReason: actionType === "reject" ? notesInput : undefined,
          notes: notesInput,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setNotice(`Заявка артиста «${activeApp.stage_name}» переведена в статус: ${decision.toUpperCase()}`);
        setActiveApp(null);
        setActionType(null);
        setNotesInput("");
        fetchApplications();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
            <span>ADMIN CMS // ЦЕНТР ВЕРИФИКАЦИИ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Заявки на Верификацию Артистов
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Проверка принадлежности страниц музыкантам, одобрение бейджей CXRNER VERIFIED и начисление наград.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: "all", label: "Все заявки" },
          { id: "pending", label: "Ожидают проверки" },
          { id: "verified", label: "Одобренные" },
          { id: "needs_info", label: "Требуют данных" },
          { id: "rejected", label: "Отклонённые" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider transition ${
              statusFilter === tab.id
                ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
                : "bg-white/5 text-[#D9D9E2]/60 hover:text-white border border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-[#D9D9E2]/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B46BFF]" />
          <span>Загрузка заявок...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#090611] border border-white/10 font-mono text-xs text-[#D9D9E2]/50">
          Заявок в этой категории нет
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 hover:border-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display font-black text-xl text-white">
                    {app.stage_name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                      app.status === "verified"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : app.status === "pending"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : app.status === "needs_info"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-red-500/20 text-red-300 border-red-500/40"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#D9D9E2]/50">
                  Подана: {new Date(app.created_at).toLocaleString()}
                </div>
              </div>

              {/* Details & Proofs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-[#00F0FF] uppercase">Метод: {app.method}</div>
                  {app.verification_code && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#D9D9E2]/60">Проверочный код:</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold tracking-wider">
                        {app.verification_code}
                      </span>
                    </div>
                  )}
                  {app.evidence_notes && (
                    <p className="text-[#D9D9E2]/80 font-sans pt-1">
                      Примечание артиста: {app.evidence_notes}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-[#D9D9E2]/60 uppercase">Предоставленные ссылки:</div>
                  <div className="space-y-1">
                    {app.evidence_links?.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#B46BFF] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{link.title || link.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href={`/admin/users/${app.user_id}`}
                  className="font-mono text-xs text-[#00F0FF] hover:underline flex items-center gap-1"
                >
                  <span>Открыть профиль пользователя</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveApp(app);
                      setActionType("needs_info");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs transition"
                  >
                    Запросить данные
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveApp(app);
                      setActionType("reject");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-mono text-xs transition"
                  >
                    Отклонить
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveApp(app);
                      setActionType("approve");
                    }}
                    className="btn-energy px-4 py-1.5 rounded-xl font-mono text-xs uppercase font-bold"
                  >
                    Одобрить верификацию
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog Modal */}
      {activeApp && actionType && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <form
            onSubmit={handleActionSubmit}
            className="relative w-full max-w-md bg-[#090611] border border-white/20 rounded-3xl p-6 space-y-4 animate-fadeIn"
          >
            <button
              type="button"
              onClick={() => {
                setActiveApp(null);
                setActionType(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-white">
              {actionType === "approve"
                ? `Одобрить верификацию «${activeApp.stage_name}»`
                : actionType === "reject"
                ? `Отклонить верификацию «${activeApp.stage_name}»`
                : `Запрос данных у «${activeApp.stage_name}»`}
            </h3>

            {actionType === "approve" ? (
              <p className="text-xs text-[#D9D9E2]/70 font-sans leading-relaxed">
                Артист получит официальный знак CXRNER VERIFIED в профиле и каталоге, бейдж, достижение и награду +100 CXP.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase mb-1">
                  {actionType === "reject"
                    ? "Укажите причину отклонения (обязательно) *"
                    : "Что необходимо уточнить артисту? *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={
                    actionType === "reject"
                      ? "Несовпадение проверочного кода в описании карточки..."
                      : "Пришлите ссылку на сообщество артиста в VK..."
                  }
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveApp(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-mono text-xs"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-energy px-5 py-2 rounded-full font-mono text-xs uppercase font-bold"
              >
                {submitting ? "Выполняется..." : "Подтвердить решение"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
