import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { recordReferralAttribution } from "@/lib/ecosystemDb";
import crypto from "node:crypto";

const ERROR_MESSAGES: Record<string, string> = {
  REFERRAL_CODE_REQUIRED: "Укажите реферальный код пригласившего",
  REFERRER_NOT_FOUND: "Реферальный код не найден",
  SELF_REFERRAL_FORBIDDEN: "Нельзя использовать собственный реферальный код",
  ALREADY_ATTRIBUTED: "К вашему аккаунту уже привязан пригласивший пользователь",
};

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const cookieStore = await cookies();
    const cookieCode = cookieStore.get("cxrner_ref_code")?.value || "";
    const metaCode =
      typeof (user.user_metadata as any)?.referred_by_code === "string"
        ? (user.user_metadata as any).referred_by_code
        : "";

    const rawCode =
      (typeof body?.referralCode === "string" ? body.referralCode : "") ||
      cookieCode ||
      metaCode;
    const referralCode = rawCode.trim();

    if (!referralCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "REFERRAL_CODE_REQUIRED",
          message: ERROR_MESSAGES.REFERRAL_CODE_REQUIRED,
        },
        { status: 400 }
      );
    }

    // Hash client IP or forward headers for anti-fraud logging
    const forwardIp = request.headers.get("x-forwarded-for") || "local";
    const ipHash = crypto.createHash("sha256").update(forwardIp).digest("hex").slice(0, 16);

    const result = await recordReferralAttribution({
      referrerCode: referralCode,
      newUserId: user.id,
      ipHash,
      emailVerified: Boolean(user.email_confirmed_at || user.confirmed_at),
    });

    if (!result.ok) {
      const errCode = result.error || "UNKNOWN_ERROR";
      const res = NextResponse.json(
        {
          ok: false,
          error: errCode,
          message: ERROR_MESSAGES[errCode] || errCode,
        },
        { status: 400 }
      );
      if (
        errCode === "ALREADY_ATTRIBUTED" ||
        errCode === "SELF_REFERRAL_FORBIDDEN" ||
        errCode === "REFERRER_NOT_FOUND"
      ) {
        res.cookies.delete("cxrner_ref_code");
      }
      return res;
    }

    const res = NextResponse.json({ ok: true, attribution: result.attribution });
    res.cookies.delete("cxrner_ref_code");
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
