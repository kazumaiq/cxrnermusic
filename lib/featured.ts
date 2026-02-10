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
  title: "Neon Drift",
  artist: "KAZUMAI",
  cover: "/images/album-01.svg",
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

async function writeToSupabase(data: FeaturedRelease): Promise<void> {
  if (!supabaseServiceKey) throw new Error("Supabase service role key missing");
  const client = getClient(supabaseServiceKey);
  const payload: FeaturedRow = { id: FEATURED_ID, ...data };
  const { error } = await client
    .from("featured_release")
    .upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export async function getFeaturedRelease(): Promise<FeaturedRelease> {
  if (supabaseEnabled) {
    try {
      return await readFromSupabase();
    } catch {
      return readFromFile();
    }
  }
  return readFromFile();
}

export async function setFeaturedRelease(data: FeaturedRelease): Promise<FeaturedRelease> {
  const next = sanitize(data);
  if (supabaseEnabled) {
    await writeToSupabase(next);
    return next;
  }
  await writeToFile(next);
  return next;
}
