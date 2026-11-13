"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Trophy,
} from "lucide-react";

export default function ReferralAdminClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals");
      const d = await res.json();
      if (d.ok) {
        setData(d);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFraudAction = async (action: "approve_suspicious" | "flag_fraud", referralId: string) => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, referralId }),
      });
      const resData = await res.json();
      if (resData.ok) {
        setActionNotice(
          action === "approve_suspicious"
            ? "Реферал одобрен как подлинный"
            : "Реферал помечен как подозрительный/мошеннический"
        );
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center font-mono text-xs text-[#D9D9E2]/50">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B46BFF]" />
        <span>Загрузка данных реферальной системы...</span>
      </div>
    );
  }

  const { stats, leaderboard, fraudQueue } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
            <span>ADMIN CMS // КОНТРОЛЬ РЕФЕРАЛОВ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Аналитика Реферальной Программы & Антифрод
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Мониторинг конверсий, объёмов выплат CXP, управление спорными начислениями и проверка очередей.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-3xl bg-[#090611] border border-white/10 space-y-1">
          <span className="text-[11px] text-[#D9D9E2]/50 uppercase">Регистраций по ссылкам</span>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {stats.totalRegistrations}
          </div>
          <div className="text-[10px] text-[#00F0FF]">Конверсия: {stats.conversionRate}%</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#090611] border border-white/10 space-y-1">
          <span className="text-[11px] text-[#D9D9E2]/50 uppercase">Квалифицировано</span>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
            {stats.qualifiedCount}
          </div>
          <div className="text-[10px] text-emerald-400/80">Qualified Artists</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#090611] border border-white/10 space-y-1">
          <span className="text-[11px] text-[#D9D9E2]/50 uppercase">Выплачено CXP</span>
          <div className="font-display font-black text-2xl sm:text-3xl text-[#B46BFF]">
            +{stats.totalCxpAwarded}
          </div>
          <div className="text-[10px] text-[#D9D9E2]/50">Всего в экономику</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#090611] border border-white/10 space-y-1">
          <span className="text-[11px] text-[#D9D9E2]/50 uppercase">Подозрительные (Фрод)</span>
          <div className="font-display font-black text-2xl sm:text-3xl text-red-400">
            {stats.fraudCount}
          </div>
          <div className="text-[10px] text-red-400/80">В очереди модерации</div>
        </div>
      </div>

      {/* Fraud Queue */}
      <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span>Очередь подозрительных регистраций (Антифрод)</span>
        </h3>

        {fraudQueue.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#D9D9E2]/40 bg-white/5 rounded-2xl border border-white/5">
            Подозрительных активностей и мультиаккаунтов не обнаружено
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            {fraudQueue.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-white">Реферал ID: {item.id}</div>
                  <div className="text-[11px] text-red-300 font-sans mt-0.5">
                    Причина подозрения: {item.fraud_reason || "Совпадение параметров / подозрение на мультиаккаунт"}
                  </div>
                  <div className="text-[10px] text-[#D9D9E2]/50 mt-1">
                    Пригласил: {item.referrer_user_id} → Новый: {item.referred_user_id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFraudAction("approve_suspicious", item.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 text-xs transition"
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFraudAction("flag_fraud", item.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold border border-red-500/40 text-xs transition"
                  >
                    Заблокировать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Recruiters Leaderboard */}
      <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Топ скаутов по числу подтверждённых артистов</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#D9D9E2]/50 uppercase bg-white/[0.02]">
                <th className="py-3 px-3">Ранг</th>
                <th className="py-3 px-3">Артист</th>
                <th className="py-3 px-3">Квалифицировано</th>
                <th className="py-3 px-3">Статус скаута</th>
                <th className="py-3 px-3 text-right">Профиль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.map((u: any) => (
                <tr key={u.userId} className="hover:bg-white/5 transition">
                  <td className="py-3 px-3 font-bold">#{u.rank}</td>
                  <td className="py-3 px-3 font-bold text-white">{u.displayName} (@{u.username})</td>
                  <td className="py-3 px-3 text-[#00F0FF] font-bold">{u.qualifiedArtistsCount}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#8737FF]/20 text-[#B46BFF] uppercase text-[10px] font-bold">
                      {u.badge}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/admin/users/${u.userId}`}
                      className="text-[#00F0FF] hover:underline"
                    >
                      Досье →
                    </Link>
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
