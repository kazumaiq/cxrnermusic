import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, releases: [] }, { status: 401 });
    }

    const dbClient = getSupabaseAdminClient() || supabase;

    const { data: profileRow } = await dbClient
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const linkedTgId = profileRow?.profile?.telegram_id
      ? String(profileRow.profile.telegram_id)
      : null;

    const lookupIds = Array.from(
      new Set([String(user.id || "").trim(), String(linkedTgId || "").trim()].filter(Boolean))
    );

    const { data: rows = [] } = await dbClient
      .from("cxrner_forms")
      .select("*")
      .in("telegram_id", lookupIds)
      .order("created_at", { ascending: false })
      .limit(50);

    const releases = (rows || []).map((row: any) => {
      const payload = row.form_payload || {};
      const coverUrl =
        payload.cover_url ||
        payload.artwork_url ||
        payload.cover ||
        payload.image_url ||
        payload.media_url ||
        "";
      const releaseDate = payload.release_date || row.created_at?.split("T")[0] || null;
      const isOutNow = releaseDate ? new Date(releaseDate) <= new Date() : false;

      return {
        id: row.id,
        title: row.track_name || "Без названия",
        artist: row.artist_name || "Артист",
        cover_url: coverUrl,
        upc: row.upc || payload.upc || payload.barcode || "",
        release_date: releaseDate,
        genre: row.genre || "Electronic",
        status: row.status,
        is_out_now: isOutNow,
      };
    });

    return NextResponse.json({ success: true, releases });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, releases: [] });
  }
}
