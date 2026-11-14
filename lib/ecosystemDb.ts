import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEcosystemDbClient } from "@/lib/supabaseServer";

export * from "./ecosystemTypes";
import type {
  AdminAuditLog,
  CxpTransaction,
  CxpWallet,
  CxrnerArtistProfile,
  CxrnerArtistVerification,
  CxrnerProfile,
  DropCaseConfig,
  DropHistoryEntry,
  DropInventoryItem,
  ItemRarity,
  MusicRole,
  NotificationItem,
  ReferralAttribution,
  ReferralReward,
  SpecialRewardClaim,
  UserAchievement,
  VerificationStatus,
} from "./ecosystemTypes";
import {
  ACHIEVEMENTS_CATALOG,
  DROP_CASES,
  DROP_SPECIMENS,
  calculateProfileCompletion,
} from "./ecosystemTypes";

// =========================================================================
// TYPES & LOCAL STORE FALLBACK (CLI tests / offline dev only)
// =========================================================================

interface EcosystemStore {
  profiles: Record<string, CxrnerProfile>;
  artistProfiles: Record<string, CxrnerArtistProfile>;
  verifications: Record<string, CxrnerArtistVerification>;
  inventory: Record<string, DropInventoryItem[]>;
  wallets: Record<string, CxpWallet>;
  transactions: Record<string, CxpTransaction[]>;
  achievements: Record<string, UserAchievement[]>;
  referrals: Record<string, ReferralAttribution[]>;
  referralRewards: Record<string, ReferralReward[]>;
  notifications: Record<string, NotificationItem[]>;
  auditLogs: AdminAuditLog[];
  dropHistory: Record<string, DropHistoryEntry[]>;
  specialClaims: Record<string, SpecialRewardClaim[]>;
}

const STORE_PATH = path.join(process.cwd(), "data", "ecosystem_store.json");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | null | undefined): id is string {
  return Boolean(id && UUID_REGEX.test(id));
}

function getInitialStore(): EcosystemStore {
  return {
    profiles: {},
    artistProfiles: {},
    verifications: {},
    inventory: {},
    wallets: {},
    transactions: {},
    achievements: {},
    referrals: {},
    referralRewards: {},
    notifications: {},
    auditLogs: [],
    dropHistory: {},
    specialClaims: {},
  };
}

let memoryStore: EcosystemStore | null = null;

function loadLocalStore(): EcosystemStore {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      memoryStore = JSON.parse(raw);
      return memoryStore!;
    }
  } catch {
    // ignore read errors on read-only serverless FS
  }
  memoryStore = getInitialStore();
  return memoryStore;
}

function saveLocalStore(store: EcosystemStore) {
  memoryStore = store;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // Serverless environments (Vercel) have read-only filesystems — expected when Supabase persists
  }
}

// =========================================================================
// SUPABASE PERSISTENCE HELPERS (Dual Table + cxrner_cabinet_users Vault)
// =========================================================================

const MISSING_TABLE_TTL_MS = 5 * 60 * 1000;
const missingTablesCache = new Map<string, number>();

function isTableKnownMissing(tableName: string): boolean {
  const expiresAt = missingTablesCache.get(tableName);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    missingTablesCache.delete(tableName);
    return false;
  }
  return true;
}

function markIfTableMissing(
  tableName: string,
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  if (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  ) {
    missingTablesCache.set(tableName, Date.now() + MISSING_TABLE_TTL_MS);
    return true;
  }
  return false;
}

async function runOptionalTableQuery<T>(
  tableName: string,
  queryFn: () => PromiseLike<{
    data?: T | null;
    error?: { code?: string; message?: string } | null;
  }>
): Promise<{
  data: T | null;
  error: { code?: string; message?: string } | null;
  skippedMissing?: boolean;
}> {
  if (isTableKnownMissing(tableName)) {
    return {
      data: null,
      error: { code: "PGRST205", message: "Cached missing table" },
      skippedMissing: true,
    };
  }
  try {
    const res = await queryFn();
    if (res?.error) {
      markIfTableMissing(tableName, res.error);
    }
    return { data: (res?.data ?? null) as T | null, error: res?.error ?? null };
  } catch (err: any) {
    const msg = String(err?.message || "");
    markIfTableMissing(tableName, { message: msg });
    return { data: null, error: { message: msg } };
  }
}

const userVaultLocks = new Map<string, Promise<unknown>>();

async function withUserVaultLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = userVaultLocks.get(userId) || Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  userVaultLocks.set(userId, next);
  try {
    return await next;
  } finally {
    if (userVaultLocks.get(userId) === next) {
      userVaultLocks.delete(userId);
    }
  }
}

async function getDbForUser(userId: string): Promise<SupabaseClient | null> {
  if (!isValidUuid(userId)) return null;
  const { client } = await getEcosystemDbClient();
  return client;
}

async function readCabinetVault(
  userId: string,
  existingDb?: SupabaseClient | null
): Promise<Record<string, any> | null> {
  const db = existingDb !== undefined ? existingDb : await getDbForUser(userId);
  if (!db) return null;

  const { data, error } = await db
    .from("cxrner_cabinet_users")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return ((data?.profile as Record<string, any>) || {}) as Record<string, any>;
}

