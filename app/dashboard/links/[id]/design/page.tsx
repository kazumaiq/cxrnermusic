import { redirect, notFound } from "next/navigation";
import PageBuilderClient from "../../../../../components/link/PageBuilderClient";
import { getSupabaseServerClient } from "../../../../../lib/supabaseServer";
import { isAdminUser } from "../../../../../lib/admin";
import { getSmartLinkById } from "../../../../../lib/smartLinksDb";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Page Builder — Оформление Smart Link | CXRNER LINK",
};

export default async function SmartLinkDesignPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/dashboard/links/${id}/design`);
  }

  const isAdmin = isAdminUser(user);
  const { link, platforms } = await getSmartLinkById(id, isAdmin ? undefined : user.id, {
    includeArchived: true,
  });

  if (!link) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050407] text-white pt-20">
      <PageBuilderClient
        initialLink={link}
        platforms={platforms || []}
        initialPlatforms={platforms || []}
      />
    </div>
  );
}
