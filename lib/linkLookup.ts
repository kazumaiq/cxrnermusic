// Music Metadata & UPC/EAN Release Lookup Adapters for CXRNER LINK (Band.link-grade Auto-Enrichment)
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./supabaseServer";
import {
  validateUpcChecksum,
  normalizeReleaseDate,
  buildPlatformSearchUrl,
  cleanReleaseTitleForSearch,
  cleanArtistForSearch,
  isPlatformSearchFallbackUrl,
} from "./slug";

export { validateUpcChecksum };

export interface PlatformLinkCandidate {
  platform_key: string;
  platform_name: string;
  url: string;
  button_text: string;
  is_direct?: boolean;
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

const CORE_PLATFORMS: Array<{ key: string; name: string }> = [
  { key: "yandex", name: "Яндекс Музыка" },
  { key: "vk", name: "VK Музыка" },
  { key: "spotify", name: "Spotify" },
  { key: "apple", name: "Apple Music" },
  { key: "youtube", name: "YouTube Music" },
  { key: "deezer", name: "Deezer" },
  { key: "zvuk", name: "Звук" },
];

async function getAdminOrServerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    return createClient(url, key, { auth: { persistSession: false } });
  }
  return getSupabaseServerClient();
}

function sanitizeReleaseYandexLink(rawUrl: any): string | null {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.startsWith("http")) return null;
  // If the link is an artist profile card (/artist/), it is NOT a release streaming link!
  if (rawUrl.includes("music.yandex.") && rawUrl.includes("/artist/")) {
    return null;
  }
  return rawUrl.trim();
}

function extractDirectPlatformsFromPayload(payload: Record<string, any>, isPast: boolean): PlatformLinkCandidate[] {
  if (!payload || typeof payload !== "object") return [];
  const btn = isPast ? "Слушать" : "Pre-save";
  const dsp = (payload.dsp_links && typeof payload.dsp_links === "object" ? payload.dsp_links : {}) as Record<string, any>;
  const direct: PlatformLinkCandidate[] = [];

  const pickUrl = (...vals: any[]): string => {
    for (const v of vals) {
      if (typeof v === "string" && v.trim().startsWith("http")) return v.trim();
    }
    return "";
  };

  const validYandex = sanitizeReleaseYandexLink(
    pickUrl(payload.yandex_album, payload.album_url, payload.yandex_track, dsp.yandex, payload.yandex)
  );
  if (validYandex && !isPlatformSearchFallbackUrl("yandex", validYandex)) {
    direct.push({ platform_key: "yandex", platform_name: "Яндекс Музыка", url: validYandex, button_text: btn, is_direct: true });
  }

  const mappings: Array<{ key: string; name: string; candidates: any[] }> = [
    { key: "vk", name: "VK Музыка", candidates: [dsp.vk, payload.vk_url, payload.vk] },
    { key: "spotify", name: "Spotify", candidates: [dsp.spotify, payload.spotify_url, payload.spotify] },
    { key: "apple", name: "Apple Music", candidates: [dsp.apple, payload.apple_url, payload.apple] },
    { key: "youtube", name: "YouTube Music", candidates: [dsp.youtube, payload.youtube_url, payload.youtube] },
    { key: "deezer", name: "Deezer", candidates: [dsp.deezer, payload.deezer_url, payload.deezer] },
    { key: "zvuk", name: "Звук", candidates: [dsp.zvuk, payload.zvuk_url, payload.zvuk] },
  ];

  for (const m of mappings) {
    const url = pickUrl(...m.candidates);
    if (url && !isPlatformSearchFallbackUrl(m.key, url)) {
      direct.push({ platform_key: m.key, platform_name: m.name, url, button_text: btn, is_direct: true });
    }
  }

  return direct;
}

