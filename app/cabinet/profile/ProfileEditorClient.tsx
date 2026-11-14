"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Save,
  Globe,
  Music,
  Sliders,
  Crown,
  Eye,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import type { CxrnerProfile, MusicRole, ProfileCompletionResult } from "@/lib/ecosystemTypes";
import { COSMETIC_FRAMES, COSMETIC_EFFECTS, COSMETIC_TITLES } from "@/lib/ecosystemTypes";
import ImageUploadField from "@/components/profile/ImageUploadField";
import ProfileHeroCard from "@/components/profile/ProfileHeroCard";

interface ProfileEditorClientProps {
  initialProfile: CxrnerProfile;
  initialCompletion: ProfileCompletionResult;
  userEmail: string;
}

const ALL_ROLES: MusicRole[] = [
  "Artist",
  "Producer",
  "DJ",
  "Vocalist",
  "Beatmaker",
  "Songwriter",
  "Sound Designer",
  "Listener",
  "Other",
];

const POPULAR_GENRES = [
  "Hip-Hop",
  "Trap",
  "Hyperpop",
  "Electronic",
  "Phonk",
  "Dark Wave",
  "R&B",
  "Ambient",
  "Synthwave",
];

type EditorTab = "visuals" | "music" | "style";

export default function ProfileEditorClient({
  initialProfile,
  initialCompletion,
  userEmail,
}: ProfileEditorClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<CxrnerProfile>(initialProfile);
  const [completion, setCompletion] = useState<ProfileCompletionResult>(initialCompletion);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("visuals");
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [country, setCountry] = useState(profile.country || "RU");
  const [city, setCity] = useState(profile.city || "");
  const [selectedRoles, setSelectedRoles] = useState<MusicRole[]>(profile.music_roles || ["Artist"]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(profile.genres || []);
  const [genreInput, setGenreInput] = useState("");

  // Music & Social Links
  const [spotifyUrl, setSpotifyUrl] = useState(
    profile.music_links?.find((l) => l.platform.toLowerCase() === "spotify")?.url || ""
  );
  const [appleUrl, setAppleUrl] = useState(
    profile.music_links?.find((l) => l.platform.toLowerCase() === "apple music")?.url || ""
  );
  const [yandexUrl, setYandexUrl] = useState(
    profile.music_links?.find((l) => l.platform.toLowerCase() === "яндекс музыка")?.url || ""
  );
  const [vkUrl, setVkUrl] = useState(
    profile.music_links?.find((l) => l.platform.toLowerCase() === "vk музыка")?.url || ""
  );
  const [soundcloudUrl, setSoundcloudUrl] = useState(
    profile.music_links?.find((l) => l.platform.toLowerCase() === "soundcloud")?.url || ""
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    profile.music_links?.find((l) => l.platform.toLowerCase() === "youtube")?.url || ""
  );

  const [instagramUrl, setInstagramUrl] = useState(
    profile.social_links?.find((l) => l.platform.toLowerCase() === "instagram")?.url || ""
  );
  const [telegramUrl, setTelegramUrl] = useState(
    profile.social_links?.find((l) => l.platform.toLowerCase() === "telegram")?.url || ""
  );

  // Cosmetic Equips
  const [equippedFrame, setEquippedFrame] = useState(profile.equipped_frame || "");
  const [equippedEffect, setEquippedEffect] = useState(profile.equipped_effect || "");
  const [equippedTitle, setEquippedTitle] = useState(profile.equipped_title || "");

  // Privacy
  const [privacy, setPrivacy] = useState(
    profile.privacy_settings || {
      is_public: true,
      show_inventory: true,
      show_music: true,
      show_in_leaderboard: true,
    }
  );

  const buildLinkArrays = () => {
    const musicLinks = [
      spotifyUrl ? { platform: "Spotify", url: spotifyUrl } : null,
      appleUrl ? { platform: "Apple Music", url: appleUrl } : null,
      yandexUrl ? { platform: "Яндекс Музыка", url: yandexUrl } : null,
      vkUrl ? { platform: "VK Музыка", url: vkUrl } : null,
      soundcloudUrl ? { platform: "SoundCloud", url: soundcloudUrl } : null,
      youtubeUrl ? { platform: "YouTube", url: youtubeUrl } : null,
    ].filter(Boolean) as Array<{ platform: string; url: string }>;

    const socialLinks = [
      instagramUrl ? { platform: "Instagram", url: instagramUrl } : null,
      telegramUrl ? { platform: "Telegram", url: telegramUrl } : null,
    ].filter(Boolean) as Array<{ platform: string; url: string }>;

    return { musicLinks, socialLinks };
  };

  const livePreviewProfile: CxrnerProfile = useMemo(() => {
    const { musicLinks, socialLinks } = buildLinkArrays();
    return {
      ...profile,
      display_name: displayName || profile.display_name,
      username: username || profile.username,
      avatar_url: avatarUrl || null,
      banner_url: bannerUrl || null,
      bio: bio || null,
      country: country || "RU",
      city: city || null,
      genres: selectedGenres,
      music_roles: selectedRoles,
      music_links: musicLinks,
      social_links: socialLinks,
      equipped_frame: equippedFrame || null,
      equipped_effect: equippedEffect || null,
      equipped_title: equippedTitle || null,
    };
  }, [
    profile,
    displayName,
    username,
    avatarUrl,
    bannerUrl,
    bio,
    country,
    city,
    selectedGenres,
    selectedRoles,
    spotifyUrl,
    appleUrl,
    yandexUrl,
    vkUrl,
    soundcloudUrl,
    youtubeUrl,
    instagramUrl,
    telegramUrl,
    equippedFrame,
    equippedEffect,
    equippedTitle,
  ]);

  const toggleRole = (role: MusicRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const addGenre = (custom?: string) => {
    const val = (custom ?? genreInput).trim();
    if (val && !selectedGenres.includes(val)) {
      setSelectedGenres([...selectedGenres, val]);
      if (!custom) setGenreInput("");
    }
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter((g) => g !== genre));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const { musicLinks, socialLinks } = buildLinkArrays();

    try {
      const res = await fetch("/api/cabinet/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          avatarUrl,
          bannerUrl,
          bio,
          country,
          city,
          genres: selectedGenres,
          musicRoles: selectedRoles,
          musicLinks,
          socialLinks,
          privacySettings: privacy,
          equippedFrame: equippedFrame || null,
          equippedEffect: equippedEffect || null,
          equippedTitle: equippedTitle || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage({ type: "error", text: data.error || "Ошибка при сохранении профиля" });
        return;
      }

      setProfile(data.profile);
      setCompletion(data.completion);
      if (data.profile) {
        setUsername(data.profile.username || username);
        setDisplayName(data.profile.display_name || "");
        setAvatarUrl(data.profile.avatar_url || "");
        setBannerUrl(data.profile.banner_url || "");
        if (data.profile.privacy_settings) {
          setPrivacy(data.profile.privacy_settings);
        }
      }
      router.refresh();

      if (data.rewardsAwarded && data.rewardsAwarded.length > 0) {
        setMessage({
          type: "success",
          text: "Профиль сохранён! Разблокированы новые награды и начислены CXP!",
        });
      } else {
        setMessage({ type: "success", text: "Изменения сохранены и уже видны в публичном профиле!" });
      }
    } catch {
      setMessage({ type: "error", text: "Ошибка сети при сохранении" });
    } finally {
      setSaving(false);
    }
  };

  const isCeoSovereign =
    userEmail.trim().toLowerCase() === "kazumaiq.music@gmail.com" ||
    username.trim().toLowerCase() === "kazumaiq" ||
    profile.equipped_badge === "ceo_founder";

  return (
    <div className="space-y-6 animate-fadeIn">
      {isCeoSovereign && (
        <div className="p-5 rounded-3xl bg-[#110D16] border border-[#F59E0B]/45 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[10px] font-mono font-bold uppercase tracking-widest text-[#FDE68A]">
              <span>👑 SOVEREIGN FOUNDER & CEO ACCOUNT</span>
              <span className="text-[#00F0FF]">// ROOT #000001</span>
            </div>
            <h2 className="font-display font-black text-lg text-white">
              {displayName || "KAZUMA"} (@{profile.username}) · {userEmail}
            </h2>
            <p className="text-xs text-[#D9D9E2]/70">
              Резерв основателя: 99,999 CXP, артефакты #000001, рамка Sovereign Gold и доступ ко всем разделам админ-панели.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 border border-[#F59E0B]/50 text-[11px] font-mono font-bold text-[#FDE68A] uppercase tracking-wider transition"
            >
              ⚡ Админ-панель
            </Link>
            <Link
              href="/admin/drop"
              className="px-3.5 py-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[11px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider transition"
            >
              📦 Админка DROP
            </Link>
          </div>
        </div>
      )}

      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <User className="w-4 h-4 text-[#00F0FF]" />
            <span>CXRNER ID // СТУДИЯ КАСТОМИЗАЦИИ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
            Настройка профиля артиста
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/65 mt-0.5">
            Загрузите аватарку и баннер, выберите рамку и ссылки — изменения видны в реальном времени.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/profile/${profile.username}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-mono font-medium text-white transition"
          >
            <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Открыть профиль</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-energy inline-flex items-center gap-2 px-5 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-bold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Сохранение..." : "Сохранить"}</span>
          </button>
        </div>
      </div>

      {/* Save Status Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 font-sans text-xs sm:text-sm ${
            message.type === "success"
              ? "bg-emerald-500/12 border-emerald-500/40 text-emerald-200"
              : "bg-rose-500/12 border-rose-500/40 text-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Compact Profile Completion Meter */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0A15] border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00F0FF]">
              Заполнено: {completion.total}%
            </span>
            {completion.total >= 80 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10px] font-bold">
                <Check className="w-3 h-3" /> Бонус +100 CXP получен
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#D8B4FE] font-mono text-[10px]">
                На 80%: +100 CXP и бейдж
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowMobilePreview((v) => !v)}
            className="lg:hidden px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 font-mono text-[10px] text-white uppercase"
          >
            {showMobilePreview ? "Скрыть превью" : "Показать превью"}
          </button>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8737FF] via-[#B46BFF] to-[#00F0FF] transition-all duration-500"
            style={{ width: `${completion.total}%` }}
          />
        </div>
      </div>

      {/* Live WYSIWYG Preview */}
      {showMobilePreview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Живой предпросмотр твоей карточки CXRNER ID
            </span>
            <span className="font-mono text-[10px] text-[#00F0FF]">
              cxrnermusic.vercel.app/profile/{username || profile.username}
            </span>
          </div>
          <ProfileHeroCard profile={livePreviewProfile} previewMode />
        </div>
      )}

      {/* Clean Customizer Tabs */}
      <div className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#0C0A15] border border-white/10">
        {[
          { key: "visuals" as EditorTab, label: "Фото и О себе", icon: ImageIcon },
          { key: "music" as EditorTab, label: "Роли, Жанры и Ссылки", icon: Music },
          { key: "style" as EditorTab, label: "Рамка, Свечение и Приватность", icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                active
                  ? "bg-white text-[#050407] font-bold shadow-md"
                  : "text-[#D9D9E2]/65 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PHOTOS & BASIC INFO */}
      {activeTab === "visuals" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ImageUploadField
              label="Фото аватара"
              kind="avatar"
              value={avatarUrl}
              onChange={setAvatarUrl}
              hint="Квадратное фото с устройства или прямая ссылка"
            />
            <ImageUploadField
              label="Баннер (Шапка профиля)"
              kind="banner"
              value={bannerUrl}
              onChange={setBannerUrl}
              hint="Широкая обложка 16:5 с устройства или прямая ссылка"
            />
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#0C0A15] border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#00F0FF]" />
              <span>Основные данные</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Отображаемое имя *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Например: KAZUMA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Уникальный username *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#D9D9E2]/40">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="kazumaiq"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none font-mono transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                Bio / О себе
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о вашей музыке, релизах и творчестве..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Страна
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Россия, Казахстан, KG..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Город
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва, Бишкек..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES, GENRES, MUSIC & SOCIAL LINKS */}
      {activeTab === "music" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0C0A15] border border-white/10 space-y-5">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-[#00F0FF]" />
              <span>Роли и жанры</span>
            </h3>

            <div>
              <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Роли в музыке
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                        isSelected
                          ? "bg-[#8737FF] text-white border border-[#8737FF] font-bold"
                          : "bg-black/40 text-[#D9D9E2]/70 border border-white/15 hover:border-white/30"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider">
                Жанры (можно выбрать готовые или ввести свой)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_GENRES.map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => (selectedGenres.includes(pg) ? removeGenre(pg) : addGenre(pg))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition cursor-pointer ${
                      selectedGenres.includes(pg)
                        ? "bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#00F0FF] font-bold"
                        : "bg-white/[0.04] border-white/10 text-white/65 hover:text-white"
                    }`}
                  >
                    + {pg}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGenre();
                    }
                  }}
                  placeholder="Свой жанр + Enter..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => addGenre()}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition cursor-pointer"
                >
                  Добавить
                </button>
              </div>

              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#D8B4FE] text-xs font-mono"
                    >
                      <span>#{g}</span>
                      <button
                        type="button"
                        onClick={() => removeGenre(g)}
                        className="text-white/60 hover:text-white cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#0C0A15] border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#B46BFF]" />
              <span>Музыкальные площадки и соцсети</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  Яндекс Музыка
                </label>
                <input
                  type="url"
                  value={yandexUrl}
                  onChange={(e) => setYandexUrl(e.target.value)}
                  placeholder="https://music.yandex.ru/artist/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  VK Музыка
                </label>
                <input
                  type="url"
                  value={vkUrl}
                  onChange={(e) => setVkUrl(e.target.value)}
                  placeholder="https://vk.com/artist/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  Spotify
                </label>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  Apple Music
                </label>
                <input
                  type="url"
                  value={appleUrl}
                  onChange={(e) => setAppleUrl(e.target.value)}
                  placeholder="https://music.apple.com/artist/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  SoundCloud
                </label>
                <input
                  type="url"
                  value={soundcloudUrl}
                  onChange={(e) => setSoundcloudUrl(e.target.value)}
                  placeholder="https://soundcloud.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  YouTube
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  Telegram
                </label>
                <input
                  type="url"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#D9D9E2]/65 uppercase mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COSMETICS & PRIVACY */}
      {activeTab === "style" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0C0A15] border border-white/10 space-y-5">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#B46BFF]" />
              <span>Рамки, свечение и титул</span>
            </h3>

            <div>
              <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Рамка аватара
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEquippedFrame("")}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                    !equippedFrame ? "bg-white/12 border-white text-white font-bold" : "border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  По умолчанию
                </button>
                {COSMETIC_FRAMES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEquippedFrame(f.id)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-mono border flex items-center justify-between transition cursor-pointer ${
                      equippedFrame === f.id
                        ? "bg-[#8737FF]/20 border-[#8737FF] text-white font-bold"
                        : "border-white/10 text-[#D9D9E2]/60 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 ml-2"
                      style={{ backgroundColor: f.previewColor }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Эффект свечения
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEquippedEffect("")}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                    !equippedEffect ? "bg-white/12 border-white text-white font-bold" : "border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  Без эффекта
                </button>
                {COSMETIC_EFFECTS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEquippedEffect(e.id)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                      equippedEffect === e.id
                        ? "bg-[#8737FF]/20 border-[#8737FF] text-white font-bold"
                        : "border-white/10 text-[#D9D9E2]/60 hover:text-white"
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Титул в профиле
              </label>
              <select
                value={equippedTitle}
                onChange={(e) => setEquippedTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono outline-none"
              >
                <option value="">Без титула</option>
                {COSMETIC_TITLES.map((t) => (
                  <option key={t} value={t} className="bg-[#0C0A15] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#0C0A15] border border-white/10 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00F0FF]" />
                <span>Настройки приватности</span>
              </h3>

              <div className="space-y-3">
                {[
                  { key: "is_public", label: "Публичный профиль доступен по ссылке" },
                  { key: "show_inventory", label: "Показывать инвентарь и витрину DROP" },
                  { key: "show_music", label: "Показывать ссылки на музыкальные площадки" },
                  { key: "show_in_leaderboard", label: "Участвовать в рейтинге коллекционеров" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/35 border border-white/10 text-xs font-mono text-[#D9D9E2]/90 cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean((privacy as any)?.[opt.key] ?? true)}
                      onChange={(e) =>
                        setPrivacy({
                          ...(privacy || {
                            is_public: true,
                            show_inventory: true,
                            show_music: true,
                            show_in_leaderboard: true,
                          }),
                          [opt.key]: e.target.checked,
                        })
                      }
                      className="rounded bg-white/10 border-white/20 text-[#8737FF] focus:ring-0"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-energy inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Сохранение изменений..." : "Сохранить все изменения"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-energy inline-flex items-center gap-2 px-7 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold cursor-pointer shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Сохранение..." : "Сохранить изменения профиля"}</span>
        </button>
      </div>
    </div>
  );
}
