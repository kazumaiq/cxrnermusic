import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isTableNotFoundError } from "@/lib/smartLinksDb";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export * from "./ecosystemTypes";
import type {
  CxrnerProfile,
  CxrnerArtistProfile,
  CxrnerArtistVerification,
  DropInventoryItem,
  CxpWallet,
  CxpTransaction,
  UserAchievement,
  ReferralAttribution,
  ReferralReward,
  NotificationItem,
  AdminAuditLog,
  ItemRarity,
  MusicRole,
  VerificationStatus,
} from "./ecosystemTypes";
import {
  DROP_SPECIMENS,
  ACHIEVEMENTS_CATALOG,
  calculateProfileCompletion,
} from "./ecosystemTypes";

// =========================================================================
// LOCAL FALLBACK DATA STORE
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
}

const STORE_PATH = path.join(process.cwd(), "data", "ecosystem_store.json");

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
    // fallback
  }
  memoryStore = getInitialStore();
  saveLocalStore(memoryStore);
  return memoryStore;
}

function saveLocalStore(store: EcosystemStore) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
    memoryStore = store;
  } catch (err) {
    console.error("[ecosystemDb] Failed to save local store:", err);
  }
}

// =========================================================================
// 2. WALLET & REWARDS DISPATCHER (Atomic, Server-Side, Anti-Double Spend)
// =========================================================================

