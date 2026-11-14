import { NextResponse } from "next/server";
import { getDropAnalytics } from "@/lib/ecosystemDb";

export async function GET() {
  try {
    const analytics = await getDropAnalytics();
    return NextResponse.json({ ok: true, analytics });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
