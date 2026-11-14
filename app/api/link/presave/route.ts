import { NextResponse } from "next/server";
import { subscribePresaveAlert } from "@/lib/smartLinksDb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { smart_link_id, email, telegram_chat_id, preferred_platform = "yandex" } = body;

    if (!smart_link_id || (!email && !telegram_chat_id)) {
      return NextResponse.json(
        { success: false, error: "Укажите Email или Telegram для уведомления" },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Некорректный адрес Email" },
        { status: 400 }
      );
    }

    const res = await subscribePresaveAlert({
      smartLinkId: smart_link_id,
      email,
      telegramChatId: telegram_chat_id,
      preferredPlatform: preferred_platform,
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error || "Ошибка оформления Pre-save" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: res.message || "Pre-save успешно оформлен! Мы уведомим вас в день релиза.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
