import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { generateSlug, validateCustomSlug } from "@/lib/slug";
import crypto from "node:crypto";

export interface SmartLinkRecord {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  cover_url: string;
  slug: string;
  upc: string | null;
  isrc: string | null;
  release_date: string | null;
  release_type: string;
  genre: string;
  label_name: string;
  description: string | null;
  status: "published" | "draft" | "archived";
  is_out_now: boolean;
  auto_out_now: boolean;
  template: "CYBER" | "CINEMATIC" | "AUTUMN" | "WINTER" | "MINIMAL" | "SAKURA" | "BRUTAL" | string;
  design_config: Record<string, any>;
  social_links: Array<{ platform: string; url: string }>;
  views_count: number;
  clicks_count: number;
  presaves_count: number;
  created_at: string;
  updated_at: string;
  platforms?: Array<{
    id?: string;
    platform_key: string;
    platform_name: string;
    url: string;
    button_text: string;
    display_order: number;
    is_enabled: boolean;
    clicks_count: number;
  }>;
  analytics_clicks?: Record<string, number>; // per platform breakdown
}

/** Check if Supabase error is table not found / schema cache error */
export function isTableNotFoundError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err.details || err || "").toLowerCase();
  const code = String(err.code || "").toUpperCase();
  return (
    msg.includes("could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist")) ||
    msg.includes("schema cache") ||
    msg.includes("pgrst205") ||
    msg.includes("42p01") ||
    code === "PGRST205" ||
    code === "42P01"
  );
}

