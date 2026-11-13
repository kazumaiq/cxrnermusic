// CXRNER MUSIC — Unified Telegram Moderation Sync Engine
// Handles two-way synchronized message formatting and editing in the «АНКЕТЫ» Telegram group.

const DEFAULT_MODERATION_CHAT = process.env.MODERATION_CHAT_ID || "-1002117586464";

export interface SyncMessageOptions {
  formId: string;
  telegramId?: string | null;
  messageId?: string | number | null;
  chatId?: string | number | null;
  status: string;
  upc?: string | null;
  rejectReason?: string | null;
  moderatorComment?: string | null;
  moderatorName?: string | null;
  artistName?: string | null;
  trackName?: string | null;
  genre?: string | null;
  releaseType?: string | null;
  payload?: any;
}

export const CANONICAL_STATUS_MAP: Record<string, { label: string; emoji: string }> = {
  on_upload: { label: "На отгрузке", emoji: "🕓" },
  pending: { label: "На отгрузке", emoji: "🕓" },
  moderation: { label: "На модерации", emoji: "🧠" },
  on_moderation: { label: "На модерации", emoji: "🧠" },
  approved: { label: "Принято", emoji: "✅" },
  needfix: { label: "На исправлении", emoji: "✏️" },
  fix_required: { label: "На исправлении", emoji: "✏️" },
  rejected: { label: "Отклонено", emoji: "❌" },
  deleted: { label: "Удалено", emoji: "🗑" },
  user_deleted: { label: "Удалено", emoji: "🗑" },
};

export function getStatusMeta(status: string) {
  const s = (status || "pending").toLowerCase();
  return CANONICAL_STATUS_MAP[s] || { label: status, emoji: "•" };
}

