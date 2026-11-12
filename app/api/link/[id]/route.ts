import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { validateCustomSlug } from "@/lib/slug";
import { isAdminUser } from "@/lib/admin";

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
      return NextResponse.json({ success: false, error: "Требуется авторизация" }, { status: 401 });
    }

    const isAdmin = isAdminUser(user);

    let query = supabase
      .from("smart_links")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null);

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data: link, error: linkErr } = await query.maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json({ success: false, error: "Smart Link не найден" }, { status: 404 });
    }

    const { data: platforms } = await supabase
      .from("smart_link_platforms")
      .select("*")
      .eq("smart_link_id", id)
      .order("display_order", { ascending: true });

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
      return NextResponse.json({ success: false, error: "Требуется авторизация" }, { status: 401 });
    }

    const isAdmin = isAdminUser(user);

    // Fetch existing link to check ownership and previous slug
    let query = supabase.from("smart_links").select("*").eq("id", id).is("deleted_at", null);
    if (!isAdmin) query = query.eq("user_id", user.id);
    const { data: existing, error: existErr } = await query.maybeSingle();

    if (existErr || !existing) {
      return NextResponse.json({ success: false, error: "Smart Link не найден" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      artist,
      cover_url,
      slug,
      upc,
      isrc,
      release_date,
      release_type,
      genre,
      label_name,
      description,
      status,
      template,
      design_config,
      social_links,
      extra_content,
      is_out_now,
      auto_out_now,
      platforms,
    } = body;

    const updates: Record<string, any> = {};

    if (title !== undefined) updates.title = title.trim();
    if (artist !== undefined) updates.artist = artist.trim();
    if (cover_url !== undefined) updates.cover_url = cover_url.trim();
    if (upc !== undefined) updates.upc = upc ? upc.trim() : null;
    if (isrc !== undefined) updates.isrc = isrc ? isrc.trim() : null;
    if (release_date !== undefined) updates.release_date = release_date || null;
    if (release_type !== undefined) updates.release_type = release_type;
    if (genre !== undefined) updates.genre = genre;
    if (label_name !== undefined) updates.label_name = label_name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (template !== undefined) updates.template = template;
    if (design_config !== undefined) updates.design_config = design_config;
    if (social_links !== undefined) updates.social_links = social_links;
    if (extra_content !== undefined) updates.extra_content = extra_content;
    if (is_out_now !== undefined) updates.is_out_now = is_out_now;
    if (auto_out_now !== undefined) updates.auto_out_now = auto_out_now;

    // Handle slug change with 301 history tracking
    if (slug && slug.trim().toLowerCase() !== existing.slug) {
      const cleanSlug = slug.trim().toLowerCase();
      const slugCheck = validateCustomSlug(cleanSlug);
      if (!slugCheck.isValid) {
        return NextResponse.json({ success: false, error: slugCheck.error }, { status: 400 });
      }

      // Check if new slug is taken
      const { data: conflict } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", cleanSlug)
        .neq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { success: false, error: `Slug "${cleanSlug}" уже занят другим релизом` },
          { status: 409 }
        );
      }

      // Record old slug into slug_history
      await supabase.from("slug_history").insert({
        smart_link_id: id,
        old_slug: existing.slug,
        new_slug: cleanSlug,
      });

      updates.slug = cleanSlug;
    }

    // Update link row
    const { data: updatedLink, error: updateErr } = await supabase
      .from("smart_links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Update platforms if provided
    if (Array.isArray(platforms)) {
      // Delete existing platforms and reinsert cleanly to maintain ordering
      await supabase.from("smart_link_platforms").delete().eq("smart_link_id", id);

      const platformRows = platforms
        .filter((p: any) => p.platform_key && p.url)
        .map((p: any, index: number) => ({
          smart_link_id: id,
          platform_key: p.platform_key,
          platform_name: p.platform_name || p.platform_key,
          url: p.url.trim(),
          button_text: p.button_text || (updates.is_out_now ? "Слушать" : "Pre-save"),
          display_order: index,
          is_enabled: p.is_enabled !== undefined ? p.is_enabled : true,
        }));

      if (platformRows.length > 0) {
        await supabase.from("smart_link_platforms").insert(platformRows);
      }
    }

    return NextResponse.json({
      success: true,
      link: updatedLink,
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
      return NextResponse.json({ success: false, error: "Требуется авторизация" }, { status: 401 });
    }

    const isAdmin = isAdminUser(user);

    let query = supabase.from("smart_links").select("id, user_id").eq("id", id);
    if (!isAdmin) query = query.eq("user_id", user.id);
    const { data: existing } = await query.maybeSingle();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Smart Link не найден" }, { status: 404 });
    }

    if (hardDelete && isAdmin) {
      await supabase.from("smart_links").delete().eq("id", id);
    } else {
      // Safe Soft Delete
      await supabase
        .from("smart_links")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", id);
    }

    return NextResponse.json({ success: true, message: "Smart Link успешно удалён" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
