import { getReleases, setReleases } from "../../../lib/releases";
import { requireAdmin } from "../../../lib/admin";

export async function GET() {
  try { return Response.json({ ok: true, items: await getReleases() }); }
  catch { return Response.json({ ok: false, error: "Не удалось загрузить релизы" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as { items?: unknown };
    const items = Array.isArray(body.items) ? body.items : [];
    return Response.json({ ok: true, items: await setReleases(items as never[]) });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "ADMIN_UNAUTHORIZED";
    return Response.json({ ok: false, error: unauthorized ? "Доступ разрешён только администратору" : "Не удалось сохранить релизы" }, { status: unauthorized ? 403 : 500 });
  }
}
