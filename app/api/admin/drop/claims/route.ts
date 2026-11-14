import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import { getAllSpecialRewardClaims, updateSpecialClaimStatus } from "@/lib/ecosystemDb";

export async function GET(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminRequest(req);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const claims = await getAllSpecialRewardClaims();
    return NextResponse.json({ ok: true, claims });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminRequest(req);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const adminUser = await getAdminUser();
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
      adminId: adminUser?.email || "admin",
    });

    return NextResponse.json({ ok: success });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
