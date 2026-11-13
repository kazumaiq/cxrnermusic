import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getUserInventory, getProfileByUserId } from "@/lib/ecosystemDb";
import CabinetNav from "@/components/CabinetNav";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function CabinetInventoryPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getProfileByUserId(user.id);
  const items = await getUserInventory(user.id);

  // Fetch CXP balance
  let balance = 100;
  try {
    const { data: wallet } = await supabase
      .from("cxrner_cxp_wallet")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    if (wallet) {
      balance = wallet.balance;
    }
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-16 pb-28 selection:bg-[#8737FF] selection:text-white">
      <CabinetNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <InventoryClient
          initialItems={items}
          initialBalance={balance}
          username={profile?.username || "artist"}
        />
      </div>
    </div>
  );
}
