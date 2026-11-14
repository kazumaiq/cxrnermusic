import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getArtistProfileByUserId,
  getProfileByUserId,
  getVerificationByUserId,
} from "@/lib/ecosystemDb";
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

  const [profile, artistProfile, verification] = await Promise.all([
    getProfileByUserId(user.id),
    getArtistProfileByUserId(user.id),
    getVerificationByUserId(user.id),
  ]);

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
