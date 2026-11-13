import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import VerificationAdminClient from "./VerificationAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const isAuthed = await verifyAdminRequest();
  if (!isAuthed) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-16 pb-28 selection:bg-[#8737FF] selection:text-white">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <VerificationAdminClient />
      </div>
    </div>
  );
}
