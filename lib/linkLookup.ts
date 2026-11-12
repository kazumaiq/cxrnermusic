// Music Metadata & UPC/EAN Release Lookup Adapters for CXRNER LINK

export interface PlatformLinkCandidate {
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
}

export interface ReleaseLookupResult {
  source: "cxrner" | "itunes" | "deezer" | "musicbrainz" | "spotify" | "manual";
  title: string;
  artist: string;
  cover_url: string;
  upc: string;
  isrc?: string;
  release_date?: string;
  genre?: string;
  release_type: "single" | "ep" | "album";
  label_name: string;
  platforms: PlatformLinkCandidate[];
}

/** Validates UPC-A (12-digit) or EAN-13 (13-digit) checksum */
export function validateUpcChecksum(code: string): { isValid: boolean; error?: string } {
  const digits = code.trim().replace(/\D/g, "");

  if (digits.length !== 12 && digits.length !== 13) {
    return {
      isValid: false,
      error: "UPC/EAN код должен содержать ровно 12 (UPC-A) или 13 (EAN-13) цифр",
    };
  }

  // Modulo-10 checksum check
  const chars = digits.split("").map(Number);
  const checkDigit = chars[chars.length - 1];
  const payload = chars.slice(0, -1);

  let sum = 0;
  if (digits.length === 12) {
    // UPC-A: odd position (1-based) * 3, even position * 1
    for (let i = 0; i < payload.length; i++) {
      sum += (i % 2 === 0 ? 3 : 1) * payload[i];
    }
  } else {
    // EAN-13: odd position (1-based) * 1, even position * 3
    for (let i = 0; i < payload.length; i++) {
      sum += (i % 2 === 0 ? 1 : 3) * payload[i];
    }
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;

  if (checkDigit !== calculatedCheck) {
    return {
      isValid: false,
      error: `Неверная контрольная цифра кода (ожидалась ${calculatedCheck}, введено ${checkDigit})`,
    };
  }

  return { isValid: true };
}

/** 1. Lookup via Apple iTunes Search/Lookup API */
async function lookupItunesByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const url = `https://itunes.apple.com/lookup?upc=${encodeURIComponent(upc)}&entity=album`;
    const res = await fetch(url, { headers: { "User-Agent": "CXRNER-LINK/1.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const item = data.results[0];
    const cover = (item.artworkUrl100 || "").replace("100x100bb", "1000x1000bb");

    const trackCount = item.trackCount || 1;
    let relType: "single" | "ep" | "album" = "single";
    if (trackCount > 6) relType = "album";
    else if (trackCount > 1) relType = "ep";

    const platforms: PlatformLinkCandidate[] = [];
    if (item.collectionViewUrl) {
      platforms.push({
        platform_key: "apple",
        platform_name: "Apple Music",
        url: item.collectionViewUrl,
        button_text: "Слушать",
      });
    }

    return {
      source: "itunes",
      title: item.collectionName || "",
      artist: item.artistName || "",
      cover_url: cover,
      upc,
      release_date: item.releaseDate ? item.releaseDate.split("T")[0] : undefined,
      genre: item.primaryGenreName || "Electronic",
      release_type: relType,
      label_name: item.copyright ? item.copyright.replace(/^©\s*\d+\s*/, "").replace(/^℗\s*\d+\s*/, "") : "CXRNER MUSIC",
      platforms,
    };
  } catch {
    return null;
  }
}

/** 2. Lookup via Deezer API */
async function lookupDeezerByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const url = `https://api.deezer.com/album/upc:${encodeURIComponent(upc)}`;
    const res = await fetch(url, { headers: { "User-Agent": "CXRNER-LINK/1.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const item = await res.json();
    if (!item || item.error || !item.title) return null;

    const cover = item.cover_xl || item.cover_big || item.cover_medium;
    const trackCount = item.nb_tracks || 1;
    let relType: "single" | "ep" | "album" = "single";
    if (trackCount > 6) relType = "album";
    else if (trackCount > 1) relType = "ep";

    const platforms: PlatformLinkCandidate[] = [];
    if (item.link) {
      platforms.push({
        platform_key: "deezer",
        platform_name: "Deezer",
        url: item.link,
        button_text: "Слушать",
      });
    }

    return {
      source: "deezer",
      title: item.title,
      artist: item.artist?.name || "",
      cover_url: cover,
      upc,
      release_date: item.release_date,
      genre: item.genres?.data?.[0]?.name || "Electronic",
      release_type: relType,
      label_name: item.label || "CXRNER MUSIC",
      platforms,
    };
  } catch {
    return null;
  }
}

/** 3. Lookup via MusicBrainz API */
async function lookupMusicBrainzByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const url = `https://musicbrainz.org/ws/2/release/?query=barcode:${encodeURIComponent(upc)}&fmt=json`;
    const res = await fetch(url, { headers: { "User-Agent": "CXRNER-LINK/1.0 (info@cxrnermusic.com)" }, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.releases || data.releases.length === 0) return null;

    const item = data.releases[0];
    const artist = item["artist-credit"]?.[0]?.name || "";
    const title = item.title || "";
    const releaseDate = item.date;

    return {
      source: "musicbrainz",
      title,
      artist,
      cover_url: "", // MusicBrainz needs separate cover art archive call
      upc,
      release_date: releaseDate,
      genre: "Electronic",
      release_type: "single",
      label_name: item["label-info-list"]?.[0]?.label?.name || "CXRNER MUSIC",
      platforms: [],
    };
  } catch {
    return null;
  }
}

/** Primary Orchestrator: UPC / EAN Lookup */
export async function lookupReleaseByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  const cleanUpc = upc.trim().replace(/\D/g, "");
  if (!cleanUpc) return null;

  // Run Apple iTunes and Deezer concurrently
  const [itunesResult, deezerResult] = await Promise.all([
    lookupItunesByUpc(cleanUpc),
    lookupDeezerByUpc(cleanUpc),
  ]);

  if (itunesResult && deezerResult) {
    // Merge platforms and best cover
    const platforms = [...itunesResult.platforms];
    deezerResult.platforms.forEach((dp) => {
      if (!platforms.some((p) => p.platform_key === dp.platform_key)) {
        platforms.push(dp);
      }
    });

    return {
      ...itunesResult,
      cover_url: itunesResult.cover_url || deezerResult.cover_url,
      platforms,
    };
  }

  if (itunesResult) return itunesResult;
  if (deezerResult) return deezerResult;

  // Fallback to MusicBrainz
  const mbResult = await lookupMusicBrainzByUpc(cleanUpc);
  if (mbResult) return mbResult;

  return null;
}

/** Search Releases by Text Query (Artist / Title) across catalogs */
export async function searchReleasesByQuery(query: string): Promise<ReleaseLookupResult[]> {
  const q = query.trim();
  if (!q) return [];

  const results: ReleaseLookupResult[] = [];

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=6`;
    const res = await fetch(itunesUrl, { headers: { "User-Agent": "CXRNER-LINK/1.0" } });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((item: any) => {
          const cover = (item.artworkUrl100 || "").replace("100x100bb", "1000x1000bb");
          results.push({
            source: "itunes",
            title: item.collectionName || "",
            artist: item.artistName || "",
            cover_url: cover,
            upc: item.upc || "",
            release_date: item.releaseDate ? item.releaseDate.split("T")[0] : undefined,
            genre: item.primaryGenreName || "Electronic",
            release_type: (item.trackCount || 1) > 6 ? "album" : (item.trackCount || 1) > 1 ? "ep" : "single",
            label_name: item.copyright || "CXRNER MUSIC",
            platforms: item.collectionViewUrl
              ? [
                  {
                    platform_key: "apple",
                    platform_name: "Apple Music",
                    url: item.collectionViewUrl,
                    button_text: "Слушать",
                  },
                ]
              : [],
          });
        });
      }
    }
  } catch {}

  return results;
}
