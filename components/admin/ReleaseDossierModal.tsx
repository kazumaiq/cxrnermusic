"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Disc3,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Barcode,
  Trash2,
  RotateCcw,
  User,
  Music,
  FolderOpen,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  FlaskConical,
} from "lucide-react";
import { getStatusMeta } from "@/lib/telegramSync";
import { isTestRelease } from "@/lib/testReleases";

export interface DossierRelease {
  id: string;
  telegram_id: string | null;
  username: string | null;
  artist_name: string | null;
  track_name: string | null;
  genre: string | null;
  release_type: string | null;
  submission_key: string | null;
  status: string | null;
  upc: string | null;
  reject_reason: string | null;
  moderator_comment?: string | null;
  moderation_message_id: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
  user_deleted?: boolean;
  action_history?: Array<{
    timestamp: string;
    moderator: string;
    action: string;
    prev_status?: string;
    new_status?: string;
    comment?: string | null;
    upc?: string | null;
  }>;
  form_payload?: any;
}

interface ReleaseDossierModalProps {
  release: DossierRelease | null;
  onClose: () => void;
  onAction: (actionData: {
    id: string;
    status?: string;
    upc?: string;
    reject_reason?: string;
    moderator_comment?: string;
    action: string;
    restore?: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

export default function ReleaseDossierModal({
  release,
  onClose,
  onAction,
  loading = false,
}: ReleaseDossierModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Collapsible accordion group states
  const [expandedGroups, setExpandedGroups] = useState({
    main: true,
    artists: true,
    materials: true,
    platforms: true,
    additional: true,
    moderation: true,
    history: true,
  });

  // Action input states
  const [activePrompt, setActivePrompt] = useState<"upc" | "reject" | "needfix" | null>(null);
  const [upcInput, setUpcInput] = useState("");
  const [rejectInput, setRejectInput] = useState("");
  const [fixCommentInput, setFixCommentInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (!release) return null;

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const p = release.form_payload || {};
  const statusMeta = getStatusMeta(release.status || "pending");

  const title = release.track_name || p.name || p.title || "Без названия";
  const artist = release.artist_name || p.nick || p.artist || "Артист не указан";
  const subtitle = p.subname || p.subtitle || "—";
  const fio = p.fio || p.artist_full_name || artist;
  const releaseDate = p.date || p.release_date || "—";
  const version = p.version || "Оригинал";
  const genre = release.genre || p.genre || "Electronic";
  const releaseType = release.release_type || p.type || "Сингл";
  const driveLink = p.link || p.files_link || "";
  const yandexValue = p.yandex || p.yandex_card_link || "";
  const isCreateNewYandexCard =
    yandexValue === "create_new_card" ||
    yandexValue === "new" ||
    yandexValue === "." ||
    !yandexValue;
  const hasMat =
    p.has_explicit === true ||
    p.mat === "Да" ||
    p.mat === "да" ||
    p.mat === true;
  const promoText = p.promo || p.promo_text || "—";
  const comment = p.comment || "—";
  const rawTg = p.tg || p.contact_telegram || release.username || "";
  const cleanTg = String(rawTg).replace(/^@/, "").trim();

  const handleActionClick = async (
    actionName: string,
    targetStatus?: string,
    extraData?: any
  ) => {
    setActionError(null);
    try {
      await onAction({
        id: release.id,
        status: targetStatus,
        action: actionName,
        ...extraData,
      });
      setActivePrompt(null);
    } catch (err: any) {
      setActionError(err.message || "Ошибка выполнения действия");
    }
  };

  const submitUpc = async () => {
    const clean = upcInput.trim();
    if (!clean) {
      setActionError("Введите код UPC/EAN");
      return;
    }
    if (clean.length < 4 || clean.length > 40) {
      setActionError("UPC должен содержать от 4 до 40 символов");
      return;
    }
    await handleActionClick("assign_upc", release.status || undefined, { upc: clean });
  };

  const submitReject = async () => {
    const reason = rejectInput.trim() || "Отклонено модератором лейбла CXRNER MUSIC";
    await handleActionClick("reject", "rejected", { reject_reason: reason });
  };

  const submitNeedFix = async () => {
    const note = fixCommentInput.trim() || "Требуются исправления в материалах перед публикацией";
    await handleActionClick("needfix", "needfix", { moderator_comment: note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto font-sans selection:bg-[#8737FF] selection:text-white">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/[0.12] bg-[#0c0916] text-white shadow-[0_0_80px_rgba(135,55,255,0.22)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* =========================================================================
            MODAL HEADER: Elegant, balanced, clear typography
            ========================================================================= */}
        <div className="p-4 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8737FF]/30 to-[#B46BFF]/10 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF] flex-shrink-0 shadow-[0_0_20px_rgba(135,55,255,0.25)]">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-md">
                  {title}
                </h2>
                <span
                  className="px-3 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                  style={{
                    backgroundColor: "rgba(135,55,255,0.18)",
                    borderColor: "rgba(180,107,255,0.35)",
                    color: "#F4F2FA",
                  }}
                >
                  <span>{statusMeta.emoji}</span>
                  <span>{statusMeta.label}</span>
                </span>
                {isTestRelease(release) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 shadow-sm">
                    <span>🧪</span>
                    <span>Тестовая</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#D9D9E2]/75 truncate mt-0.5 font-normal">
                <span className="font-medium text-white">{artist}</span>
                <span className="mx-2 text-white/20">•</span>
                <span className="text-[#9B95AD]">ID:</span>{" "}
                <code className="font-mono text-xs text-white/90 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                  {release.id.slice(0, 8)}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(release.id, "id_header")}
              title="Скопировать полный ID заявки"
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-xs text-[#D9D9E2] font-medium flex items-center gap-1.5 transition active:scale-95"
            >
              {copiedField === "id_header" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="text-[#00F0FF]">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-70" />
                  <span className="hidden sm:inline">Скопировать ID</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              aria-label="Закрыть карточку"
              className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 flex items-center justify-center text-[#D9D9E2] hover:text-white transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            MODAL BODY: Soft contrast, comfortable reading, clean spacing
            ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-sm text-[#D9D9E2]">
          {actionError && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {isTestRelease(release) && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
              <FlaskConical className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <span className="font-bold text-amber-300">Тестовая анкета:</span>{" "}
                <span className="text-white/80">
                  Эта заявка определена как проверочная (короткие тестовые имена, заглушки или тестовый ID).
                </span>
              </div>
            </div>
          )}

          {/* Group 1: Основная информация */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden shadow-sm">
            <button
              onClick={() => toggleGroup("main")}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#8737FF]/20 border border-[#8737FF]/30 flex items-center justify-center text-[#B46BFF]">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span>1. Основная информация о релизе</span>
              </div>
              {expandedGroups.main ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedGroups.main && (
              <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Название трека:</span>
                  <p className="text-white font-semibold text-sm sm:text-base">{title}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Саб-название:</span>
                  <p className="text-white/85 font-medium">{subtitle}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Тип релиза:</span>
                  <p className="text-white font-semibold capitalize">{releaseType}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Версия:</span>
                  <p className="text-white/85 font-medium">{version}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Жанр:</span>
                  <p className="text-white font-semibold">{genre}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Дата премьеры:</span>
                  <p className="text-[#00F0FF] font-semibold">{releaseDate}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Дата подачи заявки:</span>
                  <p className="text-white/70">
                    {new Date(release.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Штрихкод UPC / EAN:</span>
                  {release.upc || p.upc ? (
                    <span className="font-mono text-xs font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-0.5 rounded-lg inline-block">
                      {release.upc || p.upc}
                    </span>
                  ) : (
                    <span className="text-white/35 italic text-xs">Не присвоен</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Group 2: Артисты и авторы */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden shadow-sm">
            <button
              onClick={() => toggleGroup("artists")}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>2. Артисты и авторы</span>
              </div>
              {expandedGroups.artists ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedGroups.artists && (
              <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">Никнейм артиста:</span>
                  <p className="text-white font-semibold text-sm sm:text-base">{artist}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#9B95AD] text-xs font-medium block">ФИО всех участников (правообладатели):</span>
                  <p className="text-white/90 font-medium">{fio}</p>
                </div>
                {p.performers && (
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[#9B95AD] text-xs font-medium block">Исполнители и фиты:</span>
                    <p className="text-white/80">{p.performers}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 3: Материалы (Google Drive link) */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden shadow-sm">
            <button
              onClick={() => toggleGroup("materials")}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#FF2E93]/20 border border-[#FF2E93]/30 flex items-center justify-center text-[#FF2E93]">
                  <FolderOpen className="w-3.5 h-3.5" />
                </div>
                <span>3. Исходные аудио и обложка</span>
              </div>
              {expandedGroups.materials ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedGroups.materials && (
              <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] space-y-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <span className="text-[#9B95AD] text-xs font-medium block">
                    Ссылка на папку с аудио и обложкой (Google Drive / Яндекс Диск):
                  </span>
                  {driveLink ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8737FF] to-[#B46BFF] text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(135,55,255,0.35)] hover:opacity-95 transition active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Открыть папку с треком и обложкой</span>
                      </a>
                      <button
                        onClick={() => copyToClipboard(driveLink, "drive_link")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-white/90 text-xs font-medium transition active:scale-95"
                      >
                        {copiedField === "drive_link" ? (
                          <Check className="w-3.5 h-3.5 text-[#00F0FF]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-70" />
                        )}
                        <span>{copiedField === "drive_link" ? "Скопировано" : "Скопировать ссылку"}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-white/35 italic">Ссылка на диск не была указана</p>
                  )}
                </div>

                {p.cover_url && (
                  <div className="pt-2">
                    <span className="text-[#9B95AD] text-xs font-medium block mb-2">Превью обложки:</span>
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-md">
                      <img src={p.cover_url} alt="Artwork" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 4: Музыкальные площадки */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden shadow-sm">
            <button
              onClick={() => toggleGroup("platforms")}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#FFCC00]/20 border border-[#FFCC00]/30 flex items-center justify-center text-[#FFCC00]">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <span>4. Стриминговые площадки (Яндекс Музыка, DSP)</span>
              </div>
              {expandedGroups.platforms ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedGroups.platforms && (
              <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] space-y-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-[#9B95AD] text-xs font-medium block mb-1.5">Яндекс Музыка:</span>
                  {isCreateNewYandexCard ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium text-xs sm:text-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Создать новую карточку артиста</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={yandexValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] hover:bg-[#FFCC00]/20 font-medium text-xs sm:text-sm transition truncate max-w-full"
                      >
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{yandexValue}</span>
                      </a>
                      {yandexValue.includes("/artist/") && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                          Существующая карточка артиста
                        </span>
                      )}
                      {yandexValue.includes("/album/") && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                          Альбом / Сингл
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {p.spotify && (
                  <div>
                    <span className="text-[#9B95AD] text-xs font-medium block mb-1">Spotify:</span>
                    <a
                      href={p.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] hover:bg-[#1DB954]/20 font-medium text-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate">{p.spotify}</span>
                    </a>
                  </div>
                )}

                {p.apple && (
                  <div>
                    <span className="text-[#9B95AD] text-xs font-medium block mb-1">Apple Music:</span>
                    <a
                      href={p.apple}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FA243C]/10 border border-[#FA243C]/30 text-[#FA243C] hover:bg-[#FA243C]/20 font-medium text-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate">{p.apple}</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 5: Дополнительно (мат, промо, контакты) */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden shadow-sm">
            <button
              onClick={() => toggleGroup("additional")}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>5. Дополнительно (мат, промо, контакты)</span>
              </div>
              {expandedGroups.additional ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedGroups.additional && (
              <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[#9B95AD] text-xs font-medium block">
                      Наличие ненормативной лексики:
                    </span>
                    {hasMat ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Да (Explicit / Ненормативная лексика)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Нет (Clean / Без мата)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[#9B95AD] text-xs font-medium block">
                      Telegram артиста для связи:
                    </span>
                    {cleanTg ? (
                      <a
                        href={`https://t.me/${cleanTg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-xs transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>@{cleanTg}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-white/35 italic">Не указан</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[#9B95AD] text-xs font-medium block">Промо-текст / питчинг:</span>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-[#D9D9E2] leading-relaxed">
                    {promoText && promoText !== "—" && promoText !== "." ? (
                      promoText
                    ) : (
                      <span className="text-white/30 italic">Промо-текст не прикреплен к заявке</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[#9B95AD] text-xs font-medium block">Комментарий к заявке:</span>
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-[#D9D9E2] leading-relaxed">
                    {comment && comment !== "—" && comment !== "." ? (
                      comment
                    ) : (
                      <span className="text-white/30 italic">Комментарий отсутствует</span>
                    )}
                  </div>
                </div>

                {release.reject_reason && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-1">
                    <span className="text-red-400 font-bold text-xs uppercase tracking-wider block">
                      Причина отклонения:
                    </span>
                    <p className="text-red-200 text-sm leading-relaxed">{release.reject_reason}</p>
                  </div>
                )}

                {release.moderator_comment && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block">
                      Требуемые исправления:
                    </span>
                    <p className="text-amber-200 text-sm leading-relaxed">{release.moderator_comment}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 6: Действия модератора (7 Parity Controls) */}
          <div className="rounded-3xl border border-[#8737FF]/40 bg-gradient-to-b from-[#130a27] to-[#090611] p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B46BFF]" />
                <h3 className="text-sm sm:text-base font-bold text-white tracking-normal">
                  6. Управление статусом (Паритет с Telegram-ботом)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25">
                Автосинхронизация с ботом и кабинетом
              </span>
            </div>

            {/* Prompt Panels */}
            {activePrompt === "upc" && (
              <div className="p-4 rounded-2xl bg-black/70 border border-[#10B981]/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                    <Barcode className="w-4 h-4" />
                    <span>Присвоить штрихкод UPC / EAN</span>
                  </span>
                  <button onClick={() => setActivePrompt(null)} className="text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Введите 12-13 значный UPC/EAN"
                    value={upcInput}
                    onChange={(e) => setUpcInput(e.target.value)}
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-white/30 focus:border-[#10B981] outline-none"
                  />
                  <button
                    onClick={submitUpc}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black font-semibold text-xs transition active:scale-95"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}

            {activePrompt === "reject" && (
              <div className="p-4 rounded-2xl bg-black/70 border border-red-500/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Укажите причину отказа</span>
                  </span>
                  <button onClick={() => setActivePrompt(null)} className="text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Опишите причину отклонения (будет отправлено в Telegram и личный кабинет артиста)"
                  value={rejectInput}
                  onChange={(e) => setRejectInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:border-red-500 outline-none"
                />
                <button
                  onClick={submitReject}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition active:scale-95"
                >
                  Подтвердить отклонение
                </button>
              </div>
            )}

            {activePrompt === "needfix" && (
              <div className="p-4 rounded-2xl bg-black/70 border border-amber-500/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Комментарий модератора для артиста</span>
                  </span>
                  <button onClick={() => setActivePrompt(null)} className="text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Что именно нужно исправить? (например: заменить обложку на 3000x3000px, приложить WAV 24-bit)"
                  value={fixCommentInput}
                  onChange={(e) => setFixCommentInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
                />
                <button
                  onClick={submitNeedFix}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition active:scale-95"
                >
                  Отправить на исправления
                </button>
              </div>
            )}

            {/* 7 Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs font-semibold">
              {/* 1. На отгрузку */}
              <button
                onClick={() => handleActionClick("upload", "on_upload")}
                disabled={loading}
                className="p-3.5 rounded-2xl border border-sky-500/35 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <Clock className="w-4 h-4 text-sky-400" />
                <span>На отгрузку</span>
              </button>

              {/* 2. На модерацию */}
              <button
                onClick={() => handleActionClick("moderate", "moderation")}
                disabled={loading}
                className="p-3.5 rounded-2xl border border-purple-500/35 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Модерация</span>
              </button>

              {/* 3. Принять */}
              <button
                onClick={() => handleActionClick("approve", "approved")}
                disabled={loading}
                className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Одобрить</span>
              </button>

              {/* 4. Присвоить UPC */}
              <button
                onClick={() => {
                  setUpcInput(release.upc || "");
                  setActivePrompt("upc");
                }}
                className="p-3.5 rounded-2xl border border-emerald-400/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <Barcode className="w-4 h-4 text-emerald-400" />
                <span>{release.upc ? "Сменить UPC" : "Присвоить UPC"}</span>
              </button>

              {/* 5. На исправления */}
              <button
                onClick={() => {
                  setFixCommentInput(release.moderator_comment || "");
                  setActivePrompt("needfix");
                }}
                className="p-3.5 rounded-2xl border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>На исправления</span>
              </button>

              {/* 6. Отклонить */}
              <button
                onClick={() => {
                  setRejectInput(release.reject_reason || "");
                  setActivePrompt("reject");
                }}
                className="p-3.5 rounded-2xl border border-red-500/35 bg-red-500/15 hover:bg-red-500/25 text-red-200 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Отклонить</span>
              </button>

              {/* 7. Удалить / Восстановить */}
              {release.user_deleted || release.status === "deleted" ? (
                <button
                  onClick={() => handleActionClick("restore", "on_upload", { restore: true })}
                  disabled={loading}
                  className="sm:col-span-2 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-200 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>Восстановить из архива</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm("Переместить заявку в архив?")) {
                      handleActionClick("delete", "deleted");
                    }
                  }}
                  disabled={loading}
                  className="sm:col-span-2 p-3.5 rounded-2xl border border-red-500/25 bg-red-950/40 hover:bg-red-900/50 text-red-300 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>В архив (Soft Delete)</span>
                </button>
              )}
            </div>
          </div>

          {/* Group 7: История действий модераторов */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden shadow-sm">
            <button
              onClick={() => toggleGroup("history")}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>
                  7. Журнал действий модерации ({release.action_history?.length || 1})
                </span>
              </div>
              {expandedGroups.history ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {expandedGroups.history && (
              <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] space-y-2.5 text-xs sm:text-sm">
                {release.action_history && release.action_history.length > 0 ? (
                  release.action_history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                    >
                      <div>
                        <span className="text-[#00F0FF] font-semibold">@{h.moderator}</span>:{" "}
                        <span className="text-white font-medium">
                          {h.action} {h.prev_status && h.new_status ? `(${h.prev_status} → ${h.new_status})` : ""}
                        </span>
                        {h.comment && <p className="text-white/70 text-xs pt-1">"{h.comment}"</p>}
                        {h.upc && (
                          <p className="text-[#10B981] font-mono text-xs pt-1">Присвоен UPC: {h.upc}</p>
                        )}
                      </div>
                      <span className="text-[#9B95AD] text-xs flex-shrink-0">
                        {new Date(h.timestamp).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[#9B95AD] text-xs">
                    Заявка создана{" "}
                    {new Date(release.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    (Источник: {release.source || "web"})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
