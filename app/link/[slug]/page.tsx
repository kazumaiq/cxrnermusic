import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import PublicSmartLink from "../../../components/link/PublicSmartLink";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 30; // Revalidate public pages every 30 seconds

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  const supabase = await getSupabaseServerClient();
  const { data: link } = await supabase
    .from("smart_links")
    .select("title, artist, cover_url, description, label_name, is_out_now")
    .eq("slug", cleanSlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!link) {
    return {
      title: "Релиз не найден | CXRNER LINK",
      description: "Музыкальная смарт-ссылка CXRNER LINK",
    };
  }

  const pageTitle = `${link.artist} — ${link.title} | ${link.is_out_now ? "Слушать" : "Pre-save"}`;
  const pageDesc =
    link.description ||
    `Слушайте официальный релиз «${link.title}» от ${link.artist} на всех музыкальных площадках через CXRNER LINK.`;
  const canonicalUrl = `https://link.cxrnermusic.com/${cleanSlug}`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      siteName: "CXRNER LINK",
      images: [
        {
          url: link.cover_url,
          width: 1200,
          height: 1200,
          alt: `${link.artist} — ${link.title}`,
        },
      ],
      type: "music.album",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [link.cover_url],
    },
    other: {
      "telegram:channel": "@cxrnermusic",
    },
  };
}

export default async function SmartLinkPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  const supabase = await getSupabaseServerClient();

  // 1. Fetch smart link
  const { data: link } = await supabase
    .from("smart_links")
    .select("*")
    .eq("slug", cleanSlug)
    .is("deleted_at", null)
    .maybeSingle();

  // 2. If not found, check slug_history for 301 redirect
  if (!link) {
    const { data: history } = await supabase
      .from("slug_history")
      .select("new_slug")
      .eq("old_slug", cleanSlug)
      .maybeSingle();

    if (history?.new_slug) {
      redirect(`/link/${history.new_slug}`);
    }

    notFound();
  }

  // 3. Fetch platforms
  const { data: platforms = [] } = await supabase
    .from("smart_link_platforms")
    .select("*")
    .eq("smart_link_id", link.id)
    .order("display_order", { ascending: true });

  return <PublicSmartLink link={link} platforms={platforms || []} />;
}
