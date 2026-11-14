import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import Container from "@/components/Container";
import DropAdminClient from "./DropAdminClient";
import { getAllSpecialRewardClaims, getDropAnalytics } from "@/lib/ecosystemDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — CXRNER DROP Management",
};

export default async function AdminDropPage() {
  const isAuthed = await verifyAdminRequest();
  if (!isAuthed) {
    redirect("/admin");
  }

  const [claims, analytics] = await Promise.all([
    getAllSpecialRewardClaims(),
    getDropAnalytics(),
  ]);

  return (
    <div className="min-h-screen bg-[#050407] text-white pt-16 sm:pt-[72px] pb-24 selection:bg-[#8737FF] selection:text-white">
      <AdminNav />
      <Container className="max-w-6xl pt-8">
        <DropAdminClient initialClaims={claims} initialAnalytics={analytics} />
      </Container>
    </div>
  );
}
