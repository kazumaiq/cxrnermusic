import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getEcosystemDbClient,
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@/lib/supabaseServer";
import { generateSlug, validateCustomSlug } from "@/lib/slug";

export interface SmartLinkPlatformRecord {
  id?: string;
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
  display_order: number;
  is_enabled: boolean;
  clicks_count: number;
}

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
  is_verified_artist?: boolean;
  template: "CYBER" | "CINEMATIC" | "AUTUMN" | "WINTER" | "MINIMAL" | "SAKURA" | "BRUTAL" | string;
  design_config: Record<string, any>;
  social_links: Array<{ platform: string; url: string }>;
  extra_content?: Record<string, any> | null;
  deleted_at?: string | null;
  views_count: number;
  clicks_count: number;
  presaves_count: number;
  created_at: string;
  updated_at: string;
  platforms?: SmartLinkPlatformRecord[];
  analytics_clicks?: Record<string, number>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MISSING_TABLE_TTL_MS = 5 * 60 * 1000;
let smartLinksTableMissingUntil = 0;

const linkVaultLocks = new Map<string, Promise<unknown>>();

async function withUserLinkVaultLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = linkVaultLocks.get(userId) || Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  linkVaultLocks.set(userId, next);
  try {
    return await next;
  } finally {
    if (linkVaultLocks.get(userId) === next) {
      linkVaultLocks.delete(userId);
    }
  }
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

function isSmartLinksTableKnownMissing(): boolean {
  return Date.now() < smartLinksTableMissingUntil;
}

function markSmartLinksTableMissingIfErr(err: any): boolean {
  if (isTableNotFoundError(err)) {
    smartLinksTableMissingUntil = Date.now() + MISSING_TABLE_TTL_MS;
    return true;
  }
  return false;
}

async function getSmartLinksDb(): Promise<SupabaseClient> {
  const admin = getSupabaseAdminClient();
  if (admin) return admin;
  const { client } = await getEcosystemDbClient();
  if (client) return client;
  return await getSupabaseServerClient();
}

function normalizeVaultLink(l: any): SmartLinkRecord {
  return {
    ...(l as SmartLinkRecord),
    platforms: Array.isArray(l?.platforms) ? l.platforms : [],
    social_links: Array.isArray(l?.social_links) ? l.social_links : [],
    design_config: l?.design_config && typeof l.design_config === "object" ? l.design_config : {},
    views_count: Number(l?.views_count || 0),
    clicks_count: Number(l?.clicks_count || 0),
    presaves_count: Number(l?.presaves_count || 0),
  };
}

function findVaultLinkPredicate(idOrSlug: string) {
  const needle = idOrSlug.trim().toLowerCase();
  return (l: any) =>
    !l?.deleted_at &&
    (String(l?.id || "").toLowerCase() === needle ||
      String(l?.slug || "").toLowerCase() === needle);
}

async function listVaultUsers(
  supabase: SupabaseClient,
  targetUserId?: string
): Promise<Array<{ user_id: string; profile: Record<string, any> }>> {
  if (targetUserId) {
    const { data: userRow } = await supabase
      .from("cxrner_cabinet_users")
      .select("user_id, profile")
      .eq("user_id", targetUserId)
      .maybeSingle();
    if (!userRow) return [];
    return [
      {
        user_id: userRow.user_id || targetUserId,
        profile: (userRow.profile as Record<string, any>) || {},
      },
    ];
  }

  const { data: users } = await supabase
    .from("cxrner_cabinet_users")
    .select("user_id, profile")
    .limit(500);

  return (users || []).map((u: any) => ({
    user_id: u.user_id,
    profile: (u?.profile as Record<string, any>) || {},
  }));
}

async function findVaultLinkOwner(
  supabase: SupabaseClient,
  idOrSlug: string,
  userId?: string
): Promise<{
  ownerId: string;
  linkIndex: number;
  link: SmartLinkRecord;
} | null> {
  const matcher = findVaultLinkPredicate(idOrSlug);
  const rows = await listVaultUsers(supabase, userId);
  for (const row of rows) {
    const links = Array.isArray(row.profile.smart_links) ? row.profile.smart_links : [];
    const idx = links.findIndex(matcher);
    if (idx >= 0) {
      return {
        ownerId: row.user_id,
        linkIndex: idx,
        link: normalizeVaultLink(links[idx]),
      };
    }
  }
  return null;
}

