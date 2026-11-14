import { NextResponse } from "next/server";
import { getRadarSmartLinks, recordLinkClickEvent } from "@/lib/smartLinksDb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { awardCxp } from "@/lib/ecosystemDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const links = await getRadarSmartLinks(20);
    return NextResponse.json({ ok: true, links });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load radar chart", links: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const linkId = String(body?.linkId || "").trim();
    if (!linkId) {
      return NextResponse.json({ ok: false, error: "Missing linkId" }, { status: 400 });
    }

    const res = await recordLinkClickEvent({
      linkId,
      eventType: "hype",
    });
    let cxpAwarded = 0;

    try {
      const supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        const awardRes = await awardCxp({
          userId: user.id,
          amount: 5,
          reason: "Голос в чарте CXRNER RADAR (+5 CXP)",
          sourceEventType: "radar_vote",
          sourceEventId: `radar_vote_${linkId}_${new Date().toISOString().slice(0, 10)}`,
        });
        if (awardRes.ok) {
          cxpAwarded = 5;
        }
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      hypeCount: res.hypeCount,
      cxpAwarded,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Radar vote failed" },
      { status: 500 }
    );
  }
}
