import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";

  if (!artist && !title) {
    return NextResponse.json({ cover: null });
  }

  // 1. Try iTunes Search API
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      artist + " " + title
    )}&media=music&limit=1`;
    const res = await fetch(itunesUrl, { next: { revalidate: 86400 } });
    const data = await res.json();
    if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
      const cover = data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
      return NextResponse.json({ cover });
    }
  } catch {}

  // 2. Try Deezer Search API
  try {
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(
      artist + " " + title
    )}&limit=1`;
    const res = await fetch(deezerUrl, { next: { revalidate: 86400 } });
    const data = await res.json();
    if (data.data && data.data.length > 0 && data.data[0].album) {
      const cover = data.data[0].album.cover_xl || data.data[0].album.cover_big;
      if (cover) return NextResponse.json({ cover });
    }
  } catch {}

  return NextResponse.json({ cover: null });
}