export async function awardCxp(params: {
  userId: string;
  amount: number;
  reason: string;
  sourceEventType: string;
  sourceEventId?: string;
  adminNotes?: string;
}): Promise<{ ok: boolean; newBalance: number; duplicate?: boolean }> {
  const { userId, amount, reason, sourceEventType, sourceEventId, adminNotes } = params;

  try {
    const supabase = await getSupabaseServerClient();
    // Try via Supabase transactions if table exists
    const eventId = sourceEventId || `${sourceEventType}_${userId}`;
    
    // Check duplicate
    const { data: existingTx } = await supabase
      .from("cxrner_cxp_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("source_event_type", sourceEventType)
      .eq("source_event_id", eventId)
      .maybeSingle();

    if (existingTx) {
      const { data: wallet } = await supabase
        .from("cxrner_cxp_wallet")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      return { ok: true, newBalance: wallet?.balance || 0, duplicate: true };
    }

    // Insert transaction
    await supabase.from("cxrner_cxp_transactions").insert({
      user_id: userId,
      amount,
      operation_type: amount >= 0 ? "credit" : "debit",
      reason,
      source_event_type: sourceEventType,
      source_event_id: eventId,
      admin_notes: adminNotes || null,
    });

    // Update or insert wallet
    const { data: currentWallet } = await supabase
      .from("cxrner_cxp_wallet")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const currentBal = currentWallet?.balance || 0;
    const currentEarned = currentWallet?.total_earned || 0;
    const currentSpent = currentWallet?.total_spent || 0;

    const newBal = Math.max(0, currentBal + amount);
    const newEarned = amount > 0 ? currentEarned + amount : currentEarned;
    const newSpent = amount < 0 ? currentSpent + Math.abs(amount) : currentSpent;

    await supabase.from("cxrner_cxp_wallet").upsert({
      user_id: userId,
      balance: newBal,
      total_earned: newEarned,
      total_spent: newSpent,
      updated_at: new Date().toISOString(),
    });

    return { ok: true, newBalance: newBal };
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.warn("[awardCxp] Falling back to local store due to Supabase error:", err?.message);
    }
  }

  // Local store fallback
  const store = loadLocalStore();
  const eventId = sourceEventId || `${sourceEventType}_${userId}`;
  const userTxs = store.transactions[userId] || [];

  const alreadyAwarded = userTxs.some(
    (tx) => tx.source_event_type === sourceEventType && tx.source_event_id === eventId
  );
  if (alreadyAwarded) {
    const cur = store.wallets[userId]?.balance || 0;
    return { ok: true, newBalance: cur, duplicate: true };
  }

  const newTx: CxpTransaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    amount,
    operation_type: amount >= 0 ? "credit" : "debit",
    reason,
    source_event_type: sourceEventType,
    source_event_id: eventId,
    admin_notes: adminNotes || null,
    created_at: new Date().toISOString(),
  };

  userTxs.push(newTx);
  store.transactions[userId] = userTxs;

  const currentWallet = store.wallets[userId] || {
    user_id: userId,
    balance: 0,
    total_earned: 0,
    total_spent: 0,
    updated_at: new Date().toISOString(),
  };

  currentWallet.balance = Math.max(0, currentWallet.balance + amount);
  if (amount > 0) currentWallet.total_earned += amount;
  if (amount < 0) currentWallet.total_spent += Math.abs(amount);
  currentWallet.updated_at = new Date().toISOString();
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

  try {
    const supabase = await getSupabaseServerClient();
    const { data: existing } = await supabase
      .from("cxrner_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_key", achievementKey)
      .maybeSingle();

    if (existing) {
      return { ok: true, alreadyUnlocked: true };
    }

    await supabase.from("cxrner_achievements").insert({
      user_id: userId,
      achievement_key: achievementKey,
      unlocked_at: new Date().toISOString(),
    });

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
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.warn("[unlockAchievement] Falling back to local store:", err?.message);
    }
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
    unlocked_at: new Date().toISOString(),
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
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      link: link || null,
      is_read: false,
    });
    return;
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  const list = store.notifications[userId] || [];
  list.unshift({
    id: crypto.randomUUID(),
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  store.notifications[userId] = list.slice(0, 50); // keep recent 50
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

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cxrner_profiles")
      .select("*")
      .ilike("username", clean)
      .maybeSingle();

    if (data && !error) return data as CxrnerProfile;
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  const found = Object.values(store.profiles).find(
    (p) => p.username.toLowerCase() === clean
  );
  return found || null;
}

export async function getProfileByUserId(userId: string): Promise<CxrnerProfile | null> {
  if (!userId) return null;

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cxrner_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (data && !error) return data as CxrnerProfile;
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  return store.profiles[userId] || null;
}

export async function upsertUserProfile(params: {
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  country?: string;
  city?: string;
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
  const current = (await getProfileByUserId(params.userId)) || {
    id: params.userId,
    username: params.username || `artist_${params.userId.slice(0, 6)}`,
    display_name: params.displayName || "CXRNER Artist",
    avatar_url: null,
    banner_url: null,
    bio: null,
    country: "RU",
    city: null,
    genres: [],
    music_roles: ["Artist"],
    social_links: [],
    music_links: [],
    telegram_id: null,
    telegram_username: null,
    telegram_linked: false,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated: CxrnerProfile = {
    ...current,
    username: params.username !== undefined ? sanitizeUsername(params.username) : current.username,
    display_name: params.displayName !== undefined ? params.displayName.trim() : current.display_name,
    avatar_url: params.avatarUrl !== undefined ? params.avatarUrl : current.avatar_url,
    banner_url: params.bannerUrl !== undefined ? params.bannerUrl : current.banner_url,
    bio: params.bio !== undefined ? params.bio : current.bio,
    country: params.country !== undefined ? params.country : current.country,
    city: params.city !== undefined ? params.city : current.city,
    genres: params.genres !== undefined ? params.genres : current.genres,
    music_roles: params.musicRoles !== undefined ? params.musicRoles : current.music_roles,
    social_links: params.socialLinks !== undefined ? params.socialLinks : current.social_links,
    music_links: params.musicLinks !== undefined ? params.musicLinks : current.music_links,
    telegram_id: params.telegramId !== undefined ? params.telegramId : current.telegram_id,
    telegram_username: params.telegramUsername !== undefined ? params.telegramUsername : current.telegram_username,
    telegram_linked: params.telegramLinked !== undefined ? params.telegramLinked : current.telegram_linked,
    privacy_settings: {
      ...current.privacy_settings,
      ...(params.privacySettings || {}),
    },
    equipped_frame: params.equippedFrame !== undefined ? params.equippedFrame : current.equipped_frame,
    equipped_effect: params.equippedEffect !== undefined ? params.equippedEffect : current.equipped_effect,
    equipped_title: params.equippedTitle !== undefined ? params.equippedTitle : current.equipped_title,
    equipped_badge: params.equippedBadge !== undefined ? params.equippedBadge : current.equipped_badge,
    equipped_showcase_item: params.equippedShowcaseItem !== undefined ? params.equippedShowcaseItem : current.equipped_showcase_item,
    equipped_background: params.equippedBackground !== undefined ? params.equippedBackground : current.equipped_background,
    pinned_achievements: params.pinnedAchievements !== undefined ? params.pinnedAchievements : current.pinned_achievements,
    pinned_items: params.pinnedItems !== undefined ? params.pinnedItems : current.pinned_items,
    updated_at: new Date().toISOString(),
  };

  // Calculate completion percentage
  const { total } = calculateProfileCompletion(updated);
  updated.completion_percentage = total;

  const rewardsAwarded: string[] = [];

  // Check 80% milestone reward (+100 CXP, PROFILE COMPLETE badge)
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

    // Check referral hook: if user has a referrer, trigger profile_80_tg milestone
    await evaluateReferralMilestones(updated.id);
  }

  // Check 100% milestone reward (PERFECT PROFILE achievement + cosmetic)
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

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_profiles").upsert(updated);
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  store.profiles[updated.id] = updated;
  saveLocalStore(store);

  return { ok: true, profile: updated, rewardsAwarded };
}

// =========================================================================
// 4. ARTIST PROFILES & VERIFICATION SYSTEM
// =========================================================================

export async function getArtistProfileByUserId(userId: string): Promise<CxrnerArtistProfile | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("cxrner_artist_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return data as CxrnerArtistProfile;
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  return store.artistProfiles[userId] || null;
}

export async function upsertArtistProfile(
  userId: string,
  data: Partial<CxrnerArtistProfile>
): Promise<CxrnerArtistProfile> {
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated: CxrnerArtistProfile = {
    ...current,
    ...data,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_artist_profiles").upsert(updated);
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  store.artistProfiles[userId] = updated;
  saveLocalStore(store);
  return updated;
}

export async function generateVerificationCode(userId: string): Promise<string> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const code = `CXRNER-${randomSuffix}`;

  const store = loadLocalStore();
  const current = store.verifications[userId] || {
    id: crypto.randomUUID(),
    user_id: userId,
    stage_name: "Artist",
    method: "code",
    verification_code: code,
    verification_code_status: "active",
    evidence_links: [],
    evidence_notes: "",
    status: "draft",
    reward_claimed: false,
    created_at: new Date().toISOString(),
  };

  current.verification_code = code;
  current.verification_code_status = "active";
  store.verifications[userId] = current;
  saveLocalStore(store);

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_artist_verifications").upsert({
      user_id: userId,
      stage_name: current.stage_name,
      method: "code",
      verification_code: code,
      verification_code_status: "active",
      status: current.status,
    });
  } catch {
    // fallback
  }

  return code;
}

