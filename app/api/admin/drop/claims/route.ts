import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getAllSpecialRewardClaims, updateSpecialClaimStatus } from "@/lib/ecosystemDb";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Allow authenticated admins or fallback
    const claims = await getAllSpecialRewardClaims();
    return NextResponse.json({ ok: true, claims });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { claimId, status, notes } = body;

    if (!claimId || !status) {
      return NextResponse.json(
        { ok: false, error: "claimId and status are required" },
        { status: 400 }
      );
    }

    const success = await updateSpecialClaimStatus({
      claimId,
      status,
      notes,
      adminId: user?.email || "admin",
    });

    return NextResponse.json({ ok: success });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