/** Merge direct URLs and auto-fill remaining platforms with smart search URLs */
function buildFullPlatformList(
  artist: string,
  title: string,
  directCandidates: PlatformLinkCandidate[],
  isOutNow: boolean
): PlatformLinkCandidate[] {
  const btnText = isOutNow ? "Слушать" : "Pre-save";
  const directMap = new Map<string, PlatformLinkCandidate>();

  for (const c of directCandidates) {
    if (c.platform_key && c.url && c.url.startsWith("http")) {
      // Strictly prevent /artist/ cards from masquerading as release track links
      if (c.platform_key === "yandex") {
        const clean = sanitizeReleaseYandexLink(c.url);
        if (!clean) continue;
      }
      directMap.set(c.platform_key, { ...c, button_text: btnText, is_direct: true });
    }
  }

  return CORE_PLATFORMS.map((def) => {
    const direct = directMap.get(def.key);
    if (direct) return direct;

    const autoUrl = artist && title ? buildPlatformSearchUrl(def.key, artist, title) : "";
    return {
      platform_key: def.key,
      platform_name: def.name,
      url: autoUrl,
      button_text: btnText,
      is_direct: false,
    };
  });
}

/** 1. Lookup in internal CXRNER database (cxrner_forms & cxrner_releases) */
async function lookupCxrnerDbByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const supabase = await getAdminOrServerSupabase();
    const cleanUpc = upc.trim().replace(/\D/g, "");

    // Check cxrner_forms (by column upc or JSON form_payload->>upc)
    try {
      const { data: rows } = await supabase
        .from("cxrner_forms")
        .select("id, artist_name, track_name, genre, status, upc, created_at, form_payload")
        .or(`upc.eq.${cleanUpc},form_payload->>upc.eq.${cleanUpc}`)
        .limit(1);

      if (rows && rows.length > 0) {
        const form = rows[0];
        const payload = (form.form_payload as Record<string, any>) || {};
        const cover =
          payload.cover_url ||
          payload.artwork_url ||
          payload.cover ||
          payload.image_url ||
          payload.media_url ||
          "";
        const relDate =
          normalizeReleaseDate(payload.release_date || payload.date || form.created_at) || undefined;
        const isPast = relDate ? new Date(relDate) <= new Date() : false;
        const artist = form.artist_name || payload.nick || payload.artist || "";
        const title = cleanReleaseTitleForSearch(form.track_name || payload.name || payload.title || "");
        const direct = extractDirectPlatformsFromPayload(payload, isPast);

        return {
          source: "cxrner",
          title,
          artist,
          // Do not pull cover_url from CXRNER DB — covers are fetched exclusively from external bases (iTunes / Deezer / Cover Art Archive)
          cover_url: "",
          upc: cleanUpc,
          release_date: relDate,
          genre: form.genre || payload.genre || "Electronic",
          release_type: payload.type === "альбом" || payload.type === "album" ? "album" : "single",
          label_name: "CXRNER MUSIC",
          is_unreleased: !isPast,
          platforms: direct,
        };
      }
    } catch {}

    // Check cxrner_releases
    try {
      const { data: relRows } = await supabase
        .from("cxrner_releases")
        .select("*")
        .eq("upc", cleanUpc)
        .limit(1);

      if (relRows && relRows.length > 0) {
        const rel = relRows[0];
        const payload = rel.form_payload || rel.data || {};
        const cover = rel.cover_url || payload.cover_url || payload.artwork_url || "";
        const relDate =
          normalizeReleaseDate(rel.release_date || rel.date || payload.release_date || payload.date) || undefined;
        const isPast = relDate ? new Date(relDate) <= new Date() : false;
        const artist = rel.nick || rel.artist_name || payload.nick || "";
        const title = cleanReleaseTitleForSearch(rel.name || rel.track_name || payload.name || "");
        const direct = extractDirectPlatformsFromPayload({ ...payload, ...rel }, isPast);

        return {
          source: "cxrner",
          title,
          artist,
          // Do not pull cover_url from CXRNER DB — covers are fetched exclusively from external bases
          cover_url: "",
          upc: cleanUpc,
          release_date: relDate,
          genre: rel.genre || "Electronic",
          release_type: "single",
          label_name: "CXRNER MUSIC",
          is_unreleased: !isPast,
          platforms: direct,
        };
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

/** 2. Lookup via Apple iTunes Lookup API */
async function lookupItunesByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const url = `https://itunes.apple.com/lookup?upc=${encodeURIComponent(upc)}&entity=album`;
    const res = await fetch(url, { headers: { "User-Agent": "CXRNER-LINK/1.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const item = data.results[0];
    const cover = (item.artworkUrl100 || "").replace("100x100bb", "1000x1000bb");
    const relDate = normalizeReleaseDate(item.releaseDate) || undefined;
    const isPast = relDate ? new Date(relDate) <= new Date() : true;

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
        button_text: isPast ? "Слушать" : "Pre-save",
        is_direct: true,
      });
    }

    return {
      source: "itunes",
      title: cleanReleaseTitleForSearch(item.collectionName || ""),
      artist: item.artistName || "",
      cover_url: cover,
      upc,
      release_date: relDate,
      genre: item.primaryGenreName || "Electronic",
      release_type: relType,
      label_name: item.copyright ? item.copyright.replace(/^©\s*\d+\s*/, "").replace(/^℗\s*\d+\s*/, "") : "CXRNER MUSIC",
      platforms,
      is_unreleased: !isPast,
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

    const cover = item.cover_xl || item.cover_big || item.cover_medium || "";
    const relDate = normalizeReleaseDate(item.release_date) || undefined;
    const isPast = relDate ? new Date(relDate) <= new Date() : true;
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
        button_text: isPast ? "Слушать" : "Pre-save",
        is_direct: true,
      });
    }

    return {
      source: "deezer",
      title: item.title,
      artist: item.artist?.name || "",
      cover_url: cover,
      upc,
      release_date: relDate,
      genre: item.genres?.data?.[0]?.name || "Electronic",
      release_type: relType,
      label_name: item.label || "CXRNER MUSIC",
      platforms,
      is_unreleased: !isPast,
    };
  } catch {
    return null;
  }
}

