import { NextResponse } from "next/server";
import { getResolvedSupabaseUrl } from "@/lib/supabaseServer";

const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaHF0cmZzdXVkaW9ncHd3emd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTE3OTYsImV4cCI6MjEwMTY4Nzc5Nn0.fNVIC3dZuz7LLUTE0aOnF4ILVKBYXcftdU1ZjXyMZmo";

export async function GET() {
  const supabaseUrl = getResolvedSupabaseUrl();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_ANON_KEY;

  try {
    const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
      cache: "no-store",
    });

    if (settingsRes.ok) {
      const settings = await settingsRes.json().catch(() => null);
      const googleEnabled = Boolean(settings?.external?.google);
      if (googleEnabled) {
        return NextResponse.json({
          enabled: true,
          provider: "google",
          supabaseUrl,
          callbackUrl: `${supabaseUrl}/auth/v1/callback`,
        });
      }
      return NextResponse.json({
        enabled: false,
        notConfiguredInSupabase: true,
        provider: "google",
        supabaseUrl,
        callbackUrl: `${supabaseUrl}/auth/v1/callback`,
        message:
          "Вход через Google не включён в настройках Supabase Authentication -> Providers -> Google.",
      });
    }
  } catch {
    // Fall back to authorize endpoint probe
  }

  try {
    const authProbe = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
      method: "GET",
      redirect: "manual",
    });

    if (authProbe.status === 302 || authProbe.status === 200 || authProbe.status === 0) {
      return NextResponse.json({
        enabled: true,
        provider: "google",
        supabaseUrl,
        callbackUrl: `${supabaseUrl}/auth/v1/callback`,
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    enabled: false,
    provider: "google",
    supabaseUrl,
    callbackUrl: `${supabaseUrl}/auth/v1/callback`,
    message: "Провайдер Google временно недоступен. Используйте вход по Email и паролю.",
  });
}
