"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
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
} from "lucide-react";
import type { CxrnerProfile, MusicRole, ProfileCompletionResult } from "@/lib/ecosystemTypes";
import { COSMETIC_FRAMES, COSMETIC_EFFECTS, COSMETIC_TITLES } from "@/lib/ecosystemTypes";

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
  "Drill",
  "Indie Rock",
  "R&B",
  "Phonk",
  "Ambient",
  "Synthwave",
];

export default function ProfileEditorClient({
  initialProfile,
  initialCompletion,
  userEmail,
}: ProfileEditorClientProps) {
  const [profile, setProfile] = useState<CxrnerProfile>(initialProfile);
  const [completion, setCompletion] = useState<ProfileCompletionResult>(initialCompletion);
  const [saving, setSaving] = useState(false);
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
  const [privacy, setPrivacy] = useState(profile.privacy_settings);

  const toggleRole = (role: MusicRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const addGenre = () => {
    const val = genreInput.trim();
    if (val && !selectedGenres.includes(val)) {
      setSelectedGenres([...selectedGenres, val]);
      setGenreInput("");
    }
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter((g) => g !== genre));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Build links arrays
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

      if (data.rewardsAwarded && data.rewardsAwarded.length > 0) {
        setMessage({
          type: "success",
          text: "Профиль сохранён! Разблокированы новые награды и начислены CXP!",
        });
      } else {
        setMessage({ type: "success", text: "Профиль успешно обновлён" });
      }
    } catch {
      setMessage({ type: "error", text: "Ошибка сети при сохранении" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <User className="w-4 h-4 text-[#00F0FF]" />
            <span>CXRNER ID // НАСТРОЙКИ ПРОФИЛЯ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Цифровой Профиль Артиста
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Управляйте вашей артистической идентичностью, коллекцией предметов и публичной страницей.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${profile.username}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-mono font-medium text-white transition active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Публичная страница</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-energy inline-flex items-center gap-2 px-5 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-bold"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Сохранение..." : "Сохранить"}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 font-sans text-xs sm:text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* =========================================================================
          PROFILE COMPLETION CARD (0 - 100%)
         ========================================================================= */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#090611] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00F0FF]">
              ПРОГРЕСС ИДЕНТИЧНОСТИ
            </span>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              PROFILE COMPLETION — {completion.total}%
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            {completion.total >= 80 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                <Check className="w-3.5 h-3.5" />
                БОНУС +100 CXP ПОЛУЧЕН
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#B46BFF]">
                Награда на 80%: +100 CXP & Бейдж
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#8737FF] via-[#B46BFF] to-[#00F0FF] transition-all duration-700 ease-out shadow-[0_0_12px_#8737FF]"
            style={{ width: `${completion.total}%` }}
          />
        </div>

        {/* Breakdown Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
          {Object.entries(completion.breakdown).map(([key, item]) => (
            <div
              key={key}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                item.done
                  ? "bg-emerald-500/10 border-emerald-500/20 text-white"
                  : "bg-white/5 border-white/10 text-[#D9D9E2]/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    item.done ? "bg-emerald-500 text-black font-bold" : "bg-white/10 text-white/40"
                  }`}
                >
                  {item.done ? "✓" : "○"}
                </div>
                <span>{item.label}</span>
              </div>
              <span className="font-bold">+{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Basic Identity */}
          <div className="p-6 rounded-3xl bg-[#090611]/70 border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#8737FF]" />
              <span>1. Основные данные</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Отображаемое имя *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Например: KAZUMA"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
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
                    placeholder="kazuma"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none font-mono transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                Bio / О себе (минимум 10 символов)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о вашей музыке, релизах, творческом пути..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Страна
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Россия, Беларусь, Казахстан..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Город (по желанию)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва, Санкт-Петербург..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  URL Аватара
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-xs font-mono outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  URL Обложки (Баннер)
                </label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-xs font-mono outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Musical Roles & Genres */}
          <div className="p-6 rounded-3xl bg-[#090611]/70 border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-[#00F0FF]" />
              <span>2. Музыкальная роль & Жанры</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Роли в музыке (можно выбрать несколько)
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                        isSelected
                          ? "bg-[#8737FF] text-white border border-[#8737FF] shadow-[0_0_12px_rgba(135,55,255,0.4)] font-bold"
                          : "bg-white/5 text-[#D9D9E2]/70 border border-white/15 hover:border-white/30"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Любимые музыкальные жанры
              </label>
              <div className="flex items-center gap-2 mb-2">
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
                  placeholder="Введите жанр и нажмите Enter..."
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={addGenre}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition"
                >
                  Добавить
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedGenres.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8737FF]/20 border border-[#8737FF]/40 text-[#B46BFF] text-xs font-mono"
                  >
                    <span>#{g}</span>
                    <button
                      type="button"
                      onClick={() => removeGenre(g)}
                      className="text-[#D9D9E2]/60 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Music DSP Links */}
          <div className="p-6 rounded-3xl bg-[#090611]/70 border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#8737FF]" />
              <span>3. Ссылки на музыку & DSP площадки</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Spotify профиль
                </label>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Apple Music профиль
                </label>
                <input
                  type="url"
                  value={appleUrl}
                  onChange={(e) => setAppleUrl(e.target.value)}
                  placeholder="https://music.apple.com/artist/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Яндекс Музыка карточка
                </label>
                <input
                  type="url"
                  value={yandexUrl}
                  onChange={(e) => setYandexUrl(e.target.value)}
                  placeholder="https://music.yandex.ru/artist/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  VK Музыка страница
                </label>
                <input
                  type="url"
                  value={vkUrl}
                  onChange={(e) => setVkUrl(e.target.value)}
                  placeholder="https://vk.com/artist/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  SoundCloud
                </label>
                <input
                  type="url"
                  value={soundcloudUrl}
                  onChange={(e) => setSoundcloudUrl(e.target.value)}
                  placeholder="https://soundcloud.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  YouTube канал
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Socials */}
          <div className="p-6 rounded-3xl bg-[#090611]/70 border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00F0FF]" />
              <span>4. Социальные сети</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Instagram
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
                  Telegram канал / группа
                </label>
                <input
                  type="url"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Equips & Privacy */}
        <div className="space-y-8">
          {/* Equip Room */}
          <div className="p-6 rounded-3xl bg-[#090611]/70 border border-white/10 space-y-5">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#B46BFF]" />
              <span>Экипировка профиля</span>
            </h3>

            {/* Frame */}
            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Рамка аватара (Profile Frame)
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setEquippedFrame("")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono border transition ${
                    !equippedFrame ? "bg-white/10 border-white text-white" : "border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  По умолчанию
                </button>
                {COSMETIC_FRAMES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEquippedFrame(f.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono border flex items-center justify-between transition ${
                      equippedFrame === f.id
                        ? "bg-[#8737FF]/20 border-[#8737FF] text-white font-bold"
                        : "border-white/10 text-[#D9D9E2]/60 hover:text-white"
                    }`}
                  >
                    <span>{f.name}</span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: f.previewColor }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Aura Effect */}
            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Эффект свечения (Avatar Effect)
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setEquippedEffect("")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono border transition ${
                    !equippedEffect ? "bg-white/10 border-white text-white" : "border-white/10 text-[#D9D9E2]/60"
                  }`}
                >
                  Без эффекта
                </button>
                {COSMETIC_EFFECTS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEquippedEffect(e.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono border transition ${
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

            {/* Title */}
            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
                Титул в профиле
              </label>
              <select
                value={equippedTitle}
                onChange={(e) => setEquippedTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
              >
                <option value="">Без титула</option>
                {COSMETIC_TITLES.map((t) => (
                  <option key={t} value={t} className="bg-[#090611] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="p-6 rounded-3xl bg-[#090611]/70 border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#00F0FF]" />
              <span>Настройки приватности</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs font-mono text-[#D9D9E2]/80 cursor-pointer">
                <span>Публичный профиль</span>
                <input
                  type="checkbox"
                  checked={privacy.is_public}
                  onChange={(e) => setPrivacy({ ...privacy, is_public: e.target.checked })}
                  className="rounded bg-white/10 border-white/20 text-[#8737FF] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-mono text-[#D9D9E2]/80 cursor-pointer">
                <span>Показывать инвентарь DROP</span>
                <input
                  type="checkbox"
                  checked={privacy.show_inventory}
                  onChange={(e) => setPrivacy({ ...privacy, show_inventory: e.target.checked })}
                  className="rounded bg-white/10 border-white/20 text-[#8737FF] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-mono text-[#D9D9E2]/80 cursor-pointer">
                <span>Показывать музыкальные ссылки</span>
                <input
                  type="checkbox"
                  checked={privacy.show_music}
                  onChange={(e) => setPrivacy({ ...privacy, show_music: e.target.checked })}
                  className="rounded bg-white/10 border-white/20 text-[#8737FF] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-mono text-[#D9D9E2]/80 cursor-pointer">
                <span>Участие в рейтинге рефералов</span>
                <input
                  type="checkbox"
                  checked={privacy.show_in_leaderboard}
                  onChange={(e) => setPrivacy({ ...privacy, show_in_leaderboard: e.target.checked })}
                  className="rounded bg-white/10 border-white/20 text-[#8737FF] focus:ring-0"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