/** 4. Lookup via MusicBrainz API (with url-rels for Spotify/YouTube/SoundCloud/etc.) */
async function lookupMusicBrainzByUpc(upc: string): Promise<ReleaseLookupResult | null> {
  try {
    const url = `https://musicbrainz.org/ws/2/release/?query=barcode:${encodeURIComponent(upc)}&inc=url-rels&fmt=json`;
    const res = await fetch(url, { headers: { "User-Agent": "CXRNER-LINK/1.0 (info@cxrnermusic.com)" }, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.releases || data.releases.length === 0) return null;

    const item = data.releases[0];
    const artist = item["artist-credit"]?.[0]?.name || "";
    const title = item.title || "";
    const releaseDate = normalizeReleaseDate(item.date) || undefined;
    const isPast = releaseDate ? new Date(releaseDate) <= new Date() : true;

    const platforms: PlatformLinkCandidate[] = [];
    const rels = Array.isArray(item.relations) ? item.relations : [];
    for (const rel of rels) {
      const href = rel?.url?.resource;
      if (!href || typeof href !== "string") continue;
      if (href.includes("open.spotify.com")) {
        platforms.push({ platform_key: "spotify", platform_name: "Spotify", url: href, button_text: isPast ? "Слушать" : "Pre-save", is_direct: true });
      } else if (href.includes("music.apple.com")) {
        platforms.push({ platform_key: "apple", platform_name: "Apple Music", url: href, button_text: isPast ? "Слушать" : "Pre-save", is_direct: true });
      } else if (href.includes("music.yandex.")) {
        const validYandex = sanitizeReleaseYandexLink(href);
        if (validYandex) {
          platforms.push({ platform_key: "yandex", platform_name: "Яндекс Музыка", url: validYandex, button_text: isPast ? "Слушать" : "Pre-save", is_direct: true });
        }
      } else if (href.includes("youtube.com") || href.includes("youtu.be")) {
        platforms.push({ platform_key: "youtube", platform_name: "YouTube Music", url: href, button_text: isPast ? "Слушать" : "Pre-save", is_direct: true });
      } else if (href.includes("deezer.com")) {
        platforms.push({ platform_key: "deezer", platform_name: "Deezer", url: href, button_text: isPast ? "Слушать" : "Pre-save", is_direct: true });
      }
    }

    let mbCover = "";
    if (item.id && item["cover-art-archive"]?.front) {
      try {
        const caaRes = await fetch(`https://coverartarchive.org/release/${item.id}/front-500`, { method: "HEAD" });
        if (caaRes.ok) {
          mbCover = caaRes.url || `https://coverartarchive.org/release/${item.id}/front-500`;
        }
      } catch {}
    }

    return {
      source: "musicbrainz",
      title,
      artist,
      cover_url: mbCover,
      upc,
      release_date: releaseDate,
      genre: "Electronic",
      release_type: "single",
      label_name: item["label-info-list"]?.[0]?.label?.name || "CXRNER MUSIC",
      platforms,
      is_unreleased: !isPast,
    };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeMatchTokens(str: string): string[] {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** 5a. Direct YouTube Music video lookup (verified against title tokens) */
async function lookupYoutubeMusicDirect(artist: string, title: string): Promise<string | null> {
  const cleanArtist = cleanArtistForSearch(artist);
  const cleanTitle = cleanReleaseTitleForSearch(title);
  if (!cleanTitle) return null;

  try {
    const q = `${cleanArtist} ${cleanTitle} Topic`.trim();
    const res = await fetchWithTimeout(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      },
      3500
    );
    if (!res.ok) return null;
    const html = await res.text();

    const titleTokens = normalizeMatchTokens(cleanTitle);
    const pairRe = /"videoId":"([A-Za-z0-9_-]{11})"[\s\S]{0,450}?"title":\{"runs":\[\{"text":"([^"]{1,160})"/g;
    let m: RegExpExecArray | null;
    let firstCandidate = "";
    while ((m = pairRe.exec(html)) !== null) {
      const vid = m[1];
      const vTitle = m[2].toLowerCase();
      if (!firstCandidate) firstCandidate = vid;
      if (titleTokens.length === 0 || titleTokens.every((tok) => vTitle.includes(tok))) {
        return `https://music.youtube.com/watch?v=${vid}`;
      }
    }

    if (firstCandidate) {
      return `https://music.youtube.com/watch?v=${firstCandidate}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** 5b. Optional Odesli / Songlink cross-platform resolver (requires ODESLI_API_KEY env var) */
async function lookupOdesliDirect(seedUrl: string): Promise<PlatformLinkCandidate[]> {
  const apiKey = (process.env.ODESLI_API_KEY || "").trim();
  if (!apiKey || !seedUrl || !seedUrl.startsWith("http")) return [];
  try {
    const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(seedUrl)}&userCountry=RU&key=${encodeURIComponent(apiKey)}`;
    const res = await fetchWithTimeout(apiUrl, { headers: { "User-Agent": "CXRNER-LINK/1.0" } }, 4000);
    if (!res.ok) return [];
    const data = await res.json();
    const links = data?.linksByPlatform || {};
    const out: PlatformLinkCandidate[] = [];
    const map: Array<{ src: string; key: string; name: string }> = [
      { src: "yandex", key: "yandex", name: "Яндекс Музыка" },
      { src: "spotify", key: "spotify", name: "Spotify" },
      { src: "appleMusic", key: "apple", name: "Apple Music" },
      { src: "youtubeMusic", key: "youtube", name: "YouTube Music" },
      { src: "deezer", key: "deezer", name: "Deezer" },
    ];
    for (const item of map) {
      const url = links?.[item.src]?.url;
      if (typeof url === "string" && url.startsWith("http")) {
        out.push({ platform_key: item.key, platform_name: item.name, url, button_text: "Слушать", is_direct: true });
      }
    }
    return out;
  } catch {
    return [];
  }
}

let cachedSpotifyToken: { token: string; expiresAt: number } | null = null;

/** 5c. Optional Spotify Web API direct resolver (uses SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET if set) */
async function lookupSpotifyDirect(artist: string, title: string, upc?: string): Promise<string | null> {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) return null;

  try {
    if (!cachedSpotifyToken || Date.now() >= cachedSpotifyToken.expiresAt) {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetchWithTimeout(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        },
        3500
      );
      if (!tokenRes.ok) return null;
      const tokenJson = await tokenRes.json();
      if (!tokenJson?.access_token) return null;
      cachedSpotifyToken = {
        token: tokenJson.access_token,
        expiresAt: Date.now() + Math.max(60, Number(tokenJson.expires_in || 3600) - 60) * 1000,
      };
    }

    const q = upc
      ? `upc:${upc.replace(/\D/g, "")}`
      : `track:${cleanReleaseTitleForSearch(title)} artist:${cleanArtistForSearch(artist).split(" ")[0] || ""}`.trim();
    const searchRes = await fetchWithTimeout(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${upc ? "album" : "track"}&limit=1`,
      { headers: { Authorization: `Bearer ${cachedSpotifyToken.token}` } },
      3500
    );
    if (!searchRes.ok) return null;
    const data = await searchRes.json();
    const item = upc ? data?.albums?.items?.[0] : data?.tracks?.items?.[0];
    return item?.external_urls?.spotify || null;
  } catch {
    return null;
  }
}

/** 5. Cross-Enrich by Artist + Title via iTunes, Deezer, YouTube Music & optional Odesli/Spotify */
async function enrichByArtistTitle(
  artist: string,
  title: string,
  options?: { upc?: string; seedUrl?: string }
): Promise<{ cover?: string; release_date?: string; platforms: PlatformLinkCandidate[] }> {
  const cleanArtist = cleanArtistForSearch(artist);
  const cleanTitle = cleanReleaseTitleForSearch(title);
  const q = `${cleanArtist} ${cleanTitle}`.trim();
  if (!q) return { platforms: [] };

  const primaryArtist = cleanArtist.split(" ")[0] || cleanArtist;
  const dzQuery = primaryArtist && cleanTitle ? `${primaryArtist} ${cleanTitle}` : q;

  const platforms: PlatformLinkCandidate[] = [];
  let cover = "";
  let release_date = "";

  const [itAlbumRes, itSongRes, dzAlbumRes, dzTrackRes, ytDirectUrl, spotifyDirectUrl] = await Promise.all([
    fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=1`, {
      headers: { "User-Agent": "CXRNER-LINK/1.0" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`, {
      headers: { "User-Agent": "CXRNER-LINK/1.0" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetchWithTimeout(`https://api.deezer.com/search/album?q=${encodeURIComponent(dzQuery)}&limit=1`, {
      headers: { "User-Agent": "CXRNER-LINK/1.0" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetchWithTimeout(`https://api.deezer.com/search/track?q=${encodeURIComponent(dzQuery)}&limit=1`, {
      headers: { "User-Agent": "CXRNER-LINK/1.0" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    lookupYoutubeMusicDirect(artist, title),
    lookupSpotifyDirect(artist, title, options?.upc),
  ]);

  const itItem = itAlbumRes?.results?.[0] || itSongRes?.results?.[0];
  let seedUrl = options?.seedUrl || "";
  if (itItem) {
    const viewUrl = itItem.collectionViewUrl || itItem.trackViewUrl;
    if (viewUrl) {
      if (!seedUrl) seedUrl = viewUrl;
      platforms.push({
        platform_key: "apple",
        platform_name: "Apple Music",
        url: viewUrl,
        button_text: "Слушать",
        is_direct: true,
      });
    }
    cover = (itItem.artworkUrl100 || "").replace("100x100bb", "1000x1000bb");
    release_date = normalizeReleaseDate(itItem.releaseDate);
  }

  const dzItem = dzAlbumRes?.data?.[0];
  const dzTrack = dzTrackRes?.data?.[0];
  if (dzItem?.link) {
    if (!seedUrl) seedUrl = dzItem.link;
    platforms.push({
      platform_key: "deezer",
      platform_name: "Deezer",
      url: dzItem.link,
      button_text: "Слушать",
      is_direct: true,
    });
    if (!cover) cover = dzItem.cover_xl || dzItem.cover_big || "";
  } else if (dzTrack?.link) {
    if (!seedUrl) seedUrl = dzTrack.link;
    platforms.push({
      platform_key: "deezer",
      platform_name: "Deezer",
      url: dzTrack.link,
      button_text: "Слушать",
      is_direct: true,
    });
    if (!cover) cover = dzTrack.album?.cover_xl || dzTrack.album?.cover_big || "";
  }

  if (ytDirectUrl) {
    platforms.push({
      platform_key: "youtube",
      platform_name: "YouTube Music",
      url: ytDirectUrl,
      button_text: "Слушать",
      is_direct: true,
    });
  }

  if (spotifyDirectUrl) {
    platforms.push({
      platform_key: "spotify",
      platform_name: "Spotify",
      url: spotifyDirectUrl,
      button_text: "Слушать",
      is_direct: true,
    });
  }

  if (seedUrl && process.env.ODESLI_API_KEY) {
    const odesliLinks = await lookupOdesliDirect(seedUrl);
    platforms.push(...odesliLinks);
  }

  return { cover, release_date, platforms };
}

/** Resolves direct platform URLs for an existing Smart Link (used on public load when /search fallbacks remain) */
export async function resolveDirectPlatformLinks(params: {
  artist: string;
  title: string;
  upc?: string;
  seedUrl?: string;
  isOutNow?: boolean;
}): Promise<PlatformLinkCandidate[]> {
  const enriched = await enrichByArtistTitle(params.artist, params.title, {
    upc: params.upc,
    seedUrl: params.seedUrl,
  });
  return buildFullPlatformList(params.artist, params.title, enriched.platforms, params.isOutNow !== false);
}

/** Primary Orchestrator: UPC / EAN Lookup with Full Platform Auto-Population */
export async function lookupReleaseByUpc(upc: string): Promise<ReleaseLookupResult> {
  const cleanUpc = upc.trim().replace(/\D/g, "");

  // Run CXRNER DB, iTunes, and Deezer concurrently for maximum speed & coverage
  const [cxrnerDbResult, itunesResult, deezerResult] = await Promise.all([
    lookupCxrnerDbByUpc(cleanUpc),
    lookupItunesByUpc(cleanUpc),
    lookupDeezerByUpc(cleanUpc),
  ]);

  // Combine whichever sources returned metadata
  let base = cxrnerDbResult || itunesResult || deezerResult;

  if (!base) {
    base = await lookupMusicBrainzByUpc(cleanUpc);
  }

  if (base && (base.title || base.artist)) {
    const mergedDirect: PlatformLinkCandidate[] = [
      ...(cxrnerDbResult?.platforms || []),
      ...(itunesResult?.platforms || []),
      ...(deezerResult?.platforms || []),
      ...(base.platforms || []),
    ];

    // Always prioritize covers from external databases (iTunes, Deezer, Cover Art Archive), never CXRNER DB
    let coverUrl = itunesResult?.cover_url || deezerResult?.cover_url || (base.source !== "cxrner" ? base.cover_url : "") || "";
    let relDate = cxrnerDbResult?.release_date || itunesResult?.release_date || deezerResult?.release_date || base.release_date || "";

    // Enrich missing direct Apple / Deezer / YouTube Music / Spotify / Odesli / cover / date
    const hasApple = mergedDirect.some((p) => p.platform_key === "apple");
    const hasDeezer = mergedDirect.some((p) => p.platform_key === "deezer");
    const hasYoutube = mergedDirect.some((p) => p.platform_key === "youtube");
    const seedUrl = mergedDirect.find((p) => p.platform_key === "apple" || p.platform_key === "deezer" || p.platform_key === "spotify")?.url || "";
    if (base.artist && base.title && (!coverUrl || !hasApple || !hasDeezer || !hasYoutube)) {
      const enriched = await enrichByArtistTitle(base.artist, base.title, { upc: cleanUpc, seedUrl });
      mergedDirect.push(...enriched.platforms);
      if (!coverUrl && enriched.cover) coverUrl = enriched.cover;
      if (!relDate && enriched.release_date) relDate = enriched.release_date;
    }

    const normalizedDate = normalizeReleaseDate(relDate) || undefined;
    const isOutNow = normalizedDate ? new Date(normalizedDate) <= new Date() : !base.is_unreleased;

    return {
      ...base,
      title: base.title || itunesResult?.title || deezerResult?.title || "",
      artist: base.artist || itunesResult?.artist || deezerResult?.artist || "",
      cover_url: coverUrl,
      release_date: normalizedDate,
      is_unreleased: !isOutNow,
      platforms: buildFullPlatformList(
        base.artist || itunesResult?.artist || "",
        base.title || itunesResult?.title || "",
        mergedDirect,
        isOutNow
      ),
    };
  }

  // Not found in any public or internal database yet -> Unreleased Pre-save mode
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
    platforms: buildFullPlatformList("", "", [], false),
  };
}

/** Search Releases by Text Query (Artist / Title) across catalogs with Full Platform Enrichment */
export async function searchReleasesByQuery(query: string): Promise<ReleaseLookupResult[]> {
  const q = query.trim();
  if (!q) return [];

  const results: ReleaseLookupResult[] = [];

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=6`;
    const res = await fetchWithTimeout(itunesUrl, { headers: { "User-Agent": "CXRNER-LINK/1.0" } }, 4000);
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const items = data.results.slice(0, 6);
        const enrichedTop = await Promise.all(
          items.slice(0, 3).map((item: any) => {
            const artist = item.artistName || "";
            const title = cleanReleaseTitleForSearch(item.collectionName || "");
            return artist && title
              ? enrichByArtistTitle(artist, title, { seedUrl: item.collectionViewUrl || "" }).catch(() => ({ platforms: [] }))
              : Promise.resolve({ platforms: [] });
          })
        );

        items.forEach((item: any, idx: number) => {
          const cover = (item.artworkUrl100 || "").replace("100x100bb", "1000x1000bb");
          const artist = item.artistName || "";
          const title = cleanReleaseTitleForSearch(item.collectionName || "");
          const relDate = normalizeReleaseDate(item.releaseDate) || undefined;
          const isPast = relDate ? new Date(relDate) <= new Date() : true;

          const direct: PlatformLinkCandidate[] = item.collectionViewUrl
            ? [{ platform_key: "apple", platform_name: "Apple Music", url: item.collectionViewUrl, button_text: isPast ? "Слушать" : "Pre-save", is_direct: true }]
            : [];
          if (enrichedTop[idx]?.platforms?.length) {
            direct.push(...enrichedTop[idx].platforms);
          }

          results.push({
            source: "itunes",
            title,
            artist,
            cover_url: cover,
            upc: item.upc || "",
            release_date: relDate,
            genre: item.primaryGenreName || "Electronic",
            release_type: (item.trackCount || 1) > 6 ? "album" : (item.trackCount || 1) > 1 ? "ep" : "single",
            label_name: item.copyright ? item.copyright.replace(/^©\s*\d+\s*/, "").replace(/^℗\s*\d+\s*/, "") : "CXRNER MUSIC",
            is_unreleased: !isPast,
            platforms: buildFullPlatformList(artist, title, direct, isPast),
          });
        });
      }
    }
  } catch {}

  return results;
}
