import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/admin";

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

export async function GET(request: Request) {
  try {
    const isAuthed = await verifyAdminRequest(request);
    if (!isAuthed) {
      return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get("q") || "").toLowerCase().trim();
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

    const supabase = getServiceSupabase();

    // 1. Fetch Cabinet Users
    const { data: cabinetUsers } = await supabase
      .from("cxrner_cabinet_users")
      .select("user_id, profile, updated_at")
      .order("updated_at", { ascending: false });

    // 2. Fetch Profiles if table exists
    let profilesMap: Record<string, any> = {};
    try {
      const { data: profiles } = await supabase.from("cxrner_profiles").select("*");
      (profiles || []).forEach((p) => {
        profilesMap[p.id] = p;
      });
    } catch {
      // ignore
    }

    // 3. Fetch Artist Profiles if table exists
    let artistMap: Record<string, any> = {};
    try {
      const { data: artists } = await supabase.from("cxrner_artist_profiles").select("*");
      (artists || []).forEach((a) => {
        artistMap[a.user_id] = a;
      });
    } catch {
      // ignore
    }

    // 4. Fetch Wallets
    let walletMap: Record<string, number> = {};
    try {
      const { data: wallets } = await supabase.from("cxrner_cxp_wallet").select("user_id, balance");
      (wallets || []).forEach((w) => {
        walletMap[w.user_id] = w.balance;
      });
    } catch {
      // ignore
    }

    // 5. Fetch Inventory Counts
    let inventoryMap: Record<string, number> = {};
    try {
      const { data: inv } = await supabase.from("cxrner_drop_inventory").select("user_id");
      (inv || []).forEach((i) => {
        inventoryMap[i.user_id] = (inventoryMap[i.user_id] || 0) + 1;
      });
    } catch {
      // ignore
    }

    // 6. Fetch Releases Count
    const { data: allForms } = await supabase
      .from("cxrner_forms")
      .select("telegram_id, status");

    const formsByUid: Record<string, number> = {};
    (allForms || []).forEach((f) => {
      const tid = String(f.telegram_id || "");
      if (tid) {
        formsByUid[tid] = (formsByUid[tid] || 0) + 1;
      }
    });

    // Merge and enrich user records
    let enriched = (cabinetUsers || []).map((row) => {
      const p = (row.profile as Record<string, any>) || {};
      const tgId = p.telegram_id ? String(p.telegram_id) : null;
      const count = (formsByUid[row.user_id] || 0) + (tgId ? (formsByUid[tgId] || 0) : 0);
      const prof = profilesMap[row.user_id] || {};
      const art = artistMap[row.user_id] || {};

      const username = prof.username || p.username || `user_${row.user_id.slice(0, 6)}`;
      const displayName = prof.display_name || p.artist_name || art.stage_name || "—";
      const isVerified = Boolean(prof.is_artist_verified || art.verification_status === "verified");
      const completion = prof.completion_percentage !== undefined ? prof.completion_percentage : (tgId ? 30 : 15);
      const cxpBalance = walletMap[row.user_id] || 0;
      const itemsCount = inventoryMap[row.user_id] || (prof.pinned_items?.length || 0);
      const isBanned = Boolean(prof.is_banned);

      return {
        user_id: row.user_id,
        username,
        display_name: displayName,
        email: p.email || null,
        avatar_url: prof.avatar_url || null,
        telegram_id: tgId,
        telegram_username: p.telegram_username || prof.telegram_username || null,
        telegram_linked: Boolean(tgId),
        is_artist_verified: isVerified,
        verification_status: art.verification_status || (isVerified ? "verified" : "not_verified"),
        profile_completion: completion,
        cxp_balance: cxpBalance,
        items_count: itemsCount,
        releases_count: count,
        is_banned: isBanned,
        status: isBanned ? "banned" : isVerified ? "verified_artist" : "active",
        created_at: prof.created_at || row.updated_at,
        updated_at: row.updated_at,
      };
    });

    // Apply Search
    if (searchQuery) {
      enriched = enriched.filter((u) => {
        return (
          u.username.toLowerCase().includes(searchQuery) ||
          u.display_name.toLowerCase().includes(searchQuery) ||
          u.user_id.toLowerCase().includes(searchQuery) ||
          (u.email && u.email.toLowerCase().includes(searchQuery)) ||
          (u.telegram_username && u.telegram_username.toLowerCase().includes(searchQuery))
        );
      });
    }

    // Apply Filter
    if (filter === "verified") {
      enriched = enriched.filter((u) => u.is_artist_verified);
    } else if (filter === "unverified") {
      enriched = enriched.filter((u) => !u.is_artist_verified);
    } else if (filter === "completed") {
      enriched = enriched.filter((u) => u.profile_completion >= 80);
    } else if (filter === "incomplete") {
      enriched = enriched.filter((u) => u.profile_completion < 80);
    } else if (filter === "telegram") {
      enriched = enriched.filter((u) => u.telegram_linked);
    } else if (filter === "banned") {
      enriched = enriched.filter((u) => u.is_banned);
    }

    const totalCount = enriched.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = enriched.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      ok: true,
      users: paginatedUsers,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
