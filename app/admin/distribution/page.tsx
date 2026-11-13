import { Metadata } from "next";
import { getAdminUser, verifyAdminRequest } from "@/lib/admin";
import DistributionCmsClient from "@/components/admin/DistributionCmsClient";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAllUnifiedReleases, computeCmsStats } from "@/lib/telegramReleases";
import { getServiceSupabase } from "@/app/api/admin/moderation/route";

export const metadata: Metadata = {
  title: "CXRNER MUSIC — Unified Distribution & Moderation CMS",
  description:
    "Единая система управления релизами, модерацией и отгрузкой лейбла CXRNER MUSIC (Web + Telegram + Supabase).",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DistributionPage() {
  const isAuthorized = await verifyAdminRequest();
  const adminUser = await getAdminUser();

  if (!isAuthorized) {
    return <AdminLoginForm defaultEmail="cxrner.label@gmail.com" redirectUrl="/admin/distribution" />;
  }

  // Pre-fetch releases and stats on server to eliminate initial 0 counts
  let initialForms: any[] = [];
  let initialStats: any = null;

  try {
    const supabase = getServiceSupabase();
    const all = await getAllUnifiedReleases(supabase);
    initialStats = computeCmsStats(all);
    initialForms = all.filter((f) => !f.user_deleted && f.status !== "deleted");
  } catch (err) {
    console.warn("[Admin Distribution SSR] Initial releases load notice:", err);
  }

  return (
    <DistributionCmsClient
      initialUser={adminUser}
      initialForms={initialForms}
      initialStats={initialStats}
    />
  );
}
