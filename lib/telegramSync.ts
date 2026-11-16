// CXRNER MUSIC — Unified Telegram Moderation Sync Engine
// Handles two-way synchronized message formatting and editing in the «АНКЕТЫ» Telegram group.

const DEFAULT_MODERATION_CHAT =
  process.env.MODERATION_CHAT_ID ||
  process.env.TELEGRAM_MODERATION_CHAT_ID ||
  process.env.TELEGRAM_CHAT_ID ||
  "-1002117586464";

const DEFAULT_MODERATION_THREAD_ID =
  Number(process.env.MODERATION_THREAD_ID || process.env.TELEGRAM_MODERATION_THREAD_ID || 0) || 0;

export interface SyncMessageOptions {
  formId: string;
  telegramId?: string | null;
  messageId?: string | number | null;
  chatId?: string | number | null;
  messageThreadId?: number | null;
  status: string;
  upc?: string | null;
  rejectReason?: string | null;
  moderatorComment?: string | null;
  moderatorName?: string | null;
  artistName?: string | null;
  trackName?: string | null;
  genre?: string | null;
  releaseType?: string | null;
  hasUpc?: boolean;
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

function formatTelegramLink(value: any, label?: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return ".";
  if (/^https?:\/\/\S+$/i.test(raw)) {
    const safeUrl = raw.replace(/"/g, "%22").replace(/</g, "%3C").replace(/>/g, "%3E");
    return `<a href="${safeUrl}">${esc(label || raw)}</a>`;
  }
  return esc(raw);
}

function isTelegramButtonStyleError(description: string): boolean {
  const d = String(description || "").toLowerCase();
  return (
    d.includes("style") ||
    d.includes("icon_custom_emoji_id") ||
    d.includes("reply markup") ||
    d.includes("reply_markup")
  );
}

function stripKeyboardButtonStyles(replyMarkup: any): any {
  if (!replyMarkup || !Array.isArray(replyMarkup.inline_keyboard)) return replyMarkup;
  return {
    ...replyMarkup,
    inline_keyboard: replyMarkup.inline_keyboard.map((row: any[]) =>
      Array.isArray(row)
        ? row.map((btn: any) => {
            if (!btn || typeof btn !== "object") return btn;
            const copy: Record<string, any> = { ...btn };
            delete copy.style;
            delete copy.icon_custom_emoji_id;
            return copy;
          })
        : row
    ),
  };
}

async function tgPostJson(
  token: string,
  method: string,
  body: Record<string, any>
): Promise<{ ok: boolean; result?: any; description?: string; error_code?: number; parameters?: any }> {
  const cleanBody = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );

  const sendOnce = async (payload: Record<string, any>) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  };

  let data = await sendOnce(cleanBody);

  if (
    !data?.ok &&
    data?.error_code === 400 &&
    cleanBody.reply_markup &&
    isTelegramButtonStyleError(data.description || "")
  ) {
    data = await sendOnce({
      ...cleanBody,
      reply_markup: stripKeyboardButtonStyles(cleanBody.reply_markup),
    });
  }

  const retryAfter = Number(data?.parameters?.retry_after || 0);
  if (!data?.ok && data?.error_code === 429 && retryAfter > 0 && retryAfter <= 12) {
    await new Promise((resolve) => setTimeout(resolve, (retryAfter + 0.25) * 1000));
    data = await sendOnce(cleanBody);
    if (
      !data?.ok &&
      data?.error_code === 400 &&
      cleanBody.reply_markup &&
      isTelegramButtonStyleError(data.description || "")
    ) {
      data = await sendOnce({
        ...cleanBody,
        reply_markup: stripKeyboardButtonStyles(cleanBody.reply_markup),
      });
    }
  }

  return data || { ok: false, description: "Empty Telegram response" };
}

export async function pinTelegramChatMessage(
  token: string,
  chatId: string | number,
  messageId: number
): Promise<{ ok: boolean; error?: string }> {
  if (!token || !messageId) return { ok: false, error: "Missing token or messageId" };
  try {
    const data = await tgPostJson(token, "pinChatMessage", {
      chat_id: chatId,
      message_id: messageId,
      disable_notification: false,
    });
    if (data.ok) return { ok: true };
    const desc = String(data.description || "pinChatMessage failed");
    if (/already pinned/i.test(desc)) return { ok: true };
    return { ok: false, error: desc };
  } catch (err: any) {
    return { ok: false, error: err?.message || "pinChatMessage failed" };
  }
}

