import { redirect } from "next/navigation";
import Container from "../../../../components/Container";
import CreateLinkWizard from "../../../../components/link/CreateLinkWizard";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Создать Smart Link | CXRNER LINK",
};

export default async function NewLinkPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/links/new");
  }

  return (
    <div className="relative min-h-[100svh] bg-[#050407] text-white pt-24 pb-20 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-[#8737FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10 space-y-8">
        <div className="flex items-center gap-2 font-mono text-xs text-[#D9D9E2]/60">
          <Link href="/dashboard/links" className="hover:text-white transition flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Все смарт-ссылки</span>
          </Link>
          <span>/</span>
          <span className="text-[#B46BFF]">Новая ссылка</span>
        </div>

        <CreateLinkWizard />
      </Container>
    </div>
  );
}
