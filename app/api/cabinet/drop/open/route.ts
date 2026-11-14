import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { openDropCase, awardCxp, getCxpWallet } from "@/lib/ecosystemDb";
import { DROP_CASES } from "@/lib/ecosystemTypes";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const caseId = (body && body.caseId) || "case_001_archive";

    const targetCase = DROP_CASES.find((c) => c.id === caseId) || DROP_CASES[0];
    const dropCost = targetCase.price_cxp;

    // Check user wallet balance
    const wallet = await getCxpWallet(user.id);
    const balance = wallet.balance;

    if (balance < dropCost) {
      return NextResponse.json(
        {
          ok: false,
          error: `Недостаточно CXP для открытия ${targetCase.name}. Требуется: ${dropCost} CXP. Текущий баланс: ${balance} CXP.`,
          currentBalance: balance,
          required: dropCost,
        },
        { status: 400 }
      );
    }

    // Deduct CXP atomically
    const eventId = `case_${targetCase.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const debitRes = await awardCxp({
      userId: user.id,
      amount: -dropCost,
      reason: `Открытие кейса ${targetCase.name}`,
      sourceEventType: "drop_case_open",
      sourceEventId: eventId,
    });

    if (!debitRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: debitRes.error || "Ошибка списания CXP",
          currentBalance: balance,
          required: dropCost,
        },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await openDropCase({
        userId: user.id,
        caseId: targetCase.id,
      });
    } catch (openErr: any) {
      // Refund CXP on unexpected opening failure
      await awardCxp({
        userId: user.id,
        amount: dropCost,
        reason: `Возврат CXP (ошибка открытия ${targetCase.name})`,
        sourceEventType: "drop_case_refund",
        sourceEventId: `refund_${eventId}`,
      }).catch(() => {});
      throw openErr;
    }

    const updatedWallet = await getCxpWallet(user.id);

    return NextResponse.json({
      ok: true,
      item: result.item,
      duplicate: result.duplicate,
      achievementsUnlocked: result.achievementsUnlocked,
      isSpecialReward: result.isSpecialReward,
      claimCode: result.claimCode,
      historyEntry: result.historyEntry,
      caseConfig: result.caseConfig,
      balanceAfter: updatedWallet.balance,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
