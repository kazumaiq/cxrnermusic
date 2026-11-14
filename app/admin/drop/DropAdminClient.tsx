"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Award,
  Percent,
  Layers,
  BarChart3,
  Clock,
  ArrowLeft,
  Search,
  ExternalLink,
  Edit,
  Users,
  Plus,
  Trash2,
  Coins,
  Gift,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type {
  SpecialRewardClaim,
  DropInventoryItem,
} from "@/lib/ecosystemTypes";
import type { AdminDropPlayerSummary, AdminRecentDropEntry } from "@/lib/ecosystemDb";
import { DROP_CASES, DROP_SPECIMENS } from "@/lib/ecosystemTypes";
import SpecimenVisual from "@/components/drop/SpecimenVisual";

interface DropAnalyticsData {
  totalOpened: number;
  totalCxpSpent: number;
  totalCxpInCirculation?: number;
  totalArtifactsInInventories?: number;
  rarityBreakdown: Record<string, number>;
  specialRewardsWon: number;
  recentDrops?: AdminRecentDropEntry[];
  playersSummary?: AdminDropPlayerSummary[];
}

interface DropAdminClientProps {
  initialClaims: SpecialRewardClaim[];
  initialAnalytics: DropAnalyticsData;
}

export default function DropAdminClient({
  initialClaims,
  initialAnalytics,
}: DropAdminClientProps) {
  const [tab, setTab] = useState<
    "players" | "history" | "claims" | "cases" | "items" | "analytics"
  >("players");
  const [claims, setClaims] = useState<SpecialRewardClaim[]>(initialClaims);
  const [analytics, setAnalytics] = useState<DropAnalyticsData>(initialAnalytics);
  const [search, setSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [selectedSpecimenByUser, setSelectedSpecimenByUser] = useState<Record<string, string>>({});
  const [customBalanceByUser, setCustomBalanceByUser] = useState<Record<string, string>>({});

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const refreshData = async () => {
    try {
      const res = await fetch("/api/admin/drop/claims");
      const data = await res.json();
      if (data.ok) {
        if (data.claims) setClaims(data.claims);
        if (data.analytics) setAnalytics(data.analytics);
        notify("Данные арены CXRNER DROP синхронизированы");
      }
    } catch {
      notify("Ошибка обновления данных");
    }
  };

  const handlePlayerAction = async (payload: Record<string, any>, successMsg: string) => {
    setBusyUserId(payload.userId);
    try {
      const res = await fetch("/api/admin/drop/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.analytics) setAnalytics(data.analytics);
        notify(successMsg);
      } else {
        notify(data.error || "Ошибка выполнения действия");
      }
    } catch {
      notify("Сетевая ошибка при выполнении операции");
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredClaims = claims.filter(
    (c) =>
      c.claim_code.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id.toLowerCase().includes(search.toLowerCase()) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  );

  const players = analytics.playersSummary || [];
  const filteredPlayers = players.filter((p) => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.username.toLowerCase().includes(q) ||
      p.display_name.toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q)
    );
  });

  const recentDrops = analytics.recentDrops || [];

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
        notify(`Статус ваучера обновлен на: ${newStatus}`);
        setEditingClaimId(null);
      }
    } catch {
      notify("Ошибка обновления статуса ваучера");
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8737FF]/40 bg-[#8737FF]/12 font-mono text-[10px] uppercase tracking-widest text-[#D9D9E2]">
              <Boxes className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>ADMIN // CXRNER DROP MANAGEMENT</span>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
            Управление игрой CXRNER DROP
          </h1>
          <p className="text-xs text-[#D9D9E2]/65">
            Контроль балансов CXP, инвентаря игроков, истории открытий, ваучеров @kazumaiq и шансов выпадения.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start shrink-0">
          <button
            onClick={refreshData}
            className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 font-mono text-[11px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Обновить</span>
          </button>
          <Link
            href="/drop"
            target="_blank"
            className="btn-void-primary px-5 py-2.5 rounded-full font-mono text-[11px] uppercase font-bold tracking-wider flex items-center gap-1.5"
          >
            <span>Открыть арену</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
          {actionNotice}
        </div>
      )}

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="cxr-panel p-4 rounded-2xl">
          <span className="font-mono text-[9px] text-white/45 uppercase block">ИГРОКОВ В DROP</span>
          <span className="font-display font-black text-xl text-white tabular-nums">
            {players.length}
          </span>
        </div>
        <div className="cxr-panel p-4 rounded-2xl">
          <span className="font-mono text-[9px] text-[#00F0FF]/80 uppercase block">АРТЕФАКТОВ НА РУКАХ</span>
          <span className="font-display font-black text-xl text-[#00F0FF] tabular-nums">
            {analytics.totalArtifactsInInventories ?? 0}
          </span>
        </div>
        <div className="cxr-panel p-4 rounded-2xl">
          <span className="font-mono text-[9px] text-emerald-300/80 uppercase block">CXP В ОБОРОТЕ</span>
          <span className="font-display font-black text-xl text-emerald-300 tabular-nums">
            {analytics.totalCxpInCirculation ?? 0}
          </span>
        </div>
        <div className="cxr-panel p-4 rounded-2xl">
          <span className="font-mono text-[9px] text-[#B46BFF]/80 uppercase block">ОТКРЫТО КАПСУЛ</span>
          <span className="font-display font-black text-xl text-[#B46BFF] tabular-nums">
            {analytics.totalOpened}
          </span>
        </div>
        <div className="cxr-panel p-4 rounded-2xl">
          <span className="font-mono text-[9px] text-amber-300/80 uppercase block">ВАУЧЕРОВ ВЫПАЛО</span>
          <span className="font-display font-black text-xl text-amber-300 tabular-nums">
            {analytics.specialRewardsWon}
          </span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#0A0810] border border-white/10">
        {[
          { key: "players", label: "Игроки и инвентарь", icon: Users, count: players.length },
          { key: "history", label: "История открытий", icon: Clock, count: recentDrops.length },
          { key: "claims", label: "Ваучеры на обложки", icon: Award, count: claims.length },
          { key: "cases", label: "Кейсы и шансы", icon: Percent, count: DROP_CASES.length },
          { key: "items", label: "Каталог предметов", icon: Layers, count: DROP_SPECIMENS.length },
          { key: "analytics", label: "Аналитика", icon: BarChart3 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-[11px] uppercase tracking-wider transition ${
                tab === t.key
                  ? "bg-white text-[#050407] font-bold shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                  : "text-[#D9D9E2]/65 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    tab === t.key ? "bg-[#050407]/15 text-[#050407]" : "bg-black/60 text-white/70"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          TAB 0: PLAYERS, BALANCES & INVENTORIES
          =================================================================== */}
      {tab === "players" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Поиск игрока по нику, почте или ID..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#8737FF]"
              />
            </div>
            <span className="font-mono text-xs text-[#D9D9E2]/60">
              Показано игроков: {filteredPlayers.length}
            </span>
          </div>

          <div className="space-y-4">
            {filteredPlayers.map((player) => {
              const isBusy = busyUserId === player.user_id;
              const selectedSpec =
                selectedSpecimenByUser[player.user_id] || DROP_SPECIMENS[0]?.item_id || "item_cxrner_crest";
              const customBal = customBalanceByUser[player.user_id] ?? String(player.balance);

              return (
                <div
                  key={player.user_id}
                  className="cxr-panel p-5 rounded-2xl space-y-4 border border-white/10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-black text-base text-white">
                          {player.display_name}
                        </span>
                        <span className="font-mono text-xs text-[#00F0FF]">
                          @{player.username}
                        </span>
                        {player.email && (
                          <span className="font-mono text-[11px] text-white/45">
                            ({player.email})
                          </span>
                        )}
                        <Link
                          href={`/admin/users/${player.user_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-[10px] font-mono text-white/80 transition"
                        >
                          <span>Досье</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                      <div className="font-mono text-[10px] text-white/40">
                        ID: {player.user_id} · Открыто капсул: {player.drops_count} · Предметов: {player.items_count}
                      </div>
                    </div>

                    {/* Balance & Quick CXP Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#8737FF]/15 border border-[#8737FF]/40 font-mono text-xs">
                        <span className="text-white/50 mr-1.5">БАЛАНС:</span>
                        <span className="font-bold text-white tabular-nums">{player.balance} CXP</span>
                      </div>
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          handlePlayerAction(
                            {
                              action: "admin_adjust_cxp",
                              userId: player.user_id,
                              amount: 100,
                              reason: "Бонус +100 CXP от администратора",
                            },
                            `Начислено +100 CXP игроку @${player.username}`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-mono text-[10px] font-bold uppercase transition"
                      >
                        +100 CXP
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          handlePlayerAction(
                            {
                              action: "admin_adjust_cxp",
                              userId: player.user_id,
                              amount: 500,
                              reason: "Бонус +500 CXP от администратора",
                            },
                            `Начислено +500 CXP игроку @${player.username}`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/35 text-[#00F0FF] font-mono text-[10px] font-bold uppercase transition"
                      >
                        +500 CXP
                      </button>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={customBal}
                          onChange={(e) =>
                            setCustomBalanceByUser((prev) => ({
                              ...prev,
                              [player.user_id]: e.target.value,
                            }))
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 font-mono text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                        />
                        <button
                          disabled={isBusy}
                          onClick={() =>
                            handlePlayerAction(
                              {
                                action: "admin_set_cxp",
                                userId: player.user_id,
                                balance: Number(customBal),
                                reason: "Установка точного баланса в админ-панели",
                              },
                              `Баланс @${player.username} установлен на ${customBal} CXP`
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-[10px] uppercase transition"
                        >
                          Задать CXP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Grant Artifact Row */}
                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-[#B46BFF]" />
                      <span className="font-mono text-[10px] uppercase text-white/60">
                        Выдать артефакт в инвентарь:
                      </span>
                      <select
                        value={selectedSpec}
                        onChange={(e) =>
                          setSelectedSpecimenByUser((prev) => ({
                            ...prev,
                            [player.user_id]: e.target.value,
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 font-mono text-xs text-white focus:outline-none focus:border-[#8737FF]"
                      >
                        {DROP_SPECIMENS.map((sp) => (
                          <option key={sp.item_id} value={sp.item_id}>
                            [{sp.rarity.toUpperCase()}] {sp.item_name} ({sp.specimen_code})
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          handlePlayerAction(
                            {
                              action: "admin_grant_item",
                              userId: player.user_id,
                              specimenId: selectedSpec,
                            },
                            `Артефакт выдан игроку @${player.username}`
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8737FF]/25 hover:bg-[#8737FF]/40 border border-[#8737FF]/50 text-white font-mono text-[10px] font-bold uppercase transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Выдать предмет</span>
                      </button>
                    </div>
                  </div>

                  {/* Player Inventory List */}
                  {player.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                      {player.items.slice(0, 16).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/50 border border-white/10"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-[#00F0FF] font-bold">
                                {item.rarity}
                              </span>
                              <span className="font-mono text-[9px] text-white/45">
                                #{item.serial_number || 1}
                              </span>
                            </div>
                            <div className="font-display font-bold text-xs text-white truncate mt-1">
                              {item.item_name}
                            </div>
                            <div className="font-mono text-[9px] text-white/40">
                              {item.specimen_code} · {item.obtained_via || "case_open"}
                            </div>
                          </div>
                          <button
                            disabled={isBusy}
                            title="Изъять предмет из инвентаря"
                            onClick={() =>
                              handlePlayerAction(
                                {
                                  action: "admin_revoke_item",
                                  userId: player.user_id,
                                  inventoryItemId: item.id,
                                },
                                `Артефакт ${item.item_name} изъят у @${player.username}`
                              )
                            }
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-white/35 italic">
                      Инвентарь пуст
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 0.5: RECENT DROPS HISTORY
          =================================================================== */}
      {tab === "history" && (
        <div className="space-y-4">
          {recentDrops.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10">
              <p className="font-mono text-xs text-white/50">История открытий пока пуста</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentDrops.map((drop) => (
                <div
                  key={drop.id}
                  className="cxr-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono text-[10px] uppercase font-bold text-[#00F0FF]">
                      {drop.rarity}
                    </span>
                    <div>
                      <div className="font-display font-bold text-sm text-white">
                        {drop.item_name}{" "}
                        <span className="font-mono text-xs text-white/45">
                          ({drop.item_id} · #{drop.serial_number || 1})
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-white/55">
                        Игрок:{" "}
                        <Link
                          href={`/admin/users/${drop.user_id}`}
                          className="text-[#B46BFF] hover:underline"
                        >
                          {drop.display_name || drop.username || drop.user_id}
                        </Link>{" "}
                        · Кейс: {drop.case_name} · Потрачено: {drop.cxp_spent} CXP
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/45">
                    {new Date(drop.created_at).toLocaleString("ru-RU")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                    className="cxr-panel p-4 sm:p-5 rounded-2xl space-y-3"
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

                    {isEditing && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="Комментарий администратора к заявке..."
                          className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                        />
                        <button
                          onClick={() => handleUpdateStatus(claim.id, claim.status)}
                          className="px-3.5 py-2 rounded-xl bg-white text-[#050407] font-mono text-[10px] font-bold uppercase tracking-wider"
                        >
                          Сохранить заметку
                        </button>
                      </div>
                    )}

                    {/* Quick Admin Status Actions */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(claim.id, "CLAIMED")}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-mono text-[10px] uppercase transition"
                        >
                          Принять в работу (CLAIMED)
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(claim.id, "REDEEMED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] uppercase transition"
                        >
                          Обложка выдана (REDEEMED)
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(claim.id, "EXPIRED")}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono text-[10px] uppercase transition"
                        >
                          Аннулировать (EXPIRED)
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingClaimId(null);
                          } else {
                            setEditingClaimId(claim.id);
                            setNotesInput(claim.admin_notes || "");
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[10px] font-mono uppercase text-[#D9D9E2]/70 transition"
                      >
                        <Edit className="w-3 h-3" />
                        <span>{isEditing ? "Отмена" : "Заметка"}</span>
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
                className="cxr-panel p-5 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#00F0FF] font-bold">
                    {c.subtitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold">
                    АКТИВЕН
                  </span>
                </div>

                <div className="aspect-[3/4] w-24 mx-auto p-1 flex items-center justify-center">
                  <img src={c.cover_url} alt={c.name} className="w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(135,55,255,0.28)]" />
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
                className="cxr-panel p-3 rounded-2xl space-y-2.5"
              >
                <SpecimenVisual
                  itemId={specimen.item_id}
                  itemName={specimen.item_name}
                  rarity={specimen.rarity}
                  imageUrl={specimen.image_url}
                  isSpecialReward={specimen.is_special_reward}
                  interactiveTilt={true}
                />
                <div className="text-center space-y-1">
                  <h4 className="font-display font-black text-xs uppercase text-white truncate">
                    {specimen.item_name}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5">
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
            <div className="cxr-panel p-5 rounded-2xl space-y-1">
              <span className="font-mono text-[10px] text-white/45 uppercase">ВСЕГО ОТКРЫТО</span>
              <span className="font-display font-black text-2xl sm:text-3xl text-white block tabular-nums">
                {analytics.totalOpened}
              </span>
            </div>
            <div className="cxr-panel p-5 rounded-2xl space-y-1 border-[#8737FF]/30">
              <span className="font-mono text-[10px] text-[#B46BFF]/80 uppercase">ПОТРАЧЕНО CXP</span>
              <span className="font-display font-black text-2xl sm:text-3xl text-[#B46BFF] block tabular-nums">
                {analytics.totalCxpSpent}
              </span>
            </div>
            <div className="cxr-panel p-5 rounded-2xl space-y-1 border-amber-400/25">
              <span className="font-mono text-[10px] text-amber-300/80 uppercase">ВЫИГРАНО ВАУЧЕРОВ</span>
              <span className="font-display font-black text-2xl sm:text-3xl text-amber-300 block tabular-nums">
                {analytics.specialRewardsWon}
              </span>
            </div>
            <div className="cxr-panel p-5 rounded-2xl space-y-1 border-[#00F0FF]/25">
              <span className="font-mono text-[10px] text-[#00F0FF]/80 uppercase">ДОСТУПНЫХ КЕЙСОВ</span>
              <span className="font-display font-black text-2xl sm:text-3xl text-[#00F0FF] block tabular-nums">
                {DROP_CASES.length}
              </span>
            </div>
          </div>

          <div className="cxr-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-black text-sm uppercase tracking-wide text-white">
                Распределение выпавших редкостей
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                Telemetry Matrix
              </span>
            </div>
            {(() => {
              const entries = Object.entries(analytics.rarityBreakdown);
              const total = entries.reduce((acc, [, v]) => acc + Number(v || 0), 0);
              const barColor: Record<string, string> = {
                common: "#A1A1AA",
                rare: "#00F0FF",
                epic: "#B46BFF",
                legendary: "#F59E0B",
                mythic: "#F43F5E",
                special_reward: "#FBBF24",
              };
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {entries.map(([r, count]) => {
                    const num = Number(count || 0);
                    const pct = total > 0 ? Math.round((num / total) * 100) : 0;
                    const color = barColor[r] || "#B46BFF";
                    return (
                      <div key={r} className="p-3.5 rounded-xl bg-black/45 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color }}>
                            {r}
                          </span>
                          <span className="font-mono text-xs text-white/90 font-bold tabular-nums">
                            {num} <span className="text-white/40">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
