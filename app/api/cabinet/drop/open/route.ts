import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { openDropCase, awardCxp } from "@/lib/ecosystemDb";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Award initial CXP if brand new wallet, or deduct standard case fee 50 CXP
    const dropCost = 50;
    // Check wallet
    let balance = 100;
    try {
      const { data: wallet } = await supabase
        .from("cxrner_cxp_wallet")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wallet) {
        balance = wallet.balance;
      }
    } catch {
      // ignore
    }

    if (balance < dropCost) {
      return NextResponse.json(
        {
          ok: false,
          error: "Недостаточно CXP для открытия кейса. Заполните профиль или пригласите артиста для получения CXP.",
          currentBalance: balance,
          required: dropCost,
        },
        { status: 400 }
      );
    }

    // Deduct CXP atomically
    await awardCxp({
      userId: user.id,
      amount: -dropCost,
      reason: "Открытие кейса CXRNER DROP",
      sourceEventType: "drop_case_open",
      sourceEventId: `case_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    });

    const result = await openDropCase(user.id);

    return NextResponse.json({
      ok: true,
      item: result.item,
      duplicate: result.duplicate,
      achievementsUnlocked: result.achievementsUnlocked,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
