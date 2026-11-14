import { NextResponse } from "next/server";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import {
  getAllVerifications,
  processVerificationReview,
  recordAdminAudit,
} from "@/lib/ecosystemDb";

export async function GET(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";

    const applications = await getAllVerifications(statusFilter);

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
