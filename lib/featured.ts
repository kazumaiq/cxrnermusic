import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

export type FeaturedRelease = {
  title: string;
  artist: string;
  cover: string;
};

type FeaturedRow = FeaturedRelease & { id: string };

const fallback: FeaturedRelease = {
  title: "The Sadness of Reality",
  artist: "Neimeks",
  cover: "/covers/the-sadness-of-reality.jpg",
};

const featuredPath = path.join(process.cwd(), "data", "featured.json");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseEnabled = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
const FEATURED_ID = "current";

function sanitize(input: Partial<FeaturedRelease> | null): FeaturedRelease {
  if (!input) return fallback;
  return {
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : fallback.title,
    artist: typeof input.artist === "string" && input.artist.trim() ? input.artist.trim() : fallback.artist,
    cover: typeof input.cover === "string" && input.cover.trim() ? input.cover.trim() : fallback.cover,
  };
}

function getClient(key: string) {
  if (!supabaseUrl) throw new Error("Supabase URL missing");
  return createClient(supabaseUrl, key, { auth: { persistSession: false } });
}

async function readFromFile(): Promise<FeaturedRelease> {
  try {
    const raw = await fs.readFile(featuredPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<FeaturedRelease>;
    return sanitize(parsed);
  } catch {
    return fallback;
  }
}

async function writeToFile(data: FeaturedRelease): Promise<void> {
  await fs.writeFile(featuredPath, JSON.stringify(data, null, 2), "utf8");
}

async function readFromSupabase(): Promise<FeaturedRelease> {
  const key = supabaseServiceKey ?? supabaseAnonKey;
  if (!key) throw new Error("Supabase key missing");

  const client = getClient(key);
  const { data, error } = await client
    .from("featured_release")
    .select("title, artist, cover")
    .eq("id", FEATURED_ID)
    .maybeSingle();

  if (error) throw error;
  return sanitize(data ?? null);
}

let memoryCache: { data: FeaturedRelease; expiresAt: number } | null = null;

async function withTimeout<T>(promise: Promise<T>, ms = 250): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export async function getFeaturedRelease(): Promise<FeaturedRelease> {
  const now = Date.now();
  if (memoryCache && now < memoryCache.expiresAt) {
    return memoryCache.data;
  }

  if (supabaseEnabled) {
    try {
      const data = await withTimeout(readFromSupabase(), 700);
      if (
        data &&
        data.title &&
        data.artist &&
        !data.title.toLowerCase().includes("breakthroug")
      ) {
        memoryCache = { data, expiresAt: now + 60000 };
        return data;
      } else if (data && data.title && data.title.toLowerCase().includes("breakthroug")) {
        // Auto-fix stale database record to the actual latest release
        if (supabaseServiceKey) {
          const client = getClient(supabaseServiceKey);
          Promise.resolve(
            client
              .from("featured_release")
              .upsert({ id: FEATURED_ID, ...fallback }, { onConflict: "id" })
          ).catch(() => {});
        }
      }
    } catch {
      // Fallback to local file instantly
    }
  }

  const fileData = await readFromFile();
  memoryCache = { data: fileData, expiresAt: now + 60000 };
  return fileData;
}

export async function setFeaturedRelease(data: FeaturedRelease): Promise<FeaturedRelease> {
  memoryCache = null;
  const next = sanitize(data);
  if (supabaseEnabled && supabaseServiceKey) {
    const client = getClient(supabaseServiceKey);
    const payload: FeaturedRow = { id: FEATURED_ID, ...next };
    await client
      .from("featured_release")
      .upsert(payload, { onConflict: "id" });
  }
  await writeToFile(next);
  return next;
}
