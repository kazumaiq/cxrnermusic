import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../../../../lib/supabaseServer";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbClient = getSupabaseAdminClient() || supabase;
    const now = new Date().toISOString();

    const { data: existing } = await dbClient
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentProfile = (existing?.profile as Record<string, any>) || {};
    const existingEcoId =
      currentProfile.cxrner_id && typeof currentProfile.cxrner_id === "object"
        ? (currentProfile.cxrner_id as Record<string, any>)
        : null;

    const updatedProfile = {
      ...currentProfile,
      telegram_id: null,
      telegram_username: null,
      telegram_first_name: null,
      telegram_linked_at: null,
      link_code: null,
      link_token: null,
      link_created_at: null,
      ...(existingEcoId
        ? {
            cxrner_id: {
              ...existingEcoId,
              telegram_id: null,
              telegram_username: null,
              telegram_linked: false,
              updated_at: now,
            },
          }
        : {}),
    };

    const { error: updateErr } = await dbClient
      .from("cxrner_cabinet_users")
      .update({
        profile: updatedProfile,
        updated_at: now,
      })
      .eq("user_id", user.id);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    try {
      await dbClient
        .from("cxrner_profiles")
        .update({
          telegram_id: null,
          telegram_username: null,
          telegram_linked: false,
          updated_at: now,
        })
        .eq("id", user.id);
    } catch {
      // ignore if table absent
    }

    return NextResponse.json({ ok: true, message: "Telegram аккаунт успешно отвязан." });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
