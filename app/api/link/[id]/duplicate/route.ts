import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { duplicateSmartLinkById } from "@/lib/smartLinksDb";

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

    const res = await duplicateSmartLinkById({
      id,
      userId: user.id,
    });

    if (!res.ok || !res.link) {
      return NextResponse.json(
        { success: false, error: res.error || "Ошибка клонирования" },
        { status: res.statusCode || 500 }
      );
    }

    return NextResponse.json({ success: true, link: res.link });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
