import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAdminClient,
  getResolvedSupabaseUrl,
  getResolvedSupabaseAnonKey,
} from "@/lib/supabaseServer";
import { evaluateReferralMilestones } from "@/lib/ecosystemDb";

function getServiceSupabase() {
  const admin = getSupabaseAdminClient();
  if (admin) return admin;
  const url = getResolvedSupabaseUrl();
  const key = getResolvedSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured");
  }
  return createClient(url, key);
}

function normalizeIncomingCode(rawInput: string) {
  let s = rawInput.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  s = s
    .replace(/^\/(?:start|link|sync)(?:@[A-Za-z0-9_]+)?[_\s]*/i, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/С/g, "C")
    .replace(/с/g, "c")
    .replace(/Х/g, "X")
    .replace(/х/g, "x")
    .replace(/\s+/g, "");

  const cleanToken = s.replace(/^link_/i, "").trim().toLowerCase();
  let upperCode = s.toUpperCase();
  if (/^[0-9]{4,8}$/.test(upperCode)) {
    upperCode = `CX-${upperCode}`;
  } else if (/^CX[0-9]{4,8}$/.test(upperCode)) {
    upperCode = `CX-${upperCode.slice(2)}`;
  }

  return {
    raw: s,
    cleanToken,
    cleanCode: upperCode,
    compactCode: upperCode.replace(/[^A-Z0-9]/g, ""),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = String(body.code || body.token || "").trim();
    const telegramId = String(body.telegram_id || "").trim();
    const username = String(body.username || "").trim();
    const firstName = String(body.first_name || "").trim();
    const finalizeOnly = Boolean(body.finalizeOnly);
    const hintedUserId = String(body.user_id || "").trim();

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: "telegram_id обязателен" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fast finalize path: when bot already persisted link via service_role and calls site for referral/profile sync
    if (finalizeOnly && hintedUserId) {
      const { data: row } = await supabase
        .from("cxrner_cabinet_users")
        .select("user_id, profile")
        .eq("user_id", hintedUserId)
        .maybeSingle();

      const p = (row?.profile as Record<string, any>) || {};
      if (row && String(p.telegram_id || "") === telegramId) {
        try {
          await supabase
            .from("cxrner_profiles")
            .update({
              telegram_id: telegramId,
              telegram_username: username || null,
              telegram_linked: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", hintedUserId);
        } catch {
          // ignore if table not created
        }

        await evaluateReferralMilestones(hintedUserId, {
          telegramLinked: true,
        }).catch(() => {});

        const { count } = await supabase
          .from("cxrner_forms")
          .select("id", { count: "exact", head: true })
          .in("telegram_id", Array.from(new Set([hintedUserId, telegramId])));

        return NextResponse.json({
          ok: true,
          user_id: hintedUserId,
          artist_name: p.artist_name || "",
          telegram_id: telegramId,
          telegram_username: username,
          synced_releases_count: count || 0,
          message: "Аккаунт успешно синхронизирован!",
        });
      }
    }

    if (!rawCode) {
      return NextResponse.json({ ok: false, error: "Укажите код или токен привязки" }, { status: 400 });
    }

    const normalized = normalizeIncomingCode(rawCode);

    const { data: users, error: findError } = await supabase
      .from("cxrner_cabinet_users")
      .select("user_id, profile, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (findError) {
      return NextResponse.json({ ok: false, error: findError.message }, { status: 500 });
    }

    const matchedUser = (users || []).find((u) => {
      const p = (u.profile as Record<string, any>) || {};
      const storedCode = String(p.link_code || "").trim().toUpperCase();
      const storedCompact = storedCode.replace(/[^A-Z0-9]/g, "");
      const storedToken = String(p.link_token || "").trim().toLowerCase();

      const matchesCode = Boolean(
        storedCode &&
          (storedCode === normalized.cleanCode ||
            storedCode === normalized.raw.toUpperCase() ||
            (normalized.compactCode && storedCompact === normalized.compactCode))
      );
      const matchesToken = Boolean(
        storedToken &&
          (storedToken === normalized.cleanToken ||
            storedToken === normalized.raw.toLowerCase())
      );
      return matchesCode || matchesToken;
    });

    if (!matchedUser) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Код привязки не найден или срок его действия истёк. Сгенерируйте новый код в кабинете на сайте.",
        },
        { status: 404 }
      );
    }

    const currentProfile = (matchedUser.profile as Record<string, any>) || {};
    const now = new Date().toISOString();

    if (currentProfile.link_created_at) {
      const createdAt = new Date(currentProfile.link_created_at).getTime();
      if (Number.isFinite(createdAt)) {
        const diffMinutes = (Date.now() - createdAt) / (1000 * 60);
        if (diffMinutes > 15) {
          return NextResponse.json(
            {
              ok: false,
              error: "Срок действия кода истёк (15 минут). Запросите новый код в личном кабинете.",
            },
            { status: 410 }
          );
        }
      }
    }

    const existingEcoId =
      currentProfile.cxrner_id && typeof currentProfile.cxrner_id === "object"
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
      // ignore if table not present
    }

    await evaluateReferralMilestones(matchedUser.user_id, {
      telegramLinked: true,
    }).catch(() => {});

    // Count all non-deleted forms across both web UUID and numeric telegram_id WITHOUT overwriting numeric telegram_id
    let syncedFormsCount = 0;
    try {
      const lookupIds = Array.from(new Set([String(matchedUser.user_id), telegramId]));
      const { count } = await supabase
        .from("cxrner_forms")
        .select("id", { count: "exact", head: true })
        .in("telegram_id", lookupIds);
      syncedFormsCount = count || 0;
    } catch (e: any) {
      console.warn("[verify-link] Could not count synced forms:", e.message);
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
