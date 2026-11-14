import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { recordLinkClickEvent } from "@/lib/smartLinksDb";
import crypto from "node:crypto";

function isBot(userAgent: string): boolean {
  const botPattern = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|vkshare|preview/i;
  return botPattern.test(userAgent);
}

function detectDevice(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent)) {
    return "tablet";
  }
  if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo)/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { smart_link_id, event_type, platform_key, referrer } = body;

    if (!smart_link_id || !event_type) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, ignored: "bot" });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const visitorHash = crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}-${new Date().toISOString().slice(0, 10)}`)
      .digest("hex")
      .slice(0, 16);

    const device = detectDevice(userAgent);
    const country = request.headers.get("x-vercel-ip-country") || "RU";

    // 1. Dual-engine update (table + profile fallback)
    const clickResult = await recordLinkClickEvent({
      linkId: smart_link_id,
      eventType: event_type,
      platformKey: platform_key,
    });

    // 2. Try recording granular event row if table exists
    try {
      const supabase = await getSupabaseServerClient();
      await supabase.from("smart_link_analytics").insert({
        smart_link_id,
        event_type,
        platform_key: platform_key || null,
        visitor_hash: visitorHash,
        referrer: referrer ? String(referrer).slice(0, 256) : null,
        country,
        device,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      hypeCount: clickResult.hypeCount,
      cxpAwarded: clickResult.cxpAwarded,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
