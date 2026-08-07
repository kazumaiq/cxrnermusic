import { getFeaturedRelease, setFeaturedRelease } from "../../../lib/featured";
import { requireAdmin } from "../../../lib/admin";

export async function GET() {
  try { return Response.json(await getFeaturedRelease()); }
  catch { return Response.json({ ok: false, error: "Не удалось загрузить данные" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as { title?: string; artist?: string; cover?: string };
    const data = await setFeaturedRelease({ title: body.title ?? "", artist: body.artist ?? "", cover: body.cover ?? "" });
    return Response.json({ ok: true, data });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "ADMIN_UNAUTHORIZED";
    return Response.json({ ok: false, error: unauthorized ? "Доступ разрешён только администратору" : "Не удалось сохранить данные" }, { status: unauthorized ? 403 : 500 });
  }
}
