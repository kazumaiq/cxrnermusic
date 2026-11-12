import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
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
      // Quietly ignore bot traffic from analytical metrics
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

    const supabase = await getSupabaseServerClient();

    // 1. Record granular analytics row
    await supabase.from("smart_link_analytics").insert({
      smart_link_id,
      event_type,
      platform_key: platform_key || null,
      visitor_hash: visitorHash,
      referrer: referrer ? String(referrer).slice(0, 256) : null,
      country,
      device,
    });

    // 2. Increment aggregate counter on smart_links table
    if (event_type === "view") {
      const { error: rpcErr } = await supabase.rpc("increment_smart_link_views", { link_id: smart_link_id });
      if (rpcErr) {
        // Fallback direct update if RPC is not yet registered in SQL
        const { data: cur } = await supabase.from("smart_links").select("views_count").eq("id", smart_link_id).single();
        if (cur) {
          await supabase.from("smart_links").update({ views_count: (cur.views_count || 0) + 1 }).eq("id", smart_link_id);
        }
      }
    } else if (event_type === "click") {
      const { error: rpcErr } = await supabase.rpc("increment_smart_link_clicks", { link_id: smart_link_id });
      if (rpcErr) {
        const { data: cur } = await supabase.from("smart_links").select("clicks_count").eq("id", smart_link_id).single();
        if (cur) {
          await supabase.from("smart_links").update({ clicks_count: (cur.clicks_count || 0) + 1 }).eq("id", smart_link_id);
        }
      }

      // Also increment platform clicks count
      if (platform_key) {
        const { data: pCur } = await supabase
          .from("smart_link_platforms")
          .select("id, clicks_count")
          .eq("smart_link_id", smart_link_id)
          .eq("platform_key", platform_key)
          .maybeSingle();
        if (pCur) {
          await supabase
            .from("smart_link_platforms")
            .update({ clicks_count: (pCur.clicks_count || 0) + 1 })
            .eq("id", pCur.id);
        }
      }
    } else if (event_type === "presave") {
      const { data: cur } = await supabase.from("smart_links").select("presaves_count").eq("id", smart_link_id).single();
      if (cur) {
        await supabase.from("smart_links").update({ presaves_count: (cur.presaves_count || 0) + 1 }).eq("id", smart_link_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
