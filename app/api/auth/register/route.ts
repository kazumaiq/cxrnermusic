import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  buildCanonicalOrigin,
  isValidEmail,
  localizeAuthError,
} from "@/lib/authUtils";
import {
  buildWelcomeEmail,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/email";
import {
  upsertUserProfile,
  sanitizeUsername,
  recordReferralAttribution,
  CEO_EMAIL,
  CEO_USERNAME,
} from "@/lib/ecosystemDb";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const artistName = String(body.artistName || "").trim();
    const refCode = String(body.refCode || "").trim();

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { ok: false, error: "Укажите корректный Email-адрес (например, artist@gmail.com)" },
        { status: 400 }
      );
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
    const candidateUsername =
      sanitizeUsername(initialName) || `artist_${Date.now().toString(36).slice(-6)}`;
    const initialUsername =
      cleanEmail === CEO_EMAIL
        ? CEO_USERNAME
        : candidateUsername === CEO_USERNAME
        ? `artist_${Date.now().toString(36).slice(-6)}`
        : candidateUsername;

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
      const lower = msg.toLowerCase();
      if (
        lower.includes("already been registered") ||
        lower.includes("already exists") ||
        lower.includes("duplicate")
      ) {
        return NextResponse.json(
          {
            ok: false,
            alreadyExists: true,
            error: "Аккаунт с этим Email уже зарегистрирован. Нажмите «Войти в кабинет» или восстановите пароль.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: localizeAuthError(error) },
        { status: 400 }
      );
    }

    const user = data?.user;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Не удалось создать пользователя. Попробуйте ещё раз." },
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
      // non-fatal provisioning errors; login callback will re-sync
    }

    if (isResendConfigured()) {
      const origin = buildCanonicalOrigin(request);
      const welcome = buildWelcomeEmail({
        artistName: initialName,
        dashboardUrl: `${origin}/dashboard`,
      });
      await sendTransactionalEmail({
        to: cleanEmail,
        ...welcome,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      autoConfirmed: true,
      userId: user.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: localizeAuthError(err, "Ошибка регистрации") },
      { status: 500 }
    );
  }
}
