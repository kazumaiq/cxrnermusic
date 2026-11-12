import { NextResponse } from "next/server";
import { lookupReleaseByUpc, searchReleasesByQuery, validateUpcChecksum } from "@/lib/linkLookup";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const upc = searchParams.get("upc")?.trim();
    const query = searchParams.get("query")?.trim();

    if (upc) {
      const check = validateUpcChecksum(upc);
      if (!check.isValid) {
        return NextResponse.json(
          { success: false, error: check.error || "Неверный формат UPC/EAN" },
          { status: 400 }
        );
      }

      const cleanUpc = upc.trim().replace(/\D/g, "");
      const release = await lookupReleaseByUpc(cleanUpc);
      const isFoundInDb = Boolean(release && release.title && release.title.trim());

      if (!isFoundInDb) {
        return NextResponse.json({
          success: true,
          found: false,
          is_unreleased: true,
          upc: cleanUpc,
          release: release || null,
          message:
            "⚡ Релиз с этим UPC ещё не опубликован на открытых витринах (Apple Music, Spotify). Активируйте Pre-save кампанию, чтобы собирать слушателей до официальной премьеры!",
        });
      }

      return NextResponse.json({
        success: true,
        found: true,
        is_unreleased: Boolean(release.is_unreleased),
        release,
      });
    }

    if (query) {
      const results = await searchReleasesByQuery(query);
      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json(
      { success: false, error: "Укажите параметр ?upc= или ?query=" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Ошибка сервера при поиске релиза" },
      { status: 500 }
    );
  }
}
