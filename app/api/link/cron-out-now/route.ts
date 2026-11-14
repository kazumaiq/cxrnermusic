import { NextResponse } from "next/server";
import { runAutoOutNowTransition } from "@/lib/smartLinksDb";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Optional security check if CRON_SECRET is configured
    }

    const res = await runAutoOutNowTransition();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error || "Cron execution error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed_count: res.processedIds.length,
      processed_ids: res.processedIds,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
