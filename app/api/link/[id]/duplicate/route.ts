import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

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
      return NextResponse.json({ success: false, error: "Требуется авторизация" }, { status: 401 });
    }

    const { data: original, error: origErr } = await supabase
      .from("smart_links")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (origErr || !original) {
      return NextResponse.json({ success: false, error: "Исходный Smart Link не найден" }, { status: 404 });
    }

    const { data: platforms } = await supabase
      .from("smart_link_platforms")
      .select("*")
      .eq("smart_link_id", id);

    // Create unique slug for copy
    let copySlug = `${original.slug}-copy`;
    let count = 1;
    while (true) {
      const { data: exists } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", copySlug)
        .is("deleted_at", null)
        .maybeSingle();
      if (!exists) break;
      count++;
      copySlug = `${original.slug}-copy-${count}`;
    }

    // Insert cloned link
    const { data: clone, error: cloneErr } = await supabase
      .from("smart_links")
      .insert({
        user_id: user.id,
        title: `${original.title} (Копия)`,
        artist: original.artist,
        cover_url: original.cover_url,
        slug: copySlug,
        upc: original.upc,
        isrc: original.isrc,
        release_date: original.release_date,
        release_type: original.release_type,
        genre: original.genre,
        label_name: original.label_name,
        description: original.description,
        status: "draft",
        is_out_now: original.is_out_now,
        auto_out_now: original.auto_out_now,
        template: original.template,
        design_config: original.design_config,
        social_links: original.social_links,
        extra_content: original.extra_content,
      })
      .select()
      .single();

    if (cloneErr || !clone) {
      return NextResponse.json({ success: false, error: cloneErr?.message || "Ошибка клонирования" }, { status: 500 });
    }

    // Clone platforms
    if (platforms && platforms.length > 0) {
      const clonedPlatforms = platforms.map((p: any) => ({
        smart_link_id: clone.id,
        platform_key: p.platform_key,
        platform_name: p.platform_name,
        url: p.url,
        button_text: p.button_text,
        display_order: p.display_order,
        is_enabled: p.is_enabled,
      }));
      await supabase.from("smart_link_platforms").insert(clonedPlatforms);
    }

    return NextResponse.json({ success: true, link: clone });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
