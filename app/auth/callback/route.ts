import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  getProfileByUserId,
  upsertUserProfile,
  sanitizeUsername,
  recordReferralAttribution,
  evaluateReferralMilestones,
} from "@/lib/ecosystemDb";

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
        targetUrl.searchParams.set(
          "description",
          error.message.includes("API key")
            ? "Укажите NEXT_PUBLIC_SUPABASE_ANON_KEY в Vercel для завершения авторизации Google."
            : error.message
        );
        return NextResponse.redirect(targetUrl);
      }

      // If session exchanged successfully, ensure user profile exists WITHOUT wiping existing JSON fields
      let referralSettled = false;
      if (data?.user) {
        try {
          const userMeta = data.user.user_metadata || {};
          const artistName =
            userMeta.artist_name ||
            userMeta.full_name ||
            userMeta.name ||
            data.user.email?.split("@")[0] ||
            "Артист";

          const dbWrite = getSupabaseAdminClient() || supabase;
          const { data: existingCabinet } = await dbWrite
            .from("cxrner_cabinet_users")
            .select("profile")
            .eq("user_id", data.user.id)
            .maybeSingle();

          const currentCabinetProfile = (existingCabinet?.profile as Record<string, any>) || {};
          const mergedCabinetProfile = {
            ...currentCabinetProfile,
            artist_name: currentCabinetProfile.artist_name || artistName,
            avatar_url: currentCabinetProfile.avatar_url || userMeta.avatar_url || userMeta.picture || null,
            email: currentCabinetProfile.email || data.user.email,
          };

          await dbWrite.from("cxrner_cabinet_users").upsert(
            {
              user_id: data.user.id,
              profile: mergedCabinetProfile,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          // Ensure ecosystem CXRNER ID profile exists too
          let ecoProfile = await getProfileByUserId(data.user.id);
          if (!ecoProfile) {
            const initialUsername =
              sanitizeUsername(userMeta.username || artistName || data.user.email?.split("@")[0] || "") ||
              `user_${data.user.id.slice(0, 6)}`;
            const created = await upsertUserProfile({
              userId: data.user.id,
              username: initialUsername,
              displayName: artistName,
              avatarUrl: userMeta.avatar_url || userMeta.picture || null,
            });
            ecoProfile = created.profile;
          }

          // Reconcile pending referral attribution from cookie or user metadata
          const cookieStore = await cookies();
          const refCookie = cookieStore.get("cxrner_ref_code")?.value || "";
          const pendingRef = (refCookie || userMeta.referred_by_code || "").trim();
          const emailConfirmed = Boolean(data.user.email_confirmed_at || data.user.confirmed_at);

          if (pendingRef) {
            const trackRes = await recordReferralAttribution({
              referrerCode: pendingRef,
              newUserId: data.user.id,
              emailVerified: emailConfirmed,
            });
            if (
              trackRes.ok ||
              trackRes.error === "ALREADY_ATTRIBUTED" ||
              trackRes.error === "SELF_REFERRAL_FORBIDDEN" ||
              trackRes.error === "REFERRER_NOT_FOUND"
            ) {
              referralSettled = true;
            }
          }

          if (emailConfirmed || ecoProfile?.telegram_id) {
            await evaluateReferralMilestones(data.user.id, {
              emailVerified: emailConfirmed,
              telegramLinked: Boolean(ecoProfile?.telegram_id),
            }).catch(() => {});
          }
        } catch (profileErr: any) {
          console.warn("[OAuth Callback] Failed to auto-provision profile:", profileErr.message);
        }
      }

      // Safe redirect to target page
      const cleanNext = next.startsWith("/") ? next : `/${next}`;
      const res = NextResponse.redirect(new URL(cleanNext, redirectBase));
      if (referralSettled) {
        res.cookies.delete("cxrner_ref_code");
      }
      return res;
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
