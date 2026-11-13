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
  ShieldAlert,
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
} from "lucide-react";
import { CANONICAL_STATUS_MAP, getStatusMeta } from "@/lib/telegramSync";

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

  const title = release.track_name || p.name || p.title || "—";
  const artist = release.artist_name || p.nick || p.artist || "—";
  const subtitle = p.subname || p.subtitle || "—";
  const fio = p.fio || p.artist_full_name || artist;
  const releaseDate = p.date || p.release_date || "—";
  const version = p.version || "Оригинал";
  const genre = release.genre || p.genre || "Electronic";
  const releaseType = release.release_type || p.type || "Сингл";
  const driveLink = p.link || p.files_link || "";
  const yandexLink = p.yandex || p.yandex_card_link || "";
  const hasMat = p.has_explicit || p.mat;
  const promoText = p.promo || p.promo_text || "—";
  const comment = p.comment || "—";
  const tgContact = p.tg || p.contact_telegram || release.username || "";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-[#090611] text-white shadow-[0_0_80px_rgba(135,55,255,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF] flex-shrink-0">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heavy text-lg sm:text-xl text-white truncate">
                  {title}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border flex items-center gap-1 flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(135,55,255,0.15)",
                    borderColor: "rgba(180,107,255,0.4)",
                    color: "#D9D9E2",
                  }}
                >
                  <span>{statusMeta.emoji}</span>
                  <span>{statusMeta.label}</span>
                </span>
              </div>
              <p className="font-mono text-xs text-[#D9D9E2]/70 truncate">
                {artist} • ID: <code className="text-white/90">{release.id.slice(0, 8)}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(release.id, "id_header")}
              title="Скопировать ID релиза"
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 font-mono text-[11px] text-[#D9D9E2] flex items-center gap-1.5 transition"
            >
              {copiedField === "id_header" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>ID скопирован</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Скопировать ID</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 flex items-center justify-center text-[#D9D9E2] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 font-sans text-xs sm:text-sm">
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Group 1: Основная информация */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <button
              onClick={() => toggleGroup("main")}
              className="w-full p-4 flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B46BFF]" />
                <span className="font-bold">1. Основная информация о релизе</span>
              </div>
              {expandedGroups.main ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {expandedGroups.main && (
              <div className="p-4 pt-0 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Название трека:</span>
                  <span className="text-white font-medium">{title}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Саб-название:</span>
                  <span className="text-white/80">{subtitle}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Тип релиза:</span>
                  <span className="text-white font-medium">{releaseType}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Версия:</span>
                  <span className="text-white/80">{version}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Жанр:</span>
                  <span className="text-white font-medium">{genre}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Дата выхода:</span>
                  <span className="text-[#00F0FF] font-medium">{releaseDate}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Дата подачи заявки:</span>
                  <span className="text-white/60">
                    {new Date(release.created_at).toLocaleString("ru-RU")}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">UPC / EAN:</span>
                  <span className="text-[#10B981] font-bold">
                    {release.upc || p.upc || "Не присвоен"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Group 2: Артисты */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <button
              onClick={() => toggleGroup("artists")}
              className="w-full p-4 flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#00F0FF]" />
                <span className="font-bold">2. Артисты и авторы</span>
              </div>
              {expandedGroups.artists ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {expandedGroups.artists && (
              <div className="p-4 pt-0 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Никнейм(ы) артиста:</span>
                  <span className="text-white font-medium">{artist}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">ФИО всех участников:</span>
                  <span className="text-white/90">{fio}</span>
                </div>
                {p.performers && (
                  <div className="sm:col-span-2">
                    <span className="text-white/40 block text-[10px] uppercase">Исполнители / фиты:</span>
                    <span className="text-white/80">{p.performers}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 3: Материалы (Google Drive link) */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <button
              onClick={() => toggleGroup("materials")}
              className="w-full p-4 flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#FF2E93]" />
                <span className="font-bold">3. Исходные материалы релиза</span>
              </div>
              {expandedGroups.materials ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {expandedGroups.materials && (
              <div className="p-4 pt-0 border-t border-white/5 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase mb-1">
                    Ссылка на папку с треком и обложкой (Google Drive / Облако):
                  </span>
                  {driveLink ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8737FF]/25 border border-[#B46BFF]/50 text-white font-bold hover:bg-[#8737FF]/40 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Открыть Google Drive / Диск</span>
                      </a>
                      <button
                        onClick={() => copyToClipboard(driveLink, "drive_link")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-[#D9D9E2] transition"
                      >
                        {copiedField === "drive_link" ? <Check className="w-3.5 h-3.5 text-[#00F0FF]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "drive_link" ? "Скопировано" : "Копировать ссылку"}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-white/40">Ссылка не указана</p>
                  )}
                </div>

                {p.cover_url && (
                  <div className="pt-2">
                    <span className="text-white/40 block text-[10px] uppercase mb-1.5">Превью обложки:</span>
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border border-white/15 bg-black/50">
                      <img src={p.cover_url} alt="Artwork" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 4: Музыкальные площадки */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <button
              onClick={() => toggleGroup("platforms")}
              className="w-full p-4 flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#FFCC00]" />
                <span className="font-bold">4. Музыкальные площадки (Яндекс Музыка и DSP)</span>
              </div>
              {expandedGroups.platforms ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {expandedGroups.platforms && (
              <div className="p-4 pt-0 border-t border-white/5 space-y-2.5 font-mono text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Яндекс Музыка:</span>
                  {yandexLink ? (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={yandexLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FFCC00] hover:underline flex items-center gap-1.5 truncate max-w-lg"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{yandexLink}</span>
                      </a>
                      {yandexLink.includes("/artist/") && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30 flex-shrink-0">
                          Карточка артиста
                        </span>
                      )}
                      {yandexLink.includes("/album/") && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 flex-shrink-0">
                          Прямой релиз
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/50">Создать новую карточку</span>
                  )}
                </div>

                {p.spotify && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Spotify:</span>
                    <a href={p.spotify} target="_blank" rel="noopener noreferrer" className="text-[#1DB954] hover:underline flex items-center gap-1 pt-0.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{p.spotify}</span>
                    </a>
                  </div>
                )}

                {p.apple && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Apple Music:</span>
                    <a href={p.apple} target="_blank" rel="noopener noreferrer" className="text-[#FA243C] hover:underline flex items-center gap-1 pt-0.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{p.apple}</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 5: Дополнительные сведения */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <button
              onClick={() => toggleGroup("additional")}
              className="w-full p-4 flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#A5B4FC]" />
                <span className="font-bold">5. Дополнительно (мат, промо, контакты)</span>
              </div>
              {expandedGroups.additional ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {expandedGroups.additional && (
              <div className="p-4 pt-0 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Наличие ненормативной лексики:</span>
                  <span className={hasMat ? "text-amber-400 font-bold" : "text-white/80"}>
                    {hasMat ? "⚠️ Да (Explicit)" : "Нет (Clean)"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Telegram артиста для связи:</span>
                  {tgContact ? (
                    <a
                      href={`https://t.me/${tgContact.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00F0FF] hover:underline flex items-center gap-1"
                    >
                      <span>@{tgContact.replace(/^@/, "")}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-white/40 block text-[10px] uppercase">Промо-текст / питчинг:</span>
                  <p className="text-white/80 font-sans leading-relaxed pt-0.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    {promoText}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-white/40 block text-[10px] uppercase">Комментарий к заявке:</span>
                  <p className="text-white/80 font-sans leading-relaxed pt-0.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    {comment}
                  </p>
                </div>
                {release.reject_reason && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <span className="text-red-400 block text-[10px] uppercase font-bold">Причина отказа:</span>
                    <p className="text-red-200 pt-0.5">{release.reject_reason}</p>
                  </div>
                )}
                {release.moderator_comment && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-amber-400 block text-[10px] uppercase font-bold">Требуемые исправления:</span>
                    <p className="text-amber-200 pt-0.5">{release.moderator_comment}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group 6: Действия модератора (7 Parity Controls) */}
          <div className="rounded-2xl border border-[#8737FF]/35 bg-[#0f0920]/75 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-white font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B46BFF]" />
                <span>6. Управление релизом (Паритет с Telegram)</span>
              </span>
              <span className="font-mono text-[10px] text-[#00F0FF] uppercase tracking-wider">
                Синхронизация TG + Кабинет
              </span>
            </div>

            {/* Prompt Panels */}
            {activePrompt === "upc" && (
              <div className="p-4 rounded-2xl bg-black/60 border border-[#10B981]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-[#10B981] font-bold flex items-center gap-1.5">
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
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-white/30 focus:border-[#10B981] outline-none"
                  />
                  <button
                    onClick={submitUpc}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black font-mono text-xs font-bold uppercase transition"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}

            {activePrompt === "reject" && (
              <div className="p-4 rounded-2xl bg-black/60 border border-red-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-red-400 font-bold flex items-center gap-1.5">
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
                  className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:border-red-500 outline-none font-sans"
                />
                <button
                  onClick={submitReject}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase transition"
                >
                  Подтвердить отклонение
                </button>
              </div>
            )}

            {activePrompt === "needfix" && (
              <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-amber-400 font-bold flex items-center gap-1.5">
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
                  className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none font-sans"
                />
                <button
                  onClick={submitNeedFix}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase transition"
                >
                  Отправить на исправления
                </button>
              </div>
            )}

            {/* 7 Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              {/* 1. На отгрузку */}
              <button
                onClick={() => handleActionClick("upload", "on_upload")}
                disabled={loading}
                className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/25 text-sky-200 font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>🕓</span>
                <span>На отгрузку</span>
              </button>

              {/* 2. На модерацию */}
              <button
                onClick={() => handleActionClick("moderate", "moderation")}
                disabled={loading}
                className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/25 text-purple-200 font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>🧠</span>
                <span>Модерация</span>
              </button>

              {/* 3. Принять */}
              <button
                onClick={() => handleActionClick("approve", "approved")}
                disabled={loading}
                className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 font-bold transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Принять</span>
              </button>

              {/* 4. Присвоить UPC */}
              <button
                onClick={() => {
                  setUpcInput(release.upc || "");
                  setActivePrompt("upc");
                }}
                className="p-3 rounded-xl border border-emerald-400/30 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 font-bold transition flex items-center justify-center gap-1.5"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>{release.upc ? "Сменить UPC" : "Присвоить UPC"}</span>
              </button>

              {/* 5. На исправления */}
              <button
                onClick={() => {
                  setFixCommentInput(release.moderator_comment || "");
                  setActivePrompt("needfix");
                }}
                className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/25 text-amber-200 font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>✏️</span>
                <span>На исправления</span>
              </button>

              {/* 6. Отклонить */}
              <button
                onClick={() => {
                  setRejectInput(release.reject_reason || "");
                  setActivePrompt("reject");
                }}
                className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 text-red-200 font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>❌</span>
                <span>Отклонить</span>
              </button>

              {/* 7. Удалить / Восстановить */}
              {release.user_deleted || release.status === "deleted" ? (
                <button
                  onClick={() => handleActionClick("restore", "on_upload", { restore: true })}
                  disabled={loading}
                  className="sm:col-span-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-200 font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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
                  className="sm:col-span-2 p-3 rounded-xl border border-red-500/20 bg-red-950/30 hover:bg-red-900/40 text-red-300 font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>В архив (Soft Delete)</span>
                </button>
              )}
            </div>
          </div>

          {/* Group 7: История действий модераторов */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <button
              onClick={() => toggleGroup("history")}
              className="w-full p-4 flex items-center justify-between text-left font-mono text-xs uppercase tracking-wider text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A5B4FC]" />
                <span className="font-bold">
                  7. Журнал действий модерации ({release.action_history?.length || 1})
                </span>
              </div>
              {expandedGroups.history ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {expandedGroups.history && (
              <div className="p-4 pt-0 border-t border-white/5 space-y-2.5 font-mono text-xs">
                {release.action_history && release.action_history.length > 0 ? (
                  release.action_history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                    >
                      <div>
                        <span className="text-[#00F0FF] font-bold">@{h.moderator}</span>:{" "}
                        <span className="text-white">
                          {h.action} {h.prev_status && h.new_status ? `(${h.prev_status} → ${h.new_status})` : ""}
                        </span>
                        {h.comment && <p className="text-white/60 font-sans text-xs pt-0.5">"{h.comment}"</p>}
                        {h.upc && <p className="text-[#10B981] font-mono pt-0.5">Присвоен UPC: {h.upc}</p>}
                      </div>
                      <span className="text-white/35 flex-shrink-0 text-[10px]">
                        {new Date(h.timestamp).toLocaleString("ru-RU")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-white/40 text-[11px]">
                    Заявка создана {new Date(release.created_at).toLocaleString("ru-RU")} (Источник: {release.source || "web"})
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
