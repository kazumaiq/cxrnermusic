// =========================================================================
// CXRNER MUSIC UNIFIED DIGITAL ECOSYSTEM - SHARED TYPES & CATALOGS
// (Isomorphic: Safe for both Client and Server Components)
// =========================================================================

export type MusicRole =
  | "Artist"
  | "Producer"
  | "DJ"
  | "Vocalist"
  | "Beatmaker"
  | "Songwriter"
  | "Sound Designer"
  | "Listener"
  | "Other";

export type VerificationStatus =
  | "not_verified"
  | "draft"
  | "pending"
  | "needs_info"
  | "verified"
  | "rejected"
  | "suspended";

export type ItemRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface CxrnerProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  country?: string;
  city?: string | null;
  genres: string[];
  music_roles: MusicRole[];
  social_links: Array<{ platform: string; url: string }>;
  music_links: Array<{ platform: string; url: string }>;
  telegram_id?: string | null;
  telegram_username?: string | null;
  telegram_linked: boolean;
  is_artist_verified: boolean;
  completion_percentage: number;
  completion_reward_80_claimed: boolean;
  completion_reward_100_claimed: boolean;
  privacy_settings: {
    is_public: boolean;
    show_inventory: boolean;
    show_stats: boolean;
    show_referrals: boolean;
    show_music: boolean;
    show_in_leaderboard: boolean;
  };
  equipped_frame?: string | null;
  equipped_effect?: string | null;
  equipped_title?: string | null;
  equipped_badge?: string | null;
  equipped_showcase_item?: string | null;
  equipped_background?: string | null;
  pinned_achievements: string[];
  pinned_items: string[];
  is_banned: boolean;
  ban_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CxrnerArtistProfile {
  id: string;
  user_id: string;
  stage_name: string;
  project_type: "solo" | "duo" | "band" | "collective";
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  genres: string[];
  country: string;
  city?: string | null;
  spotify_url?: string | null;
  apple_music_url?: string | null;
  yandex_music_url?: string | null;
  vk_music_url?: string | null;
  soundcloud_url?: string | null;
  youtube_url?: string | null;
  bandcamp_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  telegram_url?: string | null;
  website_url?: string | null;
  members: Array<{ name: string; role: string; email?: string; user_id?: string }>;
  verification_status: VerificationStatus;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CxrnerArtistVerification {
  id: string;
  user_id: string;
  artist_profile_id?: string | null;
  stage_name: string;
  method: "oauth" | "code" | "manual";
  verification_code?: string | null;
  verification_code_status: "active" | "verified" | "expired";
  evidence_links: Array<{ title: string; url: string }>;
  evidence_notes?: string | null;
  status: VerificationStatus;
  reviewer_notes?: string | null;
  reject_reason?: string | null;
  reward_claimed: boolean;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

export interface DropInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  collection_name: string;
  rarity: ItemRarity;
  serial_number: number;
  description: string;
  image_url: string;
  model_3d_type: "procedural" | "gltf";
  model_color: string;
  obtained_via: string;
  is_equipped: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
}

export interface CxpWallet {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

export interface CxpTransaction {
  id: string;
  user_id: string;
  amount: number;
  operation_type: "credit" | "debit";
  reason: string;
  source_event_type: string;
  source_event_id?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

export interface AchievementItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  cxp_reward?: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  is_pinned: boolean;
}

export interface ReferralAttribution {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status:
    | "registered"
    | "email_verified"
    | "profile_completed"
    | "release_approved"
    | "artist_verified"
    | "qualified"
    | "flagged_fraud";
  ip_hash?: string | null;
  is_qualified: boolean;
  qualified_at?: string | null;
  fraud_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralReward {
  id: string;
  referral_id: string;
  user_id: string;
  role: "referrer" | "referee";
  event_type: "email_verified" | "profile_80_tg" | "first_release" | "artist_verified";
  cxp_amount: number;
  status: "granted" | "pending_review" | "revoked";
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: "drop_item" | "cxp_earned" | "achievement" | "verification_update" | "referral_reward" | "system";
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_email: string;
  action: string;
  target_user_id?: string | null;
  details: Record<string, any>;
  created_at: string;
}

// =========================================================================
// CATALOG DEFINITIONS: SPECIMENS & ACHIEVEMENTS
// =========================================================================

export const DROP_SPECIMENS: Array<{
  item_id: string;
  item_name: string;
  collection_name: string;
  rarity: ItemRarity;
  description: string;
  model_color: string;
  shape: "cylinder" | "box" | "torus" | "octahedron" | "dodecahedron" | "icosahedron";
}> = [
  {
    item_id: "specimen_cyber_vinyl_01",
    item_name: "CYBER VINYL GENESIS",
    collection_name: "GENESIS CHROME",
    rarity: "common",
    description: "Первый серийный релиз винила с гравировкой лазером CXRNER-001.",
    model_color: "#A855F7",
    shape: "cylinder",
  },
  {
    item_id: "specimen_cassette_neon_02",
    item_name: "CHROME CASSETTE 90s",
    collection_name: "NEON ARCHIVE",
    rarity: "common",
    description: "Металлическая аудиокассета с магнитной лентой высокой плотности.",
    model_color: "#06B6D4",
    shape: "box",
  },
  {
    item_id: "specimen_hologram_mic_03",
    item_name: "HOLOGRAPHIC VOCAL MIC",
    collection_name: "DARK SOUNDSCAPE",
    rarity: "rare",
    description: "Студийный микрофон с оптическим датчиком гармонических искажений.",
    model_color: "#3B82F6",
    shape: "cylinder",
  },
  {
    item_id: "specimen_void_resonator_04",
    item_name: "VOID RESONATOR",
    collection_name: "DARK SOUNDSCAPE",
    rarity: "rare",
    description: "Акустический резонатор глубоких суб-басов, выкованный в обсидиане.",
    model_color: "#6366F1",
    shape: "torus",
  },
  {
    item_id: "specimen_aurora_synth_05",
    item_name: "AURORA SYNTHESIZER KEY",
    collection_name: "CELESTIAL REVERB",
    rarity: "epic",
    description: "Кристаллический модуль полифонического синтеза с северным сиянием внутри.",
    model_color: "#EC4899",
    shape: "octahedron",
  },
  {
    item_id: "specimen_quantum_groove_06",
    item_name: "QUANTUM GROOVE CORE",
    collection_name: "NEON ARCHIVE",
    rarity: "epic",
    description: "Ядро квантового свинга для драм-машин нового поколения.",
    model_color: "#F59E0B",
    shape: "dodecahedron",
  },
  {
    item_id: "specimen_monolith_black_07",
    item_name: "CXRNER MONOLITH V1",
    collection_name: "GENESIS CHROME",
    rarity: "legendary",
    description: "Легендарный артефакт лейбла. Содержит мастер-запись первых 100 релизов.",
    model_color: "#E2E8F0",
    shape: "box",
  },
  {
    item_id: "specimen_celestial_prism_08",
    item_name: "CELESTIAL HARMONIC PRISM",
    collection_name: "CELESTIAL REVERB",
    rarity: "legendary",
    description: "Призма, расщепляющая звук на бесконечные пространственные обертоны.",
    model_color: "#8B5CF6",
    shape: "icosahedron",
  },
  {
    item_id: "specimen_mythic_infinity_09",
    item_name: "MYTHIC OMNI-REVERB 3.8",
    collection_name: "GENESIS CHROME",
    rarity: "mythic",
    description: "Мифический артефакт CXRNER. Существует в единственных экземплярах.",
    model_color: "#F43F5E",
    shape: "torus",
  },
];

export const ACHIEVEMENTS_CATALOG: AchievementItem[] = [
  {
    key: "FIRST_DROP",
    name: "FIRST DROP",
    description: "Первое открытие кейса и получение коллекционного предмета в CXRNER DROP.",
    icon: "Sparkles",
    rarity: "common",
    cxp_reward: 25,
  },
  {
    key: "SPECIMEN_COLLECTOR",
    name: "SPECIMEN COLLECTOR",
    description: "Собрано 5 уникальных музыкальных предметов в личном инвентаре.",
    icon: "Boxes",
    rarity: "rare",
    cxp_reward: 50,
  },
  {
    key: "RARE_FIND",
    name: "RARE FIND",
    description: "Получен первый артефакт категории EPIC, LEGENDARY или MYTHIC.",
    icon: "Flame",
    rarity: "epic",
    cxp_reward: 75,
  },
  {
    key: "CHROME_MASTER",
    name: "CHROME MASTER",
    description: "Собраны предметы легендарной линейки GENESIS CHROME.",
    icon: "Shield",
    rarity: "legendary",
    cxp_reward: 100,
  },
  {
    key: "PROFILE_COMPLETE",
    name: "PROFILE COMPLETE",
    description: "Профиль пользователя заполнен минимум на 80%. Получен бонус +100 CXP.",
    icon: "CheckCircle2",
    rarity: "rare",
    cxp_reward: 100,
  },
  {
    key: "PERFECT_PROFILE",
    name: "PERFECT PROFILE",
    description: "Профиль заполнен на 100%. Открыт эксклюзивный косметический фрейм.",
    icon: "Crown",
    rarity: "epic",
  },
  {
    key: "VERIFIED_ARTIST",
    name: "VERIFIED ARTIST",
    description: "Артистический профиль официально подтверждён модерацией CXRNER MUSIC.",
    icon: "ShieldCheck",
    rarity: "legendary",
    cxp_reward: 100,
  },
  {
    key: "NETWORK_BUILDER",
    name: "NETWORK BUILDER",
    description: "Приглашено 5 подтверждённых артистов по персональной реферальной ссылке.",
    icon: "Users",
    rarity: "epic",
    cxp_reward: 150,
  },
  {
    key: "FIRST_RELEASE",
    name: "FIRST RELEASE",
    description: "Первый релиз успешно отправлен на модерацию и одобрен для дистрибуции.",
    icon: "Disc",
    rarity: "legendary",
    cxp_reward: 150,
  },
  {
    key: "CXRNER_VETERAN",
    name: "CXRNER VETERAN",
    description: "Активное участие в цифровой экосистеме лейбла.",
    icon: "Award",
    rarity: "rare",
    cxp_reward: 50,
  },
];

export const COSMETIC_FRAMES = [
  { id: "frame-cyber-chrome", name: "Cyber Chrome Halo", previewColor: "#E2E8F0" },
  { id: "frame-neon-purple", name: "Neon Void Pulse", previewColor: "#8737FF" },
  { id: "frame-mythic-gold", name: "Underground Mythic", previewColor: "#F59E0B" },
  { id: "frame-glitch-cyan", name: "Quantum Cyan Flare", previewColor: "#00F0FF" },
];

export const COSMETIC_EFFECTS = [
  { id: "effect-purple-aura", name: "Cosmic Purple Aura", className: "ring-2 ring-[#B46BFF]/70 shadow-[0_0_24px_rgba(180,107,255,0.6)]" },
  { id: "effect-cyan-pulse", name: "Electric Cyan Pulse", className: "ring-2 ring-[#00F0FF]/70 shadow-[0_0_24px_rgba(0,240,255,0.6)]" },
  { id: "effect-chrome-sheen", name: "Liquid Chrome Sheen", className: "ring-2 ring-white/80 shadow-[0_0_20px_rgba(255,255,255,0.7)]" },
];

export const COSMETIC_TITLES = [
  "CXRNER Pioneer",
  "Underground Prodigy",
  "Sound Alchemist",
  "Beat Architect",
  "Void Wanderer",
  "Analog Master",
];

export interface ProfileCompletionResult {
  total: number;
  breakdown: {
    displayName: { percent: number; done: boolean; label: string };
    avatar: { percent: number; done: boolean; label: string };
    bio: { percent: number; done: boolean; label: string };
    genres: { percent: number; done: boolean; label: string };
    musicRoles: { percent: number; done: boolean; label: string };
    socialLinks: { percent: number; done: boolean; label: string };
    musicLinks: { percent: number; done: boolean; label: string };
    telegramLinked: { percent: number; done: boolean; label: string };
    banner: { percent: number; done: boolean; label: string };
  };
}

export function calculateProfileCompletion(profile: Partial<CxrnerProfile>): ProfileCompletionResult {
  const hasDisplayName = Boolean(profile.display_name && profile.display_name.trim().length > 1);
  const hasAvatar = Boolean(profile.avatar_url && profile.avatar_url.trim().length > 0);
  const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 10);
  const hasGenres = Boolean(profile.genres && profile.genres.length > 0);
  const hasRoles = Boolean(profile.music_roles && profile.music_roles.length > 0);
  const hasSocials = Boolean(profile.social_links && profile.social_links.length > 0);
  const hasMusicLinks = Boolean(profile.music_links && profile.music_links.length > 0);
  const hasTelegram = Boolean(profile.telegram_linked || profile.telegram_id);
  const hasBanner = Boolean(profile.banner_url && profile.banner_url.trim().length > 0);

  const breakdown = {
    displayName: { percent: 15, done: hasDisplayName, label: "Отображаемое имя" },
    avatar: { percent: 10, done: hasAvatar, label: "Аватар профиля" },
    bio: { percent: 10, done: hasBio, label: "Bio / Описание" },
    genres: { percent: 10, done: hasGenres, label: "Музыкальные жанры" },
    musicRoles: { percent: 10, done: hasRoles, label: "Роль в музыке" },
    socialLinks: { percent: 10, done: hasSocials, label: "Социальные сети" },
    musicLinks: { percent: 15, done: hasMusicLinks, label: "Музыкальные профили" },
    telegramLinked: { percent: 10, done: hasTelegram, label: "Привязка Telegram" },
    banner: { percent: 10, done: hasBanner, label: "Обложка профиля" },
  };

  const total =
    (hasDisplayName ? 15 : 0) +
    (hasAvatar ? 10 : 0) +
    (hasBio ? 10 : 0) +
    (hasGenres ? 10 : 0) +
    (hasRoles ? 10 : 0) +
    (hasSocials ? 10 : 0) +
    (hasMusicLinks ? 15 : 0) +
    (hasTelegram ? 10 : 0) +
    (hasBanner ? 10 : 0);

  return { total, breakdown };
}
