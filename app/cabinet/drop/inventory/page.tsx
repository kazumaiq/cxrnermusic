import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getUserInventory,
  getProfileByUserId,
  getCxpWallet,
  getDropHistory,
} from "@/lib/ecosystemDb";
import CabinetNav from "@/components/CabinetNav";
import DropGameArena from "@/components/drop/DropGameArena";

export const dynamic = "force-dynamic";

export default async function CabinetInventoryPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profile, items, wallet, history] = await Promise.all([
    getProfileByUserId(user.id),
    getUserInventory(user.id),
    getCxpWallet(user.id),
    getDropHistory(user.id),
  ]);

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2]">
      <CabinetNav />
      <DropGameArena
        initialItems={items}
        initialBalance={wallet.balance}
        initialHistory={history}
        username={profile?.username || user.email?.split("@")[0] || "artist"}
        isLoggedIn={true}
        defaultTab="inventory"
      />
    </div>
  );
}
