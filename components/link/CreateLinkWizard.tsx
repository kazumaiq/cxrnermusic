"use client";

import { useState, useEffect, useRef } from "react";
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
  Camera,
  Image as ImageIcon,
  Barcode,
  SlidersHorizontal,
  Wand2,
  Calendar,
  Link2,
} from "lucide-react";
import {
  generateSlug,
  validateCustomSlug,
  getSmartLinkDisplayPrefix,
  validateUpcChecksum,
  normalizeReleaseDate,
  buildPlatformSearchUrl,
} from "@/lib/slug";
import { SMART_LINK_THEMES, getSmartLinkTheme, SmartLinkTemplateId } from "@/lib/smartLinkThemes";
import { ThemeAmbientBackground } from "./ThemeAmbientBackground";
import { PlatformLogo, getPlatformVisualMeta } from "./PlatformLogo";

interface PlatformEntry {
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
  is_enabled: boolean;
  is_direct?: boolean;
}

const PLATFORM_BRAND_COLORS: Record<string, string> = {
  yandex: "#FFCC00",
  vk: "#0077FF",
  spotify: "#1DB954",
  apple: "#FA243C",
  youtube: "#FF0000",
  deezer: "#A238FF",
  zvuk: "#6C43E8",
};

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
  const [template, setTemplate] = useState<SmartLinkTemplateId>("CYBER");
  const [platforms, setPlatforms] = useState<PlatformEntry[]>(DEFAULT_PLATFORMS);

  // Unreleased barcode state (smooth Pre-save prompt without jarring empty redirect)
  const [unreleasedPrompt, setUnreleasedPrompt] = useState<{
    upc: string;
    message: string;
  } | null>(null);

  // Cover image upload state & ref
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

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

  // Mobile/desktop direct cover photo upload with canvas scaling (max 1200x1200px)
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitError("Пожалуйста, выберите изображение (JPG, PNG, WebP)");
      return;
    }

    setIsUploadingCover(true);
    setSubmitError("");
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setCoverUrl(dataUrl);
        } else {
          setCoverUrl(uploadEvent.target?.result as string);
        }
        setIsUploadingCover(false);
      };
      img.onerror = () => {
        setCoverUrl(uploadEvent.target?.result as string);
        setIsUploadingCover(false);
      };
      img.src = uploadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [previewAudioUrl, setPreviewAudioUrl] = useState("");
  const [lyricsSnippet, setLyricsSnippet] = useState("");
  const [collabArtist, setCollabArtist] = useState("");
  const [fanGateTarget, setFanGateTarget] = useState("");
  const [fanGateTitle, setFanGateTitle] = useState("");
  const [fanGateContent, setFanGateContent] = useState("");

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
    setUnreleasedPrompt(null);

    try {
      const res = await fetch(`/api/link/lookup?upc=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!data.success) {
        setSearchError(data.error || "Релиз не найден. Заполните данные вручную.");
      } else if (!data.found || !data.release?.title) {
        // Barcode is valid & accepted, but track is unreleased in public stores!
        // DO NOT abruptly kick user to empty Step 2! Stay on Step 1 with pre-save setup card.
        setUpc(clean);
        setIsOutNow(false);
        setUnreleasedPrompt({
          upc: clean,
          message:
            data.message ||
            "Штрихкод принят в дистрибуции! Так как трек ещё не опубликован на открытых витринах, укажите название и артиста для запуска Pre-save страницы.",
        });
        setSearchSuccessNotice(
          `⚡ Штрихкод ${clean} принят! Активирован режим Pre-save кампании.`
        );
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

  // Apply Found / Selected Release Data (auto-fills artist, title, date, cover, and ALL platforms)
  const applyFoundRelease = (item: any, isUnreleasedOverride?: boolean) => {
    const nextTitle = item.title || "";
    const nextArtist = item.artist || "";
    const normalizedDate = normalizeReleaseDate(item.release_date);

    setTitle(nextTitle);
    setArtist(nextArtist);
    // Only use external cover URLs directly; for CXRNER internal releases, fetch cover from external databases (iTunes / Deezer)
    const isExternalSource = item.source && item.source !== "cxrner";
    setCoverUrl(isExternalSource ? item.cover_url || "" : "");
    if (!isExternalSource && nextArtist && nextTitle) {
      fetch(`/api/cover-lookup?artist=${encodeURIComponent(nextArtist)}&title=${encodeURIComponent(nextTitle)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.cover) setCoverUrl(d.cover);
        })
        .catch(() => {});
    }
    setUpc(item.upc || upcInput.trim());
    if (normalizedDate) setReleaseDate(normalizedDate);
    if (item.genre) setGenre(item.genre);
    if (item.release_type) setReleaseType(item.release_type);
    if (item.label_name) setLabelName(item.label_name);

    const generated = generateSlug(nextArtist || "artist", nextTitle || "release");
    setCustomSlug(generated);

    // Determine out now vs pre-save
    let computedOutNow = true;
    if (isUnreleasedOverride !== undefined) {
      computedOutNow = !isUnreleasedOverride;
    } else if (normalizedDate) {
      computedOutNow = new Date(normalizedDate) <= new Date();
    }
    setIsOutNow(computedOutNow);

    // Merge direct links + auto-populate remaining platforms so nothing is left empty
    const defaultBtnText = computedOutNow ? "Слушать" : "Pre-save";
    const incoming = Array.isArray(item.platforms) ? item.platforms : [];

    const updated: PlatformEntry[] = DEFAULT_PLATFORMS.map((def) => {
      const found = incoming.find((p: any) => p.platform_key === def.platform_key);
      const directUrl = found?.url?.trim() || "";
      const fallbackUrl =
        nextArtist && nextTitle ? buildPlatformSearchUrl(def.platform_key, nextArtist, nextTitle) : "";
      const finalUrl = directUrl || fallbackUrl;

      return {
        ...def,
        url: finalUrl,
        button_text: defaultBtnText,
        is_enabled: Boolean(finalUrl) && (def.is_enabled || Boolean(directUrl)),
        is_direct: Boolean(found?.is_direct ?? (directUrl && !directUrl.includes("search"))),
      };
    });
    setPlatforms(updated);

    setStep(2);
  };

  // Auto-fill all platform links in Step 2 from current Artist + Title
  const handleAutoFillPlatforms = () => {
    if (!title.trim() || !artist.trim()) return;
    const defaultBtnText = isOutNow ? "Слушать" : "Pre-save";
    setPlatforms((prev) =>
      prev.map((p) => {
        if (p.url.trim() && p.is_direct) return p;
        const autoUrl = buildPlatformSearchUrl(p.platform_key, artist, title);
        return {
          ...p,
          url: p.url.trim() || autoUrl,
          button_text: defaultBtnText,
          is_enabled: Boolean(p.url.trim() || autoUrl),
          is_direct: p.is_direct || false,
        };
      })
    );
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
        preview_audio_url: previewAudioUrl.trim() || null,
        lyrics_snippet: lyricsSnippet.trim() || null,
        collab_artist: collabArtist.trim() || null,
        fan_gate_target: fanGateTarget ? Number(fanGateTarget) : null,
        fan_gate_title: fanGateTitle.trim() || null,
        fan_gate_content: fanGateContent.trim() || null,
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
          <span className="font-sans text-xs uppercase tracking-wider text-[#00F0FF] font-bold">
            УСПЕШНО ОПУБЛИКОВАНО
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl uppercase text-white tracking-tight">
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
            className="w-full sm:w-auto btn-energy px-7 py-3.5 rounded-full font-mono text-xs uppercase font-bold tracking-wider inline-flex items-center justify-center gap-2 shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Открыть страницу</span>
          </a>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/links/${createdLink.id}/edit`)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 font-mono text-xs uppercase font-bold tracking-wider text-[#00F0FF] hover:bg-[#00F0FF]/20 transition inline-flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Редактировать</span>
          </button>

          <button
            type="button"
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
      <div className="grid grid-cols-3 gap-2 pb-5 border-b border-white/10">
        {[
          { num: 1, label: "Поиск" },
          { num: 2, label: "Контент" },
          { num: 3, label: "Дизайн" },
        ].map((item) => {
          const isActive = step === item.num;
          const isDone = step > item.num;
          return (
            <div
              key={item.num}
              className={`flex items-center justify-center sm:justify-start gap-2 px-2.5 py-2 rounded-xl border transition ${
                isActive
                  ? "bg-[#8737FF]/15 border-[#B46BFF]/50 text-white"
                  : isDone
                    ? "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]"
                    : "bg-white/[0.02] border-white/5 text-white/40"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 transition ${
                  isActive
                    ? "bg-[#8737FF] text-white shadow-[0_0_12px_#8737FF]"
                    : isDone
                      ? "bg-[#00F0FF] text-black"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {isDone ? "✓" : item.num}
              </div>
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider truncate font-bold">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ===================================================================
          STEP 1: LOOKUP OR SELECT FROM MY RELEASES
          =================================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-lg sm:text-2xl uppercase tracking-tight text-white">
              Выберите способ создания Smart Link
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/80 font-sans leading-relaxed">
              Укажите UPC код трека — обложка, артист, дата выхода и ссылки на стриминги подтянутся автоматически. Либо выберите релиз из вашего личного кабинета.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            className={`grid gap-1.5 p-1.5 rounded-2xl bg-black/50 border border-white/10 font-mono text-[11px] sm:text-xs ${
              myReleases.length > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
            }`}
          >
            {myReleases.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchMode("my_releases");
                  setSearchError("");
                }}
                className={`py-2.5 px-2 rounded-xl transition font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  searchMode === "my_releases"
                    ? "bg-[#8737FF] text-white shadow-[0_0_16px_rgba(135,55,255,0.45)]"
                    : "text-[#D9D9E2]/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Disc className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Мои ({myReleases.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchMode("upc");
                setSearchError("");
              }}
              className={`py-2.5 px-2 rounded-xl transition font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap ${
                searchMode === "upc"
                  ? "bg-[#8737FF] text-white shadow-[0_0_16px_rgba(135,55,255,0.45)]"
                  : "text-[#D9D9E2]/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Barcode className="w-3.5 h-3.5 flex-shrink-0" />
              <span>По UPC</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("query");
                setSearchError("");
              }}
              className={`py-2.5 px-2 rounded-xl transition font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap ${
                searchMode === "query"
                  ? "bg-[#8737FF] text-white shadow-[0_0_16px_rgba(135,55,255,0.45)]"
                  : "text-[#D9D9E2]/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Поиск</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("manual");
                setStep(2);
              }}
              className={`py-2.5 px-2 rounded-xl transition font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap ${
                searchMode === "manual"
                  ? "bg-[#8737FF] text-white shadow-[0_0_16px_rgba(135,55,255,0.45)]"
                  : "text-[#D9D9E2]/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Вручную</span>
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
            <div className="space-y-4 pt-2">
              <form onSubmit={handleUpcLookup}>
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                    UPC или EAN штрихкод релиза (12 или 13 цифр):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Например: 8721616198715"
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
                    💡 Если релиз ещё не вышел в магазинах, штрихкод будет принят для запуска <span className="text-[#00F0FF] font-semibold">Pre-save кампании</span>.
                  </p>
                </div>
              </form>

              {/* Unreleased UPC Activation Card */}
              {unreleasedPrompt && (
                <div className="p-5 rounded-2xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#00F0FF]">
                      Штрихкод подтверждён · Режим Pre-save кампании
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-white">
                      UPC: <code className="text-[#00F0FF] font-bold px-1.5 py-0.5 rounded bg-black/50 border border-[#00F0FF]/30">{unreleasedPrompt.upc}</code>
                    </p>
                    <p className="text-xs text-[#D9D9E2]/80 leading-relaxed font-sans">
                      {unreleasedPrompt.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="font-mono text-[11px] uppercase tracking-wider text-white/80 block mb-1">
                        Название трека / альбома:
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Tide to life"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00F0FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[11px] uppercase tracking-wider text-white/80 block mb-1">
                        Исполнитель:
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Narvent"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00F0FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[11px] uppercase tracking-wider text-white/80 block mb-1">
                        Дата выхода (опц.):
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!title.trim() || !artist.trim()) {
                          setSearchError("Укажите название трека и имя исполнителя");
                          return;
                        }
                        setUpc(unreleasedPrompt.upc);
                        setIsOutNow(false);
                        const generated = generateSlug(artist, title);
                        setCustomSlug(generated);
                        setPlatforms((prev) =>
                          prev.map((p) => ({
                            ...p,
                            url: p.url.trim() || buildPlatformSearchUrl(p.platform_key, artist, title),
                            is_direct: Boolean(p.url.trim() && p.is_direct),
                            button_text: "Pre-save",
                          }))
                        );
                        setSearchError("");
                        setStep(2);
                      }}
                      className="btn-energy px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                    >
                      <Zap className="w-4 h-4 text-[#00F0FF]" />
                      <span>Настроить страницу Pre-save →</span>
                    </button>

                    {myReleases.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode("my_releases");
                        }}
                        className="px-4 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 font-mono text-xs text-white/90 transition"
                      >
                        Выбрать из моих треков ({myReleases.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
            <h2 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-tight text-white">
              Метаданные и Стриминги
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/80 font-sans">
              Проверьте информацию о треке, обложку и настройте ссылки на музыкальные площадки.
            </p>
          </div>

          {/* Pre-save Mode Alert */}
          {/* Band.link-style Live Mini Header */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#8737FF]/15 via-white/[0.03] to-transparent border border-white/10 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/15 flex-shrink-0 flex items-center justify-center">
              {coverUrl ? (
                <img src={coverUrl} alt={title || "Cover"} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-5 h-5 text-white/30" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                    isOutNow
                      ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                      : "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30"
                  }`}
                >
                  {isOutNow ? "OUT NOW" : "PRE-SAVE"}
                </span>
                {upc && (
                  <span className="font-mono text-[10px] text-[#D9D9E2]/60">
                    UPC: {upc}
                  </span>
                )}
                {releaseDate && (
                  <span className="font-mono text-[10px] text-[#D9D9E2]/60 inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#B46BFF]" />
                    {releaseDate}
                  </span>
                )}
              </div>
              <p className="font-heavy text-sm sm:text-base text-white truncate">
                {title || "Название релиза"}
              </p>
              <p className="font-sans text-xs text-[#D9D9E2]/70 truncate">
                {artist || "Имя артиста"}
              </p>
            </div>
          </div>

          {!isOutNow && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8737FF]/15 via-[#00F0FF]/10 to-transparent border border-[#00F0FF]/40 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00F0FF]">
                    Режим Pre-save кампании {upc && `· UPC: ${upc}`}
                  </span>
                </div>
                <p className="text-xs text-[#D9D9E2]/85 leading-relaxed font-sans">
                  Страница будет собирать слушателей до официальной премьеры с живым таймером обратного отсчёта. Ссылки на стриминги уже предзаполнены и обновятся автоматически.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            {/* Cover Column with Direct Mobile/PC Upload */}
            <div className="sm:col-span-4 space-y-3">
              <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block">
                Обложка релиза:
              </label>

              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileUpload}
              />

              <div
                onClick={() => coverFileInputRef.current?.click()}
                className="w-full aspect-square rounded-2xl overflow-hidden bg-black/60 border border-white/20 relative group cursor-pointer hover:border-[#00F0FF] transition shadow-lg"
              >
                {coverUrl ? (
                  <>
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-center p-3 text-white transition">
                      <Camera className="w-6 h-6 mb-1 text-[#00F0FF]" />
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                        Нажмите, чтобы заменить
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white/50 font-mono text-xs group-hover:text-white transition">
                    {isUploadingCover ? (
                      <Sparkles className="w-7 h-7 mb-2 text-[#00F0FF] animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7 mb-2 text-[#B46BFF] group-hover:text-[#00F0FF] transition" />
                    )}
                    <span className="font-bold">
                      {isUploadingCover ? "Обработка фото..." : "Нажмите для выбора фото"}
                    </span>
                    <span className="text-[10px] text-white/40 mt-1">Галерея телефона или файлы</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={isUploadingCover}
                className="w-full py-2.5 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition"
              >
                <Camera className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{coverUrl ? "Сменить фото с устройства" : "Загрузить фото с телефона / ПК"}</span>
              </button>

              <div className="pt-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 block mb-1">
                  Или вставьте прямую ссылку:
                </span>
                <input
                  type="url"
                  placeholder="https://.../cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none"
                />
              </div>
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

              {/* Audio Snippet & Lyrics Card (Interactive Landing Features) */}
              <div className="p-4 rounded-2xl border border-[#00F0FF]/25 bg-gradient-to-br from-[#00F0FF]/[0.05] via-[#8737FF]/[0.04] to-transparent space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00F0FF] font-bold">
                    ⚡ ИНТЕРАКТИВНЫЕ ФИШКИ СТРАНИЦЫ (ОПЦИОНАЛЬНО)
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8737FF]/20 text-[#B46BFF] border border-[#B46BFF]/30">
                    PRO FEATURE
                  </span>
                </div>

                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wider text-[#D9D9E2]/75 block mb-1">
                    Аудио-сниппет 15 сек (прямая ссылка на MP3/WAV или оставьте для авто-поиска):
                  </label>
                  <input
                    type="url"
                    value={previewAudioUrl}
                    onChange={(e) => setPreviewAudioUrl(e.target.value)}
                    placeholder="https://.../snippet-15s.mp3"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-[#00F0FF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wider text-[#D9D9E2]/75 block mb-1">
                    Главные строчки / Припев (Lyrics Card на странице релиза):
                  </label>
                  <textarea
                    rows={3}
                    value={lyricsSnippet}
                    onChange={(e) => setLyricsSnippet(e.target.value)}
                    placeholder={"Вставьте припев или главные панчлайны трека...\nСлушатели смогут раскрыть карточку текста прямо на странице."}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-[#B46BFF] focus:outline-none resize-none"
                  />
                </div>

                {/* Collab Artist Split Link */}
                <div className="pt-2 border-t border-white/10">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-[#00F0FF] font-bold block mb-1">
                    🤝 COLLAB LINK — Второй артист на фите (опционально):
                  </label>
                  <input
                    type="text"
                    value={collabArtist}
                    onChange={(e) => setCollabArtist(e.target.value)}
                    placeholder="Например: KIZARU или @username резидента CXRNER"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-[#00F0FF] focus:outline-none font-mono"
                  />
                </div>

                {/* Viral Fan-Unlock Gate */}
                <div className="pt-2 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#F59E0B] font-bold">
                      🔓 FAN-UNLOCK GOAL — Секретный бонус за 🔥 реакции фанатов:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-wider text-white/60 block mb-1">
                        Цель (кол-во 🔥):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        value={fanGateTarget}
                        onChange={(e) => setFanGateTarget(e.target.value)}
                        placeholder="Например: 50"
                        className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F59E0B] focus:outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-white/60 block mb-1">
                        Что откроется фанатам (заголовок цели):
                      </label>
                      <input
                        type="text"
                        value={fanGateTitle}
                        onChange={(e) => setFanGateTitle(e.target.value)}
                        placeholder="Например: Unreleased Demo / TG-канал / Промокод на мерч"
                        className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F59E0B] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-white/60 block mb-1">
                      Секретная ссылка или бонус-код (появится когда шкала 🔥 достигнет 100%):
                    </label>
                    <input
                      type="text"
                      value={fanGateContent}
                      onChange={(e) => setFanGateContent(e.target.value)}
                      placeholder="https://t.me/+secret... или промокод CXRNER-VIP"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F59E0B] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streaming Platforms List */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-white font-bold block">
                  Площадки и ссылки для слушателей
                </label>
                <p className="text-[11px] text-[#D9D9E2]/60 font-sans">
                  Все ссылки подтягиваются автоматически — при желании вставьте точный URL вручную.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillPlatforms}
                className="px-3 py-1.5 rounded-xl border border-[#00F0FF]/35 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Автозаполнить все</span>
              </button>
            </div>
            <div className="space-y-2.5">
              {platforms.map((p) => {
                const meta = getPlatformVisualMeta(p.platform_key);
                return (
                  <div
                    key={p.platform_key}
                    className={`p-3 rounded-xl border transition space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3 ${
                      p.is_enabled
                        ? "border-white/15 bg-white/[0.04]"
                        : "border-white/5 bg-white/[0.015] opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:w-48 flex-shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={p.is_enabled}
                          onChange={(e) => updatePlatform(p.platform_key, { is_enabled: e.target.checked })}
                          className="accent-[#B46BFF] w-4 h-4 rounded flex-shrink-0"
                        />
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10"
                          style={{ background: meta.bgGradient, color: meta.fgColor }}
                        >
                          <PlatformLogo platformKey={p.platform_key} className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-mono text-xs uppercase tracking-wider text-white truncate font-bold">
                          {p.platform_name}
                        </span>
                      </div>
                      {p.url.trim() && (
                        <span
                          className={`sm:hidden font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full border ${
                            p.is_direct
                              ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]"
                              : "border-[#B46BFF]/40 bg-[#8737FF]/15 text-[#D9D9E2]"
                          }`}
                        >
                          {p.is_direct ? "Прямая" : "Авто"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="url"
                          placeholder={`Ссылка на ${p.platform_name}`}
                          value={p.url}
                          onChange={(e) =>
                            updatePlatform(p.platform_key, { url: e.target.value, is_direct: true })
                          }
                          className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none pr-16 ${
                            p.platform_key === "yandex" && p.url.includes("/artist/")
                              ? "border-amber-500/70 focus:border-amber-400"
                              : "border-white/10 focus:border-[#B46BFF]"
                          }`}
                        />
                        {p.url.trim() && (
                          <span
                            className={`hidden sm:inline-flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full border pointer-events-none ${
                              p.platform_key === "yandex" && p.url.includes("/artist/")
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                : p.is_direct
                                ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]"
                                : "border-[#B46BFF]/40 bg-[#8737FF]/15 text-[#D9D9E2]"
                            }`}
                          >
                            {p.platform_key === "yandex" && p.url.includes("/artist/")
                              ? "Профиль ⚠️"
                              : p.is_direct
                              ? "Прямая"
                              : "Авто"}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={p.button_text}
                        onChange={(e) => updatePlatform(p.platform_key, { button_text: e.target.value })}
                        className="w-24 sm:w-28 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white text-center font-mono flex-shrink-0"
                      />
                    </div>
                    {p.platform_key === "yandex" && p.url.includes("/artist/") && (
                      <p className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-mono leading-normal w-full">
                        ⚠️ Вы указали профиль артиста (/artist/). Для смарт-ссылки используйте прямую ссылку на трек или альбом (/album/...).
                      </p>
                    )}
                  </div>
                );
              })}
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
            <h2 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-tight text-white">
              Выберите стиль смарт-ссылки
            </h2>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/80 font-sans">
              Каждый стиль создан под атмосферу современной музыки. Выберите оформление под настроение вашего трека.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 7 Atmospheric Theme Selection Cards */}
            <div className="lg:col-span-7 space-y-3">
              {SMART_LINK_THEMES.map((t) => {
                const isSelected = template === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer space-y-2 relative overflow-hidden bg-gradient-to-r ${t.previewGradient} ${
                      isSelected
                        ? "border-white/50 ring-2 ring-[#8737FF] shadow-[0_0_35px_rgba(135,55,255,0.35)] scale-[1.01]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heavy text-sm sm:text-base uppercase tracking-wider text-white">
                            {t.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10 font-mono text-[9px] uppercase tracking-wider"
                            style={{ color: t.accentHex }}
                          >
                            {t.vibeTag}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center -space-x-1">
                          {t.swatchColors.map((hex, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-white/30"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#8737FF] flex items-center justify-center text-white shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-white/20" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#D9D9E2]/80 leading-relaxed font-sans">{t.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Right: Live Interactive Smartphone Mockup */}
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#00F0FF] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00F0FF]" />
                <span>ЖИВОЙ ПРЕДПРОСМОТР СМАРТФОНА</span>
              </div>

              {(() => {
                const activeTheme = getSmartLinkTheme(template);
                return (
                  <div className="w-68 sm:w-72 rounded-[40px] border-4 border-neutral-800 bg-[#07050d] p-3 shadow-[0_0_55px_rgba(0,0,0,0.85)] relative overflow-hidden">
                    {/* Dynamic island notch */}
                    <div className="w-20 h-4 bg-black rounded-full mx-auto mb-3 relative z-20" />

                    {/* Inner Screen */}
                    <div
                      className={`rounded-[30px] p-4 text-center space-y-3 min-h-[410px] flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${activeTheme.mockupBgClass}`}
                    >
                      <ThemeAmbientBackground theme={activeTheme} coverUrl={coverUrl} compact />

                      <div className="relative z-10 space-y-3">
                        {/* Cover Art in Mockup */}
                        <div className={`w-24 h-24 mx-auto overflow-hidden relative bg-black/60 ${activeTheme.coverFrameClass}`}>
                          {coverUrl ? (
                            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              <Music2 className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Title & Artist */}
                        <div className="px-1">
                          <p className={`text-sm truncate ${activeTheme.titleClass}`}>
                            {title || "Название релиза"}
                          </p>
                          <p className={`text-[10px] truncate mt-0.5 ${activeTheme.artistClass}`}>
                            {artist || "Исполнитель"}
                          </p>
                        </div>

                        {/* Pre-save countdown mock */}
                        {!isOutNow && (
                          <div
                            className="p-1.5 rounded-xl bg-black/50 border font-mono text-[8px] uppercase"
                            style={{ borderColor: `${activeTheme.accentHex}45`, color: activeTheme.accentHex }}
                          >
                            <span>⏳ PRE-SAVE: 14 ДНЕЙ 08:24:12</span>
                          </div>
                        )}

                        {/* Buttons Mockup with Real Platform Logos */}
                        <div className="space-y-1.5 pt-1">
                          {["yandex", "spotify", "apple", "vk"].map((pKey) => {
                            const meta = getPlatformVisualMeta(pKey);
                            return (
                              <div
                                key={pKey}
                                className={`px-2.5 py-2 text-[10px] flex items-center justify-between gap-2 transition-all duration-300 ${activeTheme.mockupButtonClass}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10"
                                    style={{ background: meta.bgGradient, color: meta.fgColor }}
                                  >
                                    <PlatformLogo platformKey={pKey} className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="font-sans font-semibold text-white truncate">
                                    {meta.shortName}
                                  </span>
                                </div>
                                <span
                                  className="font-mono text-[9px] font-bold uppercase flex-shrink-0"
                                  style={{ color: activeTheme.accentHex }}
                                >
                                  {isOutNow ? "Слушать" : "Pre-save"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="relative z-10 pt-2 font-mono text-[7px] text-white/45 uppercase tracking-widest">
                        CXRNER LINK • 2026
                      </div>
                    </div>
                  </div>
                );
              })()}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-white/15 text-xs font-mono uppercase tracking-wider text-[#D9D9E2] hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit("draft")}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20 text-xs font-mono uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50 whitespace-nowrap text-center"
              >
                Сохранить черновик
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit("published")}
                className="w-full sm:w-auto btn-energy px-8 py-3.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(135,55,255,0.4)] disabled:opacity-50 whitespace-nowrap text-center"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{isSubmitting ? "Публикация..." : "Опубликовать"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