async function updateVaultUserLinks(
  supabase: SupabaseClient,
  ownerId: string,
  updater: (
    links: SmartLinkRecord[],
    profile: Record<string, any>
  ) => { links: SmartLinkRecord[]; extraProfilePatch?: Record<string, any> }
): Promise<{ ok: boolean; error?: string }> {
  return withUserLinkVaultLock(ownerId, async () => {
    const { data: userRow } = await supabase
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", ownerId)
      .maybeSingle();

    const prevProfile = (userRow?.profile as Record<string, any>) || {};
    const prevLinks = Array.isArray(prevProfile.smart_links)
      ? prevProfile.smart_links.map(normalizeVaultLink)
      : [];

    const { links: nextLinks, extraProfilePatch } = updater(prevLinks, prevProfile);
    const nextProfile = {
      ...prevProfile,
      ...(extraProfilePatch || {}),
      smart_links: nextLinks,
    };

    const { error } = await supabase.from("cxrner_cabinet_users").upsert(
      {
        user_id: ownerId,
        profile: nextProfile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
}

async function isSlugTakenAnywhere(
  supabase: SupabaseClient,
  cleanSlug: string,
  excludeId?: string
): Promise<boolean> {
  if (!isSmartLinksTableKnownMissing()) {
    try {
      let q = supabase
        .from("smart_links")
        .select("id")
        .eq("slug", cleanSlug)
        .is("deleted_at", null);
      if (excludeId) q = q.neq("id", excludeId);
      const { data, error } = await q.maybeSingle();
      if (!markSmartLinksTableMissingIfErr(error) && data) {
        return true;
      }
    } catch {}
  }

  const users = await listVaultUsers(supabase);
  return users.some((u) => {
    const links = Array.isArray(u.profile.smart_links) ? u.profile.smart_links : [];
    return links.some(
      (l: any) =>
        !l?.deleted_at &&
        String(l?.slug || "").toLowerCase() === cleanSlug &&
        (!excludeId || l?.id !== excludeId)
    );
  });
}

/** 1. Create / Insert a new Smart Link with automatic fallback to JSON vault */
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
    const supabase = await getSmartLinksDb();

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

    const preparedPlatforms: SmartLinkPlatformRecord[] = (params.platforms || [])
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

    // First attempt: try relational smart_links table if not cached missing
    let useVault = isSmartLinksTableKnownMissing();
    if (!useVault) {
      try {
        const { data: existingSlug, error: checkSlugErr } = await supabase
          .from("smart_links")
          .select("id")
          .eq("slug", targetSlug)
          .is("deleted_at", null)
          .maybeSingle();

        if (markSmartLinksTableMissingIfErr(checkSlugErr)) {
          useVault = true;
        } else {
          if (existingSlug) {
            linkData.slug = `${targetSlug}-${Math.floor(100 + Math.random() * 900)}`;
          }

          const { error: tableErr } = await supabase
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
            if (markSmartLinksTableMissingIfErr(tableErr)) {
              useVault = true;
            } else {
              return { ok: false, error: tableErr.message };
            }
          } else {
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
        if (markSmartLinksTableMissingIfErr(e)) {
          useVault = true;
        } else {
          return { ok: false, error: e.message || "Failed to create smart link" };
        }
      }
    }

    if (useVault) {
      if (await isSlugTakenAnywhere(supabase, linkData.slug)) {
        linkData.slug = `${linkData.slug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const saveRes = await updateVaultUserLinks(supabase, params.userId, (links) => {
        links.unshift(linkData);
        return { links };
      });
      if (!saveRes.ok) {
        return { ok: false, error: saveRes.error || "Failed to save smart link" };
      }
    }

    return { ok: true, link: linkData };
  } catch (err: any) {
    return { ok: false, error: err.message || "Unexpected error creating link" };
  }
}

/** 2. Fetch a public smart link by SLUG (checks table, falls back to profile vault) */
export async function getSmartLinkBySlug(
  slug: string
): Promise<{ link: SmartLinkRecord | null; platforms: any[] }> {
  try {
    const supabase = await getSmartLinksDb();
    const cleanSlug = slug.toLowerCase().trim();

    if (!isSmartLinksTableKnownMissing()) {
      try {
        const { data: link, error: linkErr } = await supabase
          .from("smart_links")
          .select("*")
          .eq("slug", cleanSlug)
          .is("deleted_at", null)
          .maybeSingle();

        if (!markSmartLinksTableMissingIfErr(linkErr) && link) {
          const { data: platforms = [] } = await supabase
            .from("smart_link_platforms")
            .select("*")
            .eq("smart_link_id", link.id)
            .order("display_order", { ascending: true });

          return { link: link as SmartLinkRecord, platforms: platforms || [] };
        }
      } catch {}
    }

    const rows = await listVaultUsers(supabase);
    for (const u of rows) {
      const links = Array.isArray(u.profile.smart_links) ? u.profile.smart_links : [];
      const found = links.find(
        (l: any) =>
          !l?.deleted_at &&
          String(l?.slug || "").toLowerCase() === cleanSlug &&
          l?.status !== "archived"
      );
      if (found) {
        const normalized = normalizeVaultLink(found);
        return {
          link: normalized,
          platforms: normalized.platforms || [],
        };
      }
    }

    return { link: null, platforms: [] };
  } catch {
    return { link: null, platforms: [] };
  }
}

/** Resolve old slug -> new slug redirect (supports SQL slug_history + vault fallback) */
export async function resolveSlugHistoryRedirect(oldSlug: string): Promise<string | null> {
  try {
    const supabase = await getSmartLinksDb();
    const cleanOld = oldSlug.toLowerCase().trim();

    if (!isSmartLinksTableKnownMissing()) {
      try {
        const { data: history, error } = await supabase
          .from("slug_history")
          .select("new_slug")
          .eq("old_slug", cleanOld)
          .maybeSingle();

        if (!error && history?.new_slug) {
          return String(history.new_slug);
        }
      } catch {}
    }

    const rows = await listVaultUsers(supabase);
    for (const u of rows) {
      const hist = u.profile.slug_history;
      if (hist && typeof hist === "object" && typeof hist[cleanOld] === "string") {
        return hist[cleanOld];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** 2.1 Fetch a smart link by ID OR SLUG (checks table, falls back to profile vault) */
export async function getSmartLinkById(
  idOrSlug: string,
  userId?: string,
  options?: { includeArchived?: boolean }
): Promise<{ link: SmartLinkRecord | null; platforms: any[] }> {
  const includeArchived = options?.includeArchived ?? true;
  try {
    const supabase = await getSmartLinksDb();
    const cleanKey = idOrSlug.trim();
    const isUuid = UUID_REGEX.test(cleanKey);

    if (!isSmartLinksTableKnownMissing()) {
      try {
        let query = supabase
          .from("smart_links")
          .select("*")
          .eq(isUuid ? "id" : "slug", isUuid ? cleanKey : cleanKey.toLowerCase())
          .is("deleted_at", null);

        if (userId) {
          query = query.eq("user_id", userId);
        }
        const { data: link, error: linkErr } = await query.maybeSingle();

        if (!markSmartLinksTableMissingIfErr(linkErr) && link) {
          if (!includeArchived && link.status === "archived") {
            return { link: null, platforms: [] };
          }
          const { data: platforms = [] } = await supabase
            .from("smart_link_platforms")
            .select("*")
            .eq("smart_link_id", link.id)
            .order("display_order", { ascending: true });

          return { link: link as SmartLinkRecord, platforms: platforms || [] };
        }
      } catch {}
    }

    const match = await findVaultLinkOwner(supabase, cleanKey, userId);
    if (match) {
      if (!includeArchived && match.link.status === "archived") {
        return { link: null, platforms: [] };
      }
      return {
        link: match.link,
        platforms: match.link.platforms || [],
      };
    }

    return { link: null, platforms: [] };
  } catch {
    return { link: null, platforms: [] };
  }
}

/** 3. Fetch all non-deleted smart links for a user */
export async function getUserSmartLinks(userId: string): Promise<SmartLinkRecord[]> {
  try {
    const supabase = await getSmartLinksDb();
    const results: SmartLinkRecord[] = [];

    if (!isSmartLinksTableKnownMissing()) {
      try {
        const { data: tableLinks, error: tableErr } = await supabase
          .from("smart_links")
          .select("*")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (!markSmartLinksTableMissingIfErr(tableErr) && Array.isArray(tableLinks) && tableLinks.length > 0) {
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
    }

    const rows = await listVaultUsers(supabase, userId);
    const links = rows[0]?.profile?.smart_links;
    if (!Array.isArray(links)) return [];
    return links.filter((l: any) => !l?.deleted_at).map(normalizeVaultLink);
  } catch {
    return [];
  }
}

/** 3.1 Fetch all smart links for Admin moderation */
export async function getAllSmartLinksForAdmin(): Promise<SmartLinkRecord[]> {
  try {
    const supabase = await getSmartLinksDb();

    if (!isSmartLinksTableKnownMissing()) {
      try {
        const { data: links, error } = await supabase
          .from("smart_links")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (!markSmartLinksTableMissingIfErr(error) && Array.isArray(links)) {
          return links.map(normalizeVaultLink);
        }
      } catch {}
    }

    const users = await listVaultUsers(supabase);
    const all: SmartLinkRecord[] = [];
    for (const u of users) {
      const links = Array.isArray(u.profile.smart_links) ? u.profile.smart_links : [];
      for (const l of links) {
        if (!l?.deleted_at) {
          all.push(normalizeVaultLink(l));
        }
      }
    }
    return all.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  } catch {
    return [];
  }
}

/** 4. Update smart link metadata, design & platforms (dual SQL + JSON vault) */
export async function updateSmartLinkById(params: {
  id: string;
  userId: string;
  isAdmin: boolean;
  body: Record<string, any>;
}): Promise<{ ok: boolean; statusCode?: number; link?: SmartLinkRecord; error?: string }> {
  try {
    const supabase = await getSmartLinksDb();
    const { id, userId, isAdmin, body } = params;

    const buildUpdates = (existing: SmartLinkRecord) => {
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = String(body.title).trim();
      if (body.artist !== undefined) updates.artist = String(body.artist).trim();
      if (body.cover_url !== undefined) updates.cover_url = String(body.cover_url).trim();
      if (body.upc !== undefined) updates.upc = body.upc ? String(body.upc).trim() : null;
      if (body.isrc !== undefined) updates.isrc = body.isrc ? String(body.isrc).trim() : null;
      if (body.release_date !== undefined) updates.release_date = body.release_date || null;
      if (body.release_type !== undefined) updates.release_type = body.release_type;
      if (body.genre !== undefined) updates.genre = body.genre;
      if (body.label_name !== undefined) updates.label_name = body.label_name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) updates.status = body.status;
      if (body.template !== undefined) updates.template = body.template;
      if (body.design_config !== undefined) updates.design_config = body.design_config;
      if (body.social_links !== undefined) updates.social_links = body.social_links;
      if (body.extra_content !== undefined) updates.extra_content = body.extra_content;
      if (body.is_out_now !== undefined) updates.is_out_now = body.is_out_now;
      if (body.auto_out_now !== undefined) updates.auto_out_now = body.auto_out_now;
      if (body.is_verified_artist !== undefined && isAdmin) {
        updates.is_verified_artist = Boolean(body.is_verified_artist);
      }
      void existing;
      return updates;
    };

    // Try SQL path first
    let useVault = isSmartLinksTableKnownMissing();
    if (!useVault) {
      let query = supabase.from("smart_links").select("*").eq("id", id).is("deleted_at", null);
      if (!isAdmin) query = query.eq("user_id", userId);
      const { data: existing, error: existErr } = await query.maybeSingle();

      if (markSmartLinksTableMissingIfErr(existErr)) {
        useVault = true;
      } else if (existing) {
        const updates = buildUpdates(existing as SmartLinkRecord);

        if (body.slug && String(body.slug).trim().toLowerCase() !== existing.slug) {
          const cleanSlug = String(body.slug).trim().toLowerCase();
          const slugCheck = validateCustomSlug(cleanSlug);
          if (!slugCheck.isValid) {
            return { ok: false, statusCode: 400, error: slugCheck.error };
          }
          const { data: conflict } = await supabase
            .from("smart_links")
            .select("id")
            .eq("slug", cleanSlug)
            .neq("id", id)
            .is("deleted_at", null)
            .maybeSingle();
          if (conflict) {
            return {
              ok: false,
              statusCode: 409,
              error: `Slug "${cleanSlug}" уже занят другим релизом`,
            };
          }
          await supabase
            .from("slug_history")
            .insert({ smart_link_id: id, old_slug: existing.slug, new_slug: cleanSlug })
            .then(() => undefined);
          updates.slug = cleanSlug;
        }

        const { data: updatedLink, error: updateErr } = await supabase
          .from("smart_links")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (updateErr) {
          return { ok: false, statusCode: 500, error: updateErr.message };
        }

        if (Array.isArray(body.platforms)) {
          await supabase.from("smart_link_platforms").delete().eq("smart_link_id", id);
          const platformRows = body.platforms
            .filter((p: any) => p.platform_key && p.url)
            .map((p: any, index: number) => ({
              smart_link_id: id,
              platform_key: p.platform_key,
              platform_name: p.platform_name || p.platform_key,
              url: String(p.url).trim(),
              button_text:
                p.button_text || ((updates.is_out_now ?? existing.is_out_now) ? "Слушать" : "Pre-save"),
              display_order: index,
              is_enabled: p.is_enabled !== undefined ? p.is_enabled : true,
            }));
          if (platformRows.length > 0) {
            await supabase.from("smart_link_platforms").insert(platformRows);
          }
        }

        return { ok: true, link: updatedLink as SmartLinkRecord };
      } else {
        // Check vault before declaring 404
        useVault = true;
      }
    }

    // Vault fallback path
    const found = await findVaultLinkOwner(supabase, id, isAdmin ? undefined : userId);
    if (!found) {
      return { ok: false, statusCode: 404, error: "Smart Link не найден" };
    }

    const existing = found.link;
    const updates = buildUpdates(existing);
    let slugRedirectOld: string | null = null;
    let slugRedirectNew: string | null = null;

    if (body.slug && String(body.slug).trim().toLowerCase() !== existing.slug.toLowerCase()) {
      const cleanSlug = String(body.slug).trim().toLowerCase();
      const slugCheck = validateCustomSlug(cleanSlug);
      if (!slugCheck.isValid) {
        return { ok: false, statusCode: 400, error: slugCheck.error };
      }
      if (await isSlugTakenAnywhere(supabase, cleanSlug, existing.id)) {
        return {
          ok: false,
          statusCode: 409,
          error: `Slug "${cleanSlug}" уже занят другим релизом`,
        };
      }
      slugRedirectOld = existing.slug.toLowerCase();
      slugRedirectNew = cleanSlug;
      updates.slug = cleanSlug;
    }

    let nextPlatforms = existing.platforms || [];
    if (Array.isArray(body.platforms)) {
      const effectiveOutNow = updates.is_out_now ?? existing.is_out_now;
      nextPlatforms = body.platforms
        .filter((p: any) => p.platform_key && p.url)
        .map((p: any, index: number) => ({
          id: p.id || crypto.randomUUID(),
          platform_key: p.platform_key,
          platform_name: p.platform_name || p.platform_key,
          url: String(p.url).trim(),
          button_text: p.button_text || (effectiveOutNow ? "Слушать" : "Pre-save"),
          display_order: index,
          is_enabled: p.is_enabled !== undefined ? p.is_enabled : true,
          clicks_count: Number(p.clicks_count || 0),
        }));
    }

    let finalUpdated: SmartLinkRecord | undefined;
    const saveRes = await updateVaultUserLinks(supabase, found.ownerId, (links, profile) => {
      const idx = links.findIndex((l) => l.id === existing.id);
      if (idx < 0) return { links };

      const merged: SmartLinkRecord = {
        ...links[idx],
        ...updates,
        platforms: nextPlatforms,
        updated_at: new Date().toISOString(),
      };
      links[idx] = merged;
      finalUpdated = merged;

      let extraProfilePatch: Record<string, any> | undefined;
      if (slugRedirectOld && slugRedirectNew) {
        const prevHist =
          profile.slug_history && typeof profile.slug_history === "object"
            ? { ...profile.slug_history }
            : {};
        prevHist[slugRedirectOld] = slugRedirectNew;
        extraProfilePatch = { slug_history: prevHist };
      }

      return { links, extraProfilePatch };
    });

    if (!saveRes.ok || !finalUpdated) {
      return { ok: false, statusCode: 500, error: saveRes.error || "Ошибка сохранения" };
    }

    return { ok: true, link: finalUpdated };
  } catch (err: any) {
    return { ok: false, statusCode: 500, error: err.message || "Internal error" };
  }
}

/** 5. Archive / Unarchive smart link */
export async function toggleArchiveSmartLink(params: {
  id: string;
  userId: string;
  isAdmin: boolean;
}): Promise<{ ok: boolean; statusCode?: number; status?: string; error?: string }> {
  try {
    const supabase = await getSmartLinksDb();
    const { id, userId, isAdmin } = params;

    if (!isSmartLinksTableKnownMissing()) {
      let q = supabase.from("smart_links").select("id, status").eq("id", id).is("deleted_at", null);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { data: link, error } = await q.maybeSingle();

      if (!markSmartLinksTableMissingIfErr(error) && link) {
        const nextStatus = link.status === "archived" ? "published" : "archived";
        const { data: updated, error: updErr } = await supabase
          .from("smart_links")
          .update({ status: nextStatus })
          .eq("id", id)
          .select()
          .single();
        if (updErr) return { ok: false, statusCode: 500, error: updErr.message };
        return { ok: true, status: updated.status };
      }
    }

    const found = await findVaultLinkOwner(supabase, id, isAdmin ? undefined : userId);
    if (!found) {
      return { ok: false, statusCode: 404, error: "Smart Link не найден" };
    }

    const nextStatus = found.link.status === "archived" ? "published" : "archived";
    const res = await updateVaultUserLinks(supabase, found.ownerId, (links) => {
      const idx = links.findIndex((l) => l.id === found.link.id);
      if (idx >= 0) {
        links[idx] = { ...links[idx], status: nextStatus, updated_at: new Date().toISOString() };
      }
      return { links };
    });

    if (!res.ok) return { ok: false, statusCode: 500, error: res.error };
    return { ok: true, status: nextStatus };
  } catch (err: any) {
    return { ok: false, statusCode: 500, error: err.message };
  }
}

/** 6. Delete (soft or hard) smart link */
export async function deleteSmartLinkById(params: {
  id: string;
  userId: string;
  isAdmin: boolean;
  hardDelete?: boolean;
}): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  try {
    const supabase = await getSmartLinksDb();
    const { id, userId, isAdmin, hardDelete } = params;

    if (!isSmartLinksTableKnownMissing()) {
      let q = supabase.from("smart_links").select("id, user_id").eq("id", id);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { data: existing, error } = await q.maybeSingle();

      if (!markSmartLinksTableMissingIfErr(error) && existing) {
        if (hardDelete && isAdmin) {
          await supabase.from("smart_links").delete().eq("id", id);
        } else {
          await supabase
            .from("smart_links")
            .update({ deleted_at: new Date().toISOString(), status: "archived" })
            .eq("id", id);
        }
        return { ok: true };
      }
    }

    const found = await findVaultLinkOwner(supabase, id, isAdmin ? undefined : userId);
    if (!found) {
      return { ok: false, statusCode: 404, error: "Smart Link не найден" };
    }

    const res = await updateVaultUserLinks(supabase, found.ownerId, (links) => {
      if (hardDelete && isAdmin) {
        return { links: links.filter((l) => l.id !== found.link.id) };
      }
      const next = links.map((l) =>
        l.id === found.link.id
          ? {
              ...l,
              status: "archived" as const,
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : l
      );
      return { links: next };
    });

    if (!res.ok) return { ok: false, statusCode: 500, error: res.error };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, statusCode: 500, error: err.message };
  }
}

/** 7. Duplicate smart link */
export async function duplicateSmartLinkById(params: {
  id: string;
  userId: string;
}): Promise<{ ok: boolean; statusCode?: number; link?: SmartLinkRecord; error?: string }> {
  try {
    const supabase = await getSmartLinksDb();
    const { id, userId } = params;

    const { link: original, platforms } = await getSmartLinkById(id, userId, {
      includeArchived: true,
    });

    if (!original) {
      return { ok: false, statusCode: 404, error: "Исходный Smart Link не найден" };
    }

    let copySlug = `${original.slug}-copy`;
    let count = 1;
    while (await isSlugTakenAnywhere(supabase, copySlug)) {
      count++;
      copySlug = `${original.slug}-copy-${count}`;
    }

    return await createSmartLink({
      userId,
      title: `${original.title} (Копия)`,
      artist: original.artist,
      cover_url: original.cover_url,
      custom_slug: copySlug,
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
      platforms,
    });
  } catch (err: any) {
    return { ok: false, statusCode: 500, error: err.message };
  }
}

/** 8. Subscribe fan to pre-save alerts (SQL + vault fallback) */
export async function subscribePresaveAlert(params: {
  smartLinkId: string;
  email?: string;
  telegramChatId?: string;
  preferredPlatform?: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const supabase = await getSmartLinksDb();
    const { smartLinkId, email, telegramChatId, preferredPlatform = "yandex" } = params;
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanTg = telegramChatId ? telegramChatId.trim() : null;

    if (!isSmartLinksTableKnownMissing()) {
      let query = supabase
        .from("presave_subscribers")
        .select("id")
        .eq("smart_link_id", smartLinkId);
      if (cleanEmail) query = query.eq("email", cleanEmail);
      else if (cleanTg) query = query.eq("telegram_chat_id", cleanTg);

      const { data: existing, error: selErr } = await query.maybeSingle();

      if (!markSmartLinksTableMissingIfErr(selErr)) {
        if (existing) {
          return { ok: true, message: "Вы уже подписаны на уведомление о релизе!" };
        }

        const { error: insertErr } = await supabase.from("presave_subscribers").insert({
          smart_link_id: smartLinkId,
          email: cleanEmail,
          telegram_chat_id: cleanTg,
          preferred_platform: preferredPlatform,
          status: "pending",
        });

        if (!insertErr) {
          const { data: cur } = await supabase
            .from("smart_links")
            .select("presaves_count")
            .eq("id", smartLinkId)
            .single();
          if (cur) {
            await supabase
              .from("smart_links")
              .update({ presaves_count: (cur.presaves_count || 0) + 1 })
              .eq("id", smartLinkId);
          }
          return {
            ok: true,
            message: "Pre-save успешно оформлен! Мы уведомим вас в день релиза.",
          };
        }
        if (!markSmartLinksTableMissingIfErr(insertErr)) {
          return { ok: false, error: insertErr.message };
        }
      }
    }

    const found = await findVaultLinkOwner(supabase, smartLinkId);
    if (!found) {
      return { ok: false, error: "Smart Link не найден" };
    }

    let duplicate = false;
    const res = await updateVaultUserLinks(supabase, found.ownerId, (links, profile) => {
      const prevSubs = Array.isArray(profile.presave_subscribers)
        ? [...profile.presave_subscribers]
        : [];
      const already = prevSubs.some(
        (s: any) =>
          s.smart_link_id === smartLinkId &&
          ((cleanEmail && s.email === cleanEmail) ||
            (cleanTg && s.telegram_chat_id === cleanTg))
      );
      if (already) {
        duplicate = true;
        return { links };
      }

      prevSubs.push({
        id: crypto.randomUUID(),
        smart_link_id: smartLinkId,
        email: cleanEmail,
        telegram_chat_id: cleanTg,
        preferred_platform: preferredPlatform,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      const nextLinks = links.map((l) =>
        l.id === smartLinkId ? { ...l, presaves_count: (l.presaves_count || 0) + 1 } : l
      );

      return { links: nextLinks, extraProfilePatch: { presave_subscribers: prevSubs } };
    });

    if (!res.ok) return { ok: false, error: res.error };
    if (duplicate) {
      return { ok: true, message: "Вы уже подписаны на уведомление о релизе!" };
    }
    return {
      ok: true,
      message: "Pre-save успешно оформлен! Мы уведомим вас в день релиза.",
    };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/** 9. Cron Auto Out-Now Transition (SQL + vault fallback) */
export async function runAutoOutNowTransition(): Promise<{
  ok: boolean;
  processedIds: string[];
  error?: string;
}> {
  try {
    const supabase = await getSmartLinksDb();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const processedIds: string[] = [];

    if (!isSmartLinksTableKnownMissing()) {
      const { data: expiredPreSaves, error: fetchErr } = await supabase
        .from("smart_links")
        .select("id, title, artist, release_date")
        .eq("auto_out_now", true)
        .eq("is_out_now", false)
        .eq("status", "published")
        .lte("release_date", nowIso)
        .is("deleted_at", null);

      if (!markSmartLinksTableMissingIfErr(fetchErr)) {
        if (fetchErr) {
          return { ok: false, processedIds: [], error: fetchErr.message };
        }
        for (const link of expiredPreSaves || []) {
          await supabase.from("smart_links").update({ is_out_now: true }).eq("id", link.id);
          await supabase
            .from("smart_link_platforms")
            .update({ button_text: "Слушать" })
            .eq("smart_link_id", link.id)
            .eq("button_text", "Pre-save");
          processedIds.push(link.id);
        }
        return { ok: true, processedIds };
      }
    }

    const users = await listVaultUsers(supabase);
    for (const u of users) {
      const links = Array.isArray(u.profile.smart_links) ? u.profile.smart_links : [];
      const toUpdateIds: string[] = [];
      for (const l of links) {
        if (
          !l?.deleted_at &&
          l?.auto_out_now &&
          !l?.is_out_now &&
          l?.status === "published" &&
          l?.release_date &&
          new Date(l.release_date).getTime() <= nowMs
        ) {
          toUpdateIds.push(l.id);
        }
      }
      if (toUpdateIds.length > 0) {
        await updateVaultUserLinks(supabase, u.user_id, (userLinks) => ({
          links: userLinks.map((l) =>
            toUpdateIds.includes(l.id)
              ? {
                  ...l,
                  is_out_now: true,
                  updated_at: nowIso,
                  platforms: (l.platforms || []).map((p) =>
                    p.button_text === "Pre-save" ? { ...p, button_text: "Слушать" } : p
                  ),
                }
              : l
          ),
        }));
        processedIds.push(...toUpdateIds);
      }
    }

    return { ok: true, processedIds };
  } catch (err: any) {
    return { ok: false, processedIds: [], error: err.message };
  }
}

/** 10. Record click or view event with per-platform tracking */
export async function recordLinkClickEvent(params: {
  linkId: string;
  eventType: "view" | "click" | "presave";
  platformKey?: string;
}) {
  try {
    const supabase = await getSmartLinksDb();
    let tableUpdated = false;

    if (!isSmartLinksTableKnownMissing()) {
      try {
        if (params.eventType === "view") {
          const { data: cur, error } = await supabase
            .from("smart_links")
            .select("views_count")
            .eq("id", params.linkId)
            .single();
          if (!markSmartLinksTableMissingIfErr(error) && cur) {
            await supabase
              .from("smart_links")
              .update({ views_count: (cur.views_count || 0) + 1 })
              .eq("id", params.linkId);
            tableUpdated = true;
          }
        } else if (params.eventType === "click") {
          const { data: cur, error } = await supabase
            .from("smart_links")
            .select("clicks_count")
            .eq("id", params.linkId)
            .single();
          if (!markSmartLinksTableMissingIfErr(error) && cur) {
            await supabase
              .from("smart_links")
              .update({ clicks_count: (cur.clicks_count || 0) + 1 })
              .eq("id", params.linkId);
            tableUpdated = true;
          }

          if (tableUpdated && params.platformKey) {
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
          const { data: cur, error } = await supabase
            .from("smart_links")
            .select("presaves_count")
            .eq("id", params.linkId)
            .single();
          if (!markSmartLinksTableMissingIfErr(error) && cur) {
            await supabase
              .from("smart_links")
              .update({ presaves_count: (cur.presaves_count || 0) + 1 })
              .eq("id", params.linkId);
            tableUpdated = true;
          }
        }
      } catch {}
    }

    if (!tableUpdated) {
      const found = await findVaultLinkOwner(supabase, params.linkId);
      if (found) {
        await updateVaultUserLinks(supabase, found.ownerId, (links) => {
          const idx = links.findIndex((l) => l.id === found.link.id);
          if (idx < 0) return { links };

          const target = { ...links[idx] };
          if (params.eventType === "view") {
            target.views_count = (target.views_count || 0) + 1;
          } else if (params.eventType === "click") {
            target.clicks_count = (target.clicks_count || 0) + 1;
            if (params.platformKey) {
              target.analytics_clicks = { ...(target.analytics_clicks || {}) };
              target.analytics_clicks[params.platformKey] =
                (target.analytics_clicks[params.platformKey] || 0) + 1;

              if (Array.isArray(target.platforms)) {
                target.platforms = target.platforms.map((pl) =>
                  pl.platform_key === params.platformKey
                    ? { ...pl, clicks_count: (pl.clicks_count || 0) + 1 }
                    : pl
                );
              }
            }
          } else if (params.eventType === "presave") {
            target.presaves_count = (target.presaves_count || 0) + 1;
          }

          links[idx] = target;
          return { links };
        });
      }
    }
  } catch (e) {
    console.warn("[analytics] record event error:", e);
  }
}
