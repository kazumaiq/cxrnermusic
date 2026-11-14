import { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getUserInventory,
  getProfileByUserId,
  getCxpWallet,
  getDropHistory,
} from "@/lib/ecosystemDb";
import DropGameArena from "@/components/drop/DropGameArena";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CXRNER DROP // SPECIMEN ARCHIVE — Browser Game",
  description:
    "Открывай запечатанные кейсы, находи редкие артефакты, собирай коллекцию и получай эксклюзивные награды лейбла CXRNER MUSIC.",
};

export default async function DropGamePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: any[] = [];
  let balance = 100;
  let history: any[] = [];
  let username = "guest";
  const isLoggedIn = Boolean(user);

  if (user) {
    const [profile, userItems, wallet, userHistory] = await Promise.all([
      getProfileByUserId(user.id),
      getUserInventory(user.id),
      getCxpWallet(user.id),
      getDropHistory(user.id),
    ]);

    items = userItems;
    balance = wallet.balance;
    history = userHistory;
    username = profile?.username || user.email?.split("@")[0] || "artist";
  }

  return (
    <DropGameArena
      initialItems={items}
      initialBalance={balance}
      initialHistory={history}
      username={username}
      isLoggedIn={isLoggedIn}
      defaultTab="play"
    />
  );
}
