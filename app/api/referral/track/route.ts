import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { recordReferralAttribution } from "@/lib/ecosystemDb";
import crypto from "node:crypto";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode || !referralCode.trim()) {
      return NextResponse.json({ ok: false, error: "REFERRAL_CODE_REQUIRED" }, { status: 400 });
    }

    // Hash client IP or forward headers for anti-fraud logging
    const forwardIp = request.headers.get("x-forwarded-for") || "local";
    const ipHash = crypto.createHash("sha256").update(forwardIp).digest("hex").slice(0, 16);

    const result = await recordReferralAttribution({
      referrerCode: referralCode.trim(),
      newUserId: user.id,
      ipHash,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, attribution: result.attribution });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
