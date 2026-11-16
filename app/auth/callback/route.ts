import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  buildCanonicalOrigin,
  localizeAuthError,
  sanitizeRedirectPath,
} from "@/lib/authUtils";
import {
  getProfileByUserId,
  upsertUserProfile,
  sanitizeUsername,
  recordReferralAttribution,
  evaluateReferralMilestones,
  isCeoAccount,
  CEO_USERNAME,
} from "@/lib/ecosystemDb";

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const rawType = requestUrl.searchParams.get("type") || "";
  const rawNext = requestUrl.searchParams.get("next");
  const defaultNext = rawType === "recovery" ? "/auth/reset-password" : "/dashboard";
  const next = sanitizeRedirectPath(rawNext, defaultNext);
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const redirectBase = buildCanonicalOrigin(request);

  if (errorParam) {
    console.error("[Auth Callback] Provider returned error:", errorParam, errorDescription);
    const targetUrl = new URL("/auth/login", redirectBase);
    targetUrl.searchParams.set("error", errorParam);
    if (errorDescription) {
      targetUrl.searchParams.set("description", errorDescription);
    }
    return NextResponse.redirect(targetUrl);
  }

  if (code || (tokenHash && ALLOWED_OTP_TYPES.has(rawType as EmailOtpType))) {
    try {
      const supabase = await getSupabaseServerClient();
      const authResult = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({
            token_hash: tokenHash!,
            type: rawType as EmailOtpType,
          });

      const { data, error } = authResult;

      if (error) {
        console.error("[Auth Callback] verification failed:", error.message);
        const targetUrl = new URL("/auth/login", redirectBase);
        targetUrl.searchParams.set("error", code ? "code_exchange_failed" : "otp_verification_failed");
        targetUrl.searchParams.set("description", localizeAuthError(error));
        return NextResponse.redirect(targetUrl);
      }

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
            avatar_url:
              currentCabinetProfile.avatar_url || userMeta.avatar_url || userMeta.picture || null,
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

          let ecoProfile = await getProfileByUserId(data.user.id);
          if (!ecoProfile) {
            const isCeoLogin = isCeoAccount({ email: data.user.email });
            const rawInitial =
              sanitizeUsername(userMeta.username || artistName || data.user.email?.split("@")[0] || "") ||
              `user_${data.user.id.slice(0, 6)}`;
            const initialUsername = isCeoLogin
              ? CEO_USERNAME
              : rawInitial === CEO_USERNAME
              ? `user_${data.user.id.slice(0, 6)}`
              : rawInitial;
            const created = await upsertUserProfile({
              userId: data.user.id,
              userEmail: data.user.email,
              username: initialUsername,
              displayName: artistName,
              avatarUrl: userMeta.avatar_url || userMeta.picture || null,
            });
            ecoProfile = created.profile;
          }

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
          console.warn("[Auth Callback] Failed to auto-provision profile:", profileErr.message);
        }
      }

      const targetUrl = new URL(next, redirectBase);
      if (rawType === "signup" || rawType === "email") {
        targetUrl.searchParams.set("confirmed", "1");
      }
      const res = NextResponse.redirect(targetUrl);
      if (referralSettled) {
        res.cookies.delete("cxrner_ref_code");
      }
      return res;
    } catch (err: any) {
      console.error("[Auth Callback] Unexpected exception during verification:", err.message);
      const targetUrl = new URL("/auth/login", redirectBase);
      targetUrl.searchParams.set("error", "server_error");
      targetUrl.searchParams.set("description", localizeAuthError(err));
      return NextResponse.redirect(targetUrl);
    }
  }

  const targetUrl = new URL("/auth/login", redirectBase);
  targetUrl.searchParams.set("error", "missing_code");
  return NextResponse.redirect(targetUrl);
}
