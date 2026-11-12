import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/admin";
import { getSmartLinkById } from "@/lib/smartLinksDb";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d"; // 'today', '7d', '30d', '90d', 'all'

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Требуется авторизация" }, { status: 401 });
    }

    const isAdmin = isAdminUser(user);

    const { link, platforms: linkPlatforms } = await getSmartLinkById(id, isAdmin ? undefined : user.id);

    if (!link) {
      return NextResponse.json({ success: false, error: "Smart Link не найден" }, { status: 404 });
    }

    // Determine timestamp threshold
    let startDate: Date | null = null;
    const now = new Date();
    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 86400000);
    } else if (range === "90d") {
      startDate = new Date(now.getTime() - 90 * 86400000);
    }

    let events: any[] = [];
    try {
      let analyticsQuery = supabase
        .from("smart_link_analytics")
        .select("event_type, platform_key, visitor_hash, country, device, created_at")
        .eq("smart_link_id", id);

      if (startDate) {
        analyticsQuery = analyticsQuery.gte("created_at", startDate.toISOString());
      }

      const { data: evData } = await analyticsQuery;
      if (Array.isArray(evData)) {
        events = evData;
      }
    } catch {}

    let views = 0;
    let clicks = 0;
    let presaves = 0;
    const uniqueVisitors = new Set<string>();
    const platformCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    const countryCounts: Record<string, number> = {};
    const dailyMap: Record<string, { date: string; views: number; clicks: number; presaves: number }> = {};

    events.forEach((ev: any) => {
      if (ev.visitor_hash) uniqueVisitors.add(ev.visitor_hash);

      const day = ev.created_at ? ev.created_at.slice(0, 10) : "";
      if (day) {
        if (!dailyMap[day]) {
          dailyMap[day] = { date: day, views: 0, clicks: 0, presaves: 0 };
        }

        if (ev.event_type === "view") {
          views++;
          dailyMap[day].views++;
        } else if (ev.event_type === "click") {
          clicks++;
          dailyMap[day].clicks++;
          if (ev.platform_key) {
            platformCounts[ev.platform_key] = (platformCounts[ev.platform_key] || 0) + 1;
          }
        } else if (ev.event_type === "presave") {
          presaves++;
          dailyMap[day].presaves++;
        }
      }

      if (ev.device && typeof deviceCounts[ev.device] === "number") {
        deviceCounts[ev.device]++;
      }
      if (ev.country) {
        countryCounts[ev.country] = (countryCounts[ev.country] || 0) + 1;
      }
    });

    // If events table is empty, backfill from link aggregate counters
    if (views === 0 && (link.views_count || 0) > 0) {
      views = link.views_count || 0;
    }
    if (clicks === 0 && (link.clicks_count || 0) > 0) {
      clicks = link.clicks_count || 0;
    }
    if (presaves === 0 && (link.presaves_count || 0) > 0) {
      presaves = link.presaves_count || 0;
    }

    // Backfill per-platform clicks if events didn't capture them
    if (Object.keys(platformCounts).length === 0) {
      if (link.analytics_clicks && typeof link.analytics_clicks === "object") {
        Object.entries(link.analytics_clicks).forEach(([pk, count]) => {
          if (typeof count === "number" && count > 0) {
            platformCounts[pk] = count;
          }
        });
      }
      (linkPlatforms || []).forEach((pl: any) => {
        if (pl.clicks_count && pl.clicks_count > 0 && !platformCounts[pl.platform_key]) {
          platformCounts[pl.platform_key] = pl.clicks_count;
        }
      });
    }

    if (uniqueVisitors.size === 0 && views > 0) {
      uniqueVisitors.add("v-1");
    }

    const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;
    const timeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      stats: {
        views,
        clicks,
        presaves,
        uniqueVisitors: Math.max(uniqueVisitors.size, views > 0 ? 1 : 0),
        ctr,
      },
      platforms: platformCounts,
      devices: deviceCounts,
      countries: countryCounts,
      timeline,
    });
  } catch (error: any) {
    console.error("Link Analytics Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Ошибка получения аналитики" },
      { status: 500 }
    );
  }
}
