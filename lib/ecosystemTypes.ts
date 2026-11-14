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

export type ItemRarity = "common" | "rare" | "epic" | "legendary" | "mythic" | "special_reward";

export interface DropCaseConfig {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  price_cxp: number;
  cover_url: string;
  is_active: boolean;
  available_rarities: ItemRarity[];
  drop_rates: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
    special_reward: number;
  };
  display_order: number;
}

export interface SpecialRewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  reward_name: string;
  claim_code: string;
  status: "WON" | "PENDING_CLAIM" | "CLAIMED" | "REDEEMED" | "EXPIRED";
  won_at: string;
  claimed_at?: string | null;
  redeemed_at?: string | null;
  admin_notes?: string | null;
  admin_id?: string | null;
}

export interface DropHistoryEntry {
  id: string;
  user_id: string;
  case_id: string;
  case_name: string;
  item_id: string;
  item_name: string;
  rarity: ItemRarity;
  serial_number: number;
  cxp_spent: number;
  created_at: string;
}

export interface CxpQuestItem {
  id: string;
  title: string;
  description: string;
  reward_cxp: number;
  category: "onboarding" | "daily" | "social" | "music" | "referral";
  action_label: string;
  action_href: string;
  is_completed?: boolean;
}

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

export interface DropSpecimenDef {
  item_id: string;
  item_name: string;
  collection_name: string;
  rarity: ItemRarity;
  description: string;
  model_color: string;
  shape: "cylinder" | "box" | "torus" | "octahedron" | "dodecahedron" | "icosahedron";
  case_id?: string;
  is_special_reward?: boolean;
}

export const DROP_CASES: DropCaseConfig[] = [
  {
    id: "case_001_archive",
    name: "CASE 001 — ARCHIVE",
    slug: "archive",
    subtitle: "SPECIMEN ARCHIVE BASE",
    description: "Основной кейс с базовыми коллекционными предметами лейбла, цифровыми ключами, редкими масками и шансом выиграть ваучер на бесплатную обложку.",
    price_cxp: 50,
    cover_url: "/drop/cases/case_001_archive.svg",
    is_active: true,
    available_rarities: ["common", "rare", "epic", "legendary", "mythic", "special_reward"],
    drop_rates: {
      common: 55,
      rare: 25,
      epic: 13,
      legendary: 5.5,
      mythic: 1.4,
      special_reward: 0.1,
    },
    display_order: 1,
  },
  {
    id: "case_002_black_specimen",
    name: "CASE 002 — BLACK SPECIMEN",
    slug: "black-specimen",
    subtitle: "ORGANIC FORMS & MASKS",
    description: "Редкая коллекция тёмных металлических артефактов, необычных органических форм, ритуальных масок и биомеханических паразитов.",
    price_cxp: 75,
    cover_url: "/drop/cases/case_002_black_specimen.svg",
    is_active: true,
    available_rarities: ["rare", "epic", "legendary", "mythic", "special_reward"],
    drop_rates: {
      common: 0,
      rare: 50,
      epic: 32,
      legendary: 14,
      mythic: 3.8,
      special_reward: 0.2,
    },
    display_order: 2,
  },
  {
    id: "case_003_chrome_age",
    name: "CASE 003 — CHROME AGE",
    slug: "chrome-age",
    subtitle: "LIQUID CHROME & SPIKES",
    description: "Ультрапремиальная линейка жидкого зеркального хрома: шипы Chrome Spike, Void Crown, Chrome Fang, Chrome Chain и сезонные реликвии.",
    price_cxp: 100,
    cover_url: "/drop/cases/case_003_chrome_age.svg",
    is_active: true,
    available_rarities: ["rare", "epic", "legendary", "mythic", "special_reward"],
    drop_rates: {
      common: 0,
      rare: 35,
      epic: 40,
      legendary: 20,
      mythic: 4.7,
      special_reward: 0.3,
    },
    display_order: 3,
  },
];

