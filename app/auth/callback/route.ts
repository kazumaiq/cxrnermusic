import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Determine the canonical base origin (respecting Vercel / reverse proxy headers)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";

  const redirectBase = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  // If OAuth provider returned an error directly to the callback
  if (errorParam) {
    console.error("[OAuth Callback] Provider returned error:", errorParam, errorDescription);
    const targetUrl = new URL("/auth/login", redirectBase);
    targetUrl.searchParams.set("error", errorParam);
    if (errorDescription) {
      targetUrl.searchParams.set("description", errorDescription);
    }
    return NextResponse.redirect(targetUrl);
  }

  // If code is present, exchange for session
  if (code) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[OAuth Callback] exchangeCodeForSession failed:", error.message);
        const targetUrl = new URL("/auth/login", redirectBase);
        targetUrl.searchParams.set("error", "code_exchange_failed");
        targetUrl.searchParams.set("description", error.message);
        return NextResponse.redirect(targetUrl);
      }

      // If session exchanged successfully, ensure user profile exists in cxrner_cabinet_users
      if (data?.user) {
        try {
          const userMeta = data.user.user_metadata || {};
          const artistName =
            userMeta.full_name ||
            userMeta.name ||
            data.user.email?.split("@")[0] ||
            "Артист";

          await supabase.from("cxrner_cabinet_users").upsert(
            {
              user_id: data.user.id,
              profile: {
                artist_name: artistName,
                avatar_url: userMeta.avatar_url || null,
                email: data.user.email,
              },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (profileErr: any) {
          console.warn("[OAuth Callback] Failed to auto-provision profile in cxrner_cabinet_users:", profileErr.message);
        }
      }

      // Safe redirect to target page
      const cleanNext = next.startsWith("/") ? next : `/${next}`;
      return NextResponse.redirect(new URL(cleanNext, redirectBase));
    } catch (err: any) {
      console.error("[OAuth Callback] Unexpected exception during code exchange:", err.message);
      const targetUrl = new URL("/auth/login", redirectBase);
      targetUrl.searchParams.set("error", "server_error");
      targetUrl.searchParams.set("description", err.message);
      return NextResponse.redirect(targetUrl);
    }
  }

  // If neither code nor error was provided
  const targetUrl = new URL("/auth/login", redirectBase);
  targetUrl.searchParams.set("error", "missing_code");
  return NextResponse.redirect(targetUrl);
}
