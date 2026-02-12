import { getReleases, setReleases } from "../../../lib/releases";

export async function GET() {
  try {
    const items = await getReleases();
    return Response.json({ ok: true, items });
  } catch {
    return Response.json({ ok: false, error: "Не удалось загрузить релизы" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: unknown };
    const items = Array.isArray(body.items) ? body.items : [];
    const next = await setReleases(items as any);
    return Response.json({ ok: true, items: next });
  } catch {
    return Response.json({ ok: false, error: "Не удалось сохранить релизы" }, { status: 500 });
  }
}
