import { getFeaturedRelease, setFeaturedRelease } from "../../../lib/featured";

export async function GET() {
  try {
    const featured = await getFeaturedRelease();
    return Response.json(featured);
  } catch (error) {
    return Response.json({ ok: false, error: "Не удалось загрузить данные" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; artist?: string; cover?: string };
    const next = await setFeaturedRelease({
      title: body.title ?? "",
      artist: body.artist ?? "",
      cover: body.cover ?? "",
    });
    return Response.json({ ok: true, data: next });
  } catch (error) {
    return Response.json({ ok: false, error: "Не удалось сохранить данные" }, { status: 500 });
  }
}
