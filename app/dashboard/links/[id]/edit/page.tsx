import { redirect, notFound } from "next/navigation";
import Container from "../../../../../components/Container";
import EditLinkClient from "../../../../../components/link/EditLinkClient";
import { getSupabaseServerClient } from "../../../../../lib/supabaseServer";
import { isAdminUser } from "../../../../../lib/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Редактирование Smart Link | CXRNER LINK",
};

export default async function EditSmartLinkPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/dashboard/links/${id}/edit`);
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
    <div className="relative min-h-[100svh] bg-[#050407] text-white pt-24 pb-20 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#8737FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10">
        <EditLinkClient initialLink={link} initialPlatforms={platforms || []} />
      </Container>
    </div>
  );
}
