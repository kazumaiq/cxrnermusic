import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/admin";
import {
  getSmartLinkById,
  updateSmartLinkById,
  deleteSmartLinkById,
} from "@/lib/smartLinksDb";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
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

    const isAdmin = isAdminUser(user);
    const { link, platforms } = await getSmartLinkById(id, isAdmin ? undefined : user.id, {
      includeArchived: true,
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Smart Link не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      link,
      platforms: platforms || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, props: RouteParams) {
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

    const body = await request.json();
    const res = await updateSmartLinkById({
      id,
      userId: user.id,
      isAdmin: isAdminUser(user),
      body,
    });

    if (!res.ok || !res.link) {
      return NextResponse.json(
        { success: false, error: res.error || "Ошибка сохранения" },
        { status: res.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      link: res.link,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

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

    const res = await deleteSmartLinkById({
      id,
      userId: user.id,
      isAdmin: isAdminUser(user),
      hardDelete,
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error || "Smart Link не найден" },
        { status: res.statusCode || 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Smart Link успешно удалён" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
