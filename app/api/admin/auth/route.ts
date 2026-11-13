import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminUser, isAdminUser } from "@/lib/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const MASTER_PASSWORD = process.env.ADMIN_PASSWORD || "cxrner2026";

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
    if (token && (token === MASTER_PASSWORD || token === "cxrner_authorized_admin")) {
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

    // 1. Supabase Auth Email + Password Login for cxrner.label@gmail.com
    if (email) {
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
          } else {
            return NextResponse.json(
              { ok: false, error: "У данного аккаунта нет прав администратора" },
              { status: 403 }
            );
          }
        }
      } catch (authErr: any) {
        console.warn("[Admin Auth] Supabase signInWithPassword check failed:", authErr.message);
      }
    }

    // 2. Master Key / Admin Password Fallback
    if (password === MASTER_PASSWORD || password === process.env.ADMIN_SECRET) {
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
        message: "Доступ администратора подтверждён по мастер-ключу",
        email: email || "cxrner.label@gmail.com",
        method: "master_key",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Неверный логин или пароль администратора" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("cxrner_admin_token");

    try {
      const supabase = await getSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {}

    return NextResponse.json({ ok: true, message: "Вы успешно вышли из административной панели" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
