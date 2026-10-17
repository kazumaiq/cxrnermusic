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

    const supabase = getServiceSupabase();

    // Fetch cabinet users
    const { data: cabinetUsers, error: cabError } = await supabase
      .from("cxrner_cabinet_users")
      .select("user_id, profile, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (cabError) {
      return NextResponse.json({ ok: false, error: cabError.message }, { status: 500 });
    }

    // Fetch forms to aggregate release counts
    const { data: allForms } = await supabase
      .from("cxrner_forms")
      .select("telegram_id, status");

    const formsByUid: Record<string, number> = {};
    (allForms || []).forEach((f) => {
      const tid = String(f.telegram_id || "");
      if (tid) {
        formsByUid[tid] = (formsByUid[tid] || 0) + 1;
      }
    });

    const users = (cabinetUsers || []).map((row) => {
      const p = (row.profile as Record<string, any>) || {};
      const tgId = p.telegram_id ? String(p.telegram_id) : null;
      const count = (formsByUid[row.user_id] || 0) + (tgId ? (formsByUid[tgId] || 0) : 0);

      return {
        user_id: row.user_id,
        artist_name: p.artist_name || "—",
        email: p.email || null,
        telegram_id: tgId,
        telegram_username: p.telegram_username || null,
        telegram_first_name: p.telegram_first_name || null,
        telegram_linked_at: p.telegram_linked_at || null,
        is_linked: Boolean(tgId),
        releases_count: count,
        updated_at: row.updated_at,
      };
    });

    return NextResponse.json({ ok: true, users });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
