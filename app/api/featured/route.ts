import { getFeaturedRelease, setFeaturedRelease } from "../../../lib/featured";

export async function GET() {
  const featured = await getFeaturedRelease();
  return Response.json(featured);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; artist?: string; cover?: string };
  const next = await setFeaturedRelease({
    title: body.title ?? "",
    artist: body.artist ?? "",
    cover: body.cover ?? "",
  });
  return Response.json({ ok: true, data: next });
}
