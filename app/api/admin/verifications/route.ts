import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import { processVerificationReview, recordAdminAudit } from "@/lib/ecosystemDb";

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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";

    const supabase = getServiceSupabase();

    let query = supabase
      .from("cxrner_artist_verifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    let applications: any[] = [];
    try {
      const { data } = await query;
      applications = data || [];
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, applications });
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
    const reviewerEmail = adminUser?.email || "admin@cxrnermusic.com";

    const body = await request.json();
    const { verificationId, targetUserId, decision, notes, rejectReason } = body;

    if (!targetUserId || !decision) {
      return NextResponse.json(
        { ok: false, error: "targetUserId и decision обязательны" },
        { status: 400 }
      );
    }

    if (decision === "rejected" && !rejectReason) {
      return NextResponse.json(
        { ok: false, error: "При отклонении заявки необходимо указать причину" },
        { status: 400 }
      );
    }

    const result = await processVerificationReview({
      verificationId,
      targetUserId,
      decision,
      reviewerEmail,
      notes,
      rejectReason,
    });

    await recordAdminAudit({
      adminEmail: reviewerEmail,
      action: `verification_${decision}`,
      targetUserId,
      details: { decision, notes, rejectReason },
    });

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
