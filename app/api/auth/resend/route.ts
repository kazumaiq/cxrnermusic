import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  buildCanonicalOrigin,
  isValidEmail,
  localizeAuthError,
  sanitizeRedirectPath,
} from "@/lib/authUtils";
import {
  buildConfirmEmail,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = String(body.email || "").trim().toLowerCase();
    const safeNext = sanitizeRedirectPath(body.next, "/dashboard");

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { ok: false, error: "Укажите корректный Email-адрес" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    if (!admin || !isResendConfigured()) {
      return NextResponse.json({
        ok: false,
        useClientResend: true,
      });
    }

    const origin = buildCanonicalOrigin(request);
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
      options: { redirectTo },
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: localizeAuthError(error), useClientResend: true },
        { status: 200 }
      );
    }

    const hashedToken = data?.properties?.hashed_token;
    const confirmUrl = hashedToken
      ? `${origin}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent(safeNext)}`
      : data?.properties?.action_link;

    if (!confirmUrl) {
      return NextResponse.json({ ok: false, useClientResend: true });
    }

    const mail = buildConfirmEmail({ confirmUrl });
    const sendRes = await sendTransactionalEmail({
      to: cleanEmail,
      ...mail,
    });

    if (!sendRes.sent) {
      return NextResponse.json({
        ok: false,
        useClientResend: true,
        reason: sendRes.reason,
      });
    }

    return NextResponse.json({
      ok: true,
      delivery: "resend",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: localizeAuthError(err), useClientResend: true },
      { status: 200 }
    );
  }
}
