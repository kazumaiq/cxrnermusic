import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  claimDailyDropScan,
  salvageInventoryItem,
  fuseInventoryItems,
  getGlobalLiveDrops,
  getDailyDropScanStatus,
  getCollectorsLeaderboard,
  runCaseBattle,
  createDropGift,
  claimDropGiftOrPromo,
  awardCxp,
} from "@/lib/ecosystemDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/cabinet/drop/actions
 * Returns live global drop feed + Hall of Fame leaderboard + daily scan status.
 */
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

    const [liveFeed, leaderboard, dailyScan] = await Promise.all([
      getGlobalLiveDrops(15),
      getCollectorsLeaderboard(10),
      userId ? getDailyDropScanStatus(userId) : Promise.resolve(null),
    ]);
    return NextResponse.json({
      ok: true,
      feed: liveFeed,
      liveFeed,
      leaderboard,
      dailyScan,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load drop feed", feed: [], liveFeed: [], leaderboard: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: "Войдите в аккаунт для выполнения операции в CXRNER DROP" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "daily_scan") {
      const res = await claimDailyDropScan(user.id);
      return NextResponse.json({
        ...res,
        dailyScan: res.status,
      });
    }

    if (action === "salvage") {
      const targetId = String(body?.inventoryItemId || body?.itemId || "");
      const res = await salvageInventoryItem({
        userId: user.id,
        inventoryItemId: targetId,
      });
      return NextResponse.json(res);
    }

    if (action === "fuse") {
      const itemIds = Array.isArray(body?.itemIds) ? body.itemIds.map(String) : [];
      const res = await fuseInventoryItems({
        userId: user.id,
        itemIds,
      });
      const liveFeed = await getGlobalLiveDrops(15).catch(() => []);
      return NextResponse.json({ ...res, liveFeed });
    }

    if (action === "case_battle") {
      const caseId = String(body?.caseId || "case_001_archive");
      const res = await runCaseBattle({
        userId: user.id,
        caseId,
        opponentName: body?.opponentName,
      });
      if (!res.ok) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "create_gift") {
      const res = await createDropGift({
        userId: user.id,
        inventoryItemId: body?.inventoryItemId,
      });
      if (!res.ok) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "claim_promo") {
      const res = await claimDropGiftOrPromo({
        userId: user.id,
        code: String(body?.code || ""),
      });
      if (!res.ok) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "sound_scan_reward") {
      const todayKey = new Date().toISOString().slice(0, 10);
      const res = await awardCxp({
        userId: user.id,
        amount: 25,
        reason: "Анализ демо-трека в CXRNER SOUND LAB (+25 CXP)",
        sourceEventType: "sound_scan_reward",
        sourceEventId: `sound_scan_${todayKey}`,
      });
      return NextResponse.json({
        ok: true,
        cxpAwarded: res.ok ? 25 : 0,
        newBalance: res.newBalance,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Неизвестное действие" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Внутренняя ошибка сервера" },
      { status: 400 }
    );
  }
}
