"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Boxes,
  Disc,
  Clock,
  Sparkles,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Ban,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Activity,
  Layers,
  FileText,
  Key,
} from "lucide-react";

interface UserDossierClientProps {
  userId: string;
}

type TabType =
  | "overview"
  | "profile"
  | "artist"
  | "inventory"
  | "wallet"
  | "referrals"
  | "releases"
  | "activity";

export default function UserDossierClient({ userId }: UserDossierClientProps) {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // CXP adjustment modal
  const [showCxpModal, setShowCxpModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(100);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchDossier = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.ok) {
        setDossier(data.dossier);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [userId]);

  const handleAdjustCxp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason) return;
    setAdjustLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_cxp",
          amount: adjustAmount,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowCxpModal(false);
        setAdjustReason("");
        setActionNotice(`Баланс CXP успешно скорректирован. Новый баланс: ${data.newBalance} CXP`);
        fetchDossier();
      }
    } catch {
      // ignore
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleToggleBan = async () => {
    const isBannedNow = dossier?.overview?.isBanned;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_ban",
          isBanned: !isBannedNow,
          banReason: !isBannedNow ? "Административная блокировка" : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionNotice(!isBannedNow ? "Пользователь заблокирован" : "Пользователь разблокирован");
        fetchDossier();
      }
    } catch {
      // ignore
    }
  };

  const handleSetVerification = async (newStatus: "verified" | "not_verified") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_verification_status",
          verificationStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionNotice(`Статус верификации обновлён: ${newStatus}`);
        fetchDossier();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-[#D9D9E2]/50">
        <Sparkles className="w-8 h-8 animate-spin mx-auto mb-3 text-[#B46BFF]" />
        <span>Загрузка административного досье...</span>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="py-24 text-center font-mono text-xs text-red-400">
        Пользователь не найден
      </div>
    );
  }

  const { overview, profile, artistIdentity, dropInventory, wallet, referrals, releases, activity } =
    dossier;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#00F0FF]">
              <span>ID: {userId}</span>
              {overview.isArtistVerified && (
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold">
                  VERIFIED ARTIST
                </span>
              )}
              {overview.isBanned && (
                <span className="px-2 py-0.2 rounded-full bg-red-500/20 text-red-300 text-[10px] uppercase font-bold">
                  BANNED
                </span>
              )}
            </div>
            <h1 className="font-display font-black text-2xl text-white mt-0.5">
              {overview.displayName} (@{overview.username})
            </h1>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCxpModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#8737FF]/20 hover:bg-[#8737FF]/30 border border-[#8737FF]/40 text-[#B46BFF] font-mono text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Скорректировать CXP</span>
          </button>

          {overview.isArtistVerified ? (
            <button
              type="button"
              onClick={() => handleSetVerification("not_verified")}
              className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs transition"
            >
              Отозвать верификацию
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSetVerification("verified")}
              className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Верифицировать</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleBan}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs transition flex items-center gap-1.5 ${
              overview.isBanned
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                : "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{overview.isBanned ? "Разблокировать" : "Заблокировать"}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#8737FF]/15 border border-[#8737FF]/40 text-[#B46BFF] font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 8 Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/10 pb-2 font-mono text-xs">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "profile", label: "Profile", icon: User },
          { id: "artist", label: "Artist Identity", icon: ShieldCheck },
          { id: "inventory", label: `Inventory (${dropInventory.total})`, icon: Boxes },
          { id: "wallet", label: `Wallet (${wallet.balance} CXP)`, icon: Sparkles },
          { id: "referrals", label: `Referrals (${referrals.totalInvited})`, icon: Users },
          { id: "releases", label: `Releases (${releases.length})`, icon: Disc },
          { id: "activity", label: "Activity Log", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-[#8737FF] text-white font-bold shadow-[0_0_12px_#8737FF]"
                  : "bg-white/5 text-[#D9D9E2]/60 hover:text-white border border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-base text-white">Основная сводка</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Email:</span>
                <span className="text-white">{overview.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Telegram:</span>
                <span className="text-[#00F0FF]">
                  {overview.telegramUsername ? `@${overview.telegramUsername}` : overview.telegramId || "Не привязан"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Регистрация:</span>
                <span className="text-white">{new Date(overview.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Заполнение профиля:</span>
                <span className="text-emerald-400 font-bold">{overview.profileCompletion}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#D9D9E2]/50">Статус аккаунта:</span>
                <span className="text-white uppercase">{overview.isBanned ? "Заблокирован" : "Активен"}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-base text-white">Экосистема CXRNER</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Баланс CXP:</span>
                <span className="text-[#B46BFF] font-bold text-sm">{wallet.balance} CXP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Всего заработано:</span>
                <span className="text-white">+{wallet.totalEarned} CXP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Экспонатов DROP:</span>
                <span className="text-white">{dropInventory.total}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#D9D9E2]/50">Квалифицированных рефералов:</span>
                <span className="text-[#00F0FF]">{referrals.qualifiedCount}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-base text-white">Музыкальная деятельность</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Подано заявок:</span>
                <span className="text-white">{releases.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#D9D9E2]/50">Статус верификации:</span>
                <span className="text-emerald-400 uppercase font-bold">
                  {overview.isArtistVerified ? "Верифицирован" : "Не подтверждён"}
                </span>
              </div>
              <div className="pt-2">
                <Link
                  href={`/profile/${overview.username}`}
                  target="_blank"
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Открыть публичный музей</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === "profile" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-lg text-white">Данные профиля CXRNER ID</h3>
          {profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div>Bio:</div>
                <p className="text-white/80 font-sans">{profile.bio || "Не заполнено"}</p>
                <div className="pt-2 text-[#D9D9E2]/60">
                  Страна: <span className="text-white">{profile.country || "—"}</span>, Город:{" "}
                  <span className="text-white">{profile.city || "—"}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div>Роли в музыке:</div>
                <div className="flex flex-wrap gap-1">
                  {profile.music_roles?.map((r: string) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-white/10 text-white">
                      {r}
                    </span>
                  ))}
                </div>
                <div className="pt-2">Жанры:</div>
                <div className="flex flex-wrap gap-1">
                  {profile.genres?.map((g: string) => (
                    <span key={g} className="px-2 py-0.5 rounded bg-[#8737FF]/20 text-[#B46BFF]">
                      #{g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#D9D9E2]/50">Профиль ещё не заполнен пользователем.</div>
          )}
        </div>
      )}

      {/* TAB 3: ARTIST IDENTITY */}
      {activeTab === "artist" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Анкета верификации и площадки артиста
              </h3>
              <p className="text-xs text-[#D9D9E2]/60 mt-0.5">
                Все данные, указанные артистом при подаче заявки на верификацию и в профиле CXRNER ID.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {overview.isArtistVerified ? (
                <button
                  type="button"
                  onClick={() => handleSetVerification("not_verified")}
                  className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition"
                >
                  Отозвать верификацию
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetVerification("verified")}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-extrabold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Подтвердить и верифицировать (+100 CXP)</span>
                </button>
              )}
            </div>
          </div>

          {artistIdentity.verification ? (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[#00F0FF] uppercase font-bold">
                  // Заявка на верификацию ({artistIdentity.verification.status})
                </div>
                {artistIdentity.verification.verification_code && (
                  <div className="px-3 py-1 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] font-bold">
                    Код: {artistIdentity.verification.verification_code}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  Сценическое имя:{" "}
                  <span className="text-white font-bold">
                    {artistIdentity.verification.stage_name}
                  </span>
                </div>
                <div>
                  Способ:{" "}
                  <span className="text-[#B46BFF] uppercase">
                    {artistIdentity.verification.method === "code"
                      ? "Проверочный код"
                      : "Ручная анкета"}
                  </span>
                </div>
                <div>
                  Telegram для связи:{" "}
                  <span className="text-white">
                    {artistIdentity.verification.contact_telegram
                      ? `@${artistIdentity.verification.contact_telegram}`
                      : overview.telegramUsername
                      ? `@${overview.telegramUsername}`
                      : "—"}
                  </span>
                </div>
              </div>

              {artistIdentity.verification.evidence_notes && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-[#D9D9E2]/50 mb-1">Комментарий артиста:</div>
                  <div className="text-white font-sans">
                    {artistIdentity.verification.evidence_notes}
                  </div>
                </div>
              )}

              {artistIdentity.verification.evidence_links?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[#D9D9E2]/50">Прикреплённые ссылки в заявке:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {artistIdentity.verification.evidence_links.map((l: any, idx: number) => (
                      <a
                        key={idx}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-xs text-[#00F0FF] transition"
                      >
                        <span className="truncate">
                          <strong className="text-white mr-1.5">{l.title}:</strong>
                          {l.url}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-mono text-[#D9D9E2]/50">
              Заявка через форму верификации ещё не подавалась. Администратор может верифицировать аккаунт вручную кнопкой выше.
            </div>
          )}

          {artistIdentity.artistProfile ? (
            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  Сценическое имя:{" "}
                  <span className="text-white font-bold">
                    {artistIdentity.artistProfile.stage_name}
                  </span>
                </div>
                <div>
                  Тип проекта:{" "}
                  <span className="text-[#00F0FF]">{artistIdentity.artistProfile.project_type}</span>
                </div>
                <div>
                  Spotify:{" "}
                  <span className="text-white">
                    {artistIdentity.artistProfile.spotify_url || "—"}
                  </span>
                </div>
                <div>
                  Яндекс Музыка:{" "}
                  <span className="text-white">
                    {artistIdentity.artistProfile.yandex_music_url || "—"}
                  </span>
                </div>
                <div>
                  Apple Music:{" "}
                  <span className="text-white">
                    {artistIdentity.artistProfile.apple_music_url || "—"}
                  </span>
                </div>
                <div>
                  VK Музыка:{" "}
                  <span className="text-white">
                    {artistIdentity.artistProfile.vk_music_url || "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#D9D9E2]/50">
              Отдельный артистический профиль ещё не создан.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DROP INVENTORY */}
      {activeTab === "inventory" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-lg text-white">
            Инвентарь предметов ({dropInventory.total})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dropInventory.items.map((item: any) => (
              <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-[#8737FF]/20 text-[#B46BFF] uppercase font-bold text-[10px]">
                    {item.rarity}
                  </span>
                  <span className="text-[#D9D9E2]/50">#{String(item.serial_number).padStart(4, "0")}</span>
                </div>
                <div className="font-display font-bold text-sm text-white">{item.item_name}</div>
                <div className="text-[10px] text-[#00F0FF]">{item.collection_name}</div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[10px] text-[#D9D9E2]/50">
                  {item.is_pinned && <span className="text-[#B46BFF]">📌 Закреплён</span>}
                  {item.is_hidden && <span className="text-amber-400">👁 Скрыт</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: WALLET */}
      {activeTab === "wallet" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-white">Журнал транзакций CXP</h3>
            <button
              type="button"
              onClick={() => setShowCxpModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#8737FF] text-white font-mono text-xs font-bold"
            >
              Скорректировать баланс
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#D9D9E2]/50 uppercase bg-white/[0.02]">
                  <th className="py-2.5 px-3">Дата</th>
                  <th className="py-2.5 px-3">Сумма</th>
                  <th className="py-2.5 px-3">Причина</th>
                  <th className="py-2.5 px-3">Событие</th>
                  <th className="py-2.5 px-3">Примечание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {wallet.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#D9D9E2]/40">
                      История операций пуста
                    </td>
                  </tr>
                ) : (
                  wallet.transactions?.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 px-3 text-[#D9D9E2]/60">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} CXP
                      </td>
                      <td className="py-2.5 px-3 text-white">{tx.reason}</td>
                      <td className="py-2.5 px-3 text-[#00F0FF]">{tx.source_event_type}</td>
                      <td className="py-2.5 px-3 text-[#D9D9E2]/50">{tx.admin_notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REFERRALS */}
      {activeTab === "referrals" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-lg text-white">Реферальная активность</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[#D9D9E2]/50 block">Реферальный код:</span>
              <span className="text-white font-bold text-sm">{referrals.myCode}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[#D9D9E2]/50 block">Всего приглашено:</span>
              <span className="text-white font-bold text-sm">{referrals.totalInvited}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[#D9D9E2]/50 block">Заработано с рефералов:</span>
              <span className="text-[#B46BFF] font-bold text-sm">+{referrals.totalEarnedCxp} CXP</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: RELEASES */}
      {activeTab === "releases" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-lg text-white">
            Заявки на дистрибуцию ({releases.length})
          </h3>
          <div className="space-y-2">
            {releases.map((rel: any) => (
              <div key={rel.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="font-bold text-white">{rel.artist_name} — {rel.track_name}</span>
                  <div className="text-[10px] text-[#D9D9E2]/50">UPC: {rel.upc || "Не присвоен"}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white uppercase text-[10px]">
                  {rel.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: ACTIVITY LOG */}
      {activeTab === "activity" && (
        <div className="p-6 rounded-3xl bg-[#090611] border border-white/10 space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-lg text-white">Журнал событий и уведомлений</h3>
          <div className="space-y-2">
            {activity.map((act: any) => (
              <div key={act.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="font-bold text-white">{act.title}</div>
                  <div className="text-[11px] text-[#D9D9E2]/70 font-sans">{act.message}</div>
                </div>
                <span className="text-[#D9D9E2]/40 text-[10px]">
                  {new Date(act.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CXP Adjustment Modal */}
      {showCxpModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <form onSubmit={handleAdjustCxp} className="relative w-full max-w-md bg-[#090611] border border-white/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h3 className="font-display font-bold text-lg text-white">
              Корректировка баланса CXP
            </h3>
            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase mb-1">
                Сумма (положительная для начисления, отрицательная для списания)
              </label>
              <input
                type="number"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase mb-1">
                Основание / Причина корректировки (Обязательно для аудита) *
              </label>
              <textarea
                required
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Например: Победитель специального конкурса миксов..."
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCxpModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-mono text-xs"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={adjustLoading}
                className="btn-energy px-5 py-2 rounded-full font-mono text-xs uppercase font-bold"
              >
                {adjustLoading ? "Сохранение..." : "Подтвердить операцию"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
