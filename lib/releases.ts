import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export type ReleaseLink = {
  label: string;
  href: string;
};

export type ReleaseItem = {
  title: string;
  artist: string;
  cover: string;
  links: ReleaseLink[];
};

type ReleasesRow = {
  id: string;
  items: ReleaseItem[];
};

const fallback: ReleaseItem[] = [];
const releasesPath = path.join(process.cwd(), "data", "releases.json");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseEnabled = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
const RELEASES_ID = "current";

function sanitize(items: ReleaseItem[] | null | undefined): ReleaseItem[] {
  if (!items || !Array.isArray(items)) return fallback;
  return items
    .map((item) => ({
      title: typeof item.title === "string" ? item.title.trim() : "",
      artist: typeof item.artist === "string" ? item.artist.trim() : "",
      cover: typeof item.cover === "string" ? item.cover.trim() : "",
      links: Array.isArray(item.links)
        ? item.links
            .map((link) => ({
              label: typeof link.label === "string" ? link.label.trim() : "",
              href: typeof link.href === "string" ? link.href.trim() : "",
            }))
            .filter((link) => link.label && link.href)
        : [],
    }))
    .filter((item) => item.title && item.artist && item.cover);
}

function getClient(key: string) {
  if (!supabaseUrl) throw new Error("Supabase URL missing");
  return createClient(supabaseUrl, key, { auth: { persistSession: false } });
}

async function readFromFile(): Promise<ReleaseItem[]> {
  try {
    const raw = await fs.readFile(releasesPath, "utf8");
    const parsed = JSON.parse(raw) as ReleaseItem[];
    return sanitize(parsed);
  } catch {
    return fallback;
  }
}

async function writeToFile(items: ReleaseItem[]): Promise<void> {
  await fs.writeFile(releasesPath, JSON.stringify(items, null, 2), "utf8");
}

async function readFromSupabase(): Promise<ReleaseItem[]> {
  const key = supabaseServiceKey ?? supabaseAnonKey;
  if (!key) throw new Error("Supabase key missing");
  const client = getClient(key);
  const { data, error } = await client
    .from("releases_config")
    .select("items")
    .eq("id", RELEASES_ID)
    .maybeSingle();
  if (error) throw error;
  return sanitize((data as ReleasesRow | null)?.items ?? null);
}

async function writeToSupabase(items: ReleaseItem[]): Promise<void> {
  if (!supabaseServiceKey) throw new Error("Supabase service role key missing");
  const client = getClient(supabaseServiceKey);
  const payload: ReleasesRow = { id: RELEASES_ID, items };
  const { error } = await client
    .from("releases_config")
    .upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export async function getReleases(): Promise<ReleaseItem[]> {
  if (supabaseEnabled) {
    try {
      return await readFromSupabase();
    } catch {
      return readFromFile();
    }
  }
  return readFromFile();
}

export async function setReleases(items: ReleaseItem[]): Promise<ReleaseItem[]> {
  const next = sanitize(items);
  if (supabaseEnabled) {
    await writeToSupabase(next);
    return next;
  }
  await writeToFile(next);
  return next;
}
