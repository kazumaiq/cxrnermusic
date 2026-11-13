import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getProfileByUserId,
  upsertUserProfile,
  calculateProfileCompletion,
  sanitizeUsername,
  getProfileByUsername,
} from "@/lib/ecosystemDb";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    let profile = await getProfileByUserId(user.id);
    if (!profile) {
      // Create initial profile for user
      const rawMeta = (user.user_metadata as any) || {};
      const initialUsername =
        sanitizeUsername(rawMeta.username || rawMeta.artist_name || user.email?.split("@")[0] || "") ||
        `user_${user.id.slice(0, 6)}`;

      const initialName = rawMeta.artist_name || rawMeta.full_name || rawMeta.name || "CXRNER Artist";

      const created = await upsertUserProfile({
        userId: user.id,
        username: initialUsername,
        displayName: initialName,
        avatarUrl: rawMeta.avatar_url || rawMeta.picture || null,
      });
      profile = created.profile;
    }

    const completion = calculateProfileCompletion(profile);

    return NextResponse.json({
      ok: true,
      profile,
      completion,
      user_email: user.email,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();

    // Check username uniqueness if changing
    if (body.username) {
      const cleanUsername = sanitizeUsername(body.username);
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { ok: false, error: "Username must be at least 3 characters" },
          { status: 400 }
        );
      }
      const existing = await getProfileByUsername(cleanUsername);
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { ok: false, error: "Этот username уже занят другим артистом" },
          { status: 409 }
        );
      }
    }

    // Sanitize bio to prevent XSS / malicious HTML
    let sanitizedBio = body.bio;
    if (sanitizedBio) {
      sanitizedBio = String(sanitizedBio)
        .replace(/<[^>]*>?/gm, "")
        .slice(0, 500);
    }

    const { profile, rewardsAwarded } = await upsertUserProfile({
      userId: user.id,
      username: body.username,
      displayName: body.displayName || body.display_name,
      avatarUrl: body.avatarUrl || body.avatar_url,
      bannerUrl: body.bannerUrl || body.banner_url,
      bio: sanitizedBio,
      country: body.country,
      city: body.city,
      genres: body.genres,
      musicRoles: body.musicRoles || body.music_roles,
      socialLinks: body.socialLinks || body.social_links,
      musicLinks: body.musicLinks || body.music_links,
      privacySettings: body.privacySettings || body.privacy_settings,
      equippedFrame: body.equippedFrame !== undefined ? body.equippedFrame : undefined,
      equippedEffect: body.equippedEffect !== undefined ? body.equippedEffect : undefined,
      equippedTitle: body.equippedTitle !== undefined ? body.equippedTitle : undefined,
      equippedBadge: body.equippedBadge !== undefined ? body.equippedBadge : undefined,
      equippedShowcaseItem: body.equippedShowcaseItem !== undefined ? body.equippedShowcaseItem : undefined,
      equippedBackground: body.equippedBackground !== undefined ? body.equippedBackground : undefined,
      pinnedAchievements: body.pinnedAchievements || body.pinned_achievements,
      pinnedItems: body.pinnedItems || body.pinned_items,
    });

    const completion = calculateProfileCompletion(profile);

    return NextResponse.json({
      ok: true,
      profile,
      completion,
      rewardsAwarded,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
