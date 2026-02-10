import { promises as fs } from "node:fs";
import path from "node:path";

export type FeaturedRelease = {
  title: string;
  artist: string;
  cover: string;
};

const fallback: FeaturedRelease = {
  title: "Neon Drift",
  artist: "KAZUMAI",
  cover: "/images/album-01.svg",
};

const featuredPath = path.join(process.cwd(), "data", "featured.json");
const kvEnabled = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function sanitize(input: Partial<FeaturedRelease> | null): FeaturedRelease {
  if (!input) return fallback;
  return {
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : fallback.title,
    artist: typeof input.artist === "string" && input.artist.trim() ? input.artist.trim() : fallback.artist,
    cover: typeof input.cover === "string" && input.cover.trim() ? input.cover.trim() : fallback.cover,
  };
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

async function readFromKv(): Promise<FeaturedRelease> {
  const { kv } = await import("@vercel/kv");
  const value = (await kv.get<FeaturedRelease>("featured_release")) ?? null;
  return sanitize(value ?? null);
}

async function writeToKv(data: FeaturedRelease): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set("featured_release", data);
}

export async function getFeaturedRelease(): Promise<FeaturedRelease> {
  if (kvEnabled) return readFromKv();
  return readFromFile();
}

export async function setFeaturedRelease(data: FeaturedRelease): Promise<FeaturedRelease> {
  const next = sanitize(data);
  if (kvEnabled) {
    await writeToKv(next);
  } else {
    await writeToFile(next);
  }
  return next;
}
