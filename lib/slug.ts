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
