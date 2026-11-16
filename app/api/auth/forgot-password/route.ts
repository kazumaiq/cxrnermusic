import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  buildCanonicalOrigin,
  isValidEmail,
  localizeAuthError,
} from "@/lib/authUtils";
import {
  buildRecoveryEmail,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = String(body.email || "").trim().toLowerCase();

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
        useClientReset: true,
      });
    }

    const origin = buildCanonicalOrigin(request);
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: cleanEmail,
      options: { redirectTo },
    });

    if (error) {
      const lower = String(error.message || "").toLowerCase();
      // Do not leak whether a specific email exists; respond neutrally on unknown user
      if (lower.includes("not found") || lower.includes("unable to find")) {
        return NextResponse.json({
          ok: true,
          delivery: "resend",
        });
      }
      return NextResponse.json({
        ok: false,
        useClientReset: true,
        error: localizeAuthError(error),
      });
    }

    const hashedToken = data?.properties?.hashed_token;
    const recoveryUrl = hashedToken
      ? `${origin}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=recovery&next=${encodeURIComponent("/auth/reset-password")}`
      : data?.properties?.action_link;

    if (!recoveryUrl) {
      return NextResponse.json({ ok: false, useClientReset: true });
    }

    const mail = buildRecoveryEmail({ recoveryUrl });
    const sendRes = await sendTransactionalEmail({
      to: cleanEmail,
      ...mail,
    });

    if (!sendRes.sent) {
      return NextResponse.json({
        ok: false,
        useClientReset: true,
        reason: sendRes.reason,
      });
    }

    return NextResponse.json({
      ok: true,
      delivery: "resend",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: localizeAuthError(err), useClientReset: true },
      { status: 200 }
    );
  }
}
