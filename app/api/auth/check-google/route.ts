import { NextResponse } from "next/server";

export async function GET() {
  const primaryUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://feeudmwytkeuwemnmbwd.supabase.co";

  const urlsToProbe = [
    primaryUrl,
    "https://feeudmwytkeuwemnmbwd.supabase.co",
    "https://wjhqtrfsuudiogpwwzgx.supabase.co",
  ];

  for (const url of Array.from(new Set(urlsToProbe))) {
    try {
      const res = await fetch(`${url}/auth/v1/authorize?provider=google`, {
        method: "GET",
        redirect: "manual",
      });

      // 302 or 200 means Google OAuth endpoint is ready and redirecting to Google
      if (res.status === 302 || res.status === 200 || res.status === 0) {
        return NextResponse.json({
          enabled: true,
          provider: "google",
          supabaseUrl: url,
          callbackUrl: `${url}/auth/v1/callback`,
        });
      }
    } catch {
      // Continue probe to next URL
    }
  }

  return NextResponse.json({
    enabled: false,
    provider: "google",
    supabaseUrl: primaryUrl,
    callbackUrl: `${primaryUrl}/auth/v1/callback`,
    message: "Провайдер Google недоступен в текущей конфигурации базы данных.",
  });
}
