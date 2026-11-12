// Music Metadata & UPC/EAN Release Lookup Adapters for CXRNER LINK
import { getSupabaseServerClient } from "./supabaseServer";
import { validateUpcChecksum } from "./slug";

export { validateUpcChecksum };

export interface PlatformLinkCandidate {
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
}

export interface ReleaseLookupResult {
  source: "cxrner" | "itunes" | "deezer" | "musicbrainz" | "spotify" | "manual" | "unreleased_presave";
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
  is_unreleased?: boolean;
}

/** 1. Lookup in internal CXRNER database (cxrner_forms) */
async function lookupCxrnerDbByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const cleanUpc = upc.trim().replace(/\D/g, "");

    const { data: rows } = await supabase
      .from("cxrner_forms")
      .select("id, artist_name, track_name, genre, status, upc, created_at, form_payload")
      .or(`upc.eq.${cleanUpc}`)
      .limit(1);

    if (rows && rows.length > 0) {
      const form = rows[0];
      const payload = form.form_payload || {};
      const cover =
        payload.cover_url ||
        payload.artwork_url ||
        payload.cover ||
        payload.image_url ||
        payload.media_url ||
        "";
      const relDate = payload.release_date || form.created_at?.split("T")[0] || null;
      const isPast = relDate ? new Date(relDate) <= new Date() : false;

      return {
        source: "cxrner",
        title: form.track_name || "Без названия",
        artist: form.artist_name || "Артист",
        cover_url: cover,
        upc: cleanUpc,
        release_date: relDate || undefined,
        genre: form.genre || "Electronic",
        release_type: "single",
        label_name: "CXRNER MUSIC",
        is_unreleased: !isPast,
        platforms: [
          { platform_key: "yandex", platform_name: "Яндекс Музыка", url: "", button_text: isPast ? "Слушать" : "Pre-save" },
          { platform_key: "vk", platform_name: "VK Музыка", url: "", button_text: isPast ? "Слушать" : "Pre-save" },
          { platform_key: "spotify", platform_name: "Spotify", url: "", button_text: isPast ? "Слушать" : "Pre-save" },
          { platform_key: "apple", platform_name: "Apple Music", url: "", button_text: isPast ? "Слушать" : "Pre-save" },
          { platform_key: "youtube", platform_name: "YouTube Music", url: "", button_text: isPast ? "Слушать" : "Pre-save" },
        ],
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** 2. Lookup via Apple iTunes Search/Lookup API */
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
      is_unreleased: false,
    };
  } catch {
    return null;
  }
}

/** 3. Lookup via Deezer API */
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
      is_unreleased: false,
    };
  } catch {
    return null;
  }
}

/** 4. Lookup via MusicBrainz API */
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
      cover_url: "",
      upc,
      release_date: releaseDate,
      genre: "Electronic",
      release_type: "single",
      label_name: item["label-info-list"]?.[0]?.label?.name || "CXRNER MUSIC",
      platforms: [],
      is_unreleased: false,
    };
  } catch {
    return null;
  }
}

/** Primary Orchestrator: UPC / EAN Lookup with Pre-save Fallback */
export async function lookupReleaseByUpc(upc: string): Promise<ReleaseLookupResult> {
  const cleanUpc = upc.trim().replace(/\D/g, "");

  // 1. Check internal CXRNER database
  const cxrnerDbResult = await lookupCxrnerDbByUpc(cleanUpc);
  if (cxrnerDbResult) {
    return cxrnerDbResult;
  }

  // 2. Run Apple iTunes and Deezer concurrently
  const [itunesResult, deezerResult] = await Promise.all([
    lookupItunesByUpc(cleanUpc),
    lookupDeezerByUpc(cleanUpc),
  ]);

  if (itunesResult && deezerResult) {
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

  // 3. Fallback to MusicBrainz
  const mbResult = await lookupMusicBrainzByUpc(cleanUpc);
  if (mbResult) return mbResult;

  // 4. If not found in public stores, it is an UNRELEASED track ready for Pre-save!
  const defaultFutureDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  return {
    source: "unreleased_presave",
    title: "",
    artist: "",
    cover_url: "",
    upc: cleanUpc,
    release_date: defaultFutureDate,
    genre: "Electronic",
    release_type: "single",
    label_name: "CXRNER MUSIC",
    is_unreleased: true,
    platforms: [
      { platform_key: "yandex", platform_name: "Яндекс Музыка", url: "", button_text: "Pre-save" },
      { platform_key: "vk", platform_name: "VK Музыка", url: "", button_text: "Pre-save" },
      { platform_key: "spotify", platform_name: "Spotify", url: "", button_text: "Pre-save" },
      { platform_key: "apple", platform_name: "Apple Music", url: "", button_text: "Pre-save" },
      { platform_key: "youtube", platform_name: "YouTube Music", url: "", button_text: "Pre-save" },
    ],
  };
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
            is_unreleased: false,
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
