import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://feeudmwytkeuwemnmbwd.supabase.co";

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
      method: "GET",
      redirect: "manual",
    });

    // 302 or 200 means Google OAuth endpoint is ready and redirecting to Google
    if (res.status === 302 || res.status === 200 || res.status === 0) {
      return NextResponse.json({ enabled: true });
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
          message:
            "Вход через Google еще не сохранен в Supabase. Убедитесь, что нажали кнопку 'Сохранить' в модальном окне Google в панели Supabase.",
        });
      }
    }

    return NextResponse.json({ enabled: true });
  } catch {
    // If probing fails for network reasons, do not block the user
    return NextResponse.json({ enabled: true });
  }
}
