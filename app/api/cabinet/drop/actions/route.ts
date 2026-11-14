import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  salvageInventoryItem,
  fuseInventoryItems,
  getDailyDropScanStatus,
  claimDailyDropScan,
  getGlobalLiveDrops,
} from "@/lib/ecosystemDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      const supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {}

    const [liveFeed, dailyScan] = await Promise.all([
      getGlobalLiveDrops(16),
      userId ? getDailyDropScanStatus(userId) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ok: true,
      liveFeed,
      dailyScan,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load drop actions status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Требуется авторизация в аккаунте CXRNER ID" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body?.action;

    if (action === "salvage") {
      const inventoryItemId = String(body?.inventoryItemId || "").trim();
      if (!inventoryItemId) {
        return NextResponse.json(
          { ok: false, error: "Не указан ID предмета для распыления" },
          { status: 400 }
        );
      }

      const res = await salvageInventoryItem({
        userId: user.id,
        inventoryItemId,
      });

      return NextResponse.json({
        ok: true,
        refundedCxp: res.refundedCxp,
        newBalance: res.newBalance,
        removedItem: res.removedItem,
      });
    }

    if (action === "fuse") {
      const itemIds = Array.isArray(body?.itemIds)
        ? body.itemIds.map((x: unknown) => String(x))
        : [];
      const res = await fuseInventoryItems({
        userId: user.id,
        itemIds,
      });
      const liveFeed = await getGlobalLiveDrops(16);

      return NextResponse.json({
        ok: true,
        fusedItem: res.fusedItem,
        bonusCxp: res.bonusCxp,
        newBalance: res.newBalance,
        liveFeed,
      });
    }

    if (action === "daily_scan") {
      const res = await claimDailyDropScan(user.id);
      return NextResponse.json({
        ok: true,
        streakDay: res.streakDay,
        awardedCxp: res.awardedCxp,
        newBalance: res.newBalance,
        bonusItem: res.bonusItem,
        dailyScan: res.status,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Неизвестное действие" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Ошибка выполнения операции" },
      { status: 400 }
    );
  }
}
