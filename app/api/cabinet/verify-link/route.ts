import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient, getResolvedSupabaseUrl } from "@/lib/supabaseServer";
import { evaluateReferralMilestones } from "@/lib/ecosystemDb";

function getServiceSupabase() {
  const admin = getSupabaseAdminClient();
  if (admin) return admin;
  const url = getResolvedSupabaseUrl();
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured");
  }
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = String(body.code || body.token || "").trim();
    const telegramId = String(body.telegram_id || "").trim();
    const username = String(body.username || "").trim();
    const firstName = String(body.first_name || "").trim();

    if (!rawCode) {
      return NextResponse.json({ ok: false, error: "Укажите код или токен привязки" }, { status: 400 });
    }

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: "telegram_id обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Find the user with this link_code or link_token
    const { data: users, error: findError } = await supabase
      .from("cxrner_cabinet_users")
      .select("user_id, profile")
      .limit(500);

    if (findError) {
      return NextResponse.json({ ok: false, error: findError.message }, { status: 500 });
    }

    const matchedUser = (users || []).find((u) => {
      const p = (u.profile as Record<string, any>) || {};
      const matchesCode = p.link_code && p.link_code.toUpperCase() === rawCode.toUpperCase();
      const matchesToken = p.link_token && p.link_token.toLowerCase() === rawCode.toLowerCase();
      return matchesCode || matchesToken;
    });

    if (!matchedUser) {
      return NextResponse.json(
        {
          ok: false,
          error: "Код привязки не найден или срок его действия истёк. Сгенерируйте новый код в кабинете на сайте.",
        },
        { status: 404 }
      );
    }

    const currentProfile = (matchedUser.profile as Record<string, any>) || {};
    const now = new Date().toISOString();

    // Check expiration (15 minutes)
    if (currentProfile.link_created_at) {
      const createdAt = new Date(currentProfile.link_created_at).getTime();
      const diffMinutes = (Date.now() - createdAt) / (1000 * 60);
      if (diffMinutes > 15) {
        return NextResponse.json(
          { ok: false, error: "Срок действия кода истёк (15 минут). Запросите новый код в личном кабинете." },
          { status: 410 }
        );
      }
    }

    // Update cabinet profile with linked Telegram data and clear link token
    const existingEcoId = currentProfile.cxrner_id && typeof currentProfile.cxrner_id === "object"
      ? currentProfile.cxrner_id
      : null;

    const updatedProfile: Record<string, any> = {
      ...currentProfile,
      telegram_id: telegramId,
      telegram_username: username || currentProfile.telegram_username || "",
      telegram_first_name: firstName || currentProfile.telegram_first_name || "",
      telegram_linked_at: now,
      link_code: null,
      link_token: null,
      link_created_at: null,
      ...(existingEcoId
        ? {
            cxrner_id: {
              ...existingEcoId,
              telegram_id: telegramId,
              telegram_username: username || existingEcoId.telegram_username || null,
              telegram_linked: true,
              updated_at: now,
            },
          }
        : {}),
    };

    const { error: updateError } = await supabase
      .from("cxrner_cabinet_users")
      .update({
        profile: updatedProfile,
        updated_at: now,
      })
      .eq("user_id", matchedUser.user_id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Also mirror telegram status into cxrner_profiles & evaluate referral milestones
    try {
      await supabase
        .from("cxrner_profiles")
        .update({
          telegram_id: telegramId,
          telegram_username: username || null,
          telegram_linked: true,
          updated_at: now,
        })
        .eq("id", matchedUser.user_id);
    } catch {
      // ignore if 004 schema not applied
    }

    await evaluateReferralMilestones(matchedUser.user_id, {
      telegramLinked: true,
    }).catch(() => {});

    // Bidirectional sync: link all previous forms submitted via this telegram_id
    // to the cabinet user_id
    let syncedFormsCount = 0;
    try {
      const { data: updatedForms } = await supabase
        .from("cxrner_forms")
        .update({
          telegram_id: matchedUser.user_id, // updates so standard RLS policy allows user to see them
        })
        .eq("telegram_id", telegramId)
        .select("id");

      syncedFormsCount = (updatedForms || []).length;
    } catch (e: any) {
      console.warn("[verify-link] Could not update forms telegram_id:", e.message);
    }

    return NextResponse.json({
      ok: true,
      user_id: matchedUser.user_id,
      artist_name: updatedProfile.artist_name || "",
      telegram_id: telegramId,
      telegram_username: username,
      synced_releases_count: syncedFormsCount,
      message: "Аккаунт успешно синхронизирован! Все релизы объединены.",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
