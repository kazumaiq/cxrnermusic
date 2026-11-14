import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createSmartLink } from "@/lib/smartLinksDb";

export async function POST(request: Request) {
  try {
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
    const {
      title,
      artist,
      cover_url,
      custom_slug,
      upc,
      isrc,
      release_date,
      release_type,
      genre,
      label_name,
      description,
      preview_audio_url,
      lyrics_snippet,
      collab_artist,
      fan_gate_target,
      fan_gate_title,
      fan_gate_content,
      status = "published",
      template = "CYBER",
      design_config,
      social_links = [],
      platforms = [],
      is_out_now,
      auto_out_now = true,
    } = body;

    if (!title || !artist || !cover_url) {
      return NextResponse.json(
        { success: false, error: "Укажите название, исполнителя и обложку" },
        { status: 400 }
      );
    }

    // Use resilient smartLinksDb which writes to smart_links table OR profile fallback
    const result = await createSmartLink({
      userId: user.id,
      title,
      artist,
      cover_url,
      custom_slug,
      upc,
      isrc,
      release_date,
      release_type,
      genre,
      label_name,
      description,
      preview_audio_url,
      lyrics_snippet,
      collab_artist,
      fan_gate_target,
      fan_gate_title,
      fan_gate_content,
      status,
      template,
      design_config,
      social_links,
      platforms,
      is_out_now,
      auto_out_now,
    });

    if (!result.ok || !result.link) {
      return NextResponse.json(
        { success: false, error: result.error || "Не удалось создать Smart Link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      link: {
        id: result.link.id,
        slug: result.link.slug,
        title: result.link.title,
        artist: result.link.artist,
        status: result.link.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