export const DROP_SPECIMENS: DropSpecimenDef[] = [
  // -------------------------------------------------------------------------
  // COMMON (55% Base)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_cyber_vinyl_01",
    item_name: "CYBER VINYL GENESIS",
    collection_name: "GENESIS ARCHIVE",
    rarity: "common",
    description: "Первый серийный релиз винила с гравировкой лазером CXRNER-001.",
    model_color: "#A855F7",
    shape: "cylinder",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_archive_cassette_02",
    item_name: "ARCHIVE CASSETTE",
    collection_name: "GENESIS ARCHIVE",
    rarity: "common",
    description: "Коллекционная кассета в прозрачной упаковке с магнитной лентой высокой плотности.",
    model_color: "#06B6D4",
    shape: "box",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_data_key_03",
    item_name: "DATA KEY",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "common",
    description: "Металлический цифровой ключ с защищённым чипом доступа к звуковым дорожкам.",
    model_color: "#94A3B8",
    shape: "box",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_basic_specimen_04",
    item_name: "BASIC SPECIMEN",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "common",
    description: "Базовый образец коллекции. Запечатанная полимерная капсула архива.",
    model_color: "#64748B",
    shape: "cylinder",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_chrome_tag_05",
    item_name: "CHROME TAG",
    collection_name: "CHROME AGE",
    rarity: "common",
    description: "Металлическая маркировочная бирка с лазерной гравировкой серийного номера.",
    model_color: "#CBD5E1",
    shape: "box",
    case_id: "case_001_archive",
  },

  // -------------------------------------------------------------------------
  // RARE (25% Base)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_chrome_disc_06",
    item_name: "CHROME DISC",
    collection_name: "CHROME AGE",
    rarity: "rare",
    description: "Коллекционный металлический диск с радиальной лазерной шлифовкой.",
    model_color: "#38BDF8",
    shape: "cylinder",
  },
  {
    item_id: "specimen_dead_wing_07",
    item_name: "DEAD WING",
    collection_name: "BLACK SPECIMEN",
    rarity: "rare",
    description: "Металлические оксидированные титановые крылья с хитиновым рельефом.",
    model_color: "#475569",
    shape: "octahedron",
  },
  {
    item_id: "specimen_void_core_08",
    item_name: "VOID CORE",
    collection_name: "BLACK SPECIMEN",
    rarity: "rare",
    description: "Чёрный металлический объект с геометрической формой глубокого суб-баса.",
    model_color: "#6366F1",
    shape: "torus",
  },
  {
    item_id: "specimen_chrome_chain_09",
    item_name: "CHROME CHAIN",
    collection_name: "CHROME AGE",
    rarity: "rare",
    description: "Коллекционная массивная металлическая цепь с зеркальной полировкой звеньев.",
    model_color: "#E2E8F0",
    shape: "torus",
  },
  {
    item_id: "specimen_parasite_mini_10",
    item_name: "PARASITE MINI",
    collection_name: "BLACK SPECIMEN",
    rarity: "rare",
    description: "Небольшой механический организм, реагирующий на басовые колебания.",
    model_color: "#A21CAF",
    shape: "dodecahedron",
  },

  // -------------------------------------------------------------------------
  // EPIC (13% Base)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_watcher_eye_11",
    item_name: "WATCHER EYE",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "epic",
    description: "Механический оптический сенсор с фиолетовой подсветкой и частотным спектром.",
    model_color: "#C084FC",
    shape: "dodecahedron",
  },
  {
    item_id: "specimen_black_heart_12",
    item_name: "BLACK HEART",
    collection_name: "BLACK SPECIMEN",
    rarity: "epic",
    description: "Чёрное хромированное сердце с проводниками суб-басового импульса.",
    model_color: "#831843",
    shape: "octahedron",
  },
  {
    item_id: "specimen_violet_visor_13",
    item_name: "VIOLET VISOR",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "epic",
    description: "Футуристическая маска-визор с неоновым HUD-интерфейсом звукорежиссёра.",
    model_color: "#8B5CF6",
    shape: "box",
  },
  {
    item_id: "specimen_specimen_mask_14",
    item_name: "SPECIMEN MASK",
    collection_name: "BLACK SPECIMEN",
    rarity: "epic",
    description: "Коллекционная ритуальная маска биомеханического архива CXRNER.",
    model_color: "#701A75",
    shape: "octahedron",
  },
  {
    item_id: "specimen_dark_wings_15",
    item_name: "DARK WINGS",
    collection_name: "BLACK SPECIMEN",
    rarity: "epic",
    description: "Чёрные титановые крылья с интенсивными фиолетовыми неоновыми акцентами.",
    model_color: "#9333EA",
    shape: "icosahedron",
  },

  // -------------------------------------------------------------------------
  // LEGENDARY (5.5% Base)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_chrome_spike_16",
    item_name: "CHROME SPIKE",
    collection_name: "CHROME AGE",
    rarity: "legendary",
    description: "Металлический артефакт с агрессивной зубчатой конструкцией и зеркальным блеском.",
    model_color: "#F8FAFC",
    shape: "octahedron",
  },
  {
    item_id: "specimen_void_crown_17",
    item_name: "VOID CROWN",
    collection_name: "BLACK SPECIMEN",
    rarity: "legendary",
    description: "Чёрная металлическая корона правителя подземной звуковой сцены.",
    model_color: "#1E1B4B",
    shape: "torus",
  },
  {
    item_id: "specimen_parasite_18",
    item_name: "PARASITE",
    collection_name: "BLACK SPECIMEN",
    rarity: "legendary",
    description: "Полноразмерный биомеханический организм с сегментированной бронёй.",
    model_color: "#7E22CE",
    shape: "icosahedron",
  },
  {
    item_id: "specimen_chrome_fang_19",
    item_name: "CHROME FANG",
    collection_name: "CHROME AGE",
    rarity: "legendary",
    description: "Коллекционная металлическая челюсть из аэрокосмического титанового сплава.",
    model_color: "#F1F5F9",
    shape: "dodecahedron",
  },
  {
    item_id: "specimen_black_relic_20",
    item_name: "BLACK RELIC",
    collection_name: "BLACK SPECIMEN",
    rarity: "legendary",
    description: "Уникальный металлический артефакт, содержащий первичный звуковой код лейбла.",
    model_color: "#312E81",
    shape: "icosahedron",
  },

  // -------------------------------------------------------------------------
  // MYTHIC (1.4% Base)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_unknown_001_21",
    item_name: "UNKNOWN-001",
    collection_name: "RESTRICTED VAULT",
    rarity: "mythic",
    description: "Неизвестный объект с секретной маркировкой и гравитационным искажением пространства.",
    model_color: "#F43F5E",
    shape: "icosahedron",
  },
  {
    item_id: "specimen_forbidden_22",
    item_name: "FORBIDDEN",
    collection_name: "RESTRICTED VAULT",
    rarity: "mythic",
    description: "Запечатанный запрещённый образец, изъятый из закрытого архива спецпроектов.",
    model_color: "#BE123C",
    shape: "dodecahedron",
  },
  {
    item_id: "specimen_last_signal_23",
    item_name: "LAST SIGNAL",
    collection_name: "RESTRICTED VAULT",
    rarity: "mythic",
    description: "Уникальный артефакт, непрерывно транслирующий закодированный мастер-сигнал CXRNER.",
    model_color: "#E11D48",
    shape: "octahedron",
  },
  {
    item_id: "specimen_cxrner_original_24",
    item_name: "CXRNER ORIGINAL",
    collection_name: "FOUNDERS EDITION",
    rarity: "mythic",
    description: "Фирменный эксклюзивный артефакт основателей лейбла. Абсолютный статус совершенства.",
    model_color: "#FB7185",
    shape: "torus",
  },

  // -------------------------------------------------------------------------
  // SPECIAL REWARD (0.1% Base) - CXRNER COVER VOUCHER
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_cover_voucher_25",
    item_name: "CXRNER COVER VOUCHER",
    collection_name: "SPECIAL REWARDS",
    rarity: "special_reward",
    description: "Эксклюзивный ваучер на бесплатную обложку для релиза от @kazumaiq. Шанс 0.1%!",
    model_color: "#F59E0B",
    shape: "box",
    is_special_reward: true,
  },
];