/** 1. Create / Insert a new Smart Link with automatic fallback to JSON store */
export async function createSmartLink(params: {
  userId: string;
  title: string;
  artist: string;
  cover_url: string;
  custom_slug?: string;
  upc?: string | null;
  isrc?: string | null;
  release_date?: string | null;
  release_type?: string;
  genre?: string;
  label_name?: string;
  description?: string | null;
  status?: "published" | "draft" | "archived";
  template?: "CYBER" | "CINEMATIC" | "AUTUMN" | "WINTER" | "MINIMAL" | "SAKURA" | "BRUTAL" | string;
  design_config?: Record<string, any>;
  social_links?: Array<{ platform: string; url: string }>;
  platforms?: Array<{
    platform_key: string;
    platform_name: string;
    url: string;
    button_text?: string;
    is_enabled?: boolean;
  }>;
  is_out_now?: boolean;
  auto_out_now?: boolean;
}): Promise<{ ok: boolean; link?: SmartLinkRecord; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Generate unique slug
    let targetSlug = params.custom_slug
      ? params.custom_slug.trim().toLowerCase()
      : generateSlug(params.artist, params.title);
    const slugCheck = validateCustomSlug(targetSlug);
    if (!slugCheck.isValid) {
      targetSlug = generateSlug(params.artist, params.title);
    }

    const now = new Date();
    const relDate = params.release_date ? new Date(params.release_date) : null;
    const computedOutNow =
      params.is_out_now !== undefined
        ? params.is_out_now
        : relDate
        ? relDate <= now
        : true;

    const linkId = crypto.randomUUID();
    const nowIso = now.toISOString();

    const preparedPlatforms = (params.platforms || [])
      .filter((p) => p.platform_key && p.url)
      .map((p, idx) => ({
        id: crypto.randomUUID(),
        platform_key: p.platform_key,
        platform_name: p.platform_name || p.platform_key,
        url: p.url.trim(),
        button_text: p.button_text || (computedOutNow ? "Слушать" : "Pre-save"),
        display_order: idx,
        is_enabled: p.is_enabled !== undefined ? p.is_enabled : true,
        clicks_count: 0,
      }));

    const linkData: SmartLinkRecord = {
      id: linkId,
      user_id: params.userId,
      title: params.title.trim(),
      artist: params.artist.trim(),
      cover_url: params.cover_url.trim(),
      slug: targetSlug,
      upc: params.upc?.trim() || null,
      isrc: params.isrc?.trim() || null,
      release_date: params.release_date || null,
      release_type: params.release_type || "single",
      genre: params.genre || "Electronic",
      label_name: params.label_name || "CXRNER MUSIC",
      description: params.description || null,
      status: params.status || "published",
      is_out_now: computedOutNow,
      auto_out_now: params.auto_out_now !== undefined ? params.auto_out_now : true,
      template: params.template || "CYBER",
      design_config: params.design_config || {
        theme: params.template || "CYBER",
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
      social_links: params.social_links || [],
      views_count: 0,
      clicks_count: 0,
      presaves_count: 0,
      created_at: nowIso,
      updated_at: nowIso,
      platforms: preparedPlatforms,
      analytics_clicks: {},
    };

    // First attempt: try relational smart_links table
    let tableFailed = false;
    try {
      // Check slug uniqueness in table
      const { data: existingSlug, error: checkSlugErr } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", targetSlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (checkSlugErr && isTableNotFoundError(checkSlugErr)) {
        tableFailed = true;
      }

      if (!tableFailed) {
        if (existingSlug) {
          linkData.slug = `${targetSlug}-${Math.floor(100 + Math.random() * 900)}`;
        }

        const { data: tableLink, error: tableErr } = await supabase
          .from("smart_links")
          .insert({
            id: linkData.id,
            user_id: linkData.user_id,
            title: linkData.title,
            artist: linkData.artist,
            cover_url: linkData.cover_url,
            slug: linkData.slug,
            upc: linkData.upc,
            isrc: linkData.isrc,
            release_date: linkData.release_date,
            release_type: linkData.release_type,
            genre: linkData.genre,
            label_name: linkData.label_name,
            description: linkData.description,
            status: linkData.status,
            is_out_now: linkData.is_out_now,
            auto_out_now: linkData.auto_out_now,
            template: linkData.template,
            design_config: linkData.design_config,
            social_links: linkData.social_links,
          })
          .select()
          .single();

        if (tableErr) {
          if (isTableNotFoundError(tableErr)) {
            tableFailed = true;
          } else {
            return { ok: false, error: tableErr.message };
          }
        } else {
          // Table insert succeeded! Insert platforms
          if (preparedPlatforms.length > 0) {
            const platformRows = preparedPlatforms.map((p) => ({
              smart_link_id: linkData.id,
              platform_key: p.platform_key,
              platform_name: p.platform_name,
              url: p.url,
              button_text: p.button_text,
              display_order: p.display_order,
              is_enabled: p.is_enabled,
            }));
            await supabase.from("smart_link_platforms").insert(platformRows);
          }
          return { ok: true, link: linkData };
        }
      }
    } catch (e: any) {
      if (isTableNotFoundError(e)) {
        tableFailed = true;
      } else {
        return { ok: false, error: e.message || "Failed to create smart link" };
      }
    }

    // Fallback: Store inside cxrner_cabinet_users.profile.smart_links
    if (tableFailed) {
      const { data: userRow } = await supabase
        .from("cxrner_cabinet_users")
        .select("profile")
        .eq("user_id", params.userId)
        .maybeSingle();

      const currentProfile = (userRow?.profile as Record<string, any>) || {};
      const currentLinks = Array.isArray(currentProfile.smart_links)
        ? [...currentProfile.smart_links]
        : [];

      // Ensure slug uniqueness among existing fallback links
      let slug = linkData.slug;
      if (currentLinks.some((l: any) => l.slug === slug)) {
        slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
        linkData.slug = slug;
      }

      currentLinks.unshift(linkData);

      const updatedProfile = {
        ...currentProfile,
        smart_links: currentLinks,
      };

      const { error: upsertErr } = await supabase
        .from("cxrner_cabinet_users")
        .upsert(
          {
            user_id: params.userId,
            profile: updatedProfile,
            updated_at: nowIso,
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        return { ok: false, error: upsertErr.message };
      }

      return { ok: true, link: linkData };
    }

    return { ok: true, link: linkData };
  } catch (err: any) {
    return { ok: false, error: err.message || "Unexpected error creating link" };
  }
}

