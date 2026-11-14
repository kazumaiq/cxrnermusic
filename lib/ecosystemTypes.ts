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
export type DropRarity = ItemRarity;

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
  project_type?: "solo" | "duo" | "band" | "collective";
  genres?: string[];
  country?: string;
  city?: string | null;
  contact_telegram?: string | null;
  bio?: string | null;
  release_links?: string | null;
  status: VerificationStatus;
  reviewer_notes?: string | null;
  reject_reason?: string | null;
  reward_claimed: boolean;
  created_at: string;
  updated_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  account_summary?: {
    username: string;
    display_name: string;
    email?: string | null;
    avatar_url?: string | null;
    telegram_username?: string | null;
    telegram_id?: string | null;
    telegram_linked?: boolean;
    is_artist_verified: boolean;
    completion_percentage: number;
    country?: string | null;
    city?: string | null;
    bio?: string | null;
    genres: string[];
    music_roles: string[];
    social_links: Array<{ platform: string; url: string }>;
    music_links: Array<{ platform: string; url: string }>;
  };
  artist_profile?: CxrnerArtistProfile | null;
}

export interface DropInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  specimen_code?: string;
  specimen_class?: string;
  collection_name: string;
  rarity: ItemRarity;
  drop_chance?: string;
  serial_number: number;
  description: string;
  image_url: string;
  model_3d_type: "procedural" | "gltf";
  model_color: string;
  obtained_via: string;
  is_equipped: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  is_special_reward?: boolean;
  claim_code?: string;
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
  milestones?: string[];
  referred_username?: string;
  referred_display_name?: string;
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
  specimen_code?: string;
  specimen_class?: "ACCESSORY" | "MEDIA" | "ORGANIC" | "OBJECT" | "ARTIFACT" | "REWARD";
  collection_name: string;
  rarity: ItemRarity;
  drop_chance: string;
  drop_rate_number: number;
  description: string;
  image_url: string;
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
  // COMMON (55% Base — 13.75% each in Case 001)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_cyber_vinyl_01",
    item_name: "CYBER VINYL GENESIS",
    specimen_code: "VN-001",
    specimen_class: "MEDIA",
    collection_name: "GENESIS ARCHIVE",
    rarity: "common",
    drop_chance: "13.75%",
    drop_rate_number: 13.75,
    description: "Первый серийный релиз винила с гравировкой лазером CXRNER-001.",
    image_url: "/drop/items/specimen_cyber_vinyl_01.svg",
    model_color: "#A855F7",
    shape: "cylinder",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_data_key_03",
    item_name: "DATA KEY",
    specimen_code: "DK-003",
    specimen_class: "OBJECT",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "common",
    drop_chance: "13.75%",
    drop_rate_number: 13.75,
    description: "Металлический цифровой ключ с защищённым чипом доступа к звуковым дорожкам.",
    image_url: "/drop/items/specimen_data_key_03.svg",
    model_color: "#94A3B8",
    shape: "box",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_basic_specimen_04",
    item_name: "BASIC SPECIMEN",
    specimen_code: "BS-004",
    specimen_class: "OBJECT",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "common",
    drop_chance: "13.75%",
    drop_rate_number: 13.75,
    description: "Базовый образец коллекции. Запечатанная полимерная капсула архива.",
    image_url: "/drop/items/specimen_basic_specimen_04.svg",
    model_color: "#64748B",
    shape: "cylinder",
    case_id: "case_001_archive",
  },
  {
    item_id: "specimen_chrome_tag_05",
    item_name: "CHROME TAG",
    specimen_code: "TG-005",
    specimen_class: "OBJECT",
    collection_name: "CHROME AGE",
    rarity: "common",
    drop_chance: "13.75%",
    drop_rate_number: 13.75,
    description: "Металлическая маркировочная бирка с лазерной гравировкой серийного номера.",
    image_url: "/drop/items/specimen_chrome_tag_05.svg",
    model_color: "#CBD5E1",
    shape: "box",
    case_id: "case_001_archive",
  },

  // -------------------------------------------------------------------------
  // RARE (25% Base in Case 001 — ~8.33% each)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_archive_cassette_02",
    item_name: "ARCHIVE CASSETTE (CA-037)",
    specimen_code: "CA-037",
    specimen_class: "MEDIA",
    collection_name: "GENESIS ARCHIVE",
    rarity: "rare",
    drop_chance: "8.33%",
    drop_rate_number: 8.33,
    description: "Коллекционная аудиокассета CXRNER ARCHIVE в запечатанном вакуумном пакете с магнитной лентой высокой плотности.",
    image_url: "/drop/items/specimen_archive_cassette_02.jpg",
    model_color: "#00F0FF",
    shape: "box",
  },
  {
    item_id: "specimen_chrome_disc_06",
    item_name: "CHROME DISC (CD-001)",
    specimen_code: "CD-001",
    specimen_class: "MEDIA",
    collection_name: "CHROME AGE",
    rarity: "rare",
    drop_chance: "8.33%",
    drop_rate_number: 8.33,
    description: "Металлический CD-диск с радужной голографической дифракцией и шипованным готическим узором CXRNER в стерильной герметичной капсуле.",
    image_url: "/drop/items/specimen_chrome_disc_06.jpg",
    model_color: "#38BDF8",
    shape: "cylinder",
  },
  {
    item_id: "specimen_chrome_spike_16",
    item_name: "CHROME SPIKE (CR-017)",
    specimen_code: "CR-017",
    specimen_class: "OBJECT",
    collection_name: "CHROME AGE",
    rarity: "rare",
    drop_chance: "8.34%",
    drop_rate_number: 8.34,
    description: "Острый многогранный шипованный артефакт из жидкого хрома с зеркальным титановым напылением.",
    image_url: "/drop/items/specimen_chrome_spike_16.jpg",
    model_color: "#E2E8F0",
    shape: "octahedron",
  },

  // -------------------------------------------------------------------------
  // EPIC (13% Base in Case 001 — 6.50% each)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_violet_visor_13",
    item_name: "VIOLET VISOR (VG-005)",
    specimen_code: "VG-005",
    specimen_class: "ACCESSORY",
    collection_name: "SPECIMEN ARCHIVE",
    rarity: "epic",
    drop_chance: "6.50%",
    drop_rate_number: 6.5,
    description: "Футуристическая маска-визор с фиолетовыми неоновыми линзами и спектральным HUD-интерфейсом звукорежиссёра.",
    image_url: "/drop/items/specimen_violet_visor_13.jpg",
    model_color: "#C084FC",
    shape: "box",
  },
  {
    item_id: "specimen_black_heart_12",
    item_name: "BLACK HEART (HR-009)",
    specimen_code: "HR-009",
    specimen_class: "ORGANIC",
    collection_name: "BLACK SPECIMEN",
    rarity: "epic",
    drop_chance: "6.50%",
    drop_rate_number: 6.5,
    description: "Литое зеркально-чёрное механическое сердце с шипами и сосудами, генерирующее суб-басовые импульсы архива.",
    image_url: "/drop/items/specimen_black_heart_12.jpg",
    model_color: "#A855F7",
    shape: "octahedron",
  },

  // -------------------------------------------------------------------------
  // LEGENDARY (5.5% Base in Case 001 — 1.375% each)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_watcher_eye_11",
    item_name: "WATCHER EYE (EY-004)",
    specimen_code: "EY-004",
    specimen_class: "ORGANIC",
    collection_name: "BLACK SPECIMEN",
    rarity: "legendary",
    drop_chance: "1.375%",
    drop_rate_number: 1.375,
    description: "Биомеханическое око в венце острых хромированных шипов, непрерывно сканирующее звуковое пространство.",
    image_url: "/drop/items/specimen_watcher_eye_11.jpg",
    model_color: "#F59E0B",
    shape: "dodecahedron",
  },
  {
    item_id: "specimen_void_crown_17",
    item_name: "VOID CROWN (CR-003)",
    specimen_code: "CR-003",
    specimen_class: "ACCESSORY",
    collection_name: "BLACK SPECIMEN",
    rarity: "legendary",
    drop_chance: "1.375%",
    drop_rate_number: 1.375,
    description: "Готическая корона из застывшего жидкого хрома с агрессивными пиками правителя звуковой сцены CXRNER.",
    image_url: "/drop/items/specimen_void_crown_17.jpg",
    model_color: "#FCD34D",
    shape: "torus",
  },
  {
    item_id: "specimen_chrome_fang_19",
    item_name: "CHROME FANG BLACK (C1/S-B)",
    specimen_code: "C1/S-B",
    specimen_class: "ARTIFACT",
    collection_name: "CHROME AGE",
    rarity: "legendary",
    drop_chance: "1.375%",
    drop_rate_number: 1.375,
    description: "Чёрная металлическая челюсть хищника с острыми зеркальными клыками в мокром вакуумном пакете архива.",
    image_url: "/drop/items/specimen_chrome_fang_19.jpg",
    model_color: "#FBBF24",
    shape: "dodecahedron",
  },
  {
    item_id: "specimen_white_fang_20",
    item_name: "WHITE FANG SPECIMEN (C1/S-W)",
    specimen_code: "C1/S-W",
    specimen_class: "ARTIFACT",
    collection_name: "CHROME AGE",
    rarity: "legendary",
    drop_chance: "1.375%",
    drop_rate_number: 1.375,
    description: "Матово-белая челюсть хищного образца C1/S в стерильной вакуумной оболочке. Уникальная редкая альбинос-мутация.",
    image_url: "/drop/items/specimen_white_fang_20.jpg",
    model_color: "#FFFFFF",
    shape: "dodecahedron",
  },

  // -------------------------------------------------------------------------
  // MYTHIC (1.4% Base in Case 001 — 1.40%)
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_cxrner_original_24",
    item_name: "CHROMATIC FANG // CXRNER ORIGINAL (GLITCH-01)",
    specimen_code: "GLITCH-01",
    specimen_class: "ARTIFACT",
    collection_name: "FOUNDERS EDITION",
    rarity: "mythic",
    drop_chance: "1.40%",
    drop_rate_number: 1.4,
    description: "Сверхредкий хроматический глитч-артефакт. Разложение цветового спектра на клыках хищника — символ основания CXRNER.",
    image_url: "/drop/items/specimen_cxrner_original_24.jpg",
    model_color: "#F43F5E",
    shape: "icosahedron",
  },

  // -------------------------------------------------------------------------
  // SPECIAL REWARDS (0.1% Base in All Cases) - REAL-WORLD LABEL PERKS
  // -------------------------------------------------------------------------
  {
    item_id: "specimen_cover_voucher_25",
    item_name: "CXRNER COVER VOUCHER (CV-2026)",
    specimen_code: "CV-2026",
    specimen_class: "REWARD",
    collection_name: "SPECIAL REWARDS",
    rarity: "special_reward",
    drop_chance: "0.025%",
    drop_rate_number: 0.025,
    description: "Эксклюзивный сертификат на бесплатную разработку официальной обложки релиза лично от креативного директора @kazumaiq.",
    image_url: "/drop/items/specimen_cover_voucher_25.svg",
    model_color: "#F59E0B",
    shape: "box",
    is_special_reward: true,
  },
  {
    item_id: "specimen_fasttrack_pitch_26",
    item_name: "FAST-TRACK PITCHING VOUCHER (FP-2026)",
    specimen_code: "FP-2026",
    specimen_class: "REWARD",
    collection_name: "SPECIAL REWARDS",
    rarity: "special_reward",
    drop_chance: "0.025%",
    drop_rate_number: 0.025,
    description: "Сертификат на приоритетную модерацию без очереди (24ч) и прямой редакционный питчинг релиза кураторам плейлистов от команды CXRNER MUSIC.",
    image_url: "/drop/items/specimen_cover_voucher_25.svg",
    model_color: "#00F0FF",
    shape: "box",
    is_special_reward: true,
  },
  {
    item_id: "specimen_royalty_boost_27",
    item_name: "ROYALTY BOOST 85/15 (RB-2026)",
    specimen_code: "RB-2026",
    specimen_class: "REWARD",
    collection_name: "SPECIAL REWARDS",
    rarity: "special_reward",
    drop_chance: "0.025%",
    drop_rate_number: 0.025,
    description: "Премиальный контрактный апгрейд роялти: повышенная ставка 85% в пользу артиста (вместо базовых 70/30) на весь следующий релиз.",
    image_url: "/drop/items/specimen_cover_voucher_25.svg",
    model_color: "#A855F7",
    shape: "box",
    is_special_reward: true,
  },
  {
    item_id: "specimen_label_promo_28",
    item_name: "LABEL PROMO SPOT (LP-2026)",
    specimen_code: "LP-2026",
    specimen_class: "REWARD",
    collection_name: "SPECIAL REWARDS",
    rarity: "special_reward",
    drop_chance: "0.025%",
    drop_rate_number: 0.025,
    description: "Официальный промо-слот лейбла: закреп релиза и публикация персонального анонса в медиа-ресурсах и витрине CXRNER MUSIC.",
    image_url: "/drop/items/specimen_cover_voucher_25.svg",
    model_color: "#F43F5E",
    shape: "box",
    is_special_reward: true,
  },
];

