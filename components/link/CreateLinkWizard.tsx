"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Disc,
  Upload,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Radio,
} from "lucide-react";
import { generateSlug, validateCustomSlug, getSmartLinkDisplayPrefix } from "@/lib/slug";
import { validateUpcChecksum } from "../../lib/linkLookup";

interface PlatformEntry {
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
  is_enabled: boolean;
}

const DEFAULT_PLATFORMS: PlatformEntry[] = [
  { platform_key: "yandex", platform_name: "Яндекс Музыка", url: "", button_text: "Слушать", is_enabled: true },
  { platform_key: "vk", platform_name: "VK Музыка", url: "", button_text: "Слушать", is_enabled: true },
  { platform_key: "spotify", platform_name: "Spotify", url: "", button_text: "Слушать", is_enabled: true },
  { platform_key: "apple", platform_name: "Apple Music", url: "", button_text: "Слушать", is_enabled: true },
  { platform_key: "youtube", platform_name: "YouTube Music", url: "", button_text: "Слушать", is_enabled: true },
  { platform_key: "deezer", platform_name: "Deezer", url: "", button_text: "Слушать", is_enabled: true },
  { platform_key: "zvuk", platform_name: "Звук", url: "", button_text: "Слушать", is_enabled: false },
];

export default function CreateLinkWizard() {
  const router = useRouter();

  // Wizard Steps: 1 = Lookup, 2 = Metadata & Platforms, 3 = Template & Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Search States
  const [searchMode, setSearchMode] = useState<"upc" | "query" | "manual">("upc");
  const [upcInput, setUpcInput] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Metadata Form Fields
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [upc, setUpc] = useState("");
  const [isrc, setIsrc] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseType, setReleaseType] = useState<"single" | "ep" | "album">("single");
  const [genre, setGenre] = useState("Electronic");
  const [labelName, setLabelName] = useState("CXRNER MUSIC");
  const [description, setDescription] = useState("");
  const [isOutNow, setIsOutNow] = useState(false);
  const [template, setTemplate] = useState<"CYBER" | "MINIMAL" | "CINEMATIC" | "BRUTAL">("CYBER");
  const [platforms, setPlatforms] = useState<PlatformEntry[]>(DEFAULT_PLATFORMS);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Step 1: Perform UPC Lookup
  const handleUpcLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = upcInput.trim().replace(/\D/g, "");
    if (!clean) {
      setSearchError("Введите UPC/EAN штрихкод релиза");
      return;
    }

    const check = validateUpcChecksum(clean);
    if (!check.isValid) {
      setSearchError(check.error || "Неверный формат UPC");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const res = await fetch(`/api/link/lookup?upc=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!data.success || !data.release) {
        setSearchError(data.error || "Релиз не найден в открытых каталогах. Заполните данные вручную.");
      } else {
        applyFoundRelease(data.release);
      }
    } catch {
      setSearchError("Сбой сети при поиске релиза. Попробуйте снова или заполните вручную.");
    } finally {
      setIsSearching(false);
    }
  };

  // Step 1: Perform Text Query Search
  const handleQuerySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = queryInput.trim();
    if (!q) {
      setSearchError("Введите название трека или артиста");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const res = await fetch(`/api/link/lookup?query=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!data.success || !data.results || data.results.length === 0) {
        setSearchError("Совпадений не найдено. Вы можете создать релиз вручную.");
      } else {
        setSearchResults(data.results);
      }
    } catch {
      setSearchError("Ошибка поиска. Попробуйте снова.");
    } finally {
      setIsSearching(false);
    }
  };

  // Apply Found Release Data
  const applyFoundRelease = (item: any) => {
    setTitle(item.title || "");
    setArtist(item.artist || "");
    setCoverUrl(item.cover_url || "");
    setUpc(item.upc || upcInput.trim());
    if (item.release_date) setReleaseDate(item.release_date);
    if (item.genre) setGenre(item.genre);
    if (item.release_type) setReleaseType(item.release_type);
    if (item.label_name) setLabelName(item.label_name);

    const generated = generateSlug(item.artist || "artist", item.title || "release");
    setCustomSlug(generated);

    // Merge auto-detected platforms
    if (Array.isArray(item.platforms) && item.platforms.length > 0) {
      const updated = DEFAULT_PLATFORMS.map((def) => {
        const found = item.platforms.find((p: any) => p.platform_key === def.platform_key);
        if (found) {
          return { ...def, url: found.url, is_enabled: true };
        }
        return def;
      });
      setPlatforms(updated);
    }

    // Determine out now
    if (item.release_date) {
      const isPast = new Date(item.release_date) <= new Date();
      setIsOutNow(isPast);
    }

    setStep(2);
  };

  // Update Platform Entry
  const updatePlatform = (key: string, updates: Partial<PlatformEntry>) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.platform_key === key ? { ...p, ...updates } : p))
    );
  };

  // Create Smart Link Submit
  const handleFinalSubmit = async (status: "published" | "draft") => {
    if (!title || !artist || !coverUrl) {
      setSubmitError("Заполните название, исполнителя и загрузите обложку");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        title,
        artist,
        cover_url: coverUrl,
        custom_slug: customSlug || generateSlug(artist, title),
        upc: upc || null,
        isrc: isrc || null,
        release_date: releaseDate || null,
        release_type: releaseType,
        genre,
        label_name: labelName,
        description,
        status,
        template,
        is_out_now: isOutNow,
        platforms: platforms.filter((p) => p.is_enabled && p.url.trim()),
      };

      const res = await fetch("/api/link/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error || "Не удалось сохранить Smart Link");
        setIsSubmitting(false);
      } else {
        // Redirect to Page Builder or Links List
        router.push(`/dashboard/links/${data.link.id}/design`);
      }
    } catch {
      setSubmitError("Сбой сети. Попробуйте снова.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto rounded-3xl border border-white/10 bg-[#090611]/85 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl space-y-8">
      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition ${
              step >= 1 ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]" : "bg-white/10 text-white/40"
            }`}
          >
            1
          </div>
          <span className={`font-mono text-xs uppercase tracking-wider ${step >= 1 ? "text-white" : "text-white/40"}`}>
            Поиск релиза
          </span>
        </div>

        <div className="w-12 h-0.5 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition ${
              step >= 2 ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]" : "bg-white/10 text-white/40"
            }`}
          >
            2
          </div>
          <span className={`font-mono text-xs uppercase tracking-wider ${step >= 2 ? "text-white" : "text-white/40"}`}>
            Метаданные и Стриминги
          </span>
        </div>

        <div className="w-12 h-0.5 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition ${
              step >= 3 ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]" : "bg-white/10 text-white/40"
            }`}
          >
            3
          </div>
          <span className={`font-mono text-xs uppercase tracking-wider ${step >= 3 ? "text-white" : "text-white/40"}`}>
            Шаблон и Запуск
          </span>
        </div>
      </div>

      {/* ===================================================================
          STEP 1: LOOKUP OR SEARCH
          =================================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heavy text-2xl uppercase tracking-tight text-white">
              Как вы хотите создать Smart Link?
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Введите UPC штрихкод релиза для автоматического подтягивания обложки и ссылок, найдите трек по названию или заполните всё вручную.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
            <button
              onClick={() => {
                setSearchMode("upc");
                setSearchError("");
              }}
              className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                searchMode === "upc" ? "bg-[#8737FF] text-white shadow-md" : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              UPC / EAN код
            </button>
            <button
              onClick={() => {
                setSearchMode("query");
                setSearchError("");
              }}
              className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                searchMode === "query" ? "bg-[#8737FF] text-white shadow-md" : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              Поиск по названию
            </button>
            <button
              onClick={() => {
                setSearchMode("manual");
                setStep(2);
              }}
              className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                searchMode === "manual" ? "bg-[#8737FF] text-white shadow-md" : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              Вручную
            </button>
          </div>

          {/* Mode: UPC Search */}
          {searchMode === "upc" && (
            <form onSubmit={handleUpcLookup} className="space-y-4 pt-2">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                  UPC или EAN штрихкод (12 или 13 цифр):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Например: 198015482931"
                    value={upcInput}
                    onChange={(e) => setUpcInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="btn-energy px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{isSearching ? "Поиск..." : "Найти"}</span>
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="p-4 rounded-xl border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-xs text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#FF2E93] flex-shrink-0" />
                    <span>{searchError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUpc(upcInput.trim());
                      setStep(2);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[10px] uppercase font-bold text-white whitespace-nowrap"
                  >
                    Ввести вручную
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Mode: Query Search */}
          {searchMode === "query" && (
            <form onSubmit={handleQuerySearch} className="space-y-4 pt-2">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                  Артист и название релиза:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Например: KAZUMAI - Neon Drift"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="btn-energy px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{isSearching ? "Поиск..." : "Найти"}</span>
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="p-4 rounded-xl border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-xs text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF2E93]" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Candidate Results List */}
              {searchResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-[#B46BFF]">
                    Выберите найденный релиз:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => applyFoundRelease(item)}
                        className="group p-3 rounded-2xl border border-white/10 bg-black/40 hover:bg-[#8737FF]/20 hover:border-[#B46BFF] transition cursor-pointer flex items-center gap-3"
                      >
                        <img
                          src={item.cover_url}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover bg-black flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-heavy text-xs uppercase text-white truncate">
                            {item.title}
                          </p>
                          <p className="font-mono text-[11px] text-[#D9D9E2]/70 truncate">
                            {item.artist}
                          </p>
                          <p className="font-mono text-[9px] text-[#B46BFF] uppercase">
                            {item.release_date || "Релиз"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* ===================================================================
          STEP 2: METADATA & STREAMING PLATFORMS
          =================================================================== */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heavy text-2xl uppercase tracking-tight text-white">
              Метаданные и Ссылки
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Проверьте корректность информации и включите нужные площадки.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            {/* Cover Preview & URL */}
            <div className="sm:col-span-4 space-y-3">
              <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block">
                Обложка релиза:
              </label>
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/60 border border-white/20 relative group">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white/40 font-mono text-xs">
                    <Upload className="w-6 h-6 mb-2 text-[#B46BFF]" />
                    <span>Вставьте URL обложки</span>
                  </div>
                )}
              </div>
              <input
                type="url"
                required
                placeholder="https://.../cover.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
              />
            </div>

            {/* Title, Artist, Slug, Date */}
            <div className="sm:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                    Название релиза:
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!customSlug) setCustomSlug(generateSlug(artist, e.target.value));
                    }}
                    placeholder="Название трека/альбома"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
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
                    onChange={(e) => {
                      setArtist(e.target.value);
                      if (!customSlug) setCustomSlug(generateSlug(e.target.value, title));
                    }}
                    placeholder="Имя артиста"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Custom Slug Editor */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                  Уникальная ссылка (Slug):
                </label>
                <div className="flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono">
                  <span className="text-[#D9D9E2]/50 whitespace-nowrap">{getSmartLinkDisplayPrefix()}</span>
                  <input
                    type="text"
                    required
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1 bg-transparent text-white font-bold focus:outline-none pl-1"
                  />
                </div>
              </div>

              {/* Release Date & Out Now Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-1">
                    Дата премьеры:
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => {
                      setReleaseDate(e.target.value);
                      if (e.target.value) {
                        setIsOutNow(new Date(e.target.value) <= new Date());
                      }
                    }}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#B46BFF] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 p-2.5 rounded-xl border border-white/15 bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOutNow}
                      onChange={(e) => setIsOutNow(e.target.checked)}
                      className="accent-[#B46BFF] w-4 h-4 rounded"
                    />
                    <span className="font-mono text-xs uppercase tracking-wider text-white">
                      {isOutNow ? "Релиз уже вышел (Out Now)" : "Pre-save кампания"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Streaming Platforms List */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-heavy text-base uppercase tracking-tight text-white">
                Музыкальные витрины
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#B46BFF]">
                Ссылки для перехода
              </span>
            </div>

            <div className="space-y-2">
              {platforms.map((p) => (
                <div
                  key={p.platform_key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/40"
                >
                  <input
                    type="checkbox"
                    checked={p.is_enabled}
                    onChange={(e) => updatePlatform(p.platform_key, { is_enabled: e.target.checked })}
                    className="accent-[#8737FF] w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider w-36 text-white truncate">
                    {p.platform_name}
                  </span>
                  <input
                    type="url"
                    placeholder={`https://${p.platform_key}...`}
                    value={p.url}
                    onChange={(e) => updatePlatform(p.platform_key, { url: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:border-[#B46BFF] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full border border-white/15 text-xs font-mono uppercase tracking-wider text-[#D9D9E2] hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-energy px-7 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
            >
              <span>Далее: Шаблон</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          STEP 3: TEMPLATE SELECTION & LAUNCH
          =================================================================== */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heavy text-2xl uppercase tracking-tight text-white">
              Выберите стиль страницы
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Вы всегда сможете настроить любой элемент в Live Page Builder после создания.
            </p>
          </div>

          {/* 4 Template Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: "CYBER",
                name: "CYBER",
                desc: "Фирменный стиль CXRNER с неоновыми контурами и фиолетовым свечением",
                bg: "from-[#8737FF]/20 to-[#090611]",
              },
              {
                id: "CINEMATIC",
                name: "CINEMATIC",
                desc: "Глубокое размытие обложки на всю высоту, мягкий виньетинг и стекло",
                bg: "from-[#160B28]/40 to-black",
              },
              {
                id: "MINIMAL",
                name: "MINIMAL",
                desc: "Строгий чёрно-белый минимализм, чистая швейцарская типографика",
                bg: "from-white/10 to-[#050407]",
              },
              {
                id: "BRUTAL",
                name: "BRUTAL",
                desc: "Высококонтрастные черные плашки, жесткие тени и плотный контур",
                bg: "from-[#00F0FF]/15 to-black",
              },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => setTemplate(t.id as any)}
                className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 relative overflow-hidden bg-gradient-to-br ${
                  t.bg
                } ${
                  template === t.id
                    ? "border-[#B46BFF] ring-2 ring-[#8737FF] shadow-[0_0_30px_rgba(135,55,255,0.3)]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heavy text-lg uppercase tracking-wider text-white">
                    {t.name}
                  </span>
                  {template === t.id && (
                    <span className="w-5 h-5 rounded-full bg-[#8737FF] flex items-center justify-center text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#D9D9E2]/70 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl border border-white/10 bg-black/40 flex items-center gap-4">
            <img src={coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-heavy text-sm uppercase text-white truncate">{title}</p>
              <p className="font-mono text-xs text-[#B46BFF] truncate">
                {getSmartLinkDisplayPrefix()}{customSlug}
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white">
              {isOutNow ? "OUT NOW" : "PRE-SAVE"}
            </span>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-xs text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF2E93]" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-white/15 text-xs font-mono uppercase tracking-wider text-[#D9D9E2] hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit("draft")}
                className="flex-1 sm:flex-none px-6 py-3 rounded-full border border-white/20 text-xs font-mono uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50"
              >
                Сохранить черновик
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit("published")}
                className="flex-1 sm:flex-none btn-energy px-8 py-3 rounded-full font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(135,55,255,0.4)] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? "Публикация..." : "Опубликовать"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
