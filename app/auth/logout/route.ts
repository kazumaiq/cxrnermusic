import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { buildCanonicalOrigin } from "../../../lib/authUtils";

async function performLogout(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  const origin = buildCanonicalOrigin(request);
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.delete("cxrner_admin_token");
  return res;
}

export async function POST(request: Request) {
  return performLogout(request);
}

export async function GET(request: Request) {
  return performLogout(request);
}