export const CXP_QUESTS_CATALOG: CxpQuestItem[] = [
  {
    id: "quest_profile_80",
    title: "Заполнение профиля CXRNER ID",
    description: "Заполни профиль минимум на 80%: имя, аватар, жанры, роль и музыкальные площадки.",
    reward_cxp: 100,
    category: "onboarding",
    action_label: "Заполнить профиль",
    action_href: "/cabinet/profile",
  },
  {
    id: "quest_telegram_link",
    title: "Привязка Telegram аккаунта",
    description: "Привяжи Telegram в профиле для мгновенных уведомлений модерации и синхронизации.",
    reward_cxp: 50,
    category: "social",
    action_label: "Привязать TG",
    action_href: "/cabinet/profile",
  },
  {
    id: "quest_artist_verification",
    title: "Верификация артиста",
    description: "Подтверди свои музыкальные профили на Яндекс Музыке, Spotify или VK Музыке.",
    reward_cxp: 100,
    category: "music",
    action_label: "Пройти верификацию",
    action_href: "/cabinet/verification",
  },
  {
    id: "quest_submit_release",
    title: "Отправка первого релиза",
    description: "Отправь свой трек или альбом на дистрибуцию через форму модерации CXRNER MUSIC.",
    reward_cxp: 150,
    category: "music",
    action_label: "Отправить релиз",
    action_href: "/submit-release",
  },
  {
    id: "quest_invite_artist",
    title: "Приглашение друга-артиста",
    description: "Поделись реферальной ссылкой. Получай 75 CXP за каждого подтверждённого музыканта.",
    reward_cxp: 75,
    category: "referral",
    action_label: "Реферальная сеть",
    action_href: "/cabinet/referrals",
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
