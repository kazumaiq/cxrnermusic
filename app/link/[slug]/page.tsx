import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { getSmartLinkBySlug } from "../../../lib/smartLinksDb";
import PublicSmartLink from "../../../components/link/PublicSmartLink";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 30; // Revalidate public pages every 30 seconds

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  const { link } = await getSmartLinkBySlug(cleanSlug);

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
  const siteBase =
    process.env.NEXT_PUBLIC_LINK_DOMAIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cxrnermusic.vercel.app";
  const canonicalUrl = siteBase.includes("link.")
    ? `${siteBase.replace(/\/$/, "")}/${cleanSlug}`
    : `${siteBase.replace(/\/$/, "")}/link/${cleanSlug}`;

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

  // 1. Fetch smart link & platforms seamlessly from table or fallback store
  const { link, platforms: rawPlatforms } = await getSmartLinkBySlug(cleanSlug);

  // 2. If not found, check slug_history for 301 redirect
  if (!link) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: history } = await supabase
        .from("slug_history")
        .select("new_slug")
        .eq("old_slug", cleanSlug)
        .maybeSingle();

      if (history?.new_slug) {
        redirect(`/link/${history.new_slug}`);
      }
    } catch {}

    notFound();
  }

  // Dynamic Out Now check (real-time on visit even between daily crons)
  const isExpiredPreSave =
    Boolean(link.auto_out_now) &&
    !link.is_out_now &&
    Boolean(link.release_date) &&
    new Date(link.release_date!) <= new Date();

  if (isExpiredPreSave) {
    link.is_out_now = true;
  }

  const platforms = (rawPlatforms || []).map((p: any) => {
    if (isExpiredPreSave && p.button_text === "Pre-save") {
      return { ...p, button_text: "Слушать" };
    }
    return p;
  });

  return <PublicSmartLink link={link} platforms={platforms} />;
}
