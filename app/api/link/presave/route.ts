import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

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
      return NextResponse.json({ success: false, error: "Некорректный адрес Email" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Check if already subscribed
    let query = supabase.from("presave_subscribers").select("id").eq("smart_link_id", smart_link_id);
    if (email) query = query.eq("email", email.trim().toLowerCase());
    else if (telegram_chat_id) query = query.eq("telegram_chat_id", telegram_chat_id.trim());

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, message: "Вы уже подписаны на уведомление о релизе!" });
    }

    // Insert subscriber
    const { error: insertErr } = await supabase.from("presave_subscribers").insert({
      smart_link_id,
      email: email ? email.trim().toLowerCase() : null,
      telegram_chat_id: telegram_chat_id ? telegram_chat_id.trim() : null,
      preferred_platform,
      status: "pending",
    });

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    // Increment presaves_count on smart link
    const { data: cur } = await supabase.from("smart_links").select("presaves_count").eq("id", smart_link_id).single();
    if (cur) {
      await supabase.from("smart_links").update({ presaves_count: (cur.presaves_count || 0) + 1 }).eq("id", smart_link_id);
    }

    return NextResponse.json({
      success: true,
      message: "Pre-save успешно оформлен! Мы уведомим вас в день релиза.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
