import { redirect } from "next/navigation";
import Container from "../../../components/Container";
import DashboardLinksClient from "../../../components/link/DashboardLinksClient";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import Link from "next/link";
import { ChevronLeft, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CXRNER LINK — Управление смарт-ссылками | CXRNER MUSIC",
};

export default async function DashboardLinksPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/links");
  }

  const { data: links = [] } = await supabase
    .from("smart_links")
    .select("id, title, artist, cover_url, slug, status, is_out_now, views_count, clicks_count, presaves_count, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="relative min-h-[100svh] bg-[#050407] text-white pt-24 pb-20 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#8737FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#D9D9E2]/60">
          <Link href="/dashboard" className="hover:text-white transition flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Кабинет</span>
          </Link>
          <span>/</span>
          <span className="text-[#B46BFF]">CXRNER LINK</span>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#B46BFF]">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>MUSIC SMART LINKS PLATFORM</span>
            </div>
            <h1 className="font-heavy text-3xl sm:text-4xl uppercase tracking-tight text-white">
              Мои смарт-ссылки
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Создавайте, настраивайте и анализируйте страницы релизов и Pre-save кампании.
            </p>
          </div>
        </div>

        {/* Client Interactive Table & Analytics */}
        <DashboardLinksClient initialLinks={links || []} />
      </Container>
    </div>
  );
}
