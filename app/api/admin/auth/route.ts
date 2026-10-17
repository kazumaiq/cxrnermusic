import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminUser } from "@/lib/admin";

const MASTER_PASSWORD = process.env.ADMIN_PASSWORD || "cxrner2026";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (user) {
      return NextResponse.json({ ok: true, isAdmin: true, method: "supabase_user", email: user.email });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("cxrner_admin_token")?.value;
    if (token && (token === MASTER_PASSWORD || token === "cxrner_authorized_admin")) {
      return NextResponse.json({ ok: true, isAdmin: true, method: "master_key" });
    }

    return NextResponse.json({ ok: true, isAdmin: false });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = String(body.key || body.password || "").trim();

    if (!key) {
      return NextResponse.json({ ok: false, error: "Введите ключ администратора" }, { status: 400 });
    }

    // Check if matching master password
    if (key === MASTER_PASSWORD || key === process.env.ADMIN_SECRET) {
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
      });
    }

    return NextResponse.json(
      { ok: false, error: "Неверный ключ доступа администратора" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("cxrner_admin_token");
  return NextResponse.json({ ok: true, message: "Вы вышли из режима администратора" });
}
