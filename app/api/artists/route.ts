import { getArtists, setArtists, type ArtistItem } from "../../../lib/artists";
import { requireAdmin } from "../../../lib/admin";
import { revalidatePath } from "next/cache";

export async function GET() {
  try { return Response.json({ ok: true, items: await getArtists() }); }
  catch { return Response.json({ ok: false, error: "Не удалось загрузить артистов" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as { items?: ArtistItem[] };
    const saved = await setArtists(Array.isArray(body.items) ? body.items : []);
    revalidatePath("/", "page");
    revalidatePath("/artists/[slug]", "page");
    revalidatePath("/sitemap.xml");
    return Response.json({ ok: true, items: saved });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "ADMIN_UNAUTHORIZED";
    return Response.json({ ok: false, error: unauthorized ? "Доступ разрешён только администратору" : "Не удалось сохранить артистов" }, { status: unauthorized ? 403 : 500 });
  }
}
