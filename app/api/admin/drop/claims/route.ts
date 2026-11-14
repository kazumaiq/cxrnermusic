import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import {
  getAllSpecialRewardClaims,
  updateSpecialClaimStatus,
  getDropAnalytics,
  adminGrantDropItem,
  adminRevokeDropItem,
  adminSetExactCxpBalance,
  awardCxp,
  recordAdminAudit,
} from "@/lib/ecosystemDb";

export async function GET(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminRequest(req);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const [claims, analytics] = await Promise.all([
      getAllSpecialRewardClaims(),
      getDropAnalytics(),
    ]);
    return NextResponse.json({ ok: true, claims, analytics });
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

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminRequest(req);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const adminUser = await getAdminUser();
    const adminId = adminUser?.email || "admin";
    const body = await req.json();
    const { action, userId } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { ok: false, error: "userId and action are required" },
        { status: 400 }
      );
    }

    if (action === "admin_grant_item") {
      const { specimenId, note } = body;
      if (!specimenId) {
        return NextResponse.json({ ok: false, error: "specimenId is required" }, { status: 400 });
      }
      const res = await adminGrantDropItem({
        targetUserId: userId,
        itemId: specimenId,
        adminEmail: adminId,
        reason: note,
      });
      const analytics = await getDropAnalytics();
      return NextResponse.json({ ok: res.ok, item: res.item, analytics });
    }

    if (action === "admin_revoke_item") {
      const { inventoryItemId } = body;
      if (!inventoryItemId) {
        return NextResponse.json(
          { ok: false, error: "inventoryItemId is required" },
          { status: 400 }
        );
      }
      const res = await adminRevokeDropItem({
        targetUserId: userId,
        inventoryItemId,
        adminEmail: adminId,
      });
      const analytics = await getDropAnalytics();
      return NextResponse.json({ ok: res.ok, analytics });
    }

    if (action === "admin_adjust_cxp") {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount === 0) {
        return NextResponse.json({ ok: false, error: "Некорректная сумма CXP" }, { status: 400 });
      }
      const res = await awardCxp({
        userId,
        amount,
        reason: body.reason || `Корректировка баланса админом (${adminId})`,
        sourceEventType: "admin_grant",
        sourceEventId: `admin_drop_${Date.now()}`,
      });
      await recordAdminAudit({
        adminEmail: adminId,
        action: "adjust_cxp",
        targetUserId: userId,
        details: { amount, newBalance: res.newBalance, reason: body.reason },
      });
      const analytics = await getDropAnalytics();
      return NextResponse.json({ ok: res.ok, newBalance: res.newBalance, analytics });
    }

    if (action === "admin_set_cxp") {
      const balance = Number(body.balance);
      if (!Number.isFinite(balance) || balance < 0) {
        return NextResponse.json({ ok: false, error: "Некорректный баланс CXP" }, { status: 400 });
      }
      const res = await adminSetExactCxpBalance({
        targetUserId: userId,
        newBalance: balance,
        adminEmail: adminId,
        reason: body.reason || "Установка точного баланса CXP в админке DROP",
      });
      const analytics = await getDropAnalytics();
      return NextResponse.json({ ok: res.ok, newBalance: res.newBalance, analytics });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