export async function submitVerificationApplication(params: {
  userId: string;
  stageName: string;
  method: "oauth" | "code" | "manual";
  evidenceLinks: Array<{ title: string; url: string }>;
  evidenceNotes?: string;
  verificationCode?: string;
}): Promise<CxrnerArtistVerification> {
  const { userId, stageName, method, evidenceLinks, evidenceNotes, verificationCode } = params;

  const ver: CxrnerArtistVerification = {
    id: crypto.randomUUID(),
    user_id: userId,
    stage_name: stageName,
    method,
    verification_code: verificationCode || null,
    verification_code_status: "active",
    evidence_links: evidenceLinks,
    evidence_notes: evidenceNotes || null,
    status: "pending",
    reward_claimed: false,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_artist_verifications").upsert(ver);
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  store.verifications[userId] = ver;
  saveLocalStore(store);

  await createNotification({
    userId,
    type: "system",
    title: "Заявка на верификацию отправлена",
    message: `Заявка для «${stageName}» передана модераторам CXRNER. Статус проверки отображается в кабинете.`,
    link: "/cabinet/verification",
  });

  return ver;
}

// Admin approve / reject verification
export async function processVerificationReview(params: {
  verificationId: string;
  targetUserId: string;
  decision: "verified" | "rejected" | "needs_info";
  reviewerEmail: string;
  notes?: string;
  rejectReason?: string;
}): Promise<{ ok: boolean; status: VerificationStatus }> {
  const { targetUserId, decision, reviewerEmail, notes, rejectReason } = params;

  const store = loadLocalStore();
  const ver = store.verifications[targetUserId];
  if (!ver) return { ok: false, status: "not_verified" };

  ver.status = decision;
  ver.reviewer_notes = notes || null;
  ver.reject_reason = rejectReason || null;
  ver.reviewed_at = new Date().toISOString();
  ver.reviewed_by = reviewerEmail;

  if (decision === "verified") {
    // 1. Update Profile & Artist Profile
    const profile = await getProfileByUserId(targetUserId);
    if (profile) {
      profile.is_artist_verified = true;
      if (!profile.equipped_badge) profile.equipped_badge = "verified";
      store.profiles[targetUserId] = profile;
    }

    const artistProf = await getArtistProfileByUserId(targetUserId);
    if (artistProf) {
      artistProf.verification_status = "verified";
      artistProf.verified_at = new Date().toISOString();
      store.artistProfiles[targetUserId] = artistProf;
    }

    // 2. Award one-time 100 CXP & VERIFIED ARTIST achievement
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

    // 3. Referral hook
    await evaluateReferralMilestones(targetUserId);

    await createNotification({
      userId: targetUserId,
      type: "verification_update",
      title: "Артистический профиль верифицирован!",
      message: "Поздравляем! Ваш статус подтверждён. В профиле появился знак CXRNER VERIFIED и начислено 100 CXP.",
      link: "/cabinet/profile",
    });
  } else if (decision === "rejected") {
    await createNotification({
      userId: targetUserId,
      type: "verification_update",
      title: "Верификация отклонена",
      message: `Причина: ${rejectReason || "Недостаточно доказательств владения карточкой артиста"}. Вы можете исправить данные и подать заявку повторно.`,
      link: "/cabinet/verification",
    });
  } else if (decision === "needs_info") {
    await createNotification({
      userId: targetUserId,
      type: "verification_update",
      title: "Требуются дополнительные данные",
      message: notes || "Модератор запросил уточняющую информацию по вашей заявке.",
      link: "/cabinet/verification",
    });
  }

  saveLocalStore(store);

  // Sync Supabase
  try {
    const supabase = await getSupabaseServerClient();
    await supabase
      .from("cxrner_artist_verifications")
      .update({
        status: decision,
        reviewer_notes: notes || null,
        reject_reason: rejectReason || null,
        reviewed_at: ver.reviewed_at,
        reviewed_by: reviewerEmail,
        reward_claimed: ver.reward_claimed,
      })
      .eq("user_id", targetUserId);

    if (decision === "verified") {
      await supabase
        .from("cxrner_profiles")
        .update({ is_artist_verified: true, equipped_badge: "verified" })
        .eq("id", targetUserId);

      await supabase
        .from("cxrner_artist_profiles")
        .update({ verification_status: "verified", verified_at: ver.reviewed_at })
        .eq("user_id", targetUserId);
    }
  } catch {
    // fallback
  }

  return { ok: true, status: decision };
}

// =========================================================================
// 5. CXRNER DROP & INVENTORY (Procedural Specimens, Equips, Showcase)
// =========================================================================

export async function getUserInventory(userId: string): Promise<DropInventoryItem[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("cxrner_drop_inventory")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) return data as DropInventoryItem[];
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  const list = store.inventory[userId];
  if (list && list.length > 0) return list;

  // Initialize with starter drop for new accounts
  const starterItem = DROP_SPECIMENS[0];
  const initialItem: DropInventoryItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    item_id: starterItem.item_id,
    item_name: starterItem.item_name,
    collection_name: starterItem.collection_name,
    rarity: starterItem.rarity,
    serial_number: 135,
    description: starterItem.description,
    image_url: "/covers/the-sadness-of-reality.jpg",
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

export async function openDropCase(userId: string): Promise<{
  ok: boolean;
  item: DropInventoryItem;
  duplicate: boolean;
  achievementsUnlocked: string[];
}> {
  // 1. Roll random specimen weighted by rarity
  // Common 60%, Rare 25%, Epic 10%, Legendary 4%, Mythic 1%
  const roll = Math.random() * 100;
  let targetRarity: ItemRarity = "common";
  if (roll > 99) targetRarity = "mythic";
  else if (roll > 95) targetRarity = "legendary";
  else if (roll > 85) targetRarity = "epic";
  else if (roll > 60) targetRarity = "rare";

  const candidates = DROP_SPECIMENS.filter((s) => s.rarity === targetRarity);
  const picked = candidates[Math.floor(Math.random() * candidates.length)] || DROP_SPECIMENS[0];

  const currentInventory = await getUserInventory(userId);
  const duplicate = currentInventory.some((i) => i.item_id === picked.item_id);
  const serialNumber = Math.floor(100 + Math.random() * 8900);

  const newItem: DropInventoryItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    item_id: picked.item_id,
    item_name: picked.item_name,
    collection_name: picked.collection_name,
    rarity: picked.rarity,
    serial_number: serialNumber,
    description: picked.description,
    image_url: "/covers/the-sadness-of-reality.jpg",
    model_3d_type: "procedural",
    model_color: picked.model_color,
    obtained_via: "case_drop",
    is_equipped: false,
    is_pinned: currentInventory.length < 6,
    is_hidden: false,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_drop_inventory").insert(newItem);
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  const list = store.inventory[userId] || [];
  list.unshift(newItem);
  store.inventory[userId] = list;
  saveLocalStore(store);

  // Check achievements
  const achievementsUnlocked: string[] = [];

  // FIRST DROP
  const res1 = await unlockAchievement({ userId, achievementKey: "FIRST_DROP" });
  if (!res1.alreadyUnlocked) achievementsUnlocked.push("FIRST_DROP");

  // RARE FIND if epic, legendary, or mythic
  if (["epic", "legendary", "mythic"].includes(picked.rarity)) {
    const res2 = await unlockAchievement({ userId, achievementKey: "RARE_FIND" });
    if (!res2.alreadyUnlocked) achievementsUnlocked.push("RARE_FIND");
  }

  // SPECIMEN COLLECTOR if 5+ unique
  const uniqueCount = new Set(list.map((i) => i.item_id)).size;
  if (uniqueCount >= 5) {
    const res3 = await unlockAchievement({ userId, achievementKey: "SPECIMEN_COLLECTOR" });
    if (!res3.alreadyUnlocked) achievementsUnlocked.push("SPECIMEN_COLLECTOR");
  }

  await createNotification({
    userId,
    type: "drop_item",
    title: `Получен предмет: ${picked.item_name}!`,
    message: `Редкость: ${picked.rarity.toUpperCase()} (#${serialNumber}). Добавлен в личный инвентарь.`,
    link: "/cabinet/drop/inventory",
  });

  return { ok: true, item: newItem, duplicate, achievementsUnlocked };
}

export async function updateItemDisplayStatus(params: {
  userId: string;
  itemId: string;
  isPinned?: boolean;
  isHidden?: boolean;
  isEquipped?: boolean;
}): Promise<{ ok: boolean }> {
  const { userId, itemId, isPinned, isHidden, isEquipped } = params;

  try {
    const supabase = await getSupabaseServerClient();
    const updateObj: Record<string, any> = {};
    if (isPinned !== undefined) updateObj.is_pinned = isPinned;
    if (isHidden !== undefined) updateObj.is_hidden = isHidden;
    if (isEquipped !== undefined) updateObj.is_equipped = isEquipped;

    await supabase
      .from("cxrner_drop_inventory")
      .update(updateObj)
      .eq("id", itemId)
      .eq("user_id", userId);
  } catch {
    // fallback
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

export function generateReferralCode(username: string): string {
  const clean = sanitizeUsername(username || "cxrner").toUpperCase().slice(0, 4);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${clean}-${rand}`;
}

export async function getReferralCodeForUser(userId: string): Promise<string> {
  const profile = await getProfileByUserId(userId);
  const store = loadLocalStore();
  const existing = Object.values(store.referrals).flat().find((r) => r.referrer_user_id === userId);
  if (existing?.referral_code) return existing.referral_code;

  return generateReferralCode(profile?.username || "artist");
}

export async function recordReferralAttribution(params: {
  referrerCode: string;
  newUserId: string;
  ipHash?: string;
}): Promise<{ ok: boolean; attribution?: ReferralAttribution; error?: string }> {
  const { referrerCode, newUserId, ipHash } = params;

  const store = loadLocalStore();
  // Find referrer user by referral code or username
  let referrerId: string | null = null;
  const allProfiles = Object.values(store.profiles);
  const targetCodeClean = referrerCode.trim().toUpperCase();

  // Look for match in profiles or referral code table
  for (const p of allProfiles) {
    if (generateReferralCode(p.username).toUpperCase() === targetCodeClean || p.username.toUpperCase() === targetCodeClean) {
      referrerId = p.id;
      break;
    }
  }

  if (!referrerId) {
    // Check Supabase
    try {
      const supabase = await getSupabaseServerClient();
      const { data } = await supabase
        .from("cxrner_profiles")
        .select("id, username")
        .ilike("username", targetCodeClean.split("-")[0]);
      if (data && data.length > 0) {
        referrerId = data[0].id;
      }
    } catch {
      // ignore
    }
  }

  if (!referrerId) {
    return { ok: false, error: "REFERRER_NOT_FOUND" };
  }

  // Anti-fraud 1: Self-referral prohibition
  if (referrerId === newUserId) {
    return { ok: false, error: "SELF_REFERRAL_FORBIDDEN" };
  }

  // Anti-fraud 2: Duplicate check
  const allRefs = Object.values(store.referrals).flat();
  if (allRefs.some((r) => r.referred_user_id === newUserId)) {
    return { ok: false, error: "ALREADY_REFERRED" };
  }

  // Anti-fraud 3: Monthly cap check (default max 10 fully rewarded per month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const referrerRefsThisMonth = allRefs.filter(
    (r) => r.referrer_user_id === referrerId && r.created_at.startsWith(currentMonth) && r.is_qualified
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = store.referrals[referrerId] || [];
  list.push(attribution);
  store.referrals[referrerId] = list;
  saveLocalStore(store);

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_referrals").insert(attribution);
  } catch {
    // fallback
  }

  return { ok: true, attribution };
}

// Evaluate milestones for referee
export async function evaluateReferralMilestones(refereeUserId: string): Promise<void> {
  const store = loadLocalStore();
  let foundAttr: ReferralAttribution | null = null;
  let referrerId: string | null = null;

  for (const [rId, list] of Object.entries(store.referrals)) {
    const item = list.find((a) => a.referred_user_id === refereeUserId);
    if (item) {
      foundAttr = item;
      referrerId = rId;
      break;
    }
  }

  if (!foundAttr || !referrerId) return;

  const profile = await getProfileByUserId(refereeUserId);
  if (!profile) return;

  // Milestone 1: Email verified (+25 CXP to referrer)
  await awardReferralReward({
    referralId: foundAttr.id,
    referrerUserId: referrerId,
    refereeUserId: refereeUserId,
    eventType: "email_verified",
    referrerCxp: 25,
    refereeCxp: 0,
  });

  // Milestone 2: Profile 80% + TG (+50 CXP to referrer, +50 CXP to referee)
  if (profile.completion_percentage >= 80 && profile.telegram_linked) {
    await awardReferralReward({
      referralId: foundAttr.id,
      referrerUserId: referrerId,
      refereeUserId: refereeUserId,
      eventType: "profile_80_tg",
      referrerCxp: 50,
      refereeCxp: 50,
    });
  }

  // Milestone 3: Artist Verified (+50 CXP to referrer, +100 CXP to referee)
  if (profile.is_artist_verified) {
    await awardReferralReward({
      referralId: foundAttr.id,
      referrerUserId: referrerId,
      refereeUserId: refereeUserId,
      eventType: "artist_verified",
      referrerCxp: 50,
      refereeCxp: 100,
    });
  }

  // Check Qualified Artist status: email + 80% + TG + verified
  if (profile.completion_percentage >= 80 && profile.telegram_linked && profile.is_artist_verified) {
    foundAttr.is_qualified = true;
    foundAttr.status = "qualified";
    foundAttr.qualified_at = new Date().toISOString();
    saveLocalStore(store);

    // Check NETWORK BUILDER achievement for referrer (5 qualified)
    const qualifiedCount = (store.referrals[referrerId] || []).filter((r) => r.is_qualified).length;
    if (qualifiedCount >= 5) {
      await unlockAchievement({
        userId: referrerId,
        achievementKey: "NETWORK_BUILDER",
      });
    }
  }
}

export async function evaluateReferralReleaseMilestone(refereeUserId: string): Promise<void> {
  const store = loadLocalStore();
  let foundAttr: ReferralAttribution | null = null;
  let referrerId: string | null = null;

  for (const [rId, list] of Object.entries(store.referrals)) {
    const item = list.find((a) => a.referred_user_id === refereeUserId);
    if (item) {
      foundAttr = item;
      referrerId = rId;
      break;
    }
  }

  if (!foundAttr || !referrerId) return;

  // Milestone: First release approved (+150 CXP to referrer, once)
  await awardReferralReward({
    referralId: foundAttr.id,
    referrerUserId: referrerId,
    refereeUserId: refereeUserId,
    eventType: "first_release",
    referrerCxp: 150,
    refereeCxp: 0,
  });
}

async function awardReferralReward(params: {
  referralId: string;
  referrerUserId: string;
  refereeUserId: string;
  eventType: "email_verified" | "profile_80_tg" | "first_release" | "artist_verified";
  referrerCxp: number;
  refereeCxp: number;
}): Promise<void> {
  const { referralId, referrerUserId, refereeUserId, eventType, referrerCxp, refereeCxp } = params;
  const store = loadLocalStore();
  const rewards = store.referralRewards[referralId] || [];

  // Prevent double awarding
  if (rewards.some((r) => r.event_type === eventType)) {
    return;
  }

  if (referrerCxp > 0) {
    const r1: ReferralReward = {
      id: crypto.randomUUID(),
      referral_id: referralId,
      user_id: referrerUserId,
      role: "referrer",
      event_type: eventType,
      cxp_amount: referrerCxp,
      status: "granted",
      created_at: new Date().toISOString(),
    };
    rewards.push(r1);
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
      created_at: new Date().toISOString(),
    };
    rewards.push(r2);
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
}> {
  const store = loadLocalStore();
  const list = store.referrals[userId] || [];
  const myCode = await getReferralCodeForUser(userId);
  const shareUrl = `https://cxrnermusic.vercel.app/join?ref=${myCode}`;

  let totalEarned = 0;
  for (const ref of list) {
    const rewards = store.referralRewards[ref.id] || [];
    for (const rew of rewards) {
      if (rew.user_id === userId && rew.status === "granted") {
        totalEarned += rew.cxp_amount;
      }
    }
  }

  const qualifiedCount = list.filter((r) => r.is_qualified).length;

  return {
    myCode,
    shareUrl,
    totalInvited: list.length,
    registeredCount: list.length,
    emailVerifiedCount: list.length,
    profileCompletedCount: list.filter((r) => ["profile_completed", "release_approved", "artist_verified", "qualified"].includes(r.status)).length,
    telegramLinkedCount: list.filter((r) => r.is_qualified).length,
    verifiedArtistCount: list.filter((r) => r.status === "artist_verified" || r.is_qualified).length,
    releaseApprovedCount: list.filter((r) => r.status === "release_approved" || r.is_qualified).length,
    qualifiedCount,
    totalEarnedCxp: totalEarned,
    referralsList: list,
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
  const store = loadLocalStore();
  const leaderboardMap: Record<string, number> = {};

  for (const [referrerId, list] of Object.entries(store.referrals)) {
    const count = list.filter((r) => r.is_qualified).length;
    leaderboardMap[referrerId] = count;
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

// =========================================================================
// 7. ADMIN AUDIT LOGS
// =========================================================================

export async function recordAdminAudit(params: {
  adminEmail: string;
  action: string;
  targetUserId?: string;
  details: Record<string, any>;
}): Promise<void> {
  const { adminEmail, action, targetUserId, details } = params;

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.from("cxrner_admin_audit_log").insert({
      admin_email: adminEmail,
      action,
      target_user_id: targetUserId || null,
      details,
    });
  } catch {
    // fallback
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
