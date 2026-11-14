import { NextResponse } from "next/server";
import { DROP_CASES, DROP_SPECIMENS } from "@/lib/ecosystemTypes";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      cases: DROP_CASES,
      catalog: DROP_SPECIMENS,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
