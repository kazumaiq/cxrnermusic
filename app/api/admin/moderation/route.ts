import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import { syncTelegramMessage } from "@/lib/telegramSync";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured");
  }
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

    let query = supabase
      .from("cxrner_forms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    // Filter out deleted unless specifically looking at archive / deleted
    if (!showDeleted && statusFilter !== "deleted" && statusFilter !== "archive") {
      query = query.or("user_deleted.is.null,user_deleted.eq.false");
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "pending" || statusFilter === "on_upload") {
        query = query.in("status", ["pending", "on_upload"]);
      } else if (statusFilter === "moderation" || statusFilter === "on_moderation") {
        query = query.in("status", ["moderation", "on_moderation"]);
      } else if (statusFilter === "needfix" || statusFilter === "fix_required") {
        query = query.in("status", ["needfix", "fix_required"]);
      } else if (statusFilter === "deleted" || statusFilter === "archive") {
        query = query.or("user_deleted.eq.true,status.eq.deleted");
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    const { data: rawForms, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    let forms = rawForms || [];

    if (searchQuery) {
      forms = forms.filter((f) => {
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

    // Fetch all for accurate tab count statistics
    const { data: allStatsRows } = await supabase
      .from("cxrner_forms")
      .select("id, status, user_deleted, created_at, upc")
      .limit(1000);

    const all = allStatsRows || [];
    const activeReleases = all.filter((f) => !f.user_deleted && f.status !== "deleted");

    const stats = {
      total: activeReleases.length,
      all_count: all.length,
      on_upload: activeReleases.filter((f) => f.status === "on_upload" || f.status === "pending").length,
      moderation: activeReleases.filter((f) => f.status === "moderation" || f.status === "on_moderation").length,
      needfix: activeReleases.filter((f) => f.status === "needfix" || f.status === "fix_required").length,
      approved: activeReleases.filter((f) => f.status === "approved" || f.status === "published").length,
      rejected: activeReleases.filter((f) => f.status === "rejected").length,
      archived: all.filter((f) => f.user_deleted || f.status === "deleted").length,
      with_upc: activeReleases.filter((f) => Boolean(f.upc && f.upc.trim())).length,
    };

    return NextResponse.json({ ok: true, forms, stats });
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

    // 1. Fetch current form state to preserve payload and history
    const { data: currentForm, error: fetchErr } = await supabase
      .from("cxrner_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentForm) {
      return NextResponse.json(
        { ok: false, error: fetchErr?.message || "Заявка не найдена" },
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

    // 3. Prepare DB updates
    const updates: Record<string, any> = {
      updated_at: now,
      action_history: updatedHistory,
    };

    if (status !== undefined) updates.status = targetStatus;
    if (upc !== undefined) updates.upc = targetUpc;
    if (reject_reason !== undefined) updates.reject_reason = targetReject;
    if (moderator_comment !== undefined) updates.moderator_comment = targetComment;

    if (targetStatus === "deleted") {
      updates.user_deleted = true;
    } else if (restore) {
      updates.user_deleted = false;
      if (updates.status === "deleted") {
        updates.status = "on_upload";
      }
    }

    // Also update JSON form_payload so everything mirrors
    const updatedPayload = {
      ...(currentForm.form_payload || {}),
      status: updates.status || targetStatus,
      upc: updates.upc !== undefined ? updates.upc : targetUpc,
      reject_reason: updates.reject_reason !== undefined ? updates.reject_reason : targetReject,
      moderator_comment: updates.moderator_comment !== undefined ? updates.moderator_comment : targetComment,
      last_moderated_at: now,
      last_moderator: moderatorName,
    };
    updates.form_payload = updatedPayload;

    const { data: updated, error: updateErr } = await supabase
      .from("cxrner_forms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    // 4. Mirror approved release into cxrner_public_releases & cxrner_releases
    if (targetStatus === "approved") {
      try {
        await supabase
          .from("cxrner_public_releases")
          .upsert(
            {
              id: currentForm.id,
              title: currentForm.track_name || updatedPayload.name || "Без названия",
              artist: currentForm.artist_name || updatedPayload.nick || "CXRNER ARTIST",
              cover: updatedPayload.cover_url || updatedPayload.artwork_url || "/images/album-01.svg",
              upc: targetUpc || null,
              release_date: updatedPayload.release_date || updatedPayload.date || null,
              genre: currentForm.genre || updatedPayload.genre || "Electronic",
              updated_at: now,
            },
            { onConflict: "id" }
          );
      } catch (pubErr) {
        console.warn("[Admin Moderation] public release mirror warning:", pubErr);
      }
    } else if (targetStatus === "rejected" || targetStatus === "deleted") {
      try {
        await supabase.from("cxrner_public_releases").delete().eq("id", currentForm.id);
      } catch {}
    }

    // 5. Synchronize with Telegram group message in real-time
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

    return NextResponse.json({
      ok: true,
      form: updated,
      tg_sync: tgSyncResult,
      message: `Статус успешно обновлён: ${targetStatus}`,
    });
  } catch (err: any) {
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
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID заявки обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (permanent) {
      // Hard delete from database
      const { error } = await supabase.from("cxrner_forms").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Заявка безвозвратно удалена из базы" });
    }

    // Soft delete: set user_deleted = true and status = 'deleted'
    const now = new Date().toISOString();
    const { data: current } = await supabase.from("cxrner_forms").select("*").eq("id", id).single();

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

    const { data: updated, error } = await supabase
      .from("cxrner_forms")
      .update({
        user_deleted: true,
        status: "deleted",
        action_history: updatedHistory,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Sync deletion to Telegram
    if (current) {
      await syncTelegramMessage({
        formId: current.id,
        telegramId: current.telegram_id,
        messageId: current.moderation_message_id,
        status: "deleted",
        moderatorName: moderatorName,
        artistName: current.artist_name,
        trackName: current.track_name,
        genre: current.genre,
        releaseType: current.release_type,
        payload: current.form_payload,
      });
    }

    return NextResponse.json({ ok: true, form: updated, message: "Заявка перемещена в архив" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
