import path from "node:path";
import { promises as fs } from "node:fs";

export const runtime = "nodejs";

const MINIAPP_ROOT = path.resolve(process.cwd(), "public", "miniapp");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function safeJoin(base: string, segments: string[]) {
  const rawTarget = path.join(base, ...segments);
  const normalized = path.normalize(rawTarget);
  const safeBase = `${path.normalize(base)}${path.sep}`;
  if (!normalized.startsWith(safeBase) && normalized !== path.normalize(base)) {
    return null;
  }
  return normalized;
}

async function resolveMiniappFile(segments: string[]) {
  const cleanSegments = segments.filter(Boolean);
  const joined = safeJoin(MINIAPP_ROOT, cleanSegments.length ? cleanSegments : ["index.html"]);
  if (!joined) return null;

  try {
    const stat = await fs.stat(joined);
    if (stat.isDirectory()) {
      const indexFile = path.join(joined, "index.html");
      const indexStat = await fs.stat(indexFile);
      if (!indexStat.isFile()) return null;
      return indexFile;
    }
    if (!stat.isFile()) return null;
    return joined;
  } catch {
    return null;
  }
}

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function cacheControlFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "no-store";
  return "public, max-age=31536000, immutable";
}

type RouteParams = { path?: string[] };

export async function GET(_: Request, ctx: { params: Promise<RouteParams> | RouteParams }) {
  const resolvedParams = await ctx.params;
  const filePath = await resolveMiniappFile(resolvedParams?.path || []);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await fs.readFile(filePath);
    return new Response(data, {
      status: 200,
      headers: {
        "content-type": contentTypeFor(filePath),
        "cache-control": cacheControlFor(filePath)
      }
    });
  } catch {
    return new Response("Server error", { status: 500 });
  }
}

