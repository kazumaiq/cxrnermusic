import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getProfileByUserId,
  calculateProfileCompletion,
  upsertUserProfile,
  sanitizeUsername,
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

  let profile = await getProfileByUserId(user.id);
  if (!profile) {
    const rawMeta = (user.user_metadata as any) || {};
    const initialUsername =
      sanitizeUsername(rawMeta.username || rawMeta.artist_name || user.email?.split("@")[0] || "") ||
      `artist_${user.id.slice(0, 6)}`;
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
