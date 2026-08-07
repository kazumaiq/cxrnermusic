import type { MetadataRoute } from "next";
import { getArtists } from "../lib/artists";

const SITE_URL = "https://cxrnermusic.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artists = await getArtists();
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/offer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...artists.map((artist) => ({ url: `${SITE_URL}/artists/${artist.id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