export async function unpinTelegramChatMessage(
  token: string,
  chatId: string | number,
  messageId: number
): Promise<{ ok: boolean; error?: string }> {
  if (!token || !messageId) return { ok: false, error: "Missing token or messageId" };
  try {
    const data = await tgPostJson(token, "unpinChatMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
    if (data.ok) return { ok: true };
    const desc = String(data.description || "unpinChatMessage failed");
    if (/not found|not pinned|message to unpin not found/i.test(desc)) return { ok: true };
    return { ok: false, error: desc };
  } catch (err: any) {
    return { ok: false, error: err?.message || "unpinChatMessage failed" };
  }
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
    `🔗 <b>Ссылка:</b> ${formatTelegramLink(link)}`,
    `🟡 <b>Яндекс Музыка:</b> ${formatTelegramLink(yandex)}`,
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

export function buildTelegramKeyboard(
  uid: string,
  idx: number = 0,
  status: string = "pending",
  hasUpc: boolean = false
) {
  const cleanUid = String(uid || "web");
  const norm = String(status || "pending").toLowerCase();
  const isPinned = norm === "on_upload" || norm === "pending";
  return {
    inline_keyboard: [
      [
        { text: "✅ Принять", callback_data: `m_approve_${cleanUid}_${idx}`, style: "success" },
        { text: "❌ Отклонить", callback_data: `m_reject_${cleanUid}_${idx}`, style: "danger" },
      ],
      [
        { text: "🕓 На отгрузку", callback_data: `m_upload_${cleanUid}_${idx}`, style: "primary" },
        { text: "🧠 В работу", callback_data: `m_moderate_${cleanUid}_${idx}` },
      ],
      [
        { text: "✏️ Правки", callback_data: `m_needfix_${cleanUid}_${idx}` },
        { text: hasUpc ? "📦 Сменить UPC" : "📦 Задать UPC", callback_data: `m_upc_${cleanUid}_${idx}` },
      ],
      [
        isPinned
          ? { text: "📌 Открепить", callback_data: `m_unpin_${cleanUid}_${idx}` }
          : { text: "📌 Закрепить", callback_data: `m_pin_${cleanUid}_${idx}` },
        { text: "🗑 Удалить", callback_data: `m_delete_${cleanUid}_${idx}`, style: "danger" },
      ],
    ],
  };
}

/** Synchronously update existing Telegram message in «АНКЕТЫ» chat */
export async function syncTelegramMessage(
  opts: SyncMessageOptions
): Promise<{ ok: boolean; messageId?: number; pinned?: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const messageId = Number(opts.messageId || 0);
  const chatId = opts.chatId || DEFAULT_MODERATION_CHAT;

  if (!messageId) {
    // If no messageId yet, send a new one and auto-pin when status is on_upload/pending
    return sendTelegramNewMessage(opts);
  }

  try {
    const text = buildTelegramCardText(opts);
    const keyboard = buildTelegramKeyboard(
      opts.telegramId || opts.formId,
      0,
      opts.status,
      Boolean(opts.upc || opts.hasUpc)
    );

    const data = await tgPostJson(token, "editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: keyboard,
    });

    const s = String(opts.status || "pending").toLowerCase();
    const shouldStayPinned = s === "on_upload" || s === "pending";
    let pinned = false;
    if (shouldStayPinned) {
      const pinRes = await pinTelegramChatMessage(token, chatId, messageId);
      pinned = pinRes.ok;
    } else {
      await unpinTelegramChatMessage(token, chatId, messageId);
    }

    const desc = String(data.description || "");
    if (data.ok || /message is not modified/i.test(desc)) {
      return { ok: true, messageId, pinned };
    }

    console.warn(`[TG Sync] editMessageText returned error: ${desc}`);
    return { ok: false, messageId, pinned, error: desc || "Telegram sync failed" };
  } catch (err: any) {
    console.error(`[TG Sync] fetch failed:`, err.message);
    return { ok: false, error: err.message };
  }
}

/** Send new Telegram card message when messageId is not yet assigned */
export async function sendTelegramNewMessage(
  opts: SyncMessageOptions
): Promise<{ ok: boolean; messageId?: number; pinned?: boolean; pinError?: string; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };

  const chatId = opts.chatId || DEFAULT_MODERATION_CHAT;
  const threadId = Number(opts.messageThreadId ?? DEFAULT_MODERATION_THREAD_ID) || 0;

  try {
    const text = buildTelegramCardText(opts);
    const keyboard = buildTelegramKeyboard(
      opts.telegramId || opts.formId,
      0,
      opts.status,
      Boolean(opts.upc || opts.hasUpc)
    );

    const data = await tgPostJson(token, "sendMessage", {
      chat_id: chatId,
      message_thread_id: threadId > 0 ? threadId : undefined,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: keyboard,
    });

    if (data.ok && data.result?.message_id) {
      const sentMessageId = Number(data.result.message_id);
      const s = String(opts.status || "pending").toLowerCase();
      const shouldStayPinned = s === "on_upload" || s === "pending";
      let pinned = false;
      let pinError: string | undefined;
      if (shouldStayPinned) {
        const pinRes = await pinTelegramChatMessage(token, chatId, sentMessageId);
        pinned = pinRes.ok;
        pinError = pinRes.error;
      }
      return { ok: true, messageId: sentMessageId, pinned, pinError };
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
    const data = await tgPostJson(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_to_message_id: replyToMessageId || undefined,
    });

    if (data.ok && data.result?.message_id) {
      return { ok: true, messageId: data.result.message_id };
    }
    return { ok: false, error: data.description || "Send text failed" };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
