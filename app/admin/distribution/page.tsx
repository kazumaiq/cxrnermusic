import { Metadata } from "next";
import { getAdminUser, verifyAdminRequest } from "@/lib/admin";
import DistributionCmsClient from "@/components/admin/DistributionCmsClient";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

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

  return <DistributionCmsClient initialUser={adminUser} />;
}
