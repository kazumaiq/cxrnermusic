// Robust transliteration & slug generator for CXRNER LINK

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function transliterate(text: string): string {
  return text
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      if (CYRILLIC_TO_LATIN[lower] !== undefined) {
        return CYRILLIC_TO_LATIN[lower];
      }
      return char;
    })
    .join("");
}

export function generateSlug(artist: string, title: string): string {
  const combined = `${artist.trim()} ${title.trim()}`;
  const transliterated = transliterate(combined);

  let clean = transliterated
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // remove symbols
    .trim()
    .replace(/\s+/g, "-") // collapse whitespace to hyphens
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens

  return clean || `release-${Date.now().toString(36)}`;
}

export function validateCustomSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { isValid: false, error: "Slug не может быть пустым" };
  }

  const clean = slug.trim().toLowerCase();

  if (clean.length < 2) {
    return { isValid: false, error: "Slug должен содержать минимум 2 символа" };
  }

  if (clean.length > 64) {
    return { isValid: false, error: "Slug не может быть длиннее 64 символов" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean)) {
    return {
      isValid: false,
      error: "Slug может содержать только строчные латинские буквы, цифры и дефисы (без дефисов в начале и конце)",
    };
  }

  // Reserved keywords
  const reserved = [
    "api",
    "dashboard",
    "admin",
    "auth",
    "login",
    "register",
    "logout",
    "new",
    "create",
    "edit",
    "delete",
    "analytics",
    "settings",
    "templates",
    "integrations",
    "terms",
    "privacy",
    "support",
    "help",
    "link",
    "links",
  ];

  if (reserved.includes(clean)) {
    return { isValid: false, error: `Slug "${clean}" зарезервирован системой` };
  }

  return { isValid: true };
}

/** Normalizes DD.MM.YYYY, YYYY-MM-DD, or ISO timestamp into YYYY-MM-DD for <input type="date"> */
export function normalizeReleaseDate(raw?: string | null): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  // DD.MM.YYYY or DD/MM/YYYY
  const ruMatch = /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(trimmed);
  if (ruMatch) {
    return `${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return "";
}

/** Generates a smart release search URL for any streaming platform when direct link is absent */
export function buildPlatformSearchUrl(platformKey: string, artist: string, title: string): string {
  const q = `${artist.trim()} ${title.trim()}`.trim();
  if (!q) return "";
  const encoded = encodeURIComponent(q);

  switch (platformKey) {
    case "yandex":
      return `https://music.yandex.ru/search?text=${encoded}`;
    case "vk":
      return `https://vk.com/audio?q=${encodeURIComponent(`${artist.trim()} - ${title.trim()}`)}`;
    case "spotify":
      return `https://open.spotify.com/search/${encoded}`;
    case "apple":
      return `https://music.apple.com/search?term=${encoded}`;
    case "youtube":
      return `https://music.youtube.com/search?q=${encoded}`;
    case "deezer":
      return `https://www.deezer.com/search/${encoded}`;
    case "zvuk":
      return `https://zvuk.com/search?query=${encoded}`;
    default:
      return "";
  }
}

/**
 * Returns the fully qualified public URL for a smart link, dynamically adapting to
 * whether the site is running on Vercel preview (cxrnermusic.vercel.app),
 * local development (localhost), or custom domain (link.cxrnermusic.com).
 */
export function getSmartLinkUrl(slug: string): string {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    // If running on custom production domain with link. subdomain enabled
    if (host.includes("cxrnermusic.com") && process.env.NEXT_PUBLIC_LINK_DOMAIN) {
      return `${process.env.NEXT_PUBLIC_LINK_DOMAIN.replace(/\/$/, "")}/${slug}`;
    }
    // Default fallback to current host /link/[slug] (e.g. https://cxrnermusic.vercel.app/link/[slug])
    return `${window.location.origin}/link/${slug}`;
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cxrnermusic.vercel.app";
  return `${base.replace(/\/$/, "")}/link/${slug}`;
}

/**
 * Returns a human-friendly prefix for display in the UI (e.g. 'cxrnermusic.vercel.app/link/'
 * or 'link.cxrnermusic.com/').
 */
export function getSmartLinkDisplayPrefix(): string {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("cxrnermusic.com")) {
      return "link.cxrnermusic.com/";
    }
    return `${host}/link/`;
  }
  return "cxrnermusic.vercel.app/link/";
}

/** Validates UPC-A (12-digit) or EAN-13 (13-digit) code with soft check */
export function validateUpcChecksum(code: string): { isValid: boolean; warning?: string; error?: string } {
  const digits = code.trim().replace(/\D/g, "");

  if (!digits || digits.length < 6 || digits.length > 18) {
    return {
      isValid: false,
      error: "Штрихкод должен содержать от 6 до 18 цифр",
    };
  }

  return { isValid: true };
}
