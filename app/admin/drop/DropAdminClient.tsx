"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Award,
  Percent,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Search,
  ExternalLink,
  ShieldCheck,
  Edit,
  Check,
} from "lucide-react";
import type {
  SpecialRewardClaim,
  DropCaseConfig,
  DropSpecimenDef,
} from "@/lib/ecosystemTypes";
import { DROP_CASES, DROP_SPECIMENS } from "@/lib/ecosystemTypes";

interface DropAdminClientProps {
  initialClaims: SpecialRewardClaim[];
  initialAnalytics: {
    totalOpened: number;
    totalCxpSpent: number;
    rarityBreakdown: Record<string, number>;
    specialRewardsWon: number;
  };
}

export default function DropAdminClient({
  initialClaims,
  initialAnalytics,
}: DropAdminClientProps) {
  const [tab, setTab] = useState<"claims" | "cases" | "items" | "analytics">("claims");
  const [claims, setClaims] = useState<SpecialRewardClaim[]>(initialClaims);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [search, setSearch] = useState("");
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [statusInput, setStatusInput] = useState<any>("CLAIMED");
  const [notesInput, setNotesInput] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredClaims = claims.filter(
    (c) =>
      c.claim_code.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id.toLowerCase().includes(search.toLowerCase()) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateStatus = async (claimId: string, newStatus: any) => {
    try {
      const res = await fetch("/api/admin/drop/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          status: newStatus,
          notes: notesInput || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setClaims((prev) =>
          prev.map((c) =>
            c.id === claimId
              ? {
                  ...c,
                  status: newStatus,
                  admin_notes: notesInput || c.admin_notes,
                  claimed_at: newStatus === "CLAIMED" ? new Date().toISOString() : c.claimed_at,
                  redeemed_at: newStatus === "REDEEMED" ? new Date().toISOString() : c.redeemed_at,
                }
              : c
          )
        );
        setActionNotice(`Статус ваучера обновлен на: ${newStatus}`);
        setEditingClaimId(null);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      setActionNotice("Ошибка обновления статуса ваучера");
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]">
              <Boxes className="w-3.5 h-3.5 text-[#B46BFF]" />
              <span>ADMIN // CXRNER DROP MANAGEMENT</span>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
            Управление игрой CXRNER DROP
          </h1>
          <p className="text-xs text-[#D9D9E2]/75">
            Контроль ваучеров на обложки от @kazumaiq, настройка кейсов, каталога артефактов и игровая аналитика.
          </p>
        </div>

        <Link
          href="/drop"
          target="_blank"
          className="btn-energy px-5 py-2.5 rounded-full font-sans text-xs uppercase font-bold tracking-wider text-white shadow-[0_0_20px_rgba(135,55,255,0.4)] flex items-center gap-1.5 self-start"
        >
          <span>Перейти в игру</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
          {actionNotice}
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
        {[
          { key: "claims", label: "Ваучеры на обложки", icon: Award, count: claims.length },
          { key: "cases", label: "Кейсы и шансы", icon: Percent, count: DROP_CASES.length },
          { key: "items", label: "Каталог предметов", icon: Layers, count: DROP_SPECIMENS.length },
          { key: "analytics", label: "Аналитика игры", icon: BarChart3 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition ${
                tab === t.key
                  ? "bg-[#8737FF] text-white font-bold shadow-[0_0_15px_#8737FF]"
                  : "bg-white/[0.04] text-[#D9D9E2]/70 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/50 text-[9px]">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          TAB 1: REWARDS & VOUCHERS (COVER CLAIMS)
          =================================================================== */}
      {tab === "claims" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Поиск по коду, статусу или ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#8737FF]"
              />
            </div>
            <span className="font-mono text-xs text-[#D9D9E2]/60">
              Найдено: {filteredClaims.length}
            </span>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <Award className="w-8 h-8 text-amber-400/50 mx-auto" />
              <p className="font-display font-black text-sm uppercase tracking-wide text-white/50">
                Ваучеров пока нет
              </p>
              <p className="text-xs text-[#D9D9E2]/50">
                Когда игрок выбивает супер-приз (0.1%), ваучер появится здесь для модерации и выдачи обложки.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => {
                const isEditing = editingClaimId === claim.id;
                const statusColors: Record<string, string> = {
                  WON: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                  PENDING_CLAIM: "bg-purple-500/20 text-purple-300 border-purple-500/40",
                  CLAIMED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
                  REDEEMED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                  EXPIRED: "bg-rose-500/20 text-rose-300 border-rose-500/40",
                };

                return (
                  <div
                    key={claim.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-lg bg-black/60 border border-amber-500/60 font-mono text-xs font-bold text-amber-300">
                          {claim.claim_code}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                            statusColors[claim.status] || "bg-white/10 text-white"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>

                      <div className="font-mono text-[10px] text-white/50">
                        Выигран: {new Date(claim.won_at).toLocaleString("ru-RU")}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-[#D9D9E2]/80">
                      <div>
                        <span className="text-white/40 block text-[10px]">USER ID:</span>
                        <span className="truncate block">{claim.user_id}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">ЗАМЕТКИ МОДЕРАЦИИ:</span>
                        <span>{claim.admin_notes || "—"}</span>
                      </div>
                    </div>

                    {/* Quick Admin Status Actions */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(claim.id, "CLAIMED")}
                        className="px-3 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-mono text-[10px] uppercase transition"
                      >
                        Принять в работу (CLAIMED)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(claim.id, "REDEEMED")}
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] uppercase transition"
                      >
                        Обложка выдана (REDEEMED)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(claim.id, "EXPIRED")}
                        className="px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono text-[10px] uppercase transition"
                      >
                        Аннулировать (EXPIRED)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          TAB 2: CASES & DROP RATES
          =================================================================== */}
      {tab === "cases" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DROP_CASES.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#00F0FF] font-bold">
                    {c.subtitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                    АКТИВЕН
                  </span>
                </div>

                <div className="aspect-[3/4] w-24 mx-auto p-1 flex items-center justify-center">
                  <img src={c.cover_url} alt={c.name} className="w-full h-full object-contain" />
                </div>

                <div>
                  <h3 className="font-display font-black text-base uppercase text-white">
                    {c.name}
                  </h3>
                  <p className="text-xs text-[#D9D9E2]/70 leading-relaxed mt-1">
                    {c.description}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-1.5">
                  <div className="flex justify-between text-white/50 text-[10px]">
                    <span>СТОИМОСТЬ:</span>
                    <span className="font-bold text-white">{c.price_cxp} CXP</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-[10px]">
                    <span>COMMON:</span>
                    <span className="text-slate-300">{c.drop_rates.common}%</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-[10px]">
                    <span>RARE:</span>
                    <span className="text-[#38BDF8]">{c.drop_rates.rare}%</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-[10px]">
                    <span>EPIC:</span>
                    <span className="text-[#C084FC]">{c.drop_rates.epic}%</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-[10px]">
                    <span>LEGENDARY:</span>
                    <span className="text-[#FCD34D]">{c.drop_rates.legendary}%</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-[10px]">
                    <span>MYTHIC:</span>
                    <span className="text-[#FB7185]">{c.drop_rates.mythic}%</span>
                  </div>
                  <div className="flex justify-between text-amber-300 text-[10px] font-bold">
                    <span>COVER VOUCHER:</span>
                    <span>{c.drop_rates.special_reward}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 3: ITEMS CATALOG
          =================================================================== */}
      {tab === "items" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {DROP_SPECIMENS.map((specimen) => (
              <div
                key={specimen.item_id}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-center"
              >
                <div className="aspect-[3/4] w-20 mx-auto overflow-hidden">
                  <img
                    src={specimen.image_url || `/drop/items/${specimen.item_id}.jpg`}
                    alt={specimen.item_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith(".svg")) {
                        target.src = `/drop/items/${specimen.item_id}.svg`;
                      }
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-display font-black text-xs uppercase text-white truncate">
                    {specimen.item_name}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    {specimen.specimen_code && (
                      <span className="font-mono text-[8px] text-[#00F0FF] font-bold">
                        {specimen.specimen_code}
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-amber-300 font-bold">
                      {specimen.drop_chance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 4: GAME ANALYTICS
          =================================================================== */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-mono text-[10px] text-white/40 uppercase">ВСЕГО ОТКРЫТО</span>
              <span className="font-display font-black text-2xl text-white block">
                {analytics.totalOpened}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-mono text-[10px] text-white/40 uppercase">ПОТРАЧЕНО CXP</span>
              <span className="font-display font-black text-2xl text-[#8737FF] block">
                {analytics.totalCxpSpent}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-mono text-[10px] text-white/40 uppercase">ВЫИГРАНО ВАУЧЕРОВ</span>
              <span className="font-display font-black text-2xl text-amber-300 block">
                {analytics.specialRewardsWon}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-mono text-[10px] text-white/40 uppercase">ДОСТУПНЫХ КЕЙСОВ</span>
              <span className="font-display font-black text-2xl text-[#00F0FF] block">
                {DROP_CASES.length}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h3 className="font-display font-black text-sm uppercase tracking-wide text-white">
              Распределение выпавших редкостей
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {Object.entries(analytics.rarityBreakdown).map(([r, count]) => (
                <div key={r} className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                  <span className="font-mono text-[9px] uppercase text-white/50 block mb-1">
                    {r}
                  </span>
                  <span className="font-display font-black text-lg text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
