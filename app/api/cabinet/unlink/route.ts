import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentProfile = (existing?.profile as Record<string, any>) || {};
    const updatedProfile = {
      ...currentProfile,
      telegram_id: null,
      telegram_username: null,
      telegram_first_name: null,
      telegram_linked_at: null,
    };

    await supabase
      .from("cxrner_cabinet_users")
      .update({
        profile: updatedProfile,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true, message: "Telegram аккаунт успешно отвязан." });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
