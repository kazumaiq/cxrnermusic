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

export async function getArtists() {
  if (supabaseUrl && supabaseKey) {
    try {
      const { data, error } = await client().from("artists_config").select("items").eq("id", ARTISTS_ID).maybeSingle<{ items: ArtistItem[] }>();
      if (error) throw error;
      const items = sanitize(data?.items);
      return items.length ? items : readFile();
    } catch { return readFile(); }
  }
  return readFile();
}

export async function setArtists(items: ArtistItem[]) {
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
