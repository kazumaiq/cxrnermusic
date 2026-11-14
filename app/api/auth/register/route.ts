import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  upsertUserProfile,
  sanitizeUsername,
  recordReferralAttribution,
} from "@/lib/ecosystemDb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanEmail = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const artistName = String(body.artistName || "").trim();
    const refCode = String(body.refCode || "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Введите корректный Email" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({
        ok: false,
        useClientSignUp: true,
        error: "ADMIN_UNAVAILABLE",
      });
    }

    const initialName = artistName || cleanEmail.split("@")[0] || "CXRNER Artist";
    const initialUsername = sanitizeUsername(initialName) || `artist_${Date.now().toString(36).slice(-6)}`;

    const { data, error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        artist_name: initialName,
        username: initialUsername,
        ...(refCode ? { referred_by_code: refCode } : {}),
      },
    });

    if (error) {
      const msg = error.message || "";
      if (
        msg.toLowerCase().includes("already been registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("duplicate")
      ) {
        return NextResponse.json(
          {
            ok: false,
            alreadyExists: true,
            error: "Аккаунт с этим Email уже зарегистрирован. Нажмите «Войти в кабинет».",
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const user = data?.user;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Не удалось создать пользователя" },
        { status: 500 }
      );
    }

    try {
      await admin.from("cxrner_cabinet_users").upsert(
        {
          user_id: user.id,
          profile: {
            artist_name: initialName,
            email: cleanEmail,
            ...(refCode ? { referred_by_code: refCode } : {}),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      await upsertUserProfile({
        userId: user.id,
        userEmail: cleanEmail,
        username: initialUsername,
        displayName: initialName,
      });

      if (refCode) {
        await recordReferralAttribution({
          referrerCode: refCode,
          newUserId: user.id,
          emailVerified: true,
        }).catch(() => {});
      }
    } catch {
      // non-fatal provisioning errors; client login will re-sync
    }

    return NextResponse.json({
      ok: true,
      autoConfirmed: true,
      userId: user.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Ошибка регистрации" },
      { status: 500 }
    );
  }
}
