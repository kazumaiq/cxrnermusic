import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getProfileByUserId,
  upsertUserProfile,
  calculateProfileCompletion,
  sanitizeUsername,
  getProfileByUsername,
  recordReferralAttribution,
  evaluateReferralMilestones,
  getReferralStatsForUser,
  isCeoAccount,
  CEO_USERNAME,
  CEO_EMAIL,
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

    const isCeoUser = isCeoAccount({ email: user.email });
    let profile = await getProfileByUserId(user.id);
    if (!profile || (isCeoUser && profile.username !== CEO_USERNAME)) {
      // Create or elevate initial profile for user
      const rawMeta = (user.user_metadata as any) || {};
      const initialUsername = isCeoUser
        ? CEO_USERNAME
        : sanitizeUsername(rawMeta.username || rawMeta.artist_name || user.email?.split("@")[0] || "") ||
          `user_${user.id.slice(0, 6)}`;

      const initialName = isCeoUser
        ? profile?.display_name && profile.display_name !== "CXRNER Artist"
          ? profile.display_name
          : "KAZUMA"
        : rawMeta.artist_name || rawMeta.full_name || rawMeta.name || "CXRNER Artist";

      const created = await upsertUserProfile({
        userId: user.id,
        userEmail: user.email,
        username: initialUsername,
        displayName: initialName,
        avatarUrl: profile?.avatar_url || rawMeta.avatar_url || rawMeta.picture || null,
      });
      profile = created.profile;
    }

    // Reconcile pending referral attribution from cookie or auth metadata
    const cookieStore = await cookies();
    const refCookie = cookieStore.get("cxrner_ref_code")?.value;
    const rawMeta = (user.user_metadata as any) || {};
    const pendingRef = (refCookie || rawMeta.referred_by_code || "").trim();
    if (pendingRef) {
      const refStats = await getReferralStatsForUser(user.id).catch(() => null);
      if (!refStats?.referredByCode) {
        await recordReferralAttribution({
          referrerCode: pendingRef,
          newUserId: user.id,
          emailVerified: Boolean(user.email_confirmed_at || user.confirmed_at),
        }).catch(() => {});
      }
    }

    const emailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
    if (emailConfirmed || profile.telegram_id) {
      await evaluateReferralMilestones(user.id, {
        emailVerified: emailConfirmed,
        telegramLinked: Boolean(profile.telegram_id),
      }).catch(() => {});
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

    const isCeoUser = isCeoAccount({ email: user.email });

    // Check username uniqueness if changing
    if (body.username) {
      const cleanUsername = sanitizeUsername(body.username);
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { ok: false, error: "Username must be at least 3 characters" },
          { status: 400 }
        );
      }
      if (cleanUsername === CEO_USERNAME && !isCeoUser) {
        return NextResponse.json(
          { ok: false, error: "Юзернейм @kazumaiq зарезервирован за основателем (CEO) CXRNER MUSIC" },
          { status: 409 }
        );
      }
      const existing = await getProfileByUsername(cleanUsername);
      if (
        existing &&
        existing.id !== user.id &&
        !(isCeoUser && cleanUsername === CEO_USERNAME)
      ) {
        return NextResponse.json(
          { ok: false, error: "Этот username уже занят другим артистом" },
          { status: 409 }
        );
      }
    }

    // Sanitize bio to prevent XSS / malicious HTML
    let sanitizedBio = body.bio;
    if (sanitizedBio !== undefined && sanitizedBio !== null) {
      sanitizedBio = String(sanitizedBio)
        .replace(/<[^>]*>?/gm, "")
        .slice(0, 500);
    }

    const cleanUsernameInput = body.username !== undefined ? sanitizeUsername(body.username) : undefined;
    const rawDisplayName = body.displayName !== undefined ? body.displayName : body.display_name;
    const rawAvatarUrl = body.avatarUrl !== undefined ? body.avatarUrl : body.avatar_url;
    const rawBannerUrl = body.bannerUrl !== undefined ? body.bannerUrl : body.banner_url;
    const rawMusicRoles = body.musicRoles !== undefined ? body.musicRoles : body.music_roles;
    const rawSocialLinks = body.socialLinks !== undefined ? body.socialLinks : body.social_links;
    const rawMusicLinks = body.musicLinks !== undefined ? body.musicLinks : body.music_links;
    const rawPrivacy = body.privacySettings !== undefined ? body.privacySettings : body.privacy_settings;
    const rawPinnedAch = body.pinnedAchievements !== undefined ? body.pinnedAchievements : body.pinned_achievements;
    const rawPinnedItems = body.pinnedItems !== undefined ? body.pinnedItems : body.pinned_items;

    const { profile, rewardsAwarded } = await upsertUserProfile({
      userId: user.id,
      userEmail: user.email,
      username: isCeoUser ? CEO_USERNAME : cleanUsernameInput,
      displayName: rawDisplayName,
      avatarUrl: rawAvatarUrl,
      bannerUrl: rawBannerUrl,
      bio: sanitizedBio,
      country: body.country,
      city: body.city,
      genres: body.genres,
      musicRoles: rawMusicRoles,
      socialLinks: rawSocialLinks,
      musicLinks: rawMusicLinks,
      privacySettings: rawPrivacy,
      equippedFrame: body.equippedFrame !== undefined ? body.equippedFrame : undefined,
      equippedEffect: body.equippedEffect !== undefined ? body.equippedEffect : undefined,
      equippedTitle: body.equippedTitle !== undefined ? body.equippedTitle : undefined,
      equippedBadge: body.equippedBadge !== undefined ? body.equippedBadge : undefined,
      equippedShowcaseItem: body.equippedShowcaseItem !== undefined ? body.equippedShowcaseItem : undefined,
      equippedBackground: body.equippedBackground !== undefined ? body.equippedBackground : undefined,
      pinnedAchievements: rawPinnedAch,
      pinnedItems: rawPinnedItems,
    });

    const emailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
    if (emailConfirmed || profile.telegram_id) {
      await evaluateReferralMilestones(user.id, {
        emailVerified: emailConfirmed,
        telegramLinked: Boolean(profile.telegram_id),
      }).catch(() => {});
    }

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
