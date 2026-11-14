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

    let result;
    try {
      result = await openDropCase({
        userId: user.id,
        caseId: targetCase.id,
        deductCost: true,
      });
    } catch (openErr: any) {
      const msg = String(openErr?.message || "Ошибка открытия кейса");
      if (msg.includes("Недостаточно CXP")) {
        return NextResponse.json(
          {
            ok: false,
            error: msg,
            required: targetCase.price_cxp,
          },
          { status: 400 }
        );
      }
      throw openErr;
    }

    const finalBalance =
      typeof result.balanceAfter === "number"
        ? result.balanceAfter
        : (await getCxpWallet(user.id)).balance;

    return NextResponse.json({
      ok: true,
      item: result.item,
      duplicate: result.duplicate,
      achievementsUnlocked: result.achievementsUnlocked,
      isSpecialReward: result.isSpecialReward,
      claimCode: result.claimCode,
      historyEntry: result.historyEntry,
      caseConfig: result.caseConfig,
      balanceAfter: finalBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
