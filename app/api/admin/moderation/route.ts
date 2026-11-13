import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import { syncTelegramMessage } from "@/lib/telegramSync";
import {
  loadBackupTelegramReleases,
  transformPublicReleaseToDossier,
} from "@/lib/telegramReleases";
import { DossierRelease } from "@/components/admin/ReleaseDossierModal";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wjhqtrfsuudiogpwwzgx.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaHF0cmZzdXVkaW9ncHd3emd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTE3OTYsImV4cCI6MjEwMTY4Nzc5Nn0.fNVIC3dZuz7LLUTE0aOnF4ILVKBYXcftdU1ZjXyMZmo";

  return createClient(url, key, { auth: { persistSession: false } });
}

async function getAllUnifiedReleases(supabase: any): Promise<DossierRelease[]> {
  const map = new Map<string, DossierRelease>();

  // 1. Initial Telegram bot backlog (contains real pending, on_upload, moderation, needfix, rejected)
  try {
    const backupReleases = loadBackupTelegramReleases();
    for (const b of backupReleases) {
      map.set(b.id, b);
    }
  } catch (err) {
    console.warn("[Admin Moderation] Backup releases load notice:", err);
  }

  // 2. Load public releases from Supabase (160 approved releases synced from Telegram)
  try {
    const { data: pubData, error: pubErr } = await supabase
      .from("cxrner_public_releases")
      .select("*")
      .limit(1000);

    if (!pubErr && Array.isArray(pubData)) {
      for (const row of pubData) {
        const item = transformPublicReleaseToDossier(row);
        map.set(item.id, item);
      }
    }
  } catch (err) {
    console.warn("[Admin Moderation] cxrner_public_releases load notice:", err);
  }

  // 3. Load cxrner_forms from Supabase (primary overrides for web actions & new submissions)
  try {
    const { data: formsData, error: formsErr } = await supabase
      .from("cxrner_forms")
      .select("*")
      .limit(1000);

    if (!formsErr && Array.isArray(formsData)) {
      for (const f of formsData) {
        map.set(f.id, {
          id: f.id,
          telegram_id: f.telegram_id,
          username: f.username,
          artist_name: f.artist_name,
          track_name: f.track_name,
          genre: f.genre,
          release_type: f.release_type,
          submission_key: f.submission_key,
          status: f.status,
          upc: f.upc,
          reject_reason: f.reject_reason,
          moderator_comment: f.moderator_comment,
          moderation_message_id: f.moderation_message_id,
          created_at: f.created_at,
          updated_at: f.updated_at,
          source: f.source,
          user_deleted: f.user_deleted,
          action_history: f.action_history,
          form_payload: f.form_payload,
        });
      }
    }
  } catch (err) {
    console.warn("[Admin Moderation] cxrner_forms load notice:", err);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
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
      if (statusFilter === "pending" || statusFilter === "on_upload") {
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
    const activeReleases = allReleases.filter((f) => !f.user_deleted && f.status !== "deleted");

    const stats = {
      total: activeReleases.length,
      all_count: allReleases.length,
      on_upload: activeReleases.filter((f) => f.status === "on_upload" || f.status === "pending").length,
      moderation: activeReleases.filter((f) => f.status === "moderation" || f.status === "on_moderation").length,
      needfix: activeReleases.filter((f) => f.status === "needfix" || f.status === "fix_required").length,
      approved: activeReleases.filter((f) => f.status === "approved" || f.status === "published").length,
      rejected: activeReleases.filter((f) => f.status === "rejected").length,
      archived: allReleases.filter((f) => f.user_deleted || f.status === "deleted").length,
      with_upc: activeReleases.filter((f) => Boolean(f.upc && f.upc.trim())).length,
    };

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

    // 3. Prepare updates
    const updatedPayload = {
      ...(currentForm.form_payload || {}),
      status: targetStatus,
      upc: targetUpc !== undefined ? targetUpc : currentForm.upc,
      reject_reason: targetReject !== undefined ? targetReject : currentForm.reject_reason,
      moderator_comment: targetComment !== undefined ? targetComment : currentForm.moderator_comment,
      last_moderated_at: now,
      last_moderator: moderatorName,
    };

    const rowToSave = {
      id: currentForm.id,
      telegram_id: currentForm.telegram_id,
      username: currentForm.username,
      artist_name: currentForm.artist_name,
      track_name: currentForm.track_name,
      genre: currentForm.genre,
      release_type: currentForm.release_type,
      submission_key: currentForm.submission_key || currentForm.id,
      status: targetStatus,
      upc: targetUpc,
      reject_reason: targetReject,
      moderator_comment: targetComment,
      moderation_message_id: currentForm.moderation_message_id,
      source: currentForm.source || "telegram_bot",
      user_deleted: targetStatus === "deleted" ? true : restore ? false : Boolean(currentForm.user_deleted),
      action_history: updatedHistory,
      form_payload: updatedPayload,
      updated_at: now,
    };

    if (restore && rowToSave.status === "deleted") {
      rowToSave.status = "on_upload";
      rowToSave.user_deleted = false;
    }

    let updatedResult = rowToSave;

    // Upsert into cxrner_forms
    try {
      const { data: upserted, error: upsertErr } = await supabase
        .from("cxrner_forms")
        .upsert(rowToSave, { onConflict: "id" })
        .select()
        .single();

      if (!upsertErr && upserted) {
        updatedResult = upserted;
      }
    } catch (saveErr) {
      console.warn("[Admin Moderation] cxrner_forms upsert warning:", saveErr);
    }

    // 4. Synchronize with Telegram group message in real-time
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
          .eq("id", id);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      form: updatedResult,
      telegram_sync: tgSyncResult,
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
