import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser, isValidAdminPassword } from "./lib/admin";
import { getResolvedSupabaseUrl, getResolvedSupabaseAnonKey } from "./lib/supabaseServer";

const protectedPaths = ["/dashboard", "/submit-release", "/cabinet", "/admin"];

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

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminRoute) {
    const adminCookie = request.cookies.get("cxrner_admin_token")?.value || "";
    if (
      adminCookie &&
      (adminCookie === "cxrner_authorized_admin" || isValidAdminPassword(adminCookie))
    ) {
      return NextResponse.next();
    }
  }

  const supabaseUrl = getResolvedSupabaseUrl();
  const supabaseAnonKey = getResolvedSupabaseAnonKey();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    user = null;
  }

  if (!user) {
    if (isAdminRoute) {
      return NextResponse.next();
    }
    const redirectUrl = new URL("/auth/login", request.url);
    const fullTarget = `${pathname}${request.nextUrl.search || ""}`;
    redirectUrl.searchParams.set("redirect", fullTarget);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute) {
    if (!isAdminUser(user)) return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
