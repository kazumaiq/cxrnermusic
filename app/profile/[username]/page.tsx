import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByUsername, getUserInventory, getArtistProfileByUserId } from "@/lib/ecosystemDb";
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
          url: profile.avatar_url || "/logo.png",
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

  // Get showcase pinned items
  const inventory = await getUserInventory(profile.id);
  const pinnedItems = inventory.filter((item) => item.is_pinned && !item.is_hidden);
  const artistProject = await getArtistProfileByUserId(profile.id);

  return (
    <ProfileClientView
      profile={profile}
      pinnedItems={pinnedItems}
      totalInventoryCount={inventory.length}
      artistProject={artistProject}
    />
  );
}
