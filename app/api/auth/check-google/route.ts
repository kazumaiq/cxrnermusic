import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({
      enabled: false,
      message: "База данных Supabase не настроена на сайте.",
    });
  }

  try {
    // Probe Supabase authorize endpoint to check if Google OAuth is configured
    const res = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
      method: "GET",
      redirect: "manual",
    });

    if (res.status === 400) {
      const data = await res.json().catch(() => null);
      if (
        data?.msg?.includes("provider is not enabled") ||
        data?.error_code === "validation_failed"
      ) {
        return NextResponse.json({
          enabled: false,
          notConfiguredInSupabase: true,
          message:
            "Вход через Google еще не включен в панели Supabase. Включите провайдер Google в Supabase (Authentication -> Providers -> Google) или используйте вход по Email.",
        });
      }
    }

    return NextResponse.json({ enabled: true });
  } catch (err: any) {
    return NextResponse.json({
      enabled: false,
      message: err.message || "Ошибка проверки провайдера Google",
    });
  }
}
