import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeBaseUrl() {
  const raw = String(
    process.env.MINIAPP_PROXY_TARGET ||
    process.env.MINIAPP_BOT_API_BASE_URL ||
    process.env.BOT_API_BASE_URL ||
    ""
  ).trim();
  return raw.replace(/\/+$/, "");
}

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin");
  return {
    "access-control-allow-origin": origin || "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-requested-with",
    "access-control-max-age": "600"
  };
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const base = normalizeBaseUrl();
  if (!base) {
    return Response.json(
      {
        ok: false,
        error: "MiniApp proxy target is not configured (MINIAPP_PROXY_TARGET)"
      },
      { status: 503, headers }
    );
  }

  const params = await ctx.params;
  const pathParts = Array.isArray(params?.path) ? params.path : [];
  const incomingUrl = new URL(req.url);
  const query = incomingUrl.search || "";
  const targetUrl = `${base}/api/${pathParts.join("/")}${query}`;

  const reqHeaders = new Headers(req.headers);
  reqHeaders.delete("host");
  reqHeaders.delete("content-length");

  const body =
    req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS"
      ? undefined
      : await req.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers: reqHeaders,
      body,
      redirect: "manual"
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: `Proxy fetch failed: ${String(error)}` },
      { status: 502, headers }
    );
  }

  const outHeaders = new Headers(upstream.headers);
  Object.entries(headers).forEach(([k, v]) => outHeaders.set(k, v));
  outHeaders.set("x-miniapp-proxy", "vercel");
  return new Response(upstream.body, {
    status: upstream.status,
    headers: outHeaders
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}