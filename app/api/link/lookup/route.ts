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

      const release = await lookupReleaseByUpc(upc);

      if (release.is_unreleased) {
        return NextResponse.json({
          success: true,
          is_unreleased: true,
          release,
          message:
            "⚡ Релиз не найден на открытых витринах — режим Pre-save активирован! Заполните метаданные и дату релиза.",
        });
      }

      return NextResponse.json({ success: true, is_unreleased: false, release });
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
