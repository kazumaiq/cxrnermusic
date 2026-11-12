import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser } from "./lib/admin";

const protectedPaths = ["/dashboard", "/submit-release", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const isLinkSubdomain = host.startsWith("link.");

  // Multi-Domain Subdomain Rewrite: link.cxrnermusic.com/*
  if (isLinkSubdomain) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/link", request.url));
    }
    if (
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/link") &&
      !pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/admin") &&
      !pathname.includes(".")
    ) {
      return NextResponse.rewrite(new URL(`/link${pathname}`, request.url));
    }
  }

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAdminUser(user)) return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