export const SALVAGE_CXP_BY_RARITY: Record<string, number> = {
  common: 15,
  rare: 30,
  epic: 55,
  legendary: 120,
  mythic: 250,
  special_reward: 500,
};

export const FUSION_NEXT_RARITY: Record<string, ItemRarity | null> = {
  common: "rare",
  rare: "epic",
  epic: "legendary",
  legendary: "mythic",
  mythic: null,
  special_reward: null,
};

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
    key: "FOUNDER_SOVEREIGN",
    name: "FOUNDER & CEO // CXRNER",
    description: "Основатель, владелец и главный архитектор музыкальной экосистемы CXRNER MUSIC.",
    icon: "Crown",
    rarity: "special_reward",
    cxp_reward: 1000,
  },
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

export const CEO_USERNAME = "kazumaiq";
export const CEO_EMAIL = "kazumaiq.music@gmail.com";

export function isCeoAccount(input?: {
  username?: string | null;
  email?: string | null;
  badge?: string | null;
  title?: string | null;
}): boolean {
  if (!input) return false;
  const u = String(input.username || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const e = String(input.email || "")
    .trim()
    .toLowerCase();
  const b = String(input.badge || "")
    .trim()
    .toLowerCase();
  const t = String(input.title || "")
    .trim()
    .toLowerCase();
  return (
    u === CEO_USERNAME ||
    e === CEO_EMAIL ||
    b === "ceo_founder" ||
    t.includes("founder & ceo")
  );
}

export const COSMETIC_FRAMES = [
  { id: "frame-ceo-sovereign", name: "👑 Sovereign Founder Crown", previewColor: "#FBBF24", ceoOnly: true },
  { id: "frame-cyber-chrome", name: "Cyber Chrome Halo", previewColor: "#E2E8F0" },
  { id: "frame-neon-purple", name: "Neon Void Pulse", previewColor: "#8737FF" },
  { id: "frame-mythic-gold", name: "Underground Mythic", previewColor: "#F59E0B" },
  { id: "frame-glitch-cyan", name: "Quantum Cyan Flare", previewColor: "#00F0FF" },
];

export const COSMETIC_EFFECTS = [
  {
    id: "effect-ceo-crown",
    name: "👑 Founder Imperial Aura",
    className:
      "ring-4 ring-amber-400/90 shadow-[0_0_40px_rgba(251,191,36,0.75),0_0_80px_rgba(0,240,255,0.45)]",
    ceoOnly: true,
  },
  { id: "effect-purple-aura", name: "Cosmic Purple Aura", className: "ring-2 ring-[#B46BFF]/70 shadow-[0_0_24px_rgba(180,107,255,0.6)]" },
  { id: "effect-cyan-pulse", name: "Electric Cyan Pulse", className: "ring-2 ring-[#00F0FF]/70 shadow-[0_0_24px_rgba(0,240,255,0.6)]" },
  { id: "effect-chrome-sheen", name: "Liquid Chrome Sheen", className: "ring-2 ring-white/80 shadow-[0_0_20px_rgba(255,255,255,0.7)]" },
];

export const COSMETIC_TITLES = [
  "FOUNDER & CEO // CXRNER MUSIC",
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
