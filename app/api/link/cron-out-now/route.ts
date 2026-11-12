import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Optional security check if CRON_SECRET is configured
    }

    const supabase = await getSupabaseServerClient();
    const now = new Date().toISOString();

    // Find links that should transition to Out Now
    const { data: expiredPreSaves, error: fetchErr } = await supabase
      .from("smart_links")
      .select("id, title, artist, release_date")
      .eq("auto_out_now", true)
      .eq("is_out_now", false)
      .eq("status", "published")
      .lte("release_date", now)
      .is("deleted_at", null);

    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    const processedIds: string[] = [];

    if (expiredPreSaves && expiredPreSaves.length > 0) {
      for (const link of expiredPreSaves) {
        // 1. Mark link as Out Now
        await supabase
          .from("smart_links")
          .update({ is_out_now: true })
          .eq("id", link.id);

        // 2. Change platform button text from 'Pre-save' to 'Слушать'
        await supabase
          .from("smart_link_platforms")
          .update({ button_text: "Слушать" })
          .eq("smart_link_id", link.id)
          .eq("button_text", "Pre-save");

        processedIds.push(link.id);
      }

      // Log execution
      await supabase.from("system_logs").insert({
        action: "auto_out_now_executed",
        entity_type: "smart_links",
        payload: { processed_count: processedIds.length, ids: processedIds },
      });
    }

    return NextResponse.json({
      success: true,
      processed_count: processedIds.length,
      processed_ids: processedIds,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
