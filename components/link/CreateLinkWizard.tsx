"use client";

import { useState, useEffect } from "react";
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
  Music2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { generateSlug, validateCustomSlug, getSmartLinkDisplayPrefix, validateUpcChecksum } from "@/lib/slug";

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

interface UserCxrnerRelease {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  upc: string;
  release_date: string | null;
  genre: string;
  status: string;
  is_out_now: boolean;
}

export default function CreateLinkWizard() {
  const router = useRouter();

  // Wizard Steps: 1 = Lookup, 2 = Metadata & Platforms, 3 = Template & Launch
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Search Modes: my_releases | upc | query | manual
  const [searchMode, setSearchMode] = useState<"my_releases" | "upc" | "query" | "manual">("my_releases");
  const [upcInput, setUpcInput] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchSuccessNotice, setSearchSuccessNotice] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Cabinet user releases
  const [myReleases, setMyReleases] = useState<UserCxrnerRelease[]>([]);
  const [loadingMyReleases, setLoadingMyReleases] = useState(true);

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
  const [createdLink, setCreatedLink] = useState<{ id: string; slug: string } | null>(null);

  // Fetch artist's own releases on mount
  useEffect(() => {
    async function loadReleases() {
      try {
        const res = await fetch("/api/cabinet/releases-for-links");
        const data = await res.json();
        if (data.success && Array.isArray(data.releases) && data.releases.length > 0) {
          setMyReleases(data.releases);
          setSearchMode("my_releases");
        } else {
          setSearchMode("upc");
        }
      } catch {
        setSearchMode("upc");
      } finally {
        setLoadingMyReleases(false);
      }
    }
    loadReleases();
  }, []);

  // Step 1: Perform UPC Lookup (supports unreleased Pre-saves smoothly)
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
    setSearchSuccessNotice("");
    setSearchResults([]);

    try {
      const res = await fetch(`/api/link/lookup?upc=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!data.success || !data.release) {
        setSearchError(data.error || "Релиз не найден. Заполните данные вручную.");
      } else {
        if (data.is_unreleased) {
          setSearchSuccessNotice(
            "⚡ Релиз готовится к выходу! Активирован режим Pre-save с таймером премьеры."
          );
        }
        applyFoundRelease(data.release, data.is_unreleased);
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
    setSearchSuccessNotice("");
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

  // Apply Found / Selected Release Data
  const applyFoundRelease = (item: any, isUnreleasedOverride?: boolean) => {
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

    // Determine out now vs pre-save
    let computedOutNow = true;
    if (isUnreleasedOverride !== undefined) {
      computedOutNow = !isUnreleasedOverride;
    } else if (item.release_date) {
      computedOutNow = new Date(item.release_date) <= new Date();
    }
    setIsOutNow(computedOutNow);

    // Merge platforms with appropriate button text
    const defaultBtnText = computedOutNow ? "Слушать" : "Pre-save";
    if (Array.isArray(item.platforms) && item.platforms.length > 0) {
      const updated = DEFAULT_PLATFORMS.map((def) => {
        const found = item.platforms.find((p: any) => p.platform_key === def.platform_key);
        if (found) {
          return {
            ...def,
            url: found.url || "",
            button_text: computedOutNow ? "Слушать" : "Pre-save",
            is_enabled: true,
          };
        }
        return {
          ...def,
          button_text: defaultBtnText,
        };
      });
      setPlatforms(updated);
    } else {
      setPlatforms((prev) =>
        prev.map((p) => ({ ...p, button_text: defaultBtnText }))
      );
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
        setCreatedLink({ id: data.link.id, slug: data.link.slug });
      }
    } catch {
      setSubmitError("Сбой сети. Попробуйте снова.");
      setIsSubmitting(false);
    }
  };

  // If link was just successfully published, show congratulatory modal/screen
  if (createdLink) {
    return (
      <div className="relative max-w-2xl mx-auto rounded-3xl border border-[#B46BFF]/40 bg-[#07050d] p-8 sm:p-12 text-center shadow-[0_0_80px_rgba(135,55,255,0.3)] space-y-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#8737FF] to-[#00F0FF] flex items-center justify-center mx-auto text-white shadow-[0_0_30px_#8737FF]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-[#00F0FF] font-bold">
            УСПЕШНО ОПУБЛИКОВАНО
          </span>
          <h2 className="font-heavy text-3xl sm:text-4xl uppercase text-white tracking-tight">
            CXRNER LINK ГОТОВА
          </h2>
          <p className="text-sm text-[#D9D9E2]/80 max-w-md mx-auto">
            Ваша музыкальная смарт-ссылка создана и доступна по всему миру.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 font-mono text-sm text-[#B46BFF] max-w-md mx-auto truncate select-all">
          {getSmartLinkDisplayPrefix()}{createdLink.slug}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href={`/link/${createdLink.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto btn-energy px-8 py-3.5 rounded-full font-mono text-xs uppercase font-bold tracking-wider inline-flex items-center justify-center gap-2 shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Открыть страницу</span>
          </a>

          <button
            onClick={() => router.push("/dashboard/links")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-white/20 font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 transition"
          >
            Все смарт-ссылки
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#07050d]/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl space-y-8">
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

        <div className="w-8 sm:w-16 h-0.5 bg-white/10" />

        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition ${
              step >= 2 ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]" : "bg-white/10 text-white/40"
            }`}
          >
            2
          </div>
          <span className={`font-mono text-xs uppercase tracking-wider ${step >= 2 ? "text-white" : "text-white/40"}`}>
            Метаданные
          </span>
        </div>

        <div className="w-8 sm:w-16 h-0.5 bg-white/10" />

        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition ${
              step >= 3 ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]" : "bg-white/10 text-white/40"
            }`}
          >
            3
          </div>
          <span className={`font-mono text-xs uppercase tracking-wider ${step >= 3 ? "text-white" : "text-white/40"}`}>
            Дизайн и Старт
          </span>
        </div>
      </div>

      {/* ===================================================================
          STEP 1: LOOKUP OR SELECT FROM MY RELEASES
          =================================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heavy text-2xl uppercase tracking-tight text-white">
              Выберите способ создания Smart Link
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Выберите готовый трек из вашего кабинета CXRNER, укажите UPC для автоматического распознавания или настройте всё вручную.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
            {myReleases.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchMode("my_releases");
                  setSearchError("");
                }}
                className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                  searchMode === "my_releases" ? "bg-[#8737FF] text-white shadow-md font-bold" : "text-[#D9D9E2]/70 hover:text-white"
                }`}
              >
                Мои релизы ({myReleases.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchMode("upc");
                setSearchError("");
              }}
              className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                searchMode === "upc" ? "bg-[#8737FF] text-white shadow-md font-bold" : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              UPC / Pre-save
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("query");
                setSearchError("");
              }}
              className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                searchMode === "query" ? "bg-[#8737FF] text-white shadow-md font-bold" : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              Поиск по каталогу
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("manual");
                setStep(2);
              }}
              className={`py-2.5 rounded-xl transition font-medium uppercase tracking-wider ${
                searchMode === "manual" ? "bg-[#8737FF] text-white shadow-md font-bold" : "text-[#D9D9E2]/70 hover:text-white"
              }`}
            >
              Вручную
            </button>
          </div>

          {/* Mode: My Releases in CXRNER */}
          {searchMode === "my_releases" && (
            <div className="space-y-4 pt-2">
              <p className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70">
                Ваши треки, отправленные на дистрибуцию через CXRNER:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {myReleases.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => applyFoundRelease(rel)}
                    className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#B46BFF] hover:bg-[#8737FF]/10 transition cursor-pointer flex items-center gap-3.5 group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 relative">
                      {rel.cover_url ? (
                        <img src={rel.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <Music2 className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-heavy text-sm uppercase text-white truncate group-hover:text-[#B46BFF] transition">
                        {rel.title}
                      </h4>
                      <p className="font-mono text-xs text-[#D9D9E2]/70 truncate">
                        {rel.artist}
                      </p>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[9px] uppercase tracking-wider">
                        {rel.is_out_now ? (
                          <span className="text-[#00F0FF]">OUT NOW</span>
                        ) : (
                          <span className="text-[#B46BFF]">PRE-SAVE</span>
                        )}
                        {rel.upc && <span className="text-white/40">UPC: {rel.upc}</span>}
                      </div>
                    </div>

                    <div className="flex-shrink-0 p-2 rounded-xl bg-white/5 text-white/60 group-hover:bg-[#8737FF] group-hover:text-white transition">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode: UPC Search */}
          {searchMode === "upc" && (
            <form onSubmit={handleUpcLookup} className="space-y-4 pt-2">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                  UPC или EAN штрихкод релиза (12 или 13 цифр):
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
                <p className="font-mono text-[11px] text-[#D9D9E2]/50 mt-2">
                  💡 Если релиз ещё не вышел в магазинах, система автоматически активирует режим <span className="text-[#00F0FF] font-semibold">Pre-save</span>.
                </p>
              </div>
            </form>
          )}

          {/* Mode: Query Search */}
          {searchMode === "query" && (
            <form onSubmit={handleQuerySearch} className="space-y-4 pt-2">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                  Название трека или имя исполнителя:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Например: Narvent - Memory Reboot"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="btn-energy px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{isSearching ? "Искать..." : "Поиск"}</span>
                  </button>
                </div>
              </div>

              {/* Query Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70">
                    Найденные совпадения:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => applyFoundRelease(item)}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#B46BFF] hover:bg-[#8737FF]/10 transition cursor-pointer flex items-center gap-3 group"
                      >
                        <img src={item.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-heavy text-xs uppercase text-white truncate group-hover:text-[#B46BFF]">
                            {item.title}
                          </p>
                          <p className="font-mono text-[11px] text-[#D9D9E2]/70 truncate">
                            {item.artist}
                          </p>
                          <span className="font-mono text-[9px] text-[#00F0FF] uppercase">
                            {item.release_type} • {item.genre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {searchSuccessNotice && (
            <div className="p-4 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-xs text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00F0FF] flex-shrink-0" />
              <span>{searchSuccessNotice}</span>
            </div>
          )}

          {searchError && (
            <div className="p-4 rounded-xl border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-xs text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF2E93] flex-shrink-0" />
              <span>{searchError}</span>
            </div>
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
              Метаданные и Стриминги
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
                        const isPast = new Date(e.target.value) <= new Date();
                        setIsOutNow(isPast);
                        setPlatforms((prev) =>
                          prev.map((p) => ({
                            ...p,
                            button_text: isPast ? "Слушать" : "Pre-save",
                          }))
                        );
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
                      onChange={(e) => {
                        const val = e.target.checked;
                        setIsOutNow(val);
                        setPlatforms((prev) =>
                          prev.map((p) => ({
                            ...p,
                            button_text: val ? "Слушать" : "Pre-save",
                          }))
                        );
                      }}
                      className="accent-[#B46BFF] w-4 h-4 rounded"
                    />
                    <span className="font-mono text-xs uppercase tracking-wider text-white">
                      {isOutNow ? "Релиз уже вышел (Out Now)" : "Pre-save кампания (таймер)"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Streaming Platforms List */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block">
              Площадки и ссылки для слушателей:
            </label>
            <div className="space-y-2">
              {platforms.map((p) => (
                <div
                  key={p.platform_key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]"
                >
                  <input
                    type="checkbox"
                    checked={p.is_enabled}
                    onChange={(e) => updatePlatform(p.platform_key, { is_enabled: e.target.checked })}
                    className="accent-[#B46BFF] w-4 h-4 rounded"
                  />
                  <span className="font-mono text-xs uppercase tracking-wider text-white w-28 sm:w-36 truncate font-bold">
                    {p.platform_name}
                  </span>
                  <input
                    type="url"
                    placeholder={`Ссылка на ${p.platform_name}`}
                    value={p.url}
                    onChange={(e) => updatePlatform(p.platform_key, { url: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={p.button_text}
                    onChange={(e) => updatePlatform(p.platform_key, { button_text: e.target.value })}
                    className="w-24 sm:w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step 2 Actions */}
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
              <span>Далее: Выбор дизайна</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          STEP 3: TEMPLATE SELECTION WITH VISUAL LIVE PREVIEW MOCKUP
          =================================================================== */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="font-heavy text-2xl uppercase tracking-tight text-white">
              Выберите стиль страницы смарт-ссылки
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70">
              Каждый стиль разработан с учётом эстетики топовых лейблов и EDM артистов. Выберите подходящий вайб.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 4 Visual Theme Selection Cards */}
            <div className="lg:col-span-7 space-y-3.5">
              {[
                {
                  id: "CYBER",
                  name: "CYBER // STMPD EDM",
                  tag: "ELECTRIC NEON & CYBERPUNK",
                  desc: "Фирменный стиль STMPD RCRDS: неоновые фиолетовые и бирюзовые лучи, стеклянные кнопки с живой пульсацией.",
                  border: "border-[#8737FF]",
                  accent: "#00F0FF",
                  bg: "from-[#120826] via-[#090611] to-black",
                  previewBadge: "NEON PILLS · GLOW",
                },
                {
                  id: "CINEMATIC",
                  name: "CINEMATIC // NARVENT PHONK",
                  tag: "DEEP ARTWORK BLUR & ATMOSPHERE",
                  desc: "Атмосферный стиль в духе Narvent: глубокое кинематографичное размытие обложки на весь экран, матовое стекло, мягкий виньетинг.",
                  border: "border-[#B46BFF]",
                  accent: "#B46BFF",
                  bg: "from-[#1c0d38] via-[#0b0617] to-black",
                  previewBadge: "FULL-BLEED BLUR · GLASS",
                },
                {
                  id: "MINIMAL",
                  name: "MINIMAL // SWISS OBSIDIAN",
                  tag: "MONOCHROME & CRISP LINES",
                  desc: "Строгий швейцарский минимализм: чистая белая окантовка, глубокий черный обсидиан, акцент на типографику и обложку.",
                  border: "border-white/60",
                  accent: "#FFFFFF",
                  bg: "from-white/10 via-[#07050d] to-black",
                  previewBadge: "HAIRLINE BORDERS · SWISS",
                },
                {
                  id: "BRUTAL",
                  name: "BRUTAL // UNDERGROUND RAVE",
                  tag: "HIGH CONTRAST & SOLID BLOCKS",
                  desc: "Энергия подпольных рейв-афиш: массивные монолитные кнопки, контрастные тени и плотный индустриальный контур.",
                  border: "border-[#00F0FF]",
                  accent: "#00F0FF",
                  bg: "from-[#00F0FF]/15 via-[#07050d] to-black",
                  previewBadge: "INDUSTRIAL SOLID · RAW",
                },
              ].map((t) => {
                const isSelected = template === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTemplate(t.id as any)}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer space-y-2 relative overflow-hidden bg-gradient-to-r ${
                      t.bg
                    } ${
                      isSelected
                        ? `${t.border} ring-2 ring-[#8737FF] shadow-[0_0_35px_rgba(135,55,255,0.35)] scale-[1.01]`
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-heavy text-base sm:text-lg uppercase tracking-wider text-white">
                          {t.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">
                          {t.previewBadge}
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-[#8737FF] flex items-center justify-center text-white shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-white/20" />
                      )}
                    </div>
                    <p className="text-xs text-[#D9D9E2]/80 leading-relaxed font-sans">{t.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Right: Live Interactive Smartphone Mockup */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#00F0FF] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00F0FF]" />
                <span>ЖИВОЙ ПРЕДПРОСМОТР СМАРТФОНА</span>
              </div>

              {/* iPhone Frame */}
              <div className="w-64 sm:w-72 rounded-[40px] border-4 border-neutral-800 bg-[#07050d] p-3 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Dynamic island notch */}
                <div className="w-20 h-4 bg-black rounded-full mx-auto mb-3" />

                {/* Inner Screen */}
                <div
                  className={`rounded-[30px] p-4 text-center space-y-3 min-h-[380px] flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                    template === "CYBER"
                      ? "bg-gradient-to-b from-[#1b0838] to-[#07050d]"
                      : template === "CINEMATIC"
                      ? "bg-[#0b0518]"
                      : template === "MINIMAL"
                      ? "bg-[#050407]"
                      : "bg-[#050407]"
                  }`}
                >
                  {/* Backdrop blur if cinematic */}
                  {template === "CINEMATIC" && coverUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125 pointer-events-none"
                      style={{ backgroundImage: `url(${coverUrl})` }}
                    />
                  )}

                  <div className="relative z-10 space-y-3">
                    {/* Cover Art in Mockup */}
                    <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-xl relative bg-black/60">
                      {coverUrl ? (
                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <Music2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <div>
                      <p className="font-heavy text-xs uppercase text-white truncate px-2">
                        {title || "Название релиза"}
                      </p>
                      <p className="font-mono text-[10px] text-[#B46BFF] truncate mt-0.5">
                        {artist || "Исполнитель"}
                      </p>
                    </div>

                    {/* Pre-save countdown mock */}
                    {!isOutNow && (
                      <div className="p-1.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[8px] text-[#00F0FF] uppercase">
                        <span>⏳ PRE-SAVE: 14 ДНЕЙ 08:24:12</span>
                      </div>
                    )}

                    {/* Buttons Mockup */}
                    <div className="space-y-1.5 pt-1">
                      {[
                        { name: "Яндекс Музыка", key: "yandex" },
                        { name: "Spotify", key: "spotify" },
                        { name: "Apple Music", key: "apple" },
                        { name: "VK Музыка", key: "vk" },
                      ].map((p) => (
                        <div
                          key={p.key}
                          className={`p-2 rounded-xl text-[9px] font-mono uppercase tracking-wider flex items-center justify-between transition-all duration-300 ${
                            template === "CYBER"
                              ? "bg-[#8737FF]/20 border border-[#8737FF]/60 text-white shadow-[0_0_10px_rgba(135,55,255,0.2)]"
                              : template === "CINEMATIC"
                              ? "bg-white/10 backdrop-blur-md border border-white/20 text-white"
                              : template === "MINIMAL"
                              ? "bg-transparent border border-white/30 text-white"
                              : "bg-white/15 border-2 border-white/40 text-white font-bold"
                          }`}
                        >
                          <span className="font-bold truncate">{p.name}</span>
                          <span className="text-[#00F0FF] font-bold">
                            {isOutNow ? "Слушать" : "Pre-save"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 pt-2 font-mono text-[7px] text-[#D9D9E2]/40 uppercase tracking-widest">
                    CXRNER LINK • 2026
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Release Summary Bar */}
          <div className="p-4 rounded-2xl border border-white/10 bg-black/40 flex items-center gap-4">
            <img src={coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
            <div className="min-w-0 flex-1">
              <p className="font-heavy text-sm uppercase text-white truncate">{title}</p>
              <p className="font-mono text-xs text-[#B46BFF] truncate">
                {getSmartLinkDisplayPrefix()}{customSlug}
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white font-bold">
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
