import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Требуется авторизация" }, { status: 401 });
    }

    const isAdmin = isAdminUser(user);

    let query = supabase.from("smart_links").select("id, status").eq("id", id).is("deleted_at", null);
    if (!isAdmin) query = query.eq("user_id", user.id);
    const { data: link, error: linkErr } = await query.maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json({ success: false, error: "Smart Link не найден" }, { status: 404 });
    }

    const nextStatus = link.status === "archived" ? "published" : "archived";

    const { data: updated, error: updateErr } = await supabase
      .from("smart_links")
      .update({ status: nextStatus })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: updated.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
