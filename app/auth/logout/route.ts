import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";

export async function POST() {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxrnermusic.vercel.app"));
}

