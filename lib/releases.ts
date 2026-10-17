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

const releasesPath = path.join(process.cwd(), "data", "releases.json");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseEnabled = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
const RELEASES_ID = "current";

function sanitize(items: ReleaseItem[] | null | undefined): ReleaseItem[] {
  if (!items || !Array.isArray(items)) return [];
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
    .filter((item) => item.title && item.artist);
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
    return [];
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

let releasesMemoryCache: { data: ReleaseItem[]; expiresAt: number } | null = null;

async function withTimeout<T>(promise: Promise<T>, ms = 250): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export async function getReleases(): Promise<ReleaseItem[]> {
  const now = Date.now();
  if (releasesMemoryCache && now < releasesMemoryCache.expiresAt) {
    return releasesMemoryCache.data;
  }

  if (supabaseEnabled) {
    try {
      const supaItems = await withTimeout(readFromSupabase(), 700);
      if (supaItems && supaItems.length > 0) {
        releasesMemoryCache = { data: supaItems, expiresAt: now + 60000 };
        return supaItems;
      }
    } catch {
      // Fallback to file items
    }
  }

  const fileItems = await readFromFile();
  releasesMemoryCache = { data: fileItems, expiresAt: now + 60000 };
  return fileItems;
}

export async function setReleases(items: ReleaseItem[]): Promise<ReleaseItem[]> {
  releasesMemoryCache = null;
  const sanitized = sanitize(items);
  if (supabaseEnabled && supabaseServiceKey) {
    const client = getClient(supabaseServiceKey);
    const payload: ReleasesRow = { id: RELEASES_ID, items: sanitized };
    await client
      .from("releases_config")
      .upsert(payload, { onConflict: "id" });
  }
  await writeToFile(sanitized);
  return sanitized;
}
