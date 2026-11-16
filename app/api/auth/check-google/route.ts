import { NextResponse } from "next/server";
import { getResolvedSupabaseUrl, getResolvedSupabaseAnonKey } from "@/lib/supabaseServer";

export async function GET() {
  const supabaseUrl = getResolvedSupabaseUrl();
  const anonKey = getResolvedSupabaseAnonKey();

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
