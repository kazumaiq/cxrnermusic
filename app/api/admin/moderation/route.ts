import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import { syncTelegramMessage, sendTelegramTextMessage } from "@/lib/telegramSync";
import {
  getAllUnifiedReleases,
  computeCmsStats,
} from "@/lib/telegramReleases";
import { isTestRelease } from "@/lib/testReleases";
import { DossierRelease } from "@/components/admin/ReleaseDossierModal";

export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wjhqtrfsuudiogpwwzgx.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaHF0cmZzdXVkaW9ncHd3emd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTE3OTYsImV4cCI6MjEwMTY4Nzc5Nn0.fNVIC3dZuz7LLUTE0aOnF4ILVKBYXcftdU1ZjXyMZmo";

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
    const showDeleted = searchParams.get("show_deleted") === "true";

    const supabase = getServiceSupabase();
    const allReleases = await getAllUnifiedReleases(supabase);

    // Filter by deleted state
    let filtered = allReleases;
    if (!showDeleted && statusFilter !== "deleted" && statusFilter !== "archive") {
      filtered = filtered.filter((f) => !f.user_deleted && f.status !== "deleted");
    }

    // Filter by specific tab status
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "test") {
        filtered = allReleases.filter((f) => isTestRelease(f));
      } else if (statusFilter === "pending" || statusFilter === "on_upload") {
        filtered = filtered.filter((f) => f.status === "on_upload" || f.status === "pending");
      } else if (statusFilter === "moderation" || statusFilter === "on_moderation") {
        filtered = filtered.filter((f) => f.status === "moderation" || f.status === "on_moderation");
      } else if (statusFilter === "needfix" || statusFilter === "fix_required") {
        filtered = filtered.filter((f) => f.status === "needfix" || f.status === "fix_required");
      } else if (statusFilter === "approved" || statusFilter === "published") {
        filtered = filtered.filter((f) => f.status === "approved" || f.status === "published");
      } else if (statusFilter === "rejected") {
        filtered = filtered.filter((f) => f.status === "rejected");
      } else if (statusFilter === "deleted" || statusFilter === "archive") {
        filtered = filtered.filter((f) => f.user_deleted || f.status === "deleted");
      } else {
        filtered = filtered.filter((f) => f.status === statusFilter);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((f) => {
        const text = [
          f.artist_name,
          f.track_name,
          f.genre,
          f.upc,
          f.id,
          f.telegram_id,
          f.username,
          f.form_payload?.nick,
          f.form_payload?.fio,
          f.form_payload?.name,
          f.form_payload?.contact_telegram,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(searchQuery);
      });
    }

    // Compute comprehensive statistics across the entire dataset
    const stats = computeCmsStats(allReleases);

    return NextResponse.json({ ok: true, forms: filtered, stats });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const adminUser = await getAdminUser();
    const moderatorName = adminUser?.email || "cxrner.label@gmail.com";

    const body = await request.json().catch(() => ({}));
    const {
      id,
      status,
      upc,
      reject_reason,
      moderator_comment,
      action = "update",
      restore = false,
    } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID заявки обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Fetch current form state from cxrner_forms OR unified memory
    let currentForm: any = null;
    const { data: dbForm } = await supabase
      .from("cxrner_forms")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (dbForm) {
      currentForm = dbForm;
    } else {
      const allReleases = await getAllUnifiedReleases(supabase);
      currentForm = allReleases.find((r) => r.id === id);
    }

    if (!currentForm) {
      return NextResponse.json(
        { ok: false, error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const prevStatus = currentForm.status;
    const targetStatus = status !== undefined ? status : prevStatus;
    const targetUpc = upc !== undefined ? upc : currentForm.upc;
    const targetReject = reject_reason !== undefined ? reject_reason : currentForm.reject_reason;
    const targetComment = moderator_comment !== undefined ? moderator_comment : currentForm.moderator_comment;

    // Validate UPC uniqueness if assigning new UPC
    if (upc && upc.trim() && upc !== currentForm.upc) {
      const cleanUpc = upc.trim();
      const { data: duplicate } = await supabase
        .from("cxrner_forms")
        .select("id, artist_name, track_name")
        .eq("upc", cleanUpc)
        .neq("id", id)
        .limit(1);

      if (duplicate && duplicate.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Код UPC "${cleanUpc}" уже присвоен релизу "${duplicate[0].artist_name} — ${duplicate[0].track_name}" (ID: ${duplicate[0].id})`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Build updated action history
    const existingHistory = Array.isArray(currentForm.action_history)
      ? currentForm.action_history
      : Array.isArray(currentForm.form_payload?.action_history)
      ? currentForm.form_payload.action_history
      : [];

    const historyItem = {
      timestamp: now,
      moderator: moderatorName,
      action: action || targetStatus,
      prev_status: prevStatus,
      new_status: targetStatus,
      comment: targetComment || targetReject || null,
      upc: targetUpc || null,
    };

    const updatedHistory = [historyItem, ...existingHistory];
    const isUserDeleted = targetStatus === "deleted" ? true : restore ? false : Boolean(currentForm.user_deleted || currentForm.form_payload?.user_deleted);

    // 3. Prepare updated payload (action_history and comments live safely inside JSON)
    const updatedPayload = {
      ...(currentForm.form_payload || {}),
      status: targetStatus,
      upc: targetUpc !== undefined ? targetUpc : currentForm.upc,
      reject_reason: targetReject !== undefined ? targetReject : currentForm.reject_reason,
      moderator_comment: targetComment !== undefined ? targetComment : currentForm.moderator_comment,
      user_deleted: isUserDeleted,
      action_history: updatedHistory,
      last_moderated_at: now,
      last_moderator: moderatorName,
    };

    const inMemoryUpdated = {
      ...currentForm,
      status: targetStatus,
      upc: targetUpc,
      reject_reason: targetReject,
      moderator_comment: targetComment,
      user_deleted: isUserDeleted,
      action_history: updatedHistory,
      form_payload: updatedPayload,
      updated_at: now,
    };

    let updatedResult = inMemoryUpdated;

    // 4. Update Supabase cxrner_forms (using only genuine database columns)
    try {
      const dbFields: Record<string, any> = {
        status: targetStatus,
        form_payload: updatedPayload,
        updated_at: now,
      };
      if (targetUpc !== undefined && targetUpc !== null) dbFields.upc = targetUpc;
      if (targetReject !== undefined && targetReject !== null) dbFields.reject_reason = targetReject;

      const { data: updatedDb, error: updateErr } = await supabase
        .from("cxrner_forms")
        .update(dbFields)
        .eq("id", currentForm.id)
        .select()
        .maybeSingle();

      if (!updateErr && updatedDb) {
        updatedResult = {
          ...inMemoryUpdated,
          ...updatedDb,
          action_history: updatedHistory,
          form_payload: updatedPayload,
        };
      } else {
        // If not found by UUID, attempt upsert by submission_key
        const insertRow: Record<string, any> = {
          telegram_id: currentForm.telegram_id,
          username: currentForm.username,
          artist_name: currentForm.artist_name,
          track_name: currentForm.track_name,
          genre: currentForm.genre,
          release_type: currentForm.release_type,
          submission_key: currentForm.submission_key || currentForm.id,
          status: targetStatus,
          source: currentForm.source || "telegram_bot",
          form_payload: updatedPayload,
          upc: targetUpc || currentForm.upc || null,
          reject_reason: targetReject || null,
          moderation_message_id: currentForm.moderation_message_id || null,
          updated_at: now,
        };
        const { data: upsertedDb } = await supabase
          .from("cxrner_forms")
          .upsert(insertRow, { onConflict: "submission_key" })
          .select()
          .maybeSingle();

        if (upsertedDb) {
          updatedResult = {
            ...inMemoryUpdated,
            ...upsertedDb,
            action_history: updatedHistory,
            form_payload: updatedPayload,
          };
        }
      }
    } catch (saveErr) {
      console.warn("[Admin Moderation] cxrner_forms update warning:", saveErr);
    }

    // 5. Synchronize with cxrner_public_releases (Approved = upsert, Rejected/Deleted = remove)
    try {
      if (targetStatus === "approved") {
        await supabase
          .from("cxrner_public_releases")
          .upsert({
            form_id: currentForm.id,
            telegram_id: currentForm.telegram_id,
            username: currentForm.username,
            artist_name: currentForm.artist_name,
            track_name: currentForm.track_name,
            genre: currentForm.genre,
            release_type: currentForm.release_type,
            status: "approved",
            approved_at: now,
            release_data: updatedPayload,
            updated_at: now,
          }, { onConflict: "form_id" });
      } else if (targetStatus === "rejected" || targetStatus === "deleted") {
        await supabase
          .from("cxrner_public_releases")
          .delete()
          .eq("form_id", currentForm.id);
      }
    } catch (pubErr) {
      console.warn("[Admin Moderation] cxrner_public_releases sync notice:", pubErr);
    }

    // 6. Forward action directly to live Telegram bot on Bothost
    let botSyncResult: { ok: boolean; error?: string; [key: string]: any } = { ok: false };
    try {
      const botUrl = (
        process.env.BOT_BACKEND_URL ||
        "https://bot-1787153410-6782-kazumaiq.bothost.tech"
      ).replace(/\/+$/, "");

      const botRes = await fetch(`${botUrl}/api/moderation/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.BOT_BACKEND_SECRET ? { "x-cxrner-secret": process.env.BOT_BACKEND_SECRET } : {}),
        },
        body: JSON.stringify({
          id: currentForm.id,
          telegram_id: currentForm.telegram_id,
          track_name: currentForm.track_name,
          artist_name: currentForm.artist_name,
          status: targetStatus,
          action: action || targetStatus,
          upc: targetUpc,
          reject_reason: targetReject,
          moderator_comment: targetComment,
          moderator_name: moderatorName,
        }),
      });

      botSyncResult = await botRes.json().catch(() => ({ ok: false }));
    } catch (botErr: any) {
      console.warn("[Admin Moderation] Bot endpoint forward notice:", botErr.message);
      botSyncResult = { ok: false, error: botErr.message };
    }

    // 7. Synchronize with Telegram group message in real-time (Direct API fallback)
    let tgSyncResult: { ok: boolean; error?: string } = { ok: false };
    const messageId =
      currentForm.moderation_message_id ||
      updatedPayload.moderation_message_id ||
      null;

    tgSyncResult = await syncTelegramMessage({
      formId: currentForm.id,
      telegramId: currentForm.telegram_id,
      messageId: messageId ? Number(messageId) : null,
      status: targetStatus,
      upc: targetUpc,
      rejectReason: targetReject,
      moderatorComment: targetComment,
      moderatorName: moderatorName,
      artistName: currentForm.artist_name,
      trackName: currentForm.track_name,
      genre: currentForm.genre,
      releaseType: currentForm.release_type,
      payload: updatedPayload,
    });

    if (tgSyncResult.ok && (tgSyncResult as any).messageId && !currentForm.moderation_message_id) {
      try {
        await supabase
          .from("cxrner_forms")
          .update({ moderation_message_id: String((tgSyncResult as any).messageId) })
          .eq("id", currentForm.id);
      } catch {}
    }

    const activeMsgId = (tgSyncResult as any).messageId || (messageId ? Number(messageId) : null);
    const modChat = process.env.MODERATION_CHAT_ID || "-1002117586464";

    // Post reply message into moderation group if action is assign_upc or upc provided
    if (targetUpc) {
      await sendTelegramTextMessage(
        modChat,
        `✅ UPC присвоен: <code>${targetUpc}</code>`,
        activeMsgId
      ).catch(() => null);

      if (currentForm.telegram_id && /^\d{4,20}$/.test(String(currentForm.telegram_id))) {
        await sendTelegramTextMessage(
          currentForm.telegram_id,
          `📦 <b>UPC присвоен</b>\n\n🎵 <b>${currentForm.track_name || "Релиз"}</b>\nUPC: <code>${targetUpc}</code>`
        ).catch(() => null);
      }
    }

    if (action === "approve" || status === "approved") {
      await sendTelegramTextMessage(
        modChat,
        `✅ <b>Релиз одобрен модератором</b> (${moderatorName})`,
        activeMsgId
      ).catch(() => null);
    } else if (action === "reject" || status === "rejected") {
      await sendTelegramTextMessage(
        modChat,
        `❌ <b>Релиз отклонен:</b> ${targetReject || "Без указания причины"}`,
        activeMsgId
      ).catch(() => null);
    } else if (action === "needfix" || status === "needfix") {
      await sendTelegramTextMessage(
        modChat,
        `✏️ <b>Отправлено на исправления:</b> ${targetComment || "Требуются правки"}`,
        activeMsgId
      ).catch(() => null);
    }

    const isTgSynced = botSyncResult.ok || tgSyncResult.ok;

    return NextResponse.json({
      ok: true,
      form: updatedResult,
      bot_sync: botSyncResult,
      telegram_sync: tgSyncResult,
      tg_sync: { ok: isTgSynced },
      message: "Статус релиза успешно обновлен",
    });
  } catch (err: any) {
    console.error("[Admin Moderation PATCH] Exception:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const adminUser = await getAdminUser();
    const moderatorName = adminUser?.email || "cxrner.label@gmail.com";

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const allReleases = await getAllUnifiedReleases(supabase);
    const current = allReleases.find((r) => r.id === id);

    if (!current) {
      return NextResponse.json({ ok: false, error: "Релиз не найден" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const existingHistory = Array.isArray(current?.action_history) ? current.action_history : [];
    const updatedHistory = [
      {
        timestamp: now,
        moderator: moderatorName,
        action: "soft_delete",
        prev_status: current?.status || "pending",
        new_status: "deleted",
        comment: "Перемещено в архив",
      },
      ...existingHistory,
    ];

    const deletedRow = {
      ...current,
      user_deleted: true,
      status: "deleted",
      action_history: updatedHistory,
      updated_at: now,
    };

    try {
      await supabase
        .from("cxrner_forms")
        .upsert(deletedRow, { onConflict: "id" });
    } catch {}

    // Sync deletion to Telegram
    await syncTelegramMessage({
      formId: current.id,
      telegramId: current.telegram_id,
      messageId: current.moderation_message_id ? Number(current.moderation_message_id) : null,
      status: "deleted",
      moderatorName: moderatorName,
      artistName: current.artist_name,
      trackName: current.track_name,
      genre: current.genre,
      releaseType: current.release_type,
      payload: current.form_payload,
    });

    return NextResponse.json({ ok: true, form: deletedRow, message: "Заявка перемещена в архив" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
