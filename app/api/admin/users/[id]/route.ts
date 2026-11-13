import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, getAdminUser } from "@/lib/admin";
import {
  getProfileByUserId,
  getArtistProfileByUserId,
  getUserInventory,
  getReferralStatsForUser,
  awardCxp,
  recordAdminAudit,
} from "@/lib/ecosystemDb";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured");
  }
  return createClient(url, key);
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const params = await ctx.params;
    const targetUserId = params.id;
    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "USER_ID_REQUIRED" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Fetch Cabinet user & profile
    const { data: cabUser } = await supabase
      .from("cxrner_cabinet_users")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const profile = await getProfileByUserId(targetUserId);
    const artistProfile = await getArtistProfileByUserId(targetUserId);
    const inventory = await getUserInventory(targetUserId);
    const referralStats = await getReferralStatsForUser(targetUserId);

    // Fetch CXP Wallet & Transactions
    let wallet = { balance: 0, total_earned: 0, total_spent: 0 };
    let transactions: any[] = [];
    try {
      const { data: w } = await supabase
        .from("cxrner_cxp_wallet")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (w) wallet = w;

      const { data: txs } = await supabase
        .from("cxrner_cxp_transactions")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });
      transactions = txs || [];
    } catch {
      // ignore
    }

    // Fetch Releases / Forms submitted by this user
    let releases: any[] = [];
    try {
      const tgId = profile?.telegram_id || cabUser?.profile?.telegram_id;
      let query = supabase.from("cxrner_forms").select("*");
      if (tgId) {
        query = query.or(`telegram_id.eq.${tgId},telegram_id.eq.${targetUserId}`);
      } else {
        query = query.eq("telegram_id", targetUserId);
      }
      const { data: rels } = await query.order("created_at", { ascending: false });
      releases = rels || [];
    } catch {
      // ignore
    }

    // Fetch Verification record if any
    let verificationRecord = null;
    try {
      const { data: ver } = await supabase
        .from("cxrner_artist_verifications")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      verificationRecord = ver;
    } catch {
      // ignore
    }

    // Fetch user notifications / activity
    let notifications: any[] = [];
    try {
      const { data: notifs } = await supabase
        .from("cxrner_notifications")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(20);
      notifications = notifs || [];
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      dossier: {
        userId: targetUserId,
        overview: {
          userId: targetUserId,
          username: profile?.username || `user_${targetUserId.slice(0, 6)}`,
          displayName: profile?.display_name || cabUser?.profile?.artist_name || "—",
          email: cabUser?.profile?.email || null,
          telegramId: profile?.telegram_id || cabUser?.profile?.telegram_id || null,
          telegramUsername: profile?.telegram_username || cabUser?.profile?.telegram_username || null,
          telegramLinked: Boolean(profile?.telegram_linked || cabUser?.profile?.telegram_id),
          isArtistVerified: Boolean(profile?.is_artist_verified || artistProfile?.verification_status === "verified"),
          profileCompletion: profile?.completion_percentage || 0,
          cxpBalance: wallet.balance,
          itemsCount: inventory.length,
          qualifiedReferrals: referralStats.qualifiedCount,
          releasesCount: releases.length,
          isBanned: Boolean(profile?.is_banned),
          createdAt: profile?.created_at || cabUser?.updated_at || new Date().toISOString(),
          updatedAt: cabUser?.updated_at || profile?.updated_at || new Date().toISOString(),
        },
        profile: profile || null,
        artistIdentity: {
          artistProfile: artistProfile || null,
          verification: verificationRecord,
        },
        dropInventory: {
          items: inventory,
          total: inventory.length,
        },
        wallet: {
          balance: wallet.balance,
          totalEarned: wallet.total_earned,
          totalSpent: wallet.total_spent,
          transactions,
        },
        referrals: referralStats,
        releases,
        activity: notifications,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const adminUser = await getAdminUser();
    const adminEmail = adminUser?.email || "admin@cxrnermusic.com";

    const params = await ctx.params;
    const targetUserId = params.id;
    const body = await request.json();
    const { action, amount, reason, isBanned, banReason, verificationStatus } = body;

    const supabase = getServiceSupabase();

    if (action === "adjust_cxp") {
      if (!amount || typeof amount !== "number" || !reason) {
        return NextResponse.json(
          { ok: false, error: "Сумма и причина корректировки обязательны" },
          { status: 400 }
        );
      }

      const res = await awardCxp({
        userId: targetUserId,
        amount,
        reason: `Корректировка администратора: ${reason}`,
        sourceEventType: "admin_adjustment",
        sourceEventId: `adj_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        adminNotes: `Выполнил ${adminEmail}: ${reason}`,
      });

      await recordAdminAudit({
        adminEmail,
        action: "cxp_adjust",
        targetUserId,
        details: { amount, reason, newBalance: res.newBalance },
      });

      return NextResponse.json({ ok: true, newBalance: res.newBalance });
    }

    if (action === "toggle_ban") {
      try {
        await supabase
          .from("cxrner_profiles")
          .update({
            is_banned: Boolean(isBanned),
            ban_reason: banReason || null,
          })
          .eq("id", targetUserId);
      } catch {
        // ignore
      }

      await recordAdminAudit({
        adminEmail,
        action: isBanned ? "ban_user" : "unban_user",
        targetUserId,
        details: { isBanned, banReason },
      });

      return NextResponse.json({ ok: true, isBanned });
    }

    if (action === "set_verification_status") {
      try {
        await supabase
          .from("cxrner_profiles")
          .update({
            is_artist_verified: verificationStatus === "verified",
          })
          .eq("id", targetUserId);

        await supabase
          .from("cxrner_artist_profiles")
          .update({
            verification_status: verificationStatus,
            verified_at: verificationStatus === "verified" ? new Date().toISOString() : null,
          })
          .eq("user_id", targetUserId);
      } catch {
        // ignore
      }

      await recordAdminAudit({
        adminEmail,
        action: "set_verification_status",
        targetUserId,
        details: { verificationStatus },
      });

      return NextResponse.json({ ok: true, verificationStatus });
    }

    return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
