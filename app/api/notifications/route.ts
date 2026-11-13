import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    let notifications: any[] = [];
    try {
      const { data } = await supabase
        .from("cxrner_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      notifications = data || [];
    } catch {
      // fallback
    }

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      ok: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    try {
      if (markAll) {
        await supabase
          .from("cxrner_notifications")
          .update({ is_read: true })
          .eq("user_id", user.id);
      } else if (notificationId) {
        await supabase
          .from("cxrner_notifications")
          .update({ is_read: true })
          .eq("id", notificationId)
          .eq("user_id", user.id);
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