function esc(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildTelegramCardText(opts: SyncMessageOptions): string {
  const p = opts.payload || {};
  const meta = getStatusMeta(opts.status);

  const statusHeader = `${meta.emoji} <b>СТАТУС: ${esc(meta.label.toUpperCase())}</b>`;

  const artist = opts.artistName || p.nick || p.artist || "—";
  const title = opts.trackName || p.name || p.title || "—";
  const subtitle = p.subname || p.subtitle || ".";
  const fio = p.fio || p.artist_full_name || artist;
  const relDate = p.date || p.release_date || "—";
  const version = p.version || "Оригинал";
  const genre = opts.genre || p.genre || "Electronic";
  const link = p.link || p.files_link || "—";
  const yandex =
    p.yandex === "create_new_card"
      ? "Создать новую карточку"
      : p.yandex || p.yandex_card_link || ".";
  const hasMat = p.has_explicit || p.mat ? "Да" : "Нет";
  const promo = p.promo || p.promo_text || ".";
  const comment = p.comment || ".";
  const tg = p.tg || p.contact_telegram || p.username || "—";

  const lines = [
    statusHeader,
    "",
    "🎵 <b>АНКЕТА РЕЛИЗА!</b>",
    `Источник: 🌐 САЙТ`,
    `От: ${esc(tg)}`,
    `ID: <code>${esc(opts.formId)}</code>`,
    `Тип: ${esc(opts.releaseType || p.type || "Сингл")}`,
    "",
    `🎵 <b>Название:</b> ${esc(title)}`,
    `✨ <b>Саб-название:</b> ${esc(subtitle)}`,
    `🎤 <b>Ник:</b> ${esc(artist)}`,
    `🪪 <b>ФИО:</b> ${esc(fio)}`,
    `📅 <b>Дата:</b> ${esc(relDate)}`,
    `🧩 <b>Версия:</b> ${esc(version)}`,
    `🏷 <b>Жанр:</b> ${esc(genre)}`,
    `🔗 <b>Ссылка:</b> ${esc(link)}`,
    `🟡 <b>Яндекс Музыка:</b> ${esc(yandex)}`,
    `⚠️ <b>Мат:</b> ${hasMat}`,
    `📢 <b>Промо:</b> ${esc(promo)}`,
    `💬 <b>Комментарий:</b> ${esc(comment)}`,
    `📱 <b>Tg:</b> ${esc(tg)}`,
  ];

  if (opts.upc) {
    lines.push(`📦 <b>UPC:</b> <code>${esc(opts.upc)}</code>`);
  }

  if (opts.status === "rejected" && opts.rejectReason) {
    lines.push(`❌ <b>Причина отказа:</b> ${esc(opts.rejectReason)}`);
  }

  if ((opts.status === "needfix" || opts.status === "fix_required") && opts.moderatorComment) {
    lines.push(`✏️ <b>Требуемые правки:</b> ${esc(opts.moderatorComment)}`);
  }

  if (opts.moderatorName) {
    const timeStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const dateStr = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    lines.push("");
    lines.push(`ℹ️ <i>Обновлено через Web CMS: ${dateStr} ${timeStr} (${esc(opts.moderatorName)})</i>`);
  }

  return lines.join("\n");
}

export function buildTelegramKeyboard(uid: string, idx: number = 0) {
  const cleanUid = uid || "web";
  return {
    inline_keyboard: [
      [
        { text: "🕓 На отгрузке", callback_data: `m_upload_${cleanUid}_${idx}` },
        { text: "🧠 Модерация", callback_data: `m_moderate_${cleanUid}_${idx}` },
        { text: "✅ Принято", callback_data: `m_approve_${cleanUid}_${idx}` },
      ],
      [
        { text: "❌ Отклонить", callback_data: `m_reject_${cleanUid}_${idx}` },
        { text: "✏️ На исправлении", callback_data: `m_needfix_${cleanUid}_${idx}` },
        { text: "🗑 Удалено", callback_data: `m_delete_${cleanUid}_${idx}` },
      ],
      [
        { text: "📦 Присвоить UPC", callback_data: `m_upc_${cleanUid}_${idx}` },
      ],
    ],
  };
}

/** Synchronously update existing Telegram message in «АНКЕТЫ» chat */
export async function syncTelegramMessage(opts: SyncMessageOptions): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const messageId = Number(opts.messageId || 0);
  const chatId = opts.chatId || DEFAULT_MODERATION_CHAT;

  if (!messageId) {
    // If no messageId yet, optionally send a new one
    return sendTelegramNewMessage(opts);
  }

  try {
    const text = buildTelegramCardText(opts);
    const keyboard = buildTelegramKeyboard(opts.telegramId || opts.formId, 0);

    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (data.ok) {
      return { ok: true };
    }

    const desc = String(data.description || "");
    if (desc.includes("message is not modified")) {
      return { ok: true };
    }

    console.warn(`[TG Sync] editMessageText returned ${res.status}: ${desc}`);
    return { ok: false, error: desc };
  } catch (err: any) {
    console.error(`[TG Sync] fetch failed:`, err.message);
    return { ok: false, error: err.message };
  }
}

/** Send new Telegram card message when messageId is not yet assigned */
export async function sendTelegramNewMessage(opts: SyncMessageOptions): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };

  const chatId = opts.chatId || DEFAULT_MODERATION_CHAT;

  try {
    const text = buildTelegramCardText(opts);
    const keyboard = buildTelegramKeyboard(opts.telegramId || opts.formId, 0);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data.ok && data.result?.message_id) {
      return { ok: true, messageId: data.result.message_id };
    }
    return { ok: false, error: data.description || "Send message failed" };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/** Send plain or HTML notification message into Telegram moderation chat or DM */
export async function sendTelegramTextMessage(
  chatId: string | number,
  text: string,
  replyToMessageId?: number | null
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_to_message_id: replyToMessageId || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data.ok && data.result?.message_id) {
      return { ok: true, messageId: data.result.message_id };
    }
    return { ok: false, error: data.description || "Send text failed" };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
