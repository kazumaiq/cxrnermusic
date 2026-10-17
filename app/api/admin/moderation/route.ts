import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/admin";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured");
  }
  return createClient(url, key);
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

    const supabase = getServiceSupabase();

    let query = supabase
      .from("cxrner_forms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "pending") {
        query = query.in("status", ["pending", "moderation", "on_moderation", "on_upload"]);
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
          f.telegram_id,
          f.form_payload?.nick,
          f.form_payload?.fio,
          f.form_payload?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(searchQuery);
      });
    }

    // Calculate overall statistics
    const stats = {
      total: rawForms?.length || 0,
      pending: (rawForms || []).filter(
        (f) =>
          f.status === "pending" ||
          f.status === "moderation" ||
          f.status === "on_moderation" ||
          f.status === "on_upload"
      ).length,
      approved: (rawForms || []).filter((f) => f.status === "approved").length,
      uploaded: (rawForms || []).filter((f) => f.status === "uploaded" || f.status === "released").length,
      fix_required: (rawForms || []).filter(
        (f) => f.status === "fix_required" || f.status === "needfix"
      ).length,
      rejected: (rawForms || []).filter((f) => f.status === "rejected").length,
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

    const body = await request.json().catch(() => ({}));
    const { id, status, upc, reject_reason } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID заявки обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const updates: Record<string, any> = {
      updated_at: now,
    };

    if (status !== undefined) updates.status = status;
    if (upc !== undefined) updates.upc = upc;
    if (reject_reason !== undefined) updates.reject_reason = reject_reason;

    const { data: updated, error } = await supabase
      .from("cxrner_forms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, form: updated });
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID заявки обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("cxrner_forms").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Заявка удалена" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
