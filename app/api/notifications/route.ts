import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getUserNotifications, markNotificationsRead } from "@/lib/ecosystemDb";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const notifications = await getUserNotifications(user.id);
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

    await markNotificationsRead({
      userId: user.id,
      notificationId,
      markAll: Boolean(markAll),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
