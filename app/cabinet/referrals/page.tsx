import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getReferralStatsForUser, getReferralLeaderboard, getProfileByUserId } from "@/lib/ecosystemDb";
import CabinetNav from "@/components/CabinetNav";
import ReferralClient from "./ReferralClient";

export const dynamic = "force-dynamic";

export default async function CabinetReferralsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getProfileByUserId(user.id);
  const stats = await getReferralStatsForUser(user.id);
  const leaderboard = await getReferralLeaderboard();

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-16 pb-28 selection:bg-[#8737FF] selection:text-white">
      <CabinetNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ReferralClient
          stats={stats}
          leaderboard={leaderboard}
          userOptedIn={profile?.privacy_settings?.show_in_leaderboard !== false}
        />
      </div>
    </div>
  );
}
