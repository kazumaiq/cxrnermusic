import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export type ArtistLink = { label: string; href: string };
export type ArtistItem = {
  id: string;
  name: string;
  listeners: string;
  avatar: string;
  bio: string;
  genres: string[];
  links: ArtistLink[];
};

const artistsPath = path.join(process.cwd(), "data", "artists.json");
const fallback: ArtistItem[] = [];
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const ARTISTS_ID = "current";

function sanitize(items: ArtistItem[] | null | undefined) {
  if (!Array.isArray(items)) return fallback;
  return items.map((item, index) => ({
    id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `artist-${index + 1}`,
    name: typeof item.name === "string" ? item.name.trim() : "",
    listeners: typeof item.listeners === "string" ? item.listeners.trim() : "",
    avatar: typeof item.avatar === "string" ? item.avatar.trim() : "",
    bio: typeof item.bio === "string" ? item.bio.trim() : "",
    genres: Array.isArray(item.genres) ? item.genres.filter((genre): genre is string => typeof genre === "string").map((genre) => genre.trim()).filter(Boolean) : [],
    links: Array.isArray(item.links) ? item.links.map((link) => ({ label: typeof link.label === "string" ? link.label.trim() : "", href: typeof link.href === "string" ? link.href.trim() : "" })).filter((link) => link.label && link.href) : [],
  })).filter((item) => item.name && item.avatar);
}

async function readFile() {
  try { return sanitize(JSON.parse(await fs.readFile(artistsPath, "utf8")) as ArtistItem[]); } catch { return fallback; }
}

function client() {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase artists config is not set");
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

let artistsMemoryCache: { data: ArtistItem[]; expiresAt: number } | null = null;

async function withTimeout<T>(promise: Promise<T>, ms = 700): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export async function getArtists(): Promise<ArtistItem[]> {
  const now = Date.now();
  if (artistsMemoryCache && now < artistsMemoryCache.expiresAt) {
    return artistsMemoryCache.data;
  }

  if (supabaseUrl && supabaseKey) {
    try {
      const queryPromise = Promise.resolve(
        client()
          .from("artists_config")
          .select("items")
          .eq("id", ARTISTS_ID)
          .maybeSingle<{ items: ArtistItem[] }>()
      );
      const result = await withTimeout<any>(queryPromise, 700);
      if (result?.error) throw result.error;
      const items = sanitize(result?.data?.items);
      if (items.length) {
        artistsMemoryCache = { data: items, expiresAt: now + 60000 };
        return items;
      }
    } catch {
      // Fallback to local file
    }
  }
  const fileItems = await readFile();
  artistsMemoryCache = { data: fileItems, expiresAt: now + 60000 };
  return fileItems;
}

export async function setArtists(items: ArtistItem[]) {
  artistsMemoryCache = null;
  const next = sanitize(items);
  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }).from("artists_config").upsert({ id: ARTISTS_ID, items: next, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    return next;
  }
  await fs.writeFile(artistsPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function getArtist(slug: string) {
  return (await getArtists()).find((artist) => artist.id === slug) ?? null;
}
