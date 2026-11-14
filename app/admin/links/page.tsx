import { redirect } from "next/navigation";
import Container from "../../../components/Container";
import AdminLinksClient from "../../../components/link/AdminLinksClient";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { getAdminUser } from "../../../lib/admin";
import AdminNav from "../../../components/admin/AdminNav";
import Link from "next/link";
import { ShieldCheck, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Модерация CXRNER LINK | CXRNER MUSIC ADMIN",
};

export default async function AdminLinksPage() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/admin");
  }

  const supabase = await getSupabaseServerClient();
  const { data: links = [] } = await supabase
    .from("smart_links")
    .select("id, user_id, title, artist, cover_url, slug, status, is_out_now, is_verified_artist, views_count, clicks_count, presaves_count, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="relative min-h-[100svh] bg-[#050407] text-white pt-16 sm:pt-[72px] pb-20 overflow-x-clip">
      <AdminNav />
      <Container className="relative z-10 pt-8 space-y-8">
        <div className="flex items-center gap-2 font-mono text-xs text-[#D9D9E2]/60">
          <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Панель управления</span>
          </Link>
          <span>/</span>
          <span className="text-[#00F0FF]">CXRNER LINK МОДЕРАЦИЯ</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00F0FF]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ADMINISTRATION &amp; MODERATION</span>
            </div>
            <h1 className="font-heavy text-3xl sm:text-4xl uppercase tracking-tight text-white">
              Все смарт-ссылки платформы
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Управление ссылками пользователей, верификация артистов и аудит переходов.
            </p>
          </div>
        </div>

        <AdminLinksClient initialLinks={links || []} />
      </Container>
    </div>
  );
}