async function writeCabinetVault(
  userId: string,
  updater: (prev: Record<string, any>) => Record<string, any>
): Promise<{ ok: boolean; profile?: Record<string, any> }> {
  if (!isValidUuid(userId)) return { ok: false };

  return withUserVaultLock(userId, async () => {
    const db = await getDbForUser(userId);
    if (!db) return { ok: false };

    const { data: row, error: readErr } = await db
      .from("cxrner_cabinet_users")
      .select("profile")
      .eq("user_id", userId)
      .maybeSingle();

    if (readErr) {
      console.warn("[ecosystemDb] readCabinetVault error:", readErr.message);
    }

    const prev = ((row?.profile as Record<string, any>) || {}) as Record<string, any>;
    const next = updater({ ...prev });
    const nowIso = new Date().toISOString();

    const { error: upsertErr } = await db.from("cxrner_cabinet_users").upsert(
      {
        user_id: userId,
        profile: next,
        updated_at: nowIso,
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      console.warn("[ecosystemDb] writeCabinetVault upsert error:", upsertErr.message);
      return { ok: false };
    }

    return { ok: true, profile: next };
  });
}

async function listAllCabinetUsers(
  limit = 500
): Promise<Array<{ user_id: string; profile: Record<string, any>; updated_at: string }>> {
  const { client } = await getEcosystemDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from("cxrner_cabinet_users")
    .select("user_id, profile, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) return [];
  return data.map((row) => ({
    user_id: row.user_id,
    profile: ((row.profile as Record<string, any>) || {}) as Record<string, any>,
    updated_at: row.updated_at || new Date().toISOString(),
  }));
}

function enrichInventoryItem(item: DropInventoryItem): DropInventoryItem {
  const spec = DROP_SPECIMENS.find((s) => s.item_id === item.item_id);
  if (!spec) return item;
  return {
    ...item,
    specimen_code: item.specimen_code || spec.specimen_code,
    specimen_class: item.specimen_class || spec.specimen_class,
    drop_chance: item.drop_chance || spec.drop_chance,
    description: item.description || spec.description,
    image_url: item.image_url || spec.image_url,
    model_color: item.model_color || spec.model_color,
    is_special_reward:
      item.is_special_reward !== undefined ? item.is_special_reward : spec.is_special_reward,
  };
}

function toDbProfileRow(p: CxrnerProfile) {
  return {
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url || null,
    banner_url: p.banner_url || null,
    bio: p.bio || null,
    country: p.country || "RU",
    city: p.city || null,
    genres: Array.isArray(p.genres) ? p.genres : [],
    music_roles: Array.isArray(p.music_roles) ? p.music_roles : [],
    social_links: Array.isArray(p.social_links) ? p.social_links : [],
    music_links: Array.isArray(p.music_links) ? p.music_links : [],
    telegram_id: p.telegram_id || null,
    telegram_username: p.telegram_username || null,
    telegram_linked: Boolean(p.telegram_linked),
    is_artist_verified: Boolean(p.is_artist_verified),
    completion_percentage: p.completion_percentage || 0,
    completion_reward_80_claimed: Boolean(p.completion_reward_80_claimed),
    completion_reward_100_claimed: Boolean(p.completion_reward_100_claimed),
    privacy_settings: p.privacy_settings,
    equipped_frame: p.equipped_frame || null,
    equipped_effect: p.equipped_effect || null,
    equipped_title: p.equipped_title || null,
    equipped_badge: p.equipped_badge || null,
    equipped_showcase_item: p.equipped_showcase_item || null,
    equipped_background: p.equipped_background || null,
    pinned_achievements: Array.isArray(p.pinned_achievements) ? p.pinned_achievements : [],
    pinned_items: Array.isArray(p.pinned_items) ? p.pinned_items : [],
    is_banned: Boolean(p.is_banned),
    ban_reason: p.ban_reason || null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function hydrateProfileWithCabinet(
  baseProfile: CxrnerProfile | null,
  cabinetProfile: Record<string, any> | null,
  userId: string
): CxrnerProfile | null {
  const storedIdProfile = (cabinetProfile?.cxrner_id as CxrnerProfile | undefined) || null;
  const tgId = cabinetProfile?.telegram_id
    ? String(cabinetProfile.telegram_id)
    : storedIdProfile?.telegram_id || baseProfile?.telegram_id || null;
  const tgUser =
    cabinetProfile?.telegram_username ||
    storedIdProfile?.telegram_username ||
    baseProfile?.telegram_username ||
    null;

  // Choose whichever persisted copy was updated more recently
  let chosen = baseProfile || storedIdProfile;
  if (baseProfile && storedIdProfile) {
    const tBase = new Date(baseProfile.updated_at || 0).getTime();
    const tVault = new Date(storedIdProfile.updated_at || 0).getTime();
    chosen = tVault >= tBase ? storedIdProfile : baseProfile;
  }

  if (!chosen) return null;

  const verStatus = (cabinetProfile?.ecosystem_verification as CxrnerArtistVerification | undefined)?.status;
  const artVerStatus = (cabinetProfile?.ecosystem_artist_profile as CxrnerArtistProfile | undefined)?.verification_status;
  const isVerifiedFromVault =
    verStatus === "verified" || artVerStatus === "verified"
      ? true
      : verStatus === "rejected" || verStatus === "not_verified" || artVerStatus === "not_verified"
      ? false
      : Boolean(chosen.is_artist_verified);

  const merged: CxrnerProfile = {
    ...chosen,
    id: chosen.id || userId,
    telegram_id: tgId,
    telegram_username: tgUser,
    telegram_linked: Boolean(tgId || chosen.telegram_linked),
    is_artist_verified: isVerifiedFromVault,
    display_name:
      chosen.display_name ||
      cabinetProfile?.artist_name ||
      cabinetProfile?.display_name ||
      "CXRNER Artist",
    avatar_url: chosen.avatar_url ?? cabinetProfile?.avatar_url ?? null,
    privacy_settings: {
      is_public: chosen.privacy_settings?.is_public ?? true,
      show_inventory: chosen.privacy_settings?.show_inventory ?? true,
      show_stats: chosen.privacy_settings?.show_stats ?? true,
      show_referrals: chosen.privacy_settings?.show_referrals ?? true,
      show_music: chosen.privacy_settings?.show_music ?? true,
      show_in_leaderboard: chosen.privacy_settings?.show_in_leaderboard ?? true,
    },
  };

  merged.completion_percentage = calculateProfileCompletion(merged).total;
  return merged;
}

// =========================================================================
// 2. WALLET & REWARDS DISPATCHER (Atomic, Server-Side, Anti-Double Spend)
// =========================================================================

function buildStarterWallet(userId: string): {
  wallet: CxpWallet;
  welcomeTx: CxpTransaction;
} {
  const nowIso = new Date().toISOString();
  return {
    wallet: {
      user_id: userId,
      balance: 100,
      total_earned: 100,
      total_spent: 0,
      updated_at: nowIso,
    },
    welcomeTx: {
      id: crypto.randomUUID(),
      user_id: userId,
      amount: 100,
      operation_type: "credit",
      reason: "Стартовый баланс CXP в экосистеме CXRNER",
      source_event_type: "starter_welcome_bonus",
      source_event_id: `starter_${userId}`,
      admin_notes: null,
      created_at: nowIso,
    },
  };
}

export async function getCxpWallet(userId: string): Promise<CxpWallet> {
  const db = await getDbForUser(userId);
  if (db) {
    // 1. Check cxrner_cxp_wallet table AND cxrner_cabinet_users vault
    const [{ data: tableWallet, error: tableErr }, vault] = await Promise.all([
      runOptionalTableQuery<any>("cxrner_cxp_wallet", () =>
        db.from("cxrner_cxp_wallet").select("*").eq("user_id", userId).maybeSingle()
      ),
      readCabinetVault(userId, db),
    ]);

    const vaultWallet = (vault?.ecosystem_wallet as CxpWallet | undefined) || null;

    if (!tableErr && tableWallet && vaultWallet) {
      const tTable = new Date(tableWallet.updated_at || 0).getTime();
      const tVault = new Date(vaultWallet.updated_at || 0).getTime();
      return (tVault > tTable ? vaultWallet : tableWallet) as CxpWallet;
    }

    if (!tableErr && tableWallet) {
      return tableWallet as CxpWallet;
    }

    if (vaultWallet) {
      return vaultWallet;
    }

    // 2. Initialize & persist starter 100 CXP wallet ONCE so subsequent debits stick
    const { wallet, welcomeTx } = buildStarterWallet(userId);
    await Promise.all([
      runOptionalTableQuery("cxrner_cxp_transactions", () =>
        db.from("cxrner_cxp_transactions").insert(welcomeTx)
      ),
      runOptionalTableQuery("cxrner_cxp_wallet", () =>
        db.from("cxrner_cxp_wallet").upsert(wallet)
      ),
      writeCabinetVault(userId, (prev) => {
        if (prev.ecosystem_wallet) return prev;
        const txs = Array.isArray(prev.ecosystem_transactions) ? prev.ecosystem_transactions : [];
        return {
          ...prev,
          ecosystem_wallet: wallet,
          ecosystem_transactions: [welcomeTx, ...txs].slice(0, 200),
        };
      }),
    ]);
    return wallet;
  }

  // Local fallback (offline / CLI test scripts)
  const store = loadLocalStore();
  let w = store.wallets[userId];
  if (!w) {
    w = {
      user_id: userId,
      balance: 100,
      total_earned: 100,
      total_spent: 0,
      updated_at: new Date().toISOString(),
    };
    store.wallets[userId] = w;
    saveLocalStore(store);
  }
  return w;
}

export async function getCxpTransactions(userId: string): Promise<CxpTransaction[]> {
  const db = await getDbForUser(userId);
  if (db) {
    const { data, error } = await db
      .from("cxrner_cxp_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as CxpTransaction[];
    }

    const vault = await readCabinetVault(userId, db);
    if (Array.isArray(vault?.ecosystem_transactions)) {
      return vault.ecosystem_transactions as CxpTransaction[];
    }
    return [];
  }

  const store = loadLocalStore();
  return [...(store.transactions[userId] || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function awardCxp(params: {
  userId: string;
  amount: number;
  reason: string;
  sourceEventType: string;
  sourceEventId?: string;
  adminNotes?: string;
}): Promise<{ ok: boolean; newBalance: number; duplicate?: boolean; error?: string }> {
  const { userId, amount, reason, sourceEventType, sourceEventId, adminNotes } = params;
  const eventId = sourceEventId || `${sourceEventType}_${userId}`;
  const nowIso = new Date().toISOString();

  const db = await getDbForUser(userId);
  if (db) {
    // Perform locked read-modify-write so parallel ops never lose wallet updates
    let finalBalance = 0;
    let isDuplicate = false;
    let insufficientFunds = false;

    await writeCabinetVault(userId, (prev) => {
      const txs = Array.isArray(prev.ecosystem_transactions)
        ? [...(prev.ecosystem_transactions as CxpTransaction[])]
        : [];

      const existingVaultTx = txs.find(
        (tx) => tx.source_event_type === sourceEventType && tx.source_event_id === eventId
      );

      if (existingVaultTx) {
        isDuplicate = true;
        finalBalance = prev.ecosystem_wallet?.balance ?? 0;
        return prev;
      }

      const baseWallet: CxpWallet = prev.ecosystem_wallet
        ? { ...prev.ecosystem_wallet }
        : buildStarterWallet(userId).wallet;

      // Also capture if starter tx hasn't been logged yet
      if (!prev.ecosystem_wallet) {
        txs.unshift(buildStarterWallet(userId).welcomeTx);
      }

      if (amount < 0 && (baseWallet.balance || 0) < Math.abs(amount)) {
        insufficientFunds = true;
        finalBalance = baseWallet.balance || 0;
        return prev;
      }

      const newBal = Math.max(0, (baseWallet.balance || 0) + amount);
      const newEarned = amount > 0 ? (baseWallet.total_earned || 0) + amount : baseWallet.total_earned || 0;
      const newSpent =
        amount < 0 ? (baseWallet.total_spent || 0) + Math.abs(amount) : baseWallet.total_spent || 0;

      const updatedWallet: CxpWallet = {
        user_id: userId,
        balance: newBal,
        total_earned: newEarned,
        total_spent: newSpent,
        updated_at: nowIso,
      };

      const newTx: CxpTransaction = {
        id: crypto.randomUUID(),
        user_id: userId,
        amount,
        operation_type: amount >= 0 ? "credit" : "debit",
        reason,
        source_event_type: sourceEventType,
        source_event_id: eventId,
        admin_notes: adminNotes || null,
        created_at: nowIso,
      };

      txs.unshift(newTx);
      finalBalance = newBal;

      return {
        ...prev,
        ecosystem_wallet: updatedWallet,
        ecosystem_transactions: txs.slice(0, 200),
      };
    });

    if (insufficientFunds) {
      return { ok: false, newBalance: finalBalance, error: "Недостаточно CXP на балансе" };
    }

    if (isDuplicate) {
      return { ok: true, newBalance: finalBalance, duplicate: true };
    }

    // Best-effort sync to relational wallet/transactions tables when present
    if (!isTableKnownMissing("cxrner_cxp_transactions")) {
      const { data: existingDbTx, error: txSelectErr } = await runOptionalTableQuery<{ id: string }>(
        "cxrner_cxp_transactions",
        () =>
          db
            .from("cxrner_cxp_transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("source_event_type", sourceEventType)
            .eq("source_event_id", eventId)
            .maybeSingle()
      );

      if (!txSelectErr && !existingDbTx) {
        const { error: txInsertErr } = await runOptionalTableQuery(
          "cxrner_cxp_transactions",
          () =>
            db.from("cxrner_cxp_transactions").insert({
              user_id: userId,
              amount,
              operation_type: amount >= 0 ? "credit" : "debit",
              reason,
              source_event_type: sourceEventType,
              source_event_id: eventId,
              admin_notes: adminNotes || null,
            })
        );

        if (!txInsertErr && !isTableKnownMissing("cxrner_cxp_wallet")) {
          const updatedVault = await readCabinetVault(userId, db);
          if (updatedVault?.ecosystem_wallet) {
            await runOptionalTableQuery("cxrner_cxp_wallet", () =>
              db.from("cxrner_cxp_wallet").upsert(updatedVault.ecosystem_wallet)
            );
          }
        }
      }
    }

    return { ok: true, newBalance: finalBalance };
  }

  // Local store fallback (CLI test scripts / offline)
  const store = loadLocalStore();
  const userTxs = store.transactions[userId] || [];

  const alreadyAwarded = userTxs.some(
    (tx) => tx.source_event_type === sourceEventType && tx.source_event_id === eventId
  );
  if (alreadyAwarded) {
    const cur = store.wallets[userId]?.balance || 0;
    return { ok: true, newBalance: cur, duplicate: true };
  }

  const currentWallet = store.wallets[userId] || {
    user_id: userId,
    balance: 0,
    total_earned: 0,
    total_spent: 0,
    updated_at: nowIso,
  };

  if (amount < 0 && currentWallet.balance < Math.abs(amount)) {
    return {
      ok: false,
      newBalance: currentWallet.balance,
      error: "Недостаточно CXP на балансе",
    };
  }

  currentWallet.balance = Math.max(0, currentWallet.balance + amount);
  if (amount > 0) currentWallet.total_earned += amount;
  if (amount < 0) currentWallet.total_spent += Math.abs(amount);
  currentWallet.updated_at = nowIso;
  store.wallets[userId] = currentWallet;

  saveLocalStore(store);
  return { ok: true, newBalance: currentWallet.balance };
}

export async function unlockAchievement(params: {
  userId: string;
  achievementKey: string;
}): Promise<{ ok: boolean; alreadyUnlocked: boolean }> {
  const { userId, achievementKey } = params;
  const achDef = ACHIEVEMENTS_CATALOG.find((a) => a.key === achievementKey);
  if (!achDef) return { ok: false, alreadyUnlocked: false };

  const nowIso = new Date().toISOString();
  const db = await getDbForUser(userId);

  if (db) {
    let already = false;

    // Check table & vault
    const { data: dbExisting, error: dbErr } = await runOptionalTableQuery<{ id: string }>(
      "cxrner_achievements",
      () =>
        db
          .from("cxrner_achievements")
          .select("id")
          .eq("user_id", userId)
          .eq("achievement_key", achievementKey)
          .maybeSingle()
    );

    if (!dbErr && dbExisting) {
      already = true;
    }

    if (!already) {
      await writeCabinetVault(userId, (prev) => {
        const list = Array.isArray(prev.ecosystem_achievements)
          ? [...(prev.ecosystem_achievements as UserAchievement[])]
          : [];
        if (list.some((a) => a.achievement_key === achievementKey)) {
          already = true;
          return prev;
        }
        list.push({
          id: crypto.randomUUID(),
          user_id: userId,
          achievement_key: achievementKey,
          unlocked_at: nowIso,
          is_pinned: false,
        });
        return {
          ...prev,
          ecosystem_achievements: list,
        };
      });
    }

    if (already) {
      return { ok: true, alreadyUnlocked: true };
    }

    // Best-effort relational write (skip if relation already known missing)
    if (!dbErr) {
      await runOptionalTableQuery("cxrner_achievements", () =>
        db.from("cxrner_achievements").insert({
          user_id: userId,
          achievement_key: achievementKey,
          unlocked_at: nowIso,
        })
      );
    }

    if (achDef.cxp_reward) {
      await awardCxp({
        userId,
        amount: achDef.cxp_reward,
        reason: `Достижение: ${achDef.name}`,
        sourceEventType: `achievement_${achievementKey.toLowerCase()}`,
      });
    }

    await createNotification({
      userId,
      type: "achievement",
      title: `Новое достижение: ${achDef.name}`,
      message: achDef.description,
      link: "/cabinet/profile",
    });

    return { ok: true, alreadyUnlocked: false };
  }

  // Local fallback
  const store = loadLocalStore();
  const list = store.achievements[userId] || [];
  if (list.some((a) => a.achievement_key === achievementKey)) {
    return { ok: true, alreadyUnlocked: true };
  }

  list.push({
    id: crypto.randomUUID(),
    user_id: userId,
    achievement_key: achievementKey,
    unlocked_at: nowIso,
    is_pinned: false,
  });
  store.achievements[userId] = list;
  saveLocalStore(store);

  if (achDef.cxp_reward) {
    await awardCxp({
      userId,
      amount: achDef.cxp_reward,
      reason: `Достижение: ${achDef.name}`,
      sourceEventType: `achievement_${achievementKey.toLowerCase()}`,
    });
  }

  await createNotification({
    userId,
    type: "achievement",
    title: `Новое достижение: ${achDef.name}`,
    message: achDef.description,
    link: "/cabinet/profile",
  });

  return { ok: true, alreadyUnlocked: false };
}

export async function createNotification(params: {
  userId: string;
  type: NotificationItem["type"];
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  const { userId, type, title, message, link } = params;
  const item: NotificationItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const db = await getDbForUser(userId);
  if (db) {
    await Promise.all([
      runOptionalTableQuery("cxrner_notifications", () =>
        db.from("cxrner_notifications").insert({
          id: item.id,
          user_id: userId,
          type,
          title,
          message,
          link: link || null,
          is_read: false,
        })
      ),
      writeCabinetVault(userId, (prev) => {
        const list = Array.isArray(prev.ecosystem_notifications)
          ? [...(prev.ecosystem_notifications as NotificationItem[])]
          : [];
        list.unshift(item);
        return {
          ...prev,
          ecosystem_notifications: list.slice(0, 50),
        };
      }),
    ]);
    return;
  }

  const store = loadLocalStore();
  const list = store.notifications[userId] || [];
  list.unshift(item);
  store.notifications[userId] = list.slice(0, 50);
  saveLocalStore(store);
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const db = await getDbForUser(userId);
  if (db) {
    const [{ data, error }, vault] = await Promise.all([
      db
        .from("cxrner_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      readCabinetVault(userId, db),
    ]);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as NotificationItem[];
    }
    if (Array.isArray(vault?.ecosystem_notifications)) {
      return vault.ecosystem_notifications as NotificationItem[];
    }
    return [];
  }

  const store = loadLocalStore();
  return store.notifications[userId] || [];
}

export async function markNotificationsRead(params: {
  userId: string;
  notificationId?: string;
  markAll?: boolean;
}): Promise<void> {
  const { userId, notificationId, markAll } = params;
  const db = await getDbForUser(userId);
  if (db) {
    if (markAll) {
      await db.from("cxrner_notifications").update({ is_read: true }).eq("user_id", userId);
    } else if (notificationId) {
      await db
        .from("cxrner_notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);
    }

    await writeCabinetVault(userId, (prev) => {
      const list = Array.isArray(prev.ecosystem_notifications)
        ? (prev.ecosystem_notifications as NotificationItem[]).map((n) =>
            markAll || n.id === notificationId ? { ...n, is_read: true } : n
          )
        : [];
      return { ...prev, ecosystem_notifications: list };
    });
    return;
  }

  const store = loadLocalStore();
  const list = store.notifications[userId] || [];
  store.notifications[userId] = list.map((n) =>
    markAll || n.id === notificationId ? { ...n, is_read: true } : n
  );
  saveLocalStore(store);
}

// =========================================================================
// 3. USER PROFILES (CXRNER ID)
// =========================================================================

export function sanitizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

export async function getProfileByUsername(username: string): Promise<CxrnerProfile | null> {
  const clean = sanitizeUsername(username);
  if (!clean) return null;

  const { client: db } = await getEcosystemDbClient();
  if (db) {
    const { data: tableProf, error } = await db
      .from("cxrner_profiles")
      .select("*")
      .ilike("username", clean)
      .maybeSingle();

    if (!error && tableProf) {
      const vault = await readCabinetVault(tableProf.id, db);
      return hydrateProfileWithCabinet(tableProf as CxrnerProfile, vault, tableProf.id);
    }

    // Search cxrner_cabinet_users vault across all registered users
    const users = await listAllCabinetUsers(500);
    for (const row of users) {
      const p = row.profile;
      const cid = p.cxrner_id as CxrnerProfile | undefined;
      const candidateUsername = sanitizeUsername(cid?.username || p.username || "");
      if (candidateUsername === clean) {
        if (cid) {
          return hydrateProfileWithCabinet(cid, p, row.user_id);
        }
        // Build fallback minimal profile so public link doesn't 404 for basic cabinet user
        return hydrateProfileWithCabinet(
          {
            id: row.user_id,
            username: candidateUsername,
            display_name: p.artist_name || p.display_name || "CXRNER Artist",
            avatar_url: p.avatar_url || null,
            banner_url: null,
            bio: null,
            country: "RU",
            city: null,
            genres: [],
            music_roles: ["Artist"],
            social_links: [],
            music_links: [],
            telegram_id: p.telegram_id ? String(p.telegram_id) : null,
            telegram_username: p.telegram_username || null,
            telegram_linked: Boolean(p.telegram_id),
            is_artist_verified: false,
            completion_percentage: 15,
            completion_reward_80_claimed: false,
            completion_reward_100_claimed: false,
            privacy_settings: {
              is_public: true,
              show_inventory: true,
              show_stats: true,
              show_referrals: true,
              show_music: true,
              show_in_leaderboard: true,
            },
            pinned_achievements: [],
            pinned_items: [],
            is_banned: false,
            created_at: row.updated_at,
            updated_at: row.updated_at,
          },
          p,
          row.user_id
        );
      }
    }
  }

  const store = loadLocalStore();
  const found = Object.values(store.profiles).find(
    (p) => p.username.toLowerCase() === clean
  );
  return found || null;
}

export async function getProfileByUserId(userId: string): Promise<CxrnerProfile | null> {
  if (!userId) return null;

  const db = await getDbForUser(userId);
  if (db) {
    const [{ data: tableProf, error }, vault] = await Promise.all([
      db.from("cxrner_profiles").select("*").eq("id", userId).maybeSingle(),
      readCabinetVault(userId, db),
    ]);

    const hydrated = hydrateProfileWithCabinet(
      !error && tableProf ? (tableProf as CxrnerProfile) : null,
      vault,
      userId
    );
    if (hydrated) return hydrated;
    return null;
  }

  const store = loadLocalStore();
  return store.profiles[userId] || null;
}

export async function upsertUserProfile(params: {
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  country?: string;
  city?: string | null;
  genres?: string[];
  musicRoles?: MusicRole[];
  socialLinks?: Array<{ platform: string; url: string }>;
  musicLinks?: Array<{ platform: string; url: string }>;
  telegramId?: string;
  telegramUsername?: string;
  telegramLinked?: boolean;
  privacySettings?: Partial<CxrnerProfile["privacy_settings"]>;
  equippedFrame?: string | null;
  equippedEffect?: string | null;
  equippedTitle?: string | null;
  equippedBadge?: string | null;
  equippedShowcaseItem?: string | null;
  equippedBackground?: string | null;
  pinnedAchievements?: string[];
  pinnedItems?: string[];
}): Promise<{ ok: boolean; profile: CxrnerProfile; rewardsAwarded: string[] }> {
  const existingProfile = await getProfileByUserId(params.userId);
  const existingVault = await readCabinetVault(params.userId);
  const nowIso = new Date().toISOString();

  const current: CxrnerProfile = existingProfile || {
    id: params.userId,
    username: sanitizeUsername(params.username || "") || `artist_${params.userId.slice(0, 6)}`,
    display_name:
      (params.displayName !== undefined ? params.displayName : undefined) ||
      existingVault?.artist_name ||
      "CXRNER Artist",
    avatar_url: existingVault?.avatar_url || null,
    banner_url: null,
    bio: null,
    country: "RU",
    city: null,
    genres: [],
    music_roles: ["Artist"],
    social_links: [],
    music_links: [],
    telegram_id: existingVault?.telegram_id ? String(existingVault.telegram_id) : null,
    telegram_username: existingVault?.telegram_username || null,
    telegram_linked: Boolean(existingVault?.telegram_id),
    is_artist_verified: false,
    completion_percentage: 0,
    completion_reward_80_claimed: false,
    completion_reward_100_claimed: false,
    privacy_settings: {
      is_public: true,
      show_inventory: true,
      show_stats: true,
      show_referrals: true,
      show_music: true,
      show_in_leaderboard: true,
    },
    equipped_frame: null,
    equipped_effect: null,
    equipped_title: null,
    equipped_badge: null,
    equipped_showcase_item: null,
    equipped_background: null,
    pinned_achievements: [],
    pinned_items: [],
    is_banned: false,
    ban_reason: null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const resolvedUsername =
    params.username !== undefined && sanitizeUsername(params.username).length >= 3
      ? sanitizeUsername(params.username)
      : current.username;

  const updated: CxrnerProfile = {
    ...current,
    username: resolvedUsername,
    display_name:
      params.displayName !== undefined
        ? params.displayName.trim() || current.display_name
        : current.display_name,
    avatar_url: params.avatarUrl !== undefined ? params.avatarUrl || null : current.avatar_url,
    banner_url: params.bannerUrl !== undefined ? params.bannerUrl || null : current.banner_url,
    bio: params.bio !== undefined ? params.bio : current.bio,
    country: params.country !== undefined ? params.country : current.country,
    city: params.city !== undefined ? params.city || null : current.city,
    genres: params.genres !== undefined ? params.genres : current.genres,
    music_roles: params.musicRoles !== undefined ? params.musicRoles : current.music_roles,
    social_links: params.socialLinks !== undefined ? params.socialLinks : current.social_links,
    music_links: params.musicLinks !== undefined ? params.musicLinks : current.music_links,
    telegram_id:
      params.telegramId !== undefined
        ? params.telegramId
        : current.telegram_id || (existingVault?.telegram_id ? String(existingVault.telegram_id) : null),
    telegram_username:
      params.telegramUsername !== undefined
        ? params.telegramUsername
        : current.telegram_username || existingVault?.telegram_username || null,
    telegram_linked:
      params.telegramLinked !== undefined
        ? params.telegramLinked
        : Boolean(
            current.telegram_linked || current.telegram_id || existingVault?.telegram_id
          ),
    privacy_settings: {
      ...current.privacy_settings,
      ...(params.privacySettings || {}),
    },
    equipped_frame: params.equippedFrame !== undefined ? params.equippedFrame : current.equipped_frame,
    equipped_effect: params.equippedEffect !== undefined ? params.equippedEffect : current.equipped_effect,
    equipped_title: params.equippedTitle !== undefined ? params.equippedTitle : current.equipped_title,
    equipped_badge:
      params.equippedBadge !== undefined
        ? params.equippedBadge === "verified" && !current.is_artist_verified
          ? current.equipped_badge
          : params.equippedBadge
        : current.equipped_badge,
    equipped_showcase_item:
      params.equippedShowcaseItem !== undefined
        ? params.equippedShowcaseItem
        : current.equipped_showcase_item,
    equipped_background:
      params.equippedBackground !== undefined
        ? params.equippedBackground
        : current.equipped_background,
    pinned_achievements:
      params.pinnedAchievements !== undefined
        ? params.pinnedAchievements
        : current.pinned_achievements,
    pinned_items: params.pinnedItems !== undefined ? params.pinnedItems : current.pinned_items,
    updated_at: nowIso,
  };

  const { total } = calculateProfileCompletion(updated);
  updated.completion_percentage = total;

  const rewardsAwarded: string[] = [];

  if (total >= 80 && !updated.completion_reward_80_claimed) {
    updated.completion_reward_80_claimed = true;
    await awardCxp({
      userId: updated.id,
      amount: 100,
      reason: "Бонус за заполнение профиля (80%+)",
      sourceEventType: "profile_completion_80",
    });
    await unlockAchievement({
      userId: updated.id,
      achievementKey: "PROFILE_COMPLETE",
    });
    rewardsAwarded.push("PROFILE_80_BONUS_100_CXP");
  }

  if (total >= 100 && !updated.completion_reward_100_claimed) {
    updated.completion_reward_100_claimed = true;
    await unlockAchievement({
      userId: updated.id,
      achievementKey: "PERFECT_PROFILE",
    });
    if (!updated.equipped_frame) {
      updated.equipped_frame = "frame-cyber-chrome";
    }
    rewardsAwarded.push("PERFECT_PROFILE_COSMETIC");
  }

  const stableRefCode =
    existingVault?.referral_code || buildStableReferralCode(updated.id, updated.username);

  const db = await getDbForUser(updated.id);
  if (db) {
    // 1. Primary resilient write to cxrner_cabinet_users vault
    await writeCabinetVault(updated.id, (prev) => ({
      ...prev,
      username: updated.username,
      display_name: updated.display_name,
      artist_name: prev.artist_name || updated.display_name,
      avatar_url: updated.avatar_url || prev.avatar_url || null,
      referral_code: prev.referral_code || stableRefCode,
      cxrner_id: updated,
    }));

    // 2. Sync to cxrner_profiles table if it exists in Supabase
    const { error: profErr } = await db.from("cxrner_profiles").upsert(toDbProfileRow(updated));
    if (profErr && !profErr.message?.includes("Could not find the table")) {
      console.warn("[upsertUserProfile] cxrner_profiles sync note:", profErr.message);
    }
  } else {
    const store = loadLocalStore();
    store.profiles[updated.id] = updated;
    saveLocalStore(store);
  }

  // Always check referral milestone progression when profile updates
  if (total >= 80 || updated.telegram_linked || updated.is_artist_verified) {
    await evaluateReferralMilestones(updated.id).catch(() => {});
  }

  return { ok: true, profile: updated, rewardsAwarded };
}

// =========================================================================
// 4. ARTIST PROFILES & VERIFICATION SYSTEM
// =========================================================================

function toDbVerificationRow(v: CxrnerArtistVerification) {
  return {
    id: v.id,
    user_id: v.user_id,
    artist_profile_id: v.artist_profile_id || null,
    stage_name: v.stage_name,
    method: v.method,
    verification_code: v.verification_code || null,
    verification_code_status: v.verification_code_status || "active",
    evidence_links: Array.isArray(v.evidence_links) ? v.evidence_links : [],
    evidence_notes: v.evidence_notes || null,
    status: v.status,
    reviewer_notes: v.reviewer_notes || null,
    reject_reason: v.reject_reason || null,
    reward_claimed: Boolean(v.reward_claimed),
    created_at: v.created_at,
    reviewed_at: v.reviewed_at || null,
    reviewed_by: v.reviewed_by || null,
  };
}

export async function getArtistProfileByUserId(userId: string): Promise<CxrnerArtistProfile | null> {
  const db = await getDbForUser(userId);
  if (db) {
    const [{ data, error }, vault] = await Promise.all([
      runOptionalTableQuery<CxrnerArtistProfile>("cxrner_artist_profiles", () =>
        db.from("cxrner_artist_profiles").select("*").eq("user_id", userId).maybeSingle()
      ),
      readCabinetVault(userId, db),
    ]);
    if (vault?.ecosystem_artist_profile) {
      const vaultArt = vault.ecosystem_artist_profile as CxrnerArtistProfile;
      if (!error && data) {
        const tDb = new Date(data.updated_at || 0).getTime();
        const tVault = new Date(vaultArt.updated_at || 0).getTime();
        return tVault >= tDb ? vaultArt : (data as CxrnerArtistProfile);
      }
      return vaultArt;
    }
    if (!error && data) return data as CxrnerArtistProfile;
    return null;
  }

  const store = loadLocalStore();
  return store.artistProfiles[userId] || null;
}

export async function upsertArtistProfile(
  userId: string,
  data: Partial<CxrnerArtistProfile>
): Promise<CxrnerArtistProfile> {
  const nowIso = new Date().toISOString();
  const current = (await getArtistProfileByUserId(userId)) || {
    id: crypto.randomUUID(),
    user_id: userId,
    stage_name: data.stage_name || "New Artist",
    project_type: "solo",
    avatar_url: null,
    banner_url: null,
    bio: null,
    genres: [],
    country: "RU",
    city: null,
    members: [],
    verification_status: "not_verified",
    created_at: nowIso,
    updated_at: nowIso,
  };

  const updated: CxrnerArtistProfile = {
    ...current,
    ...data,
    updated_at: nowIso,
  };

  const db = await getDbForUser(userId);
  if (db) {
    await writeCabinetVault(userId, (prev) => ({
      ...prev,
      ecosystem_artist_profile: updated,
    }));
    await runOptionalTableQuery("cxrner_artist_profiles", () =>
      db.from("cxrner_artist_profiles").upsert(updated)
    );
    return updated;
  }

  const store = loadLocalStore();
  store.artistProfiles[userId] = updated;
  saveLocalStore(store);
  return updated;
}

export async function getVerificationByUserId(
  userId: string
): Promise<CxrnerArtistVerification | null> {
  const db = await getDbForUser(userId);
  if (db) {
    const [{ data, error }, vault] = await Promise.all([
      runOptionalTableQuery<CxrnerArtistVerification>("cxrner_artist_verifications", () =>
        db
          .from("cxrner_artist_verifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ),
      readCabinetVault(userId, db),
    ]);
    const vaultVer = vault?.ecosystem_verification as CxrnerArtistVerification | undefined;
    if (vaultVer) {
      if (!error && data) {
        const tDb = new Date(data.reviewed_at || data.created_at || 0).getTime();
        const tVault = new Date(
          vaultVer.updated_at || vaultVer.reviewed_at || vaultVer.created_at || 0
        ).getTime();
        return tVault >= tDb ? vaultVer : { ...(data as CxrnerArtistVerification), ...vaultVer };
      }
      return vaultVer;
    }
    if (!error && data) return data as CxrnerArtistVerification;
    return null;
  }

  const store = loadLocalStore();
  return store.verifications[userId] || null;
}

function enrichVerificationWithVault(
  ver: CxrnerArtistVerification,
  cabinetRow?: { user_id: string; profile: Record<string, any>; updated_at: string },
  fallbackProfile?: CxrnerProfile | null,
  fallbackArtist?: CxrnerArtistProfile | null
): CxrnerArtistVerification {
  const vault = cabinetRow?.profile || {};
  const cid = (vault.cxrner_id as CxrnerProfile | undefined) || fallbackProfile || null;
  const art =
    (vault.ecosystem_artist_profile as CxrnerArtistProfile | undefined) || fallbackArtist || null;

  const tgId =
    cid?.telegram_id ||
    (vault.telegram_id ? String(vault.telegram_id) : null);
  const tgUsername =
    ver.contact_telegram ||
    cid?.telegram_username ||
    vault.telegram_username ||
    null;

  return {
    ...ver,
    stage_name:
      ver.stage_name && ver.stage_name !== "Artist"
        ? ver.stage_name
        : art?.stage_name || cid?.display_name || vault.artist_name || ver.stage_name || "Artist",
    project_type: ver.project_type || art?.project_type || "solo",
    genres:
      Array.isArray(ver.genres) && ver.genres.length > 0
        ? ver.genres
        : Array.isArray(art?.genres) && art.genres.length > 0
        ? art.genres
        : Array.isArray(cid?.genres)
        ? cid.genres
        : [],
    country: ver.country || art?.country || cid?.country || "RU",
    city: ver.city ?? art?.city ?? cid?.city ?? null,
    contact_telegram: tgUsername,
    bio: ver.bio ?? art?.bio ?? cid?.bio ?? null,
    account_summary: {
      username: cid?.username || vault.username || `artist_${ver.user_id.slice(0, 6)}`,
      display_name:
        cid?.display_name || vault.artist_name || ver.stage_name || "CXRNER Artist",
      email: vault.email || vault.contact_email || null,
      avatar_url: cid?.avatar_url || vault.avatar_url || null,
      telegram_username: tgUsername,
      telegram_id: tgId,
      telegram_linked: Boolean(cid?.telegram_linked || tgId),
      is_artist_verified: Boolean(cid?.is_artist_verified || ver.status === "verified"),
      completion_percentage: cid?.completion_percentage || 0,
      country: cid?.country || art?.country || ver.country || "RU",
      city: cid?.city || art?.city || ver.city || null,
      bio: cid?.bio || art?.bio || ver.bio || null,
      genres: Array.isArray(cid?.genres) ? cid.genres : [],
      music_roles: Array.isArray(cid?.music_roles) ? cid.music_roles : ["Artist"],
      social_links: Array.isArray(cid?.social_links) ? cid.social_links : [],
      music_links: Array.isArray(cid?.music_links) ? cid.music_links : [],
    },
    artist_profile: art,
  };
}

export async function getAllVerifications(
  statusFilter = "all"
): Promise<CxrnerArtistVerification[]> {
  const { client: db } = await getEcosystemDbClient();
  if (db) {
    const [{ data: dbRows }, users] = await Promise.all([
      runOptionalTableQuery<CxrnerArtistVerification[]>("cxrner_artist_verifications", () => {
        let query = db
          .from("cxrner_artist_verifications")
          .select("*")
          .order("created_at", { ascending: false });
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        return query;
      }),
      listAllCabinetUsers(500),
    ]);

    const userMap = new Map(users.map((u) => [u.user_id, u]));
    const byUserId = new Map<string, CxrnerArtistVerification>();

    if (Array.isArray(dbRows)) {
      for (const row of dbRows) {
        byUserId.set(row.user_id, row);
      }
    }

    for (const u of users) {
      const vaultVer = u.profile.ecosystem_verification as CxrnerArtistVerification | undefined;
      const cid = u.profile.cxrner_id as CxrnerProfile | undefined;
      const art = u.profile.ecosystem_artist_profile as CxrnerArtistProfile | undefined;

      if (vaultVer) {
        const existing = byUserId.get(u.user_id);
        if (!existing) {
          byUserId.set(u.user_id, vaultVer);
        } else {
          const tDb = new Date(existing.reviewed_at || existing.created_at || 0).getTime();
          const tVault = new Date(
            vaultVer.updated_at || vaultVer.reviewed_at || vaultVer.created_at || 0
          ).getTime();
          byUserId.set(
            u.user_id,
            tVault >= tDb ? { ...existing, ...vaultVer } : { ...vaultVer, ...existing }
          );
        }
      } else if (art || cid) {
        // Also surface registered artist profiles in Admin Panel so Admin can inspect & verify any artist
        const synthesizedStatus: VerificationStatus = cid?.is_artist_verified
          ? "verified"
          : art?.verification_status && art.verification_status !== "not_verified"
          ? art.verification_status
          : "not_verified";

        const synthLinks: Array<{ title: string; url: string }> = [];
        if (art?.yandex_music_url) synthLinks.push({ title: "Яндекс Музыка", url: art.yandex_music_url });
        if (art?.spotify_url) synthLinks.push({ title: "Spotify", url: art.spotify_url });
        if (art?.apple_music_url) synthLinks.push({ title: "Apple Music", url: art.apple_music_url });
        if (art?.vk_music_url) synthLinks.push({ title: "VK Музыка", url: art.vk_music_url });
        if (Array.isArray(cid?.music_links)) {
          for (const ml of cid.music_links) {
            if (ml.url && !synthLinks.some((s) => s.url === ml.url)) {
              synthLinks.push({ title: ml.platform || "Площадка", url: ml.url });
            }
          }
        }
        if (Array.isArray(cid?.social_links)) {
          for (const sl of cid.social_links) {
            if (sl.url && !synthLinks.some((s) => s.url === sl.url)) {
              synthLinks.push({ title: sl.platform || "Соцсеть", url: sl.url });
            }
          }
        }

        byUserId.set(u.user_id, {
          id: art?.id || `profile_${u.user_id}`,
          user_id: u.user_id,
          artist_profile_id: art?.id || null,
          stage_name:
            art?.stage_name || cid?.display_name || u.profile.artist_name || "CXRNER Artist",
          method: "manual",
          verification_code: null,
          verification_code_status: "active",
          evidence_links: synthLinks,
          evidence_notes: cid?.bio || art?.bio || null,
          status: synthesizedStatus,
          reward_claimed: Boolean(cid?.is_artist_verified),
          created_at: cid?.created_at || u.updated_at || new Date().toISOString(),
          updated_at: cid?.updated_at || u.updated_at || null,
        });
      }
    }

    const enriched: CxrnerArtistVerification[] = [];
    for (const [uid, ver] of byUserId.entries()) {
      const item = enrichVerificationWithVault(ver, userMap.get(uid));
      if (statusFilter === "all") {
        enriched.push(item);
      } else if (item.status === statusFilter) {
        enriched.push(item);
      }
    }

    const statusPriority: Record<string, number> = {
      pending: 0,
      needs_info: 1,
      verified: 2,
      rejected: 3,
      draft: 4,
      not_verified: 5,
    };

    return enriched.sort((a, b) => {
      const pa = statusPriority[a.status] ?? 9;
      const pb = statusPriority[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  const store = loadLocalStore();
  return Object.values(store.verifications)
    .filter((v) => statusFilter === "all" || v.status === statusFilter)
    .map((v) =>
      enrichVerificationWithVault(
        v,
        undefined,
        store.profiles[v.user_id] || null,
        store.artistProfiles[v.user_id] || null
      )
    );
}

export async function generateVerificationCode(userId: string): Promise<string> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const code = `CXRNER-${randomSuffix}`;
  const nowIso = new Date().toISOString();

  const existing = await getVerificationByUserId(userId);
  const profile = await getProfileByUserId(userId);
  const nextVer: CxrnerArtistVerification = existing
    ? {
        ...existing,
        verification_code: code,
        verification_code_status: "active",
        updated_at: nowIso,
      }
    : {
        id: crypto.randomUUID(),
        user_id: userId,
        stage_name: profile?.display_name || "Artist",
        method: "code",
        verification_code: code,
        verification_code_status: "active",
        evidence_links: [],
        evidence_notes: "",
        status: "draft",
        reward_claimed: false,
        created_at: nowIso,
        updated_at: nowIso,
      };

  const db = await getDbForUser(userId);
  if (db) {
    await writeCabinetVault(userId, (prev) => ({
      ...prev,
      ecosystem_verification: nextVer,
    }));
    await runOptionalTableQuery("cxrner_artist_verifications", () =>
      db.from("cxrner_artist_verifications").upsert(toDbVerificationRow(nextVer))
    );
    return code;
  }

  const store = loadLocalStore();
  store.verifications[userId] = nextVer;
  saveLocalStore(store);
  return code;
}

export async function submitVerificationApplication(params: {
  userId: string;
  stageName: string;
  method: "oauth" | "code" | "manual";
  evidenceLinks: Array<{ title: string; url: string }>;
  evidenceNotes?: string;
  verificationCode?: string;
  projectType?: "solo" | "duo" | "band" | "collective";
  genres?: string[];
  country?: string;
  city?: string;
  contactTelegram?: string;
  bio?: string;
  releaseLinks?: string;
}): Promise<CxrnerArtistVerification> {
  const {
    userId,
    stageName,
    method,
    evidenceLinks,
    evidenceNotes,
    verificationCode,
    projectType,
    genres,
    country,
    city,
    contactTelegram,
    bio,
    releaseLinks,
  } = params;

  const nowIso = new Date().toISOString();
  const existing = await getVerificationByUserId(userId);
  const cleanStageName = stageName.trim();

  // Extract DSP URLs from evidence links to keep artist profile synchronized
  const findUrl = (keywords: string[]) =>
    evidenceLinks.find((l) => {
      const hay = `${l.title} ${l.url}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    })?.url || undefined;

  const spotifyUrl = findUrl(["spotify"]);
  const yandexUrl = findUrl(["yandex", "яндекс"]);
  const appleUrl = findUrl(["apple"]);
  const vkUrl = findUrl(["vk.com", "vk ", "вк"]);
  const tgUrl = findUrl(["t.me", "telegram", "телеграм"]);

  const artistProf = await upsertArtistProfile(userId, {
    stage_name: cleanStageName,
    ...(projectType ? { project_type: projectType } : {}),
    ...(Array.isArray(genres) && genres.length > 0 ? { genres } : {}),
    ...(country ? { country } : {}),
    ...(city !== undefined ? { city: city || null } : {}),
    ...(bio !== undefined && bio.trim() ? { bio: bio.trim() } : {}),
    ...(spotifyUrl ? { spotify_url: spotifyUrl } : {}),
    ...(yandexUrl ? { yandex_music_url: yandexUrl } : {}),
    ...(appleUrl ? { apple_music_url: appleUrl } : {}),
    ...(vkUrl ? { vk_music_url: vkUrl } : {}),
    ...(tgUrl ? { telegram_url: tgUrl } : {}),
    verification_status: "pending",
  });

  // Also sync filled fields into CXRNER ID profile so user's profile & admin dossier stay consistent
  const currentProfile = await getProfileByUserId(userId);
  if (currentProfile) {
    const mergedMusicLinks = [...(currentProfile.music_links || [])];
    const mergedSocialLinks = [...(currentProfile.social_links || [])];

    for (const link of evidenceLinks) {
      if (!link.url) continue;
      const lower = `${link.title} ${link.url}`.toLowerCase();
      const isSocial =
        lower.includes("t.me") ||
        lower.includes("telegram") ||
        lower.includes("instagram") ||
        lower.includes("tiktok") ||
        (lower.includes("vk.com") && !lower.includes("artist"));
      if (isSocial) {
        if (!mergedSocialLinks.some((s) => s.url === link.url)) {
          mergedSocialLinks.push({ platform: link.title || "Social", url: link.url });
        }
      } else {
        if (!mergedMusicLinks.some((m) => m.url === link.url)) {
          mergedMusicLinks.push({ platform: link.title || "DSP", url: link.url });
        }
      }
    }

    await upsertUserProfile({
      userId,
      displayName: currentProfile.display_name === "CXRNER Artist" ? cleanStageName : undefined,
      bio: bio && !currentProfile.bio ? bio : undefined,
      country: country || currentProfile.country,
      city: city || currentProfile.city || undefined,
      genres:
        Array.isArray(genres) && genres.length > 0
          ? Array.from(new Set([...(currentProfile.genres || []), ...genres]))
          : undefined,
      telegramUsername:
        contactTelegram && !currentProfile.telegram_username
          ? contactTelegram.replace(/^@/, "").trim()
          : undefined,
      musicLinks: mergedMusicLinks,
      socialLinks: mergedSocialLinks,
    });
  }

  // Strictly status: "pending" — only Admin in Admin Panel can set status: "verified"
  const ver: CxrnerArtistVerification = {
    id: existing?.id || crypto.randomUUID(),
    user_id: userId,
    artist_profile_id: artistProf.id,
    stage_name: cleanStageName,
    method: method === "oauth" ? "manual" : method,
    verification_code: verificationCode || existing?.verification_code || null,
    verification_code_status: "active",
    evidence_links: evidenceLinks,
    evidence_notes: evidenceNotes || null,
    project_type: projectType || artistProf.project_type || "solo",
    genres: Array.isArray(genres) && genres.length > 0 ? genres : artistProf.genres || [],
    country: country || artistProf.country || "RU",
    city: city !== undefined ? city || null : artistProf.city || null,
    contact_telegram: contactTelegram ? contactTelegram.replace(/^@/, "").trim() : null,
    bio: bio || artistProf.bio || null,
    release_links: releaseLinks || null,
    status: "pending",
    reviewer_notes: null,
    reject_reason: null,
    reward_claimed: Boolean(existing?.reward_claimed),
    created_at: existing?.created_at || nowIso,
    updated_at: nowIso,
  };

  const db = await getDbForUser(userId);
  if (db) {
    await writeCabinetVault(userId, (prev) => ({
      ...prev,
      artist_name: cleanStageName,
      ecosystem_verification: ver,
    }));
    await runOptionalTableQuery("cxrner_artist_verifications", () =>
      db.from("cxrner_artist_verifications").upsert(toDbVerificationRow(ver))
    );
  } else {
    const store = loadLocalStore();
    store.verifications[userId] = ver;
    saveLocalStore(store);
  }

  await createNotification({
    userId,
    type: "system",
    title: "Заявка на верификацию отправлена",
    message: `Заявка для «${cleanStageName}» передана в панель администратора CXRNER. Верификация будет активирована после ручной проверки ваших данных.`,
    link: "/cabinet/verification",
  });

  return ver;
}

export async function processVerificationReview(params: {
  verificationId: string;
  targetUserId: string;
  decision: "verified" | "rejected" | "needs_info" | "not_verified";
  reviewerEmail: string;
  notes?: string;
  rejectReason?: string;
}): Promise<{ ok: boolean; status: VerificationStatus }> {
  const { targetUserId, decision, reviewerEmail, notes, rejectReason } = params;
  const reviewedAt = new Date().toISOString();
  const profile = await getProfileByUserId(targetUserId);
  const artistProf = await getArtistProfileByUserId(targetUserId);

  const existingVer = await getVerificationByUserId(targetUserId);
  const ver: CxrnerArtistVerification = existingVer || {
    id: crypto.randomUUID(),
    user_id: targetUserId,
    artist_profile_id: artistProf?.id || null,
    stage_name: artistProf?.stage_name || profile?.display_name || "CXRNER Artist",
    method: "manual",
    verification_code: null,
    verification_code_status: "active",
    evidence_links: [],
    evidence_notes: null,
    status: decision,
    reward_claimed: false,
    created_at: reviewedAt,
  };

  ver.status = decision;
  ver.reviewer_notes = notes || null;
  ver.reject_reason = rejectReason || null;
  ver.reviewed_at = reviewedAt;
  ver.reviewed_by = reviewerEmail;
  ver.updated_at = reviewedAt;
  if (decision === "verified") {
    ver.verification_code_status = "verified";
  }

  const db = await getDbForUser(targetUserId);

  if (decision === "verified") {
    if (profile) {
      profile.is_artist_verified = true;
      if (!profile.equipped_badge) profile.equipped_badge = "verified";
      profile.updated_at = reviewedAt;

      if (db) {
        await writeCabinetVault(targetUserId, (prev) => ({
          ...prev,
          cxrner_id: profile,
        }));
        await runOptionalTableQuery("cxrner_profiles", () =>
          db
            .from("cxrner_profiles")
            .update({ is_artist_verified: true, equipped_badge: profile.equipped_badge })
            .eq("id", targetUserId)
        );
      } else {
        const store = loadLocalStore();
        store.profiles[targetUserId] = profile;
        saveLocalStore(store);
      }
    }

    await upsertArtistProfile(targetUserId, {
      stage_name: ver.stage_name || artistProf?.stage_name || profile?.display_name || "Artist",
      verification_status: "verified",
      verified_at: reviewedAt,
    });

    if (!ver.reward_claimed) {
      ver.reward_claimed = true;
      await awardCxp({
        userId: targetUserId,
        amount: 100,
        reason: "Верификация артистического профиля",
        sourceEventType: "artist_verified_reward",
      });
      await unlockAchievement({
        userId: targetUserId,
        achievementKey: "VERIFIED_ARTIST",
      });
    }

    await evaluateReferralMilestones(targetUserId);

    await createNotification({
      userId: targetUserId,
      type: "verification_update",
      title: "Артистический профиль верифицирован!",
      message:
        "Поздравляем! Администратор проверил ваши данные и подтвердил аккаунт артиста. В профиле активирован статус CXRNER VERIFIED и начислено 100 CXP.",
      link: "/cabinet/profile",
    });
  } else {
    // If rejected, needs_info, or revoked (not_verified), ensure is_artist_verified is false
    if (profile && profile.is_artist_verified) {
      profile.is_artist_verified = false;
      if (profile.equipped_badge === "verified") {
        profile.equipped_badge = null;
      }
      profile.updated_at = reviewedAt;

      if (db) {
        await writeCabinetVault(targetUserId, (prev) => ({
          ...prev,
          cxrner_id: profile,
        }));
        await runOptionalTableQuery("cxrner_profiles", () =>
          db
            .from("cxrner_profiles")
            .update({ is_artist_verified: false, equipped_badge: profile.equipped_badge })
            .eq("id", targetUserId)
        );
      } else {
        const store = loadLocalStore();
        store.profiles[targetUserId] = profile;
        saveLocalStore(store);
      }
    }

    if (artistProf) {
      await upsertArtistProfile(targetUserId, {
        verification_status: decision,
        verified_at: null,
      });
    }

    if (decision === "rejected") {
      await createNotification({
        userId: targetUserId,
        type: "verification_update",
        title: "Верификация отклонена",
        message: `Причина: ${rejectReason || "Недостаточно доказательств владения карточкой артиста"}. Вы можете дополнить данные и подать заявку повторно.`,
        link: "/cabinet/verification",
      });
    } else if (decision === "needs_info") {
      await createNotification({
        userId: targetUserId,
        type: "verification_update",
        title: "Требуются дополнительные данные",
        message: notes || "Администратор запросил уточняющую информацию по вашей заявке на верификацию.",
        link: "/cabinet/verification",
      });
    } else if (decision === "not_verified") {
      await createNotification({
        userId: targetUserId,
        type: "verification_update",
        title: "Статус верификации изменён",
        message: notes || "Статус верификации аккаунта артиста был снят администратором.",
        link: "/cabinet/verification",
      });
    }
  }

  if (db) {
    await writeCabinetVault(targetUserId, (prev) => ({
      ...prev,
      ecosystem_verification: ver,
    }));
    await runOptionalTableQuery("cxrner_artist_verifications", () =>
      db.from("cxrner_artist_verifications").upsert(toDbVerificationRow(ver))
    );
  } else {
    const store = loadLocalStore();
    store.verifications[targetUserId] = ver;
    saveLocalStore(store);
  }

  return { ok: true, status: decision };
}

// =========================================================================
// 5. CXRNER DROP & INVENTORY (Procedural Specimens, Equips, Showcase)
// =========================================================================

function toCoreInventoryRow(item: DropInventoryItem) {
  return {
    id: item.id,
    user_id: item.user_id,
    item_id: item.item_id,
    item_name: item.item_name,
    collection_name: item.collection_name,
    rarity: item.rarity,
    serial_number: item.serial_number,
    description: item.description,
    image_url: item.image_url,
    model_3d_type: item.model_3d_type,
    model_color: item.model_color,
    obtained_via: item.obtained_via,
    is_equipped: Boolean(item.is_equipped),
    is_pinned: Boolean(item.is_pinned),
    is_hidden: Boolean(item.is_hidden),
    created_at: item.created_at,
  };
}

export async function getUserInventory(userId: string): Promise<DropInventoryItem[]> {
  const db = await getDbForUser(userId);
  if (db) {
    const [{ data: dbRows, error: dbErr }, vault] = await Promise.all([
      runOptionalTableQuery<DropInventoryItem[]>("cxrner_drop_inventory", () =>
        db
          .from("cxrner_drop_inventory")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      ),
      readCabinetVault(userId, db),
    ]);

    const vaultItems = Array.isArray(vault?.ecosystem_inventory)
      ? (vault.ecosystem_inventory as DropInventoryItem[])
      : [];

    if (!dbErr && Array.isArray(dbRows) && dbRows.length > 0) {
      const vaultMap = new Map(vaultItems.map((i) => [i.id, i]));
      return (dbRows as DropInventoryItem[]).map((row) =>
        enrichInventoryItem({ ...row, ...(vaultMap.get(row.id) || {}) })
      );
    }

    if (vaultItems.length > 0) {
      return vaultItems.map(enrichInventoryItem);
    }

    if (vault?.ecosystem_starter_granted) {
      return [];
    }

    // Grant & PERSIST starter item once for new user
    const starterSpec = DROP_SPECIMENS[0];
    const initialItem = enrichInventoryItem({
      id: crypto.randomUUID(),
      user_id: userId,
      item_id: starterSpec.item_id,
      item_name: starterSpec.item_name,
      specimen_code: starterSpec.specimen_code,
      specimen_class: starterSpec.specimen_class,
      collection_name: starterSpec.collection_name,
      rarity: starterSpec.rarity,
      drop_chance: starterSpec.drop_chance,
      serial_number: 135,
      description: starterSpec.description,
      image_url: starterSpec.image_url || `/drop/items/${starterSpec.item_id}.svg`,
      model_3d_type: "procedural",
      model_color: starterSpec.model_color,
      obtained_via: "starter_drop",
      is_equipped: true,
      is_pinned: true,
      is_hidden: false,
      created_at: new Date().toISOString(),
    });

    await Promise.all([
      runOptionalTableQuery("cxrner_drop_inventory", () =>
        db.from("cxrner_drop_inventory").insert(toCoreInventoryRow(initialItem))
      ),
      writeCabinetVault(userId, (prev) => {
        if (prev.ecosystem_starter_granted && Array.isArray(prev.ecosystem_inventory)) {
          return prev;
        }
        return {
          ...prev,
          ecosystem_starter_granted: true,
          ecosystem_inventory: [initialItem],
        };
      }),
    ]);

    return [initialItem];
  }

  // Local fallback
  const store = loadLocalStore();
  const list = store.inventory[userId];
  if (list && list.length > 0) return list.map(enrichInventoryItem);

  const starterItem = DROP_SPECIMENS[0];
  const initialItem: DropInventoryItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    item_id: starterItem.item_id,
    item_name: starterItem.item_name,
    specimen_code: starterItem.specimen_code,
    specimen_class: starterItem.specimen_class,
    collection_name: starterItem.collection_name,
    rarity: starterItem.rarity,
    drop_chance: starterItem.drop_chance,
    serial_number: 135,
    description: starterItem.description,
    image_url: starterItem.image_url || `/drop/items/${starterItem.item_id}.svg`,
    model_3d_type: "procedural",
    model_color: starterItem.model_color,
    obtained_via: "starter_drop",
    is_equipped: true,
    is_pinned: true,
    is_hidden: false,
    created_at: new Date().toISOString(),
  };

  store.inventory[userId] = [initialItem];
  saveLocalStore(store);
  return [initialItem];
}

export async function openDropCase(
  userIdOrParams: string | { userId: string; caseId?: string }
): Promise<{
  ok: boolean;
  item: DropInventoryItem;
  duplicate: boolean;
  achievementsUnlocked: string[];
  isSpecialReward: boolean;
  claimCode?: string;
  historyEntry?: DropHistoryEntry;
  caseConfig: DropCaseConfig;
}> {
  const userId = typeof userIdOrParams === "string" ? userIdOrParams : userIdOrParams.userId;
  const targetCaseId =
    typeof userIdOrParams === "string"
      ? "case_001_archive"
      : userIdOrParams.caseId || "case_001_archive";

  const caseConfig = DROP_CASES.find((c) => c.id === targetCaseId) || DROP_CASES[0];

  // 1. Roll random rarity
  const roll = Math.random() * 100;
  const rates = caseConfig.drop_rates;

  let targetRarity: ItemRarity = "common";
  let isSpecialReward = false;

  const specialThreshold = rates.special_reward;
  const mythicThreshold = specialThreshold + rates.mythic;
  const legendaryThreshold = mythicThreshold + rates.legendary;
  const epicThreshold = legendaryThreshold + rates.epic;
  const rareThreshold = epicThreshold + rates.rare;

  if (roll < specialThreshold) {
    targetRarity = "special_reward";
    isSpecialReward = true;
  } else if (roll < mythicThreshold) {
    targetRarity = "mythic";
  } else if (roll < legendaryThreshold) {
    targetRarity = "legendary";
  } else if (roll < epicThreshold) {
    targetRarity = "epic";
  } else if (roll < rareThreshold) {
    targetRarity = "rare";
  } else {
    targetRarity = "common";
  }

  // 2. Pick specimen
  let picked: (typeof DROP_SPECIMENS)[number];
  if (isSpecialReward) {
    picked =
      DROP_SPECIMENS.find((s) => s.is_special_reward) || DROP_SPECIMENS[DROP_SPECIMENS.length - 1];
  } else {
    let candidates = DROP_SPECIMENS.filter(
      (s) => s.rarity === targetRarity && (!s.case_id || s.case_id === caseConfig.id)
    );
    if (candidates.length === 0) {
      candidates = DROP_SPECIMENS.filter((s) => s.rarity === targetRarity);
    }
    picked = candidates[Math.floor(Math.random() * candidates.length)] || DROP_SPECIMENS[0];
  }

  const currentInventory = await getUserInventory(userId);
  const duplicate = currentInventory.some((i) => i.item_id === picked.item_id);
  const pinnedCount = currentInventory.filter((i) => i.is_pinned).length;
  const serialNumber = Math.floor(100 + Math.random() * 8900);
  const nowIso = new Date().toISOString();

  let claimCode: string | undefined;
  let claimRecord: SpecialRewardClaim | undefined;
  if (isSpecialReward) {
    claimCode = `CV-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    claimRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      reward_id: picked.item_id,
      reward_name: picked.item_name,
      claim_code: claimCode,
      status: "WON",
      won_at: nowIso,
    };
  }

  const newItem: DropInventoryItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    item_id: picked.item_id,
    item_name: picked.item_name,
    specimen_code: picked.specimen_code,
    specimen_class: picked.specimen_class,
    collection_name: picked.collection_name,
    rarity: picked.rarity,
    drop_chance: picked.drop_chance,
    serial_number: serialNumber,
    description: picked.description,
    image_url: picked.image_url || `/drop/items/${picked.item_id}.svg`,
    model_3d_type: "procedural",
    model_color: picked.model_color,
    obtained_via: caseConfig.slug,
    is_equipped: false,
    is_pinned: pinnedCount < 6,
    is_hidden: false,
    ...(isSpecialReward ? { is_special_reward: true, claim_code: claimCode } : {}),
    created_at: nowIso,
  };

  const historyEntry: DropHistoryEntry = {
    id: crypto.randomUUID(),
    user_id: userId,
    case_id: caseConfig.id,
    case_name: caseConfig.name,
    item_id: picked.item_id,
    item_name: picked.item_name,
    rarity: picked.rarity,
    serial_number: serialNumber,
    cxp_spent: caseConfig.price_cxp,
    created_at: nowIso,
  };

  let totalInventoryList: DropInventoryItem[] = [];
  const db = await getDbForUser(userId);

  if (db) {
    // 1. Save atomically into cxrner_cabinet_users vault
    await writeCabinetVault(userId, (prev) => {
      const inv = Array.isArray(prev.ecosystem_inventory)
        ? [...(prev.ecosystem_inventory as DropInventoryItem[])]
        : [...currentInventory];
      inv.unshift(newItem);
      totalInventoryList = inv;

      const hist = Array.isArray(prev.ecosystem_drop_history)
        ? [...(prev.ecosystem_drop_history as DropHistoryEntry[])]
        : [];
      hist.unshift(historyEntry);

      const claims = Array.isArray(prev.ecosystem_special_claims)
        ? [...(prev.ecosystem_special_claims as SpecialRewardClaim[])]
        : [];
      if (claimRecord) claims.unshift(claimRecord);

      return {
        ...prev,
        ecosystem_starter_granted: true,
        ecosystem_inventory: inv,
        ecosystem_drop_history: hist.slice(0, 200),
        ecosystem_special_claims: claims,
      };
    });

    // 2. Best-effort parallel sync into relational tables if present
    await Promise.all([
      runOptionalTableQuery("cxrner_drop_inventory", () =>
        db.from("cxrner_drop_inventory").insert(toCoreInventoryRow(newItem))
      ),
      runOptionalTableQuery("cxrner_drop_history", () =>
        db.from("cxrner_drop_history").insert(historyEntry)
      ),
      claimRecord
        ? runOptionalTableQuery("special_reward_claims", () =>
            db.from("special_reward_claims").insert(claimRecord)
          )
        : Promise.resolve(null),
    ]);
  } else {
    const store = loadLocalStore();
    if (claimRecord) {
      if (!store.specialClaims) store.specialClaims = {};
      const claimsList = store.specialClaims[userId] || [];
      claimsList.unshift(claimRecord);
      store.specialClaims[userId] = claimsList;
    }

    const list = store.inventory[userId] || [];
    list.unshift(newItem);
    store.inventory[userId] = list;
    totalInventoryList = list;

    if (!store.dropHistory) store.dropHistory = {};
    const historyList = store.dropHistory[userId] || [];
    historyList.unshift(historyEntry);
    store.dropHistory[userId] = historyList;
    saveLocalStore(store);
  }

  // 3. Achievements
  const achievementsUnlocked: string[] = [];

  const res1 = await unlockAchievement({ userId, achievementKey: "FIRST_DROP" });
  if (!res1.alreadyUnlocked) achievementsUnlocked.push("FIRST_DROP");

  if (["epic", "legendary", "mythic", "special_reward"].includes(picked.rarity)) {
    const res2 = await unlockAchievement({ userId, achievementKey: "RARE_FIND" });
    if (!res2.alreadyUnlocked) achievementsUnlocked.push("RARE_FIND");
  }

  const uniqueCount = new Set(totalInventoryList.map((i) => i.item_id)).size;
  if (uniqueCount >= 5) {
    const res3 = await unlockAchievement({ userId, achievementKey: "SPECIMEN_COLLECTOR" });
    if (!res3.alreadyUnlocked) achievementsUnlocked.push("SPECIMEN_COLLECTOR");
  }

  if (
    ["specimen_chrome_spike_16", "specimen_void_crown_17", "specimen_chrome_chain_09"].includes(
      picked.item_id
    )
  ) {
    const res4 = await unlockAchievement({ userId, achievementKey: "CHROME_MASTER" });
    if (!res4.alreadyUnlocked) achievementsUnlocked.push("CHROME_MASTER");
  }

  await createNotification({
    userId,
    type: "drop_item",
    title: isSpecialReward
      ? "СПЕЦИАЛЬНАЯ НАГРАДА: CXRNER COVER VOUCHER!"
      : `Получен предмет: ${picked.item_name}!`,
    message: isSpecialReward
      ? `Поздравляем! Ты выиграл бесплатную обложку для релиза от @kazumaiq. Код: ${claimCode}`
      : `Редкость: ${picked.rarity.toUpperCase()} (#${serialNumber}). Добавлен в личный инвентарь.`,
    link: "/cabinet/drop/inventory",
  });

  return {
    ok: true,
    item: newItem,
    duplicate,
    achievementsUnlocked,
    isSpecialReward,
    claimCode,
    historyEntry,
    caseConfig,
  };
}

export async function getDropHistory(
  userId: string,
  rarityFilter?: string
): Promise<DropHistoryEntry[]> {
  const db = await getDbForUser(userId);
  if (db) {
    let query = db
      .from("cxrner_drop_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (rarityFilter && rarityFilter !== "all") {
      query = query.eq("rarity", rarityFilter);
    }

    const [{ data, error }, vault] = await Promise.all([query, readCabinetVault(userId, db)]);
    if (!error && Array.isArray(data) && data.length > 0) {
      return data as DropHistoryEntry[];
    }

    const hist = Array.isArray(vault?.ecosystem_drop_history)
      ? (vault.ecosystem_drop_history as DropHistoryEntry[])
      : [];
    if (!rarityFilter || rarityFilter === "all") return hist;
    return hist.filter((h) => h.rarity === rarityFilter);
  }

  const store = loadLocalStore();
  const list = (store.dropHistory && store.dropHistory[userId]) || [];
  if (!rarityFilter || rarityFilter === "all") return list;
  return list.filter((h) => h.rarity === rarityFilter);
}

export async function getSpecialRewardClaims(userId: string): Promise<SpecialRewardClaim[]> {
  const db = await getDbForUser(userId);
  if (db) {
    const [{ data, error }, vault] = await Promise.all([
      db
        .from("special_reward_claims")
        .select("*")
        .eq("user_id", userId)
        .order("won_at", { ascending: false }),
      readCabinetVault(userId, db),
    ]);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as SpecialRewardClaim[];
    }
    return Array.isArray(vault?.ecosystem_special_claims)
      ? (vault.ecosystem_special_claims as SpecialRewardClaim[])
      : [];
  }

  const store = loadLocalStore();
  return (store.specialClaims && store.specialClaims[userId]) || [];
}

export async function getAllSpecialRewardClaims(): Promise<SpecialRewardClaim[]> {
  const { client: db } = await getEcosystemDbClient();
  if (db) {
    const { data, error } = await db
      .from("special_reward_claims")
      .select("*")
      .order("won_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as SpecialRewardClaim[];
    }

    const users = await listAllCabinetUsers(500);
    const all: SpecialRewardClaim[] = [];
    for (const u of users) {
      if (Array.isArray(u.profile.ecosystem_special_claims)) {
        all.push(...(u.profile.ecosystem_special_claims as SpecialRewardClaim[]));
      }
    }
    return all.sort((a, b) => new Date(b.won_at).getTime() - new Date(a.won_at).getTime());
  }

  const store = loadLocalStore();
  const all: SpecialRewardClaim[] = [];
  if (store.specialClaims) {
    for (const list of Object.values(store.specialClaims)) {
      all.push(...list);
    }
  }
  return all.sort((a, b) => new Date(b.won_at).getTime() - new Date(a.won_at).getTime());
}

export async function updateSpecialClaimStatus(params: {
  claimId: string;
  status: "WON" | "PENDING_CLAIM" | "CLAIMED" | "REDEEMED" | "EXPIRED";
  notes?: string;
  adminId?: string;
}): Promise<boolean> {
  const { claimId, status, notes, adminId } = params;
  const nowIso = new Date().toISOString();

  const { client: db } = await getEcosystemDbClient();
  if (db) {
    const updates: Record<string, any> = {
      status,
      admin_notes: notes || null,
      admin_id: adminId || null,
    };
    if (status === "CLAIMED") updates.claimed_at = nowIso;
    if (status === "REDEEMED") updates.redeemed_at = nowIso;

    await db.from("special_reward_claims").update(updates).eq("id", claimId).then(() => undefined);

    const users = await listAllCabinetUsers(500);
    for (const u of users) {
      const claims = Array.isArray(u.profile.ecosystem_special_claims)
        ? (u.profile.ecosystem_special_claims as SpecialRewardClaim[])
        : [];
      if (claims.some((c) => c.id === claimId)) {
        await writeCabinetVault(u.user_id, (prev) => {
          const prevClaims = Array.isArray(prev.ecosystem_special_claims)
            ? (prev.ecosystem_special_claims as SpecialRewardClaim[])
            : [];
          return {
            ...prev,
            ecosystem_special_claims: prevClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    status,
                    ...(notes ? { admin_notes: notes } : {}),
                    ...(adminId ? { admin_id: adminId } : {}),
                    ...(status === "CLAIMED" ? { claimed_at: nowIso } : {}),
                    ...(status === "REDEEMED" ? { redeemed_at: nowIso } : {}),
                  }
                : c
            ),
          };
        });
        break;
      }
    }
    return true;
  }

  const store = loadLocalStore();
  if (store.specialClaims) {
    for (const list of Object.values(store.specialClaims)) {
      const found = list.find((c) => c.id === claimId);
      if (found) {
        found.status = status;
        if (notes) found.admin_notes = notes;
        if (adminId) found.admin_id = adminId;
        if (status === "CLAIMED") found.claimed_at = nowIso;
        if (status === "REDEEMED") found.redeemed_at = nowIso;
        saveLocalStore(store);
        return true;
      }
    }
  }
  return true;
}

export async function getDropAnalytics(): Promise<{
  totalOpened: number;
  totalCxpSpent: number;
  rarityBreakdown: Record<string, number>;
  specialRewardsWon: number;
}> {
  const rarityBreakdown: Record<string, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
    special_reward: 0,
  };
  let totalOpened = 0;
  let totalCxpSpent = 0;
  let specialRewardsWon = 0;

  const { client: db } = await getEcosystemDbClient();
  if (db) {
    const { data, error } = await db.from("cxrner_drop_history").select("rarity, cxp_spent");
    let entries: Array<{ rarity: string; cxp_spent?: number }> = [];

    if (!error && Array.isArray(data) && data.length > 0) {
      entries = data;
    } else {
      const users = await listAllCabinetUsers(500);
      for (const u of users) {
        if (Array.isArray(u.profile.ecosystem_drop_history)) {
          entries.push(...u.profile.ecosystem_drop_history);
        }
      }
    }

    for (const entry of entries) {
      totalOpened += 1;
      totalCxpSpent += entry.cxp_spent || 50;
      rarityBreakdown[entry.rarity] = (rarityBreakdown[entry.rarity] || 0) + 1;
      if (entry.rarity === "special_reward") specialRewardsWon += 1;
    }

    return { totalOpened, totalCxpSpent, rarityBreakdown, specialRewardsWon };
  }

  const store = loadLocalStore();
  if (store.dropHistory) {
    for (const list of Object.values(store.dropHistory)) {
      for (const entry of list) {
        totalOpened += 1;
        totalCxpSpent += entry.cxp_spent || 50;
        rarityBreakdown[entry.rarity] = (rarityBreakdown[entry.rarity] || 0) + 1;
        if (entry.rarity === "special_reward") specialRewardsWon += 1;
      }
    }
  }

  return { totalOpened, totalCxpSpent, rarityBreakdown, specialRewardsWon };
}

export async function updateItemDisplayStatus(params: {
  userId: string;
  itemId: string;
  isPinned?: boolean;
  isHidden?: boolean;
  isEquipped?: boolean;
}): Promise<{ ok: boolean }> {
  const { userId, itemId, isPinned, isHidden, isEquipped } = params;

  const db = await getDbForUser(userId);
  if (db) {
    const updateObj: Record<string, any> = {};
    if (isPinned !== undefined) updateObj.is_pinned = isPinned;
    if (isHidden !== undefined) updateObj.is_hidden = isHidden;
    if (isEquipped !== undefined) updateObj.is_equipped = isEquipped;

    await db
      .from("cxrner_drop_inventory")
      .update(updateObj)
      .eq("id", itemId)
      .eq("user_id", userId)
      .then(() => undefined);

    await writeCabinetVault(userId, (prev) => {
      const list = Array.isArray(prev.ecosystem_inventory)
        ? (prev.ecosystem_inventory as DropInventoryItem[]).map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                ...(isPinned !== undefined ? { is_pinned: isPinned } : {}),
                ...(isHidden !== undefined ? { is_hidden: isHidden } : {}),
                ...(isEquipped !== undefined ? { is_equipped: isEquipped } : {}),
              };
            }
            if (isEquipped === true) {
              return { ...item, is_equipped: false };
            }
            return item;
          })
        : [];
      return { ...prev, ecosystem_inventory: list };
    });

    return { ok: true };
  }

  const store = loadLocalStore();
  const list = store.inventory[userId] || [];
  const item = list.find((i) => i.id === itemId);
  if (item) {
    if (isPinned !== undefined) item.is_pinned = isPinned;
    if (isHidden !== undefined) item.is_hidden = isHidden;
    if (isEquipped !== undefined) item.is_equipped = isEquipped;
    saveLocalStore(store);
  }

  return { ok: true };
}

// =========================================================================
// 6. REFERRAL ENGINE (Attribution, Milestones, Anti-Fraud, Leaderboard)
// =========================================================================

export function generateReferralCode(username: string, userId?: string): string {
  const clean = sanitizeUsername(username || "cxrner").toUpperCase().slice(0, 4) || "CXRN";
  const hashSource = userId || `${clean}_${Date.now()}`;
  const hash = crypto.createHash("sha256").update(hashSource).digest("hex").slice(0, 6).toUpperCase();
  return `${clean}-${hash}`;
}

export function buildStableReferralCode(userId: string, username?: string | null): string {
  return generateReferralCode(username || "cxrner", userId);
}

function getUserIdHashSuffix(userId: string): string {
  return crypto.createHash("sha256").update(userId).digest("hex").slice(0, 6).toUpperCase();
}

export async function getReferralCodeForUser(userId: string): Promise<string> {
  const db = await getDbForUser(userId);
  if (db) {
    const vault = await readCabinetVault(userId, db);
    if (vault?.referral_code && typeof vault.referral_code === "string") {
      return vault.referral_code.toUpperCase();
    }

    const profile = await getProfileByUserId(userId);
    const stableCode = buildStableReferralCode(userId, profile?.username || vault?.username);

    await writeCabinetVault(userId, (prev) => ({
      ...prev,
      referral_code: prev.referral_code || stableCode,
    }));
    return stableCode;
  }

  const profile = await getProfileByUserId(userId);
  const store = loadLocalStore();
  const existing = Object.values(store.referrals)
    .flat()
    .find((r) => r.referrer_user_id === userId);
  if (existing?.referral_code) return existing.referral_code;

  return buildStableReferralCode(userId, profile?.username || "artist");
}

function toDbReferralRow(attr: ReferralAttribution) {
  return {
    id: attr.id,
    referrer_user_id: attr.referrer_user_id,
    referred_user_id: attr.referred_user_id,
    referral_code: attr.referral_code,
    status: attr.status,
    ip_hash: attr.ip_hash || null,
    is_qualified: Boolean(attr.is_qualified),
    qualified_at: attr.qualified_at || null,
    fraud_reason: attr.fraud_reason || null,
    created_at: attr.created_at,
    updated_at: attr.updated_at,
  };
}

export async function recordReferralAttribution(params: {
  referrerCode: string;
  newUserId: string;
  ipHash?: string;
  emailVerified?: boolean;
}): Promise<{ ok: boolean; attribution?: ReferralAttribution; error?: string }> {
  const { referrerCode, newUserId, ipHash, emailVerified } = params;
  const targetCodeClean = referrerCode.trim().toUpperCase();
  if (!targetCodeClean) {
    return { ok: false, error: "REFERRER_NOT_FOUND" };
  }

  const { client: db } = await getEcosystemDbClient();

  if (db && isValidUuid(newUserId)) {
    // 1. Find referrer across cxrner_profiles and cxrner_cabinet_users
    let referrerId: string | null = null;
    const allUsers = await listAllCabinetUsers(500);
    const targetSuffix = targetCodeClean.includes("-")
      ? targetCodeClean.split("-").pop() || ""
      : "";

    for (const u of allUsers) {
      const p = u.profile;
      const cid = p.cxrner_id as CxrnerProfile | undefined;
      const uname = sanitizeUsername(cid?.username || p.username || "");
      const savedCode = typeof p.referral_code === "string" ? p.referral_code.toUpperCase() : "";
      const stableCode = buildStableReferralCode(u.user_id, uname).toUpperCase();
      const uidSuffix = getUserIdHashSuffix(u.user_id);

      if (
        (savedCode && savedCode === targetCodeClean) ||
        stableCode === targetCodeClean ||
        (targetSuffix.length === 6 && targetSuffix === uidSuffix) ||
        (uname && uname.toUpperCase() === targetCodeClean)
      ) {
        referrerId = u.user_id;
        break;
      }
    }

    if (!referrerId) {
      const prefix = sanitizeUsername(targetCodeClean.split("-")[0] || targetCodeClean);
      if (prefix) {
        const { data: profMatches } = await db
          .from("cxrner_profiles")
          .select("id, username")
          .ilike("username", prefix);
        if (Array.isArray(profMatches) && profMatches.length > 0) {
          const exact = profMatches.find(
            (m) =>
              m.username?.toUpperCase() === targetCodeClean ||
              buildStableReferralCode(m.id, m.username) === targetCodeClean ||
              (targetSuffix.length === 6 && targetSuffix === getUserIdHashSuffix(m.id))
          );
          referrerId = (exact || profMatches[0]).id;
        }
      }
    }

    if (!referrerId) {
      return { ok: false, error: "REFERRER_NOT_FOUND" };
    }

    // Anti-fraud 1: Self-referral prohibition
    if (referrerId === newUserId) {
      return { ok: false, error: "SELF_REFERRAL_FORBIDDEN" };
    }

    // Anti-fraud 2: Already referred check (DB table + referee vault + referrer vault)
    const [{ data: existingDbRef }, newUserVault, referrerVault] = await Promise.all([
      db.from("cxrner_referrals").select("id").eq("referred_user_id", newUserId).maybeSingle(),
      readCabinetVault(newUserId, db),
      readCabinetVault(referrerId, db),
    ]);

    const referrerList = Array.isArray(referrerVault?.ecosystem_referrals)
      ? (referrerVault.ecosystem_referrals as ReferralAttribution[])
      : [];

    if (
      existingDbRef ||
      newUserVault?.referred_by ||
      referrerList.some((r) => r.referred_user_id === newUserId)
    ) {
      return { ok: false, error: "ALREADY_REFERRED" };
    }

    // Anti-fraud 3: Monthly qualified cap check (max 10 qualified/month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const qualifiedThisMonth = referrerList.filter(
      (r) => r.created_at.startsWith(currentMonth) && r.is_qualified
    ).length;
    if (qualifiedThisMonth >= 10) {
      return { ok: false, error: "MONTHLY_REFERRAL_LIMIT_REACHED" };
    }

    const nowIso = new Date().toISOString();
    const refereeProfile = await getProfileByUserId(newUserId);

    const attribution: ReferralAttribution = {
      id: crypto.randomUUID(),
      referrer_user_id: referrerId,
      referred_user_id: newUserId,
      referral_code: targetCodeClean,
      status: "registered",
      ip_hash: ipHash || null,
      is_qualified: false,
      milestones: [],
      referred_username: refereeProfile?.username || newUserVault?.username || undefined,
      referred_display_name:
        refereeProfile?.display_name || newUserVault?.artist_name || undefined,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Persist to relational table (best-effort) AND both user vaults
    await db
      .from("cxrner_referrals")
      .insert(toDbReferralRow(attribution))
      .then(() => undefined);

    await writeCabinetVault(newUserId, (prev) => ({
      ...prev,
      referred_by: attribution,
    }));

    await writeCabinetVault(referrerId, (prev) => {
      const prevList = Array.isArray(prev.ecosystem_referrals)
        ? (prev.ecosystem_referrals as ReferralAttribution[]).filter(
            (r) => r.referred_user_id !== newUserId
          )
        : [];
      return {
        ...prev,
        ecosystem_referrals: [attribution, ...prevList],
      };
    });

    if (emailVerified) {
      await evaluateReferralMilestones(newUserId);
    }

    return { ok: true, attribution };
  }

  // Local fallback (CLI test scripts)
  const store = loadLocalStore();
  let referrerId: string | null = null;
  const allProfiles = Object.values(store.profiles);

  for (const p of allProfiles) {
    if (
      buildStableReferralCode(p.id, p.username).toUpperCase() === targetCodeClean ||
      p.username.toUpperCase() === targetCodeClean
    ) {
      referrerId = p.id;
      break;
    }
  }

  if (!referrerId) {
    return { ok: false, error: "REFERRER_NOT_FOUND" };
  }

  if (referrerId === newUserId) {
    return { ok: false, error: "SELF_REFERRAL_FORBIDDEN" };
  }

  const allRefs = Object.values(store.referrals).flat();
  if (allRefs.some((r) => r.referred_user_id === newUserId)) {
    return { ok: false, error: "ALREADY_REFERRED" };
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const referrerRefsThisMonth = allRefs.filter(
    (r) =>
      r.referrer_user_id === referrerId &&
      r.created_at.startsWith(currentMonth) &&
      r.is_qualified
  );
  if (referrerRefsThisMonth.length >= 10) {
    return { ok: false, error: "MONTHLY_REFERRAL_LIMIT_REACHED" };
  }

  const attribution: ReferralAttribution = {
    id: crypto.randomUUID(),
    referrer_user_id: referrerId,
    referred_user_id: newUserId,
    referral_code: targetCodeClean,
    status: "registered",
    ip_hash: ipHash || null,
    is_qualified: false,
    milestones: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = store.referrals[referrerId] || [];
  list.push(attribution);
  store.referrals[referrerId] = list;
  saveLocalStore(store);

  return { ok: true, attribution };
}

async function findReferralForReferee(
  refereeUserId: string
): Promise<{ attribution: ReferralAttribution; referrerId: string } | null> {
  const { client: db } = await getEcosystemDbClient();
  if (db && isValidUuid(refereeUserId)) {
    const [{ data: dbRef, error }, refereeVault] = await Promise.all([
      db.from("cxrner_referrals").select("*").eq("referred_user_id", refereeUserId).maybeSingle(),
      readCabinetVault(refereeUserId, db),
    ]);

    if (!error && dbRef) {
      const mergedAttr: ReferralAttribution = {
        ...((refereeVault?.referred_by as ReferralAttribution | undefined) || {}),
        ...(dbRef as ReferralAttribution),
      };
      return { attribution: mergedAttr, referrerId: mergedAttr.referrer_user_id };
    }

    if (refereeVault?.referred_by) {
      const attr = refereeVault.referred_by as ReferralAttribution;
      return { attribution: attr, referrerId: attr.referrer_user_id };
    }

    const users = await listAllCabinetUsers(500);
    for (const u of users) {
      const list = Array.isArray(u.profile.ecosystem_referrals)
        ? (u.profile.ecosystem_referrals as ReferralAttribution[])
        : [];
      const found = list.find((a) => a.referred_user_id === refereeUserId);
      if (found) return { attribution: found, referrerId: u.user_id };
    }
    return null;
  }

  const store = loadLocalStore();
  for (const [rId, list] of Object.entries(store.referrals)) {
    const item = list.find((a) => a.referred_user_id === refereeUserId);
    if (item) return { attribution: item, referrerId: rId };
  }
  return null;
}

async function persistUpdatedReferralAttribution(
  attribution: ReferralAttribution
): Promise<void> {
  const { client: db } = await getEcosystemDbClient();
  if (db && isValidUuid(attribution.referrer_user_id) && isValidUuid(attribution.referred_user_id)) {
    await db
      .from("cxrner_referrals")
      .update({
        status: attribution.status,
        is_qualified: attribution.is_qualified,
        qualified_at: attribution.qualified_at || null,
        updated_at: attribution.updated_at,
      })
      .eq("id", attribution.id)
      .then(() => undefined);

    await writeCabinetVault(attribution.referred_user_id, (prev) => ({
      ...prev,
      referred_by: attribution,
    }));

    await writeCabinetVault(attribution.referrer_user_id, (prev) => {
      const list = Array.isArray(prev.ecosystem_referrals)
        ? (prev.ecosystem_referrals as ReferralAttribution[])
        : [];
      const idx = list.findIndex((r) => r.referred_user_id === attribution.referred_user_id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...attribution };
      } else {
        list.unshift(attribution);
      }
      return { ...prev, ecosystem_referrals: list };
    });
    return;
  }

  const store = loadLocalStore();
  const list = store.referrals[attribution.referrer_user_id] || [];
  const idx = list.findIndex((r) => r.referred_user_id === attribution.referred_user_id);
  if (idx >= 0) {
    list[idx] = attribution;
    saveLocalStore(store);
  }
}

export async function evaluateReferralMilestones(
  refereeUserId: string,
  opts?: { telegramLinked?: boolean; emailVerified?: boolean }
): Promise<void> {
  const found = await findReferralForReferee(refereeUserId);
  if (!found) return;

  const { attribution, referrerId } = found;
  const profile = await getProfileByUserId(refereeUserId);
  if (!profile) return;

  const milestones = new Set(attribution.milestones || []);
  let nextStatus: ReferralAttribution["status"] = attribution.status;

  // Milestone 1: Email verified (+25 CXP to referrer)
  if (opts?.emailVerified !== false) {
    const g1 = await awardReferralReward({
      referralId: attribution.id,
      referrerUserId: referrerId,
      refereeUserId,
      eventType: "email_verified",
      referrerCxp: 25,
      refereeCxp: 0,
    });
    milestones.add("email_verified");
    if (nextStatus === "registered" || g1) {
      if (nextStatus === "registered") nextStatus = "email_verified";
    }
  }

  const hasTelegram = Boolean(
    profile.telegram_linked || profile.telegram_id || opts?.telegramLinked
  );

  // Milestone 2: Profile 80% + TG (+50 CXP to referrer, +50 CXP to referee)
  if (profile.completion_percentage >= 80 && hasTelegram) {
    await awardReferralReward({
      referralId: attribution.id,
      referrerUserId: referrerId,
      refereeUserId,
      eventType: "profile_80_tg",
      referrerCxp: 50,
      refereeCxp: 50,
    });
    milestones.add("profile_80_tg");
    if (!attribution.is_qualified && nextStatus !== "artist_verified") {
      nextStatus = "profile_completed";
    }
  }

  // Milestone 3: Artist Verified (+50 CXP to referrer, +100 CXP to referee)
  if (profile.is_artist_verified) {
    await awardReferralReward({
      referralId: attribution.id,
      referrerUserId: referrerId,
      refereeUserId,
      eventType: "artist_verified",
      referrerCxp: 50,
      refereeCxp: 100,
    });
    milestones.add("artist_verified");
    if (!attribution.is_qualified) {
      nextStatus = "artist_verified";
    }
  }

  const isQualifiedNow = Boolean(
    profile.completion_percentage >= 80 && hasTelegram && profile.is_artist_verified
  );

  const updatedAttr: ReferralAttribution = {
    ...attribution,
    referred_username: profile.username,
    referred_display_name: profile.display_name,
    milestones: Array.from(milestones),
    status: isQualifiedNow ? "qualified" : nextStatus,
    is_qualified: isQualifiedNow || attribution.is_qualified,
    qualified_at:
      isQualifiedNow && !attribution.qualified_at
        ? new Date().toISOString()
        : attribution.qualified_at || null,
    updated_at: new Date().toISOString(),
  };

  await persistUpdatedReferralAttribution(updatedAttr);

  if (updatedAttr.is_qualified) {
    const stats = await getReferralStatsForUser(referrerId);
    if (stats.qualifiedCount >= 5) {
      await unlockAchievement({
        userId: referrerId,
        achievementKey: "NETWORK_BUILDER",
      });
    }
  }
}

export async function evaluateReferralReleaseMilestone(refereeUserId: string): Promise<void> {
  const found = await findReferralForReferee(refereeUserId);
  if (!found) return;

  const { attribution, referrerId } = found;

  // Milestone: First release approved (+150 CXP to referrer, once)
  await awardReferralReward({
    referralId: attribution.id,
    referrerUserId: referrerId,
    refereeUserId,
    eventType: "first_release",
    referrerCxp: 150,
    refereeCxp: 0,
  });

  const milestones = new Set(attribution.milestones || []);
  milestones.add("first_release");

  const updatedAttr: ReferralAttribution = {
    ...attribution,
    milestones: Array.from(milestones),
    status: attribution.is_qualified ? "qualified" : "release_approved",
    updated_at: new Date().toISOString(),
  };

  await persistUpdatedReferralAttribution(updatedAttr);
}

async function awardReferralReward(params: {
  referralId: string;
  referrerUserId: string;
  refereeUserId: string;
  eventType: "email_verified" | "profile_80_tg" | "first_release" | "artist_verified";
  referrerCxp: number;
  refereeCxp: number;
}): Promise<boolean> {
  const { referralId, referrerUserId, refereeUserId, eventType, referrerCxp, refereeCxp } =
    params;
  const nowIso = new Date().toISOString();

  const { client: db } = await getEcosystemDbClient();
  if (db && isValidUuid(referrerUserId) && isValidUuid(refereeUserId)) {
    // Check duplicate in table OR referrer vault
    const [{ data: existingDbRew }, referrerVault] = await Promise.all([
      db
        .from("cxrner_referral_rewards")
        .select("id")
        .eq("referral_id", referralId)
        .eq("event_type", eventType)
        .limit(1),
      readCabinetVault(referrerUserId, db),
    ]);

    const prevVaultRewards = Array.isArray(referrerVault?.ecosystem_referral_rewards)
      ? (referrerVault.ecosystem_referral_rewards as ReferralReward[])
      : [];

    if (
      (Array.isArray(existingDbRew) && existingDbRew.length > 0) ||
      prevVaultRewards.some((r) => r.referral_id === referralId && r.event_type === eventType)
    ) {
      return false;
    }

    const newRewards: ReferralReward[] = [];

    if (referrerCxp > 0) {
      const r1: ReferralReward = {
        id: crypto.randomUUID(),
        referral_id: referralId,
        user_id: referrerUserId,
        role: "referrer",
        event_type: eventType,
        cxp_amount: referrerCxp,
        status: "granted",
        created_at: nowIso,
      };
      newRewards.push(r1);
      await awardCxp({
        userId: referrerUserId,
        amount: referrerCxp,
        reason: `Реферальная награда (${eventType}) за приглашённого артиста`,
        sourceEventType: `ref_${eventType}`,
        sourceEventId: referralId,
      });
      await createNotification({
        userId: referrerUserId,
        type: "referral_reward",
        title: `Реферальная награда: +${referrerCxp} CXP`,
        message: `Ваш приглашённый артист выполнил этап «${eventType}». Награда начислена.`,
        link: "/cabinet/referrals",
      });
    }

    if (refereeCxp > 0) {
      const r2: ReferralReward = {
        id: crypto.randomUUID(),
        referral_id: referralId,
        user_id: refereeUserId,
        role: "referee",
        event_type: eventType,
        cxp_amount: refereeCxp,
        status: "granted",
        created_at: nowIso,
      };
      newRewards.push(r2);
      await awardCxp({
        userId: refereeUserId,
        amount: refereeCxp,
        reason: `Приветственный реферальный бонус (${eventType})`,
        sourceEventType: `ref_welcome_${eventType}`,
        sourceEventId: referralId,
      });
      await createNotification({
        userId: refereeUserId,
        type: "referral_reward",
        title: `Реферальный бонус: +${refereeCxp} CXP!`,
        message: `Вы получили бонус за выполнение этапа «${eventType}» по пригласительной программе.`,
        link: "/cabinet/referrals",
      });
    }

    if (newRewards.length > 0) {
      await db.from("cxrner_referral_rewards").insert(newRewards).then(() => undefined);
      await writeCabinetVault(referrerUserId, (prev) => {
        const currentRewards = Array.isArray(prev.ecosystem_referral_rewards)
          ? (prev.ecosystem_referral_rewards as ReferralReward[])
          : [];
        return {
          ...prev,
          ecosystem_referral_rewards: [...newRewards, ...currentRewards],
        };
      });
    }
    return true;
  }

  // Local fallback (CLI test scripts)
  const store = loadLocalStore();
  const rewards = store.referralRewards[referralId] || [];

  if (rewards.some((r) => r.event_type === eventType)) {
    return false;
  }

  if (referrerCxp > 0) {
    rewards.push({
      id: crypto.randomUUID(),
      referral_id: referralId,
      user_id: referrerUserId,
      role: "referrer",
      event_type: eventType,
      cxp_amount: referrerCxp,
      status: "granted",
      created_at: nowIso,
    });
    await awardCxp({
      userId: referrerUserId,
      amount: referrerCxp,
      reason: `Реферальная награда (${eventType}) за приглашённого артиста`,
      sourceEventType: `ref_${eventType}`,
      sourceEventId: referralId,
    });
    await createNotification({
      userId: referrerUserId,
      type: "referral_reward",
      title: `Реферальная награда: +${referrerCxp} CXP`,
      message: `Ваш приглашённый артист выполнил этап «${eventType}». Награда начислена.`,
      link: "/cabinet/referrals",
    });
  }

  if (refereeCxp > 0) {
    rewards.push({
      id: crypto.randomUUID(),
      referral_id: referralId,
      user_id: refereeUserId,
      role: "referee",
      event_type: eventType,
      cxp_amount: refereeCxp,
      status: "granted",
      created_at: nowIso,
    });
    await awardCxp({
      userId: refereeUserId,
      amount: refereeCxp,
      reason: `Приветственный реферальный бонус (${eventType})`,
      sourceEventType: `ref_welcome_${eventType}`,
      sourceEventId: referralId,
    });
    await createNotification({
      userId: refereeUserId,
      type: "referral_reward",
      title: `Реферальный бонус: +${refereeCxp} CXP!`,
      message: `Вы получили бонус за выполнение этапа «${eventType}» по пригласительной программе.`,
      link: "/cabinet/referrals",
    });
  }

  store.referralRewards[referralId] = rewards;
  saveLocalStore(store);
  return true;
}

export async function getReferralStatsForUser(userId: string): Promise<{
  myCode: string;
  shareUrl: string;
  totalInvited: number;
  registeredCount: number;
  emailVerifiedCount: number;
  profileCompletedCount: number;
  telegramLinkedCount: number;
  verifiedArtistCount: number;
  releaseApprovedCount: number;
  qualifiedCount: number;
  totalEarnedCxp: number;
  referralsList: ReferralAttribution[];
  referredByCode?: string | null;
}> {
  const myCode = await getReferralCodeForUser(userId);
  const shareUrl = `https://cxrnermusic.vercel.app/join?ref=${myCode}`;

  const db = await getDbForUser(userId);
  if (db) {
    const [{ data: dbRefs }, { data: dbRewards }, vault, allUsers] = await Promise.all([
      db.from("cxrner_referrals").select("*").eq("referrer_user_id", userId),
      db
        .from("cxrner_referral_rewards")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "granted"),
      readCabinetVault(userId, db),
      listAllCabinetUsers(500),
    ]);

    const refByRefereeMap = new Map<string, ReferralAttribution>();
    const addAttr = (attr: ReferralAttribution) => {
      if (!attr?.referred_user_id) return;
      const prev = refByRefereeMap.get(attr.referred_user_id);
      if (!prev) {
        refByRefereeMap.set(attr.referred_user_id, attr);
      } else {
        const mergedMilestones = Array.from(
          new Set([...(prev.milestones || []), ...(attr.milestones || [])])
        );
        refByRefereeMap.set(attr.referred_user_id, {
          ...prev,
          ...attr,
          is_qualified: prev.is_qualified || attr.is_qualified,
          milestones: mergedMilestones,
        });
      }
    };

    if (Array.isArray(vault?.ecosystem_referrals)) {
      (vault.ecosystem_referrals as ReferralAttribution[]).forEach(addAttr);
    }
    if (Array.isArray(dbRefs)) {
      (dbRefs as ReferralAttribution[]).forEach(addAttr);
    }

    // Also recover any attributions stored on referees where referrerId matches
    const userMap = new Map(allUsers.map((u) => [u.user_id, u]));
    for (const u of allUsers) {
      const rb = u.profile.referred_by as ReferralAttribution | undefined;
      if (rb && rb.referrer_user_id === userId) {
        addAttr({
          ...rb,
          referred_username: rb.referred_username || u.profile.username,
          referred_display_name: rb.referred_display_name || u.profile.artist_name,
        });
      }
    }

    const list = Array.from(refByRefereeMap.values())
      .map((attr) => {
        const refUser = userMap.get(attr.referred_user_id);
        if (!refUser) return attr;
        const cid = refUser.profile.cxrner_id as CxrnerProfile | undefined;
        return {
          ...attr,
          referred_username: attr.referred_username || cid?.username || refUser.profile.username,
          referred_display_name:
            attr.referred_display_name || cid?.display_name || refUser.profile.artist_name,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Sum referral rewards deduplicated by referral_id + event_type
    const seenRewards = new Map<string, number>();
    const vaultRewards = Array.isArray(vault?.ecosystem_referral_rewards)
      ? (vault.ecosystem_referral_rewards as ReferralReward[])
      : [];
    for (const rew of [...vaultRewards, ...((dbRewards as ReferralReward[]) || [])]) {
      if (rew.user_id === userId && rew.status === "granted") {
        seenRewards.set(`${rew.referral_id}:${rew.event_type}`, rew.cxp_amount || 0);
      }
    }

    // Also fallback to wallet transactions tagged with ref_*
    const vaultTxs = Array.isArray(vault?.ecosystem_transactions)
      ? (vault.ecosystem_transactions as CxpTransaction[])
      : [];
    for (const tx of vaultTxs) {
      if (tx.source_event_type?.startsWith("ref_") && !tx.source_event_type.startsWith("ref_welcome_") && tx.amount > 0) {
        const key = `${tx.source_event_id}:${tx.source_event_type.replace(/^ref_/, "")}`;
        if (!seenRewards.has(key)) {
          seenRewards.set(key, tx.amount);
        }
      }
    }

    let totalEarned = 0;
    seenRewards.forEach((v) => {
      totalEarned += v;
    });

    const hasMilestone = (r: ReferralAttribution, key: string, statuses: string[]) =>
      Boolean(r.milestones?.includes(key) || statuses.includes(r.status) || r.is_qualified);

    return {
      myCode,
      shareUrl,
      totalInvited: list.length,
      registeredCount: list.length,
      emailVerifiedCount: list.filter((r) =>
        hasMilestone(r, "email_verified", [
          "email_verified",
          "profile_completed",
          "release_approved",
          "artist_verified",
          "qualified",
        ])
      ).length,
      profileCompletedCount: list.filter((r) =>
        hasMilestone(r, "profile_80_tg", [
          "profile_completed",
          "release_approved",
          "artist_verified",
          "qualified",
        ])
      ).length,
      telegramLinkedCount: list.filter((r) =>
        hasMilestone(r, "profile_80_tg", ["profile_completed", "qualified"])
      ).length,
      verifiedArtistCount: list.filter((r) =>
        hasMilestone(r, "artist_verified", ["artist_verified", "qualified"])
      ).length,
      releaseApprovedCount: list.filter((r) =>
        hasMilestone(r, "first_release", ["release_approved", "qualified"])
      ).length,
      qualifiedCount: list.filter((r) => r.is_qualified).length,
      totalEarnedCxp: totalEarned,
      referralsList: list,
      referredByCode: (vault?.referred_by as ReferralAttribution | undefined)?.referral_code || null,
    };
  }

  // Local fallback
  const store = loadLocalStore();
  const list = (store.referrals[userId] || []).map((attr) => {
    const prof = store.profiles[attr.referred_user_id];
    return {
      ...attr,
      referred_username: attr.referred_username || prof?.username,
      referred_display_name: attr.referred_display_name || prof?.display_name,
    };
  });

  let referredByCode: string | null = null;
  for (const arr of Object.values(store.referrals)) {
    const match = arr.find((r) => r.referred_user_id === userId);
    if (match) {
      referredByCode = match.referral_code;
      break;
    }
  }

  let totalEarned = 0;
  for (const ref of list) {
    const rewards = store.referralRewards[ref.id] || [];
    for (const rew of rewards) {
      if (rew.user_id === userId && rew.status === "granted") {
        totalEarned += rew.cxp_amount;
      }
    }
  }

  return {
    myCode,
    shareUrl,
    totalInvited: list.length,
    registeredCount: list.length,
    emailVerifiedCount: list.length,
    profileCompletedCount: list.filter((r) =>
      ["profile_completed", "release_approved", "artist_verified", "qualified"].includes(r.status)
    ).length,
    telegramLinkedCount: list.filter((r) => r.is_qualified).length,
    verifiedArtistCount: list.filter((r) => r.status === "artist_verified" || r.is_qualified).length,
    releaseApprovedCount: list.filter((r) => r.status === "release_approved" || r.is_qualified).length,
    qualifiedCount: list.filter((r) => r.is_qualified).length,
    totalEarnedCxp: totalEarned,
    referralsList: list,
    referredByCode,
  };
}

export async function getReferralLeaderboard(): Promise<
  Array<{
    rank: number;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    qualifiedArtistsCount: number;
    badge: string;
  }>
> {
  const { client: db } = await getEcosystemDbClient();
  if (db) {
    const [{ data: dbRefs }, allUsers] = await Promise.all([
      db.from("cxrner_referrals").select("referrer_user_id, is_qualified"),
      listAllCabinetUsers(500),
    ]);

    const qualifiedByReferrer = new Map<string, number>();

    for (const u of allUsers) {
      const refs = Array.isArray(u.profile.ecosystem_referrals)
        ? (u.profile.ecosystem_referrals as ReferralAttribution[])
        : [];
      const qCount = refs.filter((r) => r.is_qualified).length;
      if (qCount > 0) {
        qualifiedByReferrer.set(u.user_id, qCount);
      }
    }

    if (Array.isArray(dbRefs)) {
      const tableCounts = new Map<string, number>();
      for (const r of dbRefs) {
        if (r.is_qualified) {
          tableCounts.set(r.referrer_user_id, (tableCounts.get(r.referrer_user_id) || 0) + 1);
        }
      }
      tableCounts.forEach((cnt, uid) => {
        qualifiedByReferrer.set(uid, Math.max(qualifiedByReferrer.get(uid) || 0, cnt));
      });
    }

    const userMap = new Map(allUsers.map((u) => [u.user_id, u]));
    const sorted = Array.from(qualifiedByReferrer.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    const result = [];
    let rank = 1;
    for (const [uId, count] of sorted) {
      const u = userMap.get(uId);
      const cid = u?.profile?.cxrner_id as CxrnerProfile | undefined;
      if (cid && cid.privacy_settings?.show_in_leaderboard === false) continue;

      const username = cid?.username || u?.profile?.username || `user_${uId.slice(0, 6)}`;
      const displayName =
        cid?.display_name || u?.profile?.artist_name || u?.profile?.display_name || "CXRNER Artist";
      const avatarUrl = cid?.avatar_url || u?.profile?.avatar_url || null;

      let badge = "RECRUITER";
      if (count >= 10) badge = "SCOUT MASTER";
      if (count >= 25) badge = "LABEL AMBASSADOR";

      result.push({
        rank: rank++,
        userId: uId,
        username,
        displayName,
        avatarUrl,
        qualifiedArtistsCount: count,
        badge,
      });
    }

    return result;
  }

  const store = loadLocalStore();
  const leaderboardMap: Record<string, number> = {};

  for (const [referrerId, list] of Object.entries(store.referrals)) {
    leaderboardMap[referrerId] = list.filter((r) => r.is_qualified).length;
  }

  const sorted = Object.entries(leaderboardMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  const result = [];
  let rank = 1;
  for (const [uId, count] of sorted) {
    const p = store.profiles[uId];
    if (p && p.privacy_settings.show_in_leaderboard !== false) {
      let badge = "RECRUITER";
      if (count >= 10) badge = "SCOUT MASTER";
      if (count >= 25) badge = "LABEL AMBASSADOR";

      result.push({
        rank: rank++,
        userId: uId,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        qualifiedArtistsCount: count,
        badge,
      });
    }
  }

  return result;
}

export async function getAdminReferralOverview() {
  const { client: db } = await getEcosystemDbClient();
  const referralsById = new Map<string, ReferralAttribution>();
  let totalCxpAwarded = 0;

  if (db) {
    const [{ data: refData }, { data: rewData }, allUsers] = await Promise.all([
      db.from("cxrner_referrals").select("*"),
      db.from("cxrner_referral_rewards").select("*"),
      listAllCabinetUsers(500),
    ]);

    for (const u of allUsers) {
      const refs = Array.isArray(u.profile.ecosystem_referrals)
        ? (u.profile.ecosystem_referrals as ReferralAttribution[])
        : [];
      for (const r of refs) {
        referralsById.set(r.id, r);
      }
      if (u.profile.referred_by) {
        const rb = u.profile.referred_by as ReferralAttribution;
        if (!referralsById.has(rb.id)) {
          referralsById.set(rb.id, rb);
        }
      }
      const rews = Array.isArray(u.profile.ecosystem_referral_rewards)
        ? (u.profile.ecosystem_referral_rewards as ReferralReward[])
        : [];
      for (const rw of rews) {
        if (rw.status === "granted") totalCxpAwarded += rw.cxp_amount || 0;
      }
    }

    if (Array.isArray(refData)) {
      for (const r of refData as ReferralAttribution[]) {
        referralsById.set(r.id, r);
      }
    }
    if (Array.isArray(rewData) && totalCxpAwarded === 0) {
      for (const r of rewData as ReferralReward[]) {
        if (r.status === "granted") totalCxpAwarded += r.cxp_amount || 0;
      }
    }
  }

  const referrals = Array.from(referralsById.values());
  const totalRegistrations = referrals.length;
  const qualifiedCount = referrals.filter((r) => r.is_qualified).length;
  const fraudCount = referrals.filter((r) => r.status === "flagged_fraud").length;

  return {
    stats: {
      totalRegistrations,
      qualifiedCount,
      fraudCount,
      totalCxpAwarded,
      conversionRate:
        totalRegistrations > 0 ? Math.round((qualifiedCount / totalRegistrations) * 100) : 0,
    },
    leaderboard: await getReferralLeaderboard(),
    fraudQueue: referrals.filter((r) => r.status === "flagged_fraud" || r.fraud_reason),
  };
}

// =========================================================================
// 7. ADMIN AUDIT LOGS & RELEASE LINK HELPERS
// =========================================================================

export async function recordAdminAudit(params: {
  adminEmail: string;
  action: string;
  targetUserId?: string;
  details: Record<string, any>;
}): Promise<void> {
  const { adminEmail, action, targetUserId, details } = params;
  const { client: db } = await getEcosystemDbClient();

  if (db) {
    await db
      .from("cxrner_admin_audit_log")
      .insert({
        admin_email: adminEmail,
        action,
        target_user_id: targetUserId || null,
        details,
      })
      .then(() => undefined);
    return;
  }

  const store = loadLocalStore();
  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_email: adminEmail,
    action,
    target_user_id: targetUserId || null,
    details,
    created_at: new Date().toISOString(),
  });
  saveLocalStore(store);
}

/** Resolve cabinet Supabase userId given either UUID or Telegram ID */
export async function resolveUserIdByTelegramOrUuid(
  idOrTelegramId: string | null | undefined
): Promise<string | null> {
  if (!idOrTelegramId) return null;
  const raw = String(idOrTelegramId).trim();
  if (isValidUuid(raw)) return raw;

  const users = await listAllCabinetUsers(500);
  const found = users.find((u) => String(u.profile.telegram_id || "") === raw);
  return found?.user_id || null;
}

export async function adminToggleUserBan(
  targetUserId: string,
  isBanned: boolean,
  banReason?: string
): Promise<void> {
  const db = await getDbForUser(targetUserId);
  if (!db) return;

  await db
    .from("cxrner_profiles")
    .update({ is_banned: Boolean(isBanned), ban_reason: banReason || null })
    .eq("id", targetUserId)
    .then(() => undefined);

  await writeCabinetVault(targetUserId, (prev) => {
    const cid = prev.cxrner_id as CxrnerProfile | undefined;
    if (!cid) return { ...prev, is_banned: Boolean(isBanned), ban_reason: banReason || null };
    return {
      ...prev,
      cxrner_id: {
        ...cid,
        is_banned: Boolean(isBanned),
        ban_reason: banReason || null,
        updated_at: new Date().toISOString(),
      },
    };
  });
}

export async function adminSetUserVerification(
  targetUserId: string,
  verificationStatus: VerificationStatus
): Promise<void> {
  const decision: "verified" | "rejected" | "needs_info" | "not_verified" =
    verificationStatus === "verified"
      ? "verified"
      : verificationStatus === "rejected"
      ? "rejected"
      : verificationStatus === "needs_info"
      ? "needs_info"
      : "not_verified";

  await processVerificationReview({
    verificationId: `admin_${targetUserId}`,
    targetUserId,
    decision,
    reviewerEmail: "cxrner.label@gmail.com",
    notes:
      decision === "verified"
        ? "Подтверждено администратором вручную"
        : "Статус обновлён администратором",
  });
}
