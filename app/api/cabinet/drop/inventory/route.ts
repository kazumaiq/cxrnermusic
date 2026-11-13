import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getUserInventory, updateItemDisplayStatus } from "@/lib/ecosystemDb";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const items = await getUserInventory(user.id);
    const pinnedCount = items.filter((i) => i.is_pinned).length;

    return NextResponse.json({
      ok: true,
      items,
      pinnedCount,
      maxPinned: 6,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, isPinned, isHidden, isEquipped } = body;

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "ITEM_ID_REQUIRED" }, { status: 400 });
    }

    // Check max 6 pinned items if trying to pin
    if (isPinned === true) {
      const currentItems = await getUserInventory(user.id);
      const currentPinned = currentItems.filter((i) => i.is_pinned && i.id !== itemId).length;
      if (currentPinned >= 6) {
        return NextResponse.json(
          { ok: false, error: "Максимум 6 предметов на витрине профиля" },
          { status: 400 }
        );
      }
    }

    await updateItemDisplayStatus({
      userId: user.id,
      itemId,
      isPinned,
      isHidden,
      isEquipped,
    });

    const updatedItems = await getUserInventory(user.id);

    return NextResponse.json({ ok: true, items: updatedItems });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
