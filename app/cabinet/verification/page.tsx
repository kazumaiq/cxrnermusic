import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getArtistProfileByUserId, getProfileByUserId } from "@/lib/ecosystemDb";
import CabinetNav from "@/components/CabinetNav";
import VerificationClient from "./VerificationClient";

export const dynamic = "force-dynamic";

export default async function CabinetVerificationPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getProfileByUserId(user.id);
  const artistProfile = await getArtistProfileByUserId(user.id);

  // Fetch latest verification record
  let verification = null;
  try {
    const { data } = await supabase
      .from("cxrner_artist_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    verification = data;
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-16 sm:pt-[72px] pb-28 selection:bg-[#8737FF] selection:text-white">
      <CabinetNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <VerificationClient
          profile={profile}
          artistProfile={artistProfile}
          initialVerification={verification}
        />
      </div>
    </div>
  );
}
