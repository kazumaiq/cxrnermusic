"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Copy,
  Check,
  Sparkles,
  Trophy,
  ShieldCheck,
  Disc,
  ArrowRight,
  TrendingUp,
  Share2,
  AlertCircle,
} from "lucide-react";

interface ReferralStats {
  myCode: string;
  shareUrl: string;
  totalInvited: number;
  registeredCount: number;
  emailVerifiedCount: number;
  profileCompletedCount: number;
  telegramLinkedCount: number;
  verifiedArtistCount: number;
  releaseApprovedCount: number;
  qualifiedCount: number;
  totalEarnedCxp: number;
  referralsList: any[];
  referredByCode?: string | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  qualifiedArtistsCount: number;
  badge: string;
}

interface ReferralClientProps {
  stats: ReferralStats;
  leaderboard: LeaderboardEntry[];
  userOptedIn: boolean;
}

export default function ReferralClient({
  stats,
  leaderboard,
  userOptedIn,
}: ReferralClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "invited">("overview");
  const [referredByCode, setReferredByCode] = useState<string | null>(stats.referredByCode || null);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inviteCodeInput.trim();
    if (!clean) return;
    setRedeeming(true);
    setRedeemFeedback(null);
    try {
      const res = await fetch("/api/referral/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: clean }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setRedeemFeedback({
          type: "error",
          text: data.message || data.error || "Не удалось привязать код",
        });
        return;
      }
      setReferredByCode(clean.toUpperCase());
      setInviteCodeInput("");
      setRedeemFeedback({ type: "success", text: "Код приглашения успешно активирован!" });
      try {
        localStorage.removeItem("cxrner_ref_code");
      } catch {
        // ignore
      }
      router.refresh();
    } catch {
      setRedeemFeedback({ type: "error", text: "Ошибка сети при активации кода" });
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <Users className="w-4 h-4 text-[#00F0FF]" />
            <span>CXRNER REFERRAL // СЕТЬ АРТИСТОВ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Приглашайте Музыкантов & Зарабатывайте CXP
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Одноуровневая программа рекомендаций. Награды за подтверждённые действия ваших приглашённых.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-4 py-2 rounded-full bg-[#8737FF]/15 border border-[#8737FF]/40 text-[#B46BFF] font-bold shadow-[0_0_16px_rgba(135,55,255,0.25)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span>ЗАРАБОТАНО: +{stats.totalEarnedCxp} CXP</span>
          </div>
        </div>
      </div>

      {/* Referral Link & Share Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#160B28] via-[#090611] to-[#12081C] border border-[#B46BFF]/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00F0FF]">
              ВАША ПЕРСОНАЛЬНАЯ ССЫЛКА
            </span>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              Код: {stats.myCode}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-energy px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2 shadow-lg"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Ссылка скопирована!" : "Скопировать ссылку"}</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-white/90 select-all break-all flex items-center justify-between gap-3">
          <span>{stats.shareUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#D9D9E2]/60 hover:text-white transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Optional referral code activation if user wasn't attributed via link yet */}
        {!referredByCode ? (
          <form onSubmit={handleRedeemCode} className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="Есть код приглашения друга? Например: ARTIST-A1B2C3"
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#00F0FF] outline-none"
              />
              <button
                type="submit"
                disabled={redeeming || !inviteCodeInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-mono font-bold uppercase tracking-wider text-white transition disabled:opacity-50 shrink-0"
              >
                {redeeming ? "Проверка..." : "Активировать код"}
              </button>
            </div>
            {redeemFeedback && (
              <p
                className={`text-[11px] font-mono ${
                  redeemFeedback.type === "success" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {redeemFeedback.text}
              </p>
            )}
          </form>
        ) : (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-emerald-300">
            <span>Вы привязаны по приглашению (код: <strong className="text-white">{referredByCode}</strong>)</span>
            {redeemFeedback?.type === "success" && <span>{redeemFeedback.text}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition ${
            activeTab === "overview"
              ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
              : "text-[#D9D9E2]/60 hover:text-white"
          }`}
        >
          Обзор наград & Прогресс
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition ${
            activeTab === "leaderboard"
              ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
              : "text-[#D9D9E2]/60 hover:text-white"
          }`}
        >
          Рейтинг скаутов (Топ 50)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("invited")}
          className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition ${
            activeTab === "invited"
              ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
              : "text-[#D9D9E2]/60 hover:text-white"
          }`}
        >
          Мои приглашённые ({stats.referralsList.length})
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Metrics 4-Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#090611] border border-white/10 space-y-1">
              <span className="font-mono text-[11px] text-[#D9D9E2]/60 uppercase">Всего переходов</span>
              <div className="font-display font-black text-2xl sm:text-3xl text-white">
                {stats.totalInvited}
              </div>
              <div className="font-mono text-[10px] text-[#00F0FF]">Зарегистрировались</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090611] border border-white/10 space-y-1">
              <span className="font-mono text-[11px] text-[#D9D9E2]/60 uppercase">Заполнили профиль</span>
              <div className="font-display font-black text-2xl sm:text-3xl text-[#B46BFF]">
                {stats.profileCompletedCount}
              </div>
              <div className="font-mono text-[10px] text-[#D9D9E2]/60">80%+ & Привязан TG</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090611] border border-white/10 space-y-1">
              <span className="font-mono text-[11px] text-[#D9D9E2]/60 uppercase">Верифицированы</span>
              <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
                {stats.verifiedArtistCount}
              </div>
              <div className="font-mono text-[10px] text-emerald-400/80">Статус проверен</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090611] border border-white/10 space-y-1">
              <span className="font-mono text-[11px] text-[#D9D9E2]/60 uppercase">Квалифицированы</span>
              <div className="font-display font-black text-2xl sm:text-3xl text-[#00F0FF]">
                {stats.qualifiedCount}
              </div>
              <div className="font-mono text-[10px] text-[#00F0FF]">Qualified Artists</div>
            </div>
          </div>

          {/* Reward Milestones Roadmap */}
          <div className="p-7 rounded-3xl bg-[#090611] border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-white">
                Таблица начислений за действия приглашённого
              </h3>
              <span className="font-mono text-xs text-[#00F0FF] uppercase">1-tier Transparent</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="font-mono text-[10px] uppercase text-[#D9D9E2]/50">Этап 1</div>
                <div className="font-display font-bold text-sm text-white">Email подтверждён</div>
                <div className="font-mono text-base font-black text-[#B46BFF]">+25 CXP</div>
                <p className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  Начисляется пригласившему сразу после проверки почты.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="font-mono text-[10px] uppercase text-[#D9D9E2]/50">Этап 2</div>
                <div className="font-display font-bold text-sm text-white">Профиль 80% + TG</div>
                <div className="font-mono text-base font-black text-[#00F0FF]">+50 / +50 CXP</div>
                <p className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  Оба пользователя получают по +50 CXP за заполнение данных и привязку бота.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="font-mono text-[10px] uppercase text-[#D9D9E2]/50">Этап 3</div>
                <div className="font-display font-bold text-sm text-white">Артист верифицирован</div>
                <div className="font-mono text-base font-black text-emerald-400">+50 / +100 CXP</div>
                <p className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  +50 CXP пригласившему, +100 CXP новому артисту за подтверждение владения карточками.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="font-mono text-[10px] uppercase text-[#D9D9E2]/50">Этап 4</div>
                <div className="font-display font-bold text-sm text-white">Первый релиз одобрен</div>
                <div className="font-mono text-base font-black text-amber-300">+150 CXP</div>
                <p className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  Максимальный бонус пригласившему после успешной модерации первого трека.
                </p>
              </div>
            </div>

            {/* Anti-fraud transparency notes */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-[#D9D9E2]/70 font-sans space-y-1">
                <div className="font-bold text-white">Честная и прозрачная модель (Антифрод)</div>
                <p>
                  Запрещены саморефералы и накрутки ботами. Лимит: до 10 полностью квалифицированных артистов в месяц на один аккаунт. Все начисления фиксируются в истории транзакций кошелька.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Таблица лучших скаутов лейбла</span>
            </h3>
            <span className="font-mono text-xs text-[#D9D9E2]/50">Обновляется в реальном времени</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#D9D9E2]/50 uppercase tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Артист / Скаут</th>
                  <th className="py-3 px-3">Квалифицировано</th>
                  <th className="py-3 px-3">Ранг скаута</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#D9D9E2]/40">
                      Список лидеров пока пуст. Будьте первым!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((user) => (
                    <tr key={user.userId} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-3 font-bold">
                        {user.rank === 1 ? "🥇 1" : user.rank === 2 ? "🥈 2" : user.rank === 3 ? "🥉 3" : user.rank}
                      </td>
                      <td className="py-3.5 px-3">
                        <Link
                          href={`/profile/${user.username}`}
                          target="_blank"
                          className="flex items-center gap-2 hover:text-[#B46BFF] transition"
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0">
                            <img
                              src={user.avatarUrl || "/logo.png"}
                              alt={user.displayName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-display font-bold text-white text-xs">{user.displayName}</div>
                            <div className="text-[10px] text-[#D9D9E2]/50">@{user.username}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#00F0FF]">
                        {user.qualifiedArtistsCount}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#B46BFF] text-[10px] uppercase font-bold">
                          {user.badge}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "invited" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-lg text-white">Список приглашённых</h3>
          {stats.referralsList.length === 0 ? (
            <div className="p-12 text-center text-[#D9D9E2]/50 font-sans text-xs">
              Вы ещё не пригласили артистов. Скопируйте вашу реферальную ссылку выше и поделитесь с коллегами.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.referralsList.map((ref, idx) => (
                <div
                  key={ref.id || idx}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#D9D9E2]/40">#{idx + 1}</span>
                    {ref.referred_username ? (
                      <Link
                        href={`/profile/${ref.referred_username}`}
                        className="text-white font-bold hover:text-[#00F0FF] transition"
                      >
                        {ref.referred_display_name || `@${ref.referred_username}`}
                        <span className="ml-1.5 text-[10px] text-[#D9D9E2]/50 font-normal">
                          @{ref.referred_username}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-white font-bold">
                        {ref.referred_display_name || `Пользователь ${ref.referred_user_id.slice(0, 8)}...`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {Array.isArray(ref.milestones) && ref.milestones.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px]">
                        Этапов: {ref.milestones.length}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        ref.is_qualified
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {ref.status}
                    </span>
                    <span className="text-[#D9D9E2]/40 text-[11px]">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
