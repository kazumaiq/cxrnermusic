import { redirect, notFound } from "next/navigation";
import Container from "../../../../../components/Container";
import LinkAnalyticsClient from "../../../../../components/link/LinkAnalyticsClient";
import { getSupabaseServerClient } from "../../../../../lib/supabaseServer";
import { isAdminUser } from "../../../../../lib/admin";
import { getSmartLinkById } from "../../../../../lib/smartLinksDb";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Аналитика Smart Link | CXRNER LINK",
};

export default async function SmartLinkAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/dashboard/links/${id}/analytics`);
  }

  const isAdmin = isAdminUser(user);

  const { link } = await getSmartLinkById(id, isAdmin ? undefined : user.id);

  if (!link) {
    notFound();
  }

  return (
    <div className="relative min-h-[100svh] bg-[#050407] text-white pt-24 pb-20 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 right-1/3 w-96 h-96 bg-[#8737FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10">
        <LinkAnalyticsClient linkId={link.id} linkTitle={link.title} linkSlug={link.slug} />
      </Container>
    </div>
  );
}
