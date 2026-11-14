import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/admin";
import { toggleArchiveSmartLink } from "@/lib/smartLinksDb";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const res = await toggleArchiveSmartLink({
      id,
      userId: user.id,
      isAdmin: isAdminUser(user),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error || "Smart Link не найден" },
        { status: res.statusCode || 500 }
      );
    }

    return NextResponse.json({ success: true, status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