/** 2. Fetch a smart link by SLUG (checks table, falls back to profile store) */
export async function getSmartLinkBySlug(
  slug: string
): Promise<{ link: SmartLinkRecord | null; platforms: any[] }> {
  try {
    const supabase = await getSupabaseServerClient();
    const cleanSlug = slug.toLowerCase().trim();

    // 1. Try relational table first
    try {
      const { data: link, error: linkErr } = await supabase
        .from("smart_links")
        .select("*")
        .eq("slug", cleanSlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (!linkErr && link) {
        const { data: platforms = [] } = await supabase
          .from("smart_link_platforms")
          .select("*")
          .eq("smart_link_id", link.id)
          .order("display_order", { ascending: true });

        return { link: link as SmartLinkRecord, platforms: platforms || [] };
      }
    } catch {}

    // 2. Fallback: Search all cabinet users profile.smart_links
    const { data: users } = await supabase
      .from("cxrner_cabinet_users")
      .select("profile")
      .limit(300);

    for (const u of users || []) {
      const p = (u?.profile as Record<string, any>) || {};
      const links = Array.isArray(p.smart_links) ? p.smart_links : [];
      const found = links.find(
        (l: any) => l.slug?.toLowerCase() === cleanSlug && l.status !== "archived"
      );
      if (found) {
        return {
          link: found as SmartLinkRecord,
          platforms: found.platforms || [],
        };
      }
    }

    return { link: null, platforms: [] };
  } catch {
    return { link: null, platforms: [] };
  }
}

/** 2.1 Fetch a smart link by ID (checks table, falls back to profile store) */
export async function getSmartLinkById(
  id: string,
  userId?: string
): Promise<{ link: SmartLinkRecord | null; platforms: any[] }> {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Try relational table first
    try {
      let query = supabase.from("smart_links").select("*").eq("id", id).is("deleted_at", null);
      if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data: link, error: linkErr } = await query.maybeSingle();

      if (!linkErr && link) {
        const { data: platforms = [] } = await supabase
          .from("smart_link_platforms")
          .select("*")
          .eq("smart_link_id", link.id)
          .order("display_order", { ascending: true });

        return { link: link as SmartLinkRecord, platforms: platforms || [] };
      }
    } catch {}

    // 2. Fallback: Search in user profile
    if (userId) {
      const { data: userRow } = await supabase
        .from("cxrner_cabinet_users")
        .select("profile")
        .eq("user_id", userId)
        .maybeSingle();

      const p = (userRow?.profile as Record<string, any>) || {};
      const links = Array.isArray(p.smart_links) ? p.smart_links : [];
      const found = links.find((l: any) => l.id === id && l.status !== "archived");
      if (found) {
        return {
          link: found as SmartLinkRecord,
          platforms: found.platforms || [],
        };
      }
    } else {
      const { data: users } = await supabase
        .from("cxrner_cabinet_users")
        .select("profile")
        .limit(300);

      for (const u of users || []) {
        const p = (u?.profile as Record<string, any>) || {};
        const links = Array.isArray(p.smart_links) ? p.smart_links : [];
        const found = links.find((l: any) => l.id === id && l.status !== "archived");
        if (found) {
          return {
            link: found as SmartLinkRecord,
            platforms: found.platforms || [],
          };
        }
      }
    }

    return { link: null, platforms: [] };
  } catch {
    return { link: null, platforms: [] };
  }
}

/** 3. Fetch all smart links for a specific user */
export async function getUserSmartLinks(
  userId: string
): Promise<SmartLinkRecord[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const results: SmartLinkRecord[] = [];

    // 1. Try table
    try {
      const { data: tableLinks, error: tableErr } = await supabase
        .from("smart_links")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!tableErr && Array.isArray(tableLinks) && tableLinks.length > 0) {
        for (const l of tableLinks) {
          const { data: platforms = [] } = await supabase
            .from("smart_link_platforms")
            .select("*")
            .eq("smart_link_id", l.id)
            .order("display_order", { ascending: true });
          results.push({ ...(l as SmartLinkRecord), platforms: platforms || [] });
        }
        return results;
      }
    } catch {}

    // 2. Check profile fallback
    const { data: userRow } = await supabase
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", userId)
      .maybeSingle();

    const p = (userRow?.profile as Record<string, any>) || {};
    const fallbackLinks = Array.isArray(p.smart_links) ? p.smart_links : [];
    return fallbackLinks.filter((l: any) => l.status !== "archived");
  } catch {
    return [];
  }
}

