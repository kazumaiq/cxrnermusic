"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  ExternalLink,
  Paintbrush,
  BarChart2,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
} from "lucide-react";

interface PlatformItem {
  id?: string;
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
  is_enabled: boolean;
  display_order?: number;
}

interface SmartLinkFull {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  slug: string;
  upc?: string | null;
  isrc?: string | null;
  release_date?: string | null;
  release_type?: string;
  genre?: string;
  label_name?: string;
  description?: string | null;
  status: string;
  is_out_now: boolean;
  auto_out_now: boolean;
  template: string;
  social_links?: Array<{ platform: string; url: string }>;
  platforms?: PlatformItem[];
}

export default function EditLinkClient({ initialLink, initialPlatforms }: { initialLink: SmartLinkFull; initialPlatforms: PlatformItem[] }) {
  const router = useRouter();

  const [title, setTitle] = useState(initialLink.title);
  const [artist, setArtist] = useState(initialLink.artist);
  const [coverUrl, setCoverUrl] = useState(initialLink.cover_url);
  const [slug, setSlug] = useState(initialLink.slug);
  const [upc, setUpc] = useState(initialLink.upc || "");
  const [isrc, setIsrc] = useState(initialLink.isrc || "");
  const [releaseDate, setReleaseDate] = useState(initialLink.release_date ? initialLink.release_date.split("T")[0] : "");
  const [releaseType, setReleaseType] = useState(initialLink.release_type || "single");
  const [genre, setGenre] = useState(initialLink.genre || "Electronic");
  const [labelName, setLabelName] = useState(initialLink.label_name || "CXRNER MUSIC");
  const [description, setDescription] = useState(initialLink.description || "");
  const [status, setStatus] = useState(initialLink.status || "published");
  const [isOutNow, setIsOutNow] = useState(initialLink.is_out_now);
  const [autoOutNow, setAutoOutNow] = useState(initialLink.auto_out_now);
  const [platforms, setPlatforms] = useState<PlatformItem[]>(initialPlatforms);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);

  const updatePlatform = (index: number, updates: Partial<PlatformItem>) => {
    setPlatforms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addCustomPlatform = () => {
    setPlatforms((prev) => [
      ...prev,
      {
        platform_key: `custom_${Date.now()}`,
        platform_name: "Новая площадка",
        url: "",
        button_text: isOutNow ? "Слушать" : "Pre-save",
        is_enabled: true,
      },
    ]);
  };

  const removePlatform = (index: number) => {
    setPlatforms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const payload = {
        title,
        artist,
        cover_url: coverUrl,
        slug,
        upc: upc || null,
        isrc: isrc || null,
        release_date: releaseDate || null,
        release_type: releaseType,
        genre,
        label_name: labelName,
        description,
        status,
        is_out_now: isOutNow,
        auto_out_now: autoOutNow,
        platforms,
      };

      const res = await fetch(`/api/link/${initialLink.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setSaveError(data.error || "Ошибка сохранения");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch {
      setSaveError("Сбой сети. Попробуйте снова.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const url = `https://link.cxrnermusic.com/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/links"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#D9D9E2] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-heavy text-2xl sm:text-3xl uppercase tracking-tight text-white truncate max-w-md">
              Редактирование: {title}
            </h1>
            <div className="flex items-center gap-2 font-mono text-xs text-[#B46BFF] mt-0.5">
              <span>link.cxrnermusic.com/{slug}</span>
              <button type="button" onClick={handleCopyLink} className="hover:text-white transition">
                {copied ? <Check className="w-3 h-3 text-[#00F0FF]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/dashboard/links/${initialLink.id}/design`}
            className="px-4 py-2.5 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-xs uppercase tracking-wider font-bold transition flex items-center gap-2"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Page Builder</span>
          </Link>

          <Link
            href={`/dashboard/links/${initialLink.id}/analytics`}
            className="px-4 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-[#D9D9E2] font-mono text-xs uppercase tracking-wider transition flex items-center gap-2"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Аналитика</span>
          </Link>

          <a
            href={`/link/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white transition"
            title="Открыть публичную страницу"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-energy px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2 shadow-[0_0_20px_rgba(135,55,255,0.4)] disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Сохранение..." : "Сохранить"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-xs text-white flex items-center gap-2 font-mono">
          <Check className="w-4 h-4 text-[#00F0FF]" />
          <span>Все изменения успешно сохранены и синхронизированы!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-xs text-white flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-[#FF2E93]" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Cover & Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-3xl border border-white/10 bg-[#090611]/80 space-y-4">
            <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block">
              Обложка релиза:
            </label>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/60 border border-white/20">
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <input
              type="url"
              required
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
            />
          </div>

          {/* Status & Out Now Box */}
          <div className="p-5 rounded-3xl border border-white/10 bg-[#090611]/80 space-y-4">
            <h3 className="font-heavy text-base uppercase text-white">Статус страницы</h3>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60 block mb-1">
                Публикация:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B46BFF] focus:outline-none font-mono"
              >
                <option value="published" className="bg-[#090611]">Опубликовано (Published)</option>
                <option value="draft" className="bg-[#090611]">Черновик (Draft)</option>
                <option value="archived" className="bg-[#090611]">В архиве (Archived)</option>
              </select>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/15 bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={isOutNow}
                onChange={(e) => setIsOutNow(e.target.checked)}
                className="accent-[#B46BFF] w-4 h-4 rounded"
              />
              <span className="font-mono text-xs uppercase tracking-wider text-white">
                {isOutNow ? "Релиз вышел (Out Now)" : "Pre-save кампания"}
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/15 bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoOutNow}
                onChange={(e) => setAutoOutNow(e.target.checked)}
                className="accent-[#00F0FF] w-4 h-4 rounded"
              />
              <span className="font-mono text-xs uppercase tracking-wider text-white">
                Авто-переход в Out Now по дате
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Metadata Details & Platform Links */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl border border-white/10 bg-[#090611]/80 space-y-5">
            <h3 className="font-heavy text-xl uppercase text-white">Основная информация</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Название:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Исполнитель:
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Slug Editor */}
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                Адрес смарт-ссылки (Slug):
              </label>
              <div className="flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono">
                <span className="text-[#D9D9E2]/50 whitespace-nowrap">link.cxrnermusic.com/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="flex-1 bg-transparent text-white font-bold focus:outline-none pl-1"
                />
              </div>
              <p className="font-mono text-[9px] text-[#D9D9E2]/50 mt-1">
                При изменении старый адрес автоматически перенаправит фанатов на новый (301 Redirect).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Дата выхода:
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Тип:
                </label>
                <select
                  value={releaseType}
                  onChange={(e) => setReleaseType(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B46BFF] focus:outline-none font-mono"
                >
                  <option value="single" className="bg-[#090611]">Сингл</option>
                  <option value="ep" className="bg-[#090611]">EP</option>
                  <option value="album" className="bg-[#090611]">Альбом</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Жанр:
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  UPC / EAN:
                </label>
                <input
                  type="text"
                  value={upc}
                  onChange={(e) => setUpc(e.target.value)}
                  placeholder="12 или 13 цифр"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B46BFF] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Лейбл:
                </label>
                <input
                  type="text"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                Описание / Пресс-релиз (необязательно):
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите об истории трека..."
                className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:border-[#B46BFF] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Streaming Platforms Editor */}
          <div className="p-6 sm:p-7 rounded-3xl border border-white/10 bg-[#090611]/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heavy text-xl uppercase text-white">Музыкальные площадки</h3>
              <button
                type="button"
                onClick={addCustomPlatform}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 font-mono text-[10px] uppercase tracking-wider text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить площадку</span>
              </button>
            </div>

            <div className="space-y-3">
              {platforms.map((platform, index) => (
                <div
                  key={platform.id || index}
                  className="p-3.5 rounded-2xl border border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={platform.is_enabled}
                      onChange={(e) => updatePlatform(index, { is_enabled: e.target.checked })}
                      className="accent-[#8737FF] w-4 h-4 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={platform.platform_name}
                      onChange={(e) => updatePlatform(index, { platform_name: e.target.value })}
                      className="bg-transparent font-mono text-xs font-bold uppercase tracking-wider text-white border-b border-white/15 focus:outline-none focus:border-[#B46BFF] w-32"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={platform.url}
                      onChange={(e) => updatePlatform(index, { url: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Кнопка"
                      value={platform.button_text}
                      onChange={(e) => updatePlatform(index, { button_text: e.target.value })}
                      className="w-24 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#B46BFF] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removePlatform(index)}
                      className="p-2 text-white/40 hover:text-[#FF2E93] transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
