import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getReferralStatsForUser, getReferralLeaderboard } from "@/lib/ecosystemDb";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const stats = await getReferralStatsForUser(user.id);
    const leaderboard = await getReferralLeaderboard();

    return NextResponse.json({
      ok: true,
      stats,
      leaderboard,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