/** 4. Record click or view event with per-platform tracking */
export async function recordLinkClickEvent(params: {
  linkId: string;
  eventType: "view" | "click" | "presave";
  platformKey?: string;
}) {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Try relational table update
    let tableUpdated = false;
    try {
      if (params.eventType === "view") {
        const { data: cur } = await supabase
          .from("smart_links")
          .select("views_count")
          .eq("id", params.linkId)
          .single();
        if (cur) {
          await supabase
            .from("smart_links")
            .update({ views_count: (cur.views_count || 0) + 1 })
            .eq("id", params.linkId);
          tableUpdated = true;
        }
      } else if (params.eventType === "click") {
        const { data: cur } = await supabase
          .from("smart_links")
          .select("clicks_count")
          .eq("id", params.linkId)
          .single();
        if (cur) {
          await supabase
            .from("smart_links")
            .update({ clicks_count: (cur.clicks_count || 0) + 1 })
            .eq("id", params.linkId);
          tableUpdated = true;
        }

        if (params.platformKey) {
          const { data: pCur } = await supabase
            .from("smart_link_platforms")
            .select("id, clicks_count")
            .eq("smart_link_id", params.linkId)
            .eq("platform_key", params.platformKey)
            .maybeSingle();
          if (pCur) {
            await supabase
              .from("smart_link_platforms")
              .update({ clicks_count: (pCur.clicks_count || 0) + 1 })
              .eq("id", pCur.id);
          }
        }
      } else if (params.eventType === "presave") {
        const { data: cur } = await supabase
          .from("smart_links")
          .select("presaves_count")
          .eq("id", params.linkId)
          .single();
        if (cur) {
          await supabase
            .from("smart_links")
            .update({ presaves_count: (cur.presaves_count || 0) + 1 })
            .eq("id", params.linkId);
          tableUpdated = true;
        }
      }
    } catch {}

    // 2. Also update fallback store if found in any user profile
    if (!tableUpdated) {
      const { data: users } = await supabase
        .from("cxrner_cabinet_users")
        .select("user_id, profile")
        .limit(300);

      for (const u of users || []) {
        const p = (u?.profile as Record<string, any>) || {};
        const links = Array.isArray(p.smart_links) ? [...p.smart_links] : [];
        const linkIdx = links.findIndex((l: any) => l.id === params.linkId);
        if (linkIdx >= 0) {
          const target = { ...links[linkIdx] };
          if (params.eventType === "view") {
            target.views_count = (target.views_count || 0) + 1;
          } else if (params.eventType === "click") {
            target.clicks_count = (target.clicks_count || 0) + 1;
            if (params.platformKey) {
              target.analytics_clicks = target.analytics_clicks || {};
              target.analytics_clicks[params.platformKey] =
                (target.analytics_clicks[params.platformKey] || 0) + 1;

              // also update platform item clicks
              if (Array.isArray(target.platforms)) {
                target.platforms = target.platforms.map((pl: any) =>
                  pl.platform_key === params.platformKey
                    ? { ...pl, clicks_count: (pl.clicks_count || 0) + 1 }
                    : pl
                );
              }
            }
          } else if (params.eventType === "presave") {
            target.presaves_count = (target.presaves_count || 0) + 1;
          }
          links[linkIdx] = target;

          await supabase
            .from("cxrner_cabinet_users")
            .update({
              profile: { ...p, smart_links: links },
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", u.user_id);
          break;
        }
      }
    }
  } catch (e) {
    console.warn("[analytics] record event error:", e);
  }
}
