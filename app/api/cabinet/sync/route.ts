import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../../../../lib/supabaseServer";
import crypto from "crypto";

// GET current Telegram sync status
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbClient = getSupabaseAdminClient() || supabase;

    const { data: row } = await dbClient
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const profile = (row?.profile as Record<string, any>) || {};
    const telegramId = profile.telegram_id ? String(profile.telegram_id) : null;
    const telegramUsername = profile.telegram_username ? String(profile.telegram_username) : null;
    const telegramFirstName = profile.telegram_first_name ? String(profile.telegram_first_name) : null;
    const linkedAt = profile.telegram_linked_at ? String(profile.telegram_linked_at) : null;

    const lookupIds = Array.from(
      new Set([String(user.id || "").trim(), String(telegramId || "").trim()].filter(Boolean))
    );
    const { count } = await dbClient
      .from("cxrner_forms")
      .select("id", { count: "exact", head: true })
      .in("telegram_id", lookupIds);
    const syncedCount = count || 0;

    return NextResponse.json({
      ok: true,
      isLinked: Boolean(telegramId),
      telegramId,
      telegramUsername,
      telegramFirstName,
      linkedAt,
      syncedReleasesCount: syncedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST generate new sync code & token
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

    // Generate short readable 6-digit code like "CX-748921" and a secure URL token
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `CX-${randomDigits}`;
    const token = crypto.randomBytes(16).toString("hex");
    const now = new Date().toISOString();

    const { data: existing } = await dbClient
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentProfile = (existing?.profile as Record<string, any>) || {};
    const updatedProfile = {
      ...currentProfile,
      link_code: code,
      link_token: token,
      link_created_at: now,
    };

    await dbClient.from("cxrner_cabinet_users").upsert(
      {
        user_id: user.id,
        profile: updatedProfile,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "moder_cxrner_bot";
    const botDeepLink = `https://t.me/${botUsername}?start=link_${token}`;

    return NextResponse.json({
      ok: true,
      code,
      token,
      botDeepLink,
      expiresInMinutes: 15,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
