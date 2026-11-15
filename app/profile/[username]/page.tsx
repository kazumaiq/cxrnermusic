import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getProfileByUsername,
  getUserInventory,
  getArtistProfileByUserId,
  getUserAchievements,
  isCeoAccount,
  CEO_USERNAME,
} from "@/lib/ecosystemDb";
import ProfileClientView from "./ProfileClientView";

export async function generateMetadata(
  props: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const profile = await getProfileByUsername(params.username);

  if (!profile) {
    return {
      title: "Профиль не найден — CXRNER ID",
    };
  }

  const title = `${profile.display_name} (@${profile.username}) — CXRNER ID`;
  const desc = profile.bio || `Цифровой музей и коллекция артефактов ${profile.display_name} в экосистеме CXRNER MUSIC.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [
        {
          url: profile.avatar_url && !profile.avatar_url.startsWith("data:") ? profile.avatar_url : "/logo.png",
          width: 600,
          height: 600,
          alt: profile.display_name,
        },
      ],
    },
  };
}

export default async function PublicProfilePage(
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  const profile = await getProfileByUsername(params.username);

  if (!profile) {
    notFound();
  }

  let isOwner = false;
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isOwner =
        user.id === profile.id ||
        (profile.username === CEO_USERNAME && isCeoAccount({ email: user.email }));
    }
  } catch {
    // ignore unauthenticated visit
  }

  // Get showcase pinned items & genuine unlocked achievements
  const isCeoProfile = isCeoAccount({ username: profile.username });
  const [inventory, artistProject, unlockedAchievements] = await Promise.all([
    getUserInventory(profile.id),
    getArtistProfileByUserId(profile.id),
    getUserAchievements(profile.id, isCeoProfile),
  ]);
  const pinnedItems = inventory.filter((item) => item.is_pinned && !item.is_hidden);

  return (
    <ProfileClientView
      profile={profile}
      pinnedItems={pinnedItems}
      totalInventoryCount={inventory.length}
      artistProject={artistProject}
      unlockedAchievements={unlockedAchievements}
      isOwner={isOwner}
    />
  );
}
