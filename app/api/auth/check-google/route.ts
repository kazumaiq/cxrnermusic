import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://wjhqtrfsuudiogpwwzgx.supabase.co";

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
      method: "GET",
      redirect: "manual",
    });

    // 302 or 200 means Google OAuth endpoint is ready and redirecting to Google
    if (res.status === 302 || res.status === 200 || res.status === 0) {
      return NextResponse.json({
        enabled: true,
        provider: "google",
        supabaseUrl,
        callbackUrl: `${supabaseUrl}/auth/v1/callback`,
      });
    }

    if (res.status === 400) {
      const data = await res.json().catch(() => null);
      if (
        data?.msg?.includes("provider is not enabled") ||
        data?.error_code === "validation_failed"
      ) {
        return NextResponse.json({
          enabled: false,
          notConfiguredInSupabase: true,
          provider: "google",
          supabaseUrl,
          callbackUrl: `${supabaseUrl}/auth/v1/callback`,
          message:
            "Вход через Google еще не включен в панели Supabase. Перейдите в Authentication -> Providers -> Google и сохраните Client ID и Client Secret.",
        });
      }
    }

    return NextResponse.json({
      enabled: false,
      provider: "google",
      supabaseUrl,
      callbackUrl: `${supabaseUrl}/auth/v1/callback`,
      message: "Провайдер Google недоступен в текущей конфигурации базы данных.",
    });
  } catch (err: any) {
    return NextResponse.json({
      enabled: false,
      provider: "google",
      supabaseUrl,
      error: err.message,
    });
  }
}
