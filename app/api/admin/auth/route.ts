import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminUser, isAdminUser, isValidAdminPassword } from "@/lib/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (user) {
      return NextResponse.json({
        ok: true,
        isAdmin: true,
        method: "supabase_user",
        email: user.email,
        userId: user.id,
      });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("cxrner_admin_token")?.value;
    if (token && (isValidAdminPassword(token) || token === "cxrner_authorized_admin")) {
      return NextResponse.json({
        ok: true,
        isAdmin: true,
        method: "master_key",
        email: "cxrner.label@gmail.com",
      });
    }

    return NextResponse.json({ ok: true, isAdmin: false });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || body.key || "").trim();

    if (!password) {
      return NextResponse.json(
        { ok: false, error: "Укажите пароль или ключ доступа администратора" },
        { status: 400 }
      );
    }

    // 1. Master Key / Admin Password fast path (prevents redundant Supabase calls on non-admin logins)
    if (isValidAdminPassword(password) || (process.env.ADMIN_SECRET && password === process.env.ADMIN_SECRET)) {
      const cookieStore = await cookies();
      cookieStore.set("cxrner_admin_token", "cxrner_authorized_admin", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.json({
        ok: true,
        message: "Доступ администратора подтверждён",
        email: email || "cxrner.label@gmail.com",
        method: "master_key",
      });
    }

    // 2. Supabase Auth Email + Password Login (can be skipped when client already attempted it)
    if (email && !body.skipSupabase) {
      try {
        const supabase = await getSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data?.user) {
          if (isAdminUser(data.user)) {
            const cookieStore = await cookies();
            cookieStore.set("cxrner_admin_token", "cxrner_authorized_admin", {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 30, // 30 days
            });

            return NextResponse.json({
              ok: true,
              message: "Авторизация администратора успешна",
              email: data.user.email,
              method: "supabase_auth",
            });
          }
        }
      } catch (authErr: any) {
        console.warn("[Admin Auth] Supabase signInWithPassword check failed:", authErr.message);
      }
    }

    return NextResponse.json(
      { ok: false, error: "Неверный логин или пароль администратора" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
