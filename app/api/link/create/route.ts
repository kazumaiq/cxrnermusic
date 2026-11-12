import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { generateSlug, validateCustomSlug } from "@/lib/slug";

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

    // 1. Generate & Validate unique slug
    let targetSlug = custom_slug ? custom_slug.trim().toLowerCase() : generateSlug(artist, title);
    const slugCheck = validateCustomSlug(targetSlug);
    if (!slugCheck.isValid) {
      targetSlug = generateSlug(artist, title);
    }

    // Verify slug uniqueness in database
    let finalSlug = targetSlug;
    let collisionCount = 1;
    while (true) {
      const { data: existing } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", finalSlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (!existing) break;
      collisionCount++;
      finalSlug = `${targetSlug}-${collisionCount}`;
    }

    // Check if release is already out based on date
    const now = new Date();
    const relDate = release_date ? new Date(release_date) : null;
    const computedOutNow = is_out_now !== undefined ? is_out_now : (relDate ? relDate <= now : true);

    // 2. Insert Smart Link
    const { data: link, error: linkErr } = await supabase
      .from("smart_links")
      .insert({
        user_id: user.id,
        title: title.trim(),
        artist: artist.trim(),
        cover_url: cover_url.trim(),
        slug: finalSlug,
        upc: upc ? upc.trim() : null,
        isrc: isrc ? isrc.trim() : null,
        release_date: release_date || null,
        release_type: release_type || "single",
        genre: genre || "Electronic",
        label_name: label_name || "CXRNER MUSIC",
        description: description || null,
        status: status || "published",
        is_out_now: computedOutNow,
        auto_out_now: auto_out_now !== undefined ? auto_out_now : true,
        template: template || "CYBER",
        design_config: design_config || {
          theme: template || "CYBER",
          background_type: "blur",
          background_color: "#090611",
          accent_color: "#8737FF",
          cover_blur: 64,
          button_radius: "full",
          button_style: "glass",
          font_family: "sans",
          show_countdown: true,
          show_socials: true,
          show_audio_preview: true,
        },
        social_links,
      })
      .select()
      .single();

    if (linkErr || !link) {
      return NextResponse.json(
        { success: false, error: linkErr?.message || "Не удалось создать Smart Link" },
        { status: 500 }
      );
    }

    // 3. Insert Platforms
    if (Array.isArray(platforms) && platforms.length > 0) {
      const platformRows = platforms
        .filter((p: any) => p.platform_key && p.url)
        .map((p: any, index: number) => ({
          smart_link_id: link.id,
          platform_key: p.platform_key,
          platform_name: p.platform_name || p.platform_key,
          url: p.url.trim(),
          button_text: p.button_text || (computedOutNow ? "Слушать" : "Pre-save"),
          display_order: index,
          is_enabled: p.is_enabled !== undefined ? p.is_enabled : true,
        }));

      if (platformRows.length > 0) {
        await supabase.from("smart_link_platforms").insert(platformRows);
      }
    }

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        slug: link.slug,
        title: link.title,
        artist: link.artist,
        status: link.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
