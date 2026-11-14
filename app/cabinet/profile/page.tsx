import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getProfileByUserId,
  calculateProfileCompletion,
  upsertUserProfile,
  sanitizeUsername,
  isCeoAccount,
  CEO_USERNAME,
} from "@/lib/ecosystemDb";
import CabinetNav from "@/components/CabinetNav";
import ProfileEditorClient from "./ProfileEditorClient";

export const dynamic = "force-dynamic";

export default async function CabinetProfilePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isCeoUser = isCeoAccount({ email: user.email });
  let profile = await getProfileByUserId(user.id);
  if (!profile || (isCeoUser && profile.username !== CEO_USERNAME)) {
    const rawMeta = (user.user_metadata as any) || {};
    const initialUsername = isCeoUser
      ? CEO_USERNAME
      : sanitizeUsername(rawMeta.username || rawMeta.artist_name || user.email?.split("@")[0] || "") ||
        `artist_${user.id.slice(0, 6)}`;
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

  const completion = calculateProfileCompletion(profile);

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-16 sm:pt-[72px] pb-28 selection:bg-[#8737FF] selection:text-white">
      <CabinetNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ProfileEditorClient
          initialProfile={profile}
          initialCompletion={completion}
          userEmail={user.email || ""}
        />
      </div>
    </div>
  );
}
