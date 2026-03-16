import { NextResponse } from "next/server";

type BotRequestPayload = {
  form_id: string;
  artist_name: string;
  track_name: string;
  genre: string;
  release_type: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BotRequestPayload;

    const botUrl = process.env.BOT_BACKEND_URL;
    if (!botUrl) {
      return NextResponse.json({ ok: false, error: "BOT_BACKEND_URL не настроен" }, { status: 500 });
    }

    const res = await fetch(`${botUrl}/api/new-release`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Ошибка бэкенда бота (${res.status}): ${text || res.statusText}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Ошибка отправки в Telegram-бот" }, { status: 500 });
  }
}

