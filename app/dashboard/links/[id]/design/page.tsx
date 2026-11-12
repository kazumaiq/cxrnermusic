import { redirect, notFound } from "next/navigation";
import PageBuilderClient from "../../../../../components/link/PageBuilderClient";
import { getSupabaseServerClient } from "../../../../../lib/supabaseServer";
import { isAdminUser } from "../../../../../lib/admin";

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

  let query = supabase.from("smart_links").select("*").eq("id", id).is("deleted_at", null);
  if (!isAdmin) query = query.eq("user_id", user.id);
  const { data: link } = await query.maybeSingle();

  if (!link) {
    notFound();
  }

  const { data: platforms = [] } = await supabase
    .from("smart_link_platforms")
    .select("*")
    .eq("smart_link_id", id)
    .order("display_order", { ascending: true });

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
