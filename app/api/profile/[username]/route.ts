import { NextResponse } from "next/server";
import {
  getProfileByUsername,
  getUserInventory,
  getArtistProfileByUserId,
} from "@/lib/ecosystemDb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const params = await ctx.params;
    const username = params.username;
    if (!username) {
      return NextResponse.json({ ok: false, error: "USERNAME_REQUIRED" }, { status: 400 });
    }

    const profile = await getProfileByUsername(username);
    if (!profile) {
      return NextResponse.json({ ok: false, error: "PROFILE_NOT_FOUND" }, { status: 404 });
    }

    // Check if profile is public or viewer is owner
    let isOwner = false;
    try {
      const supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.id === profile.id) {
        isOwner = true;
      }
    } catch {
      // ignore
    }

    if (!profile.privacy_settings.is_public && !isOwner) {
      return NextResponse.json({ ok: false, error: "PROFILE_IS_PRIVATE" }, { status: 403 });
    }

    // Get inventory items for showcase (pinned items)
    const inventory = await getUserInventory(profile.id);
    const pinnedItems = inventory.filter((item) => item.is_pinned && !item.is_hidden);

    // Get artist profile if any
    const artistProfile = await getArtistProfileByUserId(profile.id);

    // Sanitize private fields before returning to public
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      bio: profile.bio,
      country: profile.country,
      city: profile.city,
      genres: profile.genres,
      music_roles: profile.music_roles,
      social_links: profile.social_links,
      music_links: profile.privacy_settings.show_music ? profile.music_links : [],
      is_artist_verified: profile.is_artist_verified,
      completion_percentage: profile.completion_percentage,
      equipped_frame: profile.equipped_frame,
      equipped_effect: profile.equipped_effect,
      equipped_title: profile.equipped_title,
      equipped_badge: profile.equipped_badge,
      equipped_showcase_item: profile.equipped_showcase_item,
      equipped_background: profile.equipped_background,
      pinned_achievements: profile.pinned_achievements,
      pinned_items: profile.privacy_settings.show_inventory ? pinnedItems : [],
      total_items_count: profile.privacy_settings.show_inventory ? inventory.length : null,
      artist_project: artistProfile
        ? {
            stage_name: artistProfile.stage_name,
            project_type: artistProfile.project_type,
            genres: artistProfile.genres,
            verification_status: artistProfile.verification_status,
            spotify_url: artistProfile.spotify_url,
            apple_music_url: artistProfile.apple_music_url,
            yandex_music_url: artistProfile.yandex_music_url,
            vk_music_url: artistProfile.vk_music_url,
            soundcloud_url: artistProfile.soundcloud_url,
            youtube_url: artistProfile.youtube_url,
            members_count: artistProfile.members.length,
          }
        : null,
      created_at: profile.created_at,
    };

    return NextResponse.json({ ok: true, profile: publicProfile });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
