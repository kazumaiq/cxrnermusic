import { NextResponse } from "next/server";
import { lookupReleaseByUpc, searchReleasesByQuery, validateUpcChecksum } from "@/lib/linkLookup";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const upc = searchParams.get("upc")?.trim();
    const query = searchParams.get("query")?.trim();

    if (upc) {
      // Validate checksum if provided
      const check = validateUpcChecksum(upc);
      if (!check.isValid) {
        return NextResponse.json(
          { success: false, error: check.error || "Неверный формат UPC/EAN" },
          { status: 400 }
        );
      }

      const release = await lookupReleaseByUpc(upc);
      if (!release) {
        return NextResponse.json(
          {
            success: false,
            error: "Релиз с данным UPC не найден в открытых базах. Вы можете ввести данные вручную.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, release });
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
