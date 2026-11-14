import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import UserDossierClient from "./UserDossierClient";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const isAuthed = await verifyAdminRequest();
  if (!isAuthed) {
    redirect("/admin");
  }

  const params = await props.params;

  return (
    <div className="min-h-screen bg-[#050407] text-[#D9D9E2] pt-16 sm:pt-[72px] pb-28 selection:bg-[#8737FF] selection:text-white">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <UserDossierClient userId={params.id} />
      </div>
    </div>
  );
}
