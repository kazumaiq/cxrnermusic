import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import { getReferralLeaderboard, recordAdminAudit } from "@/lib/ecosystemDb";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured");
  }
  return createClient(url, key);
}

export async function GET(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    let referrals: any[] = [];
    let rewards: any[] = [];
    try {
      const { data: refData } = await supabase.from("cxrner_referrals").select("*");
      referrals = refData || [];

      const { data: rewData } = await supabase.from("cxrner_referral_rewards").select("*");
      rewards = rewData || [];
    } catch {
      // ignore
    }

    const totalRegistrations = referrals.length;
    const qualifiedCount = referrals.filter((r) => r.is_qualified).length;
    const fraudCount = referrals.filter((r) => r.status === "flagged_fraud").length;

    let totalCxpAwarded = 0;
    rewards.forEach((r) => {
      if (r.status === "granted") {
        totalCxpAwarded += r.cxp_amount || 0;
      }
    });

    const leaderboard = await getReferralLeaderboard();

    return NextResponse.json({
      ok: true,
      stats: {
        totalRegistrations,
        qualifiedCount,
        fraudCount,
        totalCxpAwarded,
        conversionRate: totalRegistrations > 0 ? Math.round((qualifiedCount / totalRegistrations) * 100) : 0,
      },
      leaderboard,
      fraudQueue: referrals.filter((r) => r.status === "flagged_fraud" || r.fraud_reason),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const adminUser = await getAdminUser();
    const adminEmail = adminUser?.email || "admin@cxrnermusic.com";

    const body = await request.json();
    const { action, referralId, targetUserId, reason } = body;

    const supabase = getServiceSupabase();

    if (action === "flag_fraud") {
      try {
        await supabase
          .from("cxrner_referrals")
          .update({
            status: "flagged_fraud",
            fraud_reason: reason || "Suspicious referral activity flagged by admin",
            is_qualified: false,
          })
          .eq("id", referralId);
      } catch {
        // ignore
      }

      await recordAdminAudit({
        adminEmail,
        action: "referral_flag_fraud",
        targetUserId,
        details: { referralId, reason },
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "approve_suspicious") {
      try {
        await supabase
          .from("cxrner_referrals")
          .update({
            status: "qualified",
            fraud_reason: null,
            is_qualified: true,
          })
          .eq("id", referralId);
      } catch {
        // ignore
      }

      await recordAdminAudit({
        adminEmail,
        action: "referral_approve_suspicious",
        targetUserId,
        details: { referralId },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
